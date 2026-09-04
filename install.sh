#!/usr/bin/env bash
# ==============================================================================
# Binkterm Echo Area Button Mod - Installer
# https://github.com/thewebexpert/binkterm-php-echoButtonMod
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="${1:-$(cd "$SCRIPT_DIR/.." && pwd)}"

if [ -d "$SCRIPT_DIR/public_html" ] && [ -d "$TARGET_DIR/binkterm" ]; then
    TARGET_DIR="$TARGET_DIR/binkterm"
fi

echo "======================================================"
echo " Installing Binkterm Echo Area Button Mod"
echo " Target Binkterm Directory: $TARGET_DIR"
echo "======================================================"

if [ ! -d "$TARGET_DIR/public_html" ] || [ ! -d "$TARGET_DIR/templates" ]; then
    echo "Error: Target directory does not look like a valid BinktermPHP installation."
    echo "Usage: ./install.sh /path/to/binkterm"
    exit 1
fi

# 1. Copy JavaScript asset
mkdir -p "$TARGET_DIR/public_html/js"
cp "$SCRIPT_DIR/public_html/js/echo-filter.js" "$TARGET_DIR/public_html/js/echo-filter.js"
echo "[✓] Installed public_html/js/echo-filter.js"

# 2. Copy CSS asset
mkdir -p "$TARGET_DIR/public_html/css"
cp "$SCRIPT_DIR/public_html/css/echo-filter.css" "$TARGET_DIR/public_html/css/echo-filter.css"
echo "[✓] Installed public_html/css/echo-filter.css"

# 3. Configure templates/custom/header.insert.twig
mkdir -p "$TARGET_DIR/templates/custom"
HEADER_INSERT="$TARGET_DIR/templates/custom/header.insert.twig"

if [ ! -f "$HEADER_INSERT" ]; then
    cp "$SCRIPT_DIR/templates/custom/header.insert.twig" "$HEADER_INSERT"
    echo "[✓] Created templates/custom/header.insert.twig"
else
    if grep -q "echo-filter.js" "$HEADER_INSERT"; then
        echo "[✓] templates/custom/header.insert.twig already includes echo-filter.js"
    else
        echo "" >> "$HEADER_INSERT"
        echo "{# Binkterm Echo Area Button Mod #}" >> "$HEADER_INSERT"
        echo '<link rel="stylesheet" href="/css/echo-filter.css?v=1.0">' >> "$HEADER_INSERT"
        echo '<script src="/js/echo-filter.js?v=1.0" defer></script>' >> "$HEADER_INSERT"
        echo "[✓] Appended echo-filter assets to existing templates/custom/header.insert.twig"
    fi
fi

echo ""
echo "Installation complete! Echo Area toolbar is now active on /echolist."
echo "======================================================"
