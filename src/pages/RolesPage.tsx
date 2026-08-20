import React from 'react';
import { KeyRound, ShieldCheck, Check } from 'lucide-react';

export const RolesPage: React.FC = () => {
  const roles = [
    {
      role: 'Super Admin',
      description: 'Unrestricted system-wide control across all organizations, user accounts, and database records.',
      permissions: ['Manage Super Admins & Users', 'Manage Organizations', 'Manage Events & Surveys', 'Lock & Verify Ballots', 'Full System Audit'],
    },
    {
      role: 'Organization Admin',
      description: 'Complete management within institutional organization scope.',
      permissions: ['Manage Events', 'Manage Users & RBAC', 'Create & Publish Surveys', 'Lock & Verify Ballots', 'View Analytics'],
    },
    {
      role: 'Organizer',
      description: 'Tournament management, pairings, surveys, and round execution.',
      permissions: ['Create Events', 'Run Pairings', 'Input Ballots', 'Create & Manage Surveys', 'Publish Standings'],
    },
    {
      role: 'Judge',
      description: 'Accredited adjudicator ballot submission and score entry.',
      permissions: ['Submit Ballots', 'View Room Pairings', 'View Standings'],
    },
    {
      role: 'Participant / Viewer',
      description: 'Public participant access, event browsing, standings, and survey completion.',
      permissions: ['View Live & Completed Events', 'View Standings & Speaker Rankings', 'Submit Public Survey Feedback'],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-[#141414] border border-white/10 p-5">
        <h1 className="display-type text-2xl text-white uppercase tracking-tight">
          ROLES & SECURITY PERMISSIONS MATRIX
        </h1>
        <p className="text-xs text-[#A0A0A0] mt-1">
          Role-based access control (RBAC) governance and feature permissions mapping.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((r) => (
          <div key={r.role} className="bg-[#141414] border border-white/10 p-5 space-y-4">
            <div className="flex items-center space-x-2 border-b border-white/10 pb-3">
              <KeyRound className="w-4 h-4 text-[#E2FF00]" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">{r.role}</h3>
            </div>

            <p className="text-xs text-[#A0A0A0] leading-relaxed">{r.description}</p>

            <div className="space-y-1.5 pt-2 border-t border-white/10 text-xs">
              <span className="micro-label text-[#888] block mb-1">Granted Permissions:</span>
              {r.permissions.map((p, idx) => (
                <div key={idx} className="flex items-center space-x-1.5 text-white">
                  <Check className="w-3.5 h-3.5 text-[#E2FF00] shrink-0" />
                  <span>{p}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
