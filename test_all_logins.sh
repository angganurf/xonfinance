#!/bin/bash

BACKEND_URL="https://rab-manager.preview.emergentagent.com/api"

echo "=== Testing All User Logins ==="
echo ""

# Test each user
for USER in "accounting" "estimator" "supervisor" "employee"; do
    echo "Testing login as: $USER"
    
    LOGIN=$(curl -s -X POST "$BACKEND_URL/auth/login" \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"$USER\",\"password\":\"test123\"}")
    
    if echo "$LOGIN" | grep -q "token"; then
        ROLE=$(echo $LOGIN | python3 -c "import sys,json; print(json.load(sys.stdin)['user']['role'])")
        echo "✅ Login successful - Role: $ROLE"
    else
        echo "❌ Login failed"
        echo "$LOGIN"
    fi
    echo ""
done

