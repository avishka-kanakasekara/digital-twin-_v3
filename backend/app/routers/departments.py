from __future__ import annotations
"""
API routes for Department module.
"""
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status

from app.database import get_supabase_admin
from app.schemas.department import DepartmentRead, DepartmentCreate, DepartmentUpdate

router = APIRouter(
    prefix="/api/departments",
    tags=["Departments"],
)


@router.get("", response_model=List[DepartmentRead])
def get_departments(
    region: Optional[str] = Query(None, description="Filter by region (APAC, EMEA, NA, LATAM, GLOBAL)"),
    function: Optional[str] = Query(None, description="Filter by function (Engineering, Sales, HR, ...)"),
    risk_level: Optional[str] = Query(None, description="Filter by risk level (Low, Medium, High)"),
    limit: int = Query(100, le=500),
):
    """Get all departments with optional filters."""
    sb = get_supabase_admin()
    query = sb.table("departments").select("*")

    if region:
        query = query.eq("region", region)
    if function:
        query = query.eq("function", function)
    if risk_level:
        query = query.eq("risk_level", risk_level)

    result = query.order("name").limit(limit).execute()
    return result.data


@router.get("/summary", tags=["Departments"])
def get_departments_summary():
    """Get aggregate summary stats across all departments."""
    sb = get_supabase_admin()
    result = sb.table("departments").select("*").execute()
    data = result.data

    if not data:
        return {}

    total_headcount    = sum(d["headcount"] for d in data)
    total_open         = sum(d["open_positions"] for d in data)
    total_budget       = sum(d["allocated_budget"] for d in data)
    total_spend        = sum(d["actual_spend"] for d in data)
    avg_performance    = round(sum(d["performance_score"] for d in data) / len(data), 1)
    avg_attrition      = round(sum(d["attrition_rate"] for d in data) / len(data), 2)
    avg_enps           = round(sum(d["enps"] for d in data) / len(data), 1)

    risk_counts = {"High": 0, "Medium": 0, "Low": 0}
    for d in data:
        r = d.get("risk_level", "Low")
        risk_counts[r] = risk_counts.get(r, 0) + 1

    regions = list({d["region"] for d in data})
    functions = list({d["function"] for d in data})

    return {
        "total_departments": len(data),
        "total_headcount": total_headcount,
        "total_open_positions": total_open,
        "total_allocated_budget": round(total_budget, 2),
        "total_actual_spend": round(total_spend, 2),
        "avg_performance_score": avg_performance,
        "avg_attrition_rate": avg_attrition,
        "avg_enps": avg_enps,
        "risk_breakdown": risk_counts,
        "regions": sorted(regions),
        "functions": sorted(functions),
    }


@router.get("/{id}", response_model=DepartmentRead)
def get_department(id: str):
    """Get a single department by ID."""
    sb = get_supabase_admin()
    result = sb.table("departments").select("*").eq("id", id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Department not found")
    return result.data[0]


@router.post("", response_model=DepartmentRead, status_code=status.HTTP_201_CREATED)
def create_department(dept: DepartmentCreate):
    sb = get_supabase_admin()
    result = sb.table("departments").insert(dept.model_dump()).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to create department")
    return result.data[0]


@router.put("/{id}", response_model=DepartmentRead)
def update_department(id: str, dept: DepartmentUpdate):
    sb = get_supabase_admin()
    update_data = dept.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update")
    result = sb.table("departments").update(update_data).eq("id", id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Department not found")
    return result.data[0]


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_department(id: str):
    sb = get_supabase_admin()
    result = sb.table("departments").delete().eq("id", id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Department not found")
    return None
