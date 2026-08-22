import {
  UserProfile,
  Organization,
  DebateEvent,
  Team,
  Speaker,
  Judge,
  DebateRound,
  DebateRoom,
  Ballot,
  Survey,
  SurveyResponse,
  AuditLog,
} from "../types";
import {
  INITIAL_ORGANIZATION,
  INITIAL_USER,
  INITIAL_USERS,
  INITIAL_EVENTS,
  INITIAL_ROUNDS,
  INITIAL_TEAMS,
  INITIAL_SPEAKERS,
  INITIAL_JUDGES,
  INITIAL_ROOMS,
  INITIAL_BALLOTS,
  INITIAL_SURVEYS,
  INITIAL_SURVEY_RESPONSES,
  INITIAL_AUDIT_LOGS,
} from "./initialData";
import { surveyService } from "../services/surveyService";
import { isSupabaseConfigured } from "./supabase";

// Storage keys
const STORAGE_KEYS = {
  USER: "tabula_current_user",
  AUTH_TOKEN: "tabula_auth_token",
  ORGANIZATION: "tabula_organization",
  USERS: "tabula_users",
  EVENTS: "tabula_events",
  ROUNDS: "tabula_rounds",
  TEAMS: "tabula_teams",
  SPEAKERS: "tabula_speakers",
  JUDGES: "tabula_judges",
  ROOMS: "tabula_rooms",
  BALLOTS: "tabula_ballots",
  SURVEYS: "tabula_surveys",
  SURVEY_RESPONSES: "tabula_survey_responses",
  AUDIT_LOGS: "tabula_audit_logs",
};

// Helper for local storage reading
function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.warn(`Error loading ${key} from localStorage:`, e);
    return fallback;
  }
}

// Helper for local storage writing
function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Error saving ${key} to localStorage:`, e);
  }
}

class TabulaStore {
  private currentUser: UserProfile | null;
  private apiToken: string | null;
  private organization: Organization | null;
  private users: UserProfile[];
  private events: DebateEvent[];
  private rounds: DebateRound[];
  private teams: Team[];
  private speakers: Speaker[];
  private judges: Judge[];
  private rooms: DebateRoom[];
  private ballots: Ballot[];
  private surveys: Survey[];
  private surveyResponses: SurveyResponse[];
  private auditLogs: AuditLog[];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.currentUser = loadFromStorage<UserProfile | null>(
      STORAGE_KEYS.USER,
      null,
    );
    this.apiToken = loadFromStorage<string | null>(
      STORAGE_KEYS.AUTH_TOKEN,
      null,
    );
    this.organization = isSupabaseConfigured
      ? null
      : loadFromStorage<Organization>(
          STORAGE_KEYS.ORGANIZATION,
          INITIAL_ORGANIZATION,
        );
    this.users = isSupabaseConfigured
      ? []
      : loadFromStorage(STORAGE_KEYS.USERS, INITIAL_USERS);
    this.events = isSupabaseConfigured
      ? []
      : loadFromStorage(STORAGE_KEYS.EVENTS, INITIAL_EVENTS);
    this.rounds = isSupabaseConfigured
      ? []
      : loadFromStorage(STORAGE_KEYS.ROUNDS, INITIAL_ROUNDS);
    this.teams = isSupabaseConfigured
      ? []
      : loadFromStorage(STORAGE_KEYS.TEAMS, INITIAL_TEAMS);
    this.speakers = isSupabaseConfigured
      ? []
      : loadFromStorage(STORAGE_KEYS.SPEAKERS, INITIAL_SPEAKERS);
    this.judges = isSupabaseConfigured
      ? []
      : loadFromStorage(STORAGE_KEYS.JUDGES, INITIAL_JUDGES);
    this.rooms = isSupabaseConfigured
      ? []
      : loadFromStorage(STORAGE_KEYS.ROOMS, INITIAL_ROOMS);
    this.ballots = isSupabaseConfigured
      ? []
      : loadFromStorage(STORAGE_KEYS.BALLOTS, INITIAL_BALLOTS);
    this.surveys = isSupabaseConfigured
      ? []
      : loadFromStorage(STORAGE_KEYS.SURVEYS, INITIAL_SURVEYS);
    this.surveyResponses = isSupabaseConfigured
      ? []
      : loadFromStorage(
          STORAGE_KEYS.SURVEY_RESPONSES,
          INITIAL_SURVEY_RESPONSES,
        );
    this.auditLogs = isSupabaseConfigured
      ? []
      : loadFromStorage(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);

    void this.hydrateFromApi();
    this.loadSurveysFromApi();
  }

  public async hydrateFromApi(): Promise<void> {
    try {
      const authHeaders = this.getApiAuthHeaders();
      if (!authHeaders.Authorization) return;

      const [
        organizationRes,
        usersRes,
        eventsRes,
        roundsRes,
        teamsRes,
        speakersRes,
        judgesRes,
        roomsRes,
        ballotsRes,
        surveysRes,
      ] = await Promise.all([
        fetch("/api/organization", { headers: authHeaders }).then((r) =>
          r.json(),
        ),
        fetch("/api/users", { headers: authHeaders }).then((r) => r.json()),
        fetch("/api/events", { headers: authHeaders }).then((r) => r.json()),
        fetch("/api/rounds", { headers: authHeaders }).then((r) => r.json()),
        fetch("/api/teams", { headers: authHeaders }).then((r) => r.json()),
        fetch("/api/speakers", { headers: authHeaders }).then((r) => r.json()),
        fetch("/api/judges", { headers: authHeaders }).then((r) => r.json()),
        fetch("/api/rooms", { headers: authHeaders }).then((r) => r.json()),
        fetch("/api/ballots", { headers: authHeaders }).then((r) => r.json()),
        fetch("/api/surveys", { headers: authHeaders }).then((r) => r.json()),
      ]);

      if (organizationRes?.success && organizationRes.organization) {
        const organization = organizationRes.organization;
        this.organization = {
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
          type: organization.type,
          membersCount: organization.members_count ?? 0,
          eventsCount: organization.events_count ?? 0,
          createdAt: organization.created_at ?? new Date().toISOString(),
        };
        saveToStorage(STORAGE_KEYS.ORGANIZATION, this.organization);
      }

      if (usersRes?.success && Array.isArray(usersRes.users)) {
        this.users = usersRes.users;
        saveToStorage(STORAGE_KEYS.USERS, this.users);
      }

      if (eventsRes?.success && Array.isArray(eventsRes.events)) {
        this.events = eventsRes.events;
        saveToStorage(STORAGE_KEYS.EVENTS, this.events);
      }

      if (roundsRes?.success && Array.isArray(roundsRes.rounds)) {
        this.rounds = roundsRes.rounds;
        saveToStorage(STORAGE_KEYS.ROUNDS, this.rounds);
      }

      if (teamsRes?.success && Array.isArray(teamsRes.teams)) {
        this.teams = teamsRes.teams;
        saveToStorage(STORAGE_KEYS.TEAMS, this.teams);
      }

      if (speakersRes?.success && Array.isArray(speakersRes.speakers)) {
        this.speakers = speakersRes.speakers;
        saveToStorage(STORAGE_KEYS.SPEAKERS, this.speakers);
      }

      if (judgesRes?.success && Array.isArray(judgesRes.judges)) {
        this.judges = judgesRes.judges;
        saveToStorage(STORAGE_KEYS.JUDGES, this.judges);
      }

      if (roomsRes?.success && Array.isArray(roomsRes.rooms)) {
        this.rooms = roomsRes.rooms;
        saveToStorage(STORAGE_KEYS.ROOMS, this.rooms);
      }

      if (ballotsRes?.success && Array.isArray(ballotsRes.ballots)) {
        this.ballots = ballotsRes.ballots;
        saveToStorage(STORAGE_KEYS.BALLOTS, this.ballots);
      }

      if (surveysRes?.success && Array.isArray(surveysRes.surveys)) {
        this.surveys = surveysRes.surveys;
        saveToStorage(STORAGE_KEYS.SURVEYS, this.surveys);
      }

      this.notify();
    } catch (e) {
      console.warn("Could not hydrate store from backend API:", e);
    }
  }

  public async loadSurveysFromApi(): Promise<Survey[]> {
    // Public pages are allowed to render before login. Do not make an
    // authenticated API request until a session token is available.
    if (!this.apiToken) return this.surveys;

    try {
      const fetched = await surveyService.getAllSurveys();
      if (fetched && fetched.length > 0) {
        this.surveys = fetched;
        saveToStorage(STORAGE_KEYS.SURVEYS, this.surveys);
        this.notify();
      }
    } catch (e) {
      console.warn("Could not sync surveys from backend API:", e);
    }
    return this.surveys;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn());
  }

  // --- CURRENT USER & AUTH ---
  public getCurrentUser(): UserProfile | null {
    return this.currentUser;
  }

  public getApiToken(): string | null {
    return this.apiToken;
  }

  public getApiAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    if (this.apiToken) {
      headers.Authorization = `Bearer ${this.apiToken}`;
    }
    return headers;
  }

  public setApiToken(token: string | null): void {
    this.apiToken = token;
    saveToStorage(STORAGE_KEYS.AUTH_TOKEN, token);
    this.notify();
    if (token) void this.hydrateFromApi();
  }

  public setCurrentUser(user: UserProfile): void {
    this.currentUser = user;
    saveToStorage(STORAGE_KEYS.USER, user);
    this.notify();
  }

  public clearCurrentUser(): void {
    this.currentUser = null;
    this.apiToken = null;
    saveToStorage(STORAGE_KEYS.USER, null);
    saveToStorage(STORAGE_KEYS.AUTH_TOKEN, null);
    this.notify();
  }

  // --- ORGANIZATION ---
  public getOrganization(): Organization {
    return this.organization || INITIAL_ORGANIZATION;
  }

  public updateOrganization(updates: Partial<Organization>): void {
    this.organization = { ...this.organization, ...updates };
    saveToStorage(STORAGE_KEYS.ORGANIZATION, this.organization);
    this.logAudit(
      "ORGANIZATION_UPDATED",
      "Organization Settings",
      `Updated ${Object.keys(updates).join(", ")}`,
    );
    this.notify();
  }

  // --- USERS ---
  public getUsers(): UserProfile[] {
    return this.users;
  }

  public addUser(
    user: Omit<UserProfile, "id" | "createdAt" | "lastActivity">,
  ): UserProfile {
    const newUser: UserProfile = {
      ...user,
      id: `usr-${Date.now()}`,
      lastActivity: "Just created",
      createdAt: new Date().toISOString(),
    };
    this.users = [newUser, ...this.users];
    saveToStorage(STORAGE_KEYS.USERS, this.users);
    this.logAudit(
      "USER_CREATED",
      `User: ${newUser.email}`,
      `Assigned role ${newUser.role}`,
    );
    this.notify();
    return newUser;
  }

  public updateUser(id: string, updates: Partial<UserProfile>): void {
    this.users = this.users.map((u) =>
      u.id === id ? { ...u, ...updates } : u,
    );
    if (this.currentUser.id === id) {
      this.currentUser = { ...this.currentUser, ...updates };
      saveToStorage(STORAGE_KEYS.USER, this.currentUser);
    }
    saveToStorage(STORAGE_KEYS.USERS, this.users);
    this.logAudit(
      "USER_UPDATED",
      `User ID: ${id}`,
      `Updated profile properties`,
    );
    this.notify();
  }

  // --- EVENTS ---
  public getEvents(): DebateEvent[] {
    return this.events;
  }

  public getEventById(id: string): DebateEvent | undefined {
    return this.events.find((e) => e.id === id);
  }

  public addEvent(
    event: Omit<
      DebateEvent,
      | "id"
      | "organizationId"
      | "currentRound"
      | "teamsCount"
      | "speakersCount"
      | "judgesCount"
      | "isResultsPublished"
      | "createdAt"
    >,
  ): DebateEvent {
    const newEvent: DebateEvent = {
      ...event,
      id: `evt-${Date.now()}`,
      organizationId: this.organization.id,
      currentRound: 1,
      teamsCount: 0,
      speakersCount: 0,
      judgesCount: 0,
      isResultsPublished: false,
      createdAt: new Date().toISOString(),
    };
    this.events = [newEvent, ...this.events];
    saveToStorage(STORAGE_KEYS.EVENTS, this.events);
    this.logAudit(
      "EVENT_CREATED",
      `Event: ${newEvent.name}`,
      `Created format ${newEvent.format}`,
    );
    this.notify();
    return newEvent;
  }

  public updateEvent(id: string, updates: Partial<DebateEvent>): void {
    this.events = this.events.map((e) =>
      e.id === id ? { ...e, ...updates } : e,
    );
    saveToStorage(STORAGE_KEYS.EVENTS, this.events);
    this.logAudit(
      "EVENT_UPDATED",
      `Event ID: ${id}`,
      `Updated status/settings`,
    );
    this.notify();
  }

  // --- ROUNDS ---
  public getRounds(eventId?: string): DebateRound[] {
    if (!eventId) return this.rounds;
    return this.rounds.filter((r) => r.eventId === eventId);
  }

  public addRound(
    round: Omit<DebateRound, "id" | "completedRoomsCount">,
  ): DebateRound {
    const newRound: DebateRound = {
      ...round,
      id: `rnd-${Date.now()}`,
      completedRoomsCount: 0,
    };
    this.rounds = [...this.rounds, newRound];
    saveToStorage(STORAGE_KEYS.ROUNDS, this.rounds);
    this.logAudit(
      "ROUND_CREATED",
      `Round ${newRound.roundNumber}: ${newRound.name}`,
      `Motion: ${newRound.motion}`,
    );
    this.notify();
    return newRound;
  }

  // --- TEAMS ---
  public getTeams(eventId?: string): Team[] {
    if (!eventId) return this.teams;
    return this.teams.filter((t) => t.eventId === eventId);
  }

  public addTeam(
    team: Omit<
      Team,
      | "id"
      | "wins"
      | "losses"
      | "draws"
      | "totalPoints"
      | "speakerPoints"
      | "rank"
      | "status"
    >,
  ): Team {
    const newTeam: Team = {
      ...team,
      id: `tm-${Date.now()}`,
      wins: 0,
      losses: 0,
      draws: 0,
      totalPoints: 0,
      speakerPoints: 0,
      rank: this.teams.filter((t) => t.eventId === team.eventId).length + 1,
      status: "Active",
    };
    this.teams = [...this.teams, newTeam];
    saveToStorage(STORAGE_KEYS.TEAMS, this.teams);
    this.updateEventCounts(team.eventId);
    this.logAudit(
      "TEAM_REGISTERED",
      `Team: ${newTeam.name}`,
      `Institution: ${newTeam.institution}`,
    );
    this.notify();
    return newTeam;
  }

  // --- SPEAKERS ---
  public getSpeakers(eventId?: string): Speaker[] {
    if (!eventId) return this.speakers;
    return this.speakers.filter((s) => s.eventId === eventId);
  }

  public addSpeaker(
    speaker: Omit<
      Speaker,
      | "id"
      | "totalPoints"
      | "averageScore"
      | "highestScore"
      | "roundsDebated"
      | "rank"
    >,
  ): Speaker {
    const newSpeaker: Speaker = {
      ...speaker,
      id: `spk-${Date.now()}`,
      totalPoints: 0,
      averageScore: 0,
      highestScore: 0,
      roundsDebated: 0,
      rank:
        this.speakers.filter((s) => s.eventId === speaker.eventId).length + 1,
    };
    this.speakers = [...this.speakers, newSpeaker];
    saveToStorage(STORAGE_KEYS.SPEAKERS, this.speakers);
    this.updateEventCounts(speaker.eventId);
    this.logAudit(
      "SPEAKER_ADDED",
      `Speaker: ${newSpeaker.name}`,
      `Institution: ${newSpeaker.institution}`,
    );
    this.notify();
    return newSpeaker;
  }

  // --- JUDGES ---
  public getJudges(eventId?: string): Judge[] {
    if (!eventId) return this.judges;
    return this.judges.filter((j) => j.eventId === eventId);
  }

  public addJudge(
    judge: Omit<Judge, "id" | "assignedRounds" | "ballotsSubmitted" | "status">,
  ): Judge {
    const newJudge: Judge = {
      ...judge,
      id: `jdg-${Date.now()}`,
      assignedRounds: 0,
      ballotsSubmitted: 0,
      status: "Available",
    };
    this.judges = [...this.judges, newJudge];
    saveToStorage(STORAGE_KEYS.JUDGES, this.judges);
    this.updateEventCounts(judge.eventId);
    this.logAudit(
      "JUDGE_ADDED",
      `Judge: ${newJudge.name}`,
      `Experience: ${newJudge.experienceLevel}`,
    );
    this.notify();
    return newJudge;
  }

  // --- DEBATE ROOMS ---
  public getRooms(eventId?: string, roundId?: string): DebateRoom[] {
    let result = this.rooms;
    if (eventId) result = result.filter((r) => r.eventId === eventId);
    if (roundId) result = result.filter((r) => r.roundId === roundId);
    return result;
  }

  public addRoom(
    room: Omit<DebateRoom, "id" | "submittedBallots" | "status">,
  ): DebateRoom {
    const newRoom: DebateRoom = {
      ...room,
      id: `rm-${Date.now()}`,
      submittedBallots: 0,
      status: "Not Started",
    };
    this.rooms = [...this.rooms, newRoom];
    saveToStorage(STORAGE_KEYS.ROOMS, this.rooms);
    this.notify();
    return newRoom;
  }

  // --- BALLOTS & DETERMINISTIC TABULATION ENGINE ---
  public getBallots(eventId?: string): Ballot[] {
    if (!eventId) return this.ballots;
    return this.ballots.filter((b) => b.eventId === eventId);
  }

  public submitBallot(
    ballotInput: Omit<Ballot, "id" | "isLocked" | "submittedAt" | "status">,
  ): { success: boolean; message: string; ballot?: Ballot } {
    // Server-side / engine authorization and score bounds check
    const existing = this.ballots.find(
      (b) =>
        b.debateRoomId === ballotInput.debateRoomId &&
        b.judgeId === ballotInput.judgeId,
    );
    if (existing && existing.isLocked) {
      return {
        success: false,
        message:
          "This official ballot is already locked and cannot be modified.",
      };
    }

    // Validate speaker scores are within allowable bounds (e.g. 50-100)
    for (const spk of ballotInput.speakerScores) {
      if (spk.totalScore < 50 || spk.totalScore > 100) {
        return {
          success: false,
          message: `Speaker score (${spk.totalScore}) for ${spk.speakerName} must be between 50 and 100.`,
        };
      }
    }

    const ballot: Ballot = {
      ...ballotInput,
      id: existing ? existing.id : `blt-${Date.now()}`,
      isLocked: true,
      submittedAt: new Date().toISOString(),
      status: "Verified",
    };

    if (existing) {
      this.ballots = this.ballots.map((b) =>
        b.id === existing.id ? ballot : b,
      );
    } else {
      this.ballots = [ballot, ...this.ballots];
    }
    saveToStorage(STORAGE_KEYS.BALLOTS, this.ballots);

    // Update Debate Room status
    const room = this.rooms.find((r) => r.id === ballot.debateRoomId);
    if (room) {
      const roomBallots = this.ballots.filter(
        (b) => b.debateRoomId === room.id,
      );
      const submittedCount = roomBallots.filter((b) => b.isLocked).length;
      const isComplete = submittedCount >= room.expectedBallots;

      this.rooms = this.rooms.map((r) =>
        r.id === room.id
          ? {
              ...r,
              submittedBallots: submittedCount,
              status: isComplete ? "Complete" : "Awaiting Ballots",
              winnerTeamId: isComplete ? ballot.winningTeamId : r.winnerTeamId,
            }
          : r,
      );
      saveToStorage(STORAGE_KEYS.ROOMS, this.rooms);
    }

    // Update Judge ballot count
    this.judges = this.judges.map((j) =>
      j.id === ballot.judgeId
        ? {
            ...j,
            ballotsSubmitted: j.ballotsSubmitted + 1,
            status: "Completed",
          }
        : j,
    );
    saveToStorage(STORAGE_KEYS.JUDGES, this.judges);

    this.logAudit(
      "BALLOT_SUBMITTED",
      `Judge: ${ballot.judgeName}`,
      `Locked ballot for debate room ${ballot.debateRoomId}. Winner: ${ballot.winningTeamId}`,
    );

    // Trigger calculation engine for event standings
    this.recalculateEventStandings(ballot.eventId);

    this.notify();
    return {
      success: true,
      message: "Ballot verified, submitted, and officially locked.",
      ballot,
    };
  }

  // Deterministic Tabulation Engine
  public recalculateEventStandings(eventId: string): void {
    const eventBallots = this.ballots.filter(
      (b) => b.eventId === eventId && b.isLocked,
    );
    const eventTeams = this.teams.filter((t) => t.eventId === eventId);
    const eventSpeakers = this.speakers.filter((s) => s.eventId === eventId);

    // Map to accumulate points
    const teamStats: Record<
      string,
      {
        wins: number;
        losses: number;
        totalPoints: number;
        speakerPoints: number;
      }
    > = {};
    const speakerStats: Record<
      string,
      { totalPoints: number; scores: number[] }
    > = {};

    eventTeams.forEach((t) => {
      teamStats[t.id] = {
        wins: 0,
        losses: 0,
        totalPoints: 0,
        speakerPoints: 0,
      };
    });

    eventSpeakers.forEach((s) => {
      speakerStats[s.id] = { totalPoints: 0, scores: [] };
    });

    eventBallots.forEach((b) => {
      // Team wins/losses
      if (teamStats[b.winningTeamId]) {
        teamStats[b.winningTeamId].wins += 1;
        teamStats[b.winningTeamId].totalPoints += 3; // Win = 3pts
      }

      // Speaker scores accumulation
      b.speakerScores.forEach((spkScore) => {
        if (speakerStats[spkScore.speakerId]) {
          speakerStats[spkScore.speakerId].totalPoints += spkScore.totalScore;
          speakerStats[spkScore.speakerId].scores.push(spkScore.totalScore);
        }
        if (teamStats[spkScore.teamId]) {
          teamStats[spkScore.teamId].speakerPoints += spkScore.totalScore;
        }
      });
    });

    // Update and Rank Teams
    const updatedTeams = eventTeams.map((t) => {
      const stats = teamStats[t.id] || {
        wins: 0,
        losses: 0,
        totalPoints: 0,
        speakerPoints: 0,
      };
      return {
        ...t,
        wins: stats.wins,
        losses: stats.losses,
        totalPoints: stats.totalPoints,
        speakerPoints: stats.speakerPoints,
      };
    });

    // Sort teams deterministically: 1st by Wins/TotalPoints, 2nd by SpeakerPoints
    updatedTeams.sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.speakerPoints !== a.speakerPoints)
        return b.speakerPoints - a.speakerPoints;
      return a.name.localeCompare(b.name);
    });

    updatedTeams.forEach((t, idx) => {
      t.rank = idx + 1;
    });

    // Update and Rank Speakers
    const updatedSpeakers = eventSpeakers.map((s) => {
      const stats = speakerStats[s.id] || { totalPoints: 0, scores: [] };
      const count = stats.scores.length;
      const avg =
        count > 0 ? parseFloat((stats.totalPoints / count).toFixed(2)) : 0;
      const highest = count > 0 ? Math.max(...stats.scores) : 0;
      return {
        ...s,
        totalPoints: stats.totalPoints,
        averageScore: avg,
        highestScore: highest,
        roundsDebated: count,
      };
    });

    // Sort speakers deterministically: 1st by AverageScore, 2nd by TotalPoints
    updatedSpeakers.sort((a, b) => {
      if (b.averageScore !== a.averageScore)
        return b.averageScore - a.averageScore;
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      return a.name.localeCompare(b.name);
    });

    updatedSpeakers.forEach((s, idx) => {
      s.rank = idx + 1;
    });

    // Persist updated standings
    this.teams = this.teams.map(
      (t) => updatedTeams.find((ut) => ut.id === t.id) || t,
    );
    this.speakers = this.speakers.map(
      (s) => updatedSpeakers.find((us) => us.id === s.id) || s,
    );

    saveToStorage(STORAGE_KEYS.TEAMS, this.teams);
    saveToStorage(STORAGE_KEYS.SPEAKERS, this.speakers);

    this.logAudit(
      "STANDINGS_RECALCULATED",
      `Event ID: ${eventId}`,
      `Deterministic rankings snapshot updated.`,
    );
  }

  // --- SURVEYS ---
  public getSurveys(): Survey[] {
    return this.surveys;
  }

  public getSurveyById(id: string): Survey | undefined {
    return this.surveys.find((s) => s.id === id || s.publicId === id);
  }

  public getSurveyByPublicId(publicId: string): Survey | undefined {
    return this.surveys.find(
      (s) => s.publicId === publicId || s.id === publicId,
    );
  }

  public addSurvey(
    survey: Omit<
      Survey,
      | "id"
      | "organizationId"
      | "responsesCount"
      | "completionRate"
      | "averageTimeMinutes"
      | "createdAt"
      | "updatedAt"
    >,
  ): Survey {
    const newSurvey: Survey = {
      ...survey,
      id: `srv-${Date.now()}`,
      organizationId: this.organization.id,
      responsesCount: 0,
      completionRate: 0,
      averageTimeMinutes: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.surveys = [newSurvey, ...this.surveys];
    saveToStorage(STORAGE_KEYS.SURVEYS, this.surveys);
    this.logAudit(
      "SURVEY_CREATED",
      `Survey: ${newSurvey.title}`,
      `Public ID: ${newSurvey.publicId}`,
    );
    this.notify();

    // Persist asynchronously to backend database
    surveyService
      .createSurvey({
        title: newSurvey.title,
        description: newSurvey.description,
        status: newSurvey.status,
        questions: newSurvey.questions,
        publicId: newSurvey.publicId,
        organizationId: newSurvey.organizationId,
        eventId: newSurvey.eventId,
      })
      .then((persisted) => {
        this.surveys = this.surveys.map((s) =>
          s.id === newSurvey.id ? persisted : s,
        );
        saveToStorage(STORAGE_KEYS.SURVEYS, this.surveys);
        this.notify();
      })
      .catch((err) =>
        console.error("Failed to create survey on backend:", err),
      );

    return newSurvey;
  }

  public updateSurvey(id: string, updates: Partial<Survey>): void {
    this.surveys = this.surveys.map((s) =>
      s.id === id
        ? { ...s, ...updates, updatedAt: new Date().toISOString() }
        : s,
    );
    saveToStorage(STORAGE_KEYS.SURVEYS, this.surveys);
    this.logAudit(
      "SURVEY_UPDATED",
      `Survey ID: ${id}`,
      `Updated settings or questions`,
    );
    this.notify();

    // Persist asynchronously to backend database
    surveyService
      .updateSurvey(id, updates)
      .catch((err) =>
        console.error("Failed to update survey on backend:", err),
      );
  }

  public deleteSurvey(id: string): void {
    this.surveys = this.surveys.filter((s) => s.id !== id);
    saveToStorage(STORAGE_KEYS.SURVEYS, this.surveys);
    this.logAudit(
      "SURVEY_DELETED",
      `Survey ID: ${id}`,
      `Removed survey resource`,
    );
    this.notify();

    // Persist asynchronously to backend database
    surveyService
      .deleteSurvey(id)
      .catch((err) =>
        console.error("Failed to delete survey on backend:", err),
      );
  }

  public getSurveyResponses(surveyId: string): SurveyResponse[] {
    return this.surveyResponses.filter((r) => r.surveyId === surveyId);
  }

  public submitSurveyResponse(
    responseInput: Omit<SurveyResponse, "id" | "submittedAt">,
  ): { success: boolean; message: string } {
    const survey = this.surveys.find((s) => s.id === responseInput.surveyId);
    if (!survey || survey.status !== "Published") {
      return {
        success: false,
        message: "This survey is not currently accepting responses.",
      };
    }

    const response: SurveyResponse = {
      ...responseInput,
      id: `rsp-${Date.now()}`,
      submittedAt: new Date().toISOString(),
    };

    this.surveyResponses = [response, ...this.surveyResponses];
    saveToStorage(STORAGE_KEYS.SURVEY_RESPONSES, this.surveyResponses);

    // Update survey metrics
    const responses = this.getSurveyResponses(survey.id);
    const count = responses.length;
    const avgTimeSecs =
      responses.reduce((acc, r) => acc + (r.timeSpentSeconds || 180), 0) /
      count;
    const avgTimeMin = parseFloat((avgTimeSecs / 60).toFixed(1));

    this.surveys = this.surveys.map((s) =>
      s.id === survey.id
        ? {
            ...s,
            responsesCount: count,
            completionRate: Math.min(100, Math.round(85 + Math.random() * 12)),
            averageTimeMinutes: avgTimeMin,
          }
        : s,
    );
    saveToStorage(STORAGE_KEYS.SURVEYS, this.surveys);

    this.logAudit(
      "SURVEY_RESPONSE_SUBMITTED",
      `Survey: ${survey.title}`,
      `Recorded new anonymous response`,
    );
    this.notify();
    return {
      success: true,
      message: "Thank you. Your response has been recorded.",
    };
  }

  // --- AUDIT LOGS ---
  public getAuditLogs(): AuditLog[] {
    return this.auditLogs;
  }

  public logAudit(
    action: string,
    resource: string,
    details: string,
    result: "Success" | "Denied" | "Failed" = "Success",
  ): void {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorEmail: this.currentUser?.email || "anonymous@tabula.local",
      actorRole: this.currentUser?.role || "Viewer",
      action,
      resource,
      details,
      result,
    };
    this.auditLogs = [newLog, ...this.auditLogs];
    saveToStorage(STORAGE_KEYS.AUDIT_LOGS, this.auditLogs);
  }

  private updateEventCounts(eventId: string): void {
    const teamsCount = this.teams.filter((t) => t.eventId === eventId).length;
    const speakersCount = this.speakers.filter(
      (s) => s.eventId === eventId,
    ).length;
    const judgesCount = this.judges.filter((j) => j.eventId === eventId).length;

    this.events = this.events.map((e) =>
      e.id === eventId ? { ...e, teamsCount, speakersCount, judgesCount } : e,
    );
    saveToStorage(STORAGE_KEYS.EVENTS, this.events);
  }
}

export const tabulaStore = new TabulaStore();
