import React, { useState, useEffect } from 'react';
import { Search, Plus, UserCheck2, CheckCircle2 } from 'lucide-react';
import { tabulaStore } from '../lib/store';
import { StatusBadge } from '../components/common/StatusBadge';

export const JudgesPage: React.FC = () => {
  const events = tabulaStore.getEvents();
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id || '');
  const [judges, setJudges] = useState(tabulaStore.getJudges(selectedEventId));
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [institution, setInstitution] = useState('');
  const [experienceLevel, setExperienceLevel] = useState<'Chair' | 'Panelist' | 'Trainee'>('Chair');
  const [rating, setRating] = useState(8.0);

  useEffect(() => {
    const unsubscribe = tabulaStore.subscribe(() => {
      setJudges(tabulaStore.getJudges(selectedEventId));
    });
    return unsubscribe;
  }, [selectedEventId]);

  const handleAddJudge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    tabulaStore.addJudge({
      eventId: selectedEventId,
      name,
      email,
      institution,
      experienceLevel,
      rating: Number(rating),
    });

    setName('');
    setEmail('');
    setInstitution('');
    setShowAddModal(false);
  };

  const filtered = judges.filter(
    (j) =>
      j.name.toLowerCase().includes(search.toLowerCase()) ||
      j.institution.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#E5E4E8] rounded-md p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#33323A]">Adjudicator & Judge Management</h1>
          <p className="text-xs text-[#74727C] mt-1">
            Judge accreditation ratings, round assignment tracking, and ballot submission status.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={selectedEventId}
            onChange={(e) => {
              setSelectedEventId(e.target.value);
              setJudges(tabulaStore.getJudges(e.target.value));
            }}
            className="h-9 px-3 bg-[#F5F5F6] border border-[#E5E4E8] rounded-md text-xs font-semibold text-[#33323A]"
          >
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 bg-[#E51B4B] text-white text-xs font-medium rounded-md flex items-center space-x-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Accredit Judge</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-[#E5E4E8] rounded-md p-4 flex items-center justify-between text-xs">
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-[#74727C] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search judge or institution..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#F5F5F6] pl-8 pr-3 py-1.5 rounded-md border border-[#E5E4E8] text-xs focus:outline-none focus:border-[#3F6FD9]"
          />
        </div>
      </div>

      <div className="bg-white border border-[#E5E4E8] rounded-md overflow-hidden">
        <table className="tabula-table">
          <thead>
            <tr>
              <th>Adjudicator Name</th>
              <th>Email</th>
              <th>Institution</th>
              <th>Experience Role</th>
              <th className="text-center">Rating</th>
              <th className="text-center">Rounds Assigned</th>
              <th className="text-center">Ballots Submitted</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-[#74727C]">
                  No adjudicators registered for this tournament.
                </td>
              </tr>
            ) : (
              filtered.map((j) => (
                <tr key={j.id}>
                  <td className="font-semibold text-[#33323A]">{j.name}</td>
                  <td className="text-[#74727C] text-xs">{j.email}</td>
                  <td className="text-[#74727C]">{j.institution}</td>
                  <td className="text-[#33323A] font-medium">{j.experienceLevel}</td>
                  <td className="text-center font-bold text-[#3F6FD9]">{j.rating}</td>
                  <td className="text-center font-semibold text-[#33323A]">{j.assignedRounds}</td>
                  <td className="text-center font-semibold text-[#36A269]">{j.ballotsSubmitted}</td>
                  <td>
                    <StatusBadge status={j.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E4E8] rounded-md p-6 max-w-md w-full space-y-4">
            <h2 className="text-base font-semibold text-[#33323A]">Accredit New Adjudicator</h2>
            <form onSubmit={handleAddJudge} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-[#33323A] mb-1">Judge Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Mercy Karanja"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-9 px-3 bg-[#F5F5F6] border border-[#E5E4E8] rounded-md text-[#33323A]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#33323A] mb-1">Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. m.karanja@ku.ac.ke"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-9 px-3 bg-[#F5F5F6] border border-[#E5E4E8] rounded-md text-[#33323A]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#33323A] mb-1">Institution</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kenyatta University"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  className="w-full h-9 px-3 bg-[#F5F5F6] border border-[#E5E4E8] rounded-md text-[#33323A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#33323A] mb-1">Role</label>
                  <select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value as any)}
                    className="w-full h-9 px-3 bg-[#F5F5F6] border border-[#E5E4E8] rounded-md text-[#33323A]"
                  >
                    <option value="Chair">Chair</option>
                    <option value="Panelist">Panelist</option>
                    <option value="Trainee">Trainee</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[#33323A] mb-1">Rating (1-10)</label>
                  <input
                    type="number"
                    step="0.1"
                    min={1}
                    max={10}
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="w-full h-9 px-3 bg-[#F5F5F6] border border-[#E5E4E8] rounded-md text-[#33323A]"
                  />
                </div>
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
                  className="px-3.5 py-1.5 bg-[#E51B4B] text-white font-medium rounded-md"
                >
                  Accredit Judge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
