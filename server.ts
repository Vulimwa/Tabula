import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import crypto from "node:crypto";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        organizationId?: string;
      };
    }
  }
}

const app = express();
const PORT = 3000;

app.disable("x-powered-by");
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "same-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});

const supabaseUrl =
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
const supabaseConfigured = Boolean(
  supabaseUrl && supabaseServiceKey && supabaseUrl.startsWith("https://"),
);

const supabase = supabaseConfigured
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

// Authentication must use a separate client. Calling signInWithPassword on
// the service-role client replaces its in-memory session with the user's JWT,
// causing subsequent server-side profile queries to be subject to user RLS.
const supabaseAuth =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      })
    : null;

if (
  process.env.NODE_ENV === "production" &&
  (!supabase || !supabaseAuth)
) {
  throw new Error(
    "Production requires SUPABASE_SERVICE_ROLE_KEY and Supabase anon configuration.",
  );
}

async function fetchOrganizations(requestingUser?: { organizationId?: string; role: string }): Promise<any[]> {
  if (!supabase) {
    return [{ ...serverOrganization }];
  }

  let query = supabase.from("organizations").select("*");
  if (requestingUser?.role !== "Super Admin" && requestingUser?.organizationId) {
    query = query.eq("id", requestingUser.organizationId);
  }
  const { data, error } = await query;
  if (error) {
    console.warn("Organization Supabase read failed:", error.message);
    return [];
  }

  return data ?? [];
}

async function fetchUsers(requestingUser?: {
  id: string;
  role: string;
}): Promise<any[]> {
  if (!supabase) {
    return serverUsers.map((u) => sanitizeUserForClient(u));
  }

  const { data, error } = await supabase.from("profiles").select(`
      id,
      email,
      full_name,
      role,
      organization_id,
      status,
      last_activity,
      created_at,
      organizations(name)
    `);

  if (error) {
    console.warn("User Supabase read failed:", error.message);
    return [];
  }

  const visibleRows =
    requestingUser?.role === "Super Admin"
      ? (data ?? [])
      : (data ?? []).filter(
          (row: any) =>
            row.id === requestingUser?.id &&
            row.organization_id === requestingUser?.organizationId,
        );

  return visibleRows.map((row: any) => ({
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    organizationId: row.organization_id,
    organizationName: row.organizations?.name || serverOrganization.name,
    status: row.status,
    lastActivity: row.last_activity || "Just now",
    createdAt: row.created_at || new Date().toISOString(),
  }));
}

async function ensureProfileForAuthUser(user: any): Promise<any | null> {
  if (!supabase || !user?.email) return null;

  const { data: existing } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) return existing;

  const { data: organization } = await supabase
    .from("organizations")
    .select("id")
    .limit(1)
    .maybeSingle();

  const metadata = user.user_metadata || {};
  const newProfile = {
    id: user.id,
    email: user.email.toLowerCase(),
    full_name: metadata.full_name || metadata.name || user.email.split("@")[0],
    role: metadata.role || "Viewer",
    organization_id: organization?.id || null,
    status: "Active",
    last_activity: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };

  const { data: inserted, error: insertError } = await supabase
    .from("profiles")
    .insert([newProfile])
    .select("*")
    .maybeSingle();

  if (insertError) {
    console.warn(
      "Profile bootstrapping failed during login:",
      insertError.message,
    );
    return null;
  }

  return inserted ?? newProfile;
}

async function fetchEvents(requestingUser?: { organizationId?: string; role: string }): Promise<any[]> {
  if (!supabase) {
    return serverEvents;
  }

  let query = supabase.from("events").select("*");
  if (requestingUser?.role !== "Super Admin" && requestingUser?.organizationId) {
    query = query.eq("organization_id", requestingUser.organizationId);
  }
  const { data, error } = await query;
  if (error) {
    console.warn("Event Supabase read failed:", error.message);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    description: row.description,
    format: row.format,
    status: row.status,
    startDate: row.start_date,
    endDate: row.end_date,
    venue: row.venue,
    roundsCount: row.rounds_count,
    currentRound: row.current_round,
    maxSpeakersPerTeam: row.max_speakers_per_team,
    scoringSystem: row.scoring_system,
    teamsCount: row.teams_count ?? 0,
    speakersCount: row.speakers_count ?? 0,
    judgesCount: row.judges_count ?? 0,
    isResultsPublished: row.is_results_published,
    createdAt: row.created_at,
  }));
}

async function fetchSurveys(requestingUser?: { organizationId?: string; role: string }): Promise<any[]> {
  if (!supabase) {
    return serverSurveys;
  }

  let query = supabase.from("surveys").select("*");
  if (requestingUser?.role !== "Super Admin" && requestingUser?.organizationId) {
    query = query.eq("organization_id", requestingUser.organizationId);
  }
  const { data, error } = await query;
  if (error) {
    console.warn("Survey Supabase read failed:", error.message);
    return [];
  }

  return data ?? serverSurveys;
}

async function fetchTeams(): Promise<any[]> {
  if (!supabase) {
    return serverTeams;
  }

  const { data, error } = await supabase.from("teams").select("*");
  if (error) {
    console.warn("Team Supabase read failed:", error.message);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    eventId: row.event_id,
    name: row.name,
    institution: row.institution,
    category: row.category,
    speakers: Array.isArray(row.speakers) ? row.speakers : [],
    wins: row.wins ?? 0,
    losses: row.losses ?? 0,
    draws: row.draws ?? 0,
    totalPoints: row.total_points ?? 0,
    speakerPoints: row.speaker_points ?? 0,
    rank: row.rank ?? 0,
    status: row.status,
  }));
}

async function fetchSpeakers(): Promise<any[]> {
  if (!supabase) {
    return serverSpeakers;
  }

  const { data, error } = await supabase.from("speakers").select("*");
  if (error) {
    console.warn("Speaker Supabase read failed:", error.message);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    teamId: row.team_id,
    teamName: row.team_name,
    eventId: row.event_id,
    name: row.name,
    email: row.email,
    institution: row.institution,
    category: row.category,
    totalPoints: row.total_points ?? 0,
    averageScore: row.average_score ?? 0,
    highestScore: row.highest_score ?? 0,
    roundsDebated: row.rounds_debated ?? 0,
    rank: row.rank ?? 0,
  }));
}

async function fetchJudges(): Promise<any[]> {
  if (!supabase) {
    return serverJudges;
  }

  const { data, error } = await supabase.from("judges").select("*");
  if (error) {
    console.warn("Judge Supabase read failed:", error.message);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    eventId: row.event_id,
    name: row.name,
    email: row.email,
    institution: row.institution,
    experienceLevel: row.experience_level,
    rating: row.rating ?? 0,
    assignedRounds: row.assigned_rounds ?? 0,
    ballotsSubmitted: row.ballots_submitted ?? 0,
    status: row.status,
  }));
}

async function fetchRounds(): Promise<any[]> {
  if (!supabase) {
    return serverRounds;
  }

  const { data, error } = await supabase.from("rounds").select("*");
  if (error) {
    console.warn("Round Supabase read failed:", error.message);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    eventId: row.event_id,
    roundNumber: row.round_number,
    name: row.name,
    motion: row.motion,
    infoSlide: row.info_slide,
    startTime: row.start_time,
    status: row.status,
    roomsCount: row.rooms_count ?? 0,
    completedRoomsCount: row.completed_rooms_count ?? 0,
  }));
}

async function fetchRooms(): Promise<any[]> {
  if (!supabase) {
    return serverRooms;
  }

  const { data, error } = await supabase.from("rooms").select("*");
  if (error) {
    console.warn("Room Supabase read failed:", error.message);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    roundId: row.round_id,
    eventId: row.event_id,
    roomName: row.room_name,
    governmentTeamId: row.government_team_id,
    governmentTeamName: row.government_team_name,
    oppositionTeamId: row.opposition_team_id,
    oppositionTeamName: row.opposition_team_name,
    assignedJudges: Array.isArray(row.assigned_judges)
      ? row.assigned_judges
      : [],
    status: row.status,
    winnerTeamId: row.winner_team_id,
    expectedBallots: row.expected_ballots ?? 1,
    submittedBallots: row.submitted_ballots ?? 0,
  }));
}

async function fetchBallots(): Promise<any[]> {
  if (!supabase) {
    return serverBallots;
  }

  const { data, error } = await supabase.from("ballots").select("*");
  if (error) {
    console.warn("Ballot Supabase read failed:", error.message);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    debateRoomId: row.debate_room_id,
    eventId: row.event_id,
    roundNumber: row.round_number,
    judgeId: row.judge_id,
    judgeName: row.judge_name,
    winningTeamId: row.winning_team_id,
    governmentTotalPoints: row.government_total_points ?? 0,
    oppositionTotalPoints: row.opposition_total_points ?? 0,
    speakerScores: Array.isArray(row.speaker_scores) ? row.speaker_scores : [],
    strengthsComment: row.strengths_comment,
    improvementsComment: row.improvements_comment,
    generalComments: row.general_comments,
    isLocked: Boolean(row.is_locked),
    submittedAt: row.submitted_at,
    status: row.status,
  }));
}

async function scopeEventRows(
  rows: any[],
  requestingUser: { role: string; organizationId?: string },
): Promise<any[]> {
  if (requestingUser.role === "Super Admin") return rows;
  const events = await fetchEvents(requestingUser);
  const eventIds = new Set(events.map((event) => event.id));
  return rows.filter((row) => eventIds.has(row.eventId));
}

app.use(express.json({ limit: "10mb" }));

// OpenRouter is server-side only. The API key must never use a VITE_ prefix.
async function requestOpenRouterJson(
  systemInstruction: string,
  prompt: string,
): Promise<any> {
  const apiKey = process.env.OPEN_ROUTER_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPEN_ROUTER_API_KEY environment variable is not configured.",
    );
  }

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
        "X-Title": "Tabula Platform",
      },
      body: JSON.stringify({
        model: process.env.OPEN_ROUTER_MODEL || "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `${systemInstruction}\nReturn only valid JSON. Do not use markdown fences.`,
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
        response_format: { type: "json_object" },
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `OpenRouter request failed (${response.status}): ${errorText}`,
    );
  }

  const payload = (await response.json()) as any;
  const content = payload.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("OpenRouter returned no JSON content.");
  }

  return JSON.parse(content.replace(/^```json\s*/i, "").replace(/\s*```$/, ""));
}

// ==========================================
// API ROUTES
// ==========================================

// Health Check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "TABULA Engine",
    timestamp: new Date().toISOString(),
  });
});

const bootstrapPassword = process.env.TABULA_BOOTSTRAP_PASSWORD;
const bootstrapPasswordHash = bootstrapPassword
  ? crypto.createHash("sha256").update(bootstrapPassword).digest("hex")
  : null;

function sanitizeUserForClient(profile: any): any {
  if (!profile) return profile;

  const { passwordHash: _passwordHash, ...safeUser } = profile;
  return safeUser;
}

// Server-side Organization & Auth state
const serverOrganization = {
  id: "org-ku-debate",
  name: "Kenyatta University Debate Society",
  slug: "ku-debate-society",
  type: "University",
  membersCount: 142,
  eventsCount: 12,
  createdAt: "2025-01-15T08:00:00Z",
};

const activeSessions = new Map<
  string,
  { userId: string; email: string; role: string; expiresAt: number }
>();

const requestBuckets = new Map<string, { count: number; resetAt: number }>();
function rateLimit(maxRequests: number, windowMs: number) {
  return (req: any, res: any, next: any): void => {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    const bucket = requestBuckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      requestBuckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    if (bucket.count >= maxRequests) {
      res.setHeader("Retry-After", Math.ceil((bucket.resetAt - now) / 1000));
      res.status(429).json({ error: "Too many requests. Try again later." });
      return;
    }
    bucket.count += 1;
    next();
  };
}

const authRateLimit = rateLimit(10, 60_000);

function getBearerToken(req: any): string | null {
  const header = req.headers.authorization;
  if (typeof header !== "string" || !header.startsWith("Bearer ")) {
    return null;
  }

  return header.slice("Bearer ".length).trim();
}

async function requireApiAuth(req: any, res: any, next: any): Promise<void> {
  const token = getBearerToken(req);
  if (!token) {
    return res
      .status(401)
      .json({ error: "Authentication required for this API operation." });
  }

  if (supabaseAuth && supabase) {
    const { data: authData, error: authError } =
      await supabaseAuth.auth.getUser(token);

    if (authError || !authData.user) {
      return res.status(401).json({ error: "Session expired or invalid." });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, email, role, organization_id")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (!profile) {
      return res.status(401).json({ error: "Session profile unavailable." });
    }

    req.user = {
      id: profile.id,
      email: profile.email,
      role: profile.role,
      organizationId: profile.organization_id,
    };
    return next();
  }

  const session = activeSessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    return res.status(401).json({ error: "Session expired or invalid." });
  }

  req.user = { id: session.userId, email: session.email, role: session.role };
  return next();
}

function requireRoleAccess(
  req: any,
  res: any,
  next: any,
  allowedRoles: string[],
): void {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required." });
  }

  if (!allowedRoles.includes(req.user.role)) {
    return res
      .status(403)
      .json({ error: "Access denied: insufficient role permissions." });
  }

  next();
}

let serverUsers: any[] = [
  {
    id: "usr-superadmin-1",
    email: "bravinvulimwa84@gmail.com",
    fullName: "Bravin Vulimwa",
    role: "Super Admin",
    organizationId: "org-ku-debate",
    organizationName: "Kenyatta University Debate Society",
    passwordHash: bootstrapPasswordHash,
    status: "Active",
    lastActivity: "Just now",
    createdAt: new Date().toISOString(),
  },
  {
    id: "usr-organizer-1",
    email: "m.karanja@ku.ac.ke",
    fullName: "Dr. Mercy Karanja",
    role: "Organizer",
    organizationId: "org-ku-debate",
    organizationName: "Kenyatta University Debate Society",
    passwordHash: bootstrapPasswordHash,
    status: "Active",
    lastActivity: "12 mins ago",
    createdAt: new Date().toISOString(),
  },
  {
    id: "usr-judge-1",
    email: "j.otieno@strathmore.edu",
    fullName: "James Otieno",
    role: "Judge",
    organizationId: "org-ku-debate",
    organizationName: "Kenyatta University Debate Society",
    passwordHash: bootstrapPasswordHash,
    status: "Active",
    lastActivity: "45 mins ago",
    createdAt: new Date().toISOString(),
  },
  {
    id: "usr-survey-1",
    email: "s.chebet@ku.ac.ke",
    fullName: "Sarah Chebet",
    role: "Organizer",
    organizationId: "org-ku-debate",
    organizationName: "Kenyatta University Debate Society",
    passwordHash: bootstrapPasswordHash,
    status: "Active",
    lastActivity: "2 hours ago",
    createdAt: new Date().toISOString(),
  },
];

// Password Reset Tokens Store
const resetTokens: Record<
  string,
  { email: string; token: string; expiresAt: number }
> = {};

// Domain event records moved off the client-only seed path.
let serverEvents: any[] = [
  {
    id: "evt-nudc-2026",
    organizationId: "org-ku-debate",
    name: "National Universities Debate Championship 2026",
    description:
      "The premier national university debate tournament featuring teams across East Africa.",
    format: "British Parliamentary",
    status: "Live",
    startDate: "2026-08-08",
    endDate: "2026-08-12",
    venue: "Main Auditorium, Kenyatta University",
    roundsCount: 5,
    currentRound: 3,
    maxSpeakersPerTeam: 2,
    scoringSystem: "Standard 100-Point BP Scale",
    teamsCount: 16,
    speakersCount: 32,
    judgesCount: 12,
    isResultsPublished: false,
    createdAt: "2026-06-01T10:00:00Z",
  },
  {
    id: "evt-inter-uni-2026",
    organizationId: "org-ku-debate",
    name: "Inter-University Debate Series Round 1",
    description: "Quarterly inter-university competitive debate series.",
    format: "World Schools",
    status: "Upcoming",
    startDate: "2026-09-15",
    endDate: "2026-09-17",
    venue: "Strathmore University Conference Center",
    roundsCount: 4,
    currentRound: 1,
    maxSpeakersPerTeam: 3,
    scoringSystem: "World Schools 100-Point Scale",
    teamsCount: 12,
    speakersCount: 36,
    judgesCount: 8,
    isResultsPublished: false,
    createdAt: "2026-07-10T12:00:00Z",
  },
  {
    id: "evt-east-africa-open-2025",
    organizationId: "org-ku-debate",
    name: "East Africa Open Debate Championship 2025",
    description: "International invitation debate open held annually.",
    format: "British Parliamentary",
    status: "Completed",
    startDate: "2025-11-20",
    endDate: "2025-11-24",
    venue: "Kenyatta International Convention Centre",
    roundsCount: 6,
    currentRound: 6,
    maxSpeakersPerTeam: 2,
    scoringSystem: "Standard 100-Point BP Scale",
    teamsCount: 24,
    speakersCount: 48,
    judgesCount: 18,
    isResultsPublished: true,
    createdAt: "2025-09-01T09:00:00Z",
  },
];

let serverTeams: any[] = [];
let serverSpeakers: any[] = [];
let serverJudges: any[] = [];
let serverRounds: any[] = [];
let serverRooms: any[] = [];
let serverBallots: any[] = [];

// Database-Backed Surveys & Questions Persistent Store
let serverSurveys: any[] = [
  {
    id: "srv-nudc-feedback",
    organizationId: "org-ku-debate",
    eventId: "evt-nudc-2026",
    title: "NUDC 2026 Participant Experience & Adjudication Quality",
    description:
      "Help us evaluate motion balance, adjudication consistency, and venue organization.",
    status: "Published",
    responsesCount: 48,
    completionRate: 92.5,
    averageTimeMinutes: 3.4,
    publicId: "nudc2026-feedback",
    createdAt: "2026-08-08T10:00:00Z",
    updatedAt: "2026-08-09T18:00:00Z",
    questions: [
      {
        id: "q1",
        type: "Rating",
        title: "Overall Tournament Organization Rating",
        description:
          "Rate venue quality, schedule adherence, and promptness of pairings.",
        isRequired: true,
        ratingMax: 5,
      },
      {
        id: "q2",
        type: "Single choice",
        title: "Primary Role in Competition",
        isRequired: true,
        options: [
          "Debater",
          "Adjudicator / Judge",
          "Institutional Observer",
          "Organizing Committee",
        ],
      },
      {
        id: "q3",
        type: "Likert scale",
        title: "Motion Balance & Fair Adjudication Assessment",
        description:
          "Indicate your level of agreement with the following statements.",
        isRequired: true,
        likertScale: [
          "Strongly Disagree",
          "Disagree",
          "Neutral",
          "Agree",
          "Strongly Agree",
        ],
      },
      {
        id: "q4",
        type: "Yes/No",
        title:
          "Did you experience any technical or scheduling delays in your rounds?",
        isRequired: true,
      },
      {
        id: "q5",
        type: "Long text",
        title:
          "What specific suggestions do you have for improving future rounds or adjudication feedback?",
        isRequired: false,
      },
    ],
  },
  {
    id: "srv-debate-participation",
    organizationId: "org-ku-debate",
    title: "University Student Debate Engagement Study",
    description:
      "Investigating factors influencing university debate club participation and retention.",
    status: "Published",
    responsesCount: 112,
    completionRate: 88.0,
    averageTimeMinutes: 4.1,
    publicId: "student-engagement-2026",
    createdAt: "2026-07-01T09:00:00Z",
    updatedAt: "2026-08-01T12:00:00Z",
    questions: [
      {
        id: "sq1",
        type: "Dropdown",
        title: "Year of Study",
        isRequired: true,
        options: [
          "First Year",
          "Second Year",
          "Third Year",
          "Fourth Year / Postgraduate",
        ],
      },
      {
        id: "sq2",
        type: "Multiple choice",
        title: "What factors motivate you to participate in debates?",
        isRequired: true,
        options: [
          "Public speaking skills",
          "Critical thinking",
          "Networking",
          "Career preparation",
          "Intellectual interest",
        ],
      },
      {
        id: "sq3",
        type: "Long text",
        title:
          "What barriers prevent you or your peers from attending weekly debate sessions?",
        isRequired: false,
      },
    ],
  },
];

// Platform configuration API
app.get("/api/organization", requireApiAuth, async (_req, res) => {
  const organizations = await fetchOrganizations((_req as any).user);
  return res.json({
    success: true,
    organization: organizations[0] ?? serverOrganization,
  });
});

app.get("/api/events", requireApiAuth, async (_req, res) => {
  const events = await fetchEvents((_req as any).user);
  return res.json({ success: true, events });
});

app.get("/api/events/:id", requireApiAuth, async (req, res) => {
  const { id } = req.params;
  const events = await fetchEvents((req as any).user);
  const event = events.find((e) => e.id === id);

  if (!event) {
    return res.status(404).json({ error: "Event record not found." });
  }

  return res.json({ success: true, event });
});

// AUTH API: Login
app.post("/api/auth/login", authRateLimit, async (req, res) => {
  const { email, password } = req.body;
  if (
    !email ||
    typeof email !== "string" ||
    !password ||
    typeof password !== "string"
  ) {
    return res
      .status(400)
      .json({ error: "Email address and password are required." });
  }

  let profile: any | null = null;
  let authAccessToken: string | null = null;

  if (supabase && supabaseAuth) {
    try {
      const { data: authData, error: authError } =
        await supabaseAuth.auth.signInWithPassword({
          email,
          password,
        });

      if (authError || !authData?.user) {
        return res.status(401).json({ error: "Invalid email or password." });
      }

      authAccessToken = authData.session?.access_token || null;

      const profileDataOrNull = await ensureProfileForAuthUser(authData.user);
      if (!profileDataOrNull) {
        return res.status(404).json({
          error:
            "Account profile is not available in the organization directory.",
        });
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select(
          `
          id,
          email,
          full_name,
          role,
          organization_id,
          status,
          last_activity,
          created_at,
          organizations(name)
        `,
        )
        .eq("id", authData.user.id)
        .maybeSingle();

      if (profileError || !profileData) {
        console.warn(
          "Supabase profile lookup failed on login:",
          profileError?.message ?? "missing profile",
        );
        return res.status(404).json({
          error:
            "Account profile is not available in the organization directory.",
        });
      }

      const profileRecord = profileData as any;
      const profileOrganizationName = Array.isArray(profileRecord.organizations)
        ? profileRecord.organizations[0]?.name
        : profileRecord.organizations?.name;

      profile = {
        id: profileRecord.id,
        email: profileRecord.email,
        fullName: profileRecord.full_name,
        role: profileRecord.role,
        organizationId: profileRecord.organization_id,
        organizationName: profileOrganizationName || serverOrganization.name,
        status: profileRecord.status,
        lastActivity: profileRecord.last_activity || "Just now",
        createdAt: profileRecord.created_at || new Date().toISOString(),
      };
    } catch (error: any) {
      console.warn("Supabase authentication failed:", error?.message ?? error);
      return res.status(401).json({ error: "Invalid email or password." });
    }
  } else if (process.env.NODE_ENV !== "production") {
    profile = serverUsers.find(
      (u) => u.email.toLowerCase() === email.toLowerCase(),
    );

    if (!profile) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    if (!profile.passwordHash) {
      return res.status(503).json({
        error: "Account authentication is not configured for this workspace.",
      });
    }

    const digest = crypto.createHash("sha256").update(password).digest("hex");
    if (digest !== profile.passwordHash) {
      return res.status(401).json({ error: "Invalid email or password." });
    }
  } else {
    return res.status(503).json({ error: "Authentication service is unavailable." });
  }

  const token = crypto.randomUUID();
  const expiresAt = Date.now() + 1000 * 60 * 60 * 8;

  activeSessions.set(token, {
    userId: profile.id,
    email: profile.email,
    role: profile.role,
    expiresAt,
  });

  const { passwordHash: _passwordHash, ...safeUser } = profile;

  return res.json({
    success: true,
    user: safeUser,
    token: authAccessToken || token,
    expiresAt,
  });
});

app.post("/api/auth/logout", (req, res) => {
  const token = getBearerToken(req);
  if (token) {
    activeSessions.delete(token);
  }

  return res.json({ success: true, message: "Signed out." });
});

// AUTH API: Forgot Password
app.post("/api/auth/forgot-password", authRateLimit, (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== "string") {
    return res
      .status(400)
      .json({ error: "Please provide a valid email address." });
  }

  const user = serverUsers.find(
    (u) => u.email.toLowerCase() === email.toLowerCase(),
  );

  // Generate secure reset token
  const token = crypto.randomInt(10000000, 99999999).toString();
  resetTokens[token] = {
    email,
    token,
    expiresAt: Date.now() + 3600000, // 1 hour validity
  };

  return res.json({
    success: true,
    message: "If an account associated with that email exists, reset instructions have been dispatched.",
    ...(process.env.NODE_ENV !== "production" ? { resetCode: token } : {}),
  });
});

// AUTH API: Reset Password
app.post("/api/auth/reset-password", authRateLimit, async (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || typeof newPassword !== "string" || newPassword.length < 8) {
    return res
      .status(400)
      .json({ error: "Email, reset code, and new password are required." });
  }

  const record = resetTokens[code];
  if (
    !record ||
    record.email.toLowerCase() !== email.toLowerCase() ||
    record.expiresAt < Date.now()
  ) {
    return res
      .status(400)
      .json({ error: "Invalid or expired password reset verification code." });
  }

  if (supabase) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (!profile) {
      delete resetTokens[code];
      return res.status(400).json({ error: "Invalid or expired password reset verification code." });
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(
      profile.id,
      { password: newPassword },
    );
    if (updateError) {
      console.warn("Supabase password reset failed:", updateError.message);
      return res.status(500).json({ error: "Unable to reset password." });
    }
  } else {
    const fallbackUser = serverUsers.find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
    if (fallbackUser) {
      fallbackUser.passwordHash = crypto
        .createHash("sha256")
        .update(newPassword)
        .digest("hex");
    }
  }

  // Clear used code only after the password update succeeds.
  delete resetTokens[code];

  return res.json({
    success: true,
    message:
      "Your password has been successfully updated. Please sign in with your new password.",
  });
});

// Domain API: teams, speakers, judges, rounds, rooms, ballots
app.get("/api/teams", requireApiAuth, async (_req, res) => {
  const teams = await scopeEventRows(await fetchTeams(), (_req as any).user);
  return res.json({ success: true, teams });
});

app.get("/api/teams/:id", requireApiAuth, async (req, res) => {
  const { id } = req.params;
  const teams = await scopeEventRows(await fetchTeams(), (req as any).user);
  const team = teams.find((t) => t.id === id);

  if (!team) {
    return res.status(404).json({ error: "Team record not found." });
  }

  return res.json({ success: true, team });
});

app.get("/api/speakers", requireApiAuth, async (_req, res) => {
  const speakers = await scopeEventRows(await fetchSpeakers(), (_req as any).user);
  return res.json({ success: true, speakers });
});

app.get("/api/speakers/:id", requireApiAuth, async (req, res) => {
  const { id } = req.params;
  const speakers = await scopeEventRows(await fetchSpeakers(), (req as any).user);
  const speaker = speakers.find((s) => s.id === id);

  if (!speaker) {
    return res.status(404).json({ error: "Speaker record not found." });
  }

  return res.json({ success: true, speaker });
});

app.get("/api/judges", requireApiAuth, async (_req, res) => {
  const judges = await scopeEventRows(await fetchJudges(), (_req as any).user);
  return res.json({ success: true, judges });
});

app.get("/api/judges/:id", requireApiAuth, async (req, res) => {
  const { id } = req.params;
  const judges = await scopeEventRows(await fetchJudges(), (req as any).user);
  const judge = judges.find((j) => j.id === id);

  if (!judge) {
    return res.status(404).json({ error: "Judge record not found." });
  }

  return res.json({ success: true, judge });
});

app.get("/api/rounds", requireApiAuth, async (_req, res) => {
  const rounds = await scopeEventRows(await fetchRounds(), (_req as any).user);
  return res.json({ success: true, rounds });
});

app.get("/api/rounds/:id", requireApiAuth, async (req, res) => {
  const { id } = req.params;
  const rounds = await scopeEventRows(await fetchRounds(), (req as any).user);
  const round = rounds.find((r) => r.id === id);

  if (!round) {
    return res.status(404).json({ error: "Round record not found." });
  }

  return res.json({ success: true, round });
});

app.get("/api/rooms", requireApiAuth, async (_req, res) => {
  const rooms = await scopeEventRows(await fetchRooms(), (_req as any).user);
  return res.json({ success: true, rooms });
});

app.get("/api/rooms/:id", requireApiAuth, async (req, res) => {
  const { id } = req.params;
  const rooms = await scopeEventRows(await fetchRooms(), (req as any).user);
  const room = rooms.find((r) => r.id === id);

  if (!room) {
    return res.status(404).json({ error: "Debate room record not found." });
  }

  return res.json({ success: true, room });
});

app.get("/api/ballots", requireApiAuth, async (_req, res) => {
  const ballots = await scopeEventRows(await fetchBallots(), (_req as any).user);
  return res.json({ success: true, ballots });
});

app.get("/api/ballots/:id", requireApiAuth, async (req, res) => {
  const { id } = req.params;
  const ballots = await scopeEventRows(await fetchBallots(), (req as any).user);
  const ballot = ballots.find((b) => b.id === id);

  if (!ballot) {
    return res.status(404).json({ error: "Ballot record not found." });
  }

  return res.json({ success: true, ballot });
});

// USER MANAGEMENT API: Get all users
app.get("/api/users", requireApiAuth, async (_req, res) => {
  const users = await fetchUsers((_req as any).user);
  res.json({
    success: true,
    users: users.map((u) => sanitizeUserForClient(u)),
  });
});

app.patch("/api/users/:id", requireApiAuth, async (req, res) => {
  const { role } = req.body;
  const allowedRoles = [
    "Super Admin",
    "Organization Admin",
    "Organizer",
    "Judge",
    "Participant",
    "Viewer",
  ];

  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ error: "Invalid profile role." });
  }

  if (role === "Super Admin" && req.user.role !== "Super Admin") {
    return res.status(403).json({
      error: "Only Super Admins can assign the Super Admin role.",
    });
  }

  if (req.user.role !== "Super Admin" && req.params.id !== req.user.id) {
    return res.status(403).json({
      error: "You can only update your own profile role.",
    });
  }

  if (!supabase) {
    return res.status(503).json({ error: "Profile database is unavailable." });
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ role, last_activity: new Date().toISOString() })
    .eq("id", req.params.id)
    .select("*")
    .maybeSingle();

  if (error) {
    console.warn("Supabase profile role update failed:", error.message);
    return res.status(500).json({ error: "Unable to update profile role." });
  }

  if (!data) {
    return res.status(404).json({ error: "Profile record not found." });
  }

  const token = getBearerToken(req);
  if (token && data.id === req.user.id) {
    const session = activeSessions.get(token);
    if (session) session.role = data.role;
  }

  return res.json({ success: true, user: sanitizeUserForClient(data) });
});

// USER MANAGEMENT API: Create user (Super Admin check enabled)
app.post("/api/users", requireApiAuth, async (req, res) => {
  const {
    email,
    fullName,
    password,
    role,
    organizationId,
    organizationName,
    creatorRole,
  } = req.body;

  if (!email || !fullName || !role || typeof password !== "string" || password.length < 8) {
    return res
      .status(400)
      .json({ error: "Email, full name, role, and a password of at least 8 characters are required." });
  }

  if (req.user.role !== "Super Admin") {
    return res.status(403).json({
      error: "Only Super Admins can provision user accounts.",
    });
  }

  // RBAC restriction: Only Super Admins can create another Super Admin
  if (role === "Super Admin" && req.user.role !== "Super Admin") {
    return res.status(403).json({
      error:
        "Access Denied: Only existing Super Admins are authorized to create new Super Admin accounts.",
    });
  }

  if (!supabase) {
    return res.status(503).json({ error: "Profile database is unavailable." });
  }

  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: email.toLowerCase(),
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role },
  });

  if (authError || !authUser.user) {
    return res.status(400).json({ error: authError?.message || "Unable to create authentication account." });
  }

  let selectedOrganizationId = organizationId || null;
  if (!selectedOrganizationId || !/^[0-9a-f-]{36}$/i.test(selectedOrganizationId)) {
    const { data: organization } = await supabase.from("organizations").select("id").limit(1).maybeSingle();
    selectedOrganizationId = organization?.id || null;
  }

  const profile = {
    id: authUser.user.id,
    email: email.toLowerCase(),
    full_name: fullName,
    role,
    organization_id: selectedOrganizationId,
    status: "Active",
    last_activity: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };
  const { data: createdProfile, error: profileError } = await supabase
    .from("profiles")
    .insert(profile)
    .select("*")
    .single();

  if (profileError || !createdProfile) {
    await supabase.auth.admin.deleteUser(authUser.user.id);
    return res.status(500).json({ error: profileError?.message || "Unable to create profile." });
  }

  return res.json({
    success: true,
    user: sanitizeUserForClient(createdProfile),
    credentials: { email: email.toLowerCase(), password },
  });
});

// Deterministic Tabulation Engine Endpoint
app.post(
  "/api/tabulation/calculate",
  requireApiAuth,
  (req, res, next) => {
    requireRoleAccess(req, res, next, [
      "Super Admin",
      "Organization Admin",
      "Organizer",
    ]);
  },
  (req, res) => {
    try {
      const { eventId, ballots, teams, speakers } = req.body;

      if (
        !eventId ||
        !Array.isArray(ballots) ||
        !Array.isArray(teams) ||
        !Array.isArray(speakers)
      ) {
        return res.status(400).json({
          error: "Invalid parameters provided for tabulation calculation.",
        });
      }

      // Server-side deterministic calculation algorithm
      const lockedBallots = ballots.filter((b: any) => b.isLocked);
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

      teams.forEach((t: any) => {
        teamStats[t.id] = {
          wins: 0,
          losses: 0,
          totalPoints: 0,
          speakerPoints: 0,
        };
      });

      speakers.forEach((s: any) => {
        speakerStats[s.id] = { totalPoints: 0, scores: [] };
      });

      lockedBallots.forEach((b: any) => {
        if (teamStats[b.winningTeamId]) {
          teamStats[b.winningTeamId].wins += 1;
          teamStats[b.winningTeamId].totalPoints += 3;
        }

        if (Array.isArray(b.speakerScores)) {
          b.speakerScores.forEach((spk: any) => {
            if (speakerStats[spk.speakerId]) {
              speakerStats[spk.speakerId].totalPoints += spk.totalScore || 0;
              speakerStats[spk.speakerId].scores.push(spk.totalScore || 0);
            }
            if (teamStats[spk.teamId]) {
              teamStats[spk.teamId].speakerPoints += spk.totalScore || 0;
            }
          });
        }
      });

      // Updated team ranks
      const calculatedTeams = teams.map((t: any) => {
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

      calculatedTeams.sort((a: any, b: any) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        if (b.speakerPoints !== a.speakerPoints)
          return b.speakerPoints - a.speakerPoints;
        return a.name.localeCompare(b.name);
      });

      calculatedTeams.forEach((t: any, idx: number) => {
        t.rank = idx + 1;
      });

      // Updated speaker ranks
      const calculatedSpeakers = speakers.map((s: any) => {
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

      calculatedSpeakers.sort((a: any, b: any) => {
        if (b.averageScore !== a.averageScore)
          return b.averageScore - a.averageScore;
        if (b.totalPoints !== a.totalPoints)
          return b.totalPoints - a.totalPoints;
        return a.name.localeCompare(b.name);
      });

      calculatedSpeakers.forEach((s: any, idx: number) => {
        s.rank = idx + 1;
      });

      return res.json({
        success: true,
        eventId,
        teams: calculatedTeams,
        speakers: calculatedSpeakers,
        calculatedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error("Tabulation calculation error:", err);
      return res.status(500).json({
        error: "Tabulation engine encountered an issue during calculation.",
      });
    }
  },
);

// Official Server-Side Ballot Submission & Validation
app.post(
  "/api/ballots/submit",
  requireApiAuth,
  (req, res, next) => {
    requireRoleAccess(req, res, next, [
      "Super Admin",
      "Organization Admin",
      "Organizer",
      "Judge",
    ]);
  },
  (req, res) => {
    try {
      const { ballot } = req.body;

      if (
        !ballot ||
        !ballot.debateRoomId ||
        !ballot.judgeId ||
        !ballot.winningTeamId
      ) {
        return res
          .status(400)
          .json({ error: "Missing required ballot validation attributes." });
      }

      // Validate score boundaries server-side
      if (Array.isArray(ballot.speakerScores)) {
        for (const spk of ballot.speakerScores) {
          if (
            typeof spk.totalScore !== "number" ||
            spk.totalScore < 50 ||
            spk.totalScore > 100
          ) {
            return res.status(400).json({
              error: `Speaker score for ${spk.speakerName || "Speaker"} must be between 50 and 100.`,
            });
          }
        }
      }

      const lockedBallot = {
        ...ballot,
        isLocked: true,
        status: "Verified",
        submittedAt: new Date().toISOString(),
      };

      return res.json({
        success: true,
        message: "Ballot server-validated and officially locked.",
        ballot: lockedBallot,
      });
    } catch (err: any) {
      console.error("Ballot submission error:", err);
      return res
        .status(500)
        .json({ error: "Unable to process ballot submission." });
    }
  },
);

// AI Survey Assistant Route
app.post(
  "/api/ai/survey-assistant",
  rateLimit(20, 60_000),
  requireApiAuth,
  (req, res, next) => {
    requireRoleAccess(req, res, next, [
      "Super Admin",
      "Organization Admin",
      "Organizer",
    ]);
  },
  async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({
          error: "A clear survey concept or objective prompt is required.",
        });
      }

      const systemInstruction = `
You are the TABULA AI Survey Assistant.
Generate a structured, professional survey proposal based on the user's objective.
DO NOT use emojis.
DO NOT use informal or casual slang.
Ensure questions are clear, objective, and unbiased.
Supported Question Types:
- "Short text"
- "Long text"
- "Single choice"
- "Multiple choice"
- "Dropdown"
- "Rating"
- "Likert scale"
- "Yes/No"
`;
      const surveyData = await requestOpenRouterJson(systemInstruction, prompt);

      return res.json({ success: true, survey: surveyData });
    } catch (err: any) {
      console.error("AI Survey Assistant error:", err);
      return res.status(500).json({
        error: "Failed to generate survey suggestions using AI Assistant.",
      });
    }
  },
);

// AI Survey Open-Ended Response Analysis Route
app.post(
  "/api/ai/survey-analytics",
  rateLimit(20, 60_000),
  requireApiAuth,
  (req, res, next) => {
    requireRoleAccess(req, res, next, [
      "Super Admin",
      "Organization Admin",
      "Organizer",
    ]);
  },
  async (req, res) => {
    try {
      const { surveyTitle, openEndedAnswers } = req.body;

      if (!Array.isArray(openEndedAnswers) || openEndedAnswers.length === 0) {
        return res.status(400).json({
          error: "No open-ended survey answers provided for thematic analysis.",
        });
      }

      const systemInstruction = `
You are an expert qualitative researcher for TABULA Intelligence Platform.
Analyze the provided list of open-ended survey text responses objectively.
Extract:
1. Primary themes (2-4 key bullet points)
2. Common issues or criticisms (2-3 items)
3. Strategic recommendations for competition organizers or institutional leadership.
NO emojis. Keep tone serious, analytical, and professional.
`;

      const promptText = `Survey Title: ${surveyTitle || "Competition Feedback"}\nResponses:\n${openEndedAnswers.map((a: string, i: number) => `${i + 1}. "${a}"`).join("\n")}`;
      const analysis = await requestOpenRouterJson(
        systemInstruction,
        promptText,
      );

      return res.json({ success: true, analysis });
    } catch (err: any) {
      console.error("AI Survey Analytics error:", err);
      return res
        .status(500)
        .json({ error: "Failed to generate qualitative survey analytics." });
    }
  },
);

// ==========================================
// SURVEY & QUESTION CRUD SERVICE API
// ==========================================

// GET /api/surveys - Fetch all surveys
app.get("/api/surveys", requireApiAuth, async (_req, res) => {
  const surveys = await fetchSurveys((_req as any).user);
  return res.json({ success: true, surveys });
});

// GET /api/surveys/:id - Fetch survey by ID or publicId
app.get("/api/surveys/:id", requireApiAuth, async (req, res) => {
  const { id } = req.params;
  const surveys = await fetchSurveys((req as any).user);
  const survey = surveys.find((s) => s.id === id || s.publicId === id);
  if (!survey) {
    return res.status(404).json({ error: "Survey record not found." });
  }
  return res.json({ success: true, survey });
});

// POST /api/surveys - Create a new survey
app.post(
  "/api/surveys",
  requireApiAuth,
  (req, res, next) => {
    requireRoleAccess(req, res, next, [
      "Super Admin",
      "Organization Admin",
      "Organizer",
    ]);
  },
  (req, res) => {
    const {
      title,
      description,
      status,
      questions,
      publicId,
      organizationId,
      eventId,
    } = req.body;
    if (!title) {
      return res.status(400).json({ error: "Survey title is required." });
    }

    const newSurvey = {
      id: `srv-${Date.now()}`,
      organizationId: organizationId || "org-ku-debate",
      eventId: eventId || undefined,
      title,
      description: description || "",
      status: status || "Published",
      responsesCount: 0,
      completionRate: 0,
      averageTimeMinutes: 0,
      publicId:
        publicId ||
        title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "") ||
        `survey-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      questions: Array.isArray(questions) ? questions : [],
    };

    serverSurveys.unshift(newSurvey);
    return res.json({ success: true, survey: newSurvey });
  },
);

// PUT /api/surveys/:id - Update survey metadata or full object
app.put(
  "/api/surveys/:id",
  requireApiAuth,
  (req, res, next) => {
    requireRoleAccess(req, res, next, [
      "Super Admin",
      "Organization Admin",
      "Organizer",
    ]);
  },
  (req, res) => {
    const { id } = req.params;
    const index = serverSurveys.findIndex(
      (s) => s.id === id || s.publicId === id,
    );
    if (index === -1) {
      return res.status(404).json({ error: "Survey record not found." });
    }

    const existing = serverSurveys[index];
    const updatedSurvey = {
      ...existing,
      ...req.body,
      updatedAt: new Date().toISOString(),
    };

    serverSurveys[index] = updatedSurvey;
    return res.json({ success: true, survey: updatedSurvey });
  },
);

// DELETE /api/surveys/:id - Delete survey
app.delete(
  "/api/surveys/:id",
  requireApiAuth,
  (req, res, next) => {
    requireRoleAccess(req, res, next, [
      "Super Admin",
      "Organization Admin",
      "Organizer",
    ]);
  },
  (req, res) => {
    const { id } = req.params;
    const initialCount = serverSurveys.length;
    serverSurveys = serverSurveys.filter(
      (s) => s.id !== id && s.publicId !== id,
    );

    if (serverSurveys.length === initialCount) {
      return res.status(404).json({ error: "Survey record not found." });
    }

    return res.json({ success: true, message: "Survey deleted successfully." });
  },
);

// GET /api/surveys/:surveyId/questions - Fetch questions for a specific survey
app.get("/api/surveys/:surveyId/questions", requireApiAuth, (req, res) => {
  const { surveyId } = req.params;
  const survey = serverSurveys.find(
    (s) => s.id === surveyId || s.publicId === surveyId,
  );
  if (!survey) {
    return res.status(404).json({ error: "Survey record not found." });
  }
  return res.json({ success: true, questions: survey.questions || [] });
});

// POST /api/surveys/:surveyId/questions - Add a new question to a survey
app.post(
  "/api/surveys/:surveyId/questions",
  requireApiAuth,
  (req, res, next) => {
    requireRoleAccess(req, res, next, [
      "Super Admin",
      "Organization Admin",
      "Organizer",
    ]);
  },
  (req, res) => {
    const { surveyId } = req.params;
    const survey = serverSurveys.find(
      (s) => s.id === surveyId || s.publicId === surveyId,
    );
    if (!survey) {
      return res.status(404).json({ error: "Survey record not found." });
    }

    const {
      title,
      type,
      isRequired,
      options,
      ratingMax,
      likertScale,
      description,
      conditionalLogic,
    } = req.body;
    if (!title || !type) {
      return res
        .status(400)
        .json({ error: "Question title and type are required." });
    }

    const newQuestion = {
      id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title,
      type,
      isRequired: isRequired ?? true,
      description,
      options,
      ratingMax,
      likertScale,
      conditionalLogic,
    };

    if (!Array.isArray(survey.questions)) {
      survey.questions = [];
    }
    survey.questions.push(newQuestion);
    survey.updatedAt = new Date().toISOString();

    return res.json({
      success: true,
      question: newQuestion,
      questions: survey.questions,
      survey,
    });
  },
);

// PUT /api/surveys/:surveyId/questions/:questionId - Edit a specific question
app.put(
  "/api/surveys/:surveyId/questions/:questionId",
  requireApiAuth,
  (req, res, next) => {
    requireRoleAccess(req, res, next, [
      "Super Admin",
      "Organization Admin",
      "Organizer",
    ]);
  },
  (req, res) => {
    const { surveyId, questionId } = req.params;
    const survey = serverSurveys.find(
      (s) => s.id === surveyId || s.publicId === surveyId,
    );
    if (!survey) {
      return res.status(404).json({ error: "Survey record not found." });
    }

    if (!Array.isArray(survey.questions)) {
      survey.questions = [];
    }

    const qIndex = survey.questions.findIndex((q: any) => q.id === questionId);
    if (qIndex === -1) {
      return res.status(404).json({ error: "Question not found in survey." });
    }

    const updatedQuestion = {
      ...survey.questions[qIndex],
      ...req.body,
    };

    survey.questions[qIndex] = updatedQuestion;
    survey.updatedAt = new Date().toISOString();

    return res.json({
      success: true,
      question: updatedQuestion,
      questions: survey.questions,
      survey,
    });
  },
);

// DELETE /api/surveys/:surveyId/questions/:questionId - Delete a question
app.delete(
  "/api/surveys/:surveyId/questions/:questionId",
  requireApiAuth,
  (req, res, next) => {
    requireRoleAccess(req, res, next, [
      "Super Admin",
      "Organization Admin",
      "Organizer",
    ]);
  },
  (req, res) => {
    const { surveyId, questionId } = req.params;
    const survey = serverSurveys.find(
      (s) => s.id === surveyId || s.publicId === surveyId,
    );
    if (!survey) {
      return res.status(404).json({ error: "Survey record not found." });
    }

    if (!Array.isArray(survey.questions)) {
      survey.questions = [];
    }

    const initialLen = survey.questions.length;
    survey.questions = survey.questions.filter((q: any) => q.id !== questionId);

    if (survey.questions.length === initialLen) {
      return res.status(404).json({ error: "Question not found in survey." });
    }

    survey.updatedAt = new Date().toISOString();
    return res.json({ success: true, questions: survey.questions, survey });
  },
);

// PUT /api/surveys/:surveyId/questions - Replace all questions for a survey (bulk save / reorder)
app.put(
  "/api/surveys/:surveyId/questions",
  requireApiAuth,
  (req, res, next) => {
    requireRoleAccess(req, res, next, [
      "Super Admin",
      "Organization Admin",
      "Organizer",
    ]);
  },
  (req, res) => {
    const { surveyId } = req.params;
    const { questions } = req.body;
    const survey = serverSurveys.find(
      (s) => s.id === surveyId || s.publicId === surveyId,
    );
    if (!survey) {
      return res.status(404).json({ error: "Survey record not found." });
    }

    if (!Array.isArray(questions)) {
      return res
        .status(400)
        .json({ error: "Questions parameter must be an array." });
    }

    survey.questions = questions;
    survey.updatedAt = new Date().toISOString();

    return res.json({ success: true, questions: survey.questions, survey });
  },
);

// ==========================================
// VITE / STATIC SERVING PIPELINE
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`TABULA platform server running on http://localhost:${PORT}`);
  });
}

export { app };

if (!process.env.VERCEL) {
  startServer();
}
