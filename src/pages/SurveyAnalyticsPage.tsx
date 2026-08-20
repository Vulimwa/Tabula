import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Sparkles,
  ArrowLeft,
  Users,
  Clock,
  CheckCircle2,
  FileSpreadsheet,
  TrendingUp,
} from "lucide-react";
import { tabulaStore } from "../lib/store";
import { MetricBlock } from "../components/common/MetricBlock";

export const SurveyAnalyticsPage: React.FC = () => {
  const { surveyId } = useParams<{ surveyId: string }>();
  const navigate = useNavigate();

  const [survey, setSurvey] = useState(
    tabulaStore.getSurveyById(surveyId || ""),
  );
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    if (surveyId) {
      setSurvey(tabulaStore.getSurveyById(surveyId));
    }
  }, [surveyId]);

  const runAiQualitativeAnalysis = async () => {
    if (!survey) return;
    setIsAiLoading(true);
    try {
      const res = await fetch("/api/ai/survey-analytics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(tabulaStore.getApiAuthHeaders() || {}),
        },
        body: JSON.stringify({
          surveyTitle: survey.title,
          responsesCount: survey.responsesCount,
          openEndedAnswers: [
            "Judges gave conflicting advice regarding opening speech timing.",
            "The debate halls were very quiet and conducive for speech delivery.",
            "Some chairs did not enforce the 7-minute point of information rule strictly.",
            "Great championship overall! Hall B microphones were excellent.",
          ],
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAiAnalysis(data.analytics);
      } else {
        alert(data.error || "Failed to generate AI survey analytics.");
      }
    } catch (err) {
      alert("Error connecting to AI Survey Analytics service.");
    } finally {
      setIsAiLoading(false);
    }
  };

  if (!survey) {
    return (
      <div className="bg-white border border-[#E5E4E8] rounded-md p-8 text-center">
        <h2 className="text-base font-semibold text-[#33323A]">
          Survey Not Found
        </h2>
        <button
          onClick={() => navigate("/surveys")}
          className="mt-4 px-3.5 py-2 bg-[#E51B4B] text-white text-xs font-medium rounded-md"
        >
          Return to Surveys
        </button>
      </div>
    );
  }

  // Mock chart data for rating distributions
  const ratingData = [
    { rating: "1 Star", count: 2 },
    { rating: "2 Stars", count: 5 },
    { rating: "3 Stars", count: 12 },
    { rating: "4 Stars", count: 28 },
    { rating: "5 Stars", count: 42 },
  ];

  const roleData = [
    { name: "Debater", value: 52 },
    { name: "Adjudicator", value: 28 },
    { name: "Observer", value: 9 },
  ];

  const COLORS = ["#3F6FD9", "#36A269", "#E0A11A"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-[#E5E4E8] rounded-md p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate("/surveys")}
            className="p-1 text-[#74727C] hover:text-[#33323A]"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-[#33323A]">
              {survey.title} - Intelligence Dashboard
            </h1>
            <p className="text-xs text-[#74727C] mt-0.5">
              {survey.description}
            </p>
          </div>
        </div>

        <button
          onClick={runAiQualitativeAnalysis}
          disabled={isAiLoading}
          className="px-4 py-2 bg-[#261B3D] hover:bg-[#32244F] text-white text-xs font-medium rounded-md flex items-center space-x-2"
        >
          <Sparkles className="w-4 h-4 text-[#E51B4B]" />
          <span>
            {isAiLoading
              ? "Analyzing Feedback..."
              : "Run Gemini Qualitative Synthesis"}
          </span>
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricBlock
          title="Total Responses"
          value={survey.responsesCount}
          icon={<Users className="w-4 h-4 text-[#3F6FD9]" />}
        />
        <MetricBlock
          title="Completion Rate"
          value={`${survey.completionRate}%`}
          icon={<CheckCircle2 className="w-4 h-4 text-[#36A269]" />}
        />
        <MetricBlock
          title="Average Completion Time"
          value={`${survey.averageTimeMinutes} mins`}
          icon={<Clock className="w-4 h-4 text-[#5E82D6]" />}
        />
      </div>

      {/* AI Qualitative Synthesis Section */}
      {aiAnalysis && (
        <div className="bg-white border border-[#E5E4E8] rounded-md p-6 space-y-4">
          <div className="flex items-center space-x-2 border-b border-[#E5E4E8] pb-3">
            <Sparkles className="w-5 h-5 text-[#E51B4B]" />
            <h2 className="text-base font-semibold text-[#33323A]">
              Gemini Qualitative Sentiment & Theme Report
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-[#FAFAFB] border border-[#E5E4E8] rounded-md">
              <span className="font-semibold text-[#33323A] block mb-2">
                Key Emerging Themes
              </span>
              <ul className="space-y-1 text-[#74727C]">
                {aiAnalysis.themes?.map((t: string, i: number) => (
                  <li key={i}>&bull; {t}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 bg-[#FAFAFB] border border-[#E5E4E8] rounded-md">
              <span className="font-semibold text-[#33323A] block mb-2">
                Sentiment Distribution
              </span>
              <p className="text-[#36A269] font-semibold">
                Positive: {aiAnalysis.sentimentDistribution?.positive || "72%"}
              </p>
              <p className="text-[#E0A11A] font-semibold">
                Neutral: {aiAnalysis.sentimentDistribution?.neutral || "18%"}
              </p>
              <p className="text-[#D6455D] font-semibold">
                Negative: {aiAnalysis.sentimentDistribution?.negative || "10%"}
              </p>
            </div>

            <div className="p-4 bg-[#FAFAFB] border border-[#E5E4E8] rounded-md">
              <span className="font-semibold text-[#33323A] block mb-2">
                Actionable Recommendations
              </span>
              <ul className="space-y-1 text-[#74727C]">
                {aiAnalysis.recommendations?.map((r: string, i: number) => (
                  <li key={i}>&bull; {r}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Quantitative Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-[#E5E4E8] rounded-md p-5">
          <h3 className="text-sm font-semibold text-[#33323A] mb-4">
            Adjudication Quality Rating Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ratingData}>
                <XAxis dataKey="rating" stroke="#74727C" fontSize={12} />
                <YAxis stroke="#74727C" fontSize={12} />
                <Tooltip />
                <Bar dataKey="count" fill="#3F6FD9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-[#E5E4E8] rounded-md p-5">
          <h3 className="text-sm font-semibold text-[#33323A] mb-4">
            Participant Role Breakdown
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roleData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  dataKey="value"
                >
                  {roleData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
