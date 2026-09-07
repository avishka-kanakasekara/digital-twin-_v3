from __future__ import annotations
"""
Pydantic schemas for Department module.
"""
from pydantic import BaseModel, ConfigDict
from typing import Optional


class DepartmentBase(BaseModel):
    name: str
    region: str
    function: str
    headcount: int
    open_positions: int
    allocated_budget: float
    actual_spend: float
    performance_score: int
    target_score: int
    enps: int
    attrition_rate: float
    risk_level: str


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    region: Optional[str] = None
    function: Optional[str] = None
    headcount: Optional[int] = None
    open_positions: Optional[int] = None
    allocated_budget: Optional[float] = None
    actual_spend: Optional[float] = None
    performance_score: Optional[int] = None
    target_score: Optional[int] = None
    enps: Optional[int] = None
    attrition_rate: Optional[float] = None
    risk_level: Optional[str] = None


class DepartmentRead(DepartmentBase):
    id: str

    model_config = ConfigDict(from_attributes=True)
