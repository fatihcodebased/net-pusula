#!/usr/bin/env bash
set -e

APP_NAME="netpusula"
APP_PORT="127.0.0.1:8000:8000"

cd /opt/netpusula

echo "Yeni kodlar alınıyor..."
git pull

echo "Docker image build ediliyor..."
docker build -t "$APP_NAME" .

echo "Eski container durduruluyor..."
docker stop "$APP_NAME" 2>/dev/null || true

echo "Eski container siliniyor..."
docker rm "$APP_NAME" 2>/dev/null || true

echo "Yeni container başlatılıyor..."
docker run -d \
  --name "$APP_NAME" \
  --restart always \
  -p "$APP_PORT" \
  "$APP_NAME"

echo "Nginx yenileniyor..."
nginx -t
systemctl reload nginx

echo "Uygulamanın başlaması bekleniyor..."
sleep 5

echo "Sağlık kontrolü yapılıyor..."
curl -fsS http://127.0.0.1:8000/yks/health

echo
echo "Deploy tamamlandı."
