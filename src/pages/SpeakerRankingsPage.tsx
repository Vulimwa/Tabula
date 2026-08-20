import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Download, UserCheck } from "lucide-react";
import { tabulaStore } from "../lib/store";

export const SpeakerRankingsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const events = tabulaStore.getEvents();
  const initialEventId = searchParams.get("eventId") || events[0]?.id || "";

  const [eventId, setEventId] = useState(initialEventId);
  const [speakers, setSpeakers] = useState(tabulaStore.getSpeakers(eventId));
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  useEffect(() => {
    const unsubscribe = tabulaStore.subscribe(() => {
      setSpeakers(tabulaStore.getSpeakers(eventId));
    });
    return unsubscribe;
  }, [eventId]);

  const handleEventChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setEventId(id);
    setSpeakers(tabulaStore.getSpeakers(id));
  };

  const filteredSpeakers = speakers.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.institution.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      categoryFilter === "All" || s.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#E5E4E8] rounded-md p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#33323A]">
            Speaker Leaderboard & Individual Scores
          </h1>
          <p className="text-xs text-[#74727C] mt-1">
            Individual speaker averages, highest round scores, and overall
            speaker tab rankings.
          </p>
        </div>

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
      </div>

      <div className="bg-white border border-[#E5E4E8] rounded-md p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center space-x-2">
          <span className="font-medium text-[#74727C]">Category Filter:</span>
          {["All", "Open", "ESL", "EFL", "Novice"].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                categoryFilter === cat
                  ? "bg-[#261B3D] text-white"
                  : "bg-[#F5F5F6] text-[#74727C] hover:text-[#33323A]"
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
              <th className="w-16 text-center">Rank</th>
              <th>Speaker Name</th>
              <th>Team Affiliation</th>
              <th>Institution</th>
              <th>Category</th>
              <th className="text-center">Rounds</th>
              <th className="text-center">Highest Score</th>
              <th className="text-center">Average Score</th>
              <th className="text-center">Total Points</th>
            </tr>
          </thead>
          <tbody>
            {filteredSpeakers.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-8 text-[#74727C]">
                  No speaker records available.
                </td>
              </tr>
            ) : (
              filteredSpeakers.map((spk) => (
                <tr key={spk.id}>
                  <td className="text-center font-bold text-[#33323A]">
                    #{spk.rank}
                  </td>
                  <td className="font-semibold text-[#33323A]">{spk.name}</td>
                  <td className="text-[#74727C]">
                    {spk.teamName || "Independent"}
                  </td>
                  <td className="text-[#74727C]">{spk.institution}</td>
                  <td className="text-[#74727C]">{spk.category}</td>
                  <td className="text-center text-[#33323A]">
                    {spk.roundsDebated}
                  </td>
                  <td className="text-center font-medium text-[#36A269]">
                    {spk.highestScore}
                  </td>
                  <td className="text-center font-bold text-[#3F6FD9]">
                    {spk.averageScore}
                  </td>
                  <td className="text-center font-semibold text-[#33323A]">
                    {spk.totalPoints}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
