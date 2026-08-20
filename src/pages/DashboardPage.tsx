import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Calendar,
  FileSpreadsheet,
  Trophy,
  Users,
  Radio,
  ArrowRight,
  Clock,
  CheckCircle2,
  Plus,
} from "lucide-react";
import { tabulaStore } from "../lib/store";
import { MetricBlock } from "../components/common/MetricBlock";
import { StatusBadge } from "../components/common/StatusBadge";

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(tabulaStore.getCurrentUser());
  const [org, setOrg] = useState(tabulaStore.getOrganization());
  const [events, setEvents] = useState(tabulaStore.getEvents());
  const [surveys, setSurveys] = useState(tabulaStore.getSurveys());
  const [auditLogs, setAuditLogs] = useState(tabulaStore.getAuditLogs());
  const [ballots, setBallots] = useState(tabulaStore.getBallots());

  useEffect(() => {
    const unsubscribe = tabulaStore.subscribe(() => {
      setUser(tabulaStore.getCurrentUser());
      setOrg(tabulaStore.getOrganization());
      setEvents(tabulaStore.getEvents());
      setSurveys(tabulaStore.getSurveys());
      setAuditLogs(tabulaStore.getAuditLogs());
      setBallots(tabulaStore.getBallots());
    });
    return unsubscribe;
  }, []);

  const activeEvents = events.filter(
    (e) => e.status === "Live" || e.status === "Upcoming",
  );
  const liveEvents = events.filter((e) => e.status === "Live");
  const totalParticipants = events.reduce(
    (acc, e) => acc + (e.speakersCount || 0) + (e.teamsCount || 0) * 2,
    0,
  );
  const totalSurveyResponses = surveys.reduce(
    (acc, s) => acc + (s.responsesCount || 0),
    0,
  );
  const liveEvent = events.find((event) => event.status === "Live");
  const liveRound = liveEvent
    ? tabulaStore
        .getRounds(liveEvent.id)
        .find((round) => round.roundNumber === liveEvent.currentRound)
    : undefined;
  const liveRooms = liveEvent ? tabulaStore.getRooms(liveEvent.id) : [];
  const liveBallots = liveEvent ? tabulaStore.getBallots(liveEvent.id) : [];

  const isOrganizer =
    user?.role === "Super Admin" ||
    user?.role === "Organization Admin" ||
    user?.role === "Organizer";

  return (
    <div className="space-y-6">
      {/* Top Greeting & Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-[#141414] p-6 border border-white/10">
        <div>
          <span className="micro-label block text-[#888888]">
            COMMAND CENTER
          </span>
          <h1 className="display-type text-3xl md:text-4xl text-white uppercase tracking-tight mt-0.5">
            WELCOME BACK, {user.fullName}
          </h1>
          <p className="text-xs text-[#A0A0A0] mt-1 font-mono">
            {org.name} | SYSTEM OVERVIEW & TOURNAMENT TELEMETRY
          </p>
        </div>

        {isOrganizer && (
          <div className="mt-4 md:mt-0 flex items-center space-x-3">
            <button
              onClick={() => navigate("/events/new")}
              className="flex items-center space-x-1.5 bg-[#E2FF00] hover:bg-[#CBE600] text-black px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-colors"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>CREATE EVENT</span>
            </button>
            <button
              onClick={() => navigate("/surveys/new")}
              className="flex items-center space-x-1.5 bg-[#1C1C1C] border border-white/20 hover:bg-[#252525] text-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#E2FF00]" />
              <span>CREATE SURVEY</span>
            </button>
          </div>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricBlock
          title="Active Events"
          value={liveEvents.length}
          subtitle="Currently running tournaments"
          icon={<Radio className="w-4 h-4 text-[#E2FF00]" />}
        />
        <MetricBlock
          title="Upcoming Events"
          value={events.filter((e) => e.status === "Upcoming").length}
          subtitle="Scheduled tournaments"
          icon={<Calendar className="w-4 h-4 text-[#3F6FD9]" />}
        />
        <MetricBlock
          title="Registered Participants"
          value={totalParticipants}
          subtitle="Debaters & adjudicators"
          icon={<Users className="w-4 h-4 text-[#E2FF00]" />}
        />
        <MetricBlock
          title="Pending Ballots"
          value={ballots.filter((ballot) => !ballot.isLocked).length}
          subtitle="Awaiting judge submission"
          icon={<Clock className="w-4 h-4 text-[#FFB800]" />}
        />
        <MetricBlock
          title="Survey Responses"
          value={totalSurveyResponses}
          subtitle="Across active surveys"
          icon={<FileSpreadsheet className="w-4 h-4 text-[#3F6FD9]" />}
        />
      </div>

      {/* Active Events Data Table */}
      <div className="bg-[#141414] border border-white/10 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#1A1A1A]">
          <div>
            <span className="micro-label block">TOURNAMENTS</span>
            <h2 className="display-type text-xl text-white uppercase tracking-tight">
              ACTIVE & SCHEDULED COMPETITIONS
            </h2>
          </div>
          <Link
            to="/events"
            className="text-xs text-[#E2FF00] hover:underline font-bold uppercase tracking-wider flex items-center space-x-1"
          >
            <span>VIEW ALL EVENTS</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="tabula-table">
            <thead>
              <tr>
                <th>Event Name</th>
                <th>Format</th>
                <th>Dates</th>
                <th>Teams</th>
                <th>Speakers</th>
                <th>Status</th>
                <th>Progress</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((evt) => (
                <tr key={evt.id}>
                  <td className="font-bold text-white uppercase text-xs">
                    <Link
                      to={`/events/${evt.id}`}
                      className="hover:text-[#E2FF00] transition-colors"
                    >
                      {evt.name}
                    </Link>
                  </td>
                  <td className="text-[#A0A0A0] font-mono text-xs">
                    {evt.format}
                  </td>
                  <td className="text-[#A0A0A0] whitespace-nowrap font-mono text-xs">
                    {evt.startDate} to {evt.endDate}
                  </td>
                  <td className="text-white font-bold font-mono">
                    {evt.teamsCount}
                  </td>
                  <td className="text-white font-bold font-mono">
                    {evt.speakersCount}
                  </td>
                  <td>
                    <StatusBadge status={evt.status} />
                  </td>
                  <td>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-[#0A0A0A] h-1.5 overflow-hidden border border-white/10">
                        <div
                          className="bg-[#E2FF00] h-full"
                          style={{
                            width: `${Math.round((evt.currentRound / evt.roundsCount) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-mono text-[#A0A0A0]">
                        R{evt.currentRound}/{evt.roundsCount}
                      </span>
                    </div>
                  </td>
                  <td className="text-right">
                    <button
                      onClick={() => navigate(`/events/${evt.id}`)}
                      className="text-xs text-[#E2FF00] hover:underline font-bold uppercase tracking-wider"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid: Live Tabulation & Recent Activity */}
      <div
        className={`grid grid-cols-1 ${isOrganizer ? "lg:grid-cols-2" : ""} gap-6`}
      >
        {/* Live Tabulation Widget */}
        <div className="bg-[#141414] border border-white/10 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center space-x-2.5">
                <Radio className="w-4 h-4 text-[#E2FF00] animate-pulse" />
                <div>
                  <span className="micro-label block">TELEMETRY</span>
                  <h3 className="display-type text-lg text-white uppercase">
                    LIVE TABULATION FEED
                  </h3>
                </div>
              </div>
              <StatusBadge status="Live" />
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="p-4 bg-[#1A1A1A] border border-white/10 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block uppercase tracking-wide">
                    {liveEvent?.name || "No live event"}
                  </span>
                  <span className="text-[#A0A0A0] text-xs block mt-0.5 font-mono">
                    Round {liveEvent?.currentRound ?? "-"}:{" "}
                    {liveRound?.motion || "No motion configured"}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-[#E2FF00] block font-mono">
                    {liveBallots.filter((ballot) => ballot.isLocked).length} /{" "}
                    {liveRooms.reduce(
                      (total, room) => total + room.expectedBallots,
                      0,
                    )}{" "}
                    BALLOTS
                  </span>
                  <span className="micro-label block text-[#888]">
                    EXPECTED: {liveRooms.length} ROOMS
                  </span>
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                <div className="flex justify-between items-center text-[#A0A0A0] text-xs">
                  <span>Hall A (Science Complex)</span>
                  <span className="text-[#FFB800] font-mono font-bold">
                    Awaiting Ballot (Chair: James Otieno)
                  </span>
                </div>
                <div className="flex justify-between items-center text-[#A0A0A0] text-xs">
                  <span>Hall B (Law Block)</span>
                  <span className="text-[#E2FF00] font-mono font-bold flex items-center">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Verified & Locked
                  </span>
                </div>
              </div>
            </div>
          </div>

          {isOrganizer && (
            <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
              <button
                onClick={() => navigate("/tabulation/live")}
                className="text-xs text-[#E2FF00] hover:underline font-bold uppercase tracking-wider"
              >
                Open Live Tabulation Control Panel &rarr;
              </button>
            </div>
          )}
        </div>

        {/* Recent Activity Log Feed (Organizers only) */}
        {isOrganizer && (
          <div className="bg-[#141414] border border-white/10 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div>
                  <span className="micro-label block">AUDIT TRAIL</span>
                  <h3 className="display-type text-lg text-white uppercase">
                    RECENT SYSTEM ACTIVITY
                  </h3>
                </div>
                <Link
                  to="/admin/audit-logs"
                  className="text-xs text-[#888888] hover:text-white micro-label"
                >
                  Full Audit Log
                </Link>
              </div>

              <div className="mt-3 divide-y divide-white/5 max-h-[220px] overflow-y-auto pr-1">
                {auditLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="py-3 text-xs">
                    <div className="flex items-center justify-between text-white">
                      <span className="font-bold uppercase tracking-wide text-xs">
                        {log.action}
                      </span>
                      <span className="text-[10px] font-mono text-[#888]">
                        {new Date(log.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-[#A0A0A0] text-[11px] mt-0.5">
                      {log.details}
                    </p>
                    <span className="text-[10px] text-[#777] font-mono block mt-1">
                      Actor: {log.actorEmail} ({log.actorRole})
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/10 text-right">
              <Link
                to="/admin/audit-logs"
                className="text-xs text-[#E2FF00] hover:underline font-bold uppercase tracking-wider"
              >
                View Complete Audit Trail &rarr;
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
