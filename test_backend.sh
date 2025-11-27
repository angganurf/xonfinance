#!/bin/bash

BACKEND_URL="https://pmcraft.preview.emergentagent.com/api"

echo "=== Testing Backend API ==="
echo ""

# Test 1: Login
echo "1. Testing login..."
LOGIN_RESPONSE=$(curl -s -X POST "$BACKEND_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"accounting@xon.com","password":"password123"}')

echo "Login response: $LOGIN_RESPONSE"
echo ""

# Extract token
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed - no token received"
  exit 1
fi

echo "✅ Login successful, token: ${TOKEN:0:20}..."
echo ""

# Test 2: Get recent transactions with project names
echo "2. Testing /transactions/recent endpoint..."
TRANSACTIONS=$(curl -s -X GET "$BACKEND_URL/transactions/recent" \
  -H "Authorization: Bearer $TOKEN")

echo "Recent transactions response:"
echo "$TRANSACTIONS" | python3 -m json.tool 2>/dev/null || echo "$TRANSACTIONS"
echo ""

# Check if project_name field exists in response
if echo "$TRANSACTIONS" | grep -q "project_name"; then
  echo "✅ SUCCESS: project_name field found in transactions!"
else
  echo "❌ FAILED: project_name field NOT found in transactions"
fi

