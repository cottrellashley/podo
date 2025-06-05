#!/bin/bash

# Script to copy only essential files to your Linux server
# Usage: ./copy-to-server.sh user@your-server-ip

if [ $# -eq 0 ]; then
    echo "Usage: $0 user@server-ip"
    echo "Example: $0 root@192.168.1.100"
    exit 1
fi

SERVER=$1
REMOTE_DIR="/opt/podo"

echo "🚀 Copying Podo source code to $SERVER:$REMOTE_DIR"

# Create a temporary directory with only essential files
TEMP_DIR=$(mktemp -d)
echo "📦 Preparing files in $TEMP_DIR..."

# Copy essential frontend files
cp package.json $TEMP_DIR/
cp package-lock.json $TEMP_DIR/ 2>/dev/null || true
cp -r src $TEMP_DIR/
cp -r public $TEMP_DIR/
cp index.html $TEMP_DIR/
cp vite.config.ts $TEMP_DIR/
cp tsconfig.json $TEMP_DIR/
cp tsconfig.app.json $TEMP_DIR/ 2>/dev/null || true
cp tsconfig.node.json $TEMP_DIR/ 2>/dev/null || true
cp tailwind.config.js $TEMP_DIR/
cp postcss.config.js $TEMP_DIR/
cp eslint.config.js $TEMP_DIR/ 2>/dev/null || true

# Copy server files
if [ -d "server" ]; then
    cp -r server $TEMP_DIR/
    echo "✅ Server files copied"
else
    echo "⚠️  No server directory found - you may need to copy backend files separately"
fi

# Copy database initialization
cp init.sql $TEMP_DIR/ 2>/dev/null || echo "⚠️  No init.sql found - using default from deployment script"

echo "📤 Uploading files to server..."

# Copy files to server
scp -r $TEMP_DIR/* $SERVER:$REMOTE_DIR/

echo "🧹 Cleaning up temporary files..."
rm -rf $TEMP_DIR

echo "✅ Files copied successfully!"
echo ""
echo "Next steps on your server:"
echo "1. SSH to your server: ssh $SERVER"
echo "2. Go to app directory: cd $REMOTE_DIR"
echo "3. Start the application: ./start.sh"
echo ""
echo "🌐 Your app will be available at: http://$(echo $SERVER | cut -d'@' -f2)" 