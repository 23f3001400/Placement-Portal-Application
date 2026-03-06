#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────
# PPA Startup Script — Starts Redis, Flask, Celery Worker, Celery Beat
# Usage:  chmod +x start.sh && ./start.sh
# Stop:   ./start.sh stop
# ─────────────────────────────────────────────────────────────────────────

BACKEND_DIR="$(cd "$(dirname "$0")" && pwd)"
VENV="$BACKEND_DIR/venv/bin/activate"
ENV_FILE="$BACKEND_DIR/.env"
LOG_DIR="$BACKEND_DIR/logs"
mkdir -p "$LOG_DIR"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# ── Stop command ────────────────────────────────────────────────────────
if [ "$1" = "stop" ]; then
    echo -e "${YELLOW}Stopping PPA services...${NC}"
    [ -f "$LOG_DIR/flask.pid" ]  && kill $(cat "$LOG_DIR/flask.pid") 2>/dev/null  && echo -e "${GREEN}✅ Flask stopped${NC}"
    [ -f "$LOG_DIR/worker.pid" ] && kill $(cat "$LOG_DIR/worker.pid") 2>/dev/null && echo -e "${GREEN}✅ Celery Worker stopped${NC}"
    [ -f "$LOG_DIR/beat.pid" ]   && kill $(cat "$LOG_DIR/beat.pid") 2>/dev/null   && echo -e "${GREEN}✅ Celery Beat stopped${NC}"
    rm -f "$LOG_DIR"/*.pid
    echo -e "${GREEN}All services stopped.${NC}"
    exit 0
fi

# ── Check Redis ─────────────────────────────────────────────────────────
if redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Redis is running${NC}"
else
    echo -e "${YELLOW}⏳ Starting Redis...${NC}"
    sudo systemctl start redis 2>/dev/null || redis-server --daemonize yes
    sleep 1
    if redis-cli ping > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Redis started${NC}"
    else
        echo -e "${RED}❌ Failed to start Redis. Install it: sudo apt install redis-server${NC}"
        exit 1
    fi
fi

# ── Load environment variables ──────────────────────────────────────────
if [ -f "$ENV_FILE" ]; then
    set -a
    source "$ENV_FILE"
    set +a
    echo -e "${GREEN}✅ Loaded .env${NC}"
else
    echo -e "${YELLOW}⚠️  No .env file found at $ENV_FILE — using defaults${NC}"
fi

# ── Activate virtualenv ────────────────────────────────────────────────
source "$VENV"
echo -e "${GREEN}✅ Virtual environment activated${NC}"

# ── Start Flask ─────────────────────────────────────────────────────────
echo -e "${YELLOW}⏳ Starting Flask...${NC}"
cd "$BACKEND_DIR"
python app.py > "$LOG_DIR/flask.log" 2>&1 &
echo $! > "$LOG_DIR/flask.pid"
sleep 2
if kill -0 $(cat "$LOG_DIR/flask.pid") 2>/dev/null; then
    echo -e "${GREEN}✅ Flask running on http://localhost:5000 (PID: $(cat $LOG_DIR/flask.pid))${NC}"
else
    echo -e "${RED}❌ Flask failed to start. Check $LOG_DIR/flask.log${NC}"
    exit 1
fi

# ── Start Celery Worker ─────────────────────────────────────────────────
echo -e "${YELLOW}⏳ Starting Celery Worker...${NC}"
celery -A app:celery_app worker --loglevel=info > "$LOG_DIR/worker.log" 2>&1 &
echo $! > "$LOG_DIR/worker.pid"
sleep 3
if kill -0 $(cat "$LOG_DIR/worker.pid") 2>/dev/null; then
    echo -e "${GREEN}✅ Celery Worker running (PID: $(cat $LOG_DIR/worker.pid))${NC}"
else
    echo -e "${RED}❌ Celery Worker failed. Check $LOG_DIR/worker.log${NC}"
    exit 1
fi

# ── Start Celery Beat ──────────────────────────────────────────────────
echo -e "${YELLOW}⏳ Starting Celery Beat...${NC}"
celery -A app:celery_app beat --loglevel=info > "$LOG_DIR/beat.log" 2>&1 &
echo $! > "$LOG_DIR/beat.pid"
sleep 2
if kill -0 $(cat "$LOG_DIR/beat.pid") 2>/dev/null; then
    echo -e "${GREEN}✅ Celery Beat running (PID: $(cat $LOG_DIR/beat.pid))${NC}"
else
    echo -e "${RED}❌ Celery Beat failed. Check $LOG_DIR/beat.log${NC}"
    exit 1
fi

# ── Done ────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  🚀 PPA is fully running!${NC}"
echo -e "${GREEN}══════════════════════════════════════════════════${NC}"
echo -e "  🌐 App:     http://localhost:5000"
echo -e "  📋 Logs:    $LOG_DIR/"
echo -e "  🛑 Stop:    ./start.sh stop"
echo -e "${GREEN}══════════════════════════════════════════════════${NC}"
