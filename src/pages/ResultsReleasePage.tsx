import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Globe, Lock, CheckCircle2, Copy, ExternalLink, ShieldCheck } from 'lucide-react';
import { tabulaStore } from '../lib/store';

export const ResultsReleasePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const events = tabulaStore.getEvents();
  const initialEventId = searchParams.get('eventId') || events[0]?.id || '';

  const [eventId, setEventId] = useState(initialEventId);
  const [event, setEvent] = useState(tabulaStore.getEventById(eventId));
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsubscribe = tabulaStore.subscribe(() => {
      setEvent(tabulaStore.getEventById(eventId));
    });
    return unsubscribe;
  }, [eventId]);

  const handleTogglePublish = () => {
    if (event) {
      const newPublishedState = !event.isResultsPublished;
      tabulaStore.updateEvent(event.id, { isResultsPublished: newPublishedState });
    }
  };

  const publicUrl = `${window.location.origin}/public/results/${eventId}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white border border-[#E5E4E8] rounded-md p-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#33323A]">Results Release Control</h1>
          <p className="text-xs text-[#74727C] mt-1">
            Manage official tournament standing visibility and public dissemination.
          </p>
        </div>

        <select
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
          className="h-9 px-3 bg-[#F5F5F6] border border-[#E5E4E8] rounded-md text-xs font-semibold text-[#33323A] focus:outline-none focus:border-[#3F6FD9]"
        >
          {events.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
      </div>

      {event && (
        <div className="bg-white border border-[#E5E4E8] rounded-md p-6 space-y-6">
          <div className="flex items-start justify-between border-b border-[#E5E4E8] pb-5">
            <div>
              <div className="flex items-center space-x-2">
                <span
                  className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md border ${
                    event.isResultsPublished
                      ? 'bg-[#EBF7F0] text-[#247346] border-[#BDE7CE]'
                      : 'bg-[#FEF8EC] text-[#916508] border-[#F6E1B7]'
                  }`}
                >
                  {event.isResultsPublished ? 'PUBLISHED TO PUBLIC' : 'ORGANIZER ONLY (RESTRICTED)'}
                </span>
              </div>
              <h2 className="text-lg font-semibold text-[#33323A] mt-2">{event.name}</h2>
              <p className="text-xs text-[#74727C] mt-1">Format: {event.format} | Venue: {event.venue}</p>
            </div>

            <button
              onClick={handleTogglePublish}
              className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors ${
                event.isResultsPublished
                  ? 'bg-[#D6455D] hover:bg-[#B83248] text-white'
                  : 'bg-[#36A269] hover:bg-[#2A8253] text-white'
              }`}
            >
              {event.isResultsPublished ? 'Unpublish Official Results' : 'Publish Official Results Now'}
            </button>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-[#33323A] uppercase tracking-wider">
              Public Unauthenticated Results URL
            </h3>
            <p className="text-xs text-[#74727C]">
              When published, anyone with this link can view team standings and speaker leaderboards without requiring a login account.
            </p>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={publicUrl}
                className="flex-1 h-10 px-3 bg-[#F5F5F6] border border-[#E5E4E8] rounded-md text-xs font-mono text-[#33323A]"
              />
              <button
                onClick={copyToClipboard}
                className="h-10 px-4 bg-white border border-[#E5E4E8] hover:bg-[#F5F5F6] text-[#33323A] text-xs font-medium rounded-md flex items-center space-x-1.5"
              >
                <Copy className="w-3.5 h-3.5 text-[#74727C]" />
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>
              <Link
                to={`/public/results/${eventId}`}
                target="_blank"
                className="h-10 px-4 bg-[#261B3D] hover:bg-[#32244F] text-white text-xs font-medium rounded-md flex items-center space-x-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Public Page</span>
              </Link>
            </div>
          </div>

          <div className="bg-[#FAFAFB] border border-[#E5E4E8] rounded-md p-4 text-xs space-y-2">
            <div className="flex items-center space-x-2 text-[#36A269] font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Data Protection & Privacy Guarantee</span>
            </div>
            <p className="text-[#74727C]">
              Public published views strictly expose official team points, ranks, wins, and speaker totals. Private judge comments, internal audit logs, and institutional contact email addresses are strictly filtered out and protected server-side.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
