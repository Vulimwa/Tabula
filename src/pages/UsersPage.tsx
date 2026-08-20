import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  UserCog,
  Shield,
  CheckCircle2,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { tabulaStore } from "../lib/store";
import { UserRole, UserProfile } from "../types";

export const UsersPage: React.FC = () => {
  const [currentUser, setCurrentUser] = useState(tabulaStore.getCurrentUser());
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [newFullName, setNewFullName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("Organizer");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [provisionedCredentials, setProvisionedCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);

  const refreshUsers = () => {
    setUsers(tabulaStore.getUsers());
  };

  useEffect(() => {
    refreshUsers();
    return tabulaStore.subscribe(() => {
      refreshUsers();
      setCurrentUser(tabulaStore.getCurrentUser());
    });
  }, []);

  if (!currentUser) return null;
  const authenticatedUser = currentUser;

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName || !newEmail || newPassword.length < 8) return;

    setLoading(true);
    setFeedback("");

    try {
      // Send to server endpoint
      const res = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(tabulaStore.getApiAuthHeaders() || {}),
        },
        body: JSON.stringify({
          fullName: newFullName,
          email: newEmail,
          password: newPassword,
          role: newRole,
          organizationId: authenticatedUser.organizationId || "org-ku-debate",
          organizationName:
            authenticatedUser.organizationName ||
            "Kenyatta University Debate Society",
          creatorRole: authenticatedUser.role,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to provision user.");
      }

      await tabulaStore.hydrateFromApi();
      setProvisionedCredentials(data.credentials);

      setFeedback(
        `Successfully provisioned ${newRole} account for ${newFullName}.`,
      );
      setNewFullName("");
      setNewEmail("");
      setNewPassword("");
      setShowAddModal(false);
    } catch (err: any) {
      setFeedback(err.message || "Error creating user account.");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, updatedRole: UserRole) => {
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(userId)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...tabulaStore.getApiAuthHeaders(),
        },
        body: JSON.stringify({ role: updatedRole }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update profile role.");
      }
      tabulaStore.updateUser(userId, { role: updatedRole });
      setFeedback(`Updated ${data.user.email} to ${updatedRole}.`);
    } catch (err: any) {
      setFeedback(err.message || "Failed to update profile role.");
    }
  };

  const filtered = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Page Title Header */}
      <div className="bg-[#141414] border border-white/10 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="display-type text-2xl text-white uppercase tracking-tight">
              USER ADMINISTRATION & RBAC CONSOLE
            </h1>
            {authenticatedUser.role === "Super Admin" && (
              <span className="px-2 py-0.5 bg-[#E2FF00] text-black text-[10px] font-black uppercase tracking-wider">
                SUPER ADMIN
              </span>
            )}
          </div>
          <p className="text-xs text-[#A0A0A0] mt-1">
            Manage user accounts, system privileges, and multi-institutional
            authorization roles.
          </p>
        </div>

        {authenticatedUser.role === "Super Admin" && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-[#E2FF00] hover:bg-[#CBE600] text-black text-xs font-black uppercase tracking-wider flex items-center space-x-1.5 self-start sm:self-auto transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>PROVISION USER ACCOUNT</span>
          </button>
        )}
      </div>

      {feedback && (
        <div className="p-3 bg-[#E2FF00]/10 border border-[#E2FF00]/30 text-[#E2FF00] text-xs font-medium flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {provisionedCredentials && (
        <div className="p-4 bg-[#E2FF00]/10 border border-[#E2FF00]/30 text-xs space-y-2">
          <strong className="text-[#E2FF00]">Account credentials, shown once</strong>
          <div className="font-mono text-white">Email: {provisionedCredentials.email}</div>
          <div className="font-mono text-white">Temporary password: {provisionedCredentials.password}</div>
          <p className="text-[#A0A0A0]">Send these securely. The user should change the password after signing in.</p>
          <button type="button" onClick={() => setProvisionedCredentials(null)} className="text-[#E2FF00] font-bold uppercase">Dismiss</button>
        </div>
      )}

      {/* Search & Stats Bar */}
      <div className="bg-[#141414] border border-white/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-[#888] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search users by name, email, role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#181818] pl-8 pr-3 py-2 border border-white/10 text-white text-xs focus:outline-none focus:border-[#E2FF00]"
          />
        </div>

        <div className="flex items-center space-x-4 micro-label text-[#888]">
          <span>
            Total Users:{" "}
            <strong className="text-white font-mono">{users.length}</strong>
          </span>
          <span>
            Super Admins:{" "}
            <strong className="text-[#E2FF00] font-mono">
              {users.filter((u) => u.role === "Super Admin").length}
            </strong>
          </span>
        </div>
      </div>

      {/* Users Data Table */}
      <div className="bg-[#141414] border border-white/10 overflow-hidden">
        <table className="tabula-table">
          <thead>
            <tr>
              <th>Full Name</th>
              <th>Email Address</th>
              <th>System Role</th>
              <th>Status</th>
              <th>Last Active</th>
              <th className="text-right">Access Controls</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="hover:bg-[#1A1A1A]">
                <td>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white">{u.fullName}</span>
                    {u.role === "Super Admin" && (
                      <ShieldCheck
                        className="w-4 h-4 text-[#E2FF00]"
                        title="Super Admin Account"
                      />
                    )}
                  </div>
                </td>
                <td className="text-[#A0A0A0] text-xs font-mono">{u.email}</td>
                <td>
                  <span
                    className={`px-2 py-0.5 text-xs font-bold uppercase tracking-wider border ${
                      u.role === "Super Admin"
                        ? "bg-[#E2FF00]/15 text-[#E2FF00] border-[#E2FF00]/40"
                        : u.role === "Organization Admin"
                          ? "bg-blue-500/15 text-blue-400 border-blue-500/40"
                          : "bg-white/5 text-[#A0A0A0] border-white/10"
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td>
                  <span className="inline-flex items-center space-x-1 text-[#E2FF00] text-xs font-medium">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>{u.status}</span>
                  </span>
                </td>
                <td className="text-[#888] text-xs">
                  {u.lastActivity || "Just now"}
                </td>
                <td className="text-right">
                  {authenticatedUser.role === "Super Admin" ||
                  authenticatedUser.role === "Organization Admin" ? (
                    <select
                      value={u.role}
                      onChange={(e) =>
                        handleRoleChange(u.id, e.target.value as UserRole)
                      }
                      className="bg-[#181818] border border-white/10 text-xs text-white px-2 py-1 focus:border-[#E2FF00] focus:outline-none cursor-pointer"
                    >
                      {authenticatedUser.role === "Super Admin" && (
                        <option value="Super Admin">
                          Super Admin (System Wide)
                        </option>
                      )}
                      <option value="Organization Admin">
                        Organization Admin
                      </option>
                      <option value="Organizer">Organizer</option>
                      <option value="Judge">Judge</option>
                      <option value="Participant">Participant</option>
                      <option value="Viewer">Viewer</option>
                    </select>
                  ) : (
                    <span className="text-xs text-[#888]">Protected</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Provision User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-white/20 p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="display-type text-lg text-white">
                PROVISION USER ACCOUNT
              </h2>
              <span className="micro-label text-[#E2FF00]">
                AUTH MANAGEMENT
              </span>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="micro-label block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Sarah Jenkins"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full h-10 px-3 bg-[#181818] border border-white/10 text-white focus:outline-none focus:border-[#E2FF00]"
                />
              </div>

              <div>
                <label className="micro-label block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. s.jenkins@ku.ac.ke"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full h-10 px-3 bg-[#181818] border border-white/10 text-white focus:outline-none focus:border-[#E2FF00]"
                />
              </div>

              <div>
                <label className="micro-label block mb-1">Temporary Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full h-10 px-3 bg-[#181818] border border-white/10 text-white focus:outline-none focus:border-[#E2FF00]"
                />
                <p className="text-[11px] text-[#888] mt-1">Minimum 8 characters. This is shown once after account creation.</p>
              </div>

              <div>
                <label className="micro-label block mb-1">
                  Assigned System Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full h-10 px-3 bg-[#181818] border border-white/10 text-white focus:outline-none focus:border-[#E2FF00]"
                >
                  {authenticatedUser.role === "Super Admin" && (
                    <option
                      value="Super Admin"
                      className="text-[#E2FF00] font-bold"
                    >
                      ★ Super Admin (Full System Access)
                    </option>
                  )}
                  <option value="Organization Admin">Organization Admin</option>
                  <option value="Organizer">Organizer</option>
                  <option value="Judge">Judge</option>
                  <option value="Participant">Participant</option>
                  <option value="Viewer">Viewer</option>
                </select>

                {newRole === "Super Admin" && (
                  <p className="text-[11px] text-[#E2FF00] mt-1.5 flex items-center space-x-1 font-mono">
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Warning: Super Admins possess unrestricted system-wide
                      administrative control.
                    </span>
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-[#1C1C1C] hover:bg-[#252525] border border-white/10 text-white text-xs font-bold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-[#E2FF00] hover:bg-[#CBE600] text-black text-xs font-black uppercase tracking-wider"
                >
                  {loading ? "PROVISIONING..." : "PROVISION ACCOUNT"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
