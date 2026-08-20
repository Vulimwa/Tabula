import { UserRole } from "../types";

export const USER_ROLES: UserRole[] = [
  "Super Admin",
  "Organization Admin",
  "Organizer",
  "Judge",
  "Participant",
  "Viewer",
];

export const ROLE_GROUPS = {
  superAdmin: ["Super Admin"] as UserRole[],
  orgAdmin: ["Super Admin", "Organization Admin"] as UserRole[],
  organizer: ["Super Admin", "Organization Admin", "Organizer"] as UserRole[],
  judge: [
    "Super Admin",
    "Organization Admin",
    "Organizer",
    "Judge",
  ] as UserRole[],
  participants: [
    "Super Admin",
    "Organization Admin",
    "Organizer",
    "Participant",
    "Viewer",
  ] as UserRole[],
  publicRead: [
    "Super Admin",
    "Organization Admin",
    "Organizer",
    "Judge",
    "Participant",
    "Viewer",
  ] as UserRole[],
};

export const ROUTE_ROLE_ACCESS: Record<string, UserRole[]> = {
  "/": [
    "Super Admin",
    "Organization Admin",
    "Organizer",
    "Judge",
    "Participant",
    "Viewer",
  ],
  "/login": [
    "Super Admin",
    "Organization Admin",
    "Organizer",
    "Judge",
    "Participant",
    "Viewer",
  ],
  "/dashboard": [
    "Super Admin",
    "Organization Admin",
    "Organizer",
    "Judge",
    "Participant",
    "Viewer",
  ],
  "/events": [
    "Super Admin",
    "Organization Admin",
    "Organizer",
    "Participant",
    "Viewer",
  ],
  "/events/new": ["Super Admin", "Organization Admin", "Organizer"],
  "/events/:eventId": [
    "Super Admin",
    "Organization Admin",
    "Organizer",
    "Participant",
    "Viewer",
  ],
  "/tabulation/live": ["Super Admin", "Organization Admin", "Organizer"],
  "/tabulation/standings": [
    "Super Admin",
    "Organization Admin",
    "Organizer",
    "Judge",
    "Participant",
    "Viewer",
  ],
  "/tabulation/speakers": [
    "Super Admin",
    "Organization Admin",
    "Organizer",
    "Judge",
    "Participant",
    "Viewer",
  ],
  "/tabulation/results": ["Super Admin", "Organization Admin", "Organizer"],
  "/people/teams": ["Super Admin", "Organization Admin", "Organizer"],
  "/people/speakers": ["Super Admin", "Organization Admin", "Organizer"],
  "/people/judges": ["Super Admin", "Organization Admin", "Organizer", "Judge"],
  "/surveys": [
    "Super Admin",
    "Organization Admin",
    "Organizer",
    "Participant",
    "Viewer",
  ],
  "/surveys/new": ["Super Admin", "Organization Admin", "Organizer"],
  "/surveys/:surveyId/edit": ["Super Admin", "Organization Admin", "Organizer"],
  "/surveys/:surveyId/analytics": [
    "Super Admin",
    "Organization Admin",
    "Organizer",
  ],
  "/insights": ["Super Admin", "Organization Admin", "Organizer"],
  "/admin/organization": ["Super Admin", "Organization Admin"],
  "/admin/users": ["Super Admin", "Organization Admin"],
  "/admin/roles": ["Super Admin"],
  "/admin/audit-logs": ["Super Admin"],
  "/admin/settings": ["Super Admin", "Organization Admin", "Organizer"],
  "/judge/ballot/:roomId": [
    "Super Admin",
    "Organization Admin",
    "Organizer",
    "Judge",
  ],
};

export function getRoleAccess(pathname: string): UserRole[] | undefined {
  const normalizedPath = pathname.split("?")[0];

  const exactMatch = ROUTE_ROLE_ACCESS[normalizedPath];
  if (exactMatch) return exactMatch;

  const eventIdMatch = normalizedPath.match(/^\/events\/[^/]+$/);
  if (eventIdMatch) return ROUTE_ROLE_ACCESS["/events/:eventId"];

  const surveyIdMatch = normalizedPath.match(
    /^\/surveys\/[^/]+\/(?:edit|analytics)$/,
  );
  if (surveyIdMatch) {
    const suffix = normalizedPath.endsWith("/edit")
      ? "/surveys/:surveyId/edit"
      : "/surveys/:surveyId/analytics";
    return ROUTE_ROLE_ACCESS[suffix];
  }

  if (/^\/judge\/ballot\/[^/]+$/.test(normalizedPath)) {
    return ROUTE_ROLE_ACCESS["/judge/ballot/:roomId"];
  }

  return undefined;
}

export function roleCanAccess(routePath: string, role: UserRole): boolean {
  const allowed = getRoleAccess(routePath);
  if (!allowed) return false;
  return allowed.includes(role);
}
