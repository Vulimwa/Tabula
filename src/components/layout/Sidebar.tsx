import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Trophy,
  Users,
  FileSpreadsheet,
  LineChart,
  ShieldAlert,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  Building2,
  ListFilter,
  Radio,
  CheckCircle2,
  Users2,
  UserCheck,
  UserCheck2,
  FileQuestion,
  BarChart3,
  UserCog,
  KeyRound,
  History,
  Settings as SettingsIcon,
} from 'lucide-react';
import { tabulaStore } from '../../lib/store';

interface NavGroupProps {
  label: string;
  icon: React.ReactNode;
  basePath: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const NavGroup: React.FC<NavGroupProps> = ({
  label,
  icon,
  basePath,
  isOpen,
  onToggle,
  children,
}) => {
  const location = useLocation();
  const isActive = location.pathname.startsWith(basePath);

  return (
    <div className="mb-1">
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-none transition-colors text-left uppercase tracking-wider ${
          isActive
            ? 'text-[#E2FF00] bg-[#181818]'
            : 'text-[#A0A0A0] hover:text-white hover:bg-[#141414]'
        }`}
      >
        <div className="flex items-center space-x-2.5">
          <span className={isActive ? 'text-[#E2FF00]' : 'text-[#777]'}>{icon}</span>
          <span>{label}</span>
        </div>
        {isOpen ? (
          <ChevronDown className="w-3.5 h-3.5 text-[#777]" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-[#777]" />
        )}
      </button>

      {isOpen && <div className="mt-0.5 ml-3 pl-2 border-l border-white/10 space-y-0.5">{children}</div>}
    </div>
  );
};

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(tabulaStore.getCurrentUser());
  const [org, setOrg] = useState(tabulaStore.getOrganization());

  useEffect(() => {
    const unsubscribe = tabulaStore.subscribe(() => {
      setCurrentUser(tabulaStore.getCurrentUser());
      setOrg(tabulaStore.getOrganization());
    });
    return unsubscribe;
  }, []);

  const role = currentUser?.role || 'Viewer';

  const isSuperAdmin = role === 'Super Admin';
  const isOrgAdmin = isSuperAdmin || role === 'Organization Admin';
  const isOrganizer = isOrgAdmin || role === 'Organizer';
  const isJudge = role === 'Judge';
  const isParticipantOrViewer = role === 'Participant' || role === 'Viewer';

  // Collapsible groups state
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    events: true,
    tabulation: true,
    people: false,
    surveys: true,
    admin: false,
  });

  const toggleGroup = (group: string) => {
    setOpenGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `relative flex items-center space-x-2 px-2.5 py-1.5 text-xs font-medium transition-colors ${
      isActive
        ? 'text-black font-black bg-[#E2FF00]'
        : 'text-[#A0A0A0] hover:text-white hover:bg-[#1C1C1C]'
    }`;

  return (
    <aside className="w-[220px] bg-[#0A0A0A] text-white flex flex-col h-screen fixed left-0 top-0 z-30 select-none border-r border-white/10">
      {/* Brand Header */}
      <div className="h-[60px] px-4 flex items-center border-b border-white/10 justify-between bg-[#0D0D0D]">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 bg-[#E2FF00] text-black rounded-none flex items-center justify-center font-black text-base tracking-tighter">
            T
          </div>
          <div>
            <span className="display-type text-lg tracking-tight text-white block leading-none">
              TABULA™
            </span>
            <span className="micro-label block text-[9px]">
              Tab & Survey Intelligence
            </span>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        {/* Single Item: Dashboard */}
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex items-center space-x-2.5 px-3 py-2 text-xs font-bold transition-colors uppercase tracking-wider ${
              isActive
                ? 'text-black bg-[#E2FF00]'
                : 'text-[#A0A0A0] hover:text-white hover:bg-[#141414]'
            }`
          }
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Dashboard</span>
        </NavLink>

        {/* Group: Events */}
        {role !== 'Judge' && (
        <NavGroup
          label="Events"
          icon={<Calendar className="w-4 h-4" />}
          basePath="/events"
          isOpen={openGroups.events}
          onToggle={() => toggleGroup('events')}
        >
          <NavLink to="/events" end className={linkClass}>
            <ListFilter className="w-3.5 h-3.5" />
            <span>All Events</span>
          </NavLink>
          {isOrganizer && (
            <NavLink to="/events/new" className={linkClass}>
              <Calendar className="w-3.5 h-3.5" />
              <span>Create Event</span>
            </NavLink>
          )}
          <NavLink to="/events?filter=Live" className={linkClass}>
            <Radio className="w-3.5 h-3.5 text-[#E2FF00]" />
            <span>Live Events</span>
          </NavLink>
          <NavLink to="/events?filter=Completed" className={linkClass}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Completed</span>
          </NavLink>
        </NavGroup>
        )}

        {/* Group: Tabulation */}
        <NavGroup
          label="Tabulation"
          icon={<Trophy className="w-4 h-4" />}
          basePath="/tabulation"
          isOpen={openGroups.tabulation}
          onToggle={() => toggleGroup('tabulation')}
        >
          {isOrganizer && (
            <NavLink to="/tabulation/live" className={linkClass}>
              <Radio className="w-3.5 h-3.5" />
              <span>Live Tab</span>
            </NavLink>
          )}
          <NavLink to="/tabulation/standings" className={linkClass}>
            <Trophy className="w-3.5 h-3.5" />
            <span>Standings</span>
          </NavLink>
          <NavLink to="/tabulation/speakers" className={linkClass}>
            <Users2 className="w-3.5 h-3.5" />
            <span>Speaker Rankings</span>
          </NavLink>
          {isOrganizer && (
            <NavLink to="/tabulation/results" className={linkClass}>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Results Release</span>
            </NavLink>
          )}
        </NavGroup>

        {/* Group: People (Hidden for general Viewers / Participants) */}
        {!isParticipantOrViewer && (
          <NavGroup
            label="People"
            icon={<Users className="w-4 h-4" />}
            basePath="/people"
            isOpen={openGroups.people}
            onToggle={() => toggleGroup('people')}
          >
            {isOrganizer && (
              <>
                <NavLink to="/people/teams" className={linkClass}>
                  <Users2 className="w-3.5 h-3.5" />
                  <span>Teams</span>
                </NavLink>
                <NavLink to="/people/speakers" className={linkClass}>
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Speakers</span>
                </NavLink>
              </>
            )}
            <NavLink to="/people/judges" className={linkClass}>
              <UserCheck2 className="w-3.5 h-3.5" />
              <span>Judges</span>
            </NavLink>
          </NavGroup>
        )}

        {/* Group: Surveys */}
        {role !== 'Judge' && (
        <NavGroup
          label="Surveys"
          icon={<FileSpreadsheet className="w-4 h-4" />}
          basePath="/surveys"
          isOpen={openGroups.surveys}
          onToggle={() => toggleGroup('surveys')}
        >
          <NavLink to="/surveys" end className={linkClass}>
            <FileQuestion className="w-3.5 h-3.5" />
            <span>All Surveys</span>
          </NavLink>
          {isOrganizer && (
            <NavLink to="/surveys/new" className={linkClass}>
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Create Survey</span>
            </NavLink>
          )}
        </NavGroup>
        )}

        {/* Single Item: Insights */}
        {isOrganizer && (
          <NavLink
            to="/insights"
            className={({ isActive }) =>
              `flex items-center space-x-2.5 px-3 py-2 text-xs font-bold transition-colors uppercase tracking-wider ${
                isActive
                  ? 'text-black bg-[#E2FF00]'
                  : 'text-[#A0A0A0] hover:text-white hover:bg-[#141414]'
              }`
            }
          >
            <LineChart className="w-4 h-4" />
            <span>Insights</span>
          </NavLink>
        )}

        {/* Group: Administration */}
        {isOrgAdmin && (
          <NavGroup
            label="Administration"
            icon={<ShieldAlert className="w-4 h-4" />}
            basePath="/admin"
            isOpen={openGroups.admin}
            onToggle={() => toggleGroup('admin')}
          >
            <NavLink to="/admin/organization" className={linkClass}>
              <Building2 className="w-3.5 h-3.5" />
              <span>Organization</span>
            </NavLink>
            <NavLink to="/admin/users" className={linkClass}>
              <UserCog className="w-3.5 h-3.5" />
              <span>{isSuperAdmin ? "Users & RBAC" : "My Profile"}</span>
            </NavLink>
            {isSuperAdmin && (
              <>
                <NavLink to="/admin/roles" className={linkClass}>
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Roles & Permissions</span>
                </NavLink>
                <NavLink to="/admin/audit-logs" className={linkClass}>
                  <History className="w-3.5 h-3.5" />
                  <span>Audit Logs</span>
                </NavLink>
              </>
            )}
            <NavLink to="/admin/settings" className={linkClass}>
              <SettingsIcon className="w-3.5 h-3.5" />
              <span>Settings</span>
            </NavLink>
          </NavGroup>
        )}
      </div>

      {/* Footer / Organization Info */}
      <div className="p-3 border-t border-white/10 bg-[#0D0D0D] text-[11px] space-y-2">
        <div className="flex items-center space-x-2 text-[#A0A0A0]">
          <Building2 className="w-3.5 h-3.5 text-[#E2FF00]" />
          <span className="truncate font-semibold uppercase tracking-wider text-[10px]">{org.name}</span>
        </div>
        <div className="flex items-center justify-between text-[#777] pt-1">
          <a
            href="#help"
            onClick={(e) => {
              e.preventDefault();
              alert('TABULA Enterprise Documentation & Support Center');
            }}
            className="hover:text-white flex items-center space-x-1 transition-colors"
          >
            <HelpCircle className="w-3 h-3" />
            <span className="text-[10px] uppercase font-bold tracking-wider">Help</span>
          </a>
          <span className="text-[10px] font-mono text-[#E2FF00]">v2.4.0</span>
        </div>
      </div>
    </aside>
  );
};
