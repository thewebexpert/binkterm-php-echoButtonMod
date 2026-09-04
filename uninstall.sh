#!/usr/bin/env bash
# ==============================================================================
# Binkterm Echo Area Button Mod - Uninstaller
# https://github.com/thewebexpert/binkterm-php-echoButtonMod
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="${1:-$(cd "$SCRIPT_DIR/.." && pwd)}"

if [ -d "$SCRIPT_DIR/public_html" ] && [ -d "$TARGET_DIR/binkterm" ]; then
    TARGET_DIR="$TARGET_DIR/binkterm"
fi

echo "======================================================"
echo " Uninstalling Binkterm Echo Area Button Mod"
echo " Target Binkterm Directory: $TARGET_DIR"
echo "======================================================"

# Remove assets
if [ -f "$TARGET_DIR/public_html/js/echo-filter.js" ]; then
    rm -f "$TARGET_DIR/public_html/js/echo-filter.js"
    echo "[✓] Removed public_html/js/echo-filter.js"
fi

if [ -f "$TARGET_DIR/public_html/css/echo-filter.css" ]; then
    rm -f "$TARGET_DIR/public_html/css/echo-filter.css"
    echo "[✓] Removed public_html/css/echo-filter.css"
fi

HEADER_INSERT="$TARGET_DIR/templates/custom/header.insert.twig"
if [ -f "$HEADER_INSERT" ]; then
    CLEANED=$(grep -v "echo-filter" "$HEADER_INSERT" | grep -v "Echo Area Button Mod" | sed '/^[[:space:]]*$/d')
    if [ -z "$CLEANED" ]; then
        rm -f "$HEADER_INSERT"
        echo "[✓] Removed templates/custom/header.insert.twig"
    else
        grep -v "echo-filter" "$HEADER_INSERT" | grep -v "Echo Area Button Mod" > "${HEADER_INSERT}.tmp"
        mv "${HEADER_INSERT}.tmp" "$HEADER_INSERT"
        echo "[✓] Removed echo-filter references from templates/custom/header.insert.twig"
    fi
fi

echo ""
echo "Uninstallation complete!"
echo "======================================================"
