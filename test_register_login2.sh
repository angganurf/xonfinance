#!/bin/bash

BACKEND_URL="https://taskmaster-952.preview.emergentagent.com/api"

echo "=== Testing Register dan Login dengan Username ==="
echo ""

# Test 1: Register user baru dengan username
echo "1. Register user baru dengan username 'usertest2'"
REGISTER=$(curl -s -X POST "$BACKEND_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email":"usertest2@test.com",
    "username":"usertest2",
    "password":"password123",
    "name":"User Test 2",
    "role":"accounting"
  }')

echo "$REGISTER" | python3 -m json.tool
echo ""

# Test 2: Login dengan username yang baru dibuat
echo "2. Login dengan username: usertest2"
LOGIN=$(curl -s -X POST "$BACKEND_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"usertest2","password":"password123"}')

echo "$LOGIN" | python3 -m json.tool
echo ""

# Check if login was successful
if echo "$LOGIN" | grep -q "session_token"; then
  echo "✅ SUCCESS: Register dan login dengan username berhasil!"
else
  echo "❌ FAILED: Login dengan username gagal"
fi

echo ""
echo "3. Login dengan email: usertest2@test.com"
LOGIN2=$(curl -s -X POST "$BACKEND_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"usertest2@test.com","password":"password123"}')

echo "$LOGIN2" | python3 -m json.tool

# Check if login was successful
if echo "$LOGIN2" | grep -q "session_token"; then
  echo "✅ SUCCESS: Login dengan email juga berhasil!"
else
  echo "❌ FAILED: Login dengan email gagal"
fi

