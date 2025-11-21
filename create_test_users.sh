#!/bin/bash

BACKEND_URL="https://xon-project-hub.preview.emergentagent.com/api"

echo "=== Creating Test Users ==="
echo ""

# Login as admin
LOGIN=$(curl -s -X POST "$BACKEND_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin","password":"admin"}')

TOKEN=$(echo $LOGIN | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# Create accounting user
echo "1. Creating accounting user..."
CREATE_ACC=$(curl -s -X POST "$BACKEND_URL/admin/members" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email":"359f2223359f2223",
    "username":"accounting",
    "password":"test123",
    "name":"Test Accounting",
    "role":"accounting"
  }')

echo "$CREATE_ACC" | python3 -m json.tool
echo ""

# Create estimator user  
echo "2. Creating estimator user..."
CREATE_EST=$(curl -s -X POST "$BACKEND_URL/admin/members" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email":"estimator@test.com",
    "username":"estimator",
    "password":"test123",
    "name":"Test Estimator",
    "role":"estimator"
  }')

echo "$CREATE_EST" | python3 -m json.tool
echo ""

# Create supervisor user
echo "3. Creating supervisor user..."
CREATE_SUP=$(curl -s -X POST "$BACKEND_URL/admin/members" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email":"supervisor@test.com",
    "username":"supervisor",
    "password":"test123",
    "name":"Test Supervisor",
    "role":"site_supervisor"
  }')

echo "$CREATE_SUP" | python3 -m json.tool
echo ""

# Create employee user
echo "4. Creating employee user..."
CREATE_EMP=$(curl -s -X POST "$BACKEND_URL/admin/members" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email":"employee@test.com",
    "username":"employee",
    "password":"test123",
    "name":"Test Employee",
    "role":"employee"
  }')

echo "$CREATE_EMP" | python3 -m json.tool
echo ""

echo "✅ Test users created with password: test123"

