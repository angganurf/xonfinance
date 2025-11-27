#!/usr/bin/env python3

import requests
import json
from datetime import datetime

class RABFlowVerificationTester:
    def __init__(self, base_url="https://pmcraft.preview.emergentagent.com"):
        self.base_url = base_url
        self.session_token = None
        
    def login_admin(self):
        """Login as admin"""
        login_data = {
            "email": "admin",
            "password": "admin"
        }
        
        response = requests.post(f"{self.base_url}/api/auth/login", json=login_data)
        if response.status_code == 200:
            data = response.json()
            self.session_token = data.get('session_token')
            print("✅ Admin login successful")
            return True
        else:
            print(f"❌ Admin login failed: {response.status_code}")
            return False
    
    def get_headers(self):
        """Get headers with authorization"""
        return {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.session_token}'
        }
    
    def test_complete_rab_flow(self):
        """Test the complete RAB creation flow as requested"""
        print("🏗️ Testing Complete RAB Creation Flow for Planning Team")
        print("=" * 60)
        
        # Step 1: Login as admin
        if not self.login_admin():
            return False
        
        # Step 2: Get project ID from "Test Project Planning Team" via GET /api/projects?phase=perencanaan
        print("\n📋 Step 2: Getting project ID from planning projects...")
        response = requests.get(
            f"{self.base_url}/api/projects?phase=perencanaan", 
            headers=self.get_headers()
        )
        
        if response.status_code != 200:
            print(f"❌ Failed to get planning projects: {response.status_code}")
            return False
        
        projects = response.json()
        test_project = None
        for project in projects:
            if project.get('name') == 'Test Project Planning Team':
                test_project = project
                break
        
        if not test_project:
            print("❌ Test Project Planning Team not found")
            return False
        
        project_id = test_project['id']
        print(f"✅ Found Test Project Planning Team with ID: {project_id}")
        
        # Step 3: Create RAB for the project via POST /api/rabs
        print("\n📄 Step 3: Creating RAB for the project...")
        rab_data = {
            "project_name": "Test Project Planning Team",
            "project_type": "interior",
            "client_name": "Pak Budi Testing",
            "location": "Jakarta Selatan"
        }
        
        response = requests.post(
            f"{self.base_url}/api/rabs", 
            json=rab_data,
            headers=self.get_headers()
        )
        
        if response.status_code != 200:
            print(f"❌ Failed to create RAB: {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        rab_response = response.json()
        rab_id = rab_response.get('id')
        print(f"✅ RAB created successfully with ID: {rab_id}")
        
        # Step 4: Verify RAB created successfully
        print("\n🔍 Step 4: Verifying RAB details...")
        response = requests.get(
            f"{self.base_url}/api/rabs/{rab_id}",
            headers=self.get_headers()
        )
        
        if response.status_code != 200:
            print(f"❌ Failed to get RAB details: {response.status_code}")
            return False
        
        rab_details = response.json()
        
        # Verify RAB details
        checks = {
            "project_name": rab_details.get('project_name') == 'Test Project Planning Team',
            "project_type": rab_details.get('project_type') == 'interior',
            "client_name": rab_details.get('client_name') == 'Pak Budi Testing',
            "location": rab_details.get('location') == 'Jakarta Selatan',
            "status": rab_details.get('status') == 'draft'
        }
        
        all_correct = all(checks.values())
        if all_correct:
            print("✅ RAB details verified successfully")
            for key, value in checks.items():
                print(f"   - {key}: {'✅' if value else '❌'}")
        else:
            print("❌ RAB details verification failed")
            return False
        
        # Step 5: Verify planning overview shows RAB for the project
        print("\n📊 Step 5: Verifying planning overview...")
        response = requests.get(
            f"{self.base_url}/api/planning/overview",
            headers=self.get_headers()
        )
        
        if response.status_code != 200:
            print(f"❌ Failed to get planning overview: {response.status_code}")
            return False
        
        planning_overview = response.json()
        
        # Find the test project in planning overview
        test_project_overview = None
        for project_overview in planning_overview:
            project_info = project_overview.get('project', {})
            if project_info.get('name') == 'Test Project Planning Team':
                test_project_overview = project_overview
                break
        
        if not test_project_overview:
            print("❌ Test Project Planning Team not found in planning overview")
            return False
        
        # Check if RAB is present in the overview
        rab_info = test_project_overview.get('rab')
        if rab_info:
            print("✅ RAB found in planning overview")
            print(f"   - RAB ID: {rab_info.get('id')}")
            print(f"   - Status: {rab_info.get('status')}")
            print(f"   - Client: {rab_info.get('client_name')}")
            
            # This confirms that "Lihat RAB →" link will be available
            print("\n🔗 RESULT: 'Lihat RAB →' link will be available in Planning Dashboard")
            return True
        else:
            print("❌ RAB not found in planning overview")
            return False

def main():
    tester = RABFlowVerificationTester()
    success = tester.test_complete_rab_flow()
    
    print("\n" + "=" * 60)
    if success:
        print("🎉 RAB Creation Flow Test PASSED")
        print("✅ All requirements met:")
        print("   1. ✅ Admin login successful")
        print("   2. ✅ Project 'Test Project Planning Team' found")
        print("   3. ✅ RAB created with correct data")
        print("   4. ✅ RAB status is 'draft'")
        print("   5. ✅ RAB appears in planning overview")
        print("   6. ✅ 'Lihat RAB →' link will be available")
    else:
        print("❌ RAB Creation Flow Test FAILED")
    
    return success

if __name__ == "__main__":
    main()