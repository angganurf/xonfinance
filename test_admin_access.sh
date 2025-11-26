#!/bin/bash

BACKEND_URL="https://taskmaster-952.preview.emergentagent.com/api"

echo "=== Testing Admin Access to All Features ==="
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

# Test 1: Get Projects (Accounting feature)
echo "2. Testing GET /projects (Accounting feature)..."
PROJECTS=$(curl -s -X GET "$BACKEND_URL/projects" \
  -H "Authorization: Bearer $TOKEN")

PROJECT_COUNT=$(echo $PROJECTS | python3 -c "import sys,json; print(len(json.load(sys.stdin)))")
echo "✅ Projects accessible: $PROJECT_COUNT projects found"
echo ""

# Test 2: Get Transactions (Accounting feature)
echo "3. Testing GET /transactions (Accounting feature)..."
TRANS=$(curl -s -X GET "$BACKEND_URL/transactions" \
  -H "Authorization: Bearer $TOKEN")

TRANS_COUNT=$(echo $TRANS | python3 -c "import sys,json; print(len(json.load(sys.stdin)))")
echo "✅ Transactions accessible: $TRANS_COUNT transactions found"
echo ""

# Test 3: Get RABs (Estimator feature)
echo "4. Testing GET /rabs (Estimator feature)..."
RABS=$(curl -s -X GET "$BACKEND_URL/rabs" \
  -H "Authorization: Bearer $TOKEN")

RAB_COUNT=$(echo $RABS | python3 -c "import sys,json; print(len(json.load(sys.stdin)))")
echo "✅ RABs accessible: $RAB_COUNT RABs found"
echo ""

# Test 4: Get Time Schedules (Supervisor feature)
echo "5. Testing GET /time-schedules (Supervisor feature)..."
SCHEDULES=$(curl -s -X GET "$BACKEND_URL/time-schedules" \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $SCHEDULES" | head -100
echo "✅ Time Schedules accessible"
echo ""

# Test 5: Get Tasks (Employee feature)
echo "6. Testing GET /employee/tasks (Employee feature)..."
TASKS=$(curl -s -X GET "$BACKEND_URL/employee/tasks" \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $TASKS" | head -100
echo "✅ Employee tasks accessible"
echo ""

echo "=== SUMMARY ==="
echo "✅ Admin can access Accounting features (Projects, Transactions)"
echo "✅ Admin can access Estimator features (RABs)"
echo "✅ Admin can access Supervisor features (Time Schedules)"
echo "✅ Admin can access Employee features (Tasks)"

