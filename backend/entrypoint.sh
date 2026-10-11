#!/bin/bash
set -e

# Fix permissions for mounted volumes
chown -R appuser:appuser /app/logs /app/uploads 2>/dev/null || true

# Run as appuser
exec gosu appuser "$@"
