import React, { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  Search,
  Bell,
  User,
  LogOut,
  Settings,
  ChevronDown,
  Check,
  Sun,
  Moon,
} from "lucide-react";
import { tabulaStore } from "../../lib/store";
import { USER_ROLES } from "../../lib/rbac";
import { UserRole } from "../../types";
import { useTheme } from "../../lib/theme";

export const TopHeader: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = tabulaStore.getCurrentUser();
  const { theme, toggleTheme } = useTheme();

  const [searchQuery, setSearchQuery] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Generate breadcrumb links based on pathname
  const pathSegments = location.pathname.split("/").filter(Boolean);

  const formatBreadcrumb = (segment: string) => {
    if (segment.startsWith("evt-")) return "National Debate Championship";
    if (segment.startsWith("srv-")) return "Participant Feedback Survey";
    if (segment.startsWith("tm-")) return "Team Record";
    return segment.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const handleRoleSwitch = (role: UserRole) => {
    tabulaStore.updateUser(user.id, { role });
    setShowUserMenu(false);
  };

  const handleSignOut = () => {
    setShowUserMenu(false);
    navigate("/login");
  };

  return (
    <header className="h-[60px] bg-[#0D0D0D] border-b border-white/10 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Breadcrumbs */}
      <nav className="flex items-center space-x-2 text-xs font-medium text-[#A0A0A0]">
        <Link to="/dashboard" className="hover:text-white transition-colors">
          Dashboard
        </Link>
        {pathSegments.map((segment, index) => {
          const url = `/${pathSegments.slice(0, index + 1).join("/")}`;
          const isLast = index === pathSegments.length - 1;
          const label = formatBreadcrumb(segment);

          return (
            <React.Fragment key={url}>
              <span className="text-white/30">&gt;</span>
              {isLast ? (
                <span className="text-[#E2FF00] font-semibold uppercase tracking-wider text-[11px]">
                  {label}
                </span>
              ) : (
                <Link to={url} className="hover:text-white transition-colors">
                  {label}
                </Link>
              )}
            </React.Fragment>
          );
        })}
      </nav>

      {/* Right Actions */}
      <div className="flex items-center space-x-4">
        {/* Compact Search */}
        <div className="relative w-56">
          <Search className="w-3.5 h-3.5 text-[#888888] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search teams, motions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#181818] text-xs text-white pl-8 pr-3 py-1.5 rounded-none border border-white/10 focus:border-[#E2FF00] focus:outline-none transition-all placeholder:text-[#666]"
          />
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-1.5 text-[#A0A0A0] hover:text-white hover:bg-[#181818] rounded transition-colors relative"
          title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 text-[#E2FF00]" />
          ) : (
            <Moon className="w-4 h-4 text-[#2563EB]" />
          )}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-1.5 text-[#A0A0A0] hover:text-white hover:bg-[#181818] rounded transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 bg-[#E2FF00] rounded-full absolute top-1 right-1" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 bg-[#141414] border border-white/10 rounded-none shadow-2xl py-2 z-50 text-white">
              <div className="px-3 py-1.5 border-b border-white/10 micro-label">
                Notifications
              </div>
              <div className="p-4 text-xs text-[#A0A0A0]">
                No new notifications.
              </div>
            </div>
          )}
        </div>

        {/* User Account Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-2.5 p-1 rounded hover:bg-[#181818] transition-colors"
          >
            <div className="w-7 h-7 bg-[#E2FF00] text-black font-black rounded-none flex items-center justify-center text-xs">
              {user.fullName.charAt(0)}
            </div>
            <div className="text-left hidden md:block">
              <span className="block text-xs font-bold text-white leading-tight uppercase">
                {user.fullName}
              </span>
              <span className="block text-[10px] text-[#E2FF00] font-mono leading-tight">
                {user.role}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#A0A0A0]" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-[#141414] border border-white/10 rounded-none shadow-2xl py-1 z-50 text-xs text-white">
              <div className="px-3 py-2 border-b border-white/10">
                <p className="font-bold text-white uppercase">
                  {user.fullName}
                </p>
                <p className="text-[#A0A0A0] text-[11px] truncate">
                  {user.email}
                </p>
                <div className="mt-1.5 inline-block px-1.5 py-0.5 bg-[#1C1C1C] text-[#E2FF00] text-[10px] font-mono border border-white/10">
                  {user.organizationName}
                </div>
              </div>

              {/* Role Switcher */}
              <div className="px-3 py-1.5 micro-label bg-[#0D0D0D]">
                Switch Role Context
              </div>

              {USER_ROLES.map((role) => (
                <button
                  key={role}
                  onClick={() => handleRoleSwitch(role)}
                  className="w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-[#1F1F1F] text-white"
                >
                  <span className="text-xs font-medium">{role}</span>
                  {user.role === role && (
                    <Check className="w-3.5 h-3.5 text-[#E2FF00]" />
                  )}
                </button>
              ))}

              <div className="border-t border-white/10 my-1" />

              <button
                onClick={() => {
                  setShowUserMenu(false);
                  navigate("/admin/settings");
                }}
                className="w-full text-left px-3 py-2 flex items-center space-x-2 text-white hover:bg-[#1F1F1F]"
              >
                <Settings className="w-3.5 h-3.5 text-[#888]" />
                <span>Account Settings</span>
              </button>

              <button
                onClick={handleSignOut}
                className="w-full text-left px-3 py-2 flex items-center space-x-2 text-[#FF4D4D] hover:bg-[#2A1414]"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
