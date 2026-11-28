#!/bin/sh
# The isolated server for scripted browser checks, on port 3100, away from the dev server
# (5173/8000) the user keeps open: their tab auto-rejoins every restart and would join the checks.
#
#   scripts/browser-check/server.sh start [log file]   build the client, start, wait until it answers
#   scripts/browser-check/server.sh restart [log file] empty every Room (or drop every socket)
#   scripts/browser-check/server.sh stop               stop it and delete the build
#
# Stopping goes by port, never by `pkill -f "tsx src/server/main.ts"`: that also kills the dev server.
set -e
cd "$(dirname "$0")/../.."
PORT=3100
LOG=${2:-/dev/null}

up() {
  PORT=$PORT nohup npx tsx src/server/main.ts >"$LOG" 2>&1 &
  for _ in $(seq 50); do
    curl -sf "http://localhost:$PORT/" >/dev/null && echo "listening on http://localhost:$PORT" && return
    sleep 0.2
  done
  echo "server did not start; see $LOG" >&2
  exit 1
}

down() { fuser -k $PORT/tcp >/dev/null 2>&1 || true; }

case "$1" in
start)
  down
  npx vite build --logLevel error
  up
  ;;
restart)
  down
  up
  ;;
stop)
  down
  rm -rf dist
  ;;
*)
  echo "usage: $0 start|restart|stop [log file]" >&2
  exit 2
  ;;
esac
