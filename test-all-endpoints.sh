#!/bin/bash

# Test All API Endpoints Script
# Создает тестовые данные и проверяет все основные endpoints

API="http://localhost:3000"
TOKEN=""

echo "=== Testing PropTech Asset Manager API ==="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

function test_endpoint() {
  local method=$1
  local path=$2
  local data=$3
  local desc=$4

  echo -n "Testing: $desc ... "

  if [ "$method" = "GET" ]; then
    response=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $TOKEN" "$API$path")
  else
    response=$(curl -s -w "\n%{http_code}" -X "$method" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$data" "$API$path")
  fi

  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | head -n-1)

  if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
    echo -e "${GREEN}✓ $http_code${NC}"
    return 0
  else
    echo -e "${RED}✗ $http_code${NC}"
    echo "  Response: $body"
    return 1
  fi
}

# 1. Health Check
echo "=== 1. Health Check ==="
test_endpoint "GET" "/api/healthz" "" "Health check"
echo ""

# 2. Register
echo "=== 2. Registration ==="
RANDOM_EMAIL="test$(date +%s)@example.com"
REG_DATA='{
  "companyName": "Test Construction Co",
  "email": "'$RANDOM_EMAIL'",
  "password": "TestPass123!@#",
  "firstName": "Test",
  "lastName": "User"
}'

response=$(curl -s -X POST -H "Content-Type: application/json" -d "$REG_DATA" "$API/api/auth/register")
TOKEN=$(echo "$response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
  echo -e "${GREEN}✓ Registration successful${NC}"
  echo "  Token: ${TOKEN:0:20}..."
else
  echo -e "${RED}✗ Registration failed${NC}"
  echo "  Response: $response"
  exit 1
fi
echo ""

# 3. Auth endpoints
echo "=== 3. Auth Endpoints ==="
test_endpoint "GET" "/api/auth/me" "" "Get current user"
echo ""

# 4. Properties
echo "=== 4. Properties Module ==="
test_endpoint "GET" "/api/properties" "" "List properties"
test_endpoint "POST" "/api/properties" '{"projectName":"Test Project","unitNumber":"101","type":"apartment","status":"available"}' "Create property"
echo ""

# 5. Users
echo "=== 5. Users Module ==="
test_endpoint "GET" "/api/users" "" "List users"
echo ""

# 6. Rental endpoints
echo "=== 6. Rental Module ==="
test_endpoint "GET" "/rental/tenants" "" "List tenants"
test_endpoint "GET" "/rental/leases" "" "List leases"
test_endpoint "GET" "/rental/accruals" "" "List accruals"
test_endpoint "GET" "/rental/payments" "" "List payments"
test_endpoint "GET" "/rental/deposits" "" "List deposits"
test_endpoint "GET" "/rental/expenses" "" "List expenses"
test_endpoint "GET" "/rental/properties" "" "List rental properties"
test_endpoint "GET" "/rental/accounts" "" "List rental accounts"
test_endpoint "GET" "/rental/statements" "" "List owner statements"
echo ""

# 7. Construction endpoints
echo "=== 7. Construction Module ==="
test_endpoint "GET" "/construction/projects" "" "List construction projects"
test_endpoint "GET" "/construction/operations" "" "List operations"
test_endpoint "GET" "/construction/accounts" "" "List construction accounts"
test_endpoint "GET" "/construction/accruals" "" "List construction accruals"
test_endpoint "GET" "/construction/contracts-sales" "" "List contracts/sales"
test_endpoint "GET" "/construction/analytics/summary" "" "Analytics summary"
echo ""

# 8. Reports
echo "=== 8. Reports Module ==="
test_endpoint "GET" "/api/reports/rental-summary" "" "Rental summary report"
test_endpoint "GET" "/api/reports/cashflow" "" "Cashflow report"
test_endpoint "GET" "/api/reports/payments" "" "Payments report"
test_endpoint "GET" "/api/reports/debt" "" "Debt report"
echo ""

# 9. Dashboard
echo "=== 9. Dashboard ==="
test_endpoint "GET" "/api/dashboard/stats" "" "Dashboard stats"
echo ""

# 10. Other modules
echo "=== 10. Other Modules ==="
test_endpoint "GET" "/api/counterparties" "" "List counterparties"
test_endpoint "GET" "/api/categories" "" "List categories"
test_endpoint "GET" "/api/activity" "" "Activity log"
test_endpoint "GET" "/api/notifications" "" "Notifications"
echo ""

echo "=== Test Complete ==="
echo "Check results above for any failures."
