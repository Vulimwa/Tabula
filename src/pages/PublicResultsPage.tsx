import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { Trophy, Users, ShieldCheck, Lock } from "lucide-react";
import { tabulaStore } from "../lib/store";

export const PublicResultsPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();

  const event = eventId ? tabulaStore.getEventById(eventId) : undefined;
  const teams = eventId ? tabulaStore.getTeams(eventId) : [];
  const speakers = eventId ? tabulaStore.getSpeakers(eventId) : [];

  const [activeTab, setActiveTab] = useState<"standings" | "speakers">(
    "standings",
  );

  if (!event) {
    return (
      <div className="min-h-screen bg-[#F5F5F6] flex items-center justify-center p-4 font-sans text-[#33323A]">
        <div className="bg-white border border-[#E5E4E8] rounded-md p-8 max-w-md w-full text-center">
          <h1 className="text-base font-semibold text-[#33323A]">
            Tournament Event Not Found
          </h1>
        </div>
      </div>
    );
  }

  if (!event.isResultsPublished) {
    return (
      <div className="min-h-screen bg-[#F5F5F6] flex items-center justify-center p-4 font-sans text-[#33323A]">
        <div className="bg-white border border-[#E5E4E8] rounded-md p-8 max-w-md w-full text-center space-y-3">
          <Lock className="w-8 h-8 text-[#E0A11A] mx-auto" />
          <h1 className="text-lg font-semibold text-[#33323A]">
            Results Currently Restricted
          </h1>
          <p className="text-xs text-[#74727C]">
            Official tournament results for{" "}
            <span className="font-semibold text-[#33323A]">{event.name}</span>{" "}
            have not yet been released by the chief adjudication panel.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F6] py-10 px-4 font-sans text-[#33323A]">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center space-x-2">
            <div className="w-6 h-6 bg-[#E51B4B] rounded flex items-center justify-center font-bold text-white text-xs">
              T
            </div>
            <span className="font-semibold text-xs tracking-widest text-[#261B3D] uppercase">
              TABULA OFFICIAL PUBLISHED STANDINGS
            </span>
          </div>
        </div>

        {/* Event Header Banner */}
        <div className="bg-white border border-[#E5E4E8] rounded-md p-6 text-center space-y-2">
          <span className="inline-block px-2.5 py-1 bg-[#EBF7F0] text-[#247346] text-xs font-semibold rounded border border-[#BDE7CE]">
            OFFICIAL FINAL RESULTS RELEASED
          </span>
          <h1 className="text-xl font-bold text-[#33323A]">{event.name}</h1>
          <p className="text-xs text-[#74727C]">
            Format: {event.format} | Venue: {event.venue} | Dates:{" "}
            {event.startDate} to {event.endDate}
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex justify-center space-x-2 border-b border-[#E5E4E8] pb-1 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("standings")}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === "standings"
                ? "border-[#E51B4B] text-[#E51B4B]"
                : "border-transparent text-[#74727C] hover:text-[#33323A]"
            }`}
          >
            Team Standings & Break
          </button>
          <button
            onClick={() => setActiveTab("speakers")}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === "speakers"
                ? "border-[#E51B4B] text-[#E51B4B]"
                : "border-transparent text-[#74727C] hover:text-[#33323A]"
            }`}
          >
            Speaker Leaderboard
          </button>
        </div>

        {/* Standings Table */}
        {activeTab === "standings" ? (
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
                </tr>
              </thead>
              <tbody>
                {teams.map((t) => (
                  <tr key={t.id}>
                    <td className="text-center font-bold text-[#33323A]">
                      #{t.rank}
                    </td>
                    <td className="font-semibold text-[#33323A]">{t.name}</td>
                    <td className="text-[#74727C]">{t.institution}</td>
                    <td className="text-[#74727C]">{t.category}</td>
                    <td className="text-center font-semibold text-[#36A269]">
                      {t.wins}
                    </td>
                    <td className="text-center font-medium text-[#33323A]">
                      {t.speakerPoints}
                    </td>
                    <td className="text-center font-bold text-[#3F6FD9]">
                      {t.totalPoints}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white border border-[#E5E4E8] rounded-md overflow-hidden">
            <table className="tabula-table">
              <thead>
                <tr>
                  <th className="w-16 text-center">Rank</th>
                  <th>Speaker Name</th>
                  <th>Team</th>
                  <th>Institution</th>
                  <th className="text-center">Average Score</th>
                </tr>
              </thead>
              <tbody>
                {speakers.map((s) => (
                  <tr key={s.id}>
                    <td className="text-center font-bold text-[#33323A]">
                      #{s.rank}
                    </td>
                    <td className="font-semibold text-[#33323A]">{s.name}</td>
                    <td className="text-[#74727C]">{s.teamName || "-"}</td>
                    <td className="text-[#74727C]">{s.institution}</td>
                    <td className="text-center font-bold text-[#3F6FD9]">
                      {s.averageScore}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
