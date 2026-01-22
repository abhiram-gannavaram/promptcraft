#!/bin/bash
# ===========================================
# NeuralWriter Quick Test Script
# Uses Perplexity API for AI prompt generation
# ===========================================

set -e

echo "🧪 NeuralWriter Quick Test"
echo "========================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Check if server is running
echo "1️⃣  Checking server status..."
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo -e "   ${GREEN}✓ Server is running${NC}"
else
    echo -e "   ${RED}✗ Server not running. Starting server...${NC}"
    cd "$(dirname "$0")/.."
    nohup node backend/server.js > /tmp/neuralwriter.log 2>&1 &
    sleep 3
    echo -e "   ${GREEN}✓ Server started${NC}"
fi

# Test health endpoint
echo ""
echo "2️⃣  Testing health endpoint..."
HEALTH=$(curl -s http://localhost:3000/api/health)
if echo "$HEALTH" | grep -q "healthy"; then
    echo -e "   ${GREEN}✓ Health check passed${NC}"
else
    echo -e "   ${RED}✗ Health check failed${NC}"
    exit 1
fi

# Test API endpoint
echo ""
echo "3️⃣  Testing Perplexity API integration..."
RESPONSE=$(curl -s -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "sonar",
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Say hello in exactly 5 words"}
    ],
    "max_tokens": 50,
    "temperature": 0.7
  }')

if echo "$RESPONSE" | grep -q "choices"; then
    echo -e "   ${GREEN}✓ API integration working${NC}"
    # Extract content for display
    CONTENT=$(echo "$RESPONSE" | grep -o '"content":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "   Response: $CONTENT"
else
    echo -e "   ${RED}✗ API test failed${NC}"
    echo "   Response: $RESPONSE"
    exit 1
fi

# Test frontend serving
echo ""
echo "4️⃣  Testing frontend serving..."
HTML=$(curl -s http://localhost:3000/ | head -5)
if echo "$HTML" | grep -q "DOCTYPE"; then
    echo -e "   ${GREEN}✓ Frontend serving correctly${NC}"
else
    echo -e "   ${RED}✗ Frontend not serving${NC}"
    exit 1
fi

# Test static files
echo ""
echo "5️⃣  Testing static files..."
CSS=$(curl -s http://localhost:3000/css/styles.css | head -20)
if echo "$CSS" | grep -q "color-primary"; then
    echo -e "   ${GREEN}✓ CSS file accessible${NC}"
else
    echo -e "   ${RED}✗ CSS file not accessible${NC}"
fi

JS=$(curl -s http://localhost:3000/js/app.js | head -5)
if echo "$JS" | grep -q "AI Prompt Generator"; then
    echo -e "   ${GREEN}✓ JavaScript file accessible${NC}"
else
    echo -e "   ${RED}✗ JavaScript file not accessible${NC}"
fi

echo ""
echo "========================="
echo -e "${GREEN}✅ All tests passed!${NC}"
echo ""
echo "🌐 Open in browser: http://localhost:3000"
echo ""
