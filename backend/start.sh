#!/bin/bash
# Render deployment start script for NBA Performance Predictor backend
#
# ⚠️  This script is for Render (Linux) deployment only!
# ⚠️  For local development on Windows, use PowerShell commands instead.
#
# Windows local dev:
#   python -m venv venv
#   .\venv\Scripts\Activate.ps1
#   pip install -r requirements.txt
#   python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
#
# Mac/Linux local dev:
#   python3 -m venv venv
#   source venv/bin/activate
#   pip install -r requirements.txt
#   python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000

# Use PORT environment variable provided by Render
PORT=${PORT:-8000}

echo "Starting NBA Performance Predictor API on port $PORT..."

# Start uvicorn with the PORT from environment
exec uvicorn main:app --host 0.0.0.0 --port $PORT
