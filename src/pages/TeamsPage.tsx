import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Download, Filter, CheckSquare } from 'lucide-react';
import { tabulaStore } from '../lib/store';
import { StatusBadge } from '../components/common/StatusBadge';
import { CategoryType } from '../types';

export const TeamsPage: React.FC = () => {
  const events = tabulaStore.getEvents();
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id || '');
  const [teams, setTeams] = useState(tabulaStore.getTeams(selectedEventId));
  const [search, setSearch] = useState('');
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  // New team form state
  const [newTeamName, setNewTeamName] = useState('');
  const [newInstitution, setNewInstitution] = useState('');
  const [newCategory, setNewCategory] = useState<CategoryType>('Open');

  useEffect(() => {
    const unsubscribe = tabulaStore.subscribe(() => {
      setTeams(tabulaStore.getTeams(selectedEventId));
    });
    return unsubscribe;
  }, [selectedEventId]);

  const handleEventChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedEventId(id);
    setTeams(tabulaStore.getTeams(id));
    setSelectedTeamIds([]);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedTeamIds(filteredTeams.map((t) => t.id));
    } else {
      setSelectedTeamIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedTeamIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName || !newInstitution) return;

    tabulaStore.addTeam({
      eventId: selectedEventId,
      name: newTeamName,
      institution: newInstitution,
      category: newCategory,
      speakers: [],
    });

    setNewTeamName('');
    setNewInstitution('');
    setShowAddModal(false);
  };

  const filteredTeams = teams.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.institution.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-[#E5E4E8] rounded-md p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#33323A]">Team Roster & Institutions</h1>
          <p className="text-xs text-[#74727C] mt-1">
            Registered debate teams, category allocations, and institutional affiliations.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={selectedEventId}
            onChange={handleEventChange}
            className="h-9 px-3 bg-[#F5F5F6] border border-[#E5E4E8] rounded-md text-xs font-semibold text-[#33323A] focus:outline-none focus:border-[#3F6FD9]"
          >
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 bg-[#E51B4B] hover:bg-[#CC1641] text-white text-xs font-medium rounded-md flex items-center space-x-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register Team</span>
          </button>
        </div>
      </div>

      {/* Search & Bulk Bar */}
      <div className="bg-white border border-[#E5E4E8] rounded-md p-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 text-[#74727C] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search teams or institution..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#F5F5F6] pl-8 pr-3 py-1.5 rounded-md border border-[#E5E4E8] text-xs focus:outline-none focus:border-[#3F6FD9]"
            />
          </div>
        </div>

        {selectedTeamIds.length > 0 && (
          <div className="flex items-center space-x-2 bg-[#FAFAFB] px-3 py-1.5 border border-[#E5E4E8] rounded-md">
            <span className="font-semibold text-[#33323A]">
              {selectedTeamIds.length} Selected
            </span>
            <button
              onClick={() => {
                alert(`Exporting ${selectedTeamIds.length} selected team records...`);
              }}
              className="px-2 py-1 bg-white border border-[#E5E4E8] hover:bg-[#F5F5F6] text-[#33323A] rounded font-medium"
            >
              Export Selected
            </button>
          </div>
        )}
      </div>

      {/* Teams Table */}
      <div className="bg-white border border-[#E5E4E8] rounded-md overflow-hidden">
        <table className="tabula-table">
          <thead>
            <tr>
              <th className="w-10 text-center">
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={
                    filteredTeams.length > 0 &&
                    selectedTeamIds.length === filteredTeams.length
                  }
                />
              </th>
              <th>Team Name</th>
              <th>Institution</th>
              <th>Category</th>
              <th className="text-center">Wins</th>
              <th className="text-center">Speaker Points</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredTeams.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-[#74727C]">
                  No teams registered for this competition event.
                </td>
              </tr>
            ) : (
              filteredTeams.map((team) => (
                <tr key={team.id}>
                  <td className="text-center">
                    <input
                      type="checkbox"
                      checked={selectedTeamIds.includes(team.id)}
                      onChange={() => handleToggleSelect(team.id)}
                    />
                  </td>
                  <td className="font-semibold text-[#33323A]">{team.name}</td>
                  <td className="text-[#74727C]">{team.institution}</td>
                  <td className="text-[#74727C]">{team.category}</td>
                  <td className="text-center font-semibold text-[#36A269]">{team.wins}</td>
                  <td className="text-center font-medium text-[#33323A]">{team.speakerPoints}</td>
                  <td>
                    <StatusBadge status={team.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Team Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E4E8] rounded-md p-6 max-w-md w-full space-y-4">
            <h2 className="text-base font-semibold text-[#33323A]">Register New Debate Team</h2>
            <form onSubmit={handleCreateTeam} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-[#33323A] mb-1">Team Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kenyatta Alpha"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="w-full h-9 px-3 bg-[#F5F5F6] border border-[#E5E4E8] rounded-md text-[#33323A]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#33323A] mb-1">Institution</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kenyatta University"
                  value={newInstitution}
                  onChange={(e) => setNewInstitution(e.target.value)}
                  className="w-full h-9 px-3 bg-[#F5F5F6] border border-[#E5E4E8] rounded-md text-[#33323A]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#33323A] mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as CategoryType)}
                  className="w-full h-9 px-3 bg-[#F5F5F6] border border-[#E5E4E8] rounded-md text-[#33323A]"
                >
                  <option value="Open">Open</option>
                  <option value="ESL">ESL</option>
                  <option value="EFL">EFL</option>
                  <option value="Novice">Novice</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 bg-white border border-[#E5E4E8] text-[#33323A] font-medium rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-[#E51B4B] hover:bg-[#CC1641] text-white font-medium rounded-md"
                >
                  Save Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
