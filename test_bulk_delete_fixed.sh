#!/bin/bash

BACKEND_URL="https://architect-app.preview.emergentagent.com/api"

echo "=== Testing Bulk Delete (Fixed) ==="
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
echo "$MEMBERS" | python3 << 'PYTHON'
import sys, json
members = json.load(sys.stdin)
print(f"Total members: {len(members)}")
for m in members:
    print(f"  - {m.get('name'):25} Role: {m.get('role'):15} ID: {m.get('id')[:8]}...")
PYTHON

USER_IDS=$(echo $MEMBERS | python3 -c "
import sys, json
members = json.load(sys.stdin)
ids = [m['id'] for m in members if m.get('role') != 'admin']
print(json.dumps(ids[:2]))  # Only delete first 2 for testing
")

echo ""
echo "User IDs to delete (first 2): $USER_IDS"
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
    
    # Verify deletion
    echo ""
    echo "3. Verifying deletion..."
    MEMBERS_AFTER=$(curl -s -X GET "$BACKEND_URL/admin/members" \
      -H "Authorization: Bearer $TOKEN")
    
    COUNT_AFTER=$(echo $MEMBERS_AFTER | python3 -c "import sys,json; print(len(json.load(sys.stdin)))")
    echo "Members count after deletion: $COUNT_AFTER"
else
    echo "❌ Bulk delete failed"
fi

