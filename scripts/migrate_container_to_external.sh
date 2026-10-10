#!/bin/bash
set -e

SOURCE_DIR="$HOME/Library/Application Support/com.apple.container"
TARGET_DIR="/Volumes/samsung2tb980pro/DeveloperData/apple-container"

echo "=========================================================="
echo " Apple Container Storage Migration to Samsung 980 Pro SSD "
echo "=========================================================="

if [ ! -d "/Volumes/samsung2tb980pro" ]; then
    echo "❌ Error: /Volumes/samsung2tb980pro is not mounted!"
    exit 1
fi

echo "1. Checking current container services..."
/opt/homebrew/bin/container system status || true

echo ""
echo "2. Stopping container system service safely..."
/opt/homebrew/bin/container system stop || true
sleep 2

echo ""
echo "3. Creating target directory on external Samsung SSD..."
mkdir -p "$TARGET_DIR"

echo ""
echo "4. Syncing 19GB of container images, volumes & microVMs to external SSD..."
rsync -aP "$SOURCE_DIR/" "$TARGET_DIR/"

echo ""
echo "5. Switching directory to symlink..."
# Backup original directory name first
if [ ! -L "$SOURCE_DIR" ]; then
    mv "$SOURCE_DIR" "${SOURCE_DIR}.bak-$(date +%Y%m%d%H%M%S)"
    ln -s "$TARGET_DIR" "$SOURCE_DIR"
    echo "✅ Symlink created: $SOURCE_DIR -> $TARGET_DIR"
else
    echo "ℹ️ $SOURCE_DIR is already a symlink."
fi

echo ""
echo "6. Starting container system service on external SSD..."
/opt/homebrew/bin/container system start
sleep 3

echo ""
echo "7. Verifying running containers..."
/opt/homebrew/bin/container system status
/opt/homebrew/bin/container list -a

echo ""
echo "=========================================================="
echo "🎉 Migration Complete!"
echo "Your container storage now has ~626GB of high-speed NVMe space!"
echo "To reclaim 19GB on your internal Mac disk, you can safely remove the backup:"
echo "  rm -rf \"${SOURCE_DIR}.bak*\""
echo "=========================================================="
