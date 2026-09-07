def calculate_average_burnout(employees_data: list) -> float:
    """
    Calculate the average burnout score for a list of employees.
    Uses proxy metrics to dynamically compute the score (0-100).
    """
    if not employees_data:
        return 65.0 # Default if no data
        
    total_burnout = 0.0
    
    for emp in employees_data:
        # Extract available fields and handle None safely
        twin_health = emp.get("twin_health")
        if twin_health is None:
            twin_health = 80
            
        years_exp = emp.get("years_experience")
        if years_exp is None:
            years_exp = 2.0
            
        # Simulate HR Proxy Metrics
        # 1. Overtime percentage (higher for people with low twin health)
        simulated_overtime_pct = max(0, 100 - twin_health)
        
        # 2. Unused leaves percentage (assume people with more experience take fewer leaves if they are burned out)
        # Using a simplistic mock simulation
        simulated_unused_leaves_pct = min(100, (years_exp * 5) + (100 - twin_health) * 0.5)
        
        # 3. Pulse Survey Stress Score (inverse of twin health, with some noise)
        simulated_pulse_stress = max(0, 100 - twin_health)
        
        # Weighted Burnout Formula
        # Overtime (40%), Unused Leaves (30%), Pulse Survey (30%)
        emp_burnout = (simulated_overtime_pct * 0.4) + (simulated_unused_leaves_pct * 0.3) + (simulated_pulse_stress * 0.3)
        
        # Cap between 0 and 100
        emp_burnout = max(0.0, min(100.0, emp_burnout))
        
        total_burnout += emp_burnout
        
    return round(total_burnout / len(employees_data), 2)
