#!/bin/bash

BACKEND_URL="https://pmcraft.preview.emergentagent.com/api"

echo "=== Testing New Member Management Features ==="
echo ""

# Login as admin
echo "1. Login as admin..."
LOGIN=$(curl -s -X POST "$BACKEND_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin","password":"admin"}')

TOKEN=$(echo $LOGIN | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Admin login failed"
  exit 1
fi

echo "✅ Admin login successful"
echo ""

# Test creating user with multiple roles
echo "2. Creating user with multiple roles..."
CREATE=$(curl -s -X POST "$BACKEND_URL/admin/members" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email":"multirol@test.com",
    "username":"multirol",
    "password":"test123",
    "name":"Multi Role User",
    "role":"accounting",
    "roles":["estimator","site_supervisor"]
  }')

echo "$CREATE" | python3 -m json.tool
echo ""

# Get all members to see sorting
echo "3. Getting all members (should have admin first)..."
MEMBERS=$(curl -s -X GET "$BACKEND_URL/admin/members" \
  -H "Authorization: Bearer $TOKEN")

echo "$MEMBERS" | python3 -c "
import sys
import json
data = json.load(sys.stdin)
print(f'Total members: {len(data)}')
print('\nFirst 5 members:')
for i, member in enumerate(data[:5]):
    roles_str = ', '.join(member.get('roles', [])) if member.get('roles') else 'none'
    print(f'{i+1}. {member[\"name\"]} - Role: {member[\"role\"]} - Additional: [{roles_str}]')
"

