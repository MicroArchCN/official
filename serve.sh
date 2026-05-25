#!/bin/bash
IP=$(ipconfig getifaddr en0 2>/dev/null || hostname -I 2>/dev/null | awk '{print $1}')
PORT=8080
echo ""
echo "  本机浏览器: http://localhost:$PORT"
echo "  手机扫码访问 (同一WiFi): http://$IP:$PORT"
echo ""
python3 -m http.server $PORT --bind 0.0.0.0
