import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import St from 'gi://St';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Clutter from 'gi://Clutter';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

export default class CCUsageIndicatorExtension extends Extension {
    constructor(metadata) {
        super(metadata);
        this._indicator = null;
        this._timeout = null;
        this._refreshing = false;
        this._settings = null;
        this._refreshItem = null;
    }

    enable() {
        console.log(`Enabling ${this.metadata.name}`);
        
        // Initialize settings
        this._settings = this.getSettings();
        
        // Create the panel indicator
        this._indicator = new PanelMenu.Button(0.0, this.metadata.name, false);
        
        // Create the label
        this._label = new St.Label({
            text: 'Loading...',
            style_class: 'system-status-icon',
            y_align: Clutter.ActorAlign.CENTER
        });
        
        this._indicator.add_child(this._label);
        
        // Create menu items
        this._createMenu();
        
        // Add to status area
        Main.panel.addToStatusArea(this.uuid, this._indicator);
        
        // Initial update
        this._updateUsageInfo();
        
        // Set up refresh timer using settings
        this._setupTimer();
    }

    disable() {
        console.log(`Disabling ${this.metadata.name}`);
        
        // Remove timeout
        if (this._timeout) {
            GLib.source_remove(this._timeout);
            this._timeout = null;
        }
        
        // Destroy indicator
        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }
        
        this._label = null;
        this._settings = null;
        this._refreshItem = null;
    }

    _setupTimer() {
        // Remove existing timer
        if (this._timeout) {
            GLib.source_remove(this._timeout);
            this._timeout = null;
        }
        
        // Get refresh interval from settings (in minutes)
        const refreshInterval = this._settings.get_int('refresh-interval');
        const refreshSeconds = refreshInterval * 60;
        
        // Set up new timer
        this._timeout = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, refreshSeconds, () => {
            this._updateUsageInfo();
            return GLib.SOURCE_CONTINUE;
        });
    }

    _createMenu() {
        // Refresh menu item
        this._refreshItem = new PopupMenu.PopupMenuItem('Refresh Now');
        this._refreshItem.connect('activate', () => {
            this._updateUsageInfo();
        });
        this._indicator.menu.addMenuItem(this._refreshItem);
        
        // Separator
        this._indicator.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        
        // Status info item (non-clickable)
        this._statusItem = new PopupMenu.PopupMenuItem('Checking usage...', {
            reactive: false,
            style_class: 'popup-inactive'
        });
        this._indicator.menu.addMenuItem(this._statusItem);
    }

    _updateUsageInfo() {
        if (this._refreshing) {
            return;
        }
        
        this._refreshing = true;
        this._label.set_text('Refreshing...');
        
        try {
            // Get command from settings
            const commandStr = this._settings.get_string('ccusage-command');
            const commandArgs = commandStr.split(' ').concat(['blocks', '--json']);
            
            // Execute ccusage command
            const proc = Gio.Subprocess.new(
                commandArgs,
                Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
            );
            
            proc.communicate_utf8_async(null, null, (proc, result) => {
                this._refreshing = false;
                
                try {
                    const [, stdout, stderr] = proc.communicate_utf8_finish(result);
                    
                    if (proc.get_successful()) {
                        this._processUsageData(stdout);
                    } else {
                        console.error(`ccusage command failed: ${stderr}`);
                        this._setError('Command failed');
                    }
                } catch (error) {
                    console.error(`Error executing ccusage: ${error}`);
                    this._setError('Execution error');
                }
            });
        } catch (error) {
            this._refreshing = false;
            console.error(`Error starting ccusage: ${error}`);
            this._setError('Start error');
        }
    }

    _processUsageData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            if (!data || !data.blocks) {
                this._setError('Invalid data');
                return;
            }
            
            // Find active block
            const activeBlock = data.blocks.find(block => block.isActive === true);
            
            if (!activeBlock) {
                this._setStatus('No session', 'No active Claude Code session');
                return;
            }
            
            // Calculate remaining time
            const remainingMinutes = this._calculateRemainingTime(activeBlock);
            
            if (remainingMinutes === null) {
                this._setStatus('Unknown', 'Unable to calculate remaining time');
                return;
            }
            
            if (remainingMinutes <= 0) {
                this._setStatus('Ended', 'Current session has ended');
                return;
            }
            
            // Calculate percentage consumed
            const percentageConsumed = this._calculatePercentageConsumed(activeBlock);
            
            // Format and display time with percentage
            const timeText = this._formatTime(remainingMinutes);
            const displayText = percentageConsumed !== null ? 
                `${timeText} (${percentageConsumed}%)` : timeText;
            const statusText = `${timeText} remaining in current session`;
            
            this._setStatus(displayText, statusText);
            
        } catch (error) {
            console.error(`Error processing usage data: ${error}`);
            this._setError('Parse error');
        }
    }

    _calculateRemainingTime(activeBlock) {
        // First try projection data
        if (activeBlock.projection && typeof activeBlock.projection.remainingMinutes === 'number') {
            return activeBlock.projection.remainingMinutes;
        }
        
        // Fallback: calculate from endTime
        if (activeBlock.endTime) {
            try {
                const endTime = new Date(activeBlock.endTime);
                const now = new Date();
                const diffMs = endTime.getTime() - now.getTime();
                const remainingMinutes = Math.round(diffMs / (1000 * 60));
                
                return Math.max(0, remainingMinutes);
            } catch (error) {
                console.error(`Error calculating time from endTime: ${error}`);
            }
        }
        
        return null;
    }

    _calculatePercentageConsumed(activeBlock) {
        // Check if we have projection data to calculate percentage
        if (!activeBlock.projection || 
            typeof activeBlock.projection.totalTokens !== 'number' ||
            typeof activeBlock.totalTokens !== 'number') {
            return null;
        }
        
        const currentTokens = activeBlock.totalTokens;
        const projectedTotalTokens = activeBlock.projection.totalTokens;
        
        if (projectedTotalTokens <= 0) {
            return null;
        }
        
        const percentage = Math.round((currentTokens / projectedTotalTokens) * 100);
        return Math.min(100, Math.max(0, percentage));
    }

    _formatTime(minutes) {
        if (minutes <= 0) {
            return 'Ended';
        }
        
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        const showDetailed = this._settings.get_boolean('show-detailed-time');
        
        if (hours > 0) {
            return `${hours}h ${mins}m`;
        } else if (showDetailed && hours === 0) {
            return `${mins}m`;
        } else {
            return `${mins}m`;
        }
    }

    _setStatus(labelText, statusText) {
        this._label.set_text(labelText);
        if (this._statusItem) {
            this._statusItem.label.set_text(statusText);
        }
    }

    _setError(errorType) {
        this._label.set_text('Error');
        if (this._statusItem) {
            this._statusItem.label.set_text(`${errorType} - Check if ccusage is installed and working`);
        }
    }
}