with open('src/lib/api.ts', 'r', encoding='utf-8') as f:
    text = f.read()

target = "export default {"
replacement = """export interface BaselineSnapshot {
  snapshot_id: string;
  snapshot_date: string;
  org_unit_id: string;
  org_unit_name?: string;
  headcount_current: number;
  headcount_budgeted: number;
  run_cost_annual_lkr: number;
  fte_contractor_ratio: number;
  capability_gap_at_snapshot: number;
  is_frozen: boolean;
}

export interface ScenarioVariable {
  scenario_variable_id: string;
  scenario_id: string;
  variable_type: string;
  target_scope: string;
  target_id: string;
  value: number;
  min_bound: number;
  max_bound: number;
  applies_from_fy: string;
  ramp_profile: 'Immediate' | 'Linear' | 'Back-loaded';
  unit_cost_lkr?: number;
}

export interface ScenarioRecord {
  scenario_id: string;
  scenario_name: string;
  scenario_type: 'Expansion' | 'Contraction' | 'M&A' | 'Automation' | 'Restructure' | 'Outsourcing';
  org_unit_id: string;
  org_unit_name?: string;
  baseline_snapshot_id: string;
  horizon_start_fy: string;
  horizon_end_fy: string;
  created_by_role: string;
  promotion_approver_role: string;
  promotion_status: 'Sandbox' | 'Pending approval' | 'Promoted' | 'Rejected' | 'Held for calibration';
  saved_scenario_count_limit: number;
  opex_ceiling_lkr: number;
  hiring_capacity_per_year: number;
  reskilling_capacity_per_year: number;
  severance_cost_per_head_lkr: number;
  variables?: ScenarioVariable[];
  baseline_snapshot?: BaselineSnapshot;
}

export interface ScenarioSimulationResult {
  scenario_id: string;
  scenario_name: string;
  scenario_type: string;
  org_unit_id: string;
  org_unit_name: string;
  baseline_snapshot_id: string;
  promotion_status: string;
  opex_ceiling_lkr: number;
  hiring_capacity_per_year: number;
  reskilling_capacity_per_year: number;
  severance_cost_per_head_lkr: number;
  applied_variables: {
    automation_share: number;
    reskilling_rate: number;
    attrition_rate: number;
    hiring_rate: number;
    ramp_profile: string;
  };
  baseline: {
    headcount: number;
    run_cost_annual_lkr: number;
    capability_gap: number;
    fte_contractor_ratio: number;
  };
  simulation_summary: {
    projected_headcount_end: number;
    headcount_variance: number;
    projected_run_cost_annual_lkr: number;
    cost_variance_lkr: number;
    cost_variance_pct: number;
    total_transition_cost_lkr: number;
    projected_capability_gap: number;
    opex_guardrail_status: 'Within ceiling' | 'At ceiling within 5%' | 'Breach';
    feasibility: 'Feasible' | 'Infeasible';
    feasibility_reasons: string[];
    break_even_months: number | null;
    confidence_score: number;
    top_drivers: string[];
  };
  yearly_projections: Array<{
    fiscal_year: string;
    headcount: number;
    baseline_headcount: number;
    headcount_change: number;
    run_cost_annual_lkr: number;
    baseline_run_cost_lkr: number;
    cost_variance_lkr: number;
    cost_variance_pct: number;
    capability_gap: number;
    hires_projected: number;
    reskilled_projected: number;
    attrition_projected: number;
    displaced_projected: number;
    transition_cost_lkr: number;
  }>;
  role_shifts: Array<{
    role_id: string;
    role_title: string;
    category: string;
    shift_pct: string;
    direction: 'up' | 'down';
    exposure: string;
    action: string;
    description: string;
  }>;
  sensitivity_range: {
    attrition_delta: string;
    time_to_hire_delta: string;
    best_case_headcount: number;
    worst_case_headcount: number;
    best_case_run_cost_lkr: number;
    worst_case_run_cost_lkr: number;
  };
  ml_operational_impact: {
    productivity_score: number;
    productivity_delta: string;
    csat_score: number;
    csat_delta: string;
    absenteeism_rate_pct: number;
    absenteeism_delta: string;
    model_confidence: number;
    algorithm: string;
  };
  knowledge_succession_impact: {
    sole_holder_count_change: number;
    ready_successor_count_change: number;
    knowledge_concentration_index: string;
    summary: string;
  };
}

export interface PromotionAuditEntry {
  audit_id: string;
  scenario_id: string;
  action: string;
  from_status: string | null;
  to_status: string;
  actor_employee_id: string;
  actor_role: string;
  action_at: string;
  comment: string | null;
}

export const scenarioAPI = {
  getSnapshots: () =>
    fetchAPI<BaselineSnapshot[]>('/api/scenarios/snapshots'),

  freezeSnapshot: (data: {
    org_unit_id: string;
    headcount_current?: number;
    headcount_budgeted?: number;
    run_cost_annual_lkr?: number;
    capability_gap?: number;
  }) =>
    fetchAPI<BaselineSnapshot>('/api/scenarios/snapshots/freeze', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getScenarios: (orgUnitId?: string) =>
    fetchAPI<ScenarioRecord[]>(`/api/scenarios${orgUnitId ? `?org_unit_id=${encodeURIComponent(orgUnitId)}` : ''}`),

  getScenario: (scenarioId: string) =>
    fetchAPI<ScenarioRecord>(`/api/scenarios/${scenarioId}`),

  simulateScenario: (scenarioId: string, customVars?: any) =>
    fetchAPI<ScenarioSimulationResult>(`/api/scenarios/${scenarioId}/simulate`, {
      method: 'POST',
      body: JSON.stringify(customVars || {}),
    }),

  promoteScenario: (scenarioId: string, data: {
    action: string;
    actor_employee_id?: string;
    actor_role?: string;
    comment?: string;
  }) =>
    fetchAPI<any>(`/api/scenarios/${scenarioId}/promote`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getAuditTrail: (scenarioId?: string) =>
    fetchAPI<PromotionAuditEntry[]>(
      scenarioId
        ? `/api/scenarios/${scenarioId}/audit-trail`
        : '/api/scenarios/audit-trail/all'
    ),

  getComparison: () =>
    fetchAPI<any[]>('/api/scenarios/comparison/all'),
};

export default {"""

if target in text:
    new_text = text.replace(target, replacement, 1)
    # Also add scenario: scenarioAPI into export default
    new_text = new_text.replace("knowledge: knowledgeAPI,\n};", "knowledge: knowledgeAPI,\n  scenario: scenarioAPI,\n};")
    new_text = new_text.replace("knowledge: knowledgeAPI,\r\n};", "knowledge: knowledgeAPI,\r\n  scenario: scenarioAPI,\r\n};")
    with open('src/lib/api.ts', 'w', encoding='utf-8') as f:
        f.write(new_text)
    print("Successfully updated src/lib/api.ts")
else:
    print("Target not found in api.ts")
