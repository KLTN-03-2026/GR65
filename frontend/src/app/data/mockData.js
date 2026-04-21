export const mockCandidates = [];
export const mockEmployers = [];
export const mockJobs = [];
export const mockApplications = [];
export const mockCVs = [];
export const mockNotifications = [];

export const mockPipeline = {
  pending: [],
  reviewing: [],
  interview: [],
  offer: [],
  rejected: []
};

export const mockAdminStats = {
  totalUsers: 0,
  totalCandidates: 0,
  totalEmployers: 0,
  totalJobs: 0,
  totalApplications: 0,
  aiProcessed: 0,
  activeJobs: 0,
  successfulHires: 0,
  monthlyGrowth: {
    users: 0,
    jobs: 0,
    applications: 0
  },
  usersByRole: [
    { role: "Ứng viên", count: 0, color: "#6366f1" },
    { role: "Nhà tuyển dụng", count: 0, color: "#10b981" },
    { role: "Admin", count: 0, color: "#f59e0b" }
  ],
  applicationsChart: [
    { name: "T1", cv: 0, offer: 0 },
    { name: "T2", cv: 0, offer: 0 },
    { name: "T3", cv: 0, offer: 0 },
    { name: "T4", cv: 0, offer: 0 },
    { name: "T5", cv: 0, offer: 0 },
    { name: "T6", cv: 0, offer: 0 }
  ],
  recentActivity: []
};

export const mockAIStats = {
  totalProcessed: 0,
  avgTimeSaved: "0 phút",
  avgMatchScore: 0,
  feedbackLoops: 0,
  improvements: [
    { date: "T1", accuracy: 0 },
    { date: "T2", accuracy: 0 },
    { date: "T3", accuracy: 0 },
    { date: "T4", accuracy: 0 }
  ],
  cvFormats: [],
  feedbackData: [],
  topSkills: []
};