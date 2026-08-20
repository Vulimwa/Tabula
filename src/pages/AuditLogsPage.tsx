import React, { useState, useEffect } from 'react';
import { Search, History, Download, ShieldCheck } from 'lucide-react';
import { tabulaStore } from '../lib/store';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState(tabulaStore.getAuditLogs());
  const [search, setSearch] = useState('');

  useEffect(() => {
    const unsubscribe = tabulaStore.subscribe(() => {
      setLogs(tabulaStore.getAuditLogs());
    });
    return unsubscribe;
  }, []);

  const filtered = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.details.toLowerCase().includes(search.toLowerCase()) ||
      l.actorEmail.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#E5E4E8] rounded-md p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#33323A]">System Security & Audit Log</h1>
          <p className="text-xs text-[#74727C] mt-1">
            Immutable audit record of ballot submissions, official standings calculations, and survey responses.
          </p>
        </div>

        <button
          onClick={() => alert('Exporting security audit log to JSON...')}
          className="px-3.5 py-2 bg-white border border-[#E5E4E8] hover:bg-[#F5F5F6] text-[#33323A] text-xs font-medium rounded-md flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-[#74727C]" />
          <span>Export Audit Log</span>
        </button>
      </div>

      <div className="bg-white border border-[#E5E4E8] rounded-md p-4 flex items-center justify-between text-xs">
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-[#74727C] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search action or email..."
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
              <th>Timestamp</th>
              <th>Action Trigger</th>
              <th>Description / Details</th>
              <th>Actor Email</th>
              <th>Actor Role</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-[#74727C]">
                  No audit log entries recorded.
                </td>
              </tr>
            ) : (
              filtered.map((log) => (
                <tr key={log.id}>
                  <td className="text-[#74727C] text-xs font-mono whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="font-semibold text-[#33323A]">{log.action}</td>
                  <td className="text-[#33323A]">{log.details}</td>
                  <td className="text-[#74727C] text-xs">{log.actorEmail}</td>
                  <td>
                    <span className="px-2 py-0.5 bg-[#F5F5F6] text-[#33323A] text-[11px] font-medium rounded border border-[#E5E4E8]">
                      {log.actorRole}
                    </span>
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
