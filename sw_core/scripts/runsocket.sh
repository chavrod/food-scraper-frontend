#!/bin/bash

# Run WebSocket server with Django settings environment variable
export DJANGO_SETTINGS_MODULE=config.settings
echo "Running WebSocket server..."
python ../shopwiz_project/config/websocket.py
