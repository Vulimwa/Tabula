// TABULA Platform Global Type Definitions

export type UserRole =
  | 'Super Admin'
  | 'Organization Admin'
  | 'Organizer'
  | 'Judge'
  | 'Participant'
  | 'Viewer';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  organizationId: string;
  organizationName: string;
  avatarUrl?: string;
  status: 'Active' | 'Inactive' | 'Pending Verification';
  lastActivity: string;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  type: 'University' | 'Debate League' | 'High School' | 'NGO / Society';
  membersCount: number;
  eventsCount: number;
  createdAt: string;
}

export type EventStatus = 'Draft' | 'Upcoming' | 'Live' | 'Completed' | 'Archived';
export type DebateFormat = 'British Parliamentary' | 'World Schools' | 'Asian Parliamentary' | 'Lincoln-Douglas' | 'Policy';

export interface DebateEvent {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  format: DebateFormat;
  status: EventStatus;
  startDate: string;
  endDate: string;
  venue: string;
  roundsCount: number;
  currentRound: number;
  maxSpeakersPerTeam: number;
  scoringSystem: string;
  teamsCount: number;
  speakersCount: number;
  judgesCount: number;
  isResultsPublished: boolean;
  createdAt: string;
}

export type CategoryType = 'Open' | 'ESL' | 'EFL' | 'Novice';

export interface Team {
  id: string;
  eventId: string;
  name: string;
  institution: string;
  category: CategoryType;
  speakers: Speaker[];
  wins: number;
  losses: number;
  draws: number;
  totalPoints: number;
  speakerPoints: number;
  rank: number;
  status: 'Registered' | 'Active' | 'Disqualified' | 'Withdrawn';
}

export interface Speaker {
  id: string;
  teamId?: string;
  teamName?: string;
  eventId: string;
  name: string;
  email?: string;
  institution: string;
  category: CategoryType;
  totalPoints: number;
  averageScore: number;
  highestScore: number;
  roundsDebated: number;
  rank: number;
}

export interface Judge {
  id: string;
  eventId: string;
  name: string;
  email: string;
  institution: string;
  experienceLevel: 'Chair' | 'Panelist' | 'Trainee';
  rating: number; // 1-10 rating scale
  assignedRounds: number;
  ballotsSubmitted: number;
  status: 'Available' | 'Assigned' | 'In Progress' | 'Completed' | 'Inactive';
}

export interface DebateRoom {
  id: string;
  roundId: string;
  eventId: string;
  roomName: string;
  governmentTeamId: string;
  governmentTeamName: string;
  oppositionTeamId: string;
  oppositionTeamName: string;
  assignedJudges: Judge[];
  status: 'Not Started' | 'In Progress' | 'Awaiting Ballots' | 'Complete';
  winnerTeamId?: string;
  expectedBallots: number;
  submittedBallots: number;
}

export interface ScoringCriteria {
  id: string;
  name: string; // e.g. 'Matter / Content', 'Manner / Style', 'Method / Strategy'
  minScore: number;
  maxScore: number;
  weight: number;
}

export interface SpeakerScoreInput {
  speakerId: string;
  speakerName: string;
  teamId: string;
  scores: Record<string, number>; // criteriaId -> numeric score
  totalScore: number;
}

export interface Ballot {
  id: string;
  debateRoomId: string;
  eventId: string;
  roundNumber: number;
  judgeId: string;
  judgeName: string;
  winningTeamId: string;
  governmentTotalPoints: number;
  oppositionTotalPoints: number;
  speakerScores: SpeakerScoreInput[];
  strengthsComment?: string;
  improvementsComment?: string;
  generalComments?: string;
  isLocked: boolean;
  submittedAt?: string;
  status: 'Pending' | 'Submitted' | 'Verified' | 'Flagged';
}

export interface DebateRound {
  id: string;
  eventId: string;
  roundNumber: number;
  name: string;
  motion: string;
  infoSlide?: string;
  startTime: string;
  status: 'Draft' | 'Pairings Released' | 'In Progress' | 'Tabulating' | 'Complete';
  roomsCount: number;
  completedRoomsCount: number;
}

export type QuestionType =
  | 'Short text'
  | 'Long text'
  | 'Single choice'
  | 'Multiple choice'
  | 'Dropdown'
  | 'Rating'
  | 'Likert scale'
  | 'Number'
  | 'Date'
  | 'Yes/No';

export interface SurveyQuestion {
  id: string;
  type: QuestionType;
  title: string;
  description?: string;
  isRequired: boolean;
  options?: string[]; // For single choice, multiple choice, dropdown
  ratingMax?: number; // For rating type
  likertScale?: string[]; // e.g., ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"]
  conditionalLogic?: {
    dependsOnQuestionId: string;
    operator: 'equals' | 'not_equals';
    value: string;
  };
}

export interface Survey {
  id: string;
  organizationId: string;
  eventId?: string;
  title: string;
  description: string;
  status: 'Draft' | 'Published' | 'Closed';
  questions: SurveyQuestion[];
  responsesCount: number;
  completionRate: number; // percentage e.g. 94.2
  averageTimeMinutes: number;
  publicId: string;
  createdAt: string;
  updatedAt: string;
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  respondentId?: string;
  answers: Record<string, any>; // questionId -> answer
  submittedAt: string;
  timeSpentSeconds: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  resource: string;
  details: string;
  result: 'Success' | 'Denied' | 'Failed';
  ipAddress?: string;
}

export interface SystemMetrics {
  activeEventsCount: number;
  upcomingEventsCount: number;
  registeredParticipantsCount: number;
  pendingBallotsCount: number;
  surveyResponsesCount: number;
}
