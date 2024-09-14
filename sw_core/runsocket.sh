#!/bin/bash

# Run WebSocket server with Django settings environment variable
export DJANGO_SETTINGS_MODULE=shop_wiz.settings
echo "Running WebSocket server..."
python websocket.py
