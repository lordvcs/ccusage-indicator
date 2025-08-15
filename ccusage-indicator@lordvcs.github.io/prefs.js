import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';
import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class CCUsageIndicatorPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        // Create a preferences page
        const page = new Adw.PreferencesPage({
            title: _('General'),
            icon_name: 'dialog-information-symbolic',
        });
        window.add(page);

        // Create a preferences group for refresh settings
        const refreshGroup = new Adw.PreferencesGroup({
            title: _('Refresh Settings'),
            description: _('Configure how often the indicator updates'),
        });
        page.add(refreshGroup);

        // Refresh interval setting
        const refreshRow = new Adw.SpinRow({
            title: _('Refresh Interval (minutes)'),
            subtitle: _('How often to check for usage updates'),
            adjustment: new Gtk.Adjustment({
                lower: 1,
                upper: 60,
                step_increment: 1,
                page_increment: 5,
                value: 5,
            }),
        });

        // Bind the setting
        this.getSettings().bind(
            'refresh-interval',
            refreshRow,
            'value',
            Gio.SettingsBindFlags.DEFAULT
        );

        refreshGroup.add(refreshRow);

        // Create a preferences group for display settings
        const displayGroup = new Adw.PreferencesGroup({
            title: _('Display Settings'),
            description: _('Configure how the indicator appears'),
        });
        page.add(displayGroup);

        // Show seconds in time display
        const showSecondsRow = new Adw.SwitchRow({
            title: _('Show detailed time'),
            subtitle: _('Display hours and minutes instead of just minutes when under 1 hour'),
        });

        this.getSettings().bind(
            'show-detailed-time',
            showSecondsRow,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        );

        displayGroup.add(showSecondsRow);

        // Create a preferences group for command settings
        const commandGroup = new Adw.PreferencesGroup({
            title: _('Command Settings'),
            description: _('Configure the ccusage command execution'),
        });
        page.add(commandGroup);

        // Custom command path
        const commandRow = new Adw.EntryRow({
            title: _('Command Path'),
            text: 'npx ccusage',
            show_apply_button: true,
        });

        this.getSettings().bind(
            'ccusage-command',
            commandRow,
            'text',
            Gio.SettingsBindFlags.DEFAULT
        );

        commandGroup.add(commandRow);

        // Timeout setting
        const timeoutRow = new Adw.SpinRow({
            title: _('Command Timeout (seconds)'),
            subtitle: _('How long to wait for the command to complete'),
            adjustment: new Gtk.Adjustment({
                lower: 5,
                upper: 120,
                step_increment: 5,
                page_increment: 10,
                value: 30,
            }),
        });

        this.getSettings().bind(
            'command-timeout',
            timeoutRow,
            'value',
            Gio.SettingsBindFlags.DEFAULT
        );

        commandGroup.add(timeoutRow);

        // Create a preferences group for about
        const aboutGroup = new Adw.PreferencesGroup({
            title: _('About'),
        });
        page.add(aboutGroup);

        const aboutRow = new Adw.ActionRow({
            title: _('Claude Code Usage Indicator'),
            subtitle: _('Shows remaining time for Claude Code usage blocks'),
        });

        const linkButton = new Gtk.LinkButton({
            label: _('Project Homepage'),
            uri: 'https://github.com/lordvcs/ccusage-gnome-extension',
            valign: Gtk.Align.CENTER,
        });

        aboutRow.add_suffix(linkButton);
        aboutGroup.add(aboutRow);
    }
}