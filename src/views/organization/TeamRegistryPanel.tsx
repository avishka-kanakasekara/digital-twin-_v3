import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Loader2, Search, Users } from 'lucide-react';
import { teamBuilderAPI, type TbCatalogue, type TbTeam, type TbWorkspace } from '../../lib/api';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../contexts/AuthContext';

const statusLabel: Record<string, string> = {
  draft: 'Draft',
  pending_approval: 'Pending approval',
  registered: 'Registered',
  rejected: 'Rejected',
  archived: 'Archived',
  forming: 'Forming',
  ready: 'Ready',
  assigned: 'Assigned to project',
  pending: 'Pending',
  accepted: 'Accepted',
  declined: 'Declined',
  cancelled: 'Cancelled',
};

export const TeamRegistryPanel: React.FC<{ catalogue: TbCatalogue | null }> = ({ catalogue }) => {
  const { projectTypes } = useSettings();
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState<TbWorkspace | null>(null);
  const [selected, setSelected] = useState<TbTeam | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState('');
  const [objective, setObjective] = useState('');
  const [teamType, setTeamType] = useState('Project Team');
  const [projectType, setProjectType] = useState(projectTypes[0] || 'New Product Development');
  const [projectName, setProjectName] = useState('');
  const [headcount, setHeadcount] = useState(4);
  const [context, setContext] = useState('');
  const [skillQuery, setSkillQuery] = useState('');
  const [skills, setSkills] = useState<{ name: string; priority: 'mandatory' | 'important' | 'optional' }[]>([]);
  const [colleague, setColleague] = useState('');
  const [place, setPlace] = useState<'register' | 'invites' | 'approvals' | 'mine'>('register');

  const load = async () => {
    const data = await teamBuilderAPI.workspace();
    setWorkspace(data);
    setSelected((current) => (current ? data.teams.find((team) => team.id === current.id) || current : null));
  };

  useEffect(() => {
    let live = true;
    teamBuilderAPI.workspace().then((data) => {
      if (live) setWorkspace(data);
    }).catch((err) => {
      if (live) setError(err instanceof Error ? err.message : 'Teams could not be loaded.');
    });
    return () => {
      live = false;
    };
  }, [user?.id]);

  const matches = useMemo(() => {
    const query = skillQuery.trim().toLowerCase();
    return (catalogue?.skills || []).filter((skill) => !query || skill.name.toLowerCase().includes(query)).slice(0, 12);
  }, [catalogue, skillQuery]);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The team could not be updated.');
    } finally {
      setBusy(false);
    }
  };

  const create = () => run(async () => {
    const team = await teamBuilderAPI.createTeam({
      name,
      objective,
      team_type: teamType,
      project_type: projectType,
      project_name: projectName,
      headcount,
      context,
      skills,
    });
    setSelected(team);
    setPlace('mine');
    setNotice(`${team.name} is saved. Open it and choose Register team when the roster is ready.`);
    setName('');
    await load();
  });

  const openTeam = (team: TbTeam) => {
    setSelected(team);
    setPlace('mine');
  };

  const canRegister = (team: TbTeam) => team.registration_status === 'draft' || team.registration_status === 'rejected';

  return (
    <div className="tb-results">
      {error && <div className="tb-banner tb-banner--error" role="alert">{error}</div>}
      {notice && <div className="tb-banner tb-banner--ok" role="status"><CheckCircle2 size={16} /> {notice}</div>}

      <div className="tb-seg tb-places" role="tablist">
        <button type="button" role="tab" aria-selected={place === 'register'} className={place === 'register' ? 'is-on' : ''} onClick={() => setPlace('register')}>Register a team</button>
        <button type="button" role="tab" aria-selected={place === 'invites'} className={place === 'invites' ? 'is-on' : ''} onClick={() => setPlace('invites')}>Invitations ({(workspace?.incoming.length ?? 0) + (workspace?.join_requests || []).filter((item) => item.status === 'pending').length})</button>
        <button type="button" role="tab" aria-selected={place === 'approvals'} className={place === 'approvals' ? 'is-on' : ''} onClick={() => setPlace('approvals')}>Approvals ({(workspace?.review.length ?? 0) + (workspace?.join_reviews || []).length})</button>
        <button type="button" role="tab" aria-selected={place === 'mine'} className={place === 'mine' ? 'is-on' : ''} onClick={() => setPlace('mine')}>My teams ({workspace?.teams.length ?? 0})</button>
      </div>

      {place === 'register' && <section className="tb-card">
        <h2><Users size={18} /> Register a team</h2>
        <p className="tb-help">{workspace?.registration_policy || 'A team stays pending until someone other than its creator approves it.'}</p>
        <label className="tb-field">Team name<input className="tb-input" value={name} onChange={(event) => setName(event.target.value)} placeholder="Billing companions" /></label>
        <label className="tb-field">What this team is for<textarea value={objective} onChange={(event) => setObjective(event.target.value)} placeholder="Move the billing service before the renewal." /></label>
        <div className="tb-grid-2">
          <label className="tb-field">Team type
            <select className="tb-select" value={teamType} onChange={(event) => setTeamType(event.target.value)}>
              {(workspace?.team_types || [teamType]).map((type) => <option key={type}>{type}</option>)}
            </select>
          </label>
          <label className="tb-field">Project type
            <select className="tb-select" value={projectType} onChange={(event) => setProjectType(event.target.value)}>
              {projectTypes.map((type) => <option key={type}>{type}</option>)}
            </select>
          </label>
        </div>
        <label className="tb-field">Project or brief<input className="tb-input" value={projectName} onChange={(event) => setProjectName(event.target.value)} placeholder="Billing migration" /></label>
        <label className="tb-field">Team size · {headcount}
          <input className="tb-range" type="range" min={2} max={10} value={headcount} onChange={(event) => setHeadcount(Number(event.target.value))} />
        </label>
        <label className="tb-field">Skills
          <span className="tb-input tb-search"><Search size={15} /><input value={skillQuery} onChange={(event) => setSkillQuery(event.target.value)} placeholder="Search the catalogue" /></span>
        </label>
        <div className="tb-skills">
          {matches.map((skill) => {
            const on = skills.some((item) => item.name === skill.name);
            return (
              <button key={skill.name} type="button" className={`tb-chip${on ? ' is-on' : ''}`} onClick={() => setSkills((current) => on ? current.filter((item) => item.name !== skill.name) : [...current, { name: skill.name, priority: 'important' }])}>
                {skill.name}
              </button>
            );
          })}
        </div>
        <label className="tb-field">Additional context<textarea value={context} onChange={(event) => setContext(event.target.value)} placeholder="Mention a catalogue skill if it should be considered." /></label>
        <button type="button" className="tb-btn tb-btn--primary" disabled={busy || name.trim().length < 3} onClick={create}>
          {busy ? <Loader2 className="tb-spin" size={16} /> : null} Save team
        </button>
        {!catalogue && <p className="tb-help">The skill list is still loading. You can save the team now and add skills after it appears.</p>}
      </section>}

      {place === 'invites' && (
        <section className="tb-card">
          <h2>Invitations</h2>
          <p className="tb-help">Invitations sent to you appear here. Accepting adds you as a confirmed member. People you invited see the same invitation when they sign in.</p>
          {(workspace?.incoming.length || 0) === 0 && (workspace?.outgoing?.length || 0) === 0 && (workspace?.join_requests || []).filter((item) => item.status === 'pending').length === 0 && <p className="tb-help">No invitations or join requests are waiting.</p>}
          {(workspace?.join_requests || []).filter((item) => item.status === 'pending').map((request) => (
            <div key={request.id} className="tb-team-row">
              <div>
                <h3>Request to join {request.team_name}</h3>
                <p className="tb-help">Pending. You are not on the team until someone else accepts.</p>
              </div>
              <button type="button" className="tb-btn tb-btn--ghost" disabled={busy} onClick={() => run(async () => { await teamBuilderAPI.cancelJoin(request.id); setNotice('Join request cancelled.'); await load(); })}>Cancel request</button>
            </div>
          ))}
          <div className="tb-team-list">
            {workspace?.incoming.map((invitation) => (
              <div key={invitation.id} className="tb-team-row">
                <div>
                  <h3>{invitation.team_name}</h3>
                  <p className="tb-help">You are not a member until you accept.</p>
                </div>
                <div className="tb-actions">
                  <button type="button" className="tb-btn tb-btn--good" disabled={busy} onClick={() => run(async () => { await teamBuilderAPI.accept(invitation.id); setNotice(`You joined ${invitation.team_name}.`); await load(); })}>Accept</button>
                  <button type="button" className="tb-btn tb-btn--ghost" disabled={busy} onClick={() => run(async () => { await teamBuilderAPI.decline(invitation.id); setNotice('Invitation declined.'); await load(); })}>Decline</button>
                </div>
              </div>
            ))}
          </div>
          {(workspace?.outgoing?.length || 0) > 0 && (
            <div className="tb-team-list">
              <h3>Sent and still waiting</h3>
              {workspace?.outgoing?.map((invitation) => (
                <div key={invitation.id} className="tb-team-row">
                  <div>
                    <h3>{invitation.full_name || 'Colleague'}</h3>
                    <p className="tb-help">Waiting for them to accept {invitation.team_name}. They see this under Invitations after they sign in.</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {place === 'approvals' && (
        <section className="tb-card">
          <h2>Approvals</h2>
          <p className="tb-help">HR and the creator's manager can approve a team. Approving registers it. The creator cannot approve their own team.</p>
          {!workspace?.can_review && <p className="tb-help">Approvals appear here for HR and managers.</p>}
          {workspace?.can_review && workspace.review.length === 0 && (workspace.join_reviews || []).length === 0 && <p className="tb-help">Nothing is waiting for your decision.</p>}
          {(workspace?.join_reviews || []).map((request) => (
            <div key={request.id} className="tb-team-row">
              <div>
                <h3>{request.full_name || 'An employee'} asked to join {request.team_name}</h3>
                <p className="tb-help">Accepting adds them as a confirmed member.</p>
              </div>
              <div className="tb-actions">
                <button type="button" className="tb-btn tb-btn--good" disabled={busy} onClick={() => run(async () => { await teamBuilderAPI.acceptJoin(request.id); setNotice('Join request accepted.'); await load(); })}>Accept</button>
                <button type="button" className="tb-btn tb-btn--ghost" disabled={busy} onClick={() => run(async () => { await teamBuilderAPI.declineJoin(request.id); setNotice('Join request declined.'); await load(); })}>Decline</button>
              </div>
            </div>
          ))}
          <div className="tb-team-list">
            {workspace?.review.map((team) => (
              <div key={team.id} className="tb-team-row">
                <div>
                  <h3>{team.name}</h3>
                  <p className="tb-help">{team.members.length} confirmed · {statusLabel[team.registration_status] || team.registration_status}</p>
                </div>
                <div className="tb-actions">
                  <button type="button" className="tb-btn tb-btn--ghost" onClick={() => openTeam(team)}>Open</button>
                  <button type="button" className="tb-btn tb-btn--good" disabled={busy} onClick={() => run(async () => { const saved = await teamBuilderAPI.approveTeam(team.id, 'Approved from Team Builder.'); setSelected(saved); setNotice(`${saved.name} is registered.`); await load(); })}>Approve and register</button>
                  <button type="button" className="tb-btn tb-btn--ghost" disabled={busy} onClick={() => run(async () => { const saved = await teamBuilderAPI.rejectTeam(team.id, 'Returned for a stronger roster.'); setSelected(saved); setNotice(`${saved.name} was rejected.`); await load(); })}>Reject</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {place === 'mine' && (
        <section className="tb-card">
          <h2>My teams</h2>
          <p className="tb-help">Teams you created, joined, or were invited to.</p>
          {!workspace && <p className="tb-help">Loading teams…</p>}
          {workspace && workspace.teams.length === 0 && <p className="tb-help">No teams yet. Use Register a team to create one.</p>}
          <div className="tb-team-list">
            {workspace?.teams.map((team) => (
              <div key={team.id} className="tb-team-row">
                <div>
                  <h3>{team.name}</h3>
                  <p className="tb-help">{statusLabel[team.registration_status] || team.registration_status} · {statusLabel[team.operational_status] || team.operational_status}</p>
                </div>
                <div className="tb-actions">
                  <button type="button" className="tb-btn tb-btn--ghost" onClick={() => openTeam(team)}>Open</button>
                  {canRegister(team) && (
                    <button type="button" className="tb-btn tb-btn--primary" disabled={busy} onClick={() => run(async () => { const saved = await teamBuilderAPI.submitTeam(team.id); setSelected(saved); setNotice(`${saved.name} is submitted for registration.`); await load(); })}>Register team</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {place === 'mine' && selected && (
        <article className="tb-card">
          <div className="tb-option-head">
            <div>
              <h2>{selected.name}</h2>
              <p className="tb-help">{selected.objective || 'No objective yet.'}</p>
              <p className="tb-note">
                <span className="tb-pill">{statusLabel[selected.registration_status] || selected.registration_status}</span>{' '}
                <span className="tb-pill">{statusLabel[selected.operational_status] || selected.operational_status}</span>{' '}
                <span className="tb-pill">{selected.origin.replace(/_/g, ' ')}</span>
              </p>
            </div>
          </div>
          {selected.decision_note && <p className="tb-note">Decision: {selected.decision_note}{selected.decided_by ? ` — ${selected.decided_by}` : ''}</p>}
          <label className="tb-field">Invite a colleague
            <select className="tb-select" value={colleague} onChange={(event) => setColleague(event.target.value)}>
              <option value="">{catalogue ? 'Choose an employee' : 'Colleagues are still loading'}</option>
              {(catalogue?.employees || []).filter((person) => person.id !== user?.id).map((person) => <option key={person.id} value={person.id}>{person.full_name}</option>)}
            </select>
          </label>
          {!catalogue && <p className="tb-help">The colleague list is still loading. Invitations can be sent once a name appears.</p>}
          <div className="tb-actions">
            <button type="button" className="tb-btn tb-btn--ghost" disabled={busy || !colleague} onClick={() => run(async () => {
              const person = catalogue?.employees.find((item) => item.id === colleague);
              const team = await teamBuilderAPI.invite(selected.id, [colleague]);
              setSelected(team);
              setColleague('');
              setPlace('invites');
              setNotice(`Invitation sent to ${person?.full_name || 'your colleague'}. They will see it under Invitations when they sign in.`);
              await load();
            })}>Send invitation</button>
            <button type="button" className="tb-btn tb-btn--ghost" disabled={busy} onClick={() => run(async () => { const team = await teamBuilderAPI.evaluateTeam(selected.id); setSelected(team); setNotice(team.prediction?.display_label || 'Evaluation saved.'); await load(); })}>Estimate success</button>
            {canRegister(selected) && (
              <button type="button" className="tb-btn tb-btn--primary" disabled={busy} onClick={() => run(async () => { const team = await teamBuilderAPI.submitTeam(selected.id); setSelected(team); setNotice(`${team.name} is submitted for registration.`); await load(); })}>Register team</button>
            )}
            {selected.can_decide && (
              <button type="button" className="tb-btn tb-btn--good" disabled={busy} onClick={() => run(async () => { const team = await teamBuilderAPI.approveTeam(selected.id, 'Approved from Team Builder.'); setSelected(team); setNotice('Team registered.'); await load(); })}>Approve and register</button>
            )}
            {selected.registration_status === 'registered' && selected.operational_status !== 'assigned' && workspace?.can_review && selected.creator_id !== user?.id && (
              <button type="button" className="tb-btn tb-btn--good" disabled={busy} onClick={() => run(async () => { const team = await teamBuilderAPI.assignTeam(selected.id); setSelected(team); setNotice('Team assigned to the project.'); await load(); })}>Assign to project</button>
            )}
          </div>
          <div className="tb-people">
            {selected.members.map((member) => (
              <div key={member.employee_id} className="tb-person">
                <div>
                  <h4>{member.full_name || 'Employee'}</h4>
                  <p>{member.role || 'Role not recorded'} · {member.department || 'No department'} · {member.membership_status} · {member.source.replace(/_/g, ' ')}</p>
                </div>
              </div>
            ))}
          </div>
          {selected.invitations.length > 0 && (
            <p className="tb-note">Invitations: {selected.invitations.map((row) => `${row.full_name || 'Colleague'} (${row.status})`).join(', ')}</p>
          )}
          {workspace?.model && <p className="tb-help">{workspace.model.available ? 'The success estimate is a Demo / Synthetic-Data Model. It is not a validated company probability.' : 'Prediction unavailable until the model artifact is loaded.'}</p>}
          {selected.prediction && (
            <div className="tb-note">
              <strong>{selected.prediction.stale ? 'Previous estimate is out of date. Evaluate the team again.' : selected.prediction.display_label}</strong>
              <p>{selected.prediction.warning}</p>
              {selected.prediction.strengths.map((item) => <p key={item}>{item}</p>)}
              {selected.prediction.risks.map((item) => <p key={item}>{item}</p>)}
              {selected.prediction.missing.map((item) => <p key={item}>{item}</p>)}
            </div>
          )}
          {selected.evaluation && <p className="tb-note">Coverage result: {selected.evaluation.feasibility.replace(/_/g, ' ')}. This is separate from the success estimate.</p>}
          {selected.can_decide && (
            <div className="tb-actions">
              <button type="button" className="tb-btn tb-btn--ghost" disabled={busy} onClick={() => run(async () => { const team = await teamBuilderAPI.rejectTeam(selected.id, 'Returned for a stronger roster.'); setSelected(team); setNotice('Registration rejected.'); await load(); })}>Reject</button>
            </div>
          )}
        </article>
      )}
    </div>
  );
};
