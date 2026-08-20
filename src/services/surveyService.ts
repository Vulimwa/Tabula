import { Survey, SurveyQuestion } from "../types";

const authHeaders = (): Record<string, string> => {
  // Do not import the store here: the store imports this service while it is
  // being constructed, which creates a temporal-dead-zone circular import.
  const token = localStorage.getItem("tabula_auth_token");
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

async function readJsonResponse(response: Response): Promise<any> {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      response.ok
        ? "The survey service returned an invalid response."
        : "The survey service is unavailable. Check the server deployment configuration.",
    );
  }
}

export const surveyService = {
  // Fetch all surveys from the backend API
  async getAllSurveys(): Promise<Survey[]> {
    try {
      const res = await fetch("/api/surveys", {
        headers: authHeaders(),
      });
      const data = await readJsonResponse(res);
      if (data.success && Array.isArray(data.surveys)) {
        return data.surveys;
      }
    } catch (e) {
      console.error("Failed to fetch surveys from API:", e);
    }
    return [];
  },

  // Fetch a specific survey by ID or publicId
  async getSurveyById(id: string): Promise<Survey | null> {
    try {
      const res = await fetch(`/api/surveys/${encodeURIComponent(id)}`, {
        headers: authHeaders(),
      });
      const data = await readJsonResponse(res);
      if (data.success && data.survey) {
        return data.survey;
      }
    } catch (e) {
      console.error(`Failed to fetch survey ${id} from API:`, e);
    }
    return null;
  },

  // Create a new survey in the backend database
  async createSurvey(surveyData: {
    title: string;
    description?: string;
    status?: "Draft" | "Published" | "Closed";
    questions?: SurveyQuestion[];
    publicId?: string;
    organizationId?: string;
    eventId?: string;
  }): Promise<Survey> {
    const res = await fetch("/api/surveys", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
      body: JSON.stringify(surveyData),
    });
    const data = await res.json();
    if (!data.success || !data.survey) {
      throw new Error(data.error || "Failed to create survey");
    }
    return data.survey;
  },

  // Update a survey in the backend database
  async updateSurvey(id: string, updates: Partial<Survey>): Promise<Survey> {
    const res = await fetch(`/api/surveys/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!data.success || !data.survey) {
      throw new Error(data.error || "Failed to update survey");
    }
    return data.survey;
  },

  // Delete a survey from the backend database
  async deleteSurvey(id: string): Promise<boolean> {
    const res = await fetch(`/api/surveys/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    const data = await res.json();
    return !!data.success;
  },

  // Question CRUD endpoints
  async getQuestions(surveyId: string): Promise<SurveyQuestion[]> {
    try {
      const res = await fetch(
        `/api/surveys/${encodeURIComponent(surveyId)}/questions`,
        {
          headers: authHeaders(),
        },
      );
      const data = await res.json();
      if (data.success && Array.isArray(data.questions)) {
        return data.questions;
      }
    } catch (e) {
      console.error(`Failed to fetch questions for survey ${surveyId}:`, e);
    }
    return [];
  },

  async addQuestion(
    surveyId: string,
    question: Omit<SurveyQuestion, "id">,
  ): Promise<{ question: SurveyQuestion; survey: Survey }> {
    const res = await fetch(
      `/api/surveys/${encodeURIComponent(surveyId)}/questions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify(question),
      },
    );
    const data = await res.json();
    if (!data.success || !data.question) {
      throw new Error(data.error || "Failed to add question");
    }
    return { question: data.question, survey: data.survey };
  },

  async updateQuestion(
    surveyId: string,
    questionId: string,
    updates: Partial<SurveyQuestion>,
  ): Promise<{ question: SurveyQuestion; survey: Survey }> {
    const res = await fetch(
      `/api/surveys/${encodeURIComponent(surveyId)}/questions/${encodeURIComponent(questionId)}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify(updates),
      },
    );
    const data = await res.json();
    if (!data.success || !data.question) {
      throw new Error(data.error || "Failed to update question");
    }
    return { question: data.question, survey: data.survey };
  },

  async deleteQuestion(surveyId: string, questionId: string): Promise<Survey> {
    const res = await fetch(
      `/api/surveys/${encodeURIComponent(surveyId)}/questions/${encodeURIComponent(questionId)}`,
      {
        method: "DELETE",
        headers: authHeaders(),
      },
    );
    const data = await res.json();
    if (!data.success || !data.survey) {
      throw new Error(data.error || "Failed to delete question");
    }
    return data.survey;
  },

  async saveQuestions(
    surveyId: string,
    questions: SurveyQuestion[],
  ): Promise<Survey> {
    const res = await fetch(
      `/api/surveys/${encodeURIComponent(surveyId)}/questions`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({ questions }),
      },
    );
    const data = await res.json();
    if (!data.success || !data.survey) {
      throw new Error(data.error || "Failed to update questions");
    }
    return data.survey;
  },
};
