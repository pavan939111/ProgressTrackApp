import { Team, TeamMember, WeeklyGoal } from '@/types';

const TEAMS_KEY = 'pta_teams';
const ACTIVE_TEAM_KEY = 'pta_active_team';

function uid() {
  return `tm-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function inviteCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function loadTeams(): Team[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(TEAMS_KEY);
    return raw ? (JSON.parse(raw) as Team[]) : seedTeams();
  } catch {
    return seedTeams();
  }
}

function seedTeams(): Team[] {
  const now = new Date().toISOString();
  const team: Team = {
    teamId: 'team-demo-1',
    name: 'Execution Squad',
    inviteCode: 'PTA2026',
    ownerUid: 'demo-user-123',
    members: [
      {
        memberId: 'm1',
        uid: 'demo-user-123',
        email: 'demo.user@example.com',
        fullName: 'Demo User',
        role: 'owner',
        joinedAt: now,
      },
      {
        memberId: 'm2',
        uid: 'user-sam',
        email: 'sam.member@example.com',
        fullName: 'Sam Member',
        role: 'member',
        joinedAt: now,
      },
    ],
    sharedGoalIds: ['wg-1'],
    createdAt: now,
    updatedAt: now,
  };
  saveTeams([team]);
  return [team];
}

export function saveTeams(teams: Team[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TEAMS_KEY, JSON.stringify(teams));
}

export function getActiveTeamId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACTIVE_TEAM_KEY);
}

export function setActiveTeamId(teamId: string | null) {
  if (typeof window === 'undefined') return;
  if (teamId) localStorage.setItem(ACTIVE_TEAM_KEY, teamId);
  else localStorage.removeItem(ACTIVE_TEAM_KEY);
}

export function createTeam(
  name: string,
  owner: { uid: string; email: string; fullName: string }
): Team {
  const now = new Date().toISOString();
  const team: Team = {
    teamId: uid(),
    name,
    inviteCode: inviteCode(),
    ownerUid: owner.uid,
    members: [
      {
        memberId: uid(),
        uid: owner.uid,
        email: owner.email,
        fullName: owner.fullName,
        role: 'owner',
        joinedAt: now,
      },
    ],
    sharedGoalIds: [],
    createdAt: now,
    updatedAt: now,
  };
  const teams = loadTeams();
  teams.push(team);
  saveTeams(teams);
  setActiveTeamId(team.teamId);
  return team;
}

export function joinTeamByCode(
  code: string,
  member: { uid: string; email: string; fullName: string }
): Team | null {
  const teams = loadTeams();
  const team = teams.find((t) => t.inviteCode.toUpperCase() === code.toUpperCase());
  if (!team) return null;
  if (team.members.some((m) => m.uid === member.uid || m.email === member.email)) {
    setActiveTeamId(team.teamId);
    return team;
  }
  const entry: TeamMember = {
    memberId: uid(),
    uid: member.uid,
    email: member.email,
    fullName: member.fullName,
    role: 'member',
    joinedAt: new Date().toISOString(),
  };
  team.members.push(entry);
  team.updatedAt = new Date().toISOString();
  saveTeams(teams);
  setActiveTeamId(team.teamId);
  return team;
}

export function shareGoalWithTeam(teamId: string, goalId: string) {
  const teams = loadTeams();
  const team = teams.find((t) => t.teamId === teamId);
  if (!team) return;
  if (!team.sharedGoalIds.includes(goalId)) {
    team.sharedGoalIds.push(goalId);
    team.updatedAt = new Date().toISOString();
    saveTeams(teams);
  }
}

export function getSharedGoals(team: Team, goals: WeeklyGoal[]): WeeklyGoal[] {
  return goals.filter((g) => team.sharedGoalIds.includes(g.goalId));
}
