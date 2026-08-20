import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Radio,
  RefreshCw,
  Trophy,
  Lock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { tabulaStore } from "../lib/store";
import { StatusBadge } from "../components/common/StatusBadge";

export const LiveTabulationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const events = tabulaStore.getEvents();
  const selectedEventId = searchParams.get("eventId") || events[0]?.id || "";

  const [eventId, setEventId] = useState(selectedEventId);
  const [event, setEvent] = useState(tabulaStore.getEventById(eventId));
  const [rooms, setRooms] = useState(tabulaStore.getRooms(eventId));
  const [ballots, setBallots] = useState(tabulaStore.getBallots(eventId));
  const currentRound = tabulaStore
    .getRounds(eventId)
    .find((round) => round.roundNumber === event?.currentRound);

  useEffect(() => {
    const unsubscribe = tabulaStore.subscribe(() => {
      setEvent(tabulaStore.getEventById(eventId));
      setRooms(tabulaStore.getRooms(eventId));
      setBallots(tabulaStore.getBallots(eventId));
    });
    return unsubscribe;
  }, [eventId]);

  const handleEventChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setEventId(id);
    setEvent(tabulaStore.getEventById(id));
    setRooms(tabulaStore.getRooms(id));
    setBallots(tabulaStore.getBallots(id));
  };

  const expectedTotalBallots = rooms.reduce(
    (acc, r) => acc + r.expectedBallots,
    0,
  );
  const submittedTotalBallots = ballots.filter((b) => b.isLocked).length;
  const isAllBallotsSubmitted =
    submittedTotalBallots >= expectedTotalBallots && expectedTotalBallots > 0;

  const handleCalculate = () => {
    if (eventId) {
      tabulaStore.recalculateEventStandings(eventId);
      alert(
        "Official standings recalculated server-side using verified ballots.",
      );
      navigate(`/tabulation/standings?eventId=${eventId}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Live Tab Header */}
      <div className="bg-white border border-[#E5E4E8] rounded-md p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Radio className="w-4 h-4 text-[#E51B4B] animate-pulse" />
            <h1 className="text-xl font-semibold text-[#33323A]">
              Live Tabulation Control Center
            </h1>
          </div>
          <p className="text-xs text-[#74727C] mt-1">
            Real-time debate room monitoring, judge ballot progress tracking,
            and score validation.
          </p>
        </div>

        {/* Event Selector Dropdown */}
        <div className="flex items-center space-x-3">
          <label className="text-xs font-medium text-[#74727C]">
            Select Event:
          </label>
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
      </div>

      {/* Progress & Quick Controls */}
      <div className="bg-white border border-[#E5E4E8] rounded-md p-5 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <div>
          <span className="text-xs font-semibold text-[#74727C] uppercase tracking-wider block">
            Ballot Completion Rate
          </span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-bold text-[#33323A]">
              {submittedTotalBallots} / {expectedTotalBallots}
            </span>
            <span className="text-xs text-[#74727C]">ballots locked</span>
          </div>
          <div className="w-full bg-[#F5F5F6] border border-[#E5E4E8] h-2 rounded-full overflow-hidden mt-2">
            <div
              className="bg-[#36A269] h-full transition-all duration-300"
              style={{
                width: `${
                  expectedTotalBallots > 0
                    ? Math.round(
                        (submittedTotalBallots / expectedTotalBallots) * 100,
                      )
                    : 0
                }%`,
              }}
            />
          </div>
        </div>

        <div>
          <span className="text-xs font-semibold text-[#74727C] uppercase tracking-wider block">
            Current Active Round
          </span>
          <span className="text-sm font-semibold text-[#33323A] block mt-1">
            Round {event?.currentRound ?? "-"}:{" "}
            {currentRound?.motion || "No motion configured"}
          </span>
          <span className="text-xs text-[#74727C] block mt-0.5">
            {rooms.length} active rooms
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
          <button
            onClick={handleCalculate}
            className="px-4 py-2 bg-[#E51B4B] hover:bg-[#CC1641] text-white text-xs font-medium rounded-md flex items-center justify-center space-x-1.5 shadow-none"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Calculate Results</span>
          </button>
          <button
            onClick={() => navigate(`/tabulation/results?eventId=${eventId}`)}
            className="px-4 py-2 bg-white border border-[#E5E4E8] hover:bg-[#F5F5F6] text-[#33323A] text-xs font-medium rounded-md text-center"
          >
            Release Control
          </button>
        </div>
      </div>

      {/* Rooms Table */}
      <div className="bg-white border border-[#E5E4E8] rounded-md overflow-hidden">
        <div className="px-5 py-3 border-b border-[#E5E4E8] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#33323A]">
            Debate Room Monitoring Table
          </h2>
          <span className="text-xs text-[#74727C]">
            Server Auto-Sync Active
          </span>
        </div>

        <table className="tabula-table">
          <thead>
            <tr>
              <th>Room Name</th>
              <th>Government Team</th>
              <th>Opposition Team</th>
              <th>Chair / Assigned Adjudicator</th>
              <th>Submitted Ballots</th>
              <th>Room Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rooms.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-[#74727C]">
                  No active rooms configured for this event round.
                </td>
              </tr>
            ) : (
              rooms.map((rm) => (
                <tr key={rm.id}>
                  <td className="font-semibold text-[#33323A]">
                    {rm.roomName}
                  </td>
                  <td className="font-medium text-[#33323A]">
                    {rm.governmentTeamName}
                  </td>
                  <td className="font-medium text-[#33323A]">
                    {rm.oppositionTeamName}
                  </td>
                  <td className="text-[#74727C]">
                    {rm.assignedJudges?.[0]?.name || "-"}
                  </td>
                  <td className="text-[#33323A]">
                    <span className="font-semibold">{rm.submittedBallots}</span>{" "}
                    / {rm.expectedBallots}
                  </td>
                  <td>
                    <StatusBadge status={rm.status} />
                  </td>
                  <td className="text-right">
                    <button
                      onClick={() =>
                        navigate(`/judge/ballot/${rm.id}?eventId=${eventId}`)
                      }
                      className="text-xs text-[#3F6FD9] hover:underline font-medium"
                    >
                      Enter / Review Ballot
                    </button>
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
