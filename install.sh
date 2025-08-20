#!/bin/bash

# Installation script for Claude Code Usage GNOME Shell Extension

set -e

EXTENSION_UUID="ccusage-indicator@lordvcs.github.io"
EXTENSION_DIR="$HOME/.local/share/gnome-shell/extensions/$EXTENSION_UUID"

echo "Installing Claude Code Usage GNOME Shell Extension..."

# Check if GNOME Shell is available
if ! command -v gnome-shell &> /dev/null; then
    echo "Error: GNOME Shell not found. This extension requires GNOME."
    exit 1
fi

# Check Node.js and npm
if ! command -v npx &> /dev/null; then
    echo "Error: npx command not found. Please install Node.js and npm."
    echo "Install with: sudo apt install nodejs npm"
    exit 1
fi

# Check ccusage
if ! npx ccusage --version &> /dev/null; then
    echo "ccusage not found. Installing..."
    if npm install -g ccusage; then
        echo "ccusage installed successfully!"
    else
        echo "Error: Failed to install ccusage."
        echo "Please install manually with: npm install -g ccusage"
        exit 1
    fi
else
    echo "ccusage is already installed."
fi

# Create extension directory
mkdir -p "$EXTENSION_DIR"

# Copy extension files
echo "Copying extension files..."
cp -r "$EXTENSION_UUID"/* "$EXTENSION_DIR/"

# Compile schemas if glib-compile-schemas is available
if command -v glib-compile-schemas &> /dev/null; then
    echo "Compiling GSettings schemas..."
    glib-compile-schemas "$EXTENSION_DIR/schemas/"
else
    echo "Warning: glib-compile-schemas not found. Settings may not work properly."
fi

# Check GNOME Shell version compatibility
GNOME_VERSION=$(gnome-shell --version | grep -oP '\d+' | head -1)
if [ "$GNOME_VERSION" -lt 45 ]; then
    echo "Warning: This extension is designed for GNOME Shell 45+. Current version: $GNOME_VERSION"
    echo "The extension may not work properly."
fi

echo "Extension installed successfully!"
echo ""
echo "To enable the extension:"
echo "  gnome-extensions enable $EXTENSION_UUID"
echo ""
echo "To reload GNOME Shell:"
echo "  Press Alt+F2, type 'r', and press Enter"
echo "  Or log out and back in"
echo ""
echo "To configure settings:"
echo "  gnome-extensions prefs $EXTENSION_UUID"