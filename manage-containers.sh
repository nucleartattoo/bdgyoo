#!/bin/bash
# ==============================================================================
# BDGY Tattoo Supply - Apple Container 专用管理脚本
# 存储位于 Samsung 980 Pro 外置固态硬盘 (/Volumes/samsung2tb980pro/DeveloperData/apple-container)
# ==============================================================================

set -eo pipefail

ACTION=${1:-status}
CONTAINER_BIN="/opt/homebrew/bin/container"
IMAGE_NAME="bdgy-storefront:latest"
CONTAINER_NAME="bdgy-storefront"
PORT="3000"

if [ ! -x "$CONTAINER_BIN" ]; then
  echo "❌ 未检测到 Apple Container CLI: $CONTAINER_BIN"
  exit 1
fi

start_containers() {
  echo "🚀 [BDGY] 正在启动 Apple Container 服务..."

  if ! "$CONTAINER_BIN" list -a | grep -q "$CONTAINER_NAME"; then
    echo "📦 容器 $CONTAINER_NAME 尚未创建，正在从镜像 $IMAGE_NAME 启动..."
    "$CONTAINER_BIN" run -d --name "$CONTAINER_NAME" -p "$PORT:$PORT" -c 4 -m 1024M \
      -e PORT="$PORT" \
      -e NODE_ENV="production" \
      -e SALEOR_API_ENDPOINT="http://192.168.64.1:8003/graphql/" \
      -e SALEOR_CHANNEL="bdgy-channel" \
      "$IMAGE_NAME" || true
  elif ! "$CONTAINER_BIN" list | grep -q "$CONTAINER_NAME"; then
    echo "🔄 正在启动现有容器 $CONTAINER_NAME..."
    "$CONTAINER_BIN" start "$CONTAINER_NAME"
  else
    echo "✅ 容器 $CONTAINER_NAME 已在运行中"
  fi

  echo ""
  echo "📊 当前容器状态："
  "$CONTAINER_BIN" list | grep -E "ID|$CONTAINER_NAME" || true
}

stop_containers() {
  echo "🛑 正在停止 $CONTAINER_NAME 容器..."
  "$CONTAINER_BIN" stop "$CONTAINER_NAME" 2>/dev/null || true
  echo "✅ 容器已停止。"
}

clean_containers() {
  echo "🧹 正在彻底清理 $CONTAINER_NAME 容器..."
  "$CONTAINER_BIN" delete -f "$CONTAINER_NAME" 2>/dev/null || true
  echo "✅ 容器已删除。"
}

build_image() {
  echo "🔨 正在使用 Apple Container 构建镜像 $IMAGE_NAME..."
  "$CONTAINER_BIN" build -t "$IMAGE_NAME" -f Containerfile .
  echo "✅ 镜像构建完成。"
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
    "$CONTAINER_BIN" list -a | grep -E "ID|$CONTAINER_NAME" || "$CONTAINER_BIN" list -a
    ;;
  *)
    echo "用法: $0 {start|stop|restart|build|clean|status}"
    exit 1
    ;;
esac
