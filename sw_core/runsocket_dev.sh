#!/bin/bash

# Function to ensure Redis is stopped on script exit
function cleanup {
    echo "Stopping Redis service..."
    brew services stop redis
}

# Set trap to call cleanup function on script exit
trap cleanup EXIT

# Start Redis service
echo "Starting Redis service..."
brew services start redis

# Run WebSocket server with Django settings environment variable
export DJANGO_SETTINGS_MODULE=shop_wiz.settings
echo "Running WebSocket server..."
python websocket.py

# Note: The cleanup function will be triggered by the trap on EXIT