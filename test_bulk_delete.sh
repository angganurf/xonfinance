#!/bin/bash

BACKEND_URL="https://taskmaster-952.preview.emergentagent.com/api"

echo "=== Testing Bulk Delete ==="
echo ""

# Login as admin
LOGIN=$(curl -s -X POST "$BACKEND_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin","password":"admin"}')

TOKEN=$(echo $LOGIN | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# Get all members
echo "1. Getting all members..."
MEMBERS=$(curl -s -X GET "$BACKEND_URL/admin/members" \
  -H "Authorization: Bearer $TOKEN")

# Extract non-admin user IDs
USER_IDS=$(echo $MEMBERS | python3 -c "
import sys, json
members = json.load(sys.stdin)
ids = [m['id'] for m in members if m.get('role') != 'admin']
print(json.dumps(ids[:3]))  # Only delete first 3 for testing
" 2>/dev/null)

echo "User IDs to delete: $USER_IDS"
echo ""

# Try bulk delete
echo "2. Attempting bulk delete..."
DELETE_RESULT=$(curl -s -X POST "$BACKEND_URL/admin/members/bulk-delete" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$USER_IDS")

echo "Response:"
echo "$DELETE_RESULT" | python3 -m json.tool 2>/dev/null || echo "$DELETE_RESULT"
echo ""

if echo "$DELETE_RESULT" | grep -q "successfully"; then
    echo "✅ Bulk delete successful"
else
    echo "❌ Bulk delete failed"
fi

