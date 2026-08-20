import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Search, FileSpreadsheet, BarChart3, ExternalLink, Trash2, Edit3, Loader2 } from 'lucide-react';
import { tabulaStore } from '../lib/store';
import { StatusBadge } from '../components/common/StatusBadge';
import { useToast } from '../components/common/Toast';
import { TableSkeleton } from '../components/common/Skeleton';

export const SurveysPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState(tabulaStore.getCurrentUser());
  const [surveys, setSurveys] = useState(tabulaStore.getSurveys());
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function initSurveys() {
      try {
        await tabulaStore.loadSurveysFromApi();
      } catch (e) {
        console.error('Failed to sync surveys from backend:', e);
      } finally {
        setIsLoading(false);
      }
    }
    initSurveys();

    const unsubscribe = tabulaStore.subscribe(() => {
      setUser(tabulaStore.getCurrentUser());
      setSurveys(tabulaStore.getSurveys());
    });
    return unsubscribe;
  }, []);

  const isOrganizer =
    user?.role === 'Super Admin' ||
    user?.role === 'Organization Admin' ||
    user?.role === 'Organizer';

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this survey and its associated response data?')) {
      try {
        tabulaStore.deleteSurvey(id);
        toast.success('Survey deleted successfully from database');
      } catch (e) {
        toast.error('Failed to delete survey');
      }
    }
  };

  const filtered = surveys.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-[#141414] border border-white/10 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="display-type text-2xl text-white uppercase tracking-tight">Survey Intelligence & Research</h1>
          <p className="text-xs text-[#A0A0A0] mt-1">
            Build surveys, evaluate motion balance, capture participant feedback, and analyze open-ended data.
          </p>
        </div>

        {isOrganizer && (
          <button
            onClick={() => navigate('/surveys/new')}
            className="px-4 py-2 bg-[#E2FF00] hover:bg-[#CBE600] text-black text-xs font-black uppercase tracking-wider flex items-center space-x-1.5 self-start sm:self-auto transition-colors"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Create New Survey</span>
          </button>
        )}
      </div>

      <div className="bg-white border border-[#E5E4E8] rounded-md p-4 flex items-center justify-between text-xs">
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-[#74727C] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search surveys by title..."
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
              <th>Survey Title</th>
              <th>Status</th>
              <th className="text-center">Questions</th>
              <th className="text-center">Responses</th>
              <th className="text-center">Completion Rate</th>
              <th className="text-center">Avg Time</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          {isLoading ? (
            <TableSkeleton rows={4} columns={7} />
          ) : (
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-[#74727C]">
                    No surveys created yet.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id}>
                  <td className="font-semibold text-[#33323A]">
                    <span className="block">{s.title}</span>
                    <span className="text-[11px] text-[#74727C] block truncate max-w-md font-normal mt-0.5">
                      {s.description}
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="text-center text-[#33323A] font-medium">{s.questions.length}</td>
                  <td className="text-center font-bold text-[#3F6FD9]">{s.responsesCount}</td>
                  <td className="text-center text-[#36A269] font-medium">{s.completionRate}%</td>
                  <td className="text-center text-[#74727C]">{s.averageTimeMinutes} mins</td>
                  <td className="text-right space-x-2 whitespace-nowrap">
                    {isOrganizer && (
                      <Link
                        to={`/surveys/${s.id}/edit`}
                        className="text-xs text-[#261B3D] hover:underline font-medium inline-flex items-center space-x-1"
                      >
                        <Edit3 className="w-3.5 h-3.5 mr-0.5" />
                        <span>Edit Questions</span>
                      </Link>
                    )}
                    <Link
                      to={`/surveys/${s.id}/analytics`}
                      className="text-xs text-[#3F6FD9] hover:underline font-medium inline-flex items-center space-x-1"
                    >
                      <BarChart3 className="w-3.5 h-3.5 mr-0.5" />
                      <span>Analytics</span>
                    </Link>
                    <Link
                      to={`/s/${s.publicId}`}
                      target="_blank"
                      className="text-xs text-[#74727C] hover:text-[#33323A] inline-flex items-center space-x-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Public Link</span>
                    </Link>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="text-xs text-[#D6455D] hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        )}
        </table>
      </div>
    </div>
  );
};
