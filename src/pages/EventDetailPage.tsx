import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Calendar,
  Users,
  Trophy,
  Radio,
  FileSpreadsheet,
  Settings,
  Plus,
  BarChart3,
  CheckCircle2,
  Lock,
  Globe,
  UserCheck,
  ChevronRight,
} from 'lucide-react';
import { tabulaStore } from '../lib/store';
import { StatusBadge } from '../components/common/StatusBadge';
import { MetricBlock } from '../components/common/MetricBlock';

export const EventDetailPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(tabulaStore.getCurrentUser());
  const [event, setEvent] = useState(tabulaStore.getEventById(eventId || ''));
  const [rounds, setRounds] = useState(tabulaStore.getRounds(eventId));
  const [teams, setTeams] = useState(tabulaStore.getTeams(eventId));
  const [speakers, setSpeakers] = useState(tabulaStore.getSpeakers(eventId));
  const [judges, setJudges] = useState(tabulaStore.getJudges(eventId));
  const [rooms, setRooms] = useState(tabulaStore.getRooms(eventId));
  const [ballots, setBallots] = useState(tabulaStore.getBallots(eventId));

  const [activeTab, setActiveTab] = useState<
    'overview' | 'rounds' | 'teams' | 'speakers' | 'judges' | 'rooms' | 'tabulation' | 'settings'
  >('overview');

  useEffect(() => {
    const unsubscribe = tabulaStore.subscribe(() => {
      setCurrentUser(tabulaStore.getCurrentUser());
      if (eventId) {
        setEvent(tabulaStore.getEventById(eventId));
        setRounds(tabulaStore.getRounds(eventId));
        setTeams(tabulaStore.getTeams(eventId));
        setSpeakers(tabulaStore.getSpeakers(eventId));
        setJudges(tabulaStore.getJudges(eventId));
        setRooms(tabulaStore.getRooms(eventId));
        setBallots(tabulaStore.getBallots(eventId));
      }
    });
    return unsubscribe;
  }, [eventId]);

  const isOrganizer =
    currentUser?.role === 'Super Admin' ||
    currentUser?.role === 'Organization Admin' ||
    currentUser?.role === 'Organizer';

  if (!event) {
    return (
      <div className="bg-[#141414] border border-white/10 p-8 text-center">
        <h2 className="display-type text-lg text-white">Event Not Found</h2>
        <p className="text-xs text-[#A0A0A0] mt-1">The requested competition event does not exist.</p>
        <button
          onClick={() => navigate('/events')}
          className="mt-4 px-4 py-2 bg-[#E2FF00] text-black text-xs font-black uppercase"
        >
          Return to All Events
        </button>
      </div>
    );
  }

  const availableTabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'rounds', label: `Rounds (${rounds.length})` },
    { id: 'teams', label: `Teams (${teams.length})` },
    { id: 'speakers', label: `Speakers (${speakers.length})` },
    { id: 'judges', label: `Judges (${judges.length})` },
    { id: 'rooms', label: `Rooms (${rooms.length})` },
    ...(isOrganizer
      ? [
          { id: 'tabulation', label: 'Tabulation Control' },
          { id: 'settings', label: 'Settings' },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      {/* Event Header Banner */}
      <div className="bg-[#141414] border border-white/10 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <div className="flex items-center space-x-2">
              <StatusBadge status={event.status} />
              <span className="text-xs text-[#A0A0A0] font-mono">{event.format}</span>
            </div>
            <h1 className="display-type text-2xl text-white uppercase tracking-tight mt-2">{event.name}</h1>
            <p className="text-xs text-[#A0A0A0] mt-1 max-w-2xl">{event.description}</p>
          </div>

          <div className="flex items-center space-x-3 self-start md:self-auto">
            {isOrganizer && (
              <button
                onClick={() => navigate(`/tabulation/live?eventId=${event.id}`)}
                className="px-3.5 py-2 bg-[#1C1C1C] border border-white/20 hover:bg-[#252525] text-white text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-colors"
              >
                <Radio className="w-3.5 h-3.5 text-[#E2FF00]" />
                <span>Live Tab</span>
              </button>
            )}
            <button
              onClick={() => navigate(`/tabulation/standings?eventId=${event.id}`)}
              className="px-3.5 py-2 bg-[#E2FF00] hover:bg-[#CBE600] text-black text-xs font-black uppercase tracking-wider flex items-center space-x-1.5 transition-colors"
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Standings</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-1 overflow-x-auto pt-4 text-xs font-medium border-b border-transparent">
          {availableTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap uppercase tracking-wider font-bold ${
                activeTab === tab.id
                  ? 'border-[#E2FF00] text-[#E2FF00]'
                  : 'border-transparent text-[#888888] hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricBlock title="Teams Registered" value={teams.length} icon={<Users className="w-4 h-4 text-[#3F6FD9]" />} />
            <MetricBlock title="Speakers Ranked" value={speakers.length} icon={<UserCheck className="w-4 h-4 text-[#36A269]" />} />
            <MetricBlock title="Judges Roster" value={judges.length} icon={<Users className="w-4 h-4 text-[#5E82D6]" />} />
            <MetricBlock title="Ballots Locked" value={ballots.filter((b) => b.isLocked).length} icon={<CheckCircle2 className="w-4 h-4 text-[#36A269]" />} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-[#E5E4E8] rounded-md p-5">
              <h3 className="text-sm font-semibold text-[#33323A] mb-3">Event Metadata & Configuration</h3>
              <dl className="divide-y divide-[#E5E4E8] text-xs">
                <div className="py-2 flex justify-between">
                  <dt className="text-[#74727C]">Format:</dt>
                  <dd className="font-medium text-[#33323A]">{event.format}</dd>
                </div>
                <div className="py-2 flex justify-between">
                  <dt className="text-[#74727C]">Dates:</dt>
                  <dd className="font-medium text-[#33323A]">{event.startDate} to {event.endDate}</dd>
                </div>
                <div className="py-2 flex justify-between">
                  <dt className="text-[#74727C]">Venue:</dt>
                  <dd className="font-medium text-[#33323A]">{event.venue}</dd>
                </div>
                <div className="py-2 flex justify-between">
                  <dt className="text-[#74727C]">Scoring System:</dt>
                  <dd className="font-medium text-[#33323A]">{event.scoringSystem}</dd>
                </div>
                <div className="py-2 flex justify-between">
                  <dt className="text-[#74727C]">Public Results Release:</dt>
                  <dd className="font-medium text-[#33323A]">{event.isResultsPublished ? 'Published' : 'Organizer Only'}</dd>
                </div>
              </dl>
            </div>

            <div className="bg-white border border-[#E5E4E8] rounded-md p-5">
              <h3 className="text-sm font-semibold text-[#33323A] mb-3">Tournament Rounds Schedule</h3>
              <div className="space-y-2 text-xs">
                {rounds.map((rnd) => (
                  <div key={rnd.id} className="p-3 bg-[#FAFAFB] border border-[#E5E4E8] rounded-md flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-[#33323A] block">{rnd.name}</span>
                      <span className="text-[#74727C] text-[11px] block mt-0.5">{rnd.motion}</span>
                    </div>
                    <StatusBadge status={rnd.status} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'rounds' && (
        <div className="bg-white border border-[#E5E4E8] rounded-md p-5 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-[#E5E4E8]">
            <h3 className="text-sm font-semibold text-[#33323A]">Debate Rounds List</h3>
            <button
              onClick={() => {
                tabulaStore.addRound({
                  eventId: event.id,
                  roundNumber: rounds.length + 1,
                  name: `Round ${rounds.length + 1}`,
                  motion: 'This House believes that carbon border adjustment mechanisms are justified in regional trade agreements.',
                  startTime: new Date().toISOString(),
                  status: 'Draft',
                  roomsCount: 4,
                });
              }}
              className="px-3 py-1.5 bg-[#E51B4B] hover:bg-[#CC1641] text-white text-xs font-medium rounded-md flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Round</span>
            </button>
          </div>

          <table className="tabula-table">
            <thead>
              <tr>
                <th>Round</th>
                <th>Motion</th>
                <th>Start Time</th>
                <th>Rooms</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rounds.map((r) => (
                <tr key={r.id}>
                  <td className="font-medium text-[#33323A]">{r.name}</td>
                  <td className="text-[#33323A] max-w-md">{r.motion}</td>
                  <td className="text-[#74727C] text-xs">{new Date(r.startTime).toLocaleString()}</td>
                  <td className="text-[#33323A]">{r.roomsCount} Rooms</td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'teams' && (
        <div className="bg-white border border-[#E5E4E8] rounded-md p-5 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-[#E5E4E8]">
            <h3 className="text-sm font-semibold text-[#33323A]">Registered Teams ({teams.length})</h3>
            <button
              onClick={() => navigate('/people/teams')}
              className="text-xs text-[#3F6FD9] hover:underline font-medium"
            >
              Open Full Team Roster &rarr;
            </button>
          </div>

          <table className="tabula-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Team Name</th>
                <th>Institution</th>
                <th>Category</th>
                <th>Wins</th>
                <th>Points</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((t) => (
                <tr key={t.id}>
                  <td className="font-semibold text-[#33323A]">#{t.rank}</td>
                  <td className="font-medium text-[#33323A]">{t.name}</td>
                  <td className="text-[#74727C]">{t.institution}</td>
                  <td className="text-[#74727C]">{t.category}</td>
                  <td className="text-[#33323A] font-medium">{t.wins}</td>
                  <td className="text-[#33323A]">{t.speakerPoints}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'tabulation' && (
        <div className="bg-white border border-[#E5E4E8] rounded-md p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#E5E4E8]">
            <div>
              <h3 className="text-sm font-semibold text-[#33323A]">Server-Side Deterministic Tabulation Engine</h3>
              <p className="text-xs text-[#74727C] mt-0.5">Trigger official recalculations and verify ballot score locks.</p>
            </div>
            <button
              onClick={() => {
                tabulaStore.recalculateEventStandings(event.id);
                alert('Official competition standings recalculated server-side.');
              }}
              className="px-4 py-2 bg-[#E51B4B] hover:bg-[#CC1641] text-white text-xs font-medium rounded-md"
            >
              Run Official Calculation
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-[#FAFAFB] border border-[#E5E4E8] rounded-md">
              <span className="font-semibold text-[#33323A] block mb-1">Official Results Visibility</span>
              <p className="text-[#74727C] mb-3">Control whether tournament standings are public or restricted to organizers.</p>
              <button
                onClick={() => {
                  tabulaStore.updateEvent(event.id, { isResultsPublished: !event.isResultsPublished });
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-md ${
                  event.isResultsPublished ? 'bg-[#36A269] text-white' : 'bg-[#3F6FD9] text-white'
                }`}
              >
                {event.isResultsPublished ? 'Published to Public (Click to Unpublish)' : 'Publish Official Results'}
              </button>
            </div>

            <div className="p-4 bg-[#FAFAFB] border border-[#E5E4E8] rounded-md">
              <span className="font-semibold text-[#33323A] block mb-1">Public Standings Share Link</span>
              <p className="text-[#74727C] mb-3">Provide public read-only access to published tournament rankings.</p>
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/public/results/${event.id}`}
                className="w-full p-2 bg-white border border-[#E5E4E8] rounded text-[11px] text-[#33323A]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
