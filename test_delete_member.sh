#!/bin/bash

BACKEND_URL="https://taskmaster-952.preview.emergentagent.com/api"

echo "=== Testing Delete Member ==="
echo ""

# Login as admin
LOGIN=$(curl -s -X POST "$BACKEND_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin","password":"admin"}')

TOKEN=$(echo $LOGIN | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# Get user to delete
echo "1. Getting members list..."
MEMBERS=$(curl -s -X GET "$BACKEND_URL/admin/members" \
  -H "Authorization: Bearer $TOKEN")

# Get Multi Role User ID
USER_ID=$(echo $MEMBERS | python3 -c "
import sys, json
members = json.load(sys.stdin)
for m in members:
    if 'Multi Role User' in m.get('name', ''):
        print(m['id'])
        break
")

if [ -z "$USER_ID" ]; then
    echo "❌ No test user found to delete"
    exit 1
fi

echo "Found user to delete: $USER_ID"
echo ""

# Try to delete
echo "2. Attempting to delete user..."
DELETE_RESULT=$(curl -s -X DELETE "$BACKEND_URL/admin/members/$USER_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "$DELETE_RESULT" | python3 -m json.tool 2>/dev/null || echo "$DELETE_RESULT"
echo ""

if echo "$DELETE_RESULT" | grep -q "successfully"; then
    echo "✅ Delete successful"
else
    echo "❌ Delete failed"
fi

