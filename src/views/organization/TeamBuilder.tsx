import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, Search, Sparkles, Users, Wand2 } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../contexts/AuthContext';
import { teamBuilderAPI, type TbCatalogue, type TbJoinRequest, type TbOption, type TbRun, type TbSkillRequirement } from '../../lib/api';
import { TeamRegistryPanel } from './TeamRegistryPanel';
import { TeamAssemblyStudio } from './TeamAssemblyStudio';
import './TeamBuilder.css';

const pct = (value: number | null | undefined) => (value === null || value === undefined ? 'Not enough data' : `${value}%`);

const feasibilityLabel: Record<string, string> = {
  feasible: 'Meets the brief',
  short_staffed: 'Fewer people than requested',
  gaps: 'Requirements still open',
  empty: 'No one could be placed',
};

const statusLabel: Record<string, string> = {
  proposed: 'Ready to approve',
  infeasible: 'Not ready',
  assembled: 'Assembled',
  rejected: 'Rejected',
  superseded: 'Replaced',
  existing: 'Existing team',
};

const initials = (name: string | null | undefined) =>
  (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

export const TeamBuilder: React.FC = () => {
  const { projectTypes } = useSettings();
  const { user } = useAuth();
  const [catalogue, setCatalogue] = useState<TbCatalogue | null>(null);
  const [run, setRun] = useState<TbRun | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectId, setProjectId] = useState('');
  const [projectType, setProjectType] = useState(projectTypes[0] || 'New Product Development');
  const [objective, setObjective] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [headcount, setHeadcount] = useState(4);
  const [allocation, setAllocation] = useState(40);
  const [context, setContext] = useState('');
  const [allowSmaller, setAllowSmaller] = useState(false);
  const [rolesText, setRolesText] = useState('');
  const [skills, setSkills] = useState<TbSkillRequirement[]>([]);
  const [skillQuery, setSkillQuery] = useState('');
  const [capacityEmployee, setCapacityEmployee] = useState('');
  const [capacityPct, setCapacityPct] = useState(50);
  const [section, setSection] = useState<'assembly' | 'recommend' | 'teams'>('assembly');
  const [joinRequests, setJoinRequests] = useState<TbJoinRequest[]>([]);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const data = await teamBuilderAPI.catalogue();
        if (!live) return;
        setCatalogue(data);
        const recent = await teamBuilderAPI.runs();
        if (recent.runs[0]) setRun(await teamBuilderAPI.run(recent.runs[0].run_id));
        const joins = await teamBuilderAPI.joinRequests().catch(() => ({ mine: [] as TbJoinRequest[], review: [] }));
        if (live) setJoinRequests(joins.mine || []);
      } catch (err) {
        if (live) setError(err instanceof Error ? err.message : 'The team builder could not reach the database.');
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
    };
  }, [user?.id]);

  const skillMatches = useMemo(() => {
    const query = skillQuery.trim().toLowerCase();
    return (catalogue?.skills || [])
      .filter((skill) => !query || skill.name.toLowerCase().includes(query))
      .slice(0, 16);
  }, [catalogue, skillQuery]);

  const canGenerate = !busy && (projectName.trim().length >= 3 || !!projectId);

  const toggleSkill = (name: string) => {
    setSkills((current) => (current.some((skill) => skill.name === name) ? current.filter((skill) => skill.name !== name) : [...current, { name, priority: 'important' }]));
  };

  const setPriority = (name: string, priority: TbSkillRequirement['priority']) => {
    setSkills((current) => current.map((skill) => (skill.name === name ? { ...skill, priority } : skill)));
  };

  const chooseProject = (id: string) => {
    setProjectId(id);
    const project = catalogue?.projects.find((item) => item.id === id);
    if (project && !projectName.trim()) setProjectName(project.name);
  };

  const generate = async () => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const next = await teamBuilderAPI.optimize({
        project_name: projectName || (projectId ? catalogue?.projects.find((project) => project.id === projectId)?.name : ''),
        project_id: projectId || null,
        project_type: projectType,
        objective,
        start_date: startDate || null,
        end_date: endDate || null,
        headcount,
        allocation_pct: allocation,
        context,
        allow_smaller: allowSmaller,
        skills,
        roles: rolesText.split(',').map((role) => role.trim()).filter(Boolean),
      });
      setRun(next);
      setNotice(next.options.length === 1 ? '1 team option saved.' : `${next.options.length} team options saved.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The teams could not be generated.');
    } finally {
      setBusy(false);
    }
  };

  const assemble = async (option: TbOption) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const saved = await teamBuilderAPI.assemble(option.id, option.feasibility === 'short_staffed');
      if (saved.option_status !== 'assembled') {
        setError('The team was not assembled.');
        return;
      }
      if (run) setRun(await teamBuilderAPI.run(run.run_id));
      setNotice(`Assembled ${saved.assignments.length} ${saved.assignments.length === 1 ? 'assignment' : 'assignments'} for ${saved.name}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Assembly failed.');
    } finally {
      setBusy(false);
    }
  };

  const reject = async (option: TbOption) => {
    setBusy(true);
    setError(null);
    try {
      await teamBuilderAPI.reject(option.id, 'Rejected from the team builder');
      if (run) setRun(await teamBuilderAPI.run(run.run_id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The option could not be rejected.');
    } finally {
      setBusy(false);
    }
  };

  const askToJoin = async (option: TbOption) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const request = option.source === 'existing'
        ? await teamBuilderAPI.askToJoinTeam(option.team_id || option.id)
        : await teamBuilderAPI.askToJoin(option.id);
      setJoinRequests((current) => [request, ...current.filter((item) => item.id !== request.id)]);
      setNotice(`Your request to join ${option.name} is saved. Someone else has to accept it before you are on the team.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The request to join could not be saved.');
    } finally {
      setBusy(false);
    }
  };

  const saveCapacity = async () => {
    if (!capacityEmployee) return;
    setBusy(true);
    setError(null);
    try {
      await teamBuilderAPI.saveCapacity({
        employee_id: capacityEmployee,
        allocatable_pct: capacityPct,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });
      setCatalogue(await teamBuilderAPI.catalogue());
      setNotice('Availability saved. Generate the teams again to use it.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Availability could not be saved.');
    } finally {
      setBusy(false);
    }
  };

  const resultCards = [...(run?.options || []), ...(run?.existing_teams || [])];

  return (
    <div className="team-builder">
      {/* Page Header Bar - Clean Single Horizontal Row like Strategy Role Architect */}
      <div className="flex flex-col gap-1 w-full pt-1 mb-4">
        
        {/* Main Line: Title on Left, Standardized Action Toolbar on Right */}
        <div className="flex flex-wrap items-center justify-between gap-3 w-full py-1">
          
          {/* Left: Title */}
          <div className="flex items-center gap-2 shrink-0">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap">
              Team Assembly
            </h1>
          </div>

          {/* Right: Action Toolbar with Standard Heights & Paddings */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <div className="inline-flex items-center p-1 rounded-lg bg-slate-100 border border-slate-200/90 gap-1" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={section === 'teams'}
                className={`h-7 px-3 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  section === 'teams'
                    ? 'bg-white text-blue-700 shadow-2xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                onClick={() => setSection('teams')}
              >
                My Teams
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={section === 'recommend'}
                className={`h-7 px-3 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  section === 'recommend'
                    ? 'bg-white text-blue-700 shadow-2xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                onClick={() => setSection('recommend')}
              >
                Recommend a Team
              </button>
            </div>
          </div>
        </div>

        {/* Subtitle Description */}
        <p className="text-xs text-slate-500 max-w-2xl mb-1">
          Assemble cross-functional project teams with automated skill complementarity and synthetic project success prediction.
        </p>
      </div>

      {error && (
        <div className="tb-banner tb-banner--error" role="alert">
          <AlertTriangle size={16} /> {error}
        </div>
      )}
      {notice && (
        <div className="tb-banner tb-banner--ok" role="status">
          <CheckCircle2 size={16} /> {notice}
        </div>
      )}

      {section === 'assembly' && <TeamAssemblyStudio />}
      {section === 'teams' && <TeamRegistryPanel catalogue={catalogue} />}

      {section === 'recommend' && (loading ? (
        <div className="tb-loading">
          <Loader2 className="tb-spin" size={22} /> Loading people, skills, and saved teams…
        </div>
      ) : (
        <div className="tb-layout">
          <section className="tb-card">
            <h2><Sparkles size={18} /> Project brief</h2>
            <p className="tb-help">Start with a name and the skills the work depends on. Dates and roles make the recommendation more precise.</p>

            <label className="tb-field">
              Existing project
              <select className="tb-select" value={projectId} onChange={(event) => chooseProject(event.target.value)}>
                <option value="">New brief</option>
                {catalogue?.projects.map((project) => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </label>
            <label className="tb-field">
              Project name
              <input className="tb-input" value={projectName} onChange={(event) => setProjectName(event.target.value)} placeholder="Billing migration" />
            </label>
            <label className="tb-field">
              What does this team need to deliver?
              <textarea value={objective} onChange={(event) => setObjective(event.target.value)} placeholder="Move the billing service before the contract renewal." />
            </label>
            <label className="tb-field">
              Project type
              <select className="tb-select" value={projectType} onChange={(event) => setProjectType(event.target.value)}>
                {projectTypes.map((type) => <option key={type}>{type}</option>)}
              </select>
            </label>
            <div className="tb-grid-2">
              <label className="tb-field">
                Start
                <input className="tb-input" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
              </label>
              <label className="tb-field">
                End
                <input className="tb-input" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
              </label>
            </div>
            <label className="tb-field">
              Team size · {headcount} people
              <input className="tb-range" type="range" min={2} max={10} value={headcount} onChange={(event) => setHeadcount(Number(event.target.value))} />
            </label>
            <label className="tb-field">
              Time each person needs · {allocation}%
              <input className="tb-range" type="range" min={10} max={100} step={10} value={allocation} onChange={(event) => setAllocation(Number(event.target.value))} />
            </label>
            <label className="tb-field">
              Roles to cover
              <input className="tb-input" value={rolesText} onChange={(event) => setRolesText(event.target.value)} placeholder="Backend Engineer, Designer" />
            </label>

            <label className="tb-field">
              Search skills
              <span className="tb-input tb-search">
                <Search size={15} />
                <input value={skillQuery} onChange={(event) => setSkillQuery(event.target.value)} placeholder="Python, SQL, React…" />
              </span>
            </label>
            <div className="tb-skills" aria-label="Skill catalogue">
              {skillMatches.map((skill) => {
                const selected = skills.some((item) => item.name === skill.name);
                return (
                  <button key={skill.name} type="button" className={`tb-chip${selected ? ' is-on' : ''}`} onClick={() => toggleSkill(skill.name)}>
                    {skill.name} · {skill.employees}
                  </button>
                );
              })}
              {catalogue && catalogue.skills.length === 0 && <p className="tb-help">No skills are recorded for active employees yet.</p>}
              {catalogue && catalogue.skills.length > 0 && skillMatches.length === 0 && <p className="tb-help">No catalogue skill matches that search.</p>}
            </div>
            {skills.length > 0 && (
              <div className="tb-picked">
                {skills.map((skill) => (
                  <label key={skill.name}>
                    {skill.name}
                    <select className="tb-select" value={skill.priority} onChange={(event) => setPriority(skill.name, event.target.value as TbSkillRequirement['priority'])}>
                      <option value="mandatory">Mandatory</option>
                      <option value="important">Important</option>
                      <option value="optional">Optional</option>
                    </select>
                  </label>
                ))}
              </div>
            )}

            <label className="tb-field">
              Anything else the team should know
              <textarea value={context} onChange={(event) => setContext(event.target.value)} placeholder="Mention a catalogue skill, such as Node.js, if it should be considered." />
            </label>
            <label className="tb-check">
              <input type="checkbox" checked={allowSmaller} onChange={(event) => setAllowSmaller(event.target.checked)} />
              A smaller team is acceptable if fewer people are eligible.
            </label>
            <button type="button" className="tb-btn tb-btn--primary" disabled={!canGenerate} onClick={generate}>
              {busy ? <Loader2 className="tb-spin" size={16} /> : <Wand2 size={16} />}
              {busy ? 'Building teams…' : 'Generate teams'}
            </button>
            {!canGenerate && !busy && <p className="tb-help">Add a project name of at least 3 characters, or pick an existing project.</p>}

            <div className="tb-split">
              <h3><Users size={16} /> Record availability</h3>
              <p className="tb-help">People without a record stay marked unknown. Unknown availability is not treated as free time.</p>
              <label className="tb-field">
                Employee
                <select className="tb-select" value={capacityEmployee} onChange={(event) => setCapacityEmployee(event.target.value)}>
                  <option value="">Choose an employee</option>
                  {catalogue?.employees.map((person) => (
                    <option key={person.id} value={person.id}>{person.full_name}</option>
                  ))}
                </select>
              </label>
              <label className="tb-field">
                Can give this project {capacityPct}%
                <input className="tb-range" type="range" min={0} max={100} step={10} value={capacityPct} onChange={(event) => setCapacityPct(Number(event.target.value))} />
              </label>
              <button type="button" className="tb-btn tb-btn--ghost" disabled={busy || !capacityEmployee} onClick={saveCapacity}>
                Save availability
              </button>
            </div>
          </section>

          <div className="tb-results">
            <section className="tb-stats">
              <div className="tb-stat">
                <span>Active employees</span>
                <strong>{catalogue?.workforce.active ?? 0}</strong>
              </div>
              <div className="tb-stat tb-stat--good">
                <span>Availability recorded</span>
                <strong>{catalogue?.workforce.with_capacity ?? 0}</strong>
              </div>
              <div className="tb-stat tb-stat--warn">
                <span>Availability unknown</span>
                <strong>{catalogue?.workforce.without_capacity ?? 0}</strong>
              </div>
            </section>

            {!run && (
              <section className="tb-card tb-empty">
                <Wand2 size={28} color="var(--color-primary)" />
                <h2>No team yet</h2>
                <p className="tb-help">Fill in the brief and generate. The result is saved, so it will still be here after you refresh.</p>
              </section>
            )}

            {run && (
              <>
                <section className="tb-card">
                  <div className="tb-run-top">
                    <div>
                      <h2>{run.request.project_name}</h2>
                      <p className="tb-help">
                        {run.options.length === 1 ? '1 generated team' : `${run.options.length} generated teams`}
                        {(run.existing_teams || []).length > 0 ? ` · ${run.existing_teams?.length} existing ${(run.existing_teams?.length || 0) === 1 ? 'team' : 'teams'}` : ''}
                        {' '}· {run.eligible_count} eligible people · {run.requested_headcount} requested
                      </p>
                    </div>
                    <span className="tb-pill">{run.status.replace(/_/g, ' ')}</span>
                  </div>
                  {run.context_skills.length > 0 && <p className="tb-note">From your notes, these optional skills were added: {run.context_skills.join(', ')}.</p>}
                  {run.warnings.map((warning) => <p key={warning} className="tb-note tb-note--warn">{warning}</p>)}
                </section>

                {resultCards.length > 1 && (
                  <section className="tb-card tb-table-wrap">
                    <table className="tb-table">
                      <thead>
                        <tr>
                          <th>Compare</th>
                          {resultCards.map((option) => <th key={option.id}>{option.name}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        <CompareRow label="Fit" options={resultCards} cell={(option) => feasibilityLabel[option.feasibility] || option.feasibility} />
                        <CompareRow label="People" options={resultCards} cell={(option) => `${option.metrics?.actual_headcount ?? 0} of ${option.metrics?.requested_headcount ?? run.requested_headcount}`} />
                        <CompareRow label="Mandatory skills" options={resultCards} cell={(option) => pct(option.metrics?.mandatory_coverage)} />
                        <CompareRow label="Weighted skills" options={resultCards} cell={(option) => pct(option.metrics?.weighted_coverage)} />
                        <CompareRow label="Proficiency" options={resultCards} cell={(option) => pct(option.metrics?.proficiency_coverage)} />
                        <CompareRow label="Roles" options={resultCards} cell={(option) => pct(option.metrics?.role_coverage)} />
                        <CompareRow label="Known availability" options={resultCards} cell={(option) => pct(option.metrics?.capacity_fit)} />
                        <CompareRow label="Departments" options={resultCards} cell={(option) => String(option.metrics?.department_count ?? 0)} />
                      </tbody>
                    </table>
                  </section>
                )}

                {resultCards.map((option) => {
                  const skillsOpen = option.uncovered.length > 0;
                  const fitTone = option.feasibility === 'feasible' && !skillsOpen ? 'good' : option.feasibility === 'empty' ? 'bad' : 'warn';
                  const fitLabel = option.feasibility === 'feasible' && skillsOpen
                    ? 'Skills still open'
                    : feasibilityLabel[option.feasibility] || option.feasibility;
                  const summary = (option.rationale || '')
                    .replace(new RegExp(`^${option.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[:.]?\\s*`), '')
                    .split(/(?<=\.)\s+/)
                    .filter((sentence) => !/^feasibility is/i.test(sentence) && !/^uncovered requirements/i.test(sentence))
                    .join(' ');
                  const score = option.skill_model?.score;
                  return (
                  <article key={option.id} className="tb-card tb-option">
                    <div className="tb-option-head">
                      <div className="tb-option-copy">
                        <p className="tb-option-pills">
                          <span className={`tb-pill tb-pill--${fitTone}`}>{fitLabel}</span>
                          <span className="tb-pill">{statusLabel[option.option_status] || option.option_status}</span>
                        </p>
                        <h2>{option.name}</h2>
                        {summary && <p className="tb-help">{summary}</p>}
                      </div>
                      <div className="tb-score" title={option.skill_model?.meaning || 'Model estimate of how well this roster matches the skills in the brief.'}>
                        <strong>{score ?? '—'}</strong>
                        {score != null && <em>/100</em>}
                        <span>{option.skill_model?.label || 'Skill model'}</span>
                      </div>
                    </div>
                    {!!option.skill_model?.skills_used?.length && (
                      <div className="tb-skill-row" aria-label="Skills in this brief">
                        {option.skill_model.skills_used.map((skill) => {
                          const gap = option.uncovered.find((item) => item.skill === skill);
                          return (
                            <span key={skill} className={gap ? 'tb-skill tb-skill--gap' : 'tb-skill tb-skill--ok'}>
                              {skill}
                              <em>{gap ? 'missing' : 'covered'}</em>
                            </span>
                          );
                        })}
                      </div>
                    )}
                    {option.warnings.map((warning) => <p key={warning} className="tb-note tb-note--warn">{warning}</p>)}
                    {option.skill_model?.warning && (
                      <p className="tb-note tb-score-note" title={option.skill_model.warning}>
                        Demonstration score from simulated skill matches. It is not a project-success probability.
                      </p>
                    )}
                    <div className="tb-people">
                      {option.members.map((member) => (
                        <div key={member.employee_id} className="tb-person">
                          <div className="tb-avatar" aria-hidden>{initials(member.full_name)}</div>
                          <div>
                            <h4>{member.full_name}</h4>
                            <p className="tb-person-meta">
                              <span>{member.role || 'Role not recorded'}</span>
                              <span>{member.department || 'No department'}</span>
                              <span className={`tb-pill tb-pill--${member.capacity_status === 'sufficient' ? 'good' : member.capacity_status === 'conflict' ? 'bad' : 'warn'}`}>
                                {member.capacity_status === 'sufficient' ? 'Available' : member.capacity_status === 'conflict' ? 'Overbooked' : 'Availability unknown'}
                              </span>
                            </p>
                            <p className="tb-why" title={member.explanation}>{member.explanation}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {option.assignments.length > 0 && (
                      <p className="tb-note">Saved assignments: {option.assignments.map((row) => `${row.project_name} at ${row.allocation_pct}%`).join('; ')}</p>
                    )}
                    <div className="tb-actions tb-option-actions">
                      {option.option_status === 'proposed' && (
                        <button type="button" className="tb-btn tb-btn--good" disabled={busy} onClick={() => assemble(option)}>
                          <CheckCircle2 size={15} /> Approve and assemble
                        </button>
                      )}
                      {(() => {
                        const sameTeam = (item: TbJoinRequest) => item.option_id === option.id || item.team_id === option.id || item.team_id === option.team_id;
                        const pending = joinRequests.find((item) => sameTeam(item) && item.status === 'pending');
                        const accepted = joinRequests.find((item) => sameTeam(item) && item.status === 'accepted');
                        if (accepted) return <button type="button" className="tb-btn tb-btn--ghost" disabled>Joined</button>;
                        if (pending) return <button type="button" className="tb-btn tb-btn--ghost" disabled>Join requested</button>;
                        return (
                          <button type="button" className="tb-btn tb-btn--ghost" disabled={busy} onClick={() => askToJoin(option)}>
                            Ask to join
                          </button>
                        );
                      })()}
                      {option.source !== 'existing' && option.option_status !== 'assembled' && option.option_status !== 'rejected' && option.option_status !== 'superseded' && (
                        <button type="button" className="tb-btn tb-btn--ghost" disabled={busy} onClick={() => reject(option)}>
                          Reject
                        </button>
                      )}
                    </div>
                  </article>
                  );
                })}
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const CompareRow: React.FC<{ label: string; options: TbOption[]; cell: (option: TbOption) => string }> = ({ label, options, cell }) => (
  <tr>
    <th>{label}</th>
    {options.map((option) => <td key={option.id}>{cell(option)}</td>)}
  </tr>
);
