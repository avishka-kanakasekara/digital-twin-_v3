"""
Module 3: Scenario Simulator Router.
Reference Architecture Edition (ADL September 2026 Specification).
"""

from fastapi import APIRouter, HTTPException, Query, Body
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

from app.services import scenario_service

router = APIRouter(
    prefix="/api/scenarios",
    tags=["Scenario Simulator"],
)


class FreezeSnapshotRequest(BaseModel):
    org_unit_id: str
    headcount_current: Optional[int] = None
    headcount_budgeted: Optional[int] = None
    run_cost_annual_lkr: Optional[int] = None
    capability_gap: Optional[float] = None


class CustomSimulationRequest(BaseModel):
    automation_share: Optional[float] = None
    reskilling_rate: Optional[float] = None
    attrition_rate: Optional[float] = None
    hiring_rate: Optional[float] = None
    ramp_profile: Optional[str] = "Linear"


class PromoteScenarioRequest(BaseModel):
    action: str = Field(..., description="promote, submit, reject, hold, save")
    actor_employee_id: str = "EMP-0003"
    actor_role: str = "Workforce Planning Lead"
    comment: Optional[str] = None


@router.get("/snapshots")
def get_snapshots():
    """
    3.1 Baseline Snapshot: Fetch all point-in-time frozen snapshots.
    AC 1 & AC 2: Immutable snapshot data for each org unit.
    """
    return scenario_service.get_snapshots()


@router.post("/snapshots/freeze")
def freeze_snapshot(req: FreezeSnapshotRequest):
    """
    User Story 1: Freeze a Baseline Snapshot
    AC 1: Capture point-in-time snapshot.
    AC 2: Lock the snapshot (is_frozen = TRUE).
    """
    try:
        new_snap = scenario_service.freeze_snapshot(
            org_unit_id=req.org_unit_id,
            headcount_current=req.headcount_current,
            headcount_budgeted=req.headcount_budgeted,
            run_cost_annual_lkr=req.run_cost_annual_lkr,
            capability_gap=req.capability_gap
        )
        return new_snap
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("")
def list_scenarios(org_unit_id: Optional[str] = None):
    """
    3.2 Scenario Record: Fetch all scenarios optionally filtered by org_unit_id.
    """
    return scenario_service.get_scenarios(org_unit_id=org_unit_id)


@router.get("/comparison/all")
def get_comparison():
    """
    Section 3.4 Scenario Comparison Table: Every saved scenario against the baseline.
    """
    return scenario_service.get_all_scenarios_comparison()


@router.get("/{scenario_id}")
def get_scenario(scenario_id: str):
    """
    Fetch details and variables for a specific scenario.
    """
    scen = scenario_service.get_scenario(scenario_id)
    if not scen:
        raise HTTPException(status_code=404, detail=f"Scenario {scenario_id} not found")
    return scen


@router.post("/{scenario_id}/simulate")
def simulate_scenario(scenario_id: str, custom_vars: Optional[CustomSimulationRequest] = None):
    """
    User Story 2: Simulate a Workforce Scenario
    AC 1: Apply scenario variables within min/max bounds and ramp profiles.
    AC 2: Compute projected headcount, run cost, transition cost, and capability gap for the horizon.
    AC 3: Capacity feasibility checks against real operational limits.
    Section 3.4 Outputs: Full verified metric bundle.
    """
    try:
        custom_dict = custom_vars.dict(exclude_unset=True) if custom_vars else None
        result = scenario_service.run_scenario_simulation(scenario_id, custom_dict)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{scenario_id}/promote")
def promote_scenario(scenario_id: str, req: PromoteScenarioRequest):
    """
    User Story 3: Promote a Scenario to the Live Plan
    AC 1: Restrict Promotion Rights: Only Workforce Planning Lead can promote.
    AC 2: Preserve Sandbox by Default.
    AC 3: Log Every Promotion Decision to Promotion Audit Trail.
    """
    try:
        res = scenario_service.promote_scenario(
            scenario_id=scenario_id,
            action=req.action,
            actor_employee_id=req.actor_employee_id,
            actor_role=req.actor_role,
            comment=req.comment
        )
        return res
    except PermissionError as pe:
        raise HTTPException(status_code=403, detail=str(pe))
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))


@router.get("/{scenario_id}/audit-trail")
def get_audit_trail(scenario_id: str):
    """
    Fetch audit trail entries for a given scenario.
    """
    return scenario_service.get_audit_trail(scenario_id)


@router.get("/audit-trail/all")
def get_all_audit_trail():
    """
    Fetch full enterprise Promotion Audit Trail.
    """
    return scenario_service.get_audit_trail(None)
