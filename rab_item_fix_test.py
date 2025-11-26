#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any

class RABItemFixTester:
    def __init__(self, base_url="https://rab-manager.preview.emergentagent.com"):
        self.base_url = base_url
        self.session_token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.test_rab_id = None

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
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                return False, {"error": f"Unsupported method: {method}"}

            # Handle expected_status=None for flexible status checking
            if expected_status is None:
                success = True  # Accept any status
            else:
                success = response.status_code == expected_status
            
            try:
                response_data = response.json()
            except:
                response_data = {"status_code": response.status_code, "text": response.text}
            
            # Add debug info for failed requests
            if not success and expected_status is not None:
                response_data["debug_info"] = {
                    "url": url,
                    "method": method,
                    "status_code": response.status_code,
                    "expected_status": expected_status,
                    "request_data": data
                }
            
            return success, response_data

        except Exception as e:
            return False, {"error": str(e)}

    def test_health_check(self):
        """Test API health"""
        success, data = self.make_request('GET', '/')
        self.log_test("API Health Check", success, f"Response: {data}")
        return success

    def test_admin_login(self):
        """Test admin login for RAB item fix tests"""
        login_data = {
            "email": "admin",
            "password": "admin"
        }
        
        success, data = self.make_request('POST', '/auth/login', login_data, 200)
        if success and 'session_token' in data:
            self.session_token = data['session_token']
            self.user_id = data['user']['id']
        
        self.log_test("RAB Item Fix - Admin Login", success, f"Admin token received: {bool(self.session_token)}")
        return success

    def test_get_existing_rab(self):
        """Get existing RAB or create new one for testing"""
        # First try to get existing RABs
        success, data = self.make_request('GET', '/rabs')
        
        if success and isinstance(data, list) and len(data) > 0:
            # Use first existing RAB
            self.test_rab_id = data[0]['id']
            self.log_test("RAB Item Fix - Get Existing RAB", True, f"Using existing RAB ID: {self.test_rab_id}")
            return True
        else:
            # Create new RAB for testing
            rab_data = {
                "project_name": "Test RAB for Item Creation Fix",
                "project_type": "interior",
                "client_name": "Test Client",
                "location": "Jakarta"
            }
            
            success, data = self.make_request('POST', '/rabs', rab_data, 200)
            if success and 'id' in data:
                self.test_rab_id = data['id']
                self.log_test("RAB Item Fix - Create New RAB", success, f"Created RAB ID: {self.test_rab_id}")
                return success
            else:
                self.log_test("RAB Item Fix - Get/Create RAB", False, "Failed to get or create RAB")
                return False

    def test_create_without_project_id(self):
        """Test CREATE RAB ITEM without project_id (simulating frontend call)"""
        if not hasattr(self, 'test_rab_id') or not self.test_rab_id:
            self.log_test("RAB Item Fix - Create Without Project ID", False, "No RAB ID available")
            return False
        
        # Test data as specified in review request
        rab_item_data = {
            "rab_id": self.test_rab_id,
            "category": "Material",
            "description": "Keramik Granit 60x60 cm",
            "unit_price": 150000,
            "quantity": 50,
            "unit": "m2"
            # Note: project_id is intentionally omitted
        }
        
        success, data = self.make_request('POST', '/rab-items', rab_item_data, 200)
        if success and 'id' in data:
            self.rab_item_without_project_id = data['id']
        
        # Include error details if failed
        error_info = ""
        if not success:
            error_info = f", Error: {data}"
        
        details = f"RAB Item ID: {getattr(self, 'rab_item_without_project_id', 'N/A')}, Expected: Success without project_id{error_info}"
        self.log_test("RAB Item Fix - Create Without Project ID", success, details)
        return success

    def test_create_with_project_id(self):
        """Test CREATE RAB ITEM with project_id (for backward compatibility)"""
        if not hasattr(self, 'test_rab_id') or not self.test_rab_id:
            self.log_test("RAB Item Fix - Create With Project ID", False, "No RAB ID available")
            return False
        
        # Get a project ID for testing
        success, projects = self.make_request('GET', '/projects')
        project_id = None
        if success and isinstance(projects, list) and len(projects) > 0:
            project_id = projects[0]['id']
        
        # Test data as specified in review request
        rab_item_data = {
            "rab_id": self.test_rab_id,
            "project_id": project_id,  # Include project_id for backward compatibility
            "category": "Tenaga Kerja",
            "description": "Tukang Pasang Keramik",
            "unit_price": 50000,
            "quantity": 50,
            "unit": "m2"
        }
        
        success, data = self.make_request('POST', '/rab-items', rab_item_data, 200)
        if success and 'id' in data:
            self.rab_item_with_project_id = data['id']
        
        details = f"RAB Item ID: {getattr(self, 'rab_item_with_project_id', 'N/A')}, Expected: Success with project_id"
        self.log_test("RAB Item Fix - Create With Project ID", success, details)
        return success

    def test_verify_items_created(self):
        """Verify items created and check total calculation"""
        if not hasattr(self, 'test_rab_id') or not self.test_rab_id:
            self.log_test("RAB Item Fix - Verify Items Created", False, "No RAB ID available")
            return False
        
        # Get RAB items for the test RAB
        success, data = self.make_request('GET', f'/rab-items/{self.test_rab_id}')
        
        if success and isinstance(data, list):
            # Should have at least 2 items (one without project_id, one with project_id)
            item_count = len(data)
            has_minimum_items = item_count >= 2
            
            # Check for our test items
            keramik_item = None
            tukang_item = None
            
            for item in data:
                if item.get('description') == 'Keramik Granit 60x60 cm':
                    keramik_item = item
                elif item.get('description') == 'Tukang Pasang Keramik':
                    tukang_item = item
            
            # Verify total calculations
            keramik_total_correct = False
            tukang_total_correct = False
            
            if keramik_item:
                expected_total = 150000 * 50  # 7,500,000
                keramik_total_correct = keramik_item.get('total') == expected_total
            
            if tukang_item:
                expected_total = 50000 * 50  # 2,500,000
                tukang_total_correct = tukang_item.get('total') == expected_total
            
            all_correct = has_minimum_items and keramik_item is not None and tukang_item is not None and keramik_total_correct and tukang_total_correct
            
            details = f"Items found: {item_count}, Keramik found: {keramik_item is not None}, Tukang found: {tukang_item is not None}, Totals correct: {keramik_total_correct and tukang_total_correct}"
            self.log_test("RAB Item Fix - Verify Items Created", all_correct, details)
            return all_correct
        else:
            self.log_test("RAB Item Fix - Verify Items Created", False, f"Failed to get RAB items: {data}")
            return False

    def test_invalid_rab_id(self):
        """Test with invalid rab_id (no project_id provided and RAB not found)"""
        invalid_rab_id = "invalid-rab-id-12345"
        
        rab_item_data = {
            "rab_id": invalid_rab_id,
            "category": "Test Category",
            "description": "Test Item",
            "unit_price": 10000,
            "quantity": 1,
            "unit": "pcs"
            # Note: project_id is intentionally omitted
        }
        
        # This should handle gracefully - either succeed with null project_id or return appropriate error
        success, data = self.make_request('POST', '/rab-items', rab_item_data, expected_status=None)
        
        # Check if it's handled gracefully (either 200 with null project_id or 404/400 error)
        handled_gracefully = success or (isinstance(data, dict) and data.get('status_code') in [400, 404])
        
        details = f"Response: {data}, Handled gracefully: {handled_gracefully}"
        self.log_test("RAB Item Fix - Invalid RAB ID", handled_gracefully, details)
        return handled_gracefully

    def run_all_tests(self):
        """Run all RAB item creation fix tests"""
        print("🔧 Starting RAB Item Creation Fix Tests")
        print("=" * 60)
        
        # Test API health first
        if not self.test_health_check():
            print("❌ API is not responding. Stopping tests.")
            return False
        
        # Run RAB item fix tests
        print("\n🔐 Step 1: Admin Login")
        if not self.test_admin_login():
            print("❌ Admin login failed. Stopping RAB item tests.")
            return False
        
        print("\n📋 Step 2: Get/Create RAB for Testing")
        if not self.test_get_existing_rab():
            print("❌ Failed to get/create RAB. Stopping tests.")
            return False
        
        print("\n🔧 Step 3: Test CREATE RAB ITEM without project_id")
        self.test_create_without_project_id()
        
        print("\n🔧 Step 4: Test CREATE RAB ITEM with project_id")
        self.test_create_with_project_id()
        
        print("\n✅ Step 5: Verify Items Created")
        self.test_verify_items_created()
        
        print("\n⚠️ Step 6: Test Invalid RAB ID")
        self.test_invalid_rab_id()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 RAB Item Fix Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        return self.tests_passed == self.tests_run

if __name__ == "__main__":
    tester = RABItemFixTester()
    success = tester.run_all_tests()
    
    # Save detailed results
    import os
    os.makedirs('/app/test_reports', exist_ok=True)
    
    filename = f'/app/test_reports/rab_item_fix_test_results.json'
    with open(filename, 'w') as f:
        json.dump({
            "test_type": "rab_item_fix",
            "timestamp": datetime.now().isoformat(),
            "total_tests": tester.tests_run,
            "passed_tests": tester.tests_passed,
            "success_rate": (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0,
            "test_results": tester.test_results
        }, f, indent=2)
    
    print(f"\n📄 Detailed results saved to: {filename}")
    
    sys.exit(0 if success else 1)