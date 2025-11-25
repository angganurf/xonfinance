#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any

class XONArchitectAPITester:
    def __init__(self, base_url="https://xon-management.preview.emergentagent.com"):
        self.base_url = base_url
        self.session_token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.project_id = None
        self.rab_item_id = None
        self.task_id = None

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

    def make_request(self, method: str, endpoint: str, data: Dict[Any, Any] = None, expected_status: int = 200) -> tuple:
        """Make HTTP request with proper headers"""
        url = f"{self.base_url}/api{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.session_token:
            headers['Authorization'] = f'Bearer {self.session_token}'

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

    def test_health_check(self):
        """Test API health"""
        success, data = self.make_request('GET', '/')
        self.log_test("API Health Check", success, f"Response: {data}")
        return success

    def test_register_user(self):
        """Test user registration"""
        timestamp = int(datetime.now().timestamp())
        user_data = {
            "email": f"test.accounting.{timestamp}@example.com",
            "password": "TestPass123!",
            "name": f"Test Accounting User {timestamp}",
            "role": "accounting"
        }
        
        success, data = self.make_request('POST', '/auth/register', user_data, 200)
        if success:
            self.user_email = user_data["email"]
            self.user_password = user_data["password"]
        
        self.log_test("User Registration", success, f"User: {user_data['email']}")
        return success

    def test_login_user(self):
        """Test user login"""
        login_data = {
            "email": self.user_email,
            "password": self.user_password
        }
        
        success, data = self.make_request('POST', '/auth/login', login_data, 200)
        if success and 'session_token' in data:
            self.session_token = data['session_token']
            self.user_id = data['user']['id']
        
        self.log_test("User Login", success, f"Token received: {bool(self.session_token)}")
        return success

    def test_get_current_user(self):
        """Test get current user endpoint"""
        success, data = self.make_request('GET', '/auth/me')
        self.log_test("Get Current User", success, f"User ID: {data.get('id', 'N/A')}")
        return success

    def test_create_project(self):
        """Test project creation"""
        project_data = {
            "name": f"Test Project {datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "type": "interior",
            "description": "Test project for automated testing",
            "contract_date": "2024-01-15",
            "duration": 30,
            "location": "Jakarta"
        }
        
        success, data = self.make_request('POST', '/projects', project_data, 200)
        if success and 'id' in data:
            self.project_id = data['id']
        
        self.log_test("Create Project", success, f"Project ID: {self.project_id}")
        return success

    def test_get_projects(self):
        """Test get projects"""
        success, data = self.make_request('GET', '/projects')
        project_count = len(data) if isinstance(data, list) else 0
        self.log_test("Get Projects", success, f"Projects found: {project_count}")
        return success

    def test_create_rab_item(self):
        """Test RAB item creation"""
        if not self.project_id:
            self.log_test("Create RAB Item", False, "No project ID available")
            return False
            
        rab_data = {
            "project_id": self.project_id,
            "category": "persiapan",
            "description": "Pembersihan lokasi",
            "unit_price": 50000.0,
            "quantity": 10.0,
            "unit": "m2"
        }
        
        success, data = self.make_request('POST', '/rab', rab_data, 200)
        if success and 'id' in data:
            self.rab_item_id = data['id']
        
        self.log_test("Create RAB Item", success, f"RAB Item ID: {self.rab_item_id}")
        return success

    def test_get_rab_items(self):
        """Test get RAB items"""
        if not self.project_id:
            self.log_test("Get RAB Items", False, "No project ID available")
            return False
            
        success, data = self.make_request('GET', f'/rab/{self.project_id}')
        item_count = len(data) if isinstance(data, list) else 0
        self.log_test("Get RAB Items", success, f"RAB items found: {item_count}")
        return success

    def test_create_transaction(self):
        """Test transaction creation"""
        if not self.project_id:
            self.log_test("Create Transaction", False, "No project ID available")
            return False
            
        transaction_data = {
            "project_id": self.project_id,
            "category": "bahan",
            "description": "Pembelian semen",
            "amount": 500000.0,
            "quantity": 10.0,
            "unit": "sak",
            "transaction_date": "2024-01-15"
        }
        
        success, data = self.make_request('POST', '/transactions', transaction_data, 200)
        self.log_test("Create Transaction", success, f"Transaction created: {success}")
        return success

    def test_get_transactions(self):
        """Test get transactions"""
        success, data = self.make_request('GET', '/transactions')
        transaction_count = len(data) if isinstance(data, list) else 0
        self.log_test("Get Transactions", success, f"Transactions found: {transaction_count}")
        return success

    def test_financial_summary(self):
        """Test financial summary"""
        success, data = self.make_request('GET', '/financial/summary')
        has_required_fields = all(key in data for key in ['cash_balance', 'net_profit', 'total_assets']) if success else False
        self.log_test("Financial Summary", success and has_required_fields, f"Summary data complete: {has_required_fields}")
        return success and has_required_fields

    def test_create_schedule_item(self):
        """Test schedule item creation"""
        if not self.project_id:
            self.log_test("Create Schedule Item", False, "No project ID available")
            return False
            
        schedule_data = {
            "project_id": self.project_id,
            "description": "Persiapan lokasi",
            "value": 1000000.0,
            "duration_days": 5,
            "start_week": 1
        }
        
        success, data = self.make_request('POST', '/schedule', schedule_data, 200)
        self.log_test("Create Schedule Item", success, f"Schedule item created: {success}")
        return success

    def test_get_schedule_items(self):
        """Test get schedule items"""
        if not self.project_id:
            self.log_test("Get Schedule Items", False, "No project ID available")
            return False
            
        success, data = self.make_request('GET', f'/schedule/{self.project_id}')
        item_count = len(data) if isinstance(data, list) else 0
        self.log_test("Get Schedule Items", success, f"Schedule items found: {item_count}")
        return success

    def test_create_task(self):
        """Test task creation"""
        if not self.project_id:
            self.log_test("Create Task", False, "No project ID available")
            return False
            
        task_data = {
            "project_id": self.project_id,
            "title": "Test Task",
            "description": "This is a test task",
            "assigned_to": self.user_id,
            "due_date": "2024-02-15"
        }
        
        success, data = self.make_request('POST', '/tasks', task_data, 200)
        if success and 'id' in data:
            self.task_id = data['id']
        
        self.log_test("Create Task", success, f"Task ID: {self.task_id}")
        return success

    def test_get_tasks(self):
        """Test get tasks"""
        success, data = self.make_request('GET', f'/tasks?assigned_to={self.user_id}')
        task_count = len(data) if isinstance(data, list) else 0
        self.log_test("Get Tasks", success, f"Tasks found: {task_count}")
        return success

    def test_get_users(self):
        """Test get users"""
        success, data = self.make_request('GET', '/users')
        user_count = len(data) if isinstance(data, list) else 0
        self.log_test("Get Users", success, f"Users found: {user_count}")
        return success

    def test_get_notifications(self):
        """Test get notifications"""
        success, data = self.make_request('GET', '/notifications')
        notification_count = len(data) if isinstance(data, list) else 0
        self.log_test("Get Notifications", success, f"Notifications found: {notification_count}")
        return success

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting XON Architect API Tests")
        print("=" * 50)
        
        # Authentication tests
        if not self.test_health_check():
            print("❌ API is not responding. Stopping tests.")
            return False
            
        if not self.test_register_user():
            print("❌ User registration failed. Stopping tests.")
            return False
            
        if not self.test_login_user():
            print("❌ User login failed. Stopping tests.")
            return False
            
        self.test_get_current_user()
        
        # Core functionality tests
        self.test_create_project()
        self.test_get_projects()
        
        # RAB tests
        self.test_create_rab_item()
        self.test_get_rab_items()
        
        # Transaction tests
        self.test_create_transaction()
        self.test_get_transactions()
        
        # Financial tests
        self.test_financial_summary()
        
        # Schedule tests
        self.test_create_schedule_item()
        self.test_get_schedule_items()
        
        # Task tests
        self.test_create_task()
        self.test_get_tasks()
        
        # User management tests
        self.test_get_users()
        self.test_get_notifications()
        
        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    tester = XONArchitectAPITester()
    success = tester.run_all_tests()
    
    # Save detailed results
    with open('/app/test_reports/backend_test_results.json', 'w') as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "total_tests": tester.tests_run,
            "passed_tests": tester.tests_passed,
            "success_rate": (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0,
            "test_results": tester.test_results
        }, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())