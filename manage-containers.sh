#!/bin/bash
# ==============================================================================
# BDGY Tattoo Supply - Apple Container 独立全栈基础设施管理脚本
# 存储位于 Samsung 980 Pro 外置固态硬盘 (/Volumes/samsung2tb980pro/DeveloperData/apple-container)
# 完全物理/逻辑隔离：独立数据库 (5435)、缓存 (6382)、后台 (9004)、前台 (3000)
# ==============================================================================

set -eo pipefail

ACTION=${1:-status}
CONTAINER_BIN="/opt/homebrew/bin/container"
STOREFRONT_IMAGE="bdgy-storefront:latest"
STOREFRONT_NAME="bdgy-storefront"
STOREFRONT_PORT="3000"

PG_NAME="bdgy-postgres"
PG_PORT="5435"

REDIS_NAME="bdgy-redis"
REDIS_PORT="6382"

DASHBOARD_NAME="bdgy-dashboard"
DASHBOARD_PORT="9004"

if [ ! -x "$CONTAINER_BIN" ]; then
  echo "❌ 未检测到 Apple Container CLI: $CONTAINER_BIN"
  exit 1
fi

start_containers() {
  echo "🚀 [BDGY] 正在启动 BDGY 独立 Apple Container 全栈服务..."

  # 1. PostgreSQL (Port 5435:5432)
  if ! "$CONTAINER_BIN" list -a | grep -q "$PG_NAME"; then
    echo "📦 正在拉起 $PG_NAME ($PG_PORT:5432) [命名卷持久化]..."
    "$CONTAINER_BIN" run -d --name "$PG_NAME" -p "$PG_PORT:5432" \
      -v bdgy-postgres-data:/var/lib/postgresql/data \
      -e PGDATA=/var/lib/postgresql/data/pgdata \
      -e POSTGRES_PASSWORD=saleorpassword \
      -e POSTGRES_USER=saleor \
      -e POSTGRES_DB=bdgy_saleor \
      postgres:16-alpine || true
  elif ! "$CONTAINER_BIN" list | grep -q "$PG_NAME"; then
    echo "🔄 正在启动现有 $PG_NAME 容器..."
    "$CONTAINER_BIN" start "$PG_NAME"
  else
    echo "✅ $PG_NAME 容器已在运行中 (端口 $PG_PORT)"
  fi

  # 2. Redis (Port 6382:6379)
  if ! "$CONTAINER_BIN" list -a | grep -q "$REDIS_NAME"; then
    echo "📦 正在拉起 $REDIS_NAME ($REDIS_PORT:6379) [命名卷持久化]..."
    "$CONTAINER_BIN" run -d --name "$REDIS_NAME" -p "$REDIS_PORT:6379" \
      -v bdgy-redis-data:/data \
      redis:7-alpine redis-server --appendonly yes || true
  elif ! "$CONTAINER_BIN" list | grep -q "$REDIS_NAME"; then
    echo "🔄 正在启动现有 $REDIS_NAME 容器..."
    "$CONTAINER_BIN" start "$REDIS_NAME"
  else
    echo "✅ $REDIS_NAME 容器已在运行中 (端口 $REDIS_PORT)"
  fi

  # 3. Saleor Dashboard (Port 9004:80)
  if ! "$CONTAINER_BIN" list -a | grep -q "$DASHBOARD_NAME"; then
    echo "📦 正在拉起 $DASHBOARD_NAME ($DASHBOARD_PORT:80)..."
    "$CONTAINER_BIN" run -d --name "$DASHBOARD_NAME" -p "$DASHBOARD_PORT:80" \
      -e API_URL=http://localhost:8004/graphql/ \
      ghcr.io/saleor/saleor-dashboard:latest || true
  elif ! "$CONTAINER_BIN" list | grep -q "$DASHBOARD_NAME"; then
    echo "🔄 正在启动现有 $DASHBOARD_NAME 容器..."
    "$CONTAINER_BIN" start "$DASHBOARD_NAME"
  else
    echo "✅ $DASHBOARD_NAME 容器已在运行中 (端口 $DASHBOARD_PORT)"
  fi

  # 4. BDGY Storefront (Port 3000:3000)
  if ! "$CONTAINER_BIN" list -a | grep -q "$STOREFRONT_NAME"; then
    echo "📦 容器 $STOREFRONT_NAME 尚未创建，正在从镜像 $STOREFRONT_IMAGE 启动..."
    "$CONTAINER_BIN" run -d --name "$STOREFRONT_NAME" -p "$STOREFRONT_PORT:$STOREFRONT_PORT" -c 4 -m 1024M \
      -e PORT="$STOREFRONT_PORT" \
      -e NODE_ENV="production" \
      -e SALEOR_API_ENDPOINT="http://192.168.64.1:8004/graphql/" \
      -e SALEOR_CHANNEL="default-channel" \
      "$STOREFRONT_IMAGE" || true
  elif ! "$CONTAINER_BIN" list | grep -q "$STOREFRONT_NAME"; then
    echo "🔄 正在启动现有容器 $STOREFRONT_NAME..."
    "$CONTAINER_BIN" start "$STOREFRONT_NAME"
  else
    echo "✅ 容器 $STOREFRONT_NAME 已在运行中 (端口 $STOREFRONT_PORT)"
  fi

  echo ""
  echo "📊 BDGY 全栈容器状态："
  "$CONTAINER_BIN" list | grep -E "ID|bdgy" || true
}

stop_containers() {
  echo "🛑 正在停止 BDGY 所有独立容器..."
  for name in "$STOREFRONT_NAME" "$DASHBOARD_NAME" "$REDIS_NAME" "$PG_NAME"; do
    "$CONTAINER_BIN" stop "$name" 2>/dev/null || true
  done
  echo "✅ 所有 BDGY 容器已停止。"
}

clean_containers() {
  echo "🧹 正在删除 BDGY 容器..."
  for name in "$STOREFRONT_NAME" "$DASHBOARD_NAME" "$REDIS_NAME" "$PG_NAME"; do
    "$CONTAINER_BIN" delete -f "$name" 2>/dev/null || true
  done
  echo "✅ 容器已删除。"
}

build_image() {
  echo "🔨 正在使用 Apple Container 构建前台镜像 $STOREFRONT_IMAGE..."
  "$CONTAINER_BIN" build -t "$STOREFRONT_IMAGE" -f Containerfile .
  echo "✅ 镜像构建完成。"
}

status_containers() {
  echo "========================================================================"
  echo "📊 [BDGY] 独立全栈运行拓扑与状态："
  echo "========================================================================"
  echo "  🛍️  Storefront:     http://localhost:3000  ($(nc -z 127.0.0.1 3000 2>/dev/null && echo '🟢 Running' || echo '🔴 Stopped'))"
  echo "  📊  Dashboard:      http://localhost:9004  ($(nc -z 127.0.0.1 9004 2>/dev/null && echo '🟢 Running' || echo '🔴 Stopped'))"
  echo "  🔮  Saleor Core:    http://localhost:8004  ($(nc -z 127.0.0.1 8004 2>/dev/null && echo '🟢 Running' || echo '🔴 Stopped'))"
  echo "  🗄️  PostgreSQL:     localhost:5435 (bdgy_saleor) ($(nc -z 127.0.0.1 5435 2>/dev/null && echo '🟢 Running' || echo '🔴 Stopped'))"
  echo "  ⚡  Redis:          localhost:6382         ($(nc -z 127.0.0.1 6382 2>/dev/null && echo '🟢 Running' || echo '🔴 Stopped'))"
  echo ""
  echo "🐳 Apple Container 实例列表："
  "$CONTAINER_BIN" list -a | grep -E "ID|bdgy" || true
}

case "$ACTION" in
  start)
    start_containers
    ;;
  stop)
    stop_containers
    ;;
  restart)
    stop_containers
    sleep 1
    start_containers
    ;;
  clean)
    clean_containers
    ;;
  build)
    build_image
    ;;
  status)
    status_containers
    ;;
  *)
    echo "用法: $0 {start|stop|restart|build|clean|status}"
    exit 1
    ;;
esac
