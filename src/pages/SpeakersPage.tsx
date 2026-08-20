import React, { useState, useEffect } from "react";
import { Search, Plus } from "lucide-react";
import { tabulaStore } from "../lib/store";

export const SpeakersPage: React.FC = () => {
  const events = tabulaStore.getEvents();
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id || "");
  const [speakers, setSpeakers] = useState(
    tabulaStore.getSpeakers(selectedEventId),
  );
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [institution, setInstitution] = useState("");

  useEffect(() => {
    const unsubscribe = tabulaStore.subscribe(() => {
      setSpeakers(tabulaStore.getSpeakers(selectedEventId));
    });
    return unsubscribe;
  }, [selectedEventId]);

  const handleAddSpeaker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !institution) return;

    tabulaStore.addSpeaker({
      eventId: selectedEventId,
      name,
      email,
      institution,
      category: "Open",
    });

    setName("");
    setEmail("");
    setInstitution("");
    setShowAddModal(false);
  };

  const filtered = speakers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.institution.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#E5E4E8] rounded-md p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#33323A]">
            Speakers Directory
          </h1>
          <p className="text-xs text-[#74727C] mt-1">
            Registered debaters, team associations, and individual speaker
            scores.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={selectedEventId}
            onChange={(e) => {
              setSelectedEventId(e.target.value);
              setSpeakers(tabulaStore.getSpeakers(e.target.value));
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
            <span>Add Speaker</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-[#E5E4E8] rounded-md p-4 flex items-center justify-between text-xs">
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-[#74727C] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search speaker or institution..."
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
              <th>Rank</th>
              <th>Speaker Name</th>
              <th>Email</th>
              <th>Team</th>
              <th>Institution</th>
              <th>Category</th>
              <th className="text-center">Average Score</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-[#74727C]">
                  No debater records found.
                </td>
              </tr>
            ) : (
              filtered.map((s) => (
                <tr key={s.id}>
                  <td className="font-bold text-[#33323A]">#{s.rank}</td>
                  <td className="font-semibold text-[#33323A]">{s.name}</td>
                  <td className="text-[#74727C] text-xs">{s.email || "-"}</td>
                  <td className="text-[#74727C]">
                    {s.teamName || "Independent"}
                  </td>
                  <td className="text-[#74727C]">{s.institution}</td>
                  <td className="text-[#74727C]">{s.category}</td>
                  <td className="text-center font-bold text-[#3F6FD9]">
                    {s.averageScore}
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
            <h2 className="text-base font-semibold text-[#33323A]">
              Add Debater / Speaker
            </h2>
            <form onSubmit={handleAddSpeaker} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-[#33323A] mb-1">
                  Speaker Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kevin Mutua"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-9 px-3 bg-[#F5F5F6] border border-[#E5E4E8] rounded-md text-[#33323A]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#33323A] mb-1">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="e.g. k.mutua@ku.ac.ke"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-9 px-3 bg-[#F5F5F6] border border-[#E5E4E8] rounded-md text-[#33323A]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#33323A] mb-1">
                  Institution
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kenyatta University"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  className="w-full h-9 px-3 bg-[#F5F5F6] border border-[#E5E4E8] rounded-md text-[#33323A]"
                />
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
                  Save Speaker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
