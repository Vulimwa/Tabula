import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Calendar } from 'lucide-react';
import { tabulaStore } from '../lib/store';
import { DebateFormat, EventStatus } from '../types';
import { useToast } from '../components/common/Toast';

export const CreateEventPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [format, setFormat] = useState<DebateFormat>('British Parliamentary');
  const [status, setStatus] = useState<EventStatus>('Upcoming');
  const [startDate, setStartDate] = useState('2026-09-01');
  const [endDate, setEndDate] = useState('2026-09-05');
  const [venue, setVenue] = useState('');
  const [roundsCount, setRoundsCount] = useState(5);
  const [maxSpeakersPerTeam, setMaxSpeakersPerTeam] = useState(2);
  const [scoringSystem, setScoringSystem] = useState('Standard 100-Point BP Scale');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !venue) {
      toast.error('Please fill in the required competition event fields.');
      return;
    }

    const newEvent = tabulaStore.addEvent({
      name,
      description,
      format,
      status,
      startDate,
      endDate,
      venue,
      roundsCount: Number(roundsCount),
      maxSpeakersPerTeam: Number(maxSpeakersPerTeam),
      scoringSystem,
    });

    // Create default preliminary rounds
    for (let r = 1; r <= Number(roundsCount); r++) {
      tabulaStore.addRound({
        eventId: newEvent.id,
        roundNumber: r,
        name: `Round ${r}`,
        motion: `Motion for Round ${r} to be announced by motion committee.`,
        startTime: `${startDate}T09:00:00Z`,
        status: r === 1 ? 'Pairings Released' : 'Draft',
        roomsCount: 4,
      });
    }

    toast.success(`Event "${name}" created successfully!`);
    navigate(`/events/${newEvent.id}`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/events')}
          className="flex items-center space-x-1.5 text-xs text-[#74727C] hover:text-[#33323A]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Events</span>
        </button>
        <span className="text-xs text-[#74727C]">New Event Setup Wizard</span>
      </div>

      <div className="bg-white border border-[#E5E4E8] rounded-md p-6">
        <h1 className="text-lg font-semibold text-[#33323A] mb-1">
          Create Competition Event
        </h1>
        <p className="text-xs text-[#74727C] mb-6">
          Configure debate format, rounds, scoring system, and venue details.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          {/* Event Name */}
          <div>
            <label className="block font-medium text-[#33323A] mb-1">
              Event Title <span className="text-[#D6455D]">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. East Africa University Debate Championship 2026"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 px-3 bg-[#F5F5F6] border border-[#E5E4E8] rounded-md text-[#33323A] focus:bg-white focus:outline-none focus:border-[#3F6FD9]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block font-medium text-[#33323A] mb-1">
              Event Description
            </label>
            <textarea
              rows={3}
              placeholder="Provide event objectives, eligibility rules, and institutional overview..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 bg-[#F5F5F6] border border-[#E5E4E8] rounded-md text-[#33323A] focus:bg-white focus:outline-none focus:border-[#3F6FD9]"
            />
          </div>

          {/* Format & Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-[#33323A] mb-1">
                Competition Format
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as DebateFormat)}
                className="w-full h-10 px-3 bg-[#F5F5F6] border border-[#E5E4E8] rounded-md text-[#33323A] focus:bg-white focus:outline-none focus:border-[#3F6FD9]"
              >
                <option value="British Parliamentary">British Parliamentary (BP)</option>
                <option value="World Schools">World Schools Style</option>
                <option value="Asian Parliamentary">Asian Parliamentary</option>
                <option value="Lincoln-Douglas">Lincoln-Douglas</option>
                <option value="Policy">Policy Debate</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-[#33323A] mb-1">
                Initial Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as EventStatus)}
                className="w-full h-10 px-3 bg-[#F5F5F6] border border-[#E5E4E8] rounded-md text-[#33323A] focus:bg-white focus:outline-none focus:border-[#3F6FD9]"
              >
                <option value="Draft">Draft</option>
                <option value="Upcoming">Upcoming</option>
                <option value="Live">Live</option>
              </select>
            </div>
          </div>

          {/* Dates & Venue */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-medium text-[#33323A] mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-10 px-3 bg-[#F5F5F6] border border-[#E5E4E8] rounded-md text-[#33323A] focus:bg-white focus:outline-none focus:border-[#3F6FD9]"
              />
            </div>
            <div>
              <label className="block font-medium text-[#33323A] mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full h-10 px-3 bg-[#F5F5F6] border border-[#E5E4E8] rounded-md text-[#33323A] focus:bg-white focus:outline-none focus:border-[#3F6FD9]"
              />
            </div>
            <div>
              <label className="block font-medium text-[#33323A] mb-1">
                Venue Location <span className="text-[#D6455D]">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Science Complex, KU"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                className="w-full h-10 px-3 bg-[#F5F5F6] border border-[#E5E4E8] rounded-md text-[#33323A] focus:bg-white focus:outline-none focus:border-[#3F6FD9]"
              />
            </div>
          </div>

          {/* Configuration Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-[#E5E4E8] pt-4">
            <div>
              <label className="block font-medium text-[#33323A] mb-1">Number of Rounds</label>
              <input
                type="number"
                min={1}
                max={12}
                value={roundsCount}
                onChange={(e) => setRoundsCount(Number(e.target.value))}
                className="w-full h-10 px-3 bg-[#F5F5F6] border border-[#E5E4E8] rounded-md text-[#33323A] focus:bg-white focus:outline-none focus:border-[#3F6FD9]"
              />
            </div>
            <div>
              <label className="block font-medium text-[#33323A] mb-1">Max Speakers Per Team</label>
              <input
                type="number"
                min={1}
                max={5}
                value={maxSpeakersPerTeam}
                onChange={(e) => setMaxSpeakersPerTeam(Number(e.target.value))}
                className="w-full h-10 px-3 bg-[#F5F5F6] border border-[#E5E4E8] rounded-md text-[#33323A] focus:bg-white focus:outline-none focus:border-[#3F6FD9]"
              />
            </div>
            <div>
              <label className="block font-medium text-[#33323A] mb-1">Scoring System Rule</label>
              <input
                type="text"
                value={scoringSystem}
                onChange={(e) => setScoringSystem(e.target.value)}
                className="w-full h-10 px-3 bg-[#F5F5F6] border border-[#E5E4E8] rounded-md text-[#33323A] focus:bg-white focus:outline-none focus:border-[#3F6FD9]"
              />
            </div>
          </div>

          <div className="border-t border-[#E5E4E8] pt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/events')}
              className="px-4 py-2 bg-white border border-[#E5E4E8] hover:bg-[#F5F5F6] text-[#33323A] font-medium rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#E51B4B] hover:bg-[#CC1641] text-white font-medium rounded-md flex items-center space-x-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save & Initialize Event</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
