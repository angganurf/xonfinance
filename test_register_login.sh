#!/bin/bash

BACKEND_URL="https://xon-management.preview.emergentagent.com/api"

echo "=== Testing Register dan Login dengan Username ==="
echo ""

# Test 1: Register user baru dengan username
echo "1. Register user baru dengan username 'usernew'"
REGISTER=$(curl -s -X POST "$BACKEND_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email":"usernew@test.com",
    "username":"usernew",
    "password":"password123",
    "name":"User New",
    "role":"accounting"
  }')

echo "$REGISTER" | python3 -m json.tool
echo ""

# Test 2: Login dengan username yang baru dibuat
echo "2. Login dengan username: usernew"
LOGIN=$(curl -s -X POST "$BACKEND_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"usernew","password":"password123"}')

echo "$LOGIN" | python3 -m json.tool
echo ""

# Check if login was successful
if echo "$LOGIN" | grep -q "session_token"; then
  echo "✅ SUCCESS: Register dan login dengan username berhasil!"
else
  echo "❌ FAILED: Login dengan username gagal"
fi

