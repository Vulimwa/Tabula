import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { ProtectedRoute } from "./components/common/ProtectedRoute";
import { ToastProvider } from "./components/common/Toast";

import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { EventsPage } from "./pages/EventsPage";
import { CreateEventPage } from "./pages/CreateEventPage";
import { EventDetailPage } from "./pages/EventDetailPage";
import { LiveTabulationPage } from "./pages/LiveTabulationPage";
import { StandingsPage } from "./pages/StandingsPage";
import { SpeakerRankingsPage } from "./pages/SpeakerRankingsPage";
import { ResultsReleasePage } from "./pages/ResultsReleasePage";
import { TeamsPage } from "./pages/TeamsPage";
import { SpeakersPage } from "./pages/SpeakersPage";
import { JudgesPage } from "./pages/JudgesPage";
import { SurveysPage } from "./pages/SurveysPage";
import { SurveyBuilderPage } from "./pages/SurveyBuilderPage";
import { SurveyAnalyticsPage } from "./pages/SurveyAnalyticsPage";
import { PublicSurveyPage } from "./pages/PublicSurveyPage";
import { JudgeScoringPage } from "./pages/JudgeScoringPage";
import { PublicResultsPage } from "./pages/PublicResultsPage";
import { UsersPage } from "./pages/UsersPage";
import { RolesPage } from "./pages/RolesPage";
import { AuditLogsPage } from "./pages/AuditLogsPage";
import { SettingsPage } from "./pages/SettingsPage";

export function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Unauthenticated Landing & Login */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Public Unauthenticated Share/Participant Pages */}
          <Route path="/s/:publicSurveyId" element={<PublicSurveyPage />} />
          <Route
            path="/public/results/:eventId"
            element={<PublicResultsPage />}
          />
          <Route
            path="/judge/ballot/:roomId"
            element={
              <ProtectedRoute>
                <JudgeScoringPage />
              </ProtectedRoute>
            }
          />
          {/* Authenticated Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <DashboardPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Competition Events */}
          <Route
            path="/events"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <EventsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/events/new"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <CreateEventPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/events/:eventId"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <EventDetailPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Tabulation Engine */}
          <Route
            path="/tabulation/live"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <LiveTabulationPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/tabulation/standings"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <StandingsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/tabulation/speakers"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <SpeakerRankingsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/tabulation/results"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ResultsReleasePage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* People Management */}
          <Route
            path="/people/teams"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <TeamsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/people/speakers"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <SpeakersPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/people/judges"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <JudgesPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Survey System */}
          <Route
            path="/surveys"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <SurveysPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/surveys/new"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <SurveyBuilderPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/surveys/:surveyId/edit"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <SurveyBuilderPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/surveys/:surveyId/analytics"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <SurveyAnalyticsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/insights"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <SurveyAnalyticsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Administration (Strict Admin / Super Admin) */}
          <Route
            path="/admin/organization"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <SettingsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <UsersPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/roles"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <RolesPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/audit-logs"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <AuditLogsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <SettingsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
