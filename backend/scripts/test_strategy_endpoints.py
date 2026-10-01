"""
Verification test script for Strategy Role Architect API Endpoints
"""
import urllib.request
import json

BASE_URL = "http://localhost:8000/api/organization/strategy"

def make_req(url, method="GET", body=None):
    req = urllib.request.Request(url, method=method)
    req.add_header("Content-Type", "application/json")
    data = json.dumps(body).encode("utf-8") if body else None
    try:
        with urllib.request.urlopen(req, data=data) as response:
            return response.status, json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        err_text = e.read().decode("utf-8")
        try:
            return e.code, json.loads(err_text)
        except Exception:
            return e.code, {"detail": err_text}

def run_tests():
    print("=== Testing Strategy Role Architect Endpoints ===")
    
    # Test 1: Drivers
    status, drivers = make_req(f"{BASE_URL}/drivers")
    print(f"1. GET /drivers: Status {status}, Count: {len(drivers)}")
    assert status == 200 and len(drivers) >= 4, "Drivers test failed"

    # Test 2: Orphaned Roles (AC 3.2)
    status, orphaned = make_req(f"{BASE_URL}/orphaned-roles")
    print(f"2. GET /orphaned-roles: Status {status}, Flagged Count: {len(orphaned)}")
    assert status == 200 and len(orphaned) >= 1, "Orphaned roles test failed"
    print(f"   Sample Flagged Reason: {orphaned[0].get('orphan_reason')}")

    # Test 3.1: Mandatory Driver Link validation for Live role (AC 3.1)
    status, res = make_req(f"{BASE_URL}/roles", method="POST", body={
        "role": "Invalid Live Role",
        "dept": "Analytics",
        "level": "L4",
        "status": "Live",
        "strategy_driver_id": ""  # Invalid! Missing driver
    })
    print(f"3.1. POST /roles (Live without driver): Status {status}, Detail: {res.get('detail')}")
    assert status == 400, "Mandatory driver link validation failed to reject missing driver!"

    # Test 3.2: Valid Role Save with Driver Link & Skill Versioning (AC 1, AC 3)
    status, res = make_req(f"{BASE_URL}/roles", method="POST", body={
        "role_id": "ROLE-2001",
        "role": "Senior Data Scientist",
        "dept": "Enterprise Analytics",
        "level": "L4 Senior",
        "status": "Live",
        "strategy_driver_id": "DRV-101",
        "skill_proficiency_map": [
            {"skill": "Python", "current": 3, "target": 5, "importance": "Critical"},
            {"skill": "Machine Learning", "current": 2, "target": 5, "importance": "Critical"},
            {"skill": "MLOps", "current": 2, "target": 4, "importance": "Important"}
        ]
    })
    print(f"3.2. POST /roles (Valid Save): Status {status}, Version: {res.get('version')}")
    assert status == 200, "Valid role save failed"

    # Test 4.1: Demand Line Input Validation - Gross HC <= 0 (AC 2.2)
    status, res = make_req(f"{BASE_URL}/roles/ROLE-2001/demand-lines", method="POST", body={
        "fiscal_year": 2026,
        "demand_headcount_growth": 0,
        "demand_headcount_attrition": 0
    })
    print(f"4.1. POST Demand Line (Gross <= 0): Status {status}, Detail: {res.get('detail')}")
    assert status == 400, "Demand line gross <= 0 check failed"

    # Test 4.2: Demand Line Input Validation - FY outside horizon (AC 2.2)
    status, res = make_req(f"{BASE_URL}/roles/ROLE-2001/demand-lines", method="POST", body={
        "fiscal_year": 2035, # Horizon is FY25-FY28
        "demand_headcount_growth": 3,
        "demand_headcount_attrition": 1
    })
    print(f"4.2. POST Demand Line (FY outside horizon): Status {status}, Detail: {res.get('detail')}")
    assert status == 400, "Demand line FY horizon check failed"

    # Test 4.3: Valid Demand Line (AC 2.1)
    status, res = make_req(f"{BASE_URL}/roles/ROLE-2001/demand-lines", method="POST", body={
        "fiscal_year": 2026,
        "demand_headcount_growth": 3,
        "demand_headcount_attrition": 1
    })
    print(f"4.3. POST Demand Line (Valid): Status {status}, Message: {res.get('message')}")
    assert status == 200, "Valid demand line submission failed"

    # Test 5: Persona Q&A Endpoints
    for persona in ["Employee", "Manager", "Employer"]:
        status, res = make_req(f"{BASE_URL}/persona-qa", method="POST", body={
            "persona": persona,
            "question": f"Sample question for {persona}"
        })
        print(f"5. POST Persona QA ({persona}): Status {status}, Summary: {res.get('answer_summary')[:60]}...")
        assert status == 200, f"Persona QA failed for {persona}"

    print("\n✅ ALL STRATEGY ROLE ARCHITECT TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_tests()
