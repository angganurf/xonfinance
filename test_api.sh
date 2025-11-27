#!/bin/bash

BACKEND_URL="https://pmcraft.preview.emergentagent.com/api"

echo "=== Testing Backend API ==="
echo ""

# Test 1: Login dengan user yang benar
echo "1. Testing login dengan demo.accounting@xon.com..."
LOGIN_RESPONSE=$(curl -s -X POST "$BACKEND_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"demo.accounting@xon.com","password":"password123"}')

echo "Login response:"
echo "$LOGIN_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$LOGIN_RESPONSE"
echo ""

# Extract token
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed - trying other users..."
  
  # Try dengan user lain
  for email in "idrus@gmail.com" "khoer@gmail.com"; do
    echo "Trying $email..."
    LOGIN_RESPONSE=$(curl -s -X POST "$BACKEND_URL/auth/login" \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"$email\",\"password\":\"password123\"}")
    
    TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    
    if [ ! -z "$TOKEN" ]; then
      echo "✅ Login successful with $email"
      break
    fi
  done
fi

if [ -z "$TOKEN" ]; then
  echo "❌ All login attempts failed"
  exit 1
fi

echo "✅ Login successful, token: ${TOKEN:0:30}..."
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
  
  # Count how many transactions have project_name
  COUNT=$(echo "$TRANSACTIONS" | grep -o "project_name" | wc -l)
  echo "   Found $COUNT transactions with project_name field"
else
  echo "❌ FAILED: project_name field NOT found in transactions"
fi

