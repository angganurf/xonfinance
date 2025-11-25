#!/bin/bash

BACKEND_URL="https://xon-management.preview.emergentagent.com/api"

echo "=== Testing Admin Endpoints ==="
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

# Test GET /admin/members
echo "2. Testing GET /admin/members..."
MEMBERS=$(curl -s -X GET "$BACKEND_URL/admin/members" \
  -H "Authorization: Bearer $TOKEN")

echo "$MEMBERS" | python3 -m json.tool | head -20
echo ""

# Test trying to register (should be disabled)
echo "3. Testing public registration (should be disabled)..."
REGISTER=$(curl -s -X POST "$BACKEND_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@test.com",
    "username":"test",
    "password":"test",
    "name":"Test",
    "role":"employee"
  }')

echo "$REGISTER" | python3 -m json.tool
echo ""

if echo "$REGISTER" | grep -q "disabled"; then
  echo "✅ Public registration is properly disabled"
else
  echo "❌ Public registration is not disabled"
fi

