#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any, Optional

class AuthenticationTester:
    def __init__(self, base_url="https://xon-project-hub.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.tokens = {}  # Store tokens for different users
        
        # Test users from the review request
        self.test_users = [
            {"email": "idrus@gmail.com", "password": "password123", "expected_role": "accounting"},
            {"email": "khoer@gmail.com", "password": "password123", "expected_role": "estimator"},
            {"email": "faisal1@gmail.com", "password": "password123", "expected_role": "site_supervisor"},
            {"email": "faisal@gmail.com", "password": "password123", "expected_role": "employee"},
            {"email": "admin", "password": "admin", "expected_role": "admin"}
        ]

    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test_name": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    Details: {details}")

    def make_request(self, method: str, endpoint: str, data: Dict[Any, Any] = None, 
                    expected_status: int = 200, token: Optional[str] = None) -> tuple:
        """Make HTTP request with proper headers"""
        url = f"{self.base_url}/api{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if token:
            headers['Authorization'] = f'Bearer {token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                return False, {"error": f"Unsupported method: {method}"}

            success = response.status_code == expected_status
            
            try:
                response_data = response.json()
            except:
                response_data = {"status_code": response.status_code, "text": response.text}
            
            return success, response_data

        except Exception as e:
            return False, {"error": str(e)}

    def test_api_health(self):
        """Test API health check"""
        success, data = self.make_request('GET', '/')
        expected_fields = ["message", "status"]
        has_expected = all(field in data for field in expected_fields) if success else False
        
        self.log_test("API Health Check", 
                     success and has_expected, 
                     f"Response: {data}")
        return success and has_expected

    def test_user_login(self, email: str, password: str, expected_role: str):
        """Test login for a specific user"""
        login_data = {
            "email": email,
            "password": password
        }
        
        success, data = self.make_request('POST', '/auth/login', login_data, 200)
        
        if success:
            # Check if response has required fields
            required_fields = ["message", "user", "session_token", "token"]
            has_required = all(field in data for field in required_fields)
            
            if has_required:
                user_data = data.get("user", {})
                actual_role = user_data.get("role")
                role_matches = actual_role == expected_role
                
                # Store token for later use
                self.tokens[email] = data.get("session_token")
                
                details = f"Email: {email}, Expected role: {expected_role}, Actual role: {actual_role}, Token received: {bool(data.get('session_token'))}"
                self.log_test(f"Login - {email}", 
                             success and has_required and role_matches, 
                             details)
                return success and has_required and role_matches
            else:
                self.log_test(f"Login - {email}", False, f"Missing required fields in response: {data}")
                return False
        else:
            self.log_test(f"Login - {email}", False, f"Login failed: {data}")
            return False

    def test_get_current_user(self, email: str, expected_role: str):
        """Test get current user with token"""
        token = self.tokens.get(email)
        if not token:
            self.log_test(f"Get Current User - {email}", False, "No token available")
            return False
        
        success, data = self.make_request('GET', '/auth/me', token=token)
        
        if success:
            actual_role = data.get("role")
            email_matches = data.get("email") == email
            role_matches = actual_role == expected_role
            
            details = f"Email: {email}, Expected role: {expected_role}, Actual role: {actual_role}, Email matches: {email_matches}"
            self.log_test(f"Get Current User - {email}", 
                         success and email_matches and role_matches, 
                         details)
            return success and email_matches and role_matches
        else:
            self.log_test(f"Get Current User - {email}", False, f"Request failed: {data}")
            return False

    def test_recent_transactions_with_project_name(self):
        """Test /transactions/recent endpoint to verify project_name field"""
        # Use admin token for this test
        admin_token = self.tokens.get("admin")
        if not admin_token:
            self.log_test("Recent Transactions - Project Name", False, "No admin token available")
            return False
        
        success, data = self.make_request('GET', '/transactions/recent', token=admin_token)
        
        if success and isinstance(data, list):
            if len(data) > 0:
                # Check if all transactions have project_name field
                all_have_project_name = all("project_name" in transaction for transaction in data)
                sample_transaction = data[0] if data else {}
                
                details = f"Transactions found: {len(data)}, All have project_name: {all_have_project_name}, Sample: {sample_transaction.get('project_name', 'N/A')}"
                self.log_test("Recent Transactions - Project Name", 
                             success and all_have_project_name, 
                             details)
                return success and all_have_project_name
            else:
                # No transactions found, but endpoint works
                self.log_test("Recent Transactions - Project Name", True, "No transactions found, but endpoint works")
                return True
        else:
            self.log_test("Recent Transactions - Project Name", False, f"Request failed or invalid response: {data}")
            return False

    def test_authentication_with_invalid_token(self):
        """Test endpoint with invalid token"""
        invalid_token = "invalid-token-12345"
        success, data = self.make_request('GET', '/auth/me', token=invalid_token, expected_status=401)
        
        details = f"Expected 401 status, got: {data.get('status_code', 'unknown')}"
        self.log_test("Authentication - Invalid Token", success, details)
        return success

    def test_authentication_without_token(self):
        """Test protected endpoint without token"""
        success, data = self.make_request('GET', '/auth/me', expected_status=401)
        
        details = f"Expected 401 status, got: {data.get('status_code', 'unknown')}"
        self.log_test("Authentication - No Token", success, details)
        return success

    def test_protected_endpoint_with_valid_token(self):
        """Test protected endpoint with valid token"""
        # Use admin token
        admin_token = self.tokens.get("admin")
        if not admin_token:
            self.log_test("Protected Endpoint - Valid Token", False, "No admin token available")
            return False
        
        success, data = self.make_request('GET', '/projects', token=admin_token)
        
        details = f"Projects endpoint accessible: {success}, Response type: {type(data)}"
        self.log_test("Protected Endpoint - Valid Token", success, details)
        return success

    def run_authentication_tests(self):
        """Run all authentication tests"""
        print("🔐 Starting Authentication Tests")
        print("=" * 60)
        
        # Test API health first
        if not self.test_api_health():
            print("❌ API health check failed. Stopping tests.")
            return False
        
        # Test login for all users
        print("\n📝 Testing User Logins:")
        login_results = []
        for user in self.test_users:
            result = self.test_user_login(user["email"], user["password"], user["expected_role"])
            login_results.append(result)
        
        # Test get current user for all logged in users
        print("\n👤 Testing Get Current User:")
        for user in self.test_users:
            if self.tokens.get(user["email"]):  # Only test if login was successful
                self.test_get_current_user(user["email"], user["expected_role"])
        
        # Test recent transactions endpoint
        print("\n💰 Testing Recent Transactions:")
        self.test_recent_transactions_with_project_name()
        
        # Test authentication scenarios
        print("\n🔒 Testing Authentication Scenarios:")
        self.test_authentication_with_invalid_token()
        self.test_authentication_without_token()
        self.test_protected_endpoint_with_valid_token()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Authentication Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        # Print token status
        print(f"\n🎫 Tokens obtained: {len(self.tokens)}/{len(self.test_users)}")
        for email, token in self.tokens.items():
            print(f"   - {email}: {'✅' if token else '❌'}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = AuthenticationTester()
    success = tester.run_authentication_tests()
    
    # Save detailed results
    try:
        with open('/app/auth_test_results.json', 'w') as f:
            json.dump({
                "timestamp": datetime.now().isoformat(),
                "total_tests": tester.tests_run,
                "passed_tests": tester.tests_passed,
                "success_rate": (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0,
                "tokens_obtained": len(tester.tokens),
                "test_results": tester.test_results
            }, f, indent=2)
    except Exception as e:
        print(f"Warning: Could not save test results: {e}")
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())