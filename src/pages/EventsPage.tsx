import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Search, Plus, Filter, Calendar } from "lucide-react";
import { tabulaStore } from "../lib/store";
import { StatusBadge } from "../components/common/StatusBadge";
import { EventStatus } from "../types";

export const EventsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [user, setUser] = useState(tabulaStore.getCurrentUser());
  const [events, setEvents] = useState(tabulaStore.getEvents());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(
    searchParams.get("filter") || "All",
  );

  useEffect(() => {
    const unsubscribe = tabulaStore.subscribe(() => {
      setUser(tabulaStore.getCurrentUser());
      setEvents(tabulaStore.getEvents());
    });
    return unsubscribe;
  }, []);

  const isOrganizer =
    user?.role === "Super Admin" ||
    user?.role === "Organization Admin" ||
    user?.role === "Organizer";

  const handleFilterChange = (filter: string) => {
    setStatusFilter(filter);
    if (filter === "All") {
      searchParams.delete("filter");
    } else {
      searchParams.set("filter", filter);
    }
    setSearchParams(searchParams);
  };

  const filteredEvents = events.filter((e) => {
    const matchesSearch =
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.venue.toLowerCase().includes(search.toLowerCase()) ||
      e.format.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#141414] p-5 border border-white/10">
        <div>
          <h1 className="display-type text-2xl text-white uppercase tracking-tight">
            Competition Management
          </h1>
          <p className="text-xs text-[#A0A0A0] mt-1">
            Manage debate championships, tournaments, rounds, and judging
            configurations.
          </p>
        </div>
        {isOrganizer && (
          <button
            onClick={() => navigate("/events/new")}
            className="flex items-center space-x-1.5 bg-[#E2FF00] hover:bg-[#CBE600] text-black px-4 py-2 text-xs font-black uppercase tracking-wider transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Create New Event</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#E5E4E8] rounded-md p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 md:pb-0">
          {["All", "Live", "Upcoming", "Completed", "Draft", "Archived"].map(
            (status) => (
              <button
                key={status}
                onClick={() => handleFilterChange(status)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  statusFilter === status
                    ? "bg-[#261B3D] text-white"
                    : "text-[#74727C] hover:bg-[#F5F5F6] hover:text-[#33323A]"
                }`}
              >
                {status}
              </button>
            ),
          )}
        </div>

        {/* Search Box */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-[#74727C] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search events, venue..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#F5F5F6] text-xs text-[#33323A] pl-8 pr-3 py-1.5 rounded-md border border-[#E5E4E8] focus:outline-none focus:border-[#3F6FD9]"
          />
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white border border-[#E5E4E8] rounded-md overflow-hidden">
        <table className="tabula-table">
          <thead>
            <tr>
              <th>Event Name</th>
              <th>Format</th>
              <th>Dates</th>
              <th>Venue</th>
              <th>Rounds</th>
              <th>Teams / Speakers</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEvents.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-[#74727C]">
                  No competition events match the selected criteria.
                </td>
              </tr>
            ) : (
              filteredEvents.map((evt) => (
                <tr key={evt.id}>
                  <td className="font-semibold text-[#33323A]">
                    <Link
                      to={`/events/${evt.id}`}
                      className="hover:text-[#3F6FD9]"
                    >
                      {evt.name}
                    </Link>
                  </td>
                  <td className="text-[#74727C]">{evt.format}</td>
                  <td className="text-[#74727C] text-xs">
                    {evt.startDate} to {evt.endDate}
                  </td>
                  <td className="text-[#74727C] text-xs max-w-[180px] truncate">
                    {evt.venue}
                  </td>
                  <td className="text-[#33323A]">
                    Round {evt.currentRound} / {evt.roundsCount}
                  </td>
                  <td className="text-[#33323A]">
                    {evt.teamsCount} teams ({evt.speakersCount} spks)
                  </td>
                  <td>
                    <StatusBadge status={evt.status} />
                  </td>
                  <td className="text-right space-x-2">
                    <button
                      onClick={() => navigate(`/events/${evt.id}`)}
                      className="text-xs text-[#3F6FD9] hover:underline font-medium"
                    >
                      Open Detail
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
