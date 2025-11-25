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
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                return False, {"error": f"Unsupported method: {method}"}

            success = response.status_code == expected_status
            
            try:
                response_data = response.json()
            except:
                response_data = {"status_code": response.status_code, "text": response.text}
            
            # Add debug info for failed requests
            if not success:
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

    # ============= INVENTORY TESTS =============
    
    def test_admin_login(self):
        """Test admin login for inventory tests"""
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

    def test_get_inventory_empty(self):
        """Test get inventory when empty"""
        success, data = self.make_request('GET', '/inventory')
        inventory_count = len(data) if isinstance(data, list) else 0
        self.log_test("Get Inventory (Empty)", success, f"Inventory items found: {inventory_count}")
        return success

    def test_get_inventory_with_filter(self):
        """Test get inventory with category filter"""
        success, data = self.make_request('GET', '/inventory?category=bahan')
        inventory_count = len(data) if isinstance(data, list) else 0
        self.log_test("Get Inventory (Filter: bahan)", success, f"Bahan items found: {inventory_count}")
        return success

    def test_create_transaction_bahan_with_items(self):
        """Test creating transaction with bahan category and items array"""
        if not self.project_id:
            self.log_test("Create Transaction Bahan (Items)", False, "No project ID available")
            return False
            
        transaction_data = {
            "project_id": self.project_id,
            "category": "bahan",
            "description": "Pembelian bahan bangunan",
            "amount": 1000000,
            "items": [
                {
                    "description": "Semen 50kg",
                    "quantity": 20,
                    "unit": "sak",
                    "unit_price": 50000,
                    "total": 1000000
                }
            ],
            "transaction_date": "2025-01-15"
        }
        
        success, data = self.make_request('POST', '/transactions', transaction_data, 200)
        if success and 'id' in data:
            self.transaction_bahan_id = data['id']
        
        self.log_test("Create Transaction Bahan (Items)", success, f"Transaction ID: {getattr(self, 'transaction_bahan_id', 'N/A')}")
        return success

    def test_verify_inventory_created_from_bahan(self):
        """Test that inventory was created from bahan transaction"""
        success, data = self.make_request('GET', '/inventory')
        
        if success and isinstance(data, list):
            # Look for Semen 50kg item
            semen_item = None
            for item in data:
                if item.get('item_name') == 'Semen 50kg' and item.get('category') == 'bahan':
                    semen_item = item
                    break
            
            if semen_item:
                # Verify item details
                correct_quantity = semen_item.get('quantity') == 20
                correct_unit = semen_item.get('unit') == 'sak'
                correct_category = semen_item.get('category') == 'bahan'
                correct_status = semen_item.get('status') == 'Tersedia'
                
                all_correct = correct_quantity and correct_unit and correct_category and correct_status
                details = f"Semen item found - Qty: {semen_item.get('quantity')}, Unit: {semen_item.get('unit')}, Category: {semen_item.get('category')}, Status: {semen_item.get('status')}"
                self.log_test("Verify Inventory from Bahan", all_correct, details)
                return all_correct
            else:
                self.log_test("Verify Inventory from Bahan", False, "Semen 50kg item not found in inventory")
                return False
        else:
            self.log_test("Verify Inventory from Bahan", False, "Failed to get inventory data")
            return False

    def test_create_transaction_alat_single_item(self):
        """Test creating transaction with alat category (single item)"""
        if not self.project_id:
            self.log_test("Create Transaction Alat (Single)", False, "No project ID available")
            return False
            
        transaction_data = {
            "project_id": self.project_id,
            "category": "alat",
            "description": "Bor Listrik Makita",
            "amount": 2000000,
            "quantity": 2,
            "unit": "unit",
            "transaction_date": "2025-01-15"
        }
        
        success, data = self.make_request('POST', '/transactions', transaction_data, 200)
        if success and 'id' in data:
            self.transaction_alat_id = data['id']
        
        self.log_test("Create Transaction Alat (Single)", success, f"Transaction ID: {getattr(self, 'transaction_alat_id', 'N/A')}")
        return success

    def test_verify_inventory_created_from_alat(self):
        """Test that inventory was created from alat transaction"""
        success, data = self.make_request('GET', '/inventory')
        
        if success and isinstance(data, list):
            # Look for Bor Listrik Makita item
            bor_item = None
            for item in data:
                if item.get('item_name') == 'Bor Listrik Makita' and item.get('category') == 'alat':
                    bor_item = item
                    break
            
            if bor_item:
                # Verify item details
                correct_quantity = bor_item.get('quantity') == 2
                correct_unit = bor_item.get('unit') == 'unit'
                correct_category = bor_item.get('category') == 'alat'
                correct_unit_price = bor_item.get('unit_price') == 1000000  # 2000000 / 2
                
                all_correct = correct_quantity and correct_unit and correct_category and correct_unit_price
                details = f"Bor item found - Qty: {bor_item.get('quantity')}, Unit: {bor_item.get('unit')}, Category: {bor_item.get('category')}, Unit Price: {bor_item.get('unit_price')}"
                self.log_test("Verify Inventory from Alat", all_correct, details)
                return all_correct
            else:
                self.log_test("Verify Inventory from Alat", False, "Bor Listrik Makita item not found in inventory")
                return False
        else:
            self.log_test("Verify Inventory from Alat", False, "Failed to get inventory data")
            return False

    def test_create_duplicate_bahan_transaction(self):
        """Test creating another transaction with same bahan item to test quantity update"""
        if not self.project_id:
            self.log_test("Create Duplicate Bahan Transaction", False, "No project ID available")
            return False
            
        transaction_data = {
            "project_id": self.project_id,
            "category": "bahan",
            "description": "Pembelian semen tambahan",
            "amount": 500000,
            "items": [
                {
                    "description": "Semen 50kg",
                    "quantity": 10,
                    "unit": "sak",
                    "unit_price": 50000,
                    "total": 500000
                }
            ],
            "transaction_date": "2025-01-16"
        }
        
        success, data = self.make_request('POST', '/transactions', transaction_data, 200)
        if success and 'id' in data:
            self.transaction_bahan_duplicate_id = data['id']
        
        self.log_test("Create Duplicate Bahan Transaction", success, f"Transaction ID: {getattr(self, 'transaction_bahan_duplicate_id', 'N/A')}")
        return success

    def test_verify_inventory_quantity_updated(self):
        """Test that inventory quantity was updated (not new item created)"""
        success, data = self.make_request('GET', '/inventory')
        
        if success and isinstance(data, list):
            # Count Semen 50kg items and check quantity
            semen_items = [item for item in data if item.get('item_name') == 'Semen 50kg' and item.get('category') == 'bahan']
            
            if len(semen_items) == 1:
                # Should be only one item with updated quantity (20 + 10 = 30)
                semen_item = semen_items[0]
                expected_quantity = 30
                actual_quantity = semen_item.get('quantity')
                
                quantity_correct = actual_quantity == expected_quantity
                details = f"Semen items count: {len(semen_items)}, Expected qty: {expected_quantity}, Actual qty: {actual_quantity}"
                self.log_test("Verify Inventory Quantity Updated", quantity_correct, details)
                return quantity_correct
            else:
                self.log_test("Verify Inventory Quantity Updated", False, f"Expected 1 Semen item, found {len(semen_items)}")
                return False
        else:
            self.log_test("Verify Inventory Quantity Updated", False, "Failed to get inventory data")
            return False

    def test_get_specific_inventory_item(self):
        """Test get specific inventory item by ID"""
        # First get all inventory to find an item ID
        success, data = self.make_request('GET', '/inventory')
        
        if success and isinstance(data, list) and len(data) > 0:
            item_id = data[0].get('id')
            if item_id:
                success, item_data = self.make_request('GET', f'/inventory/{item_id}')
                has_project_name = 'project_name' in item_data if success else False
                details = f"Item ID: {item_id}, Has project_name: {has_project_name}"
                self.log_test("Get Specific Inventory Item", success and has_project_name, details)
                return success and has_project_name
            else:
                self.log_test("Get Specific Inventory Item", False, "No item ID found")
                return False
        else:
            self.log_test("Get Specific Inventory Item", False, "No inventory items available")
            return False

    def test_update_inventory_item(self):
        """Test updating inventory item"""
        # First get all inventory to find an item ID
        success, data = self.make_request('GET', '/inventory')
        
        if success and isinstance(data, list) and len(data) > 0:
            item_id = data[0].get('id')
            if item_id:
                update_data = {
                    "quantity": 50,
                    "status": "Dipinjam"
                }
                success, response = self.make_request('PUT', f'/inventory/{item_id}', update_data)
                self.log_test("Update Inventory Item", success, f"Item ID: {item_id}, Updated quantity and status")
                return success
            else:
                self.log_test("Update Inventory Item", False, "No item ID found")
                return False
        else:
            self.log_test("Update Inventory Item", False, "No inventory items available")
            return False

    def test_delete_transaction_removes_inventory(self):
        """Test that deleting transaction removes related inventory"""
        if not hasattr(self, 'transaction_alat_id'):
            self.log_test("Delete Transaction Removes Inventory", False, "No alat transaction ID available")
            return False
        
        # First verify the Bor item exists
        success, data = self.make_request('GET', '/inventory')
        bor_exists_before = False
        if success and isinstance(data, list):
            for item in data:
                if item.get('item_name') == 'Bor Listrik Makita':
                    bor_exists_before = True
                    break
        
        if not bor_exists_before:
            self.log_test("Delete Transaction Removes Inventory", False, "Bor item not found before deletion")
            return False
        
        # Delete the transaction
        success, response = self.make_request('DELETE', f'/transactions/{self.transaction_alat_id}')
        
        if success:
            # Verify the Bor item is removed from inventory
            success, data = self.make_request('GET', '/inventory')
            bor_exists_after = False
            if success and isinstance(data, list):
                for item in data:
                    if item.get('item_name') == 'Bor Listrik Makita':
                        bor_exists_after = True
                        break
            
            inventory_removed = not bor_exists_after
            details = f"Bor existed before: {bor_exists_before}, Bor exists after: {bor_exists_after}"
            self.log_test("Delete Transaction Removes Inventory", inventory_removed, details)
            return inventory_removed
        else:
            self.log_test("Delete Transaction Removes Inventory", False, "Failed to delete transaction")
            return False

    def test_delete_inventory_item(self):
        """Test deleting inventory item directly"""
        # First get all inventory to find an item ID
        success, data = self.make_request('GET', '/inventory')
        
        if success and isinstance(data, list) and len(data) > 0:
            item_id = data[0].get('id')
            item_name = data[0].get('item_name', 'Unknown')
            if item_id:
                success, response = self.make_request('DELETE', f'/inventory/{item_id}')
                self.log_test("Delete Inventory Item", success, f"Deleted item: {item_name} (ID: {item_id})")
                return success
            else:
                self.log_test("Delete Inventory Item", False, "No item ID found")
                return False
        else:
            self.log_test("Delete Inventory Item", False, "No inventory items available")
            return False

    def run_inventory_tests(self):
        """Run comprehensive inventory tests"""
        print("\n🏗️ Starting Inventory Feature Tests")
        print("=" * 50)
        
        # Admin login for inventory tests
        if not self.test_admin_login():
            print("❌ Admin login failed. Stopping inventory tests.")
            return False
        
        # Get existing projects for testing
        success, projects = self.make_request('GET', '/projects')
        if success and isinstance(projects, list) and len(projects) > 0:
            self.project_id = projects[0]['id']
            print(f"📋 Using project: {projects[0]['name']} (ID: {self.project_id})")
        else:
            # Create a project if none exists
            if not self.test_create_project():
                print("❌ Failed to create project for inventory tests.")
                return False
        
        # Test inventory CRUD endpoints
        self.test_get_inventory_empty()
        self.test_get_inventory_with_filter()
        
        # Test auto-create inventory from transactions
        self.test_create_transaction_bahan_with_items()
        self.test_verify_inventory_created_from_bahan()
        
        self.test_create_transaction_alat_single_item()
        self.test_verify_inventory_created_from_alat()
        
        # Test quantity update logic
        self.test_create_duplicate_bahan_transaction()
        self.test_verify_inventory_quantity_updated()
        
        # Test inventory CRUD operations
        self.test_get_specific_inventory_item()
        self.test_update_inventory_item()
        
        # Test delete cascade
        self.test_delete_transaction_removes_inventory()
        self.test_delete_inventory_item()
        
        return True

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

    # ============= STATUS TRANSAKSI TESTS (RECEIVING & OUT WAREHOUSE) =============
    
    def test_status_transaksi_receiving_bahan(self):
        """Test transaksi receiving untuk bahan (tambah stok)"""
        if not self.project_id:
            self.log_test("Status Transaksi Receiving Bahan", False, "No project ID available")
            return False
            
        transaction_data = {
            "project_id": self.project_id,
            "category": "bahan",
            "description": "Pembelian bahan bangunan",
            "amount": 1500000,
            "status": "receiving",
            "items": [
                {
                    "description": "Pasir Cor",
                    "quantity": 5,
                    "unit": "m³",
                    "unit_price": 300000,
                    "total": 1500000
                }
            ],
            "transaction_date": "2025-01-16"
        }
        
        success, data = self.make_request('POST', '/transactions', transaction_data, 200)
        if success and 'id' in data:
            self.receiving_transaction_id = data['id']
        
        self.log_test("Status Transaksi Receiving Bahan", success, f"Transaction ID: {getattr(self, 'receiving_transaction_id', 'N/A')}")
        return success

    def test_verify_receiving_creates_inventory(self):
        """Test bahwa receiving menambah stok inventory"""
        success, data = self.make_request('GET', '/inventory')
        
        if success and isinstance(data, list):
            # Look for Pasir Cor item
            pasir_item = None
            for item in data:
                if item.get('item_name') == 'Pasir Cor' and item.get('category') == 'bahan':
                    pasir_item = item
                    break
            
            if pasir_item:
                # Verify item details
                correct_quantity = pasir_item.get('quantity') == 5
                correct_unit = pasir_item.get('unit') == 'm³'
                correct_status = pasir_item.get('status') == 'Tersedia'
                
                all_correct = correct_quantity and correct_unit and correct_status
                details = f"Pasir Cor found - Qty: {pasir_item.get('quantity')}, Unit: {pasir_item.get('unit')}, Status: {pasir_item.get('status')}"
                self.log_test("Verify Receiving Creates Inventory", all_correct, details)
                return all_correct
            else:
                self.log_test("Verify Receiving Creates Inventory", False, "Pasir Cor item not found in inventory")
                return False
        else:
            self.log_test("Verify Receiving Creates Inventory", False, "Failed to get inventory data")
            return False

    def test_status_transaksi_receiving_tambah_stok(self):
        """Test transaksi receiving lagi untuk menambah stok item yang sudah ada"""
        if not self.project_id:
            self.log_test("Status Transaksi Receiving Tambah Stok", False, "No project ID available")
            return False
            
        transaction_data = {
            "project_id": self.project_id,
            "category": "bahan",
            "description": "Pembelian pasir tambahan",
            "amount": 900000,
            "status": "receiving",
            "items": [
                {
                    "description": "Pasir Cor",
                    "quantity": 3,
                    "unit": "m³",
                    "unit_price": 300000,
                    "total": 900000
                }
            ],
            "transaction_date": "2025-01-16"
        }
        
        success, data = self.make_request('POST', '/transactions', transaction_data, 200)
        self.log_test("Status Transaksi Receiving Tambah Stok", success, f"Additional receiving transaction created")
        return success

    def test_verify_receiving_updates_quantity(self):
        """Test bahwa receiving kedua menambah quantity (5+3=8)"""
        success, data = self.make_request('GET', '/inventory')
        
        if success and isinstance(data, list):
            # Count Pasir Cor items and check quantity
            pasir_items = [item for item in data if item.get('item_name') == 'Pasir Cor' and item.get('category') == 'bahan']
            
            if len(pasir_items) == 1:
                # Should be only one item with updated quantity (5 + 3 = 8)
                pasir_item = pasir_items[0]
                expected_quantity = 8
                actual_quantity = pasir_item.get('quantity')
                
                quantity_correct = actual_quantity == expected_quantity
                details = f"Pasir items count: {len(pasir_items)}, Expected qty: {expected_quantity}, Actual qty: {actual_quantity}"
                self.log_test("Verify Receiving Updates Quantity", quantity_correct, details)
                return quantity_correct
            else:
                self.log_test("Verify Receiving Updates Quantity", False, f"Expected 1 Pasir item, found {len(pasir_items)}")
                return False
        else:
            self.log_test("Verify Receiving Updates Quantity", False, "Failed to get inventory data")
            return False

    def test_status_transaksi_out_warehouse(self):
        """Test transaksi out_warehouse untuk mengurangi stok"""
        if not self.project_id:
            self.log_test("Status Transaksi Out Warehouse", False, "No project ID available")
            return False
            
        transaction_data = {
            "project_id": self.project_id,
            "category": "bahan",
            "description": "Pengambilan bahan untuk proyek",
            "amount": 900000,
            "status": "out_warehouse",
            "items": [
                {
                    "description": "Pasir Cor",
                    "quantity": 3,
                    "unit": "m³",
                    "unit_price": 300000,
                    "total": 900000
                }
            ],
            "transaction_date": "2025-01-17"
        }
        
        success, data = self.make_request('POST', '/transactions', transaction_data, 200)
        self.log_test("Status Transaksi Out Warehouse", success, f"Out warehouse transaction created")
        return success

    def test_verify_out_warehouse_reduces_quantity(self):
        """Test bahwa out_warehouse mengurangi quantity (8-3=5)"""
        success, data = self.make_request('GET', '/inventory')
        
        if success and isinstance(data, list):
            # Find Pasir Cor item and check quantity
            pasir_item = None
            for item in data:
                if item.get('item_name') == 'Pasir Cor' and item.get('category') == 'bahan':
                    pasir_item = item
                    break
            
            if pasir_item:
                expected_quantity = 5
                actual_quantity = pasir_item.get('quantity')
                status = pasir_item.get('status')
                
                quantity_correct = actual_quantity == expected_quantity
                status_correct = status == 'Tersedia'  # Should still be available
                
                all_correct = quantity_correct and status_correct
                details = f"Expected qty: {expected_quantity}, Actual qty: {actual_quantity}, Status: {status}"
                self.log_test("Verify Out Warehouse Reduces Quantity", all_correct, details)
                return all_correct
            else:
                self.log_test("Verify Out Warehouse Reduces Quantity", False, "Pasir Cor item not found")
                return False
        else:
            self.log_test("Verify Out Warehouse Reduces Quantity", False, "Failed to get inventory data")
            return False

    def test_out_warehouse_sampai_habis(self):
        """Test out_warehouse sampai quantity = 0"""
        if not self.project_id:
            self.log_test("Out Warehouse Sampai Habis", False, "No project ID available")
            return False
            
        transaction_data = {
            "project_id": self.project_id,
            "category": "bahan",
            "description": "Pengambilan sisa pasir",
            "amount": 1500000,
            "status": "out_warehouse",
            "items": [
                {
                    "description": "Pasir Cor",
                    "quantity": 5,
                    "unit": "m³",
                    "unit_price": 300000,
                    "total": 1500000
                }
            ],
            "transaction_date": "2025-01-17"
        }
        
        success, data = self.make_request('POST', '/transactions', transaction_data, 200)
        self.log_test("Out Warehouse Sampai Habis", success, f"Final out warehouse transaction created")
        return success

    def test_verify_status_habis_when_zero(self):
        """Test bahwa status berubah menjadi 'Habis' ketika quantity = 0"""
        success, data = self.make_request('GET', '/inventory')
        
        if success and isinstance(data, list):
            # Find Pasir Cor item and check status
            pasir_item = None
            for item in data:
                if item.get('item_name') == 'Pasir Cor' and item.get('category') == 'bahan':
                    pasir_item = item
                    break
            
            if pasir_item:
                quantity = pasir_item.get('quantity')
                status = pasir_item.get('status')
                
                quantity_zero = quantity == 0
                status_habis = status == 'Habis'
                
                all_correct = quantity_zero and status_habis
                details = f"Quantity: {quantity}, Status: {status}"
                self.log_test("Verify Status Habis When Zero", all_correct, details)
                return all_correct
            else:
                self.log_test("Verify Status Habis When Zero", False, "Pasir Cor item not found")
                return False
        else:
            self.log_test("Verify Status Habis When Zero", False, "Failed to get inventory data")
            return False

    def test_validation_out_warehouse_stok_tidak_cukup(self):
        """Test validasi: out_warehouse dengan stok tidak cukup"""
        if not self.project_id:
            self.log_test("Validation Out Warehouse Stok Tidak Cukup", False, "No project ID available")
            return False
            
        transaction_data = {
            "project_id": self.project_id,
            "category": "bahan",
            "description": "Pengambilan pasir berlebihan",
            "amount": 3000000,
            "status": "out_warehouse",
            "items": [
                {
                    "description": "Pasir Cor",
                    "quantity": 10,  # Lebih dari stok available (0)
                    "unit": "m³",
                    "unit_price": 300000,
                    "total": 3000000
                }
            ],
            "transaction_date": "2025-01-17"
        }
        
        success, data = self.make_request('POST', '/transactions', transaction_data, 400)  # Expect 400 error
        
        # Check if error message contains expected text
        error_message = data.get('detail', '') if isinstance(data, dict) else str(data)
        has_stock_error = 'stok tidak cukup' in error_message.lower() or 'tidak ditemukan' in error_message.lower()
        
        validation_works = success and has_stock_error
        details = f"HTTP 400 returned: {success}, Error message: {error_message}"
        self.log_test("Validation Out Warehouse Stok Tidak Cukup", validation_works, details)
        return validation_works

    def test_validation_out_warehouse_item_tidak_ada(self):
        """Test validasi: out_warehouse item yang tidak ada di inventory"""
        if not self.project_id:
            self.log_test("Validation Out Warehouse Item Tidak Ada", False, "No project ID available")
            return False
            
        transaction_data = {
            "project_id": self.project_id,
            "category": "bahan",
            "description": "Pengambilan besi beton",
            "amount": 2000000,
            "status": "out_warehouse",
            "items": [
                {
                    "description": "Besi Beton",  # Item yang belum pernah ada
                    "quantity": 10,
                    "unit": "batang",
                    "unit_price": 200000,
                    "total": 2000000
                }
            ],
            "transaction_date": "2025-01-17"
        }
        
        success, data = self.make_request('POST', '/transactions', transaction_data, 400)  # Expect 400 error
        
        # Check if error message contains expected text
        error_message = data.get('detail', '') if isinstance(data, dict) else str(data)
        has_not_found_error = 'tidak ditemukan di inventory' in error_message.lower() or 'tidak ditemukan' in error_message.lower()
        
        validation_works = success and has_not_found_error
        details = f"HTTP 400 returned: {success}, Error message: {error_message}"
        self.log_test("Validation Out Warehouse Item Tidak Ada", validation_works, details)
        return validation_works

    def test_transaksi_alat_receiving(self):
        """Test transaksi alat dengan status receiving (single item)"""
        if not self.project_id:
            self.log_test("Transaksi Alat Receiving", False, "No project ID available")
            return False
            
        transaction_data = {
            "project_id": self.project_id,
            "category": "alat",
            "description": "Gerinda Tangan",
            "amount": 1500000,
            "quantity": 2,
            "unit": "unit",
            "status": "receiving",
            "transaction_date": "2025-01-16"
        }
        
        success, data = self.make_request('POST', '/transactions', transaction_data, 200)
        if success and 'id' in data:
            self.alat_transaction_id = data['id']
        
        self.log_test("Transaksi Alat Receiving", success, f"Alat transaction ID: {getattr(self, 'alat_transaction_id', 'N/A')}")
        return success

    def test_verify_alat_inventory_created(self):
        """Test bahwa inventory alat dibuat dengan benar"""
        success, data = self.make_request('GET', '/inventory')
        
        if success and isinstance(data, list):
            # Look for Gerinda Tangan item
            gerinda_item = None
            for item in data:
                if item.get('item_name') == 'Gerinda Tangan' and item.get('category') == 'alat':
                    gerinda_item = item
                    break
            
            if gerinda_item:
                # Verify item details
                correct_quantity = gerinda_item.get('quantity') == 2
                correct_unit = gerinda_item.get('unit') == 'unit'
                correct_status = gerinda_item.get('status') == 'Tersedia'
                
                all_correct = correct_quantity and correct_unit and correct_status
                details = f"Gerinda found - Qty: {gerinda_item.get('quantity')}, Unit: {gerinda_item.get('unit')}, Status: {gerinda_item.get('status')}"
                self.log_test("Verify Alat Inventory Created", all_correct, details)
                return all_correct
            else:
                self.log_test("Verify Alat Inventory Created", False, "Gerinda Tangan item not found in inventory")
                return False
        else:
            self.log_test("Verify Alat Inventory Created", False, "Failed to get inventory data")
            return False

    def test_alat_out_warehouse(self):
        """Test out_warehouse untuk alat (single item)"""
        if not self.project_id:
            self.log_test("Alat Out Warehouse", False, "No project ID available")
            return False
            
        transaction_data = {
            "project_id": self.project_id,
            "category": "alat",
            "description": "Gerinda Tangan",
            "amount": 750000,
            "quantity": 1,
            "unit": "unit",
            "status": "out_warehouse",
            "transaction_date": "2025-01-17"
        }
        
        success, data = self.make_request('POST', '/transactions', transaction_data, 200)
        self.log_test("Alat Out Warehouse", success, f"Alat out warehouse transaction created")
        return success

    def test_verify_alat_quantity_reduced(self):
        """Test bahwa quantity alat berkurang (2-1=1)"""
        success, data = self.make_request('GET', '/inventory')
        
        if success and isinstance(data, list):
            # Find Gerinda Tangan item and check quantity
            gerinda_item = None
            for item in data:
                if item.get('item_name') == 'Gerinda Tangan' and item.get('category') == 'alat':
                    gerinda_item = item
                    break
            
            if gerinda_item:
                expected_quantity = 1
                actual_quantity = gerinda_item.get('quantity')
                status = gerinda_item.get('status')
                
                quantity_correct = actual_quantity == expected_quantity
                status_correct = status == 'Tersedia'  # Should still be available
                
                all_correct = quantity_correct and status_correct
                details = f"Expected qty: {expected_quantity}, Actual qty: {actual_quantity}, Status: {status}"
                self.log_test("Verify Alat Quantity Reduced", all_correct, details)
                return all_correct
            else:
                self.log_test("Verify Alat Quantity Reduced", False, "Gerinda Tangan item not found")
                return False
        else:
            self.log_test("Verify Alat Quantity Reduced", False, "Failed to get inventory data")
            return False

    def run_status_transaksi_tests(self):
        """Run comprehensive status transaksi tests"""
        print("\n📦 Starting Status Transaksi Tests (Receiving & Out Warehouse)")
        print("=" * 70)
        
        # Admin login for tests
        if not self.test_admin_login():
            print("❌ Admin login failed. Stopping status transaksi tests.")
            return False
        
        # Get existing projects for testing
        success, projects = self.make_request('GET', '/projects')
        if success and isinstance(projects, list) and len(projects) > 0:
            self.project_id = projects[0]['id']
            print(f"📋 Using project: {projects[0]['name']} (ID: {self.project_id})")
        else:
            # Create a project if none exists
            if not self.test_create_project():
                print("❌ Failed to create project for status transaksi tests.")
                return False
        
        # Test 1: Transaksi Receiving Bahan (Tambah Stok)
        print("\n🔄 Test 1: Transaksi Receiving Bahan")
        self.test_status_transaksi_receiving_bahan()
        self.test_verify_receiving_creates_inventory()
        
        # Test 2: Transaksi Receiving Lagi (Tambah Stok ke Item yang Sudah Ada)
        print("\n🔄 Test 2: Transaksi Receiving Tambah Stok")
        self.test_status_transaksi_receiving_tambah_stok()
        self.test_verify_receiving_updates_quantity()
        
        # Test 3: Transaksi Out Warehouse (Kurangi Stok)
        print("\n🔄 Test 3: Transaksi Out Warehouse")
        self.test_status_transaksi_out_warehouse()
        self.test_verify_out_warehouse_reduces_quantity()
        
        # Test 4: Out Warehouse Sampai Habis
        print("\n🔄 Test 4: Out Warehouse Sampai Habis")
        self.test_out_warehouse_sampai_habis()
        self.test_verify_status_habis_when_zero()
        
        # Test 5: Validasi Stok Tidak Cukup
        print("\n🔄 Test 5: Validasi Stok Tidak Cukup")
        self.test_validation_out_warehouse_stok_tidak_cukup()
        
        # Test 6: Validasi Item Tidak Ada
        print("\n🔄 Test 6: Validasi Item Tidak Ada")
        self.test_validation_out_warehouse_item_tidak_ada()
        
        # Test 7: Transaksi Alat (Single Item)
        print("\n🔄 Test 7: Transaksi Alat")
        self.test_transaksi_alat_receiving()
        self.test_verify_alat_inventory_created()
        self.test_alat_out_warehouse()
        self.test_verify_alat_quantity_reduced()
        
        return True

    def run_inventory_only_tests(self):
        """Run only inventory tests as requested"""
        print("🏗️ Starting Inventory Feature Tests (Backend Only)")
        print("=" * 60)
        
        # Test API health first
        if not self.test_health_check():
            print("❌ API is not responding. Stopping tests.")
            return False
        
        # Run inventory tests
        self.run_inventory_tests()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Inventory Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        return self.tests_passed == self.tests_run

    def run_status_transaksi_only_tests(self):
        """Run only status transaksi tests as requested"""
        print("📦 Starting Status Transaksi Tests (Receiving & Out Warehouse)")
        print("=" * 70)
        
        # Test API health first
        if not self.test_health_check():
            print("❌ API is not responding. Stopping tests.")
            return False
        
        # Run status transaksi tests
        self.run_status_transaksi_tests()
        
        # Print summary
        print("\n" + "=" * 70)
        print(f"📊 Status Transaksi Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    tester = XONArchitectAPITester()
    
    # Check if we should run only inventory tests
    if len(sys.argv) > 1 and sys.argv[1] == "inventory":
        success = tester.run_inventory_only_tests()
        test_type = "inventory"
    else:
        success = tester.run_all_tests()
        test_type = "all"
    
    # Create test_reports directory if it doesn't exist
    import os
    os.makedirs('/app/test_reports', exist_ok=True)
    
    # Save detailed results
    filename = f'/app/test_reports/backend_{test_type}_test_results.json'
    with open(filename, 'w') as f:
        json.dump({
            "test_type": test_type,
            "timestamp": datetime.now().isoformat(),
            "total_tests": tester.tests_run,
            "passed_tests": tester.tests_passed,
            "success_rate": (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0,
            "test_results": tester.test_results
        }, f, indent=2)
    
    print(f"\n📄 Detailed results saved to: {filename}")
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())