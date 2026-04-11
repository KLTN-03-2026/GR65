import { createBrowserRouter } from "react-router";
import { LandingPage } from "./pages/LandingPage";
import { AuthPage } from "./pages/auth/AuthPage";
import { CandidateLayout } from "./pages/candidate/CandidateLayout";
import { CandidateDashboard } from "./pages/candidate/CandidateDashboard";
import { CVManager } from "./pages/candidate/CVManager";
import { JobSearch } from "./pages/candidate/JobSearch";
import { CandidateApplications } from "./pages/candidate/CandidateApplications";
import { EmployerLayout } from "./pages/employer/EmployerLayout";
import { EmployerDashboard } from "./pages/employer/EmployerDashboard";
import { JobPostings } from "./pages/employer/JobPostings";
import { CandidateList } from "./pages/employer/CandidateList";
import { Pipeline } from "./pages/employer/Pipeline";
import { Interviews } from "./pages/employer/Interviews";
import { AdminLayout } from "./pages/admin/AdminLayout";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AccountManagement } from "./pages/admin/AccountManagement";
import { ContentModeration } from "./pages/admin/ContentModeration";
import { AIStats } from "./pages/admin/AIStats";
import { CandidateProfile } from "./pages/candidate/CandidateProfile";
import { EmployerProfile } from "./pages/employer/EmployerProfile";
import { AdminProfile } from "./pages/admin/AdminProfile";

export const router = createBrowserRouter([
  { path: "/", Component: LandingPage },
  { path: "/login", Component: AuthPage },
  { path: "/register", Component: AuthPage },
  { path: "/forgot-password", Component: AuthPage },
  {
    path: "/candidate",
    Component: CandidateLayout,
    children: [
      { index: true, Component: CandidateDashboard },
      { path: "cv", Component: CVManager },
      { path: "jobs", Component: JobSearch },
      { path: "applications", Component: CandidateApplications },
      { path: "profile", Component: CandidateProfile },
    ],
  },
  {
    path: "/employer",
    Component: EmployerLayout,
    children: [
      { index: true, Component: EmployerDashboard },
      { path: "jobs", Component: JobPostings },
      { path: "candidates", Component: CandidateList },
      { path: "pipeline", Component: Pipeline },
      { path: "interviews", Component: Interviews },
      { path: "profile", Component: EmployerProfile },
    ],
  },
  {
    path: "/admin",
    Component: AdminLayout,
    children: [
      { index: true, Component: AdminDashboard },
      { path: "accounts", Component: AccountManagement },
      { path: "content", Component: ContentModeration },
      { path: "ai-stats", Component: AIStats },
      { path: "profile", Component: AdminProfile },
    ],
  },
]);