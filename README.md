# Claude Code Usage GNOME Shell Extension

A GNOME Shell extension that displays remaining time for your Claude Code usage blocks directly in the top panel, automatically refreshing every 5 minutes (configurable).

## Features

- 🕒 Shows remaining time in active Claude Code usage blocks
- 🔄 Configurable auto-refresh interval (1-60 minutes)
- ⚙️ Settings panel for customization
- 🖱️ Right-click menu for manual refresh and status info
- ⚡ Lightweight native GNOME integration
- 🌍 Ready for extensions.gnome.org distribution

## Screenshots

The extension appears in your top panel showing remaining time like "2h 35m" or "45m".

## Requirements

- GNOME Shell 45+ (Ubuntu 23.04+, Fedora 39+, etc.)
- Node.js and npm
- `ccusage` npm package

## Installation

### Method 1: From extensions.gnome.org (Recommended)
*Coming soon - extension will be published to extensions.gnome.org*

### Method 2: Manual Installation

#### Option A: Using the Install Script (Recommended)

1. **Download this repository**:
   ```bash
   git clone https://github.com/lordvcs/ccusage-indicator.git
   cd ccusage-indicator
   ```

2. **Run the install script**:
   ```bash
   chmod +x install.sh
   ./install.sh
   ```
   
   The script will:
   - Check all dependencies (Node.js, npm, ccusage)
   - Install ccusage if missing
   - Copy extension files to the correct location
   - Compile GSettings schemas
   - Provide instructions to enable the extension

3. **Enable the extension**:
   ```bash
   gnome-extensions enable ccusage-indicator@lordvcs.github.io
   ```

4. **Restart GNOME Shell**:
   - Press `Alt+F2`, type `r`, press Enter
   - Or log out and back in

#### Option B: Manual File Copy

1. **Install ccusage**:
   ```bash
   npm install -g ccusage
   ```

2. **Install the extension manually**:
   ```bash
   # Clone or download this repository
   cp -r ccusage-indicator@lordvcs.github.io ~/.local/share/gnome-shell/extensions/
   
   # Compile schemas
   glib-compile-schemas ~/.local/share/gnome-shell/extensions/ccusage-indicator@lordvcs.github.io/schemas/
   
   # Restart GNOME Shell (Alt+F2, type 'r', press Enter)
   # Or log out and back in
   
   # Enable the extension
   gnome-extensions enable ccusage-indicator@lordvcs.github.io
   ```

## Usage

### Panel Display

The extension shows different states:
- **"2h 35m (30%)"** - Hours and minutes remaining with usage percentage
- **"45m (75%)"** - Minutes remaining with percentage (when less than 1 hour)
- **"2h 35m"** - Time only (when percentage data unavailable)
- **"No session"** - No active Claude Code usage block
- **"Ended"** - Current block has expired
- **"Error"** - Failed to fetch usage data
- **"Refreshing..."** - Currently updating

### Right-Click Menu

- **Refresh Now** - Manually update the display
- **Status Information** - Shows detailed status

### Settings

Access settings via:
- GNOME Extensions app → Claude Code Usage Indicator → Settings
- Command line: `gnome-extensions prefs ccusage-indicator@lordvcs.github.io`

**Available Settings:**
- **Refresh Interval**: 1-60 minutes (default: 5 minutes)
- **Show Detailed Time**: Display format preferences
- **Command Path**: Custom ccusage command (default: `npx ccusage`)
- **Command Timeout**: How long to wait for command completion (5-120 seconds)

## How It Works

The extension:
1. Executes `npx ccusage blocks --json` at configured intervals
2. Parses JSON output to find the active usage block (`"isActive": true`)
3. Calculates remaining time from `projection.remainingMinutes` or `endTime`
4. Updates the panel display with formatted time

## Data Source

Uses the [ccusage](https://github.com/ryoppippi/ccusage) package to fetch Claude Code usage information. The extension looks for:
- Active blocks with `"isActive": true`
- Remaining time from `projection.remainingMinutes` (preferred)
- Fallback calculation from `endTime` minus current time

## Troubleshooting

### Extension Not Showing
```bash
# Check if extension is enabled
gnome-extensions list --enabled | grep ccusage-indicator

# Check for errors
journalctl -f -o cat /usr/bin/gnome-shell

# Try restarting GNOME Shell
# Press Alt+F2, type 'r', press Enter
```

### "Error" Display
```bash
# Verify ccusage is installed and working
npx ccusage --version
npx ccusage blocks

# Check if you're logged into Claude Code
# Make sure you have active usage to display
```

### Settings Not Saving
```bash
# Reset settings to defaults
gsettings reset-recursively org.gnome.shell.extensions.ccusage-indicator

# Check schema compilation
ls ~/.local/share/gnome-shell/extensions/ccusage-indicator@lordvcs.github.io/schemas/
```

## Development

### Testing Locally
```bash
# Install in development location
ln -sf $PWD/ccusage-indicator@lordvcs.github.io ~/.local/share/gnome-shell/extensions/

# Watch logs
journalctl -f -o cat /usr/bin/gnome-shell | grep -i ccusage

# Reload extension after changes
gnome-extensions disable ccusage-indicator@lordvcs.github.io
gnome-extensions enable ccusage-indicator@lordvcs.github.io
```

### Building for Distribution
```bash
# Create zip for extensions.gnome.org
cd ccusage-indicator@lordvcs.github.io
zip -r ../ccusage-indicator.zip * --exclude="*.git*"
```

## Compatibility

- **GNOME Shell**: 45, 46, 47+
- **Tested on**: Ubuntu 25.04, Fedora 40+, openSUSE Tumbleweed
- **Architecture**: All (extension is pure JavaScript)

## License

This project is open source under MIT License. See the [ccusage](https://github.com/ryoppippi/ccusage) package for its licensing terms.

P.S: this was coded using claude code
