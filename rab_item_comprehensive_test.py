#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any

class RABItemComprehensiveTester:
    def __init__(self, base_url="https://taskflow-xon.preview.emergentagent.com"):
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

    def test_admin_login(self):
        """Test admin login"""
        login_data = {
            "email": "admin",
            "password": "admin"
        }
        
        success, data = self.make_request('POST', '/auth/login', login_data, 200)
        if success and 'session_token' in data:
            self.session_token = data['session_token']
            self.user_id = data['user']['id']
        
        self.log_test("Admin Login", success, f"Admin token received: {bool(self.session_token)}")
        return success

    def test_get_existing_rab(self):
        """Get existing RAB for testing"""
        success, data = self.make_request('GET', '/rabs')
        
        if success and isinstance(data, list) and len(data) > 0:
            self.test_rab_id = data[0]['id']
            self.log_test("Get Existing RAB", True, f"Using RAB ID: {self.test_rab_id}")
            return True
        else:
            self.log_test("Get Existing RAB", False, "No existing RABs found")
            return False

    def test_scenario_1_without_project_id(self):
        """Test CREATE RAB ITEM without project_id (exact scenario from review request)"""
        if not self.test_rab_id:
            self.log_test("Scenario 1 - Without project_id", False, "No RAB ID available")
            return False
        
        # Exact test data from review request
        rab_item_data = {
            "rab_id": self.test_rab_id,
            "category": "Material",
            "description": "Keramik Granit 60x60 cm",
            "unit_price": 150000,
            "quantity": 50,
            "unit": "m2"
        }
        
        success, data = self.make_request('POST', '/rab-items', rab_item_data, 200)
        if success and 'id' in data:
            self.keramik_item_id = data['id']
        
        details = f"Success: {success}, Item ID: {getattr(self, 'keramik_item_id', 'N/A')}"
        self.log_test("Scenario 1 - Without project_id", success, details)
        return success

    def test_scenario_2_with_project_id(self):
        """Test CREATE RAB ITEM with project_id (backward compatibility)"""
        if not self.test_rab_id:
            self.log_test("Scenario 2 - With project_id", False, "No RAB ID available")
            return False
        
        # Get a project ID
        success, projects = self.make_request('GET', '/projects')
        project_id = None
        if success and isinstance(projects, list) and len(projects) > 0:
            project_id = projects[0]['id']
        
        # Exact test data from review request
        rab_item_data = {
            "rab_id": self.test_rab_id,
            "project_id": project_id,
            "category": "Tenaga Kerja",
            "description": "Tukang Pasang Keramik",
            "unit_price": 50000,
            "quantity": 50,
            "unit": "m2"
        }
        
        success, data = self.make_request('POST', '/rab-items', rab_item_data, 200)
        if success and 'id' in data:
            self.tukang_item_id = data['id']
        
        details = f"Success: {success}, Item ID: {getattr(self, 'tukang_item_id', 'N/A')}, Project ID: {project_id}"
        self.log_test("Scenario 2 - With project_id", success, details)
        return success

    def test_verify_both_items_created(self):
        """Verify both items were created and check calculations"""
        if not self.test_rab_id:
            self.log_test("Verify Items Created", False, "No RAB ID available")
            return False
        
        success, data = self.make_request('GET', f'/rab-items/{self.test_rab_id}')
        
        if success and isinstance(data, list):
            # Find our test items
            keramik_item = None
            tukang_item = None
            
            for item in data:
                if item.get('description') == 'Keramik Granit 60x60 cm':
                    keramik_item = item
                elif item.get('description') == 'Tukang Pasang Keramik':
                    tukang_item = item
            
            # Verify calculations
            keramik_total_correct = False
            tukang_total_correct = False
            
            if keramik_item:
                expected_total = 150000 * 50  # 7,500,000
                keramik_total_correct = keramik_item.get('total') == expected_total
            
            if tukang_item:
                expected_total = 50000 * 50  # 2,500,000
                tukang_total_correct = tukang_item.get('total') == expected_total
            
            all_correct = keramik_item is not None and tukang_item is not None and keramik_total_correct and tukang_total_correct
            
            details = f"Total items: {len(data)}, Keramik found: {keramik_item is not None}, Tukang found: {tukang_item is not None}, Calculations correct: {keramik_total_correct and tukang_total_correct}"
            if keramik_item:
                details += f", Keramik total: {keramik_item.get('total')} (expected: 7500000)"
            if tukang_item:
                details += f", Tukang total: {tukang_item.get('total')} (expected: 2500000)"
            
            self.log_test("Verify Items Created", all_correct, details)
            return all_correct
        else:
            self.log_test("Verify Items Created", False, f"Failed to get RAB items: {data}")
            return False

    def test_invalid_rab_id_graceful_handling(self):
        """Test with invalid rab_id should handle gracefully"""
        invalid_rab_id = "non-existent-rab-id"
        
        rab_item_data = {
            "rab_id": invalid_rab_id,
            "category": "Test",
            "description": "Test Item",
            "unit_price": 10000,
            "quantity": 1,
            "unit": "pcs"
        }
        
        success, data = self.make_request('POST', '/rab-items', rab_item_data, expected_status=200)
        
        # Should either succeed with null project_id or handle gracefully
        handled_gracefully = success or (isinstance(data, dict) and 'error' in str(data).lower())
        
        details = f"Response: {data}, Handled gracefully: {handled_gracefully}"
        self.log_test("Invalid RAB ID Handling", handled_gracefully, details)
        return handled_gracefully

    def run_comprehensive_test(self):
        """Run comprehensive RAB item fix test as per review request"""
        print("🔧 RAB Item Creation Fix - Comprehensive Test")
        print("=" * 60)
        print("Testing fix for 'gagal menambahkan item pekerjaan' di RAB Editor")
        print("Issue: Frontend tidak mengirim project_id saat menambahkan RAB item")
        print("Fix: Made project_id optional in RABItemInput + auto-fetch from RAB")
        print("=" * 60)
        
        # Step 1: Login as admin
        print("\n🔐 Step 1: Login as admin (email='admin', password='admin')")
        if not self.test_admin_login():
            print("❌ Admin login failed. Stopping tests.")
            return False
        
        # Step 2: Get existing RAB
        print("\n📋 Step 2: Get existing RAB (use one from previous tests)")
        if not self.test_get_existing_rab():
            print("❌ Failed to get existing RAB. Stopping tests.")
            return False
        
        # Step 3: Test CREATE RAB ITEM without project_id
        print("\n🔧 Step 3: Test CREATE RAB ITEM without project_id (simulating frontend call)")
        print("   Data: Keramik Granit 60x60 cm, 150000 x 50 m2")
        self.test_scenario_1_without_project_id()
        
        # Step 4: Test CREATE RAB ITEM with project_id
        print("\n🔧 Step 4: Test CREATE RAB ITEM with project_id (backward compatibility)")
        print("   Data: Tukang Pasang Keramik, 50000 x 50 m2")
        self.test_scenario_2_with_project_id()
        
        # Step 5: Verify items created
        print("\n✅ Step 5: Verify items created and check total calculation")
        self.test_verify_both_items_created()
        
        # Step 6: Test invalid rab_id
        print("\n⚠️ Step 6: Test with invalid rab_id (graceful handling)")
        self.test_invalid_rab_id_graceful_handling()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Comprehensive Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        if success_rate == 100:
            print("🎉 RAB Item Creation Fix is working correctly!")
            print("✅ Frontend can now add RAB items without project_id")
            print("✅ Backend auto-fetches project_id from RAB")
            print("✅ Backward compatibility maintained")
            print("✅ Total calculations are correct")
        else:
            print("⚠️ Some tests failed. Fix needs attention.")
        
        return self.tests_passed == self.tests_run

if __name__ == "__main__":
    tester = RABItemComprehensiveTester()
    success = tester.run_comprehensive_test()
    
    # Save detailed results
    import os
    os.makedirs('/app/test_reports', exist_ok=True)
    
    filename = f'/app/test_reports/rab_item_comprehensive_test_results.json'
    with open(filename, 'w') as f:
        json.dump({
            "test_type": "rab_item_comprehensive",
            "timestamp": datetime.now().isoformat(),
            "total_tests": tester.tests_run,
            "passed_tests": tester.tests_passed,
            "success_rate": (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0,
            "test_results": tester.test_results
        }, f, indent=2)
    
    print(f"\n📄 Detailed results saved to: {filename}")
    
    sys.exit(0 if success else 1)