#!/bin/bash

BACKEND_URL="https://architect-app.preview.emergentagent.com/api"

echo "=== Testing Login dengan Username ==="
echo ""

# Test 1: Login dengan username admin
echo "1. Login dengan username: admin"
LOGIN=$(curl -s -X POST "$BACKEND_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin","password":"admin"}')

echo "$LOGIN" | python3 -m json.tool
echo ""

# Test 2: Login dengan username idrus
echo "2. Login dengan username: idrus"
LOGIN=$(curl -s -X POST "$BACKEND_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"idrus","password":"password123"}')

echo "$LOGIN" | python3 -m json.tool
echo ""

# Test 3: Login dengan email idrus@gmail.com
echo "3. Login dengan email: idrus@gmail.com"
LOGIN=$(curl -s -X POST "$BACKEND_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"idrus@gmail.com","password":"password123"}')

echo "$LOGIN" | python3 -m json.tool
echo ""

# Test 4: Login dengan username khoer
echo "4. Login dengan username: khoer"
LOGIN=$(curl -s -X POST "$BACKEND_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"khoer","password":"password123"}')

echo "$LOGIN" | python3 -m json.tool

