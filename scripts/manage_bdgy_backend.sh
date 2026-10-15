#!/usr/bin/env bash
# ==============================================================================
# BDGY Tattoo Supply - Dedicated Saleor Core Backend Manager
# Runs on Port 8004 with PostgreSQL:5435 (bdgy-postgres) & Redis:6382 (bdgy-redis)
# ==============================================================================

set -eo pipefail

ACTION=${1:-status}
PORT="8004"
CORE_DIR="/Volumes/samsung2tb980pro/project/Saleor-NTMS/apps/saleor-core"
ENV_FILE="$CORE_DIR/.env.bdgy"
LOG_FILE="/Volumes/samsung2tb980pro/project/bdgy-migration-to-saleor-tanstack/.logs/bdgy-saleor-backend.log"
PID_FILE="/Volumes/samsung2tb980pro/project/bdgy-migration-to-saleor-tanstack/.logs/bdgy-saleor-backend.pid"

mkdir -p "$(dirname "$LOG_FILE")"

start_backend() {
  echo "🚀 [BDGY] Starting dedicated Saleor Core API on port $PORT..."

  if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
    echo "✅ BDGY Saleor Core is already running (PID: $(cat "$PID_FILE"))"
    return 0
  fi

  # Check if port is in use
  PIDS=$(lsof -ti :"$PORT" 2>/dev/null || true)
  if [ -n "$PIDS" ]; then
    echo "⚠️ Port $PORT already in use by PID(s): $PIDS. Killing..."
    kill -9 $PIDS 2>/dev/null || true
    sleep 1
  fi

  # Launch in background with .env.bdgy
  (
    cd "$CORE_DIR"
    export $(grep -v '^#' "$ENV_FILE" | xargs)
    nohup uv run python manage.py runserver "0.0.0.0:$PORT" > "$LOG_FILE" 2>&1 &
    echo $! > "$PID_FILE"
  )

  echo "⏳ Waiting for BDGY Saleor API on http://127.0.0.1:$PORT/graphql/..."
  for i in {1..30}; do
    if curl -s "http://127.0.0.1:$PORT/graphql/" >/dev/null 2>&1 || nc -z 127.0.0.1 "$PORT" 2>/dev/null; then
      echo "✅ BDGY Saleor Core API is healthy & responding on port $PORT! (PID: $(cat "$PID_FILE"))"
      return 0
    fi
    sleep 1
  done

  echo "⚠️ BDGY Saleor Core did not respond within 30s. Check logs: $LOG_FILE"
  tail -n 20 "$LOG_FILE"
  return 1
}

stop_backend() {
  echo "🛑 [BDGY] Stopping dedicated Saleor Core API..."
  if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    kill "$PID" 2>/dev/null || true
    rm -f "$PID_FILE"
  fi
  PIDS=$(lsof -ti :"$PORT" 2>/dev/null || true)
  if [ -n "$PIDS" ]; then
    kill -9 $PIDS 2>/dev/null || true
  fi
  echo "✅ BDGY Saleor Core stopped."
}

status_backend() {
  echo "📊 [BDGY] Saleor Core Status (Port $PORT):"
  if curl -s "http://127.0.0.1:$PORT/graphql/" >/dev/null 2>&1 || nc -z 127.0.0.1 "$PORT" 2>/dev/null; then
    echo "  🟢 Running (Port $PORT)"
  else
    echo "  🔴 Stopped"
  fi
}

case "$ACTION" in
  start)
    start_backend
    ;;
  stop)
    stop_backend
    ;;
  restart)
    stop_backend
    sleep 1
    start_backend
    ;;
  status)
    status_backend
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|status}"
    exit 1
    ;;
esac
