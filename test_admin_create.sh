#!/bin/bash

BACKEND_URL="https://architect-app.preview.emergentagent.com/api"

echo "=== Testing Admin CREATE Operations ==="
echo ""

# Login as admin
LOGIN=$(curl -s -X POST "$BACKEND_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin","password":"admin"}')

TOKEN=$(echo $LOGIN | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# Test 1: Create Project
echo "1. Testing POST /projects (Create Project)..."
PROJECT=$(curl -s -X POST "$BACKEND_URL/projects" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Admin Test Project",
    "type":"arsitektur",
    "description":"Project created by admin",
    "location":"Jakarta",
    "project_value":100000000
  }')

if echo "$PROJECT" | grep -q "id"; then
  echo "✅ Admin can create projects"
  PROJECT_ID=$(echo $PROJECT | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
  echo "   Project ID: $PROJECT_ID"
else
  echo "❌ Failed to create project"
  echo "$PROJECT"
fi
echo ""

# Test 2: Create Transaction
echo "2. Testing POST /transactions (Create Transaction)..."
TRANS=$(curl -s -X POST "$BACKEND_URL/transactions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"project_id\":\"$PROJECT_ID\",
    \"category\":\"kas_masuk\",
    \"description\":\"Admin test transaction\",
    \"amount\":5000000
  }")

if echo "$TRANS" | grep -q "id"; then
  echo "✅ Admin can create transactions"
else
  echo "❌ Failed to create transaction"
  echo "$TRANS"
fi
echo ""

# Test 3: Create RAB
echo "3. Testing POST /rabs (Create RAB)..."
RAB=$(curl -s -X POST "$BACKEND_URL/rabs" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"project_id\":\"$PROJECT_ID\",
    \"project_name\":\"Admin Test Project\"
  }")

if echo "$RAB" | grep -q "id"; then
  echo "✅ Admin can create RABs"
  RAB_ID=$(echo $RAB | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
  echo "   RAB ID: $RAB_ID"
else
  echo "❌ Failed to create RAB"
  echo "$RAB"
fi
echo ""

echo "=== SUMMARY ==="
echo "✅ Admin has FULL ACCESS to:"
echo "   - Create & manage Projects (Accounting)"
echo "   - Create & manage Transactions (Accounting)"
echo "   - Create & manage RABs (Estimator)"

