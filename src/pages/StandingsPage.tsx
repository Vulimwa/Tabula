import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Trophy, Download, Filter, ChevronRight, X } from 'lucide-react';
import { tabulaStore } from '../lib/store';
import { Team } from '../types';

export const StandingsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const events = tabulaStore.getEvents();
  const initialEventId = searchParams.get('eventId') || events[0]?.id || '';

  const [eventId, setEventId] = useState(initialEventId);
  const [teams, setTeams] = useState(tabulaStore.getTeams(eventId));
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  useEffect(() => {
    const unsubscribe = tabulaStore.subscribe(() => {
      setTeams(tabulaStore.getTeams(eventId));
    });
    return unsubscribe;
  }, [eventId]);

  const handleEventChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setEventId(id);
    setTeams(tabulaStore.getTeams(id));
  };

  const filteredTeams = teams.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.institution.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || t.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const exportCSV = () => {
    const headers = ['Rank', 'Team Name', 'Institution', 'Category', 'Wins', 'Speaker Points', 'Total Points'];
    const rows = filteredTeams.map((t) => [
      t.rank,
      `"${t.name}"`,
      `"${t.institution}"`,
      t.category,
      t.wins,
      t.speakerPoints,
      t.totalPoints,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tabula_standings_${eventId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-[#E5E4E8] rounded-md p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#33323A]">Official Competition Standings</h1>
          <p className="text-xs text-[#74727C] mt-1">
            Deterministic rankings derived from verified judge ballots and tie-breaking algorithms.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={eventId}
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
            onClick={exportCSV}
            className="px-3 py-2 bg-white border border-[#E5E4E8] hover:bg-[#F5F5F6] text-[#33323A] text-xs font-medium rounded-md flex items-center space-x-1.5"
          >
            <Download className="w-3.5 h-3.5 text-[#74727C]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white border border-[#E5E4E8] rounded-md p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center space-x-2">
          <span className="font-medium text-[#74727C]">Category Filter:</span>
          {['All', 'Open', 'ESL', 'EFL', 'Novice'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                categoryFilter === cat
                  ? 'bg-[#261B3D] text-white'
                  : 'bg-[#F5F5F6] text-[#74727C] hover:text-[#33323A]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-[#74727C] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search team or institution..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#F5F5F6] pl-8 pr-3 py-1.5 rounded-md border border-[#E5E4E8] text-xs focus:outline-none focus:border-[#3F6FD9]"
          />
        </div>
      </div>

      {/* Standings Table */}
      <div className="bg-white border border-[#E5E4E8] rounded-md overflow-hidden">
        <table className="tabula-table">
          <thead>
            <tr>
              <th className="w-16 text-center">Rank</th>
              <th>Team Name</th>
              <th>Institution</th>
              <th>Category</th>
              <th className="text-center">Wins</th>
              <th className="text-center">Speaker Points</th>
              <th className="text-center">Total Points</th>
              <th className="text-right">Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredTeams.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-[#74727C]">
                  No team standings recorded for this competition.
                </td>
              </tr>
            ) : (
              filteredTeams.map((team) => (
                <tr key={team.id} className="hover:bg-[#F8F8FA] cursor-pointer">
                  <td className="text-center font-bold text-[#33323A]">
                    {team.rank === 1 ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-[#FEF8EC] text-[#E0A11A] border border-[#F6E1B7] rounded-full text-xs">
                        1
                      </span>
                    ) : (
                      `#${team.rank}`
                    )}
                  </td>
                  <td className="font-semibold text-[#33323A]">{team.name}</td>
                  <td className="text-[#74727C]">{team.institution}</td>
                  <td className="text-[#74727C]">{team.category}</td>
                  <td className="text-center font-semibold text-[#36A269]">{team.wins}</td>
                  <td className="text-center font-medium text-[#33323A]">{team.speakerPoints}</td>
                  <td className="text-center font-bold text-[#3F6FD9]">{team.totalPoints}</td>
                  <td className="text-right">
                    <button
                      onClick={() => setSelectedTeam(team)}
                      className="text-xs text-[#3F6FD9] hover:underline font-medium"
                    >
                      Breakdown
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Team Detail Drawer */}
      {selectedTeam && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-end">
          <div className="w-full max-w-md bg-white h-full p-6 space-y-6 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E5E4E8] pb-4">
              <div>
                <span className="text-xs text-[#74727C] font-medium">Rank #{selectedTeam.rank}</span>
                <h2 className="text-lg font-semibold text-[#33323A]">{selectedTeam.name}</h2>
                <p className="text-xs text-[#74727C]">{selectedTeam.institution}</p>
              </div>
              <button
                onClick={() => setSelectedTeam(null)}
                className="p-1 text-[#74727C] hover:text-[#33323A] rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="p-3 bg-[#F5F5F6] border border-[#E5E4E8] rounded-md">
                <span className="text-[#74727C] block">Wins</span>
                <span className="text-lg font-bold text-[#36A269]">{selectedTeam.wins}</span>
              </div>
              <div className="p-3 bg-[#F5F5F6] border border-[#E5E4E8] rounded-md">
                <span className="text-[#74727C] block">Speaker Pts</span>
                <span className="text-lg font-bold text-[#33323A]">{selectedTeam.speakerPoints}</span>
              </div>
              <div className="p-3 bg-[#F5F5F6] border border-[#E5E4E8] rounded-md">
                <span className="text-[#74727C] block">Total Pts</span>
                <span className="text-lg font-bold text-[#3F6FD9]">{selectedTeam.totalPoints}</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-semibold text-[#33323A]">Round-by-Round Breakdown</h3>
              <div className="p-3 bg-[#FAFAFB] border border-[#E5E4E8] rounded-md text-xs space-y-1">
                <div className="flex justify-between text-[#33323A] font-medium">
                  <span>Round 1: Global Corporate Tax</span>
                  <span className="text-[#36A269]">Win (+81.5 spk)</span>
                </div>
                <div className="flex justify-between text-[#33323A] font-medium">
                  <span>Round 2: Climate vs Industry</span>
                  <span className="text-[#36A269]">Win (+81.0 spk)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
