import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Sparkles,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  GripVertical,
  Sliders,
  Eye,
  Settings,
  CheckCircle2,
  Database,
  Loader2,
} from "lucide-react";
import { tabulaStore } from "../lib/store";
import { QuestionType, SurveyQuestion } from "../types";
import { surveyService } from "../services/surveyService";
import { useToast } from "../components/common/Toast";
import { SurveyQuestionSkeleton } from "../components/common/Skeleton";

const QUESTION_TYPES: QuestionType[] = [
  "Short text",
  "Long text",
  "Single choice",
  "Multiple choice",
  "Dropdown",
  "Rating",
  "Likert scale",
  "Number",
  "Date",
  "Yes/No",
];

export const SurveyBuilderPage: React.FC = () => {
  const navigate = useNavigate();
  const { surveyId } = useParams<{ surveyId?: string }>();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"Draft" | "Published">("Published");
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number>(0);
  const [isLoadingSurvey, setIsLoadingSurvey] = useState<boolean>(!!surveyId);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(
    null,
  );

  const [showAiDrawer, setShowAiDrawer] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Load existing survey & questions from Database API
  useEffect(() => {
    async function loadSurvey() {
      if (!surveyId) {
        // Default initial template for new survey
        setQuestions([
          {
            id: `q-1`,
            type: "Rating",
            title: "Overall Competition Adjudication Rating",
            description:
              "Rate the quality and clarity of judge verbal feedback.",
            isRequired: true,
            ratingMax: 5,
          },
          {
            id: `q-2`,
            type: "Single choice",
            title: "Primary Competition Role",
            isRequired: true,
            options: ["Debater", "Adjudicator / Judge", "Observer"],
          },
        ]);
        return;
      }

      setIsLoadingSurvey(true);
      try {
        const fetchedSurvey = await surveyService.getSurveyById(surveyId);
        if (fetchedSurvey) {
          setTitle(fetchedSurvey.title || "");
          setDescription(fetchedSurvey.description || "");
          setStatus(
            (fetchedSurvey.status as "Draft" | "Published") || "Published",
          );

          // Fetch questions from database API endpoint
          const fetchedQs = await surveyService.getQuestions(surveyId);
          setQuestions(
            fetchedQs.length > 0 ? fetchedQs : fetchedSurvey.questions || [],
          );
        } else {
          toast.error("Requested survey was not found in the database.");
        }
      } catch (err) {
        console.error("Failed to load survey questions from database:", err);
        toast.error("Error connecting to survey database");
      } finally {
        setIsLoadingSurvey(false);
      }
    }

    loadSurvey();
  }, [surveyId]);

  const addQuestion = async (type: QuestionType) => {
    const newQ: SurveyQuestion = {
      id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type,
      title: `Untitled ${type} Question`,
      isRequired: true,
      options:
        type === "Single choice" ||
        type === "Multiple choice" ||
        type === "Dropdown"
          ? ["Option 1", "Option 2"]
          : undefined,
      likertScale:
        type === "Likert scale"
          ? [
              "Strongly Disagree",
              "Disagree",
              "Neutral",
              "Agree",
              "Strongly Agree",
            ]
          : undefined,
    };

    setQuestions((prev) => [...prev, newQ]);
    setSelectedQuestionIndex(questions.length);
    toast.info(`Added new ${type} question`);

    // If editing an existing database survey, persist question creation directly to database API
    if (surveyId) {
      try {
        await surveyService.addQuestion(surveyId, newQ);
      } catch (e) {
        console.error("Failed to persist new question to database API:", e);
      }
    }
  };

  const removeQuestion = async (index: number) => {
    const targetQ = questions[index];
    const updated = questions.filter((_, i) => i !== index);
    setQuestions(updated);
    if (selectedQuestionIndex >= updated.length) {
      setSelectedQuestionIndex(Math.max(0, updated.length - 1));
    }
    toast.info("Question removed");

    // If editing an existing database survey, persist question deletion to database API
    if (surveyId && targetQ?.id) {
      try {
        await surveyService.deleteQuestion(surveyId, targetQ.id);
      } catch (e) {
        console.error("Failed to delete question from database API:", e);
      }
    }
  };

  const updateSelectedQuestion = (updates: Partial<SurveyQuestion>) => {
    if (selectedQuestionIndex < 0 || selectedQuestionIndex >= questions.length)
      return;
    const updated = [...questions];
    updated[selectedQuestionIndex] = {
      ...updated[selectedQuestionIndex],
      ...updates,
    };
    setQuestions(updated);
  };

  const handleAiAssistant = async () => {
    if (!aiPrompt) return;
    setIsAiLoading(true);
    try {
      const res = await fetch("/api/ai/survey-assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(tabulaStore.getApiAuthHeaders() || {}),
        },
        body: JSON.stringify({ prompt: aiPrompt }),
      });
      const data = await res.json();
      if (data.success && data.survey) {
        setTitle(data.survey.title);
        setDescription(data.survey.description);
        if (Array.isArray(data.survey.questions)) {
          const generatedQs: SurveyQuestion[] = data.survey.questions.map(
            (q: any, i: number) => ({
              id: `q-ai-${Date.now()}-${i}`,
              type: q.type || "Short text",
              title: q.title,
              isRequired: q.isRequired ?? true,
              options:
                q.options ||
                (q.type === "Single choice"
                  ? ["Option 1", "Option 2"]
                  : undefined),
            }),
          );
          setQuestions(generatedQs);
          setSelectedQuestionIndex(0);
        }
        setShowAiDrawer(false);
        toast.success("Generated AI survey questions!");
      } else {
        toast.error(data.error || "Failed to generate AI survey proposal.");
      }
    } catch (err) {
      toast.error("Error contacting AI Survey Assistant service.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a survey title.");
      return;
    }

    setIsSaving(true);
    const publicId =
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "") || `survey-${Date.now()}`;

    try {
      if (surveyId) {
        // Update existing survey & all its questions in Database API
        await surveyService.updateSurvey(surveyId, {
          title,
          description,
          status,
          publicId,
        });
        await surveyService.saveQuestions(surveyId, questions);
        tabulaStore.updateSurvey(surveyId, {
          title,
          description,
          status,
          questions,
          publicId,
        });
      } else {
        // Create new survey with questions in Database API
        const created = await surveyService.createSurvey({
          title,
          description,
          status,
          questions,
          publicId,
        });
        tabulaStore.addSurvey(created);
      }

      await tabulaStore.loadSurveysFromApi();
      toast.success("Survey saved successfully to database!");
      setTimeout(() => {
        navigate("/surveys");
      }, 800);
    } catch (err) {
      console.error("Error saving survey to database API:", err);
      toast.error("Failed to persist survey questions to the database.");
    } finally {
      setIsSaving(false);
    }
  };

  const currentQ = questions[selectedQuestionIndex];

  if (isLoadingSurvey) {
    return (
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-md border border-[#E5E4E8] flex items-center justify-between animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-1/3" />
          <div className="h-8 bg-gray-200 rounded w-28" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-3 space-y-3">
            <SurveyQuestionSkeleton />
            <SurveyQuestionSkeleton />
          </div>
          <div className="lg:col-span-6 space-y-3">
            <SurveyQuestionSkeleton />
            <SurveyQuestionSkeleton />
          </div>
          <div className="lg:col-span-3 space-y-3">
            <SurveyQuestionSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-md border border-[#E5E4E8]">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate("/surveys")}
            className="p-1.5 text-[#74727C] hover:text-[#33323A] rounded"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-semibold text-[#33323A]">
                {surveyId
                  ? "Edit Survey Questions"
                  : "Professional Survey Builder"}
              </h1>
              <span className="inline-flex items-center space-x-1 bg-[#EBF7F0] text-[#36A269] text-[10px] font-bold px-2 py-0.5 rounded border border-[#36A269]/20">
                <Database className="w-3 h-3" />
              </span>
            </div>
            <p className="text-xs text-[#74727C]">
              Create, edit, reorder, and delete survey questions backed by API
              persistence.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAiDrawer(true)}
            className="px-3 py-1.5 bg-[#261B3D] hover:bg-[#32244F] text-white text-xs font-medium rounded-md flex items-center space-x-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#E51B4B]" />
            <span>AI Assistant</span>
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-1.5 bg-[#E51B4B] hover:bg-[#CC1641] disabled:opacity-50 text-white text-xs font-medium rounded-md flex items-center space-x-1.5"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{isSaving ? "Persisting..." : "Save & Publish Survey"}</span>
          </button>
        </div>
      </div>

      {saveSuccessMessage && (
        <div className="bg-[#EBF7F0] border border-[#36A269]/30 p-3 rounded-md flex items-center space-x-2 text-xs font-semibold text-[#36A269]">
          <CheckCircle2 className="w-4 h-4" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {/* 3-Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* LEFT PANE: Question Types Palette */}
        <div className="lg:col-span-3 bg-white border border-[#E5E4E8] rounded-md p-4 space-y-3">
          <h3 className="text-xs font-semibold text-[#33323A] uppercase tracking-wider">
            Question Types
          </h3>
          <p className="text-[11px] text-[#74727C]">
            Click to append to survey canvas:
          </p>

          <div className="space-y-1.5">
            {QUESTION_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => addQuestion(type)}
                className="w-full text-left px-3 py-2 bg-[#FAFAFB] hover:bg-[#F5F5F6] border border-[#E5E4E8] rounded text-xs font-medium text-[#33323A] flex items-center justify-between transition-colors"
              >
                <span>{type}</span>
                <Plus className="w-3.5 h-3.5 text-[#74727C]" />
              </button>
            ))}
          </div>
        </div>

        {/* CENTER PANE: Survey Canvas */}
        <div className="lg:col-span-6 bg-white border border-[#E5E4E8] rounded-md p-6 space-y-5">
          {/* Survey Title & Description Inputs */}
          <div className="space-y-3 border-b border-[#E5E4E8] pb-4">
            <input
              type="text"
              placeholder="Survey Title (e.g. Adjudication Feedback)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-lg font-semibold text-[#33323A] bg-transparent border-b border-transparent focus:border-[#3F6FD9] focus:outline-none"
            />
            <textarea
              rows={2}
              placeholder="Survey description or introduction for respondents..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs text-[#74727C] bg-[#FAFAFB] p-2.5 rounded border border-[#E5E4E8] focus:bg-white focus:outline-none"
            />
          </div>

          {/* Question Blocks */}
          <div className="space-y-3">
            {questions.length === 0 ? (
              <div className="text-center py-8 text-xs text-[#74727C] border border-dashed border-[#E5E4E8] rounded-md">
                No questions added. Select a question type from the left pane or
                use AI Assistant.
              </div>
            ) : (
              questions.map((q, index) => (
                <div
                  key={q.id}
                  onClick={() => setSelectedQuestionIndex(index)}
                  className={`p-4 border rounded-md cursor-pointer transition-all relative ${
                    selectedQuestionIndex === index
                      ? "border-[#3F6FD9] bg-[#F8FAFC] shadow-sm"
                      : "border-[#E5E4E8] bg-white hover:border-[#C8C7CD]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-semibold text-[#3F6FD9] uppercase">
                      Q{index + 1}: {q.type}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeQuestion(index);
                      }}
                      className="text-[#D6455D] hover:text-[#B83248] p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-xs font-semibold text-[#33323A]">
                    {q.title}
                  </p>
                  {q.description && (
                    <p className="text-[11px] text-[#74727C] mt-0.5">
                      {q.description}
                    </p>
                  )}

                  {/* Option Previews */}
                  {q.options && (
                    <div className="mt-2 space-y-1">
                      {q.options.map((opt, oi) => (
                        <div
                          key={oi}
                          className="text-[11px] text-[#74727C] flex items-center space-x-1.5"
                        >
                          <span className="w-2.5 h-2.5 rounded-full border border-[#C8C7CD]" />
                          <span>{opt}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT PANE: Question Settings */}
        <div className="lg:col-span-3 bg-white border border-[#E5E4E8] rounded-md p-4 space-y-4">
          <h3 className="text-xs font-semibold text-[#33323A] uppercase tracking-wider">
            Question Properties
          </h3>

          {currentQ ? (
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-[#33323A] mb-1">
                  Question Title
                </label>
                <input
                  type="text"
                  value={currentQ.title}
                  onChange={(e) =>
                    updateSelectedQuestion({ title: e.target.value })
                  }
                  className="w-full h-8 px-2.5 bg-[#F5F5F6] border border-[#E5E4E8] rounded text-[#33323A]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#33323A] mb-1">
                  Help Text / Description
                </label>
                <input
                  type="text"
                  value={currentQ.description || ""}
                  onChange={(e) =>
                    updateSelectedQuestion({ description: e.target.value })
                  }
                  className="w-full h-8 px-2.5 bg-[#F5F5F6] border border-[#E5E4E8] rounded text-[#33323A]"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#E5E4E8]">
                <span className="font-medium text-[#33323A]">
                  Required Answer
                </span>
                <input
                  type="checkbox"
                  checked={currentQ.isRequired}
                  onChange={(e) =>
                    updateSelectedQuestion({ isRequired: e.target.checked })
                  }
                  className="w-4 h-4 text-[#3F6FD9]"
                />
              </div>

              {currentQ.options && (
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <label className="block font-medium text-white">
                    Choice Options
                  </label>
                  {currentQ.options.map((opt, oi) => (
                    <div
                      key={oi}
                      className="flex items-center space-x-1.5 mb-1"
                    >
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const newOpts = [...(currentQ.options || [])];
                          newOpts[oi] = e.target.value;
                          updateSelectedQuestion({ options: newOpts });
                        }}
                        className="flex-1 h-8 px-2.5 bg-[#181818] border border-white/10 text-white text-xs focus:outline-none focus:border-[#E2FF00]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newOpts = (currentQ.options || []).filter(
                            (_, idx) => idx !== oi,
                          );
                          updateSelectedQuestion({ options: newOpts });
                        }}
                        className="p-1 text-[#FF4D4D] hover:bg-[#FF4D4D]/10 rounded transition-colors"
                        title="Delete option"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      updateSelectedQuestion({
                        options: [
                          ...(currentQ.options || []),
                          `Option ${(currentQ.options?.length || 0) + 1}`,
                        ],
                      });
                    }}
                    className="text-[11px] text-[#E2FF00] font-bold hover:underline"
                  >
                    + Add Choice Option
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-[#74727C]">
              Select a question block on the canvas to configure settings.
            </p>
          )}
        </div>
      </div>

      {/* AI Assistant Drawer */}
      {showAiDrawer && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E4E8] rounded-md p-6 max-w-lg w-full space-y-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-[#E51B4B]" />
              <h2 className="text-base font-semibold text-[#33323A]">
                AI Survey Assistant
              </h2>
            </div>
            <p className="text-xs text-[#74727C]">
              Describe what research or feedback objective you want to analyze,
              and TABULA AI will generate structured survey questions.
            </p>

            <textarea
              rows={3}
              placeholder="e.g., I want to analyze why university debaters drop out after their first championship..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className="w-full p-3 bg-[#F5F5F6] border border-[#E5E4E8] rounded-md text-xs text-[#33323A]"
            />

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowAiDrawer(false)}
                className="px-3.5 py-1.5 bg-white border border-[#E5E4E8] text-[#33323A] text-xs font-medium rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleAiAssistant}
                disabled={isAiLoading}
                className="px-4 py-1.5 bg-[#E51B4B] hover:bg-[#CC1641] text-white text-xs font-medium rounded-md flex items-center space-x-1.5"
              >
                {isAiLoading ? "Generating..." : "Generate Survey Proposal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
