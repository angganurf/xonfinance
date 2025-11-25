#!/bin/bash

BACKEND_URL="https://xon-management.preview.emergentagent.com/api"

echo "=== Testing Backend API dengan User Baru ==="
echo ""

# Test 1: Login
echo "1. Login dengan test@xon.com..."
LOGIN_RESPONSE=$(curl -s -X POST "$BACKEND_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@xon.com","password":"test123"}')

echo "$LOGIN_RESPONSE" | python3 -m json.tool 2>/dev/null
echo ""

# Extract token
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed"
  exit 1
fi

echo "✅ Login successful!"
echo "Token: ${TOKEN:0:30}..."
echo ""

# Test 2: Get recent transactions
echo "2. Testing GET /transactions/recent..."
TRANSACTIONS=$(curl -s -X GET "$BACKEND_URL/transactions/recent" \
  -H "Authorization: Bearer $TOKEN")

echo "$TRANSACTIONS" | python3 -c "
import sys
import json
data = json.load(sys.stdin)
print(json.dumps(data, indent=2))
print()
print('=' * 50)
print('Analysis:')
print(f'Total transactions: {len(data)}')
if data:
    first_tx = data[0]
    if 'project_name' in first_tx:
        print('✅ SUCCESS: project_name field EXISTS')
        print(f'   Sample: {first_tx.get(\"project_name\")}')
    else:
        print('❌ FAILED: project_name field MISSING')
        print(f'   Available fields: {list(first_tx.keys())}')
else:
    print('No transactions found')
" 2>/dev/null || echo "$TRANSACTIONS"

