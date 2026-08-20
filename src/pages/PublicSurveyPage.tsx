import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { tabulaStore } from '../lib/store';
import { surveyService } from '../services/surveyService';
import { Survey } from '../types';
import { useToast } from '../components/common/Toast';
import { SurveyQuestionSkeleton } from '../components/common/Skeleton';

export const PublicSurveyPage: React.FC = () => {
  const { publicSurveyId } = useParams<{ publicSurveyId: string }>();
  const { toast } = useToast();

  const [survey, setSurvey] = useState<Survey | null>(() => {
    const surveys = tabulaStore.getSurveys();
    return surveys.find((s) => s.publicId === publicSurveyId || s.id === publicSurveyId) || null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(!survey);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    async function loadSurvey() {
      if (!publicSurveyId) return;
      try {
        const fetched = await surveyService.getSurveyById(publicSurveyId);
        if (fetched) {
          setSurvey(fetched);
        }
      } catch (e) {
        console.error('Error fetching survey for public page:', e);
      } finally {
        setIsLoading(false);
      }
    }

    loadSurvey();
  }, [publicSurveyId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F6] py-12 px-4 font-sans text-[#33323A] flex flex-col items-center">
        <div className="max-w-xl w-full space-y-6">
          <div className="bg-white border border-[#E5E4E8] rounded-md p-8 space-y-4">
            <SurveyQuestionSkeleton />
            <SurveyQuestionSkeleton />
            <SurveyQuestionSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="min-h-screen bg-[#F5F5F6] flex items-center justify-center p-4 font-sans text-[#33323A]">
        <div className="bg-white border border-[#E5E4E8] rounded-md p-8 max-w-md w-full text-center">
          <h1 className="text-base font-semibold text-[#33323A]">Survey Not Found</h1>
          <p className="text-xs text-[#74727C] mt-1">This survey link is invalid or has been archived by the organizer.</p>
        </div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    tabulaStore.submitSurveyResponse({
      surveyId: survey.id,
      answers,
      timeSpentSeconds: 120,
    });
    setIsSubmitted(true);
    toast.success('Your response has been successfully recorded!');
  };

  return (
    <div className="min-h-screen bg-[#F5F5F6] py-12 px-4 font-sans text-[#33323A] flex flex-col items-center">
      <div className="max-w-xl w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center space-x-2">
            <div className="w-6 h-6 bg-[#E51B4B] rounded flex items-center justify-center font-bold text-white text-xs">
              T
            </div>
            <span className="font-semibold text-xs tracking-widest text-[#261B3D] uppercase">
              TABULA SURVEY INTELLIGENCE
            </span>
          </div>
        </div>

        {isSubmitted ? (
          <div className="bg-white border border-[#E5E4E8] rounded-md p-8 text-center space-y-4">
            <div className="w-12 h-12 bg-[#EBF7F0] text-[#36A269] rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-semibold text-[#33323A]">Response Submitted</h2>
            <p className="text-xs text-[#74727C] max-w-sm mx-auto">
              Thank you for providing your survey feedback. Your entry has been securely logged and aggregated for research intelligence.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white border border-[#E5E4E8] rounded-md p-8 space-y-6">
            <div className="border-b border-[#E5E4E8] pb-4">
              <h1 className="text-xl font-semibold text-[#33323A]">{survey.title}</h1>
              <p className="text-xs text-[#74727C] mt-1">{survey.description}</p>
            </div>

            <div className="space-y-6">
              {survey.questions.map((q, idx) => (
                <div key={q.id} className="space-y-2 text-xs">
                  <label className="block font-semibold text-[#33323A]">
                    {idx + 1}. {q.title} {q.isRequired && <span className="text-[#D6455D]">*</span>}
                  </label>
                  {q.description && <p className="text-[11px] text-[#74727C]">{q.description}</p>}

                  {q.type === 'Short text' && (
                    <input
                      type="text"
                      required={q.isRequired}
                      onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                      className="w-full h-9 px-3 bg-[#FAFAFB] border border-[#E5E4E8] rounded-md text-[#33323A]"
                    />
                  )}

                  {q.type === 'Long text' && (
                    <textarea
                      rows={3}
                      required={q.isRequired}
                      onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                      className="w-full p-3 bg-[#FAFAFB] border border-[#E5E4E8] rounded-md text-[#33323A]"
                    />
                  )}

                  {(q.type === 'Single choice' || q.type === 'Multiple choice') && (
                    <div className="space-y-2 pt-1">
                      {q.options?.map((opt, oi) => (
                        <label key={oi} className="flex items-center space-x-2 cursor-pointer text-[#33323A]">
                          <input
                            type={q.type === 'Single choice' ? 'radio' : 'checkbox'}
                            name={q.id}
                            value={opt}
                            required={q.isRequired && q.type === 'Single choice'}
                            onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                            className="text-[#3F6FD9]"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {q.type === 'Rating' && (
                    <div className="flex items-center space-x-3 pt-1">
                      {[1, 2, 3, 4, 5].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setAnswers({ ...answers, [q.id]: val })}
                          className={`w-9 h-9 rounded-md border text-xs font-semibold transition-colors ${
                            answers[q.id] === val
                              ? 'bg-[#261B3D] text-white border-[#261B3D]'
                              : 'bg-[#FAFAFB] text-[#33323A] border-[#E5E4E8] hover:bg-[#F5F5F6]'
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-[#E5E4E8] pt-4 text-right">
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#E51B4B] hover:bg-[#CC1641] text-white text-xs font-semibold rounded-md"
              >
                Submit Survey Response
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
