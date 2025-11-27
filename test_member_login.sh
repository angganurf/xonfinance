#!/bin/bash

BACKEND_URL="https://pmcraft.preview.emergentagent.com/api"

echo "=== Testing Member Login ==="
echo ""

# Test 1: Login as accounting member
echo "1. Testing login as 'idrus' (accounting)..."
LOGIN=$(curl -s -X POST "$BACKEND_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"idrus","password":"password123"}')

echo "$LOGIN" | python3 -m json.tool 2>/dev/null || echo "$LOGIN"
echo ""

if echo "$LOGIN" | grep -q "token"; then
    echo "✅ Login successful"
    TOKEN=$(echo $LOGIN | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    
    # Test accessing dashboard
    echo ""
    echo "2. Testing access to dashboard..."
    DASHBOARD=$(curl -s -X GET "$BACKEND_URL/projects" \
      -H "Authorization: Bearer $TOKEN")
    
    if echo "$DASHBOARD" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null; then
        echo "✅ Can access projects"
    else
        echo "❌ Cannot access projects"
        echo "$DASHBOARD"
    fi
else
    echo "❌ Login failed"
fi

