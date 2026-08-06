// Mock API for RoleSync based on agreed API contracts

const mockDelay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const getRoles = async () => {
  await mockDelay(500);
  return [
    { id: '1', title: 'Internship Coordinator', department: 'Computer Science' },
    { id: '2', title: 'HOD Computer Science', department: 'Computer Science' },
    { id: '3', title: 'Lab Administrator', department: 'Computer Science' }
  ];
};

export const getHandoverChecklist = async (roleId) => {
  await mockDelay(600);
  return [
    { id: 't1', category: 'Academic', task: 'Upload final semester grading sheets', status: 'pending' },
    { id: 't2', category: 'Academic', task: 'Hand over current syllabus progress to HOD', status: 'completed' },
    { id: 't3', category: 'Industry/Internships', task: 'Transfer list of active recruiting companies', status: 'pending' },
    { id: 't4', category: 'Administrative', task: 'Clear library dues and lab equipment', status: 'pending' }
  ];
};

export const toggleChecklistTask = async (taskId, currentStatus) => {
  await mockDelay(300);
  return { success: true, newStatus: currentStatus === 'pending' ? 'completed' : 'pending' };
};

export const generateAIBrief = async (roleId) => {
  await mockDelay(1500); // simulate LLM delay
  return `### AI Handover Brief for Internship Coordinator
**Generated: ${new Date().toLocaleDateString()}**

**1. Pending Actions:**
- Reach out to TCS regarding the upcoming campus drive.
- Finalize the student spreadsheet for 8th-semester internships.

**2. Key Contacts:**
- Infosys HR: Mr. Sharma (sharma@infosys.example.com)
- Wipro Onboarding: Neha (neha@wipro.example.com)

**3. Notes from Predecessor:**
"Make sure to follow up with the placement cell every Monday. The master tracker is saved in the shared drive under 'Placements 2026'."
`;
};

export const searchRAGDocuments = async (query) => {
  await mockDelay(800);
  return [
    { id: 'doc1', title: 'TCS Placement MoU 2025', snippet: '...agreed to intake 50 students from the CS department...', confidence: 0.92 },
    { id: 'doc2', title: 'Internship Guidelines', snippet: '...students must complete minimum 6 weeks of industry training...', confidence: 0.85 }
  ];
};

export const getAdminMetrics = async () => {
  await mockDelay(700);
  return {
    totalHandovers: 12,
    completedHandovers: 8,
    pendingHandovers: 4,
    departments: [
      { name: 'Computer Science', progress: 75 },
      { name: 'Mechanical', progress: 100 },
      { name: 'Electronics', progress: 40 }
    ]
  };
};
