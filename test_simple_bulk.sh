#!/bin/bash

BACKEND_URL="https://taskflow-xon.preview.emergentagent.com/api"

# Login as admin
LOGIN=$(curl -s -X POST "$BACKEND_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin","password":"admin"}')

TOKEN=$(echo $LOGIN | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

echo "Testing bulk delete with hardcoded IDs..."
echo ""

# Test with simple array
DELETE_RESULT=$(curl -v -X POST "$BACKEND_URL/admin/members/bulk-delete" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '["test-id-1", "test-id-2"]' 2>&1)

echo "$DELETE_RESULT" | grep -A 5 "< HTTP"
echo ""
echo "Response body:"
echo "$DELETE_RESULT" | tail -1

