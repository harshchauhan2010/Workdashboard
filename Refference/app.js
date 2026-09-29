/**
 * WorkDashboard — Enterprise Capacity Engine & UI Controller
 * 50 Developers · 5 Squads · 10 Clients · 1 Project Manager
 * Clean, production-grade rendering with Inter + JetBrains Mono typography
 */

// Clean numerical hours formatter (prevents floating point zero decimals e.g. 9.600000000000001h)
function cleanHours(val) {
  if (val === undefined || val === null || isNaN(val)) return 0;
  return parseFloat(Number(val).toFixed(1));
}

// Clean short date formatter (e.g. "2026-09-06T18:00" -> "Sep 6, 2026", "Sep 2, 2026 · 10:00 AM" -> "Sep 2, 2026")
function formatShortDate(str) {
  if (!str) return '—';
  if (typeof str !== 'string') return String(str);
  
  // If already formatted like "Sep 2, 2026 · 10:00 AM" or "Sep 2, 2026"
  const stripped = str.replace(/\s*·.*$/, '').replace(/\s*\(.*\)$/, '').trim();
  if (/^[A-Za-z]{3}\s+\d{1,2},\s+\d{4}$/.test(stripped)) {
    return stripped;
  }
  if (/^[A-Za-z]{3}\s+\d{1,2}$/.test(stripped)) {
    return `${stripped}, 2026`;
  }
  
  // Try ISO / standard date parsing
  const d = new Date(stripped);
  if (!isNaN(d.getTime())) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }
  
  return stripped;
}

// ═══════════════════════════════════════════════════════════
// DATA LAYER
// ═══════════════════════════════════════════════════════════

let SQUADS = [
  { id: 'squad_a', name: 'Squad A (FinTech Core Platform)', lead: 'David Miller', color: 'blue', project: 'Alpha FinTech Platform', projectCode: 'ALPHA', budgetHours: 320, spentHours: 280, health: 'healthy' },
  { id: 'squad_b', name: 'Squad B (E-Commerce Web Portal)', lead: 'Sarah Jenkins', color: 'indigo', project: 'Beta E-Commerce Portal', projectCode: 'BETA', budgetHours: 400, spentHours: 310, health: 'healthy' },
  { id: 'squad_c', name: 'Squad C (Mobile POS & iOS/Android)', lead: 'Robert Chang', color: 'emerald', project: 'Gamma POS Suite', projectCode: 'GAMMA', budgetHours: 250, spentHours: 190, health: 'healthy' },
  { id: 'squad_d', name: 'Squad D (Cloud Infra & SRE)', lead: 'Elena Rostova', color: 'purple', project: 'Delta Cloud & SRE', projectCode: 'DELTA', budgetHours: 500, spentHours: 420, health: 'healthy' },
  { id: 'squad_e', name: 'Squad E (Security & QA Automation)', lead: 'Marcus Brody', color: 'amber', project: 'Echo SecOps & QA', projectCode: 'ECHO', budgetHours: 300, spentHours: 210, health: 'healthy' },
  { id: 'squad_f', name: 'Squad F (Machine Learning & AI)', lead: 'Chiranshi Thummar', color: 'rose', project: 'Squad F (Machine Learning)', projectCode: 'PROJECT', budgetHours: 350, spentHours: 120, health: 'healthy' }
];

function getSquadShortName(squad) {
  if (!squad) return '';
  const name = typeof squad === 'string' ? squad : (squad.name || '');
  return name.replace(/\s*\(.*\)/, '').trim();
}

function getSquadPillBadgeHtml(squad, extraClasses = '') {
  if (!squad) return '';
  let squadObj = null;
  if (typeof squad === 'object' && squad !== null) {
    squadObj = squad;
  } else if (typeof squad === 'string') {
    squadObj = SQUADS.find(s => s.id === squad) || SQUADS.find(s => s.name === squad || getSquadShortName(s.name) === getSquadShortName(squad));
  }
  if (!squadObj) return '';
  const shortName = getSquadShortName(squadObj);
  
  const squadColorMap = {
    squad_a: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
    squad_b: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100',
    squad_c: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
    squad_d: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
    squad_e: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
    squad_f: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
  };

  const colorMap = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
    rose: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
    cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100'
  };

  const colorClasses = (squadObj.id && squadColorMap[squadObj.id]) || (squadObj.color && colorMap[squadObj.color]) || 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100';
  
  return `<button onclick="switchManagerSquadHub('${squadObj.id}')" title="View ${shortName}" class="text-[10px] px-2.5 py-0.5 rounded-full font-semibold border flex-shrink-0 transition-colors ${colorClasses} ${extraClasses}">${shortName}</button>`;
}

let CLIENTS = [
  { id: 'c1', name: 'Alpha Corp (FinTech API)', code: 'ALPHA', health: 'at_risk', budgetHours: 320, spentHours: 280 },
  { id: 'c2', name: 'Beta Systems (E-Commerce)', code: 'BETA', health: 'healthy', budgetHours: 400, spentHours: 310 },
  { id: 'c3', name: 'Gamma Retail (POS Suite)', code: 'GAMMA', health: 'healthy', budgetHours: 250, spentHours: 190 },
  { id: 'c4', name: 'Delta Health (Telemedicine)', code: 'DELTA', health: 'healthy', budgetHours: 500, spentHours: 420 },
  { id: 'c5', name: 'Echo Logistics (Fleet Tracking)', code: 'ECHO', health: 'healthy', budgetHours: 300, spentHours: 210 },
  { id: 'c6', name: 'Zeta Media (Streaming Engine)', code: 'ZETA', health: 'healthy', budgetHours: 450, spentHours: 380 },
  { id: 'c7', name: 'Theta Auto (Connected Vehicle)', code: 'THETA', health: 'healthy', budgetHours: 350, spentHours: 290 },
  { id: 'c8', name: 'Iota Cloud (Enterprise SaaS)', code: 'IOTA', health: 'healthy', budgetHours: 600, spentHours: 490 },
  { id: 'c9', name: 'Kappa Edu (Learning Portal)', code: 'KAPPA', health: 'healthy', budgetHours: 200, spentHours: 150 },
  { id: 'c10', name: 'Omega Games (Multiplayer Backend)', code: 'OMEGA', health: 'healthy', budgetHours: 400, spentHours: 340 }
];

let DEVELOPERS = [
  // SQUAD A (10)
  { id: 'dev_12', name: 'Alex Chen', email: 'alex.chen@workdash.internal', squadId: 'squad_a', role: 'Senior Backend Engineer', initials: 'AC', recurringHours: 8.0 },
  { id: 'dev_13', name: 'Sara Connor', email: 'sara.c@workdash.internal', squadId: 'squad_a', role: 'API Developer', initials: 'SC', recurringHours: 6.0 },
  { id: 'dev_14', name: 'John Doe', email: 'john.d@workdash.internal', squadId: 'squad_a', role: 'Database Architect', initials: 'JD', recurringHours: 8.0 },
  { id: 'dev_15', name: 'Emily Watson', email: 'emily.w@workdash.internal', squadId: 'squad_a', role: 'Backend Engineer', initials: 'EW', recurringHours: 6.0 },
  { id: 'dev_16', name: 'Michael Brown', email: 'michael.b@workdash.internal', squadId: 'squad_a', role: 'Go / Microservices Specialist', initials: 'MB', recurringHours: 8.0 },
  { id: 'dev_17', name: 'Lisa Ray', email: 'lisa.r@workdash.internal', squadId: 'squad_a', role: 'Node.js Developer', initials: 'LR', recurringHours: 6.0 },
  { id: 'dev_18', name: 'Tom Hardy', email: 'tom.h@workdash.internal', squadId: 'squad_a', role: 'Python Data Engineer', initials: 'TH', recurringHours: 7.0 },
  { id: 'dev_19', name: 'Nina Dobrev', email: 'nina.d@workdash.internal', squadId: 'squad_a', role: 'Java Enterprise Engineer', initials: 'ND', recurringHours: 7.0 },
  { id: 'dev_20', name: 'Carlos Ruiz', email: 'carlos.r@workdash.internal', squadId: 'squad_a', role: 'Backend Security Engineer', initials: 'CR', recurringHours: 6.0 },
  { id: 'dev_21', name: 'Anna Bell', email: 'anna.b@workdash.internal', squadId: 'squad_a', role: 'GraphQL & API Gateway Dev', initials: 'AB', recurringHours: 6.0 },
  // SQUAD B (10)
  { id: 'dev_22', name: 'Kevin Vance', email: 'kevin.v@workdash.internal', squadId: 'squad_b', role: 'Senior React Architect', initials: 'KV', recurringHours: 6.0 },
  { id: 'dev_23', name: 'Priya Patel', email: 'priya.p@workdash.internal', squadId: 'squad_b', role: 'UI/UX Next.js Developer', initials: 'PP', recurringHours: 7.0 },
  { id: 'dev_24', name: 'Lucas Scott', email: 'lucas.s@workdash.internal', squadId: 'squad_b', role: 'Design System Lead', initials: 'LS', recurringHours: 8.0 },
  { id: 'dev_25', name: 'Chloe Decker', email: 'chloe.d@workdash.internal', squadId: 'squad_b', role: 'Frontend Engineer', initials: 'CD', recurringHours: 5.0 },
  { id: 'dev_26', name: 'Ethan Hunt', email: 'ethan.h@workdash.internal', squadId: 'squad_b', role: 'Web Performance Specialist', initials: 'EH', recurringHours: 6.0 },
  { id: 'dev_27', name: 'Zoe Saldana', email: 'zoe.s@workdash.internal', squadId: 'squad_b', role: 'Vue/Nuxt Specialist', initials: 'ZS', recurringHours: 6.0 },
  { id: 'dev_28', name: 'Liam Neeson', email: 'liam.n@workdash.internal', squadId: 'squad_b', role: 'Senior Frontend Dev', initials: 'LN', recurringHours: 7.0 },
  { id: 'dev_29', name: 'Mia Kafka', email: 'mia.k@workdash.internal', squadId: 'squad_b', role: 'Accessibility Engineer', initials: 'MK', recurringHours: 5.0 },
  { id: 'dev_30', name: 'Noah Centineo', email: 'noah.c@workdash.internal', squadId: 'squad_b', role: 'Tailwind & Motion UI Dev', initials: 'NC', recurringHours: 6.0 },
  { id: 'dev_31', name: 'Sophia Bush', email: 'sophia.b@workdash.internal', squadId: 'squad_b', role: 'State Management Specialist', initials: 'SB', recurringHours: 6.0 },
  // SQUAD C (10)
  { id: 'dev_32', name: 'Daniel Craig', email: 'daniel.c@workdash.internal', squadId: 'squad_c', role: 'Lead iOS Engineer (Swift)', initials: 'DC', recurringHours: 7.0 },
  { id: 'dev_33', name: 'Grace Hopper', email: 'grace.h@workdash.internal', squadId: 'squad_c', role: 'Lead Android Dev (Kotlin)', initials: 'GH', recurringHours: 7.0 },
  { id: 'dev_34', name: 'Chris Evans', email: 'chris.e@workdash.internal', squadId: 'squad_c', role: 'Flutter Specialist', initials: 'CE', recurringHours: 6.0 },
  { id: 'dev_35', name: 'Scarlett Joh', email: 'scarlett.j@workdash.internal', squadId: 'squad_c', role: 'React Native Dev', initials: 'SJ', recurringHours: 6.0 },
  { id: 'dev_36', name: 'Mark Ruffalo', email: 'mark.r@workdash.internal', squadId: 'squad_c', role: 'Mobile CI/CD Specialist', initials: 'MR', recurringHours: 6.0 },
  { id: 'dev_37', name: 'Natasha Roman', email: 'natasha.r@workdash.internal', squadId: 'squad_c', role: 'Mobile Security Engineer', initials: 'NR', recurringHours: 6.0 },
  { id: 'dev_38', name: 'Bruce Wayne', email: 'bruce.w@workdash.internal', squadId: 'squad_c', role: 'Bluetooth / IoT Mobile Dev', initials: 'BW', recurringHours: 8.0 },
  { id: 'dev_39', name: 'Diana Prince', email: 'diana.p@workdash.internal', squadId: 'squad_c', role: 'iOS CoreAnimation Dev', initials: 'DP', recurringHours: 5.0 },
  { id: 'dev_40', name: 'Barry Allen', email: 'barry.a@workdash.internal', squadId: 'squad_c', role: 'Offline Sync & SQLite Dev', initials: 'BA', recurringHours: 6.0 },
  { id: 'dev_41', name: 'Arthur Curry', email: 'arthur.c@workdash.internal', squadId: 'squad_c', role: 'Mobile Audio/Video Streaming', initials: 'AC', recurringHours: 6.0 },
  // SQUAD D (10)
  { id: 'dev_42', name: 'Steve Rogers', email: 'steve.r@workdash.internal', squadId: 'squad_d', role: 'Kubernetes Architect', initials: 'SR', recurringHours: 8.0 },
  { id: 'dev_43', name: 'Tony Stark', email: 'tony.s@workdash.internal', squadId: 'squad_d', role: 'AWS / Terraform Lead', initials: 'TS', recurringHours: 8.0 },
  { id: 'dev_44', name: 'Peter Parker', email: 'peter.p@workdash.internal', squadId: 'squad_d', role: 'Observability & Datadog SRE', initials: 'PP', recurringHours: 6.0 },
  { id: 'dev_45', name: 'Wanda Maximoff', email: 'wanda.m@workdash.internal', squadId: 'squad_d', role: 'Chaos Engineering & SRE', initials: 'WM', recurringHours: 7.0 },
  { id: 'dev_46', name: 'Stephen Strange', email: 'stephen.s@workdash.internal', squadId: 'squad_d', role: 'Multi-Region DB Failover SRE', initials: 'SS', recurringHours: 7.0 },
  { id: 'dev_47', name: 'Carol Danvers', email: 'carol.d@workdash.internal', squadId: 'squad_d', role: 'GCP Cloud Architect', initials: 'CD', recurringHours: 6.0 },
  { id: 'dev_48', name: 'Scott Lang', email: 'scott.l@workdash.internal', squadId: 'squad_d', role: 'Serverless & Lambda Specialist', initials: 'SL', recurringHours: 5.0 },
  { id: 'dev_49', name: 'Hope Van Dyne', email: 'hope.v@workdash.internal', squadId: 'squad_d', role: 'CI/CD Pipeline Optimizer', initials: 'HV', recurringHours: 6.0 },
  { id: 'dev_50', name: 'TChalla King', email: 'tchalla.k@workdash.internal', squadId: 'squad_d', role: 'Zero Trust Network Architect', initials: 'TK', recurringHours: 7.0 },
  { id: 'dev_51', name: 'Shuri Genius', email: 'shuri.g@workdash.internal', squadId: 'squad_d', role: 'AI Infrastructure & GPU SRE', initials: 'SG', recurringHours: 6.0 },
  // SQUAD E (10)
  { id: 'dev_52', name: 'James Rhodes', email: 'james.r@workdash.internal', squadId: 'squad_e', role: 'Lead QA Automation (Playwright)', initials: 'JR', recurringHours: 6.0 },
  { id: 'dev_53', name: 'Sam Wilson', email: 'sam.w@workdash.internal', squadId: 'squad_e', role: 'Performance & Load Testing (k6)', initials: 'SW', recurringHours: 6.0 },
  { id: 'dev_54', name: 'Bucky Barnes', email: 'bucky.b@workdash.internal', squadId: 'squad_e', role: 'Penetration Tester / SecOps', initials: 'BB', recurringHours: 7.0 },
  { id: 'dev_55', name: 'Clint Barton', email: 'clint.b@workdash.internal', squadId: 'squad_e', role: 'Security Vulnerability Auditor', initials: 'CB', recurringHours: 6.0 },
  { id: 'dev_56', name: 'Peggy Carter', email: 'peggy.c@workdash.internal', squadId: 'squad_e', role: 'API Contract Testing Specialist', initials: 'PC', recurringHours: 6.0 },
  { id: 'dev_57', name: 'Nick Fury', email: 'nick.f@workdash.internal', squadId: 'squad_e', role: 'SOC2 & Compliance Lead', initials: 'NF', recurringHours: 8.0 },
  { id: 'dev_58', name: 'Maria Hill', email: 'maria.h@workdash.internal', squadId: 'squad_e', role: 'End-to-End QA Engineer', initials: 'MH', recurringHours: 5.0 },
  { id: 'dev_59', name: 'Phil Coulson', email: 'phil.c@workdash.internal', squadId: 'squad_e', role: 'Regression Test Architect', initials: 'PC', recurringHours: 6.0 },
  { id: 'dev_60', name: 'Daisy Johnson', email: 'daisy.j@workdash.internal', squadId: 'squad_e', role: 'Mobile Automation (Appium)', initials: 'DJ', recurringHours: 6.0 },
  { id: 'dev_61', name: 'Melinda May', email: 'melinda.m@workdash.internal', squadId: 'squad_e', role: 'Security Incident Response Lead', initials: 'MM', recurringHours: 7.0 }
];

// Initial Tasks
let TASKS = [
  { 
    id: 'tsk_109', 
    title: 'Health Check & Prometheus Metrics Endpoint', 
    clientId: 'c1', 
    assignedTo: 'dev_12', 
    taskType: 'PRE_PLAN', 
    priority: 'P2_MEDIUM', 
    status: 'COMPLETED', 
    estimatedHours: 4.0, 
    loggedHours: 4.0, 
    assignedBy: 'Marcus Vance (Project Manager)',
    assignedAt: 'Sep 2, 2026 · 10:00 AM',
    dueDate: 'Sep 2, 2026', 
    completedAt: 'Sep 2, 2026 · 04:30 PM',
    isBlocked: false,
    isTimerRunning: false 
  },
  { 
    id: 'tsk_101', 
    title: 'Initial API Gateway Setup & Routing Middleware', 
    clientId: 'c1', 
    assignedTo: 'dev_12', 
    taskType: 'PRE_PLAN', 
    priority: 'P1_HIGH', 
    status: 'COMPLETED', 
    estimatedHours: 6.0, 
    loggedHours: 6.0, 
    assignedBy: 'Marcus Vance (Project Manager)',
    assignedAt: 'Sep 1, 2026 · 09:00 AM',
    dueDate: 'Sep 1, 2026', 
    completedAt: 'Sep 1, 2026 · 05:00 PM',
    isBlocked: false,
    isTimerRunning: false 
  },
  { 
    id: 'tsk_rec_101', 
    title: 'Daily Standup & Squad Sync', 
    clientId: 'c1', 
    assignedTo: 'dev_12', 
    taskType: 'RECURRING', 
    priority: 'P3_LOW', 
    status: 'COMPLETED', 
    estimatedHours: 2.5, 
    loggedHours: 2.5, 
    assignedBy: 'David Miller (Tech Lead)',
    assignedAt: 'Sep 1, 2026 · 09:00 AM',
    dueDate: 'Sep 2, 2026', 
    completedAt: 'Sep 2, 2026 · 10:00 AM',
    isBlocked: false,
    isTimerRunning: false 
  },
  { 
    id: 'tsk_rec_102', 
    title: 'PR Reviews & Mentoring Junior Devs', 
    clientId: 'c1', 
    assignedTo: 'dev_12', 
    taskType: 'RECURRING', 
    priority: 'P2_MEDIUM', 
    status: 'COMPLETED', 
    estimatedHours: 3.5, 
    loggedHours: 3.5, 
    assignedBy: 'David Miller (Tech Lead)',
    assignedAt: 'Sep 1, 2026 · 09:00 AM',
    dueDate: 'Sep 2, 2026', 
    completedAt: 'Sep 2, 2026 · 04:00 PM',
    isBlocked: false,
    isTimerRunning: false 
  },
  { 
    id: 'tsk_rec_103', 
    title: 'Weekly Sprint Planning & Backlog Grooming', 
    clientId: 'c1', 
    assignedTo: 'dev_12', 
    taskType: 'RECURRING', 
    priority: 'P3_LOW', 
    status: 'COMPLETED', 
    estimatedHours: 1.0, 
    loggedHours: 1.0, 
    assignedBy: 'Marcus Vance (Project Manager)',
    assignedAt: 'Sep 1, 2026 · 09:00 AM',
    dueDate: 'Sep 1, 2026', 
    completedAt: 'Sep 1, 2026 · 11:30 AM',
    isBlocked: false,
    isTimerRunning: false 
  },
  { 
    id: 'tsk_rec_105', 
    title: 'Engineering All-Hands Meeting', 
    clientId: 'c1', 
    assignedTo: 'dev_12', 
    taskType: 'RECURRING', 
    priority: 'P3_LOW', 
    status: 'TO_DO', 
    estimatedHours: 2.0, 
    loggedHours: 0.0, 
    assignedBy: 'Marcus Vance (Project Manager)',
    assignedAt: 'Sep 1, 2026 · 09:00 AM',
    dueDate: 'Sep 30, 2026', 
    isBlocked: false,
    isTimerRunning: false 
  },
  { 
    id: 'tsk_rec_106', 
    title: 'Quarterly OKR Review & Retrospective', 
    clientId: 'c1', 
    assignedTo: 'dev_12', 
    taskType: 'RECURRING', 
    priority: 'P3_LOW', 
    status: 'TO_DO', 
    estimatedHours: 1.5, 
    loggedHours: 0.0, 
    assignedBy: 'David Miller (Tech Lead)',
    assignedAt: 'Sep 1, 2026 · 09:00 AM',
    dueDate: 'Sep 30, 2026', 
    isBlocked: false,
    isTimerRunning: false 
  },
  { 
    id: 'tsk_102', 
    title: 'User Auth Middleware & Session Storage', 
    clientId: 'c1', 
    assignedTo: 'dev_12', 
    taskType: 'PRE_PLANNING', 
    priority: 'P1_HIGH', 
    status: 'IN_PROGRESS', 
    estimatedHours: 12.0, 
    loggedHours: 14.5, 
    assignedBy: 'Marcus Vance (Project Manager)',
    assignedAt: 'Sep 1, 2026 · 09:15 AM',
    dueDate: 'Sep 5, 2026 · 06:00 PM', 
    isBlocked: true,
    blockerCategory: 'RESOURCE_CAPACITY',
    blockerSeverity: 'CRITICAL_BLOCKER',
    incompleteReason: 'Client mid-sprint scope expansion requiring Redis sliding token invalidation and audit logging; awaiting client keys.',
    blockerImpact: '+2.5h budget overrun; blocks staging security audit and staging deploy.',
    expectedResolutionDate: 'Sep 5, 2026',
    mitigationAction: 'PM Marcus Vance escalated with Alpha Corp client lead for key approval.',
    blockerLoggedBy: 'Alex Chen',
    blockerLoggedAt: 'Sep 2, 2026 · 11:30 AM',
    isTimerRunning: false 
  },
  { 
    id: 'tsk_108', 
    title: 'Hotfix: OAuth Token Refresh Memory Leak', 
    clientId: 'c1', 
    assignedTo: 'dev_12', 
    taskType: 'AD_HOC_EMERGENCY', 
    priority: 'P1_HIGH', 
    status: 'IN_PROGRESS', 
    estimatedHours: 6.0, 
    loggedHours: 8.5, 
    assignedBy: 'Marcus Vance (Project Manager)',
    assignedAt: 'Sep 1, 2026 · 09:00 AM',
    dueDate: 'Sep 1, 2026 · 05:00 PM', 
    isBlocked: true,
    blockerCategory: 'TECHNICAL_IMPEDIMENT',
    blockerSeverity: 'CRITICAL_BLOCKER',
    incompleteReason: 'Token refresh loop had an unclosed circular WebSocket listener in external auth library; required custom teardown handlers.',
    blockerImpact: 'Missed Sep 1 deadline; potential memory leak under high concurrency.',
    expectedResolutionDate: 'Sep 3, 2026',
    mitigationAction: 'Pairing with SRE Stephen Strange on Wireshark socket teardown.',
    blockerLoggedBy: 'Alex Chen',
    blockerLoggedAt: 'Sep 2, 2026 · 02:15 PM',
    isTimerRunning: false 
  },
  { 
    id: 'tsk_103', 
    title: 'Database Partitioning & Migration Script', 
    clientId: 'c2', 
    assignedTo: 'dev_12', 
    taskType: 'PRE_PLANNING', 
    priority: 'P2_MEDIUM', 
    status: 'TO_DO', 
    estimatedHours: 8.0, 
    loggedHours: 0.0, 
    assignedBy: 'David Miller (Tech Lead)',
    assignedAt: 'Aug 31, 2026 · 11:00 AM',
    dueDate: 'Sep 1, 2026 · 06:00 PM', 
    isBlocked: true,
    blockerCategory: 'REVIEW_BOTTLENECK',
    blockerSeverity: 'CRITICAL_BLOCKER',
    incompleteReason: 'Staging database replica snapshot failed integrity validation on Aug 31; migration script was delayed.',
    blockerImpact: 'Migration script delayed by 2 days; blocks staging environment cutover.',
    expectedResolutionDate: 'Sep 4, 2026',
    mitigationAction: 'David Miller scheduled schema & index review for Thursday 2:00 PM.',
    blockerLoggedBy: 'Alex Chen',
    blockerLoggedAt: 'Sep 1, 2026 · 04:00 PM',
    isTimerRunning: false 
  },
  { 
    id: 'tsk_115', 
    title: 'Stripe Webhook Handler & Idempotency Key', 
    clientId: 'c2', 
    assignedTo: 'dev_15', 
    taskType: 'PROJECT_SPRINT', 
    priority: 'P2_MEDIUM', 
    status: 'IN_PROGRESS', 
    estimatedHours: 18.0, 
    loggedHours: 8.0, 
    assignedBy: 'Marcus Vance (Project Manager)',
    assignedAt: 'Sep 1, 2026 · 10:00 AM',
    dueDate: 'Sep 6, 2026', 
    isBlocked: true,
    blockerCategory: 'CLIENT_DEPENDENCY',
    blockerSeverity: 'HIGH',
    incompleteReason: 'Awaiting Stripe webhook signing secret key and test card sandbox whitelist from Beta Retail.',
    blockerImpact: 'Payment integration testing paused; checkout QA delayed by 24 hours.',
    expectedResolutionDate: 'Sep 6, 2026',
    mitigationAction: 'Follow-up email sent to Beta Retail integration director.',
    blockerLoggedBy: 'Emily Watson',
    blockerLoggedAt: 'Sep 2, 2026 · 09:45 AM',
    isTimerRunning: false 
  },
  { 
    id: 'tsk_115_done', 
    title: 'Cart Session Storage & Redis Cluster Cache', 
    clientId: 'c2', 
    assignedTo: 'dev_15', 
    taskType: 'PROJECT_SPRINT', 
    priority: 'P2_MEDIUM', 
    status: 'COMPLETED', 
    estimatedHours: 12.0, 
    loggedHours: 12.0, 
    assignedBy: 'David Miller (Tech Lead)',
    assignedAt: 'Aug 31, 2026 · 09:00 AM',
    dueDate: 'Sep 2, 2026', 
    completedAt: 'Sep 2, 2026 · 03:30 PM',
    isBlocked: false,
    isTimerRunning: false 
  },
  { 
    id: 'tsk_114_a', 
    title: 'Multi-Tenant DB Sharding Layer', 
    clientId: 'c4', 
    assignedTo: 'dev_14', 
    taskType: 'PROJECT_SPRINT', 
    priority: 'P1_HIGH', 
    status: 'IN_PROGRESS', 
    estimatedHours: 24.0, 
    loggedHours: 16.0, 
    assignedBy: 'Marcus Vance (Project Manager)',
    assignedAt: 'Aug 30, 2026 · 09:00 AM',
    dueDate: 'Sep 4, 2026', 
    isBlocked: true,
    blockerCategory: 'TECHNICAL_IMPEDIMENT',
    blockerSeverity: 'HIGH',
    incompleteReason: 'Database replication synchronization lag on staging replica cluster.',
    blockerImpact: 'Write latency spike (>350ms); risk to high-throughput load test milestone.',
    expectedResolutionDate: 'Sep 4, 2026',
    mitigationAction: 'Re-indexing shard key partition indexes with DBA team.',
    blockerLoggedBy: 'John Doe',
    blockerLoggedAt: 'Sep 2, 2026 · 01:00 PM',
    isTimerRunning: false 
  },
  { 
    id: 'tsk_114_b', 
    title: 'Redis Cluster Failover Benchmark', 
    clientId: 'c8', 
    assignedTo: 'dev_14', 
    taskType: 'PROJECT_SPRINT', 
    priority: 'P2_MEDIUM', 
    status: 'TO_DO', 
    estimatedHours: 14.0, 
    loggedHours: 0.0, 
    assignedBy: 'David Miller (Tech Lead)',
    assignedAt: 'Aug 31, 2026 · 02:00 PM',
    dueDate: 'Sep 7, 2026', 
    isBlocked: true,
    blockerCategory: 'RESOURCE_CAPACITY',
    blockerSeverity: 'MEDIUM',
    incompleteReason: 'Scheduled to commence immediately after sharding layer passes automated failover tests.',
    blockerImpact: 'Benchmark delayed by 1 day; non-critical path.',
    expectedResolutionDate: 'Sep 7, 2026',
    mitigationAction: 'Provisioning staging benchmark worker nodes in parallel.',
    blockerLoggedBy: 'John Doe',
    blockerLoggedAt: 'Sep 2, 2026 · 10:15 AM',
    isTimerRunning: false 
  },
  { 
    id: 'tsk_114_c', 
    title: 'Hotfix: Deadlock on Concurrent Booking Rows', 
    clientId: 'c4', 
    assignedTo: 'dev_14', 
    taskType: 'AD_HOC_EMERGENCY', 
    priority: 'P1_HIGH', 
    status: 'COMPLETED', 
    estimatedHours: 2.0, 
    loggedHours: 2.0, 
    assignedBy: 'Marcus Vance (Project Manager)',
    assignedAt: 'Sep 1, 2026 · 01:15 PM',
    dueDate: 'Sep 2, 2026', 
    completedAt: 'Sep 2, 2026 · 02:45 PM',
    isBlocked: false,
    isTimerRunning: false 
  }
];

// Populate remaining developer workloads with realistic completion & distinct features
DEVELOPERS.forEach(dev => {
  if (['dev_12', 'dev_15', 'dev_14'].includes(dev.id)) return;
  const hash = dev.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const sprintH = (hash % 4 === 0) ? 28.0 : (hash % 3 === 0) ? 18.0 : 24.0;
  const adhocH = (hash % 5 === 0) ? 4.0 : 0.0;
  const ci = hash % CLIENTS.length;

  const isCompleted = (hash % 3 === 1);

  const featureTitles = [
    'GraphQL API Gateway & Schema Federation',
    'Checkout Payment Flow & Order Confirmation',
    'Real-time WebSocket Notification Dispatcher',
    'Kubernetes Cluster Autoscaler & Helm Charts',
    'Search Index Ingestion & Elastic Pipeline',
    'Design System Tokens & Theme Switcher',
    'Multi-Currency Exchange Rate Sync Service',
    'Audit Log Streaming & SIEM Integration',
    'User Profile & Identity Verification Flow',
    'S3 Asset Upload & CDN Optimization Worker'
  ];
  const featureTitle = featureTitles[hash % featureTitles.length];

  // Specific single realistic blocker for Daniel Craig (dev_13)
  const isSpecialBlocked = (dev.id === 'dev_13');

  // Completed Core Task
  TASKS.push({ 
    id: `tsk_gen_done_${dev.id}`, 
    title: `${featureTitle.split('&')[0].trim()} Foundations`, 
    clientId: CLIENTS[ci].id, 
    assignedTo: dev.id, 
    taskType: 'PROJECT_SPRINT', 
    priority: 'P2_MEDIUM', 
    status: 'COMPLETED', 
    estimatedHours: 6.0, 
    loggedHours: 6.0, 
    assignedBy: 'Marcus Vance (Project Manager)',
    assignedAt: 'Sep 1, 2026 · 09:00 AM',
    dueDate: 'Sep 2, 2026', 
    completedAt: 'Sep 2, 2026 · 05:00 PM',
    isBlocked: false,
    isTimerRunning: false 
  });

  // Active Sprint Task
  TASKS.push({ 
    id: `tsk_gen_${dev.id}`, 
    title: isSpecialBlocked ? 'CI/CD Container Build & Matrix Test Pipeline' : featureTitle, 
    clientId: CLIENTS[ci].id, 
    assignedTo: dev.id, 
    taskType: 'PROJECT_SPRINT', 
    priority: isSpecialBlocked ? 'P1_HIGH' : 'P2_MEDIUM', 
    status: isCompleted && !isSpecialBlocked ? 'COMPLETED' : 'IN_PROGRESS', 
    estimatedHours: sprintH, 
    loggedHours: isCompleted && !isSpecialBlocked ? sprintH : cleanHours(Math.min(sprintH * 0.4, 12)), 
    assignedBy: 'Marcus Vance (Project Manager)',
    assignedAt: 'Sep 1, 2026 · 09:00 AM',
    dueDate: 'Sep 5, 2026', 
    completedAt: isCompleted && !isSpecialBlocked ? 'Sep 2, 2026 · 04:00 PM' : null,
    isBlocked: isSpecialBlocked,
    blockerCategory: isSpecialBlocked ? 'INFRASTRUCTURE' : null,
    blockerSeverity: isSpecialBlocked ? 'HIGH' : null,
    incompleteReason: isSpecialBlocked ? 'Runner out-of-memory error during Docker image build in Actions pipeline.' : 'Task actively in development.',
    blockerImpact: isSpecialBlocked ? '+2h delay on staging deployment' : null,
    expectedResolutionDate: 'Sep 7, 2026',
    mitigationAction: isSpecialBlocked ? 'DevOps upgraded GitHub Action runner memory limit to 8GB.' : null,
    blockerLoggedBy: dev.name,
    blockerLoggedAt: 'Sep 2, 2026 · 10:00 AM',
    isTimerRunning: false 
  });

  if (adhocH > 0) {
    TASKS.push({ 
      id: `tsk_gen_adhoc_${dev.id}`, 
      title: `Maintenance on ${CLIENTS[ci].name}`, 
      clientId: CLIENTS[ci].id, 
      assignedTo: dev.id, 
      taskType: 'AD_HOC_EMERGENCY', 
      priority: 'P1_HIGH', 
      status: 'IN_PROGRESS', 
      estimatedHours: adhocH, 
      loggedHours: 1.5, 
      assignedBy: 'David Miller (Tech Lead)',
      assignedAt: 'Sep 1, 2026 · 11:30 AM',
      dueDate: 'Sep 3, 2026', 
      isBlocked: false,
      incompleteReason: 'Ad-hoc patch in progress, awaiting test verification.',
      isTimerRunning: false 
    });
  }

  // Generate recurring routine tasks for all developers with recurringHours
  if (dev.recurringHours > 0) {
    const standupH = cleanHours(dev.recurringHours * 0.4);
    const prReviewH = cleanHours(dev.recurringHours - standupH);
    TASKS.push({
      id: `tsk_gen_rec1_${dev.id}`,
      title: `Daily Standup & Architecture Sync`,
      clientId: CLIENTS[ci].id,
      assignedTo: dev.id,
      taskType: 'RECURRING',
      priority: 'P3_LOW',
      status: 'COMPLETED',
      estimatedHours: standupH,
      loggedHours: standupH,
      assignedBy: 'David Miller (Tech Lead)',
      assignedAt: 'Sep 1, 2026 · 09:00 AM',
      dueDate: 'Sep 2, 2026',
      completedAt: 'Sep 2, 2026 · 10:00 AM',
      isBlocked: false,
      isTimerRunning: false
    });
    TASKS.push({
      id: `tsk_gen_rec2_${dev.id}`,
      title: `PR Code Reviews & Quality Mentoring`,
      clientId: CLIENTS[ci].id,
      assignedTo: dev.id,
      taskType: 'RECURRING',
      priority: 'P2_MEDIUM',
      status: 'IN_PROGRESS',
      estimatedHours: prReviewH,
      loggedHours: cleanHours(prReviewH * 0.5),
      assignedBy: 'David Miller (Tech Lead)',
      assignedAt: 'Sep 1, 2026 · 09:00 AM',
      dueDate: 'Sep 5, 2026',
      isBlocked: false,
      isTimerRunning: false
    });
  }
});

let WORK_LOGS = [
  { id: 'log_1', taskId: 'tsk_102', developerId: 'dev_12', devName: 'Alex Chen', taskTitle: 'User Auth Middleware & Session Storage', hours: 4.5, notes: 'Implemented Redis cluster session store with sliding token expiration & benchmark tests.', timestamp: 'Today, 09:30 AM', clientCode: 'ALPHA' },
  { id: 'log_2', taskId: 'tsk_102', developerId: 'dev_12', devName: 'Alex Chen', taskTitle: 'User Auth Middleware & Session Storage', hours: 10.0, notes: 'Created JWT signing, asymmetric RSA key rotation, and session invalidation endpoints.', timestamp: 'Yesterday, 02:00 PM', clientCode: 'ALPHA' },
  { id: 'log_3', taskId: 'tsk_109', developerId: 'dev_12', devName: 'Alex Chen', taskTitle: 'Health Check & Prometheus Metrics Endpoint', hours: 4.0, notes: 'Configured Prometheus /metrics endpoint and Kubernetes liveness/readiness probes.', timestamp: 'Today, 04:30 PM', clientCode: 'ALPHA' },
  { id: 'log_4', taskId: 'tsk_108', developerId: 'dev_12', devName: 'Alex Chen', taskTitle: 'Hotfix: OAuth Token Refresh Memory Leak', hours: 4.0, notes: 'Identified unclosed WebSocket listener during token refresh loop and applied cleanup hook.', timestamp: 'Yesterday, 04:15 PM', clientCode: 'ALPHA' },
  { id: 'log_5', taskId: 'tsk_101', developerId: 'dev_12', devName: 'Alex Chen', taskTitle: 'Initial API Gateway Setup & Routing Middleware', hours: 6.0, notes: 'Configured Express gateway router, CORS policies, rate limiting, and automated unit tests.', timestamp: 'Yesterday, 05:00 PM', clientCode: 'ALPHA' },
  { id: 'log_6', taskId: 'tsk_rec_101', developerId: 'dev_12', devName: 'Alex Chen', taskTitle: 'Daily Standup & Squad Sync', hours: 1.5, notes: 'Attended squad daily sync, unblocked PR for frontend auth flow.', timestamp: 'Today, 09:30 AM', clientCode: 'ALPHA' },
  { id: 'log_7', taskId: 'tsk_rec_102', developerId: 'dev_12', devName: 'Alex Chen', taskTitle: 'PR Reviews & Mentoring Junior Devs', hours: 2.0, notes: 'Reviewed 4 PRs for payment webhook validation & schema sanitization.', timestamp: 'Today, 03:00 PM', clientCode: 'ALPHA' },
  { id: 'log_8', taskId: 'tsk_rec_103', developerId: 'dev_12', devName: 'Alex Chen', taskTitle: 'Weekly Sprint Planning & Backlog Grooming', hours: 1.0, notes: 'Reviewed backlog items, estimated story points for sprint 18.', timestamp: 'Yesterday, 11:30 AM', clientCode: 'ALPHA' },
  { id: 'log_9', taskId: 'tsk_115', developerId: 'dev_15', devName: 'Emily Watson', taskTitle: 'Stripe Webhook Handler & Idempotency Key', hours: 4.0, notes: 'Configured Stripe signature verification middleware and idempotency Redis locks.', timestamp: 'Yesterday, 02:00 PM', clientCode: 'BETA' },
  { id: 'log_10', taskId: 'tsk_114_a', developerId: 'dev_14', devName: 'John Doe', taskTitle: 'Multi-Tenant DB Sharding Layer', hours: 6.0, notes: 'Optimized schema migration rollback logic for tenant partition isolation.', timestamp: 'Yesterday, 11:45 AM', clientCode: 'DELTA' }
];

const state = {
  currentRole: 'manager',
  currentDevId: 'dev_12',
  currentManagerSquadId: 'squad_a',
  currentManagerDevId: 'dev_12',
  managerSquadTaskFilter: 'ALL',
  managerSquadTaskTypeFilter: 'ALL', // 'ALL' | 'PROJECT_SPRINT' | 'AD_HOC_EMERGENCY' | 'RECURRING'
  managerSquadPersonFilter: 'all',   // 'all' | developer ID
  managerSquadTaskViewMode: 'board', // 'board' (Kanban) | 'list' (Table) | 'grid' (Cards)
  managerDevTaskFilter: 'ALL',
  managerDevTaskTypeFilter: 'ALL',   // 'ALL' | 'PROJECT_SPRINT' | 'AD_HOC_EMERGENCY' | 'RECURRING'
  managerDevTaskViewMode: 'board',   // 'board' (Kanban) | 'list' (Table) | 'grid' (Cards)
  managerDevChartPeriod: 'week',
  managerSelectedDate: '2026-09-02',  // ISO string e.g. '2026-09-02' or 'ALL'
  managerDateViewMode: 'grouped',     // 'grouped' (Group by Person) | 'matrix' (Task Matrix List)
  managerDateSquadFilter: 'all',
  managerDateStatusFilter: 'ALL',
  managerDateSearchQuery: '',
  managerBlockerSquadFilter: 'all',
  managerBlockerCategoryFilter: 'all',
  managerBlockerStatusFilter: 'ALL_BLOCKED', // 'ALL_BLOCKED' | 'CRITICAL' | 'RISKS' | 'ALL_TASKS'
  managerBlockerViewMode: 'matrix',          // 'matrix' (Action Table) | 'cards' (Cards)
  managerBlockerSearchQuery: '',
  expandedBlockerIds: new Set(),
  editingBlockerTaskId: null,
  selectedTaskId: null,        // task ID whose logs are currently filtered, or null for all
  devTaskFilter: 'ALL',
  devTaskViewMode: 'board',    // 'board' (Kanban) | 'list' (Table) | 'grid' (Cards)
  devDateFilter: null,         // ISO date string or null
  recurringFilter: 'all',      // 'all' | 'daily' | 'weekly' | 'monthly'
  recurringSidebarFilter: 'daily',
  hoursChartView: 'week',
  selectedSquadFilter: 'all',
  selectedCapacityFilter: 'all',
  searchQuery: '',
  activeTab: 'roster',
  templateCategoryFilter: 'ALL',
  rosterViewMode: 'table',
  drawerDevId: null,
  activeTimer: { taskId: 'tsk_102', secondsElapsed: 5078, intervalId: null, isRunning: true }
};

// Chart instances (to allow re-rendering)
let chartDonut = null;
let chartBar = null;
let chartRing = null;
let chartSquadDonut = null;
let chartSquadBar = null;
let chartMgrDevDonut = null;
let chartMgrDevBar = null;



// ═══════════════════════════════════════════════════════════
// CAPACITY ENGINE
// ═══════════════════════════════════════════════════════════

function getDeveloperCapacity(devId) {
  const dev = DEVELOPERS.find(d => d.id === devId);
  if (!dev) return null;
  const tasks = TASKS.filter(t => t.assignedTo === devId);
  const sprintHours = tasks.filter(t => (t.taskType === 'PRE_PLANNING' || t.taskType === 'PRE_PLAN' || t.taskType === 'PROJECT_SPRINT') && t.status !== 'COMPLETED').reduce((s, t) => s + t.estimatedHours, 0);
  const adhocHours = tasks.filter(t => t.taskType === 'AD_HOC_EMERGENCY' && t.status !== 'COMPLETED').reduce((s, t) => s + t.estimatedHours, 0);
  const pendingHours = tasks.filter(t => t.status === 'PENDING_REVIEW' || t.status === 'PENDING_ACCEPTANCE').reduce((s, t) => s + t.estimatedHours, 0);
  const totalLoad = dev.recurringHours + sprintHours + adhocHours + pendingHours;
  const max = 40.0;
  return {
    developer: dev, recurringHours: dev.recurringHours, sprintHours, adhocHours, pendingHours, totalLoad,
    maxCapacity: max,
    availableBuffer: Math.max(0, max - totalLoad),
    overage: Math.max(0, totalLoad - max),
    utilizationPct: Math.round((totalLoad / max) * 100),
    isOverallocated: totalLoad > max,
    isNearCapacity: totalLoad >= 36.0 && totalLoad <= max
  };
}

function simulateAssignment(devId, hrs) {
  const cur = getDeveloperCapacity(devId);
  const simTotal = cur.totalLoad + hrs;
  const alts = DEVELOPERS.filter(d => d.squadId === cur.developer.squadId && d.id !== devId)
    .map(d => getDeveloperCapacity(d.id)).filter(c => c.availableBuffer >= hrs).sort((a, b) => b.availableBuffer - a.availableBuffer);
  return { current: cur, newEstimatedHours: hrs, simulatedTotal: simTotal, simulatedOverage: Math.max(0, simTotal - 40), simulatedRemaining: Math.max(0, 40 - simTotal), isOverallocated: simTotal > 40, alternatives: alts };
}


// ═══════════════════════════════════════════════════════════
// UI CONTROLLER
// ═══════════════════════════════════════════════════════════

function initApp() {
  loadAppState();
  populateDeveloperDropdowns();
  renderNavigation();
  renderSidebarSquads();
  renderSquadDropdowns();
  renderKPIs();
  renderRoster();
  renderDeveloperFuelGauge();
  renderDeveloperTasks();
  renderDeveloperWorkLogs();
  renderClientsTab();
  renderBlockersBadge();
  renderBlockerTemplatePills();
  startGlobalTimer();
  setupKeyboardShortcuts();
}

// ─── View & Tab Switching ───

function switchViewRole(role) {
  state.currentRole = role;
  const mgr = document.getElementById('view-manager');
  const dev = document.getElementById('view-developer');
  const bMgr = document.getElementById('btn-role-mgr');
  const bDev = document.getElementById('btn-role-dev');

  const active = 'px-3.5 py-2 rounded-md text-sm font-semibold bg-white text-slate-800 shadow-sm transition-all flex items-center gap-2';
  const inactive = 'px-3.5 py-2 rounded-md text-sm font-medium text-slate-500 hover:text-slate-700 transition-all flex items-center gap-2';

  if (role === 'manager') {
    mgr.classList.remove('hidden'); dev.classList.add('hidden');
    bMgr.className = active; bDev.className = inactive;
    document.getElementById('header-user-name').innerText = 'Marcus Vance';
    document.getElementById('header-user-sub').innerText = 'Project Manager';
    document.getElementById('header-avatar').innerText = 'PM';
    document.getElementById('header-view-title').innerText = 'Capacity Heatmap';
    document.getElementById('sidebar-nav-manager').classList.remove('hidden');
    document.getElementById('sidebar-nav-developer').classList.add('hidden');
    document.getElementById('sidebar-footer-manager').classList.remove('hidden');
    document.getElementById('sidebar-footer-developer').classList.add('hidden');
    renderSidebarSquads();
    renderSquadDropdowns();
    renderKPIs();
    renderRoster();
    renderBlockersBadge();
  } else {
    dev.classList.remove('hidden'); mgr.classList.add('hidden');
    bDev.className = active; bMgr.className = inactive;
    document.getElementById('header-user-name').innerText = 'Alex Chen';
    document.getElementById('header-user-sub').innerText = 'Senior Backend Engineer';
    document.getElementById('header-avatar').innerText = 'AC';
    document.getElementById('header-view-title').innerText = 'Personal Capacity Hub';
    document.getElementById('sidebar-nav-developer').classList.remove('hidden');
    document.getElementById('sidebar-nav-manager').classList.add('hidden');
    document.getElementById('sidebar-footer-developer').classList.remove('hidden');
    document.getElementById('sidebar-footer-manager').classList.add('hidden');
    renderDeveloperFuelGauge();
    renderDeveloperTasks();
    renderDeveloperWorkLogs();
    renderDevAnalyticsDashboard();
    renderRecurringSidebar();
    renderDeadlineTimeline();
  }
}

function switchDeveloperSection(sectionId, btnEl) {
  const target = document.getElementById(sectionId);
  if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });

  document.querySelectorAll('.devnav-btn').forEach(b => {
    b.classList.remove('bg-blue-50', 'text-blue-700', 'font-semibold');
    b.classList.add('text-slate-600', 'font-medium');
  });
  if (btnEl) {
    btnEl.classList.add('bg-blue-50', 'text-blue-700', 'font-semibold');
    btnEl.classList.remove('text-slate-600', 'font-medium');
  }
}

function switchManagerTab(tab) {
  state.activeTab = tab;
  ['roster', 'squads_hub', 'dev_hub', 'date_schedule', 'clients', 'blockers', 'templates'].forEach(t => {
    const el = document.getElementById(`tab-content-${t}`);
    const btn = document.getElementById(`nav-btn-${t}`);
    const isActive = t === tab;
    if (el) el.classList.toggle('hidden', !isActive);
    if (btn) {
      btn.className = isActive
        ? 'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold bg-blue-50 text-blue-700 transition-colors'
        : 'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors';
    }
  });

  const titles = {
    roster: 'Capacity Heatmap',
    squads_hub: 'Teams & Squads Hub',
    dev_hub: 'Engineer 360° Management Hub',
    date_schedule: 'Date & Schedule Task Dispatcher',
    clients: 'Client SLA Portal',
    blockers: 'Task Completion & Blocker Intelligence',
    templates: 'Task Template Library'
  };
  const titleEl = document.getElementById('header-view-title');
  if (titleEl) titleEl.innerText = titles[tab] || 'Operations';

  if (tab === 'roster') {
    renderRoster();
  } else if (tab === 'squads_hub') {
    renderSquadsHub();
  } else if (tab === 'dev_hub') {
    renderManagerDevHub();
  } else if (tab === 'date_schedule') {
    renderManagerDateScheduleHub();
  } else if (tab === 'clients') {
    renderClientsTab();
  } else if (tab === 'blockers') {
    renderBlockersTab();
  } else if (tab === 'templates') {
    renderTemplateLibrary();
  }
}

function switchRosterView(mode) {
  state.rosterViewMode = mode;
  const tEl = document.getElementById('roster-view-table');
  const gEl = document.getElementById('roster-view-grid');
  const bT = document.getElementById('btn-view-table');
  const bG = document.getElementById('btn-view-grid');
  const activeBtn = 'p-1.5 rounded-md bg-white text-blue-600 shadow-sm text-xs px-2.5 flex items-center gap-1 font-semibold';
  const inactiveBtn = 'p-1.5 rounded-md text-slate-500 text-xs px-2.5 flex items-center gap-1';
  if (mode === 'table') {
    tEl.classList.remove('hidden'); gEl.classList.add('hidden');
    bT.className = activeBtn; bG.className = inactiveBtn;
  } else {
    gEl.classList.remove('hidden'); tEl.classList.add('hidden');
    bG.className = activeBtn; bT.className = inactiveBtn;
  }
  renderRoster();
}

function filterByCapacityStatus(status) {
  state.selectedCapacityFilter = status;
  ['all', 'over', 'avail'].forEach(s => {
    const b = document.getElementById(`btn-filter-${s}`);
    if (b) b.className = (s === status) ? 'px-2 py-1 rounded-md bg-white text-slate-700 font-semibold shadow-sm' : 'px-2 py-1 rounded-md text-slate-500 font-medium hover:bg-white/60';
  });
  renderRoster();
}

function filterBySquadSidebar(squadId) {
  state.currentManagerSquadId = squadId;
  switchManagerSquadHub(squadId);
  renderSidebarSquads();
}

function filterBySquadSelect(squadId) {
  state.selectedSquadFilter = squadId;
  renderRoster();
  renderSidebarSquads();
}


// ─── KPI Rendering ───

function renderKPIs() {
  let totalAlloc = 0, overCount = 0;
  DEVELOPERS.forEach(d => { const c = getDeveloperCapacity(d.id); totalAlloc += c.totalLoad; if (c.isOverallocated) overCount++; });
  const totalCap = DEVELOPERS.length * 40;
  document.getElementById('kpi-total-devs').innerText = DEVELOPERS.length;
  document.getElementById('kpi-utilization-pct').innerText = `${((totalAlloc / totalCap) * 100).toFixed(1)}%`;
  document.getElementById('kpi-utilization-sub').innerText = `${totalAlloc.toFixed(0)}h / ${totalCap}h allocated`;
  document.getElementById('kpi-overallocated-count').innerText = overCount;
  
  const squadsKpi = document.getElementById('kpi-squads-count');
  if (squadsKpi) {
    squadsKpi.innerHTML = `<span>${SQUADS.length} Squads</span><span class="text-slate-300">•</span><span>${SQUADS.length} Leads</span>`;
  }
  const squadNavBadge = document.getElementById('nav-badge-squads-count');
  if (squadNavBadge) squadNavBadge.innerText = SQUADS.length;
}


// ═══════════════════════════════════════════════════════════
// TEAM / SQUAD CREATION & MANAGEMENT
// ═══════════════════════════════════════════════════════════

const SQUAD_COLORS = [
  { id: 'indigo', name: 'Indigo', bg: 'bg-indigo-500', ring: 'ring-indigo-400' },
  { id: 'blue',   name: 'Blue',   bg: 'bg-blue-500',   ring: 'ring-blue-400' },
  { id: 'purple', name: 'Purple', bg: 'bg-purple-500', ring: 'ring-purple-400' },
  { id: 'emerald',name: 'Emerald',bg: 'bg-emerald-500',ring: 'ring-emerald-400' },
  { id: 'amber',  name: 'Amber',  bg: 'bg-amber-500',  ring: 'ring-amber-400' },
  { id: 'rose',   name: 'Rose',   bg: 'bg-rose-500',   ring: 'ring-rose-400' },
  { id: 'cyan',   name: 'Cyan',   bg: 'bg-cyan-500',   ring: 'ring-cyan-400' },
  { id: 'orange', name: 'Orange', bg: 'bg-orange-500', ring: 'ring-orange-400' }
];

let selectedSquadColor = 'indigo';
let selectedSquadDevIds = new Set();

function renderSidebarSquads() {
  const container = document.getElementById('sidebar-squad-list');
  if (!container) return;

  const colorClasses = {
    blue: 'bg-blue-500',
    indigo: 'bg-indigo-500',
    emerald: 'bg-emerald-500',
    purple: 'bg-purple-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    cyan: 'bg-cyan-500',
    orange: 'bg-orange-500'
  };

  container.innerHTML = SQUADS.map(s => {
    const squadDevs = DEVELOPERS.filter(d => d.squadId === s.id);
    const totalCap = squadDevs.length * 40;
    let totalAlloc = 0;
    squadDevs.forEach(d => {
      totalAlloc += getDeveloperCapacity(d.id).totalLoad;
    });
    const utilPct = totalCap > 0 ? Math.round((totalAlloc / totalCap) * 100) : 0;
    const isSelected = state.selectedSquadFilter === s.id;
    const dotColor = colorClasses[s.color] || 'bg-indigo-500';

    return `
      <button onclick="filterBySquadSidebar('${s.id}')" 
        class="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all ${
          isSelected ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-50 font-medium'
        }">
        <span class="flex items-center gap-2.5 min-w-0">
          <span class="h-2.5 w-2.5 rounded-full ${dotColor} flex-shrink-0"></span>
          <span class="truncate text-left">${s.name.replace(/\s\(.*\)/, '')}</span>
        </span>
        <span class="text-xs font-mono ${utilPct >= 95 ? 'text-rose-600 font-bold' : utilPct >= 80 ? 'text-amber-600 font-bold' : 'text-slate-400'} flex-shrink-0">
          ${utilPct}%
        </span>
      </button>
    `;
  }).join('');
}

function renderSquadDropdowns() {
  const rosterSelect = document.getElementById('roster-squad-select');
  if (rosterSelect) {
    const curVal = rosterSelect.value || 'all';
    rosterSelect.innerHTML = `
      <option value="all">All Squads (${SQUADS.length})</option>
      ${SQUADS.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
    `;
    rosterSelect.value = SQUADS.some(s => s.id === curVal) ? curVal : 'all';
  }
}

function openCreateSquadModal() {
  selectedSquadColor = 'indigo';
  selectedSquadDevIds.clear();

  const nameInput = document.getElementById('create-squad-name');
  const focusInput = document.getElementById('create-squad-focus');
  const leadSelect = document.getElementById('create-squad-lead');
  const searchInput = document.getElementById('create-squad-dev-search');

  if (nameInput) nameInput.value = '';
  if (focusInput) focusInput.value = '';
  if (searchInput) searchInput.value = '';

  // Populate Lead Select
  if (leadSelect) {
    leadSelect.innerHTML = `
      <option value="" disabled selected>Select a Tech Lead...</option>
      ${DEVELOPERS.map(d => `<option value="${d.name}">${d.name} (${d.role})</option>`).join('')}
    `;
  }

  renderSquadColorPicker();
  renderCreateSquadDevList('');
  updateCreateSquadMemberBadge();

  const modal = document.getElementById('modal-create-squad');
  if (modal) modal.classList.remove('hidden');
}

function closeCreateSquadModal() {
  const modal = document.getElementById('modal-create-squad');
  if (modal) modal.classList.add('hidden');
}

function renderSquadColorPicker() {
  const container = document.getElementById('create-squad-color-picker');
  if (!container) return;

  container.innerHTML = SQUAD_COLORS.map(c => `
    <button type="button" onclick="selectSquadColor('${c.id}')"
      title="${c.name}"
      class="w-7 h-7 rounded-full ${c.bg} transition-transform ${selectedSquadColor === c.id ? 'ring-4 ' + c.ring + ' scale-110 shadow-sm' : 'hover:scale-105 opacity-80 hover:opacity-100'}">
    </button>
  `).join('');
}

function selectSquadColor(colorId) {
  selectedSquadColor = colorId;
  renderSquadColorPicker();
}

function renderCreateSquadDevList(query = '') {
  const container = document.getElementById('create-squad-dev-list');
  if (!container) return;

  const q = (query || '').toLowerCase().trim();
  const devs = DEVELOPERS.filter(d => {
    if (!q) return true;
    const curSquad = SQUADS.find(s => s.id === d.squadId);
    return d.name.toLowerCase().includes(q) || d.role.toLowerCase().includes(q) || (curSquad && curSquad.name.toLowerCase().includes(q));
  });

  if (!devs.length) {
    container.innerHTML = '<div class="text-xs text-slate-400 font-mono text-center py-4">No engineers matching query.</div>';
    return;
  }

  container.innerHTML = devs.map(d => {
    const curSquad = SQUADS.find(s => s.id === d.squadId);
    const isChecked = selectedSquadDevIds.has(d.id);
    return `
      <label class="flex items-center justify-between p-2.5 rounded-xl ${isChecked ? 'bg-indigo-50/80 border border-indigo-200' : 'bg-white border border-slate-100 hover:border-slate-200'} cursor-pointer transition-all">
        <div class="flex items-center gap-3 min-w-0">
          <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="toggleCreateSquadDev('${d.id}')" class="rounded accent-indigo-600 w-4 h-4 cursor-pointer">
          <div class="w-7 h-7 rounded-full bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center font-mono flex-shrink-0">
            ${d.initials || 'DEV'}
          </div>
          <div class="min-w-0">
            <div class="text-xs font-bold text-slate-900 truncate">${d.name}</div>
            <div class="text-[11px] text-slate-500 font-mono truncate">${d.role}</div>
          </div>
        </div>
        <span class="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full ${isChecked ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'} flex-shrink-0">
          ${curSquad ? curSquad.name.replace(/\s\(.*\)/, '') : 'Unassigned'}
        </span>
      </label>
    `;
  }).join('');
}

function filterCreateSquadDevList(query) {
  renderCreateSquadDevList(query);
}

function toggleCreateSquadDev(devId) {
  if (selectedSquadDevIds.has(devId)) {
    selectedSquadDevIds.delete(devId);
  } else {
    selectedSquadDevIds.add(devId);
  }
  updateCreateSquadMemberBadge();
  const searchInput = document.getElementById('create-squad-dev-search');
  renderCreateSquadDevList(searchInput ? searchInput.value : '');
}

function updateCreateSquadMemberBadge() {
  const badge = document.getElementById('create-squad-member-badge');
  if (badge) {
    const count = selectedSquadDevIds.size;
    badge.innerText = `${count} selected (${count * 40}h weekly cap)`;
  }
}

function submitCreateSquad() {
  const nameInput = document.getElementById('create-squad-name');
  const focusInput = document.getElementById('create-squad-focus');
  const leadSelect = document.getElementById('create-squad-lead');

  const name = nameInput ? nameInput.value.trim() : '';
  const focus = focusInput ? focusInput.value.trim() : '';
  const lead = leadSelect ? leadSelect.value : '';

  if (!name) {
    showToast('⚠️ Please provide a Team / Squad Name.');
    if (nameInput) nameInput.focus();
    return;
  }

  if (!lead) {
    showToast('⚠️ Please designate a Tech Lead for this squad.');
    if (leadSelect) leadSelect.focus();
    return;
  }

  const squadId = `squad_${Date.now().toString(36)}`;
  const fullName = focus ? `${name} (${focus})` : name;

  // Add to SQUADS
  SQUADS.push({
    id: squadId,
    name: fullName,
    lead: lead,
    color: selectedSquadColor,
    focus: focus
  });

  // Assign selected developers to this squad
  selectedSquadDevIds.forEach(devId => {
    const dev = DEVELOPERS.find(d => d.id === devId);
    if (dev) {
      dev.squadId = squadId;
    }
  });

  // If lead is a developer, make sure they are in this squad if not already
  const leadDev = DEVELOPERS.find(d => d.name === lead);
  if (leadDev && !selectedSquadDevIds.has(leadDev.id)) {
    leadDev.squadId = squadId;
    selectedSquadDevIds.add(leadDev.id);
  }

  closeCreateSquadModal();
  renderSidebarSquads();
  renderSquadDropdowns();
  renderKPIs();
  renderRoster();

  showToast(`🎉 "${name}" created successfully with ${selectedSquadDevIds.size} engineers!`);
}

// ═══════════════════════════════════════════════════════════
// DATA PERSISTENCE & STORAGE SYSTEM
// ═══════════════════════════════════════════════════════════

function saveAppState() {
  try {
    const payload = {
      developers: DEVELOPERS,
      squads: SQUADS,
      tasks: TASKS,
      workLogs: WORK_LOGS,
      clients: CLIENTS,
      templates: TASK_TEMPLATES
    };
    localStorage.setItem('workdash_data_v2', JSON.stringify(payload));
  } catch (e) {
    console.warn('LocalStorage save failed:', e);
  }
}

function loadAppState() {
  try {
    const raw = localStorage.getItem('workdash_data_v2');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.developers && Array.isArray(parsed.developers) && parsed.developers.length) {
        DEVELOPERS = parsed.developers;
      }
      if (parsed.squads && Array.isArray(parsed.squads) && parsed.squads.length) {
        SQUADS = parsed.squads;
      }
      if (parsed.tasks && Array.isArray(parsed.tasks) && parsed.tasks.length) {
        TASKS = parsed.tasks;
      }
      if (parsed.workLogs && Array.isArray(parsed.workLogs) && parsed.workLogs.length) {
        WORK_LOGS = parsed.workLogs;
      }
      if (parsed.templates && typeof parsed.templates === 'object') {
        Object.keys(parsed.templates).forEach(key => {
          if (parsed.templates[key] && typeof parsed.templates[key] === 'object') {
            TASK_TEMPLATES[key] = { ...(TASK_TEMPLATES[key] || {}), ...parsed.templates[key] };
          }
        });
      }
    }
  } catch (e) {
    console.warn('LocalStorage load failed:', e);
  }
}

function resetAppStateToDefault() {
  try {
    localStorage.removeItem('workdash_data_v2');
    showToast('Reset data to enterprise default baseline! 🔄');
    setTimeout(() => window.location.reload(), 600);
  } catch (e) {
    window.location.reload();
  }
}

function populateDeveloperDropdowns() {
  // 1. Manager Dev Hub select
  const mgrDevSelect = document.getElementById('mgr-dev-select');
  if (mgrDevSelect) {
    const filterSquad = state.managerDevSquadFilter || 'ALL';
    const list = filterSquad === 'ALL' ? DEVELOPERS : DEVELOPERS.filter(d => d.squadId === filterSquad);
    mgrDevSelect.innerHTML = list.map(d => {
      const sq = SQUADS.find(s => s.id === d.squadId);
      const sqName = sq ? sq.name.replace(/\s\(.*\)/, '') : 'Unassigned';
      return `<option value="${d.id}" ${d.id === state.currentManagerDevId ? 'selected' : ''}>${d.name} (${sqName} · ${d.role})</option>`;
    }).join('');
  }

  // 2. Developer Workspace Switcher
  const devWorkspaceSwitcher = document.getElementById('dev-workspace-switcher');
  if (devWorkspaceSwitcher) {
    devWorkspaceSwitcher.innerHTML = DEVELOPERS.map(d => {
      const sq = SQUADS.find(s => s.id === d.squadId);
      const sqName = sq ? sq.name.replace(/\s\(.*\)/, '') : 'No Squad';
      return `<option value="${d.id}" ${d.id === state.currentDevId ? 'selected' : ''}>👤 ${d.name} (${sqName})</option>`;
    }).join('');
  }

  // 3. Create Dev Squad select
  const createDevSquad = document.getElementById('create-dev-squad');
  if (createDevSquad) {
    createDevSquad.innerHTML = SQUADS.map(s => `
      <option value="${s.id}">${s.name}</option>
    `).join('') + `<option value="">Unassigned (Bench / Floater)</option>`;
  }
}

function switchDeveloperWorkspace(devId) {
  if (!devId) return;
  state.currentDevId = devId;
  const dev = DEVELOPERS.find(d => d.id === devId) || DEVELOPERS[0];
  const squad = SQUADS.find(s => s.id === dev.squadId);

  // Update header in developer view
  const nameEl = document.getElementById('dev-workspace-name');
  if (nameEl) nameEl.innerText = dev.name;
  const avatarEl = document.getElementById('dev-workspace-avatar');
  if (avatarEl) avatarEl.innerText = dev.initials;
  const squadEl = document.getElementById('dev-workspace-squad');
  if (squadEl) squadEl.innerText = squad ? (squad.name.replace(/\s\(.*\)/, '')) : 'Unassigned';
  const roleEl = document.getElementById('dev-workspace-role');
  if (roleEl) roleEl.innerHTML = `${dev.role} · <span class="font-semibold text-slate-700 font-mono">${dev.capacityHours || 40.0}h / week</span>`;

  // Update top header user if in developer mode
  if (state.currentRole === 'developer') {
    const headerName = document.getElementById('header-user-name');
    if (headerName) headerName.innerText = dev.name;
    const headerSub = document.getElementById('header-user-sub');
    if (headerSub) headerSub.innerText = dev.role;
    const headerAv = document.getElementById('header-avatar');
    if (headerAv) headerAv.innerText = dev.initials;
  }

  // Reset selected task & re-render developer view components
  state.selectedTaskId = null;
  renderDeveloperFuelGauge();
  renderDeveloperTasks();
  renderDeveloperWorkLogs();
  renderDevAnalyticsDashboard();
  renderRecurringSidebar();
  renderDeadlineTimeline();

  showToast(`Switched workspace to ${dev.name} 💻`);
}

// ═══════════════════════════════════════════════════════════
// DEVELOPER MANAGEMENT & ONBOARDING SYSTEM
// ═══════════════════════════════════════════════════════════

function openCreateDeveloperModal() {
  const modal = document.getElementById('modal-create-developer');
  if (!modal) return;

  document.getElementById('create-dev-id').value = '';
  document.getElementById('modal-create-dev-title').innerText = 'Onboard New Developer';
  document.getElementById('modal-create-dev-subtitle').innerText = 'Configure engineer profile, squad allocation, and weekly capacity';
  document.getElementById('btn-submit-create-dev').innerHTML = '<i class="fa-solid fa-user-plus"></i> Onboard Developer';

  document.getElementById('create-dev-name').value = '';
  document.getElementById('create-dev-email').value = '';
  document.getElementById('create-dev-role').value = '';
  document.getElementById('create-dev-skills').value = '';
  document.getElementById('create-dev-capacity').value = '40';
  document.getElementById('create-dev-recurring').value = '6.0';
  document.getElementById('create-dev-seniority').value = 'Senior Engineer';

  const squadSelect = document.getElementById('create-dev-squad');
  if (squadSelect) {
    squadSelect.innerHTML = SQUADS.map(s => `<option value="${s.id}">${s.name}</option>`).join('') + `<option value="">Unassigned (Bench / Floater)</option>`;
  }

  modal.classList.remove('hidden');
}

function openEditDeveloperModal(devId) {
  const targetId = devId || state.currentManagerDevId || state.currentDevId;
  const dev = DEVELOPERS.find(d => d.id === targetId);
  if (!dev) return;

  const modal = document.getElementById('modal-create-developer');
  if (!modal) return;

  document.getElementById('create-dev-id').value = dev.id;
  document.getElementById('modal-create-dev-title').innerText = `Edit Profile · ${dev.name}`;
  document.getElementById('modal-create-dev-subtitle').innerText = `Update role, squad allocation, or capacity load for ${dev.name}`;
  document.getElementById('btn-submit-create-dev').innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Update Profile';

  document.getElementById('create-dev-name').value = dev.name;
  document.getElementById('create-dev-email').value = dev.email || `${dev.name.toLowerCase().replace(/\s+/g, '.')}@workdash.internal`;
  document.getElementById('create-dev-role').value = dev.role || '';
  document.getElementById('create-dev-skills').value = dev.skills || '';
  document.getElementById('create-dev-capacity').value = dev.capacityHours || 40;
  document.getElementById('create-dev-recurring').value = dev.recurringHours || 6.0;
  document.getElementById('create-dev-seniority').value = dev.seniority || 'Senior Engineer';

  const squadSelect = document.getElementById('create-dev-squad');
  if (squadSelect) {
    squadSelect.innerHTML = SQUADS.map(s => `<option value="${s.id}" ${s.id === dev.squadId ? 'selected' : ''}>${s.name}</option>`).join('') + `<option value="" ${!dev.squadId ? 'selected' : ''}>Unassigned (Bench / Floater)</option>`;
  }

  modal.classList.remove('hidden');
}

function closeCreateDeveloperModal() {
  const modal = document.getElementById('modal-create-developer');
  if (modal) modal.classList.add('hidden');
}

function setQuickDevRole(role, recurringHours, skills) {
  const roleInput = document.getElementById('create-dev-role');
  const recInput = document.getElementById('create-dev-recurring');
  const skillsInput = document.getElementById('create-dev-skills');
  if (roleInput) roleInput.value = role;
  if (recInput) recInput.value = recurringHours;
  if (skillsInput) skillsInput.value = skills;
}

function submitCreateDeveloper() {
  const editId = document.getElementById('create-dev-id').value;
  const nameInput = document.getElementById('create-dev-name');
  const roleInput = document.getElementById('create-dev-role');
  const capacityInput = document.getElementById('create-dev-capacity');
  const nameError = document.getElementById('create-dev-name-error');
  const roleError = document.getElementById('create-dev-role-error');
  const capError = document.getElementById('create-dev-capacity-error');

  // Reset errors
  if (nameInput) nameInput.classList.remove('input-error');
  if (roleInput) roleInput.classList.remove('input-error');
  if (capacityInput) capacityInput.classList.remove('input-error');
  if (nameError) { nameError.classList.add('hidden'); nameError.innerHTML = ''; }
  if (roleError) { roleError.classList.add('hidden'); roleError.innerHTML = ''; }
  if (capError) { capError.classList.add('hidden'); capError.innerHTML = ''; }

  const name = (nameInput ? nameInput.value : '').trim();
  const email = (document.getElementById('create-dev-email')?.value || '').trim();
  const squadId = document.getElementById('create-dev-squad')?.value || 'squad_a';
  const role = (roleInput ? roleInput.value : '').trim();
  const seniority = document.getElementById('create-dev-seniority')?.value || 'Senior Engineer';
  const capacityHours = parseFloat(capacityInput ? capacityInput.value : 40.0) || 0;
  const recurringHours = parseFloat(document.getElementById('create-dev-recurring')?.value || 6.0) || 0;
  const skills = (document.getElementById('create-dev-skills')?.value || '').trim();

  let hasError = false;
  if (!name || name.length < 2) {
    if (nameInput) nameInput.classList.add('input-error');
    if (nameError) {
      nameError.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Please enter full name (at least 2 characters).';
      nameError.classList.remove('hidden');
    }
    hasError = true;
  }

  if (!role || role.length < 2) {
    if (roleInput) roleInput.classList.add('input-error');
    if (roleError) {
      roleError.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Please specify a technical role.';
      roleError.classList.remove('hidden');
    }
    hasError = true;
  }

  if (capacityHours < 10 || capacityHours > 80) {
    if (capacityInput) capacityInput.classList.add('input-error');
    if (capError) {
      capError.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Capacity hours must be between 10h and 80h.';
      capError.classList.remove('hidden');
    }
    hasError = true;
  }

  if (hasError) {
    showToast('Please fix the errors in the form before saving.', 'warning');
    return;
  }

  const initials = name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2) || 'DEV';

  if (editId) {
    const dev = DEVELOPERS.find(d => d.id === editId);
    if (dev) {
      dev.name = name;
      dev.email = email || `${name.toLowerCase().replace(/\s+/g, '.')}@workdash.internal`;
      dev.squadId = squadId;
      dev.role = role;
      dev.seniority = seniority;
      dev.capacityHours = capacityHours;
      dev.recurringHours = recurringHours;
      dev.skills = skills;
      dev.initials = initials;
      showToast(`Updated profile for ${name}`, 'success');
    }
  } else {
    const newId = `dev_${Date.now()}`;
    const newDev = {
      id: newId,
      name,
      email: email || `${name.toLowerCase().replace(/\s+/g, '.')}@workdash.internal`,
      squadId: squadId || 'squad_a',
      role,
      seniority,
      capacityHours,
      recurringHours,
      skills,
      initials
    };
    DEVELOPERS.push(newDev);
    state.currentManagerDevId = newId;
    showToast(`Successfully onboarded ${name} to team! 🎉`, 'success');
  }

  saveAppState();
  closeCreateDeveloperModal();

  populateDeveloperDropdowns();
  renderRoster();
  renderKPIs();
  renderManagerKpis();
  renderSquadCapacityHub();
  renderSidebarSquads();
  renderSquadDropdowns();

  const currentDev = DEVELOPERS.find(d => d.id === (state.currentManagerDevId || state.currentDevId)) || DEVELOPERS[0];
  renderManagerDevHub();
  renderManagerDevTaskBoard(currentDev);
  renderManagerDevWorkLogs(currentDev);
  renderDeveloperFuelGauge();
  renderDeveloperTasks();
}

// ─── Roster Table & Grid ───

function getFilteredDevelopers() {
  const sq = state.selectedSquadFilter, cf = state.selectedCapacityFilter, q = state.searchQuery.toLowerCase();
  return DEVELOPERS.filter(d => {
    if (sq !== 'all' && d.squadId !== sq) return false;
    if (!d.name.toLowerCase().includes(q) && !d.role.toLowerCase().includes(q)) return false;
    if (cf === 'over') return getDeveloperCapacity(d.id).isOverallocated;
    if (cf === 'avail') return getDeveloperCapacity(d.id).availableBuffer >= 8.0;
    return true;
  });
}

function renderRoster() { state.rosterViewMode === 'table' ? renderRosterTable() : renderRosterGrid(); }

function renderRosterTable() {
  const tbody = document.getElementById('roster-tbody');
  tbody.innerHTML = '';
  const devs = getFilteredDevelopers();
  if (!devs.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="py-16 text-center">
      <div class="empty-state">
        <div class="empty-state-icon"><i class="fa-solid fa-users-slash"></i></div>
        <div class="empty-state-title">No developers found</div>
        <div class="empty-state-desc">Try adjusting your filters or search query</div>
      </div>
    </td></tr>`;
    return;
  }

  const avatarGradients = [
    'from-blue-500 to-indigo-600', 'from-emerald-500 to-teal-600', 'from-amber-500 to-orange-600',
    'from-purple-500 to-violet-600', 'from-rose-500 to-pink-600', 'from-cyan-500 to-blue-600',
    'from-indigo-500 to-purple-600', 'from-teal-500 to-emerald-600'
  ];

  devs.forEach((dev, idx) => {
    const cap = getDeveloperCapacity(dev.id);
    const squad = SQUADS.find(s => s.id === dev.squadId);
    const rPct = Math.min(100, (cap.recurringHours / 40) * 100);
    const sPct = Math.min(100 - rPct, (cap.sprintHours / 40) * 100);
    const aPct = Math.min(100 - rPct - sPct, (cap.adhocHours / 40) * 100);
    const gradient = avatarGradients[idx % avatarGradients.length];

    let statusHtml;
    if (cap.isOverallocated) {
      statusHtml = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-600 text-xs font-bold border border-red-200"><span class="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>+${cap.overage.toFixed(1)}h over</span>`;
    } else if (cap.isNearCapacity) {
      statusHtml = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 text-xs font-semibold border border-amber-200"><span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>${cap.availableBuffer.toFixed(1)}h left</span>`;
    } else {
      statusHtml = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-semibold border border-emerald-200"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>${cap.availableBuffer.toFixed(1)}h free</span>`;
    }

    const tr = document.createElement('tr');
    tr.className = `table-row-hover transition-colors ${cap.isOverallocated ? 'bg-red-50/30' : (idx % 2 === 1 ? 'bg-slate-50/40' : '')}`;
    tr.innerHTML = `
      <td class="px-5 py-3.5">
        <div class="flex items-center gap-3">
          <div onclick="switchManagerDevHub('${dev.id}')" title="View 360° Dashboard" class="w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center font-bold text-white text-[11px] flex-shrink-0 cursor-pointer transition-all hover:scale-105 hover:shadow-md shadow-sm">
            ${dev.initials}
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <span onclick="switchManagerDevHub('${dev.id}')" class="text-sm font-semibold text-slate-900 hover:text-blue-600 hover:underline underline-offset-2 cursor-pointer truncate transition-colors">${dev.name}</span>
              ${squad ? getSquadPillBadgeHtml(squad) : ''}
            </div>
            <div class="text-xs text-slate-400 truncate mt-0.5">${dev.role}</div>
          </div>
        </div>
      </td>
      <td class="px-4 py-3.5 text-sm text-purple-600 font-semibold tabular-nums">${cap.recurringHours.toFixed(1)}h</td>
      <td class="px-4 py-3.5 text-sm text-blue-600 font-semibold tabular-nums">${cap.sprintHours.toFixed(1)}h</td>
      <td class="px-4 py-3.5 text-sm text-amber-600 font-semibold tabular-nums">${cap.adhocHours.toFixed(1)}h</td>
      <td class="px-4 py-3.5 text-sm tabular-nums">
        <span class="${cap.isOverallocated ? 'text-red-600' : 'text-slate-800'} font-bold">${cap.totalLoad.toFixed(1)}</span>
        <span class="text-slate-300 font-normal">/ 40</span>
      </td>
      <td class="px-5 py-3.5 w-56">
        <div class="capacity-gauge border border-slate-200">
          <div class="capacity-gauge-segment bg-purple-500" style="width:${rPct}%"></div>
          <div class="capacity-gauge-segment bg-blue-500" style="width:${sPct}%"></div>
          <div class="capacity-gauge-segment bg-amber-500" style="width:${aPct}%"></div>
          ${cap.isOverallocated ? '<div class="capacity-gauge-segment bg-striped-rose flex-1 animate-pulse"></div>' : ''}
        </div>
      </td>
      <td class="px-4 py-3">${statusHtml}</td>
      <td class="px-5 py-3 text-right">
        <div class="flex items-center justify-end gap-1">
          <button onclick="switchManagerDevHub('${dev.id}')" title="360° Dashboard" class="p-2 rounded-lg hover:bg-cyan-50 text-slate-400 hover:text-cyan-600 transition-colors"><i class="fa-solid fa-id-badge text-sm"></i></button>
          <button onclick="openAssignModalWithDev('${dev.id}')" title="Assign Task" class="p-2 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"><i class="fa-solid fa-plus text-sm"></i></button>
          <button onclick="openDevDrawer('${dev.id}')" title="Quick Inspector" class="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"><i class="fa-solid fa-chevron-right text-xs"></i></button>
        </div>
      </td>`;
    tbody.appendChild(tr);
  });
}

function renderRosterGrid() {
  const container = document.getElementById('roster-view-grid');
  container.innerHTML = '';
  getFilteredDevelopers().forEach(dev => {
    const cap = getDeveloperCapacity(dev.id);
    const squad = SQUADS.find(s => s.id === dev.squadId);
    const card = document.createElement('div');
    card.className = `bg-white rounded-2xl border p-5 space-y-3.5 transition-all hover:shadow-card-hover ${cap.isOverallocated ? 'border-rose-200 bg-rose-50/20' : 'border-slate-200'}`;
    card.innerHTML = `
      <div class="flex items-start justify-between gap-2">
        <div class="flex items-center gap-3 min-w-0">
          <div onclick="switchManagerDevHub('${dev.id}')" title="View 360° Developer Dashboard" class="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 hover:border-blue-400 hover:bg-blue-50 flex items-center justify-center font-bold text-slate-700 text-xs flex-shrink-0 cursor-pointer transition-all">
            ${dev.initials}
          </div>
          <div class="min-w-0">
            <div onclick="switchManagerDevHub('${dev.id}')" class="text-sm font-bold text-slate-900 hover:text-blue-600 cursor-pointer truncate transition-colors">${dev.name}</div>
            <div class="text-xs text-slate-400 truncate">${dev.role}</div>
          </div>
        </div>
        <span class="text-xs font-mono font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${cap.isOverallocated ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}">
          ${cap.isOverallocated ? `+${cap.overage.toFixed(1)}h` : `${cap.availableBuffer.toFixed(1)}h`}
        </span>
      </div>

      <div class="flex items-center justify-between text-xs">
        ${squad ? getSquadPillBadgeHtml(squad) : '<span></span>'}
        <span class="font-mono text-slate-500 font-medium"><strong>${cap.totalLoad.toFixed(1)}h</strong> / 40.0h</span>
      </div>

      <div class="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex border border-slate-200">
        <div class="bg-purple-500 h-full" style="width:${(cap.recurringHours/40)*100}%"></div>
        <div class="bg-blue-500 h-full" style="width:${(cap.sprintHours/40)*100}%"></div>
        <div class="bg-amber-500 h-full" style="width:${(cap.adhocHours/40)*100}%"></div>
      </div>

      <div class="flex items-center justify-between text-xs font-mono text-slate-400 pt-2 border-t border-slate-100">
        <button onclick="switchManagerDevHub('${dev.id}')" class="text-cyan-700 hover:text-cyan-900 font-bold flex items-center gap-1">
          <i class="fa-solid fa-id-badge text-[10px]"></i> 360° Dashboard
        </button>
        <button onclick="openAssignModalWithDev('${dev.id}')" class="text-blue-600 hover:text-blue-700 font-bold">+ Assign</button>
      </div>`;
    container.appendChild(card);
  });
}


// ─── Developer View ───

function renderDeveloperFuelGauge() {
  const cap = getDeveloperCapacity(state.currentDevId);
  if (!cap) return;
  const dev = cap.developer;
  const squad = SQUADS.find(s => s.id === dev.squadId);

  // Update hero profile identity
  const nameEl = document.getElementById('dev-workspace-name');
  if (nameEl) nameEl.innerText = dev.name;
  const avatarEl = document.getElementById('dev-workspace-avatar');
  if (avatarEl) avatarEl.innerText = dev.initials;
  const squadEl = document.getElementById('dev-workspace-squad');
  if (squadEl) squadEl.innerText = squad ? (squad.name.replace(/\s\(.*\)/, '')) : 'Unassigned';
  const roleEl = document.getElementById('dev-workspace-role');
  if (roleEl) roleEl.innerHTML = `${dev.role} · <span class="font-semibold text-slate-700 font-mono">${dev.capacityHours || 40.0}h / week</span>`;
  const switcher = document.getElementById('dev-workspace-switcher');
  if (switcher) switcher.value = dev.id;

  const maxCap = dev.capacityHours || 40.0;
  const loadText = document.getElementById('dev-total-load-text');
  if (loadText) loadText.innerText = `${cap.totalLoad.toFixed(1)} / ${maxCap.toFixed(1)}h`;
  const utilBadge = document.getElementById('dev-utilization-badge');
  if (utilBadge) utilBadge.innerText = `${cap.utilizationPct}%`;
  const bufferPill = document.getElementById('dev-buffer-pill');
  if (bufferPill) {
    bufferPill.innerHTML = cap.isOverallocated
      ? `<span class="text-rose-600 font-mono font-bold bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg text-xs">+${cap.overage.toFixed(1)}h over</span>`
      : `<span class="text-emerald-600 font-mono font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg text-xs">${cap.availableBuffer.toFixed(1)}h free</span>`;
  }

  const r = (cap.recurringHours / maxCap) * 100, s = (cap.sprintHours / maxCap) * 100, a = (cap.adhocHours / maxCap) * 100, p = (cap.pendingHours / maxCap) * 100;
  const segRec = document.getElementById('gauge-seg-recurring');
  if (segRec) segRec.style.width = `${r}%`;
  const segSpr = document.getElementById('gauge-seg-sprint');
  if (segSpr) segSpr.style.width = `${s}%`;
  const segAdh = document.getElementById('gauge-seg-adhoc');
  if (segAdh) segAdh.style.width = `${a}%`;
  const segPen = document.getElementById('gauge-seg-pending');
  if (segPen) segPen.style.width = `${p}%`;

  const legRec = document.getElementById('legend-recurring-text');
  if (legRec) legRec.innerText = `${cap.recurringHours.toFixed(1)}h Recurring`;
  const legSpr = document.getElementById('legend-sprint-text');
  if (legSpr) legSpr.innerText = `${cap.sprintHours.toFixed(1)}h Pre-Planning`;
  const legAdh = document.getElementById('legend-adhoc-text');
  if (legAdh) legAdh.innerText = `${cap.adhocHours.toFixed(1)}h Ad-Hoc`;
  const legBuf = document.getElementById('legend-buffer-text');
  if (legBuf) legBuf.innerText = `${cap.availableBuffer.toFixed(1)}h Free`;

  // Sidebar: personal weekly load footer
  const sideLoad = document.getElementById('sidebar-dev-load-text');
  if (sideLoad) sideLoad.innerText = `${cap.totalLoad.toFixed(1)} / ${maxCap.toFixed(1)}h`;
  const sideBar = document.getElementById('sidebar-dev-bar-fill');
  if (sideBar) sideBar.style.width = `${Math.min(100, cap.utilizationPct)}%`;
  const sideUtil = document.getElementById('sidebar-dev-util-badge');
  if (sideUtil) sideUtil.innerText = `${cap.utilizationPct}% utilised`;
  const sideBuf = document.getElementById('sidebar-dev-buffer-text');
  if (sideBuf) {
    sideBuf.innerText = cap.isOverallocated ? `+${cap.overage.toFixed(1)}h over` : `${cap.availableBuffer.toFixed(1)}h free`;
    sideBuf.className = cap.isOverallocated ? 'font-semibold text-rose-500' : 'font-semibold text-emerald-600';
  }

  // Sidebar: my squad card
  const sideSquadName = document.getElementById('sidebar-dev-squad-name');
  if (sideSquadName) sideSquadName.innerText = squad ? squad.name.replace(/\s\(.*\)/, '') : 'Unassigned';
  const sideSquadLead = document.getElementById('sidebar-dev-squad-lead');
  if (sideSquadLead) sideSquadLead.innerText = squad ? `${squad.projectCode} · Lead: ${squad.lead}` : '';
  const sideSquadDot = document.querySelector('#sidebar-dev-squad-card > span');
  if (sideSquadDot && squad) sideSquadDot.className = `h-2.5 w-2.5 rounded-full bg-${squad.color}-500 flex-shrink-0`;

  // Sidebar: task count badge
  const devTasks = TASKS.filter(t => t.assignedTo === dev.id);
  const sideTaskBadge = document.getElementById('devnav-badge-tasks');
  if (sideTaskBadge) sideTaskBadge.innerText = devTasks.length;
}

function filterDeveloperTasks(category) {
  state.devTaskFilter = category;

  const tabConfig = {
    'ALL':               { active: 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm', activeBadge: 'bg-blue-100 text-blue-700', inactive: 'bg-slate-50 text-slate-600 border-slate-200', inactiveBadge: 'bg-slate-200 text-slate-600' },
    'PRE_PLANNING':      { active: 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm', activeBadge: 'bg-blue-100 text-blue-700', inactive: 'bg-slate-50 text-slate-600 border-slate-200', inactiveBadge: 'bg-slate-200 text-slate-600' },
    'AD_HOC_EMERGENCY':  { active: 'bg-amber-50 text-amber-700 border-amber-200 shadow-sm', activeBadge: 'bg-amber-100 text-amber-700', inactive: 'bg-slate-50 text-slate-600 border-slate-200', inactiveBadge: 'bg-slate-200 text-slate-600' },
    'RECURRING_ROUTINE': { active: 'bg-purple-50 text-purple-700 border-purple-200 shadow-sm', activeBadge: 'bg-purple-100 text-purple-700', inactive: 'bg-slate-50 text-slate-600 border-slate-200', inactiveBadge: 'bg-slate-200 text-slate-600' },
    'COMPLETED':         { active: 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm', activeBadge: 'bg-emerald-100 text-emerald-700', inactive: 'bg-slate-50 text-slate-600 border-slate-200', inactiveBadge: 'bg-slate-200 text-slate-600' }
  };

  Object.keys(tabConfig).forEach(tab => {
    const btn = document.getElementById(`dev-tab-${tab}`);
    const badge = document.getElementById(`dev-count-${tab}`);
    const cfg = tabConfig[tab];
    if (btn) {
      const isActive = tab === category;
      btn.className = `inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-${isActive ? 'semibold' : 'medium'} border transition-all whitespace-nowrap flex-shrink-0 ${isActive ? cfg.active : cfg.inactive + ' hover:bg-slate-100'}`;
      if (badge) badge.className = `font-bold px-2 py-0.5 rounded-full text-xs ml-0.5 ${isActive ? cfg.activeBadge : cfg.inactiveBadge}`;
    }
  });

  renderDeveloperTasks();
}

function toggleTaskComplete(taskId) {
  const t = TASKS.find(x => x.id === taskId);
  if (!t) return;
  
  if (t.status === 'COMPLETED') {
    t.status = 'IN_PROGRESS';
    delete t.completedAt;
    showToast(`Reopened "${t.title}".`);
  } else {
    t.status = 'COMPLETED';
    t.loggedHours = t.estimatedHours; // completed full hours
    const now = new Date();
    const dateFormatted = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeFormatted = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    t.completedAt = `${dateFormatted} · ${timeFormatted}`;
    showToast(`Marked "${t.title}" as completed! 🎉`);
  }
  
  renderDeveloperFuelGauge();
  renderDeveloperTasks();
  renderDeveloperWorkLogs();
  renderDevAnalyticsDashboard();
  renderRoster();
  renderKPIs();
}

function getTaskCategoryBadge(cat, title) {
  let c = cat;
  if (!c) {
    const t = (title || '').toLowerCase();
    if (t.includes('test') || t.includes('qa') || t.includes('cypress') || t.includes('jest') || t.includes('bench')) c = 'TESTING_QA';
    else if (t.includes('fix') || t.includes('leak') || t.includes('bug') || t.includes('patch') || t.includes('incident') || t.includes('hotfix')) c = 'BUG_FIX';
    else if (t.includes('report') || t.includes('doc') || t.includes('spec') || t.includes('audit')) c = 'REPORTING';
    else if (t.includes('ui') || t.includes('design') || t.includes('frontend') || t.includes('css') || t.includes('layout')) c = 'UI_UX';
    else if (t.includes('docker') || t.includes('devops') || t.includes('k8s') || t.includes('ci/cd') || t.includes('deploy') || t.includes('infra') || t.includes('sharding')) c = 'DEVOPS';
    else if (t.includes('standup') || t.includes('sync') || t.includes('meeting') || t.includes('review') || t.includes('grooming')) c = 'MEETING';
    else c = 'DEVELOPMENT';
  }

  const map = {
    DEVELOPMENT: '<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200"><i class="fa-solid fa-code text-[10px]"></i>Dev</span>',
    TESTING_QA: '<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200"><i class="fa-solid fa-vial-circle-check text-[10px]"></i>QA</span>',
    REPORTING: '<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200"><i class="fa-solid fa-file-lines text-[10px]"></i>Reporting</span>',
    BUG_FIX: '<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200"><i class="fa-solid fa-bug text-[10px]"></i>BugFix</span>',
    UI_UX: '<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-pink-50 text-pink-700 border border-pink-200"><i class="fa-solid fa-palette text-[10px]"></i>UI/UX</span>',
    DEVOPS: '<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200"><i class="fa-solid fa-server text-[10px]"></i>DevOps</span>',
    MEETING: '<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200"><i class="fa-solid fa-users text-[10px]"></i>Sync</span>'
  };
  return map[c] || map.DEVELOPMENT;
}

function setDeveloperTaskViewMode(mode) {
  state.devTaskViewMode = mode;
  const btnBoard = document.getElementById('dev-view-btn-board');
  const btnList = document.getElementById('dev-view-btn-list');
  const btnGrid = document.getElementById('dev-view-btn-grid');

  const activeClass = 'px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 bg-white text-blue-700 shadow-sm';
  const inactiveClass = 'px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 text-slate-600 hover:text-slate-900';

  if (btnBoard) btnBoard.className = mode === 'board' ? activeClass : inactiveClass;
  if (btnList) btnList.className = mode === 'list' ? activeClass : inactiveClass;
  if (btnGrid) btnGrid.className = mode === 'grid' ? activeClass : inactiveClass;

  renderDeveloperTasks();
}

function renderDeveloperTasks() {
  const container = document.getElementById('dev-task-list-container');
  if (!container) return;
  container.innerHTML = '';

  const allDevTasks = TASKS.filter(t => t.assignedTo === state.currentDevId);
  
  // Calculate total counts for badges
  const countAll = allDevTasks.length;
  const countSprint = allDevTasks.filter(t => t.taskType === 'PRE_PLANNING' || t.taskType === 'PRE_PLAN' || t.taskType === 'PROJECT_SPRINT').length;
  const countAdhoc = allDevTasks.filter(t => t.taskType === 'AD_HOC_EMERGENCY').length;
  const countRecurring = allDevTasks.filter(t => t.taskType === 'RECURRING_ROUTINE' || t.taskType === 'RECURRING').length;
  const countCompleted = allDevTasks.filter(t => t.status === 'COMPLETED').length;
  
  if (document.getElementById('dev-count-ALL')) document.getElementById('dev-count-ALL').innerText = countAll;
  if (document.getElementById('dev-count-PRE_PLANNING')) document.getElementById('dev-count-PRE_PLANNING').innerText = countSprint;
  if (document.getElementById('dev-count-AD_HOC_EMERGENCY')) document.getElementById('dev-count-AD_HOC_EMERGENCY').innerText = countAdhoc;
  if (document.getElementById('dev-count-RECURRING_ROUTINE')) document.getElementById('dev-count-RECURRING_ROUTINE').innerText = countRecurring;
  if (document.getElementById('dev-count-COMPLETED')) document.getElementById('dev-count-COMPLETED').innerText = countCompleted;
  
  // Show/hide recurring sub-filter
  const recurSubfilter = document.getElementById('recurring-subfilter');
  if (recurSubfilter) recurSubfilter.classList.toggle('hidden', state.devTaskFilter !== 'RECURRING_ROUTINE' && state.devTaskFilter !== 'RECURRING');

  // Filter based on active tab
  let tasks = allDevTasks;
  if (state.devTaskFilter === 'PRE_PLANNING' || state.devTaskFilter === 'PRE_PLAN' || state.devTaskFilter === 'PROJECT_SPRINT') {
    tasks = allDevTasks.filter(t => t.taskType === 'PRE_PLANNING' || t.taskType === 'PRE_PLAN' || t.taskType === 'PROJECT_SPRINT');
  } else if (state.devTaskFilter === 'AD_HOC_EMERGENCY') {
    tasks = allDevTasks.filter(t => t.taskType === 'AD_HOC_EMERGENCY');
  } else if (state.devTaskFilter === 'RECURRING_ROUTINE' || state.devTaskFilter === 'RECURRING') {
    tasks = allDevTasks.filter(t => t.taskType === 'RECURRING_ROUTINE' || t.taskType === 'RECURRING');
    if (state.recurringFilter !== 'all') {
      const FREQ_MAP = {
        'tsk_rec_101': 'daily',
        'tsk_rec_102': 'daily',
        'tsk_rec_103': 'weekly',
        'tsk_rec_104': 'weekly',
        'tsk_rec_105': 'monthly',
        'tsk_rec_106': 'monthly'
      };
      tasks = tasks.filter(t => (t.recurrence || FREQ_MAP[t.id] || 'WEEKLY').toLowerCase() === state.recurringFilter);
    }
  } else if (state.devTaskFilter === 'COMPLETED') {
    tasks = allDevTasks.filter(t => t.status === 'COMPLETED');
  }

  // Apply date search
  if (state.devDateFilter) {
    const filterDate = new Date(state.devDateFilter + 'T00:00:00');
    const dateFormatted = filterDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const monthDay = filterDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    tasks = tasks.filter(t => {
      const assigned = (t.assignedAt || '');
      return assigned.includes(dateFormatted) || assigned.includes(monthDay) || assigned.includes(state.devDateFilter);
    });
  }

  if (!tasks.length) {
    const filterDate = state.devDateFilter ? new Date(state.devDateFilter + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
    const msg = state.devDateFilter
      ? `No tasks were assigned on <strong>${filterDate}</strong> in this category.`
      : 'No tasks in this category.';
    container.innerHTML = `<div class="p-8 text-center text-sm text-slate-500 font-mono bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">${msg}</div>`;
    return;
  }

  const viewMode = state.devTaskViewMode || 'board';

  // 1. KANBAN BOARD VIEW (With Drag and Drop)
  if (viewMode === 'board') {
    const todoTasks = tasks.filter(t => t.status === 'TO_DO');
    const inProgTasks = tasks.filter(t => t.status === 'IN_PROGRESS');
    const pendingTasks = tasks.filter(t => t.status === 'PENDING_REVIEW' || t.status === 'PENDING_ACCEPTANCE');
    const doneTasks = tasks.filter(t => t.status === 'COMPLETED');

    const todoH = todoTasks.reduce((s, t) => s + t.estimatedHours, 0);
    const inProgH = inProgTasks.reduce((s, t) => s + t.estimatedHours, 0);
    const pendingH = pendingTasks.reduce((s, t) => s + t.estimatedHours, 0);
    const doneH = doneTasks.reduce((s, t) => s + (t.loggedHours || t.estimatedHours), 0);

    const col1 = renderKanbanColumnHtml(
      'To Do',
      '<span class="w-2.5 h-2.5 rounded-full bg-slate-400"></span>',
      { border: 'border-slate-200/80', bg: 'bg-slate-50/50', divider: 'border-slate-200/60', badge: 'bg-slate-100 text-slate-700' },
      todoTasks.length,
      todoH,
      todoTasks.map(t => renderKanbanCardHtml(t, false, false)).join(''),
      'TO_DO'
    );

    const col2 = renderKanbanColumnHtml(
      'In Progress',
      '<span class="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>',
      { border: 'border-blue-200/80', bg: 'bg-blue-50/30', divider: 'border-blue-200/60', badge: 'bg-blue-100 text-blue-800' },
      inProgTasks.length,
      inProgH,
      inProgTasks.map(t => renderKanbanCardHtml(t, false, false)).join(''),
      'IN_PROGRESS'
    );

    const col3 = renderKanbanColumnHtml(
      'Pending Review',
      '<span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>',
      { border: 'border-amber-200/80', bg: 'bg-amber-50/30', divider: 'border-amber-200/60', badge: 'bg-amber-100 text-amber-800' },
      pendingTasks.length,
      pendingH,
      pendingTasks.map(t => renderKanbanCardHtml(t, false, false)).join(''),
      'PENDING_REVIEW'
    );

    const col4 = renderKanbanColumnHtml(
      'Completed',
      '<span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>',
      { border: 'border-emerald-200/80', bg: 'bg-emerald-50/30', divider: 'border-emerald-200/60', badge: 'bg-emerald-100 text-emerald-800' },
      doneTasks.length,
      doneH,
      doneTasks.map(t => renderKanbanCardHtml(t, false, false)).join(''),
      'COMPLETED'
    );

    container.className = 'kanban-board-container';
    container.innerHTML = col1 + col2 + col3 + col4;
    return;
  }

  // 2. LIST MATRIX TABLE VIEW
  if (viewMode === 'list') {
    container.className = 'w-full p-2';
    container.innerHTML = renderTaskMatrixTableHtml(tasks, false);
    return;
  }

  // 3. SQUARE GRID VIEW (Standard Card Matrix)
  container.className = 'p-3 space-y-3';
  tasks.forEach(task => {
    const dev = DEVELOPERS.find(d => d.id === task.assignedTo);
    const squad = dev ? SQUADS.find(s => s.id === dev.squadId) : (task.squadId ? SQUADS.find(s => s.id === task.squadId) : SQUADS[0]);
    const projectBadge = squad ? (squad.projectCode || squad.name.replace(/\s\(.*\)/, '')) : 'PROJECT';
    const pct = Math.min(100, Math.round((task.loggedHours / task.estimatedHours) * 100));
    const isTimer = state.activeTimer.taskId === task.id && state.activeTimer.isRunning;
    const isDone = task.status === 'COMPLETED';
    const isSelected = state.selectedTaskId === task.id;
    const taskLogs = WORK_LOGS.filter(l => l.taskId === task.id);
    const remaining = Math.max(0, task.estimatedHours - task.loggedHours);

    const borderColor = isDone ? '#10b981'
      : task.taskType === 'AD_HOC_EMERGENCY' ? '#f59e0b'
      : task.taskType === 'RECURRING' ? '#a855f7'
      : '#3b82f6';

    let typeBadge = '';
    if (task.taskType === 'PROJECT_SPRINT') {
      typeBadge = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200"><i class="fa-solid fa-code-commit text-[10px]"></i>Pre-Planning</span>`;
    } else if (task.taskType === 'AD_HOC_EMERGENCY') {
      typeBadge = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200"><i class="fa-solid fa-fire-flame-curved text-[10px]"></i>Ad-Hoc</span>`;
    } else if (task.taskType === 'RECURRING') {
      typeBadge = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 text-xs font-semibold border border-purple-200"><i class="fa-solid fa-repeat text-[10px]"></i>Recurring · ${RECURRENCE_LABELS[task.recurrence || 'WEEKLY']}</span>`;
    }

    let statusBadge = isDone
      ? `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300 shadow-sm"><i class="fa-solid fa-circle-check text-emerald-600"></i>Completed ✅</span>`
      : task.status === 'IN_PROGRESS'
        ? `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-semibold border border-amber-200"><i class="fa-solid fa-spinner fa-spin text-amber-600"></i>In Progress</span>`
        : `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium border border-slate-300"><i class="fa-regular fa-clock text-slate-500"></i>To Do</span>`;

    const barColor = isDone ? 'bg-emerald-500' : pct >= 80 ? 'bg-amber-500' : 'bg-blue-500';

    const cardClass = isSelected
      ? 'relative bg-white rounded-2xl border-2 border-blue-500 ring-4 ring-blue-100 shadow-md transition-all cursor-pointer'
      : (isDone ? 'relative bg-white rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-card hover:border-slate-300 hover:shadow-card-hover transition-all cursor-pointer'
               : 'relative bg-white rounded-2xl border border-slate-200 shadow-card hover:border-slate-300 hover:shadow-card-hover transition-all cursor-pointer');

    const el = document.createElement('div');
    el.className = cardClass;
    el.onclick = (e) => selectTaskForLogs(task.id, e);

    el.innerHTML = `
      <div class="absolute inset-y-0 left-0 w-1.5 rounded-l-2xl" style="background:${borderColor}"></div>
      <div class="pl-5 pr-6 py-4 space-y-3.5">
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-3 min-w-0 flex-1">
            <span class="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-mono font-bold uppercase border border-indigo-200 flex-shrink-0 flex items-center gap-1">
              <i class="fa-solid fa-diagram-project text-[10px]"></i>${projectBadge}
            </span>
            <span class="text-base font-bold text-slate-900 leading-snug">${task.title}</span>
            ${isSelected ? '<span class="px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm flex-shrink-0"><i class="fa-solid fa-eye"></i> Viewing Logs</span>' : ''}
          </div>
          <div class="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
            ${typeBadge}
            ${getTaskCategoryBadge(task.category, task.title)}
            ${statusBadge}
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-600 font-mono ${isDone ? 'bg-emerald-50/80 border-emerald-200' : 'bg-slate-50/80 border-slate-100'} rounded-xl px-4 py-2.5 border">
          <span class="flex items-center gap-1.5 min-w-0">
            <i class="fa-solid fa-user-check text-blue-500 flex-shrink-0"></i>
            <span class="truncate"><span class="text-slate-400">Assigned by:</span> <strong class="text-slate-800 font-semibold">${(task.assignedBy || 'Marcus Vance (PM)').replace(' (Project Manager)', '').replace(' (Tech Lead)', '')}</strong></span>
          </span>
          <span class="text-slate-300">|</span>
          ${isDone && task.completedAt ? `
          <span class="flex items-center gap-1.5 text-emerald-800 font-semibold">
            <i class="fa-solid fa-circle-check text-emerald-600 flex-shrink-0"></i>
            <span><span class="text-emerald-600">Completed on:</span> <strong>${task.completedAt}</strong></span>
          </span>` : `
          <span class="flex items-center gap-1.5">
            <i class="fa-regular fa-clock text-slate-400 flex-shrink-0"></i>
            <span><span class="text-slate-400">Assigned on:</span> <strong class="text-slate-700 font-medium">${task.assignedAt || 'Sep 1, 2026 · 09:00 AM'}</strong></span>
          </span>`}
          <span class="text-slate-300">|</span>
          <span class="flex items-center gap-1.5">
            <i class="fa-regular fa-calendar-xmark text-amber-500 flex-shrink-0"></i>
            <span><span class="text-slate-400">Due:</span> <strong class="text-amber-800 font-semibold">${task.dueDate || 'Sep 5, 2026'}</strong></span>
          </span>
        </div>

        <div class="space-y-2">
          <div class="flex items-center justify-between text-xs font-mono">
            <div class="flex items-center gap-3">
              <span class="text-slate-500">Estimated: <strong class="text-slate-800 font-bold">${task.estimatedHours.toFixed(1)}h</strong></span>
              <span class="text-slate-300">·</span>
              <span class="text-slate-500">Logged: <strong class="text-emerald-600 font-bold">${task.loggedHours.toFixed(1)}h</strong></span>
            </div>
            <span class="text-slate-500">Remaining: <strong class="${remaining > 0 ? 'text-amber-600' : 'text-emerald-600'} font-bold">${remaining.toFixed(1)}h</strong></span>
          </div>
          <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-100">
            <div class="h-full rounded-full transition-all duration-500 ${barColor}" style="width:${pct}%"></div>
          </div>
          <div class="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>${pct}% completed</span>
            <span>Total: ${task.estimatedHours.toFixed(1)}h</span>
          </div>
        </div>

        <div class="flex items-center justify-between pt-2.5 border-t border-slate-100">
          <button onclick="event.stopPropagation(); toggleTaskComplete('${task.id}')"
            class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all
              ${isDone ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'}">
            <i class="fa-solid ${isDone ? 'fa-arrow-rotate-left' : 'fa-check'} text-xs"></i>
            ${isDone ? 'Reopen Task' : 'Mark Completed'}
          </button>
          <div class="flex items-center gap-2">
            <button onclick="event.stopPropagation(); openTaskLogDrawer('${task.id}')"
              class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all
                ${isSelected ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm'}">
              <i class="fa-solid fa-clock-rotate-left text-xs ${isSelected ? 'text-white' : 'text-indigo-500'}"></i> View Log (${taskLogs.length})
            </button>
            <button onclick="event.stopPropagation(); openLogTimeModal('${task.id}')"
              class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-sm transition-all">
              <i class="fa-regular fa-clock text-xs text-slate-400"></i> Log Hours
            </button>
            <button onclick="event.stopPropagation(); toggleTaskTimer('${task.id}')"
              class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm
                ${isTimer ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse' : 'bg-blue-600 hover:bg-blue-700 text-white'}">
              <i class="fa-solid ${isTimer ? 'fa-pause' : 'fa-play'} text-[10px]"></i>
              ${isTimer ? 'Active' : 'Start Timer'}
            </button>
          </div>
        </div>

      </div>`;
    container.appendChild(el);
  });
}

function selectTaskForLogs(taskId, event) {
  if (event && event.target) {
    const btn = event.target.closest('button');
    if (btn && !btn.innerText.includes('Logs')) {
      return; // let other button actions execute without overriding
    }
  }

  if (state.selectedTaskId === taskId) {
    state.selectedTaskId = null; // click again to unselect / show all
  } else {
    state.selectedTaskId = taskId;
  }

  renderDeveloperTasks();
  renderDeveloperWorkLogs();

  const card = document.getElementById('dev-worklogs-card');
  if (card && window.innerWidth < 1024) {
    card.scrollIntoView({ behavior: 'smooth' });
  }
}

function clearSelectedTaskLogFilter() {
  state.selectedTaskId = null;
  renderDeveloperTasks();
  renderDeveloperWorkLogs();
}

function renderDeveloperWorkLogs() {
  const container = document.getElementById('dev-worklogs-list');
  const countBadge = document.getElementById('dev-worklogs-count');
  const taskPill = document.getElementById('dev-worklogs-task-pill');
  const taskName = document.getElementById('dev-worklogs-task-name');
  const allBtn = document.getElementById('dev-worklogs-all-btn');
  if (!container) return;
  
  let devLogs = WORK_LOGS.filter(l => l.developerId === state.currentDevId);

  if (state.selectedTaskId) {
    const selTask = TASKS.find(t => t.id === state.selectedTaskId);
    devLogs = devLogs.filter(l => l.taskId === state.selectedTaskId);
    const taskLoggedHours = devLogs.reduce((s, l) => s + l.hours, 0);

    if (taskPill) {
      taskPill.classList.remove('hidden');
      if (taskName) {
        taskName.innerHTML = `Logs for: <strong class="text-blue-950">${selTask ? selTask.title : 'Selected Task'}</strong> (${taskLoggedHours.toFixed(1)}h logged)`;
      }
    }
    if (allBtn) allBtn.classList.remove('hidden');
    if (countBadge) countBadge.innerText = `${devLogs.length} ${devLogs.length === 1 ? 'entry' : 'entries'}`;

    if (!devLogs.length) {
      container.innerHTML = `
        <div class="p-6 text-center text-sm text-slate-500 font-mono bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 space-y-3">
          <div class="text-slate-400"><i class="fa-regular fa-folder-open text-2xl mb-1"></i></div>
          <div>No work logs submitted for this task yet.</div>
          <button onclick="openLogTimeModal('${state.selectedTaskId}')" class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all">
            + Log Hours for this Task
          </button>
        </div>`;
      return;
    }
  } else {
    if (taskPill) taskPill.classList.add('hidden');
    if (allBtn) allBtn.classList.add('hidden');
    if (countBadge) countBadge.innerText = `${devLogs.length} entries (All Tasks)`;

    if (!devLogs.length) {
      container.innerHTML = '<div class="p-6 text-center text-sm text-slate-400 font-mono">No work logs submitted yet.</div>';
      return;
    }
  }

  container.innerHTML = devLogs.map(log => `
    <div class="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 hover:border-slate-200 hover:bg-white hover:shadow-sm transition-all space-y-2.5">
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2 min-w-0">
          <span class="px-2 py-0.5 rounded bg-blue-50 text-blue-600 text-[10px] font-mono font-bold uppercase border border-blue-100 flex-shrink-0">${log.clientCode || 'TASK'}</span>
          <span class="text-sm font-bold text-slate-800 truncate">${log.taskTitle}</span>
        </div>
        <span class="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex-shrink-0 shadow-sm">+${log.hours.toFixed(1)}h logged</span>
      </div>
      <p class="text-xs text-slate-600 pl-3 border-l-2 border-indigo-400 font-sans italic leading-relaxed">"${log.notes}"</p>
      <div class="flex items-center justify-between text-xs text-slate-400 font-mono pt-1">
        <span><i class="fa-regular fa-clock text-[10px] mr-1 text-slate-400"></i>${log.timestamp}</span>
        <span class="text-slate-500 font-medium">By ${log.devName}</span>
      </div>
    </div>
  `).join('');
}

// ═══════════════════════════════════════════════════════════
// SLIDE-OVER DRAWER: TASK WORK LOG CONTROLLER
// Solves bottom-task log accessibility edge cases
// ═══════════════════════════════════════════════════════════

let currentDrawerTaskId = null;

function openTaskLogDrawer(taskId) {
  const task = TASKS.find(t => t.id === taskId);
  if (!task) return;

  currentDrawerTaskId = taskId;
  state.selectedTaskId = taskId; // Also synchronize the sticky sidebar

  const cl = CLIENTS.find(c => c.id === task.clientId);
  const dev = DEVELOPERS.find(d => d.id === task.assignedTo);
  const remaining = Math.max(0, task.estimatedHours - task.loggedHours);
  const isDone = task.status === 'COMPLETED';

  // Populate header and KPIs
  const clientEl = document.getElementById('task-log-drawer-client');
  if (clientEl) clientEl.innerText = cl ? cl.code : 'TASK';

  const typeEl = document.getElementById('task-log-drawer-type');
  if (typeEl) {
    typeEl.innerText = task.taskType === 'PROJECT_SPRINT' ? 'Pre-Planning' : task.taskType === 'AD_HOC_EMERGENCY' ? 'Ad-Hoc' : 'Recurring';
    typeEl.className = `px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
      task.taskType === 'PROJECT_SPRINT' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
      task.taskType === 'AD_HOC_EMERGENCY' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
      'bg-purple-50 text-purple-700 border border-purple-200'
    }`;
  }

  const statusEl = document.getElementById('task-log-drawer-status');
  if (statusEl) {
    statusEl.innerHTML = isDone
      ? '<i class="fa-solid fa-circle-check text-emerald-600 mr-1"></i>Completed'
      : '<i class="fa-solid fa-spinner fa-spin text-amber-600 mr-1"></i>In Progress';
    statusEl.className = `px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
      isDone ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-50 text-amber-800 border border-amber-200'
    }`;
  }

  const titleEl = document.getElementById('task-log-drawer-title');
  if (titleEl) titleEl.innerText = task.title;

  const assigneeEl = document.getElementById('task-log-drawer-assignee');
  if (assigneeEl) assigneeEl.innerText = `Assigned to: ${dev ? dev.name : 'Developer'} · Due: ${task.dueDate || 'Sep 5, 2026'}`;

  const estEl = document.getElementById('task-log-drawer-est');
  if (estEl) estEl.innerText = `${cleanHours(task.estimatedHours)}h`;

  const loggedEl = document.getElementById('task-log-drawer-logged');
  if (loggedEl) loggedEl.innerText = `${cleanHours(task.loggedHours)}h`;

  const remEl = document.getElementById('task-log-drawer-remaining');
  if (remEl) remEl.innerText = `${cleanHours(remaining)}h`;

  // Render the log stream
  renderTaskLogDrawerBody(taskId);

  // Show the drawer
  const drawer = document.getElementById('drawer-task-logs');
  if (drawer) {
    drawer.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
  }

  // Update background task list highlights and sticky sidebar
  renderDeveloperTasks();
  renderDeveloperWorkLogs();
}

function renderTaskLogDrawerBody(taskId) {
  const container = document.getElementById('task-log-drawer-body');
  if (!container) return;

  const task = TASKS.find(t => t.id === taskId);
  const taskLogs = WORK_LOGS.filter(l => l.taskId === taskId);

  if (!taskLogs.length) {
    container.innerHTML = `
      <div class="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6 space-y-3">
        <div class="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center text-lg">
          <i class="fa-solid fa-clock-rotate-left"></i>
        </div>
        <h4 class="text-sm font-bold text-slate-800">No Log Entries Yet</h4>
        <p class="text-xs text-slate-500 max-w-xs mx-auto">There are no work log entries recorded for this task yet. Click below to log your hours and progress notes.</p>
        <button onclick="openLogTimeFromDrawer()" class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 transition-all">
          + Log First Work Entry
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="flex items-center justify-between text-xs font-mono text-slate-400 pb-1">
      <span>Activity Stream (${taskLogs.length} ${taskLogs.length === 1 ? 'entry' : 'entries'})</span>
      <span class="text-indigo-600 font-semibold">${task ? cleanHours(task.loggedHours) : 0}h total logged</span>
    </div>
    <div class="space-y-3">
      ${taskLogs.map(l => `
        <div class="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 hover:border-indigo-200 hover:bg-white transition-all space-y-2">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <span class="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center font-mono">
                ${cleanHours(l.hours)}h
              </span>
              <div>
                <span class="text-xs font-bold text-slate-800 block">${l.devName || 'Developer'}</span>
                <span class="text-[10px] text-slate-400 font-mono">${l.timestamp || 'Today'}</span>
              </div>
            </div>
            <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white text-slate-600 border border-slate-200">
              ${l.clientCode || 'TASK'}
            </span>
          </div>
          <p class="text-xs text-slate-700 leading-relaxed pl-1 font-medium">
            ${l.notes || 'Routine task execution and verification.'}
          </p>
        </div>
      `).join('')}
    </div>
  `;
}

function closeTaskLogDrawer() {
  const drawer = document.getElementById('drawer-task-logs');
  if (drawer) {
    drawer.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }
  state.selectedTaskId = null;
  currentDrawerTaskId = null;
  renderDeveloperTasks();
  renderDeveloperWorkLogs();
}

function openLogTimeFromDrawer() {
  const targetId = currentDrawerTaskId || state.selectedTaskId;
  if (targetId) {
    closeTaskLogDrawer();
    openLogTimeModal(targetId);
  }
}

// ─── Clients Tab ───

function renderClientsTab() {
  const container = document.getElementById('clients-grid-container');
  if (!container) return;
  container.innerHTML = '';

  const badgeColors = {
    ALPHA: 'bg-blue-50 text-blue-700 border-blue-200/80',
    BETA: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
    GAMMA: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    DELTA: 'bg-purple-50 text-purple-700 border-purple-200/80',
    ECHO: 'bg-amber-50 text-amber-800 border-amber-200/80'
  };

  SQUADS.forEach(squad => {
    const squadDevs = DEVELOPERS.filter(d => d.squadId === squad.id);
    const spentH = squad.spentHours || 280;
    const budgetH = squad.budgetHours || 320;
    const burnPct = Math.min(100, Math.round((spentH / budgetH) * 100));
    const code = squad.projectCode || 'PROJECT';
    const badgeClass = badgeColors[code] || 'bg-indigo-50 text-indigo-700 border-indigo-200';

    const card = document.createElement('div');
    card.className = 'bg-white rounded-2xl border border-slate-200/90 p-5 space-y-4 hover:shadow-card-hover transition-all shadow-card flex flex-col justify-between';
    card.innerHTML = `
      <div class="space-y-3">
        <!-- Top row: Project code badge & Health status -->
        <div class="flex items-center justify-between gap-2">
          <span class="text-[11px] font-mono uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-md border ${badgeClass}">
            ${code}
          </span>
          <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
            squad.health === 'at_risk'
              ? 'bg-amber-50 text-amber-700 border border-amber-200'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
          }">
            <span class="w-1.5 h-1.5 rounded-full ${squad.health === 'at_risk' ? 'bg-amber-500' : 'bg-emerald-500'}"></span>
            ${squad.health === 'at_risk' ? 'At Risk' : 'Healthy'}
          </span>
        </div>

        <!-- Squad Project Title & Lead -->
        <div>
          <h4 class="text-base font-bold text-slate-900 tracking-tight">${squad.project || squad.name}</h4>
          <div class="flex items-center gap-2 mt-1 text-xs text-slate-500">
            <span class="font-medium text-slate-700">Lead: <strong>${squad.lead}</strong></span>
            <span class="text-slate-300">•</span>
            <span class="font-mono text-slate-500 font-medium">${squadDevs.length} Engineers</span>
          </div>
        </div>
      </div>

      <!-- Sprint Budget Burn Progress Bar -->
      <div class="space-y-2 pt-2 border-t border-slate-100">
        <div class="flex justify-between items-center text-xs">
          <span class="text-slate-500 font-medium">Sprint Budget Burn</span>
          <span class="text-slate-900 font-mono font-bold">${spentH}h <span class="text-slate-400 font-normal">/ ${budgetH}h</span> <span class="text-indigo-600 font-bold ml-1">(${burnPct}%)</span></span>
        </div>
        <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-100">
          <div class="h-full rounded-full transition-all duration-500 ${burnPct > 85 ? 'bg-amber-500' : 'bg-indigo-600'}" style="width:${burnPct}%"></div>
        </div>
      </div>

      <!-- Footer Buttons -->
      <div class="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <button onclick="switchManagerSquadHub('${squad.id}')" class="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-1.5 border border-slate-200/80 shadow-2xs">
          <i class="fa-solid fa-layer-group text-slate-400 text-[11px]"></i> Squad Hub
        </button>
        <button onclick="openAssignModalWithSquad('${squad.id}')" class="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5">
          <i class="fa-solid fa-plus text-[10px]"></i> Assign Task
        </button>
      </div>`;
    container.appendChild(card);
  });
}


// ─── Developer Inspector Drawer ───

function openDevDrawer(devId) {
  state.drawerDevId = devId;
  const dev = DEVELOPERS.find(d => d.id === devId);
  const cap = getDeveloperCapacity(devId);
  const squad = SQUADS.find(s => s.id === dev.squadId);
  if (!dev || !cap) return;

  document.getElementById('drawer-dev-avatar').innerText = dev.initials;
  document.getElementById('drawer-dev-name').innerText = dev.name;
  document.getElementById('drawer-dev-role').innerText = `${dev.role} · ${squad ? squad.name : ''}`;
  document.getElementById('drawer-dev-load').innerText = `${cap.totalLoad.toFixed(1)} / 40.0h (${cap.utilizationPct}%)`;

  document.getElementById('drawer-dev-bar').innerHTML = `
    <div class="bg-purple-500 h-full" style="width:${(cap.recurringHours/40)*100}%"></div>
    <div class="bg-blue-500 h-full" style="width:${(cap.sprintHours/40)*100}%"></div>
    <div class="bg-amber-500 h-full" style="width:${(cap.adhocHours/40)*100}%"></div>`;

  document.getElementById('drawer-dev-status').innerHTML = cap.isOverallocated
    ? `<span class="text-rose-600 font-bold">+${cap.overage.toFixed(1)}h overbooked</span>`
    : `<span class="text-emerald-600 font-bold">${cap.availableBuffer.toFixed(1)}h available</span>`;

  const tasksEl = document.getElementById('drawer-dev-tasks');
  const devTasks = TASKS.filter(t => t.assignedTo === devId);
  tasksEl.innerHTML = devTasks.length ? devTasks.map(t => `
    <div class="p-3 rounded-lg bg-slate-50 border border-slate-100 text-sm space-y-1.5">
      <div class="font-semibold text-slate-700 truncate">${t.title}</div>
      <div class="flex justify-between text-xs text-slate-500 font-mono">
        <span>Est: ${t.estimatedHours.toFixed(1)}h</span>
        <span class="text-emerald-600 font-semibold">Logged: ${t.loggedHours.toFixed(1)}h</span>
      </div>
    </div>`).join('') : '<div class="text-slate-400 text-sm font-mono">No active tasks.</div>';

  document.getElementById('drawer-dev-recurring').innerHTML = `
    <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex justify-between text-slate-600"><span>Daily Standup</span><span class="text-purple-600 font-mono font-bold">2.5h</span></div>
    <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex justify-between text-slate-600"><span>PR Reviews</span><span class="text-purple-600 font-mono font-bold">${(dev.recurringHours - 2.5).toFixed(1)}h</span></div>`;

  renderDrawerWorkLogs(devId);

  document.getElementById('drawer-dev-inspector').classList.remove('hidden');
}

function renderDrawerWorkLogs(devId) {
  const container = document.getElementById('drawer-dev-worklogs');
  const countBadge = document.getElementById('drawer-dev-logs-count');
  if (!container) return;
  
  const devLogs = WORK_LOGS.filter(l => l.developerId === devId);
  if (countBadge) countBadge.innerText = `${devLogs.length} ${devLogs.length === 1 ? 'entry' : 'entries'}`;
  
  if (!devLogs.length) {
    container.innerHTML = '<div class="p-3 text-center text-xs text-slate-400 font-mono">No work notes submitted yet.</div>';
    return;
  }
  
  container.innerHTML = devLogs.map(log => `
    <div class="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1.5 text-xs">
      <div class="flex items-center justify-between">
        <span class="font-semibold text-slate-800 truncate max-w-[220px]">${log.taskTitle}</span>
        <span class="font-mono text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">+${log.hours.toFixed(1)}h</span>
      </div>
      <p class="text-slate-600 italic text-xs pl-2.5 border-l-2 border-emerald-400 font-sans">"${log.notes}"</p>
      <div class="text-[11px] text-slate-400 font-mono flex items-center justify-between pt-1">
        <span><i class="fa-regular fa-clock text-[10px] mr-1"></i>${log.timestamp}</span>
        <span class="text-slate-600 font-semibold">${log.clientCode || 'TASK'}</span>
      </div>
    </div>
  `).join('');
}

function closeDevDrawer() { document.getElementById('drawer-dev-inspector').classList.add('hidden'); }
function openAssignFromDrawer() { closeDevDrawer(); openAssignModalWithDev(state.drawerDevId); }


// ─── Command Palette ───

function toggleCommandPalette() {
  const m = document.getElementById('modal-command-palette');
  if (m.classList.contains('hidden')) { m.classList.remove('hidden'); document.getElementById('cmd-input').value = ''; document.getElementById('cmd-input').focus(); handleCommandPaletteSearch(''); }
  else { m.classList.add('hidden'); }
}

function handleCommandPaletteSearch(query) {
  const container = document.getElementById('cmd-results');
  container.innerHTML = '';
  const q = query.toLowerCase().trim();
  const matched = DEVELOPERS.filter(d => d.name.toLowerCase().includes(q) || d.role.toLowerCase().includes(q)).slice(0, 6);

  if (matched.length) {
    container.innerHTML += '<div class="px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-slate-400 font-semibold">Developers</div>';
    matched.forEach(d => {
      const cap = getDeveloperCapacity(d.id);
      const btn = document.createElement('button');
      btn.className = 'w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center justify-between transition-colors';
      btn.onclick = () => { toggleCommandPalette(); openDevDrawer(d.id); };
      btn.innerHTML = `
        <div class="flex items-center gap-2"><div class="w-6 h-6 rounded-md bg-slate-100 text-slate-600 font-bold text-[9px] flex items-center justify-center border border-slate-200">${d.initials}</div><span class="text-xs text-slate-700 font-medium">${d.name}</span><span class="text-[10px] text-slate-400">${d.role}</span></div>
        <span class="text-[10px] font-mono ${cap.isOverallocated ? 'text-rose-600' : 'text-emerald-600'} font-bold">${cap.totalLoad.toFixed(1)}h</span>`;
      container.appendChild(btn);
    });
  }
  container.innerHTML += '<div class="px-3 pt-2 pb-1 text-[10px] font-mono uppercase tracking-widest text-slate-400 font-semibold">Actions</div>';
  const actTeam = document.createElement('button');
  actTeam.className = 'w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center gap-2 text-indigo-600 font-semibold text-xs transition-colors';
  actTeam.onclick = () => { toggleCommandPalette(); openCreateSquadModal(); };
  actTeam.innerHTML = '<i class="fa-solid fa-users-gear text-[10px]"></i> + Create New Team / Squad';
  container.appendChild(actTeam);

  const act = document.createElement('button');
  act.className = 'w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center gap-2 text-blue-600 font-semibold text-xs transition-colors';
  act.onclick = () => { toggleCommandPalette(); openAssignModal(); };
  act.innerHTML = '<i class="fa-solid fa-plus text-[10px]"></i> Create & Assign Task';
  container.appendChild(act);
}

function setupKeyboardShortcuts() {
  window.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); toggleCommandPalette(); }
    if (e.key === 'Escape') {
      document.getElementById('modal-command-palette').classList.add('hidden');
      closeAssignModal();
      closeLogTimeModal();
      closeDevDrawer();
      closeTaskLogDrawer();
      closeCreateSquadModal();
      closeEditBlockerModal();
    }
  });
}


// ─── Modals & Actions ───

// ═══════════════════════════════════════════════════════════
// PRE-FLIGHT TASK ASSIGNMENT (SINGLE, MULTI & TEAM MODES)
// ═══════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════
// 1-CLICK TASK TEMPLATES ENGINE
// Rapid blueprint creation for high-frequency work types
// ═══════════════════════════════════════════════════════════

const TASK_TEMPLATES = {
  feature: {
    key: 'feature',
    name: 'Feature delivery',
    title: '[FEAT] Implement API Gateway & Auth Endpoint',
    category: 'DEVELOPMENT',
    taskType: 'PROJECT_SPRINT',
    hours: 6.0,
    priority: 'P2_MEDIUM',
    dueDate: 'Sep 6, 2026 · 06:00 PM',
    btnId: 'template-btn-feature',
    activeClass: 'bg-blue-50 border-blue-500 text-blue-800 shadow-sm ring-2 ring-blue-100'
  },
  bugfix: {
    key: 'bugfix',
    name: 'Production bug fix',
    title: '[FIX] Resolve Production Session Timeout & Cache Invalidation',
    category: 'BUG_FIX',
    taskType: 'AD_HOC_EMERGENCY',
    hours: 2.5,
    priority: 'P1_HIGH',
    dueDate: 'Today · 06:00 PM',
    btnId: 'template-btn-bugfix',
    activeClass: 'bg-rose-50 border-rose-500 text-rose-800 shadow-sm ring-2 ring-rose-100'
  },
  qa: {
    key: 'qa',
    name: 'Quality assurance',
    title: '[QA] End-to-End Regression & Sandbox Verification',
    category: 'TESTING_QA',
    taskType: 'PROJECT_SPRINT',
    hours: 4.0,
    priority: 'P2_MEDIUM',
    dueDate: 'Sep 5, 2026 · 05:00 PM',
    btnId: 'template-btn-qa',
    activeClass: 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm ring-2 ring-emerald-100'
  },
  reporting: {
    key: 'reporting',
    name: 'Sprint reporting',
    title: '[REPORT] Sprint Milestone & Client SLA Health Report',
    category: 'REPORTING',
    taskType: 'RECURRING',
    hours: 2.0,
    priority: 'P2_MEDIUM',
    dueDate: 'Every Friday · 04:00 PM',
    btnId: 'template-btn-reporting',
    activeClass: 'bg-purple-50 border-purple-500 text-purple-800 shadow-sm ring-2 ring-purple-100'
  },
  devops: {
    key: 'devops',
    name: 'Platform operations',
    title: '[OPS] Database Index Optimization & Replica Sync Check',
    category: 'DEVOPS',
    taskType: 'RECURRING',
    hours: 3.0,
    priority: 'P2_MEDIUM',
    dueDate: 'Every Thursday · 02:00 PM',
    btnId: 'template-btn-devops',
    activeClass: 'bg-cyan-50 border-cyan-500 text-cyan-800 shadow-sm ring-2 ring-cyan-100'
  }
};

function toDateTimeLocalValue(value, fallback = '2026-09-06T18:00') {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) return value.slice(0, 16);
  const parsed = new Date(String(value).replace(/[\u00C2\u00B7]/g, ' '));
  if (Number.isNaN(parsed.getTime())) return fallback;
  const pad = number => String(number).padStart(2, '0');
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}T${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
}

function formatDueDate(value, fallback = 'No due date') {
  if (!value || value === 'Set when assigning') return fallback;
  const parsed = new Date(String(value).replace(/[\u00C2\u00B7]/g, ' '));
  if (Number.isNaN(parsed.getTime())) return value;
  const date = parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const time = parsed.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${date} · ${time}`;
}

function renderAssignmentTemplatePills() {
  const select = document.getElementById('assign-template-select');
  if (!select) return;
  const iconByCategory = { DEVELOPMENT: '💻', BUG_FIX: '🐛', TESTING_QA: '🧪', REPORTING: '📊', UI_UX: '🎨', DEVOPS: '⚙️', MEETING: '👥' };
  const currentVal = select.value || '';
  
  let html = `<option value="">⚡ Select a 1-Click Task Template to auto-fill...</option>`;
  Object.entries(TASK_TEMPLATES).forEach(([key, template]) => {
    const icon = iconByCategory[template.category] || '✨';
    const name = getTemplateDisplayName(template, key);
    const prio = (template.priority || '').replace('P1_HIGH', 'P1 Urgent').replace('P2_MEDIUM', 'P2 Standard').replace('P3_LOW', 'P3 Low');
    html += `<option value="${key}">${icon} ${name} (${Number(template.hours || 0).toFixed(1)}h · ${prio})</option>`;
  });
  select.innerHTML = html;
  if (currentVal && TASK_TEMPLATES[currentVal]) {
    select.value = currentVal;
  }
}

function applyTaskTemplate(templateKey) {
  if (!templateKey) return;
  const tpl = TASK_TEMPLATES[templateKey];
  if (!tpl) return;

  const select = document.getElementById('assign-template-select');
  if (select && select.value !== templateKey) {
    select.value = templateKey;
  }

  const titleInput = document.getElementById('assign-title-input');
  if (titleInput) titleInput.value = tpl.title;

  const catSelect = document.getElementById('assign-category-select');
  if (catSelect) catSelect.value = tpl.category;

  const typeSelect = document.getElementById('assign-type-select');
  if (typeSelect) typeSelect.value = tpl.taskType;

  const recurrenceSelect = document.getElementById('assign-recurrence-select');
  if (recurrenceSelect) recurrenceSelect.value = tpl.recurrence || 'WEEKLY';
  toggleRecurringAssignmentFields();

  const hoursInput = document.getElementById('assign-hours-input');
  if (hoursInput) hoursInput.value = tpl.hours;

  const prioritySelect = document.getElementById('assign-priority-select');
  if (prioritySelect) prioritySelect.value = tpl.priority;

  const dueDateInput = document.getElementById('assign-due-date-input');
  if (dueDateInput) dueDateInput.value = toDateTimeLocalValue(tpl.dueDate);

  // Re-run the workload simulation immediately
  onAssignHoursChange();

  showToast(`⚡ Loaded "${getTemplateDisplayName(tpl, tpl.key)}" template (${tpl.hours}h · ${tpl.priority.replace('_', ' ')})`);
}

function resetTaskTemplatePills() {
  const select = document.getElementById('assign-template-select');
  if (select) select.value = '';
}

const TEMPLATE_LABELS = {
  DEVELOPMENT: 'Development',
  TESTING_QA: 'Testing & QA',
  BUG_FIX: 'Bug Fix',
  REPORTING: 'Reporting',
  UI_UX: 'UI/UX',
  DEVOPS: 'DevOps',
  MEETING: 'Architecture & Sync'
};

const TEMPLATE_TYPE_LABELS = {
  PRE_PLAN: 'Pre-Planning',
  PRE_PLANNING: 'Pre-Planning',
  PROJECT_SPRINT: 'Pre-Planning',
  AD_HOC_EMERGENCY: 'Ad-Hoc Emergency',
  RECURRING: 'Recurring Routine',
  RECURRING_ROUTINE: 'Recurring Routine'
};

const RECURRENCE_LABELS = { DAILY: 'Daily', WEEKLY: 'Weekly', MONTHLY: 'Monthly' };

function toggleRecurringAssignmentFields() {
  const val = document.getElementById('assign-type-select')?.value;
  const isRecurring = val === 'RECURRING_ROUTINE' || val === 'RECURRING';
  document.getElementById('assign-recurrence-fields')?.classList.toggle('hidden', !isRecurring);
}

function toggleRecurringTemplateFields() {
  const val = document.getElementById('template-editor-type')?.value;
  const isRecurring = val === 'RECURRING_ROUTINE' || val === 'RECURRING';
  document.getElementById('template-editor-recurrence-fields')?.classList.toggle('hidden', !isRecurring);
}

function getTemplateDisplayName(template, key) {
  return template.name || template.key || key.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function getTemplateAccent(template) {
  if (template.taskType === 'AD_HOC_EMERGENCY' || template.category === 'BUG_FIX') return 'rose';
  if (template.taskType === 'RECURRING_ROUTINE' || template.taskType === 'RECURRING') return 'purple';
  if (template.category === 'TESTING_QA') return 'emerald';
  if (template.category === 'DEVOPS') return 'cyan';
  return 'blue';
}

function renderTemplateLibrary() {
  const grid = document.getElementById('template-library-grid');
  const filters = document.getElementById('template-library-filters');
  if (!grid || !filters) return;

  const query = (document.getElementById('template-library-search')?.value || '').toLowerCase().trim();
  const keys = Object.keys(TASK_TEMPLATES);
  const categories = ['ALL', ...new Set(keys.map(key => TASK_TEMPLATES[key].category).filter(Boolean))];
  const activeFilter = state.templateCategoryFilter || 'ALL';

  filters.innerHTML = categories.map(category => `
    <button onclick="setTemplateCategoryFilter('${category}')" class="template-filter-pill ${activeFilter === category ? 'is-active' : ''}">
      ${category === 'ALL' ? 'All templates' : (TEMPLATE_LABELS[category] || category)}
    </button>
  `).join('');

  const matches = keys.filter(key => {
    const template = TASK_TEMPLATES[key];
    const searchable = `${getTemplateDisplayName(template, key)} ${template.title || ''} ${template.category || ''} ${template.taskType || ''}`.toLowerCase();
    return (!query || searchable.includes(query)) && (activeFilter === 'ALL' || template.category === activeFilter);
  });

  const badge = document.getElementById('nav-badge-templates');
  if (badge) badge.innerText = keys.length;

  if (!matches.length) {
    grid.innerHTML = `<div class="template-empty-state md:col-span-2 xl:col-span-3"><div class="template-empty-icon"><i class="fa-solid fa-layer-group"></i></div><h3>No templates found</h3><p>Try another search or create a new reusable blueprint.</p><button onclick="openTemplateEditor()" class="template-empty-action">Create template</button></div>`;
    return;
  }

  grid.innerHTML = matches.map(key => {
    const template = TASK_TEMPLATES[key];
    const accent = getTemplateAccent(template);
    const isCustom = template.custom === true;
    return `
      <article class="template-library-card accent-${accent}">
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-3 min-w-0">
            <div class="template-card-icon"><i class="fa-solid ${template.icon || 'fa-wand-magic-sparkles'}"></i></div>
            <div class="min-w-0"><h3 class="truncate">${getTemplateDisplayName(template, key)}</h3><span class="template-card-meta">${isCustom ? 'Custom blueprint' : 'Built-in blueprint'}</span></div>
          </div>
          <div class="template-card-menu"><button onclick="openTemplateEditor('${key}')" title="Update template" aria-label="Update ${getTemplateDisplayName(template, key)}"><i class="fa-solid fa-pen"></i><span>Update</span></button>${isCustom ? `<button onclick="deleteTaskTemplate('${key}')" title="Delete template" aria-label="Delete ${getTemplateDisplayName(template, key)}"><i class="fa-solid fa-trash"></i></button>` : ''}</div>
        </div>
        <p class="template-card-title">${template.title || 'Untitled task blueprint'}</p>
        <div class="template-card-tags"><span>${TEMPLATE_LABELS[template.category] || template.category}</span><span>${TEMPLATE_TYPE_LABELS[template.taskType] || template.taskType}</span>${template.taskType === 'RECURRING' ? `<span><i class="fa-solid fa-repeat mr-1"></i>${RECURRENCE_LABELS[template.recurrence || 'WEEKLY']}</span>` : ''}</div>
        <div class="template-card-footer"><span><strong>${Number(template.hours || 0).toFixed(1)}h</strong> estimate</span><span>${template.priority?.replace('_', ' ') || 'P2_MEDIUM'}</span><span>${formatDueDate(template.dueDate)}</span></div>
        <button onclick="launchTemplateAssignment('${key}')" class="template-use-button"><i class="fa-solid fa-arrow-up-right-from-square"></i> Use template</button>
      </article>
    `;
  }).join('');
}

function setTemplateCategoryFilter(category) {
  state.templateCategoryFilter = category;
  renderTemplateLibrary();
}

function openTemplateEditor(key = '') {
  const modal = document.getElementById('modal-template-editor');
  if (!modal) return;
  const template = key && TASK_TEMPLATES[key] ? TASK_TEMPLATES[key] : {};
  document.getElementById('template-editor-id').value = key;
  document.getElementById('template-editor-title').innerText = key ? 'Edit task template' : 'New task template';
  const submitButton = document.getElementById('template-editor-submit');
  if (submitButton) submitButton.innerHTML = key
    ? '<i class="fa-solid fa-rotate"></i><span>Update template</span>'
    : '<i class="fa-solid fa-check"></i><span>Save template</span>';
  document.getElementById('template-editor-name').value = template.name || '';
  document.getElementById('template-editor-task-title').value = template.title || '';
  document.getElementById('template-editor-category').value = template.category || 'DEVELOPMENT';
  document.getElementById('template-editor-type').value = template.taskType || 'PROJECT_SPRINT';
  document.getElementById('template-editor-recurrence').value = template.recurrence || 'WEEKLY';
  toggleRecurringTemplateFields();
  document.getElementById('template-editor-hours').value = template.hours || 4;
  document.getElementById('template-editor-priority').value = template.priority || 'P2_MEDIUM';
  document.getElementById('template-editor-due-date').value = toDateTimeLocalValue(template.dueDate, '');
  document.getElementById('template-editor-error').classList.add('hidden');
  modal.classList.remove('hidden');
}

function closeTemplateEditor() {
  document.getElementById('modal-template-editor')?.classList.add('hidden');
}

function saveTemplateEditor() {
  const id = document.getElementById('template-editor-id')?.value || '';
  const name = document.getElementById('template-editor-name')?.value.trim() || '';
  const title = document.getElementById('template-editor-task-title')?.value.trim() || '';
  const hours = parseFloat(document.getElementById('template-editor-hours')?.value || 0);
  const error = document.getElementById('template-editor-error');
  if (!name || !title || !hours || hours <= 0) {
    if (error) { error.innerText = 'Add a template name, task title, and a valid estimate.'; error.classList.remove('hidden'); }
    return;
  }

  const key = id || `custom_${Date.now().toString(36)}`;
  const existing = TASK_TEMPLATES[key] || {};
  TASK_TEMPLATES[key] = {
    ...existing,
    key,
    name,
    title,
    category: document.getElementById('template-editor-category').value,
    taskType: document.getElementById('template-editor-type').value,
    recurrence: document.getElementById('template-editor-type').value === 'RECURRING' ? document.getElementById('template-editor-recurrence').value : null,
    hours,
    priority: document.getElementById('template-editor-priority').value,
    dueDate: document.getElementById('template-editor-due-date').value || '',
    custom: id ? existing.custom === true : true,
    icon: existing.icon || 'fa-wand-magic-sparkles',
    btnId: existing.btnId || null,
    activeClass: existing.activeClass || 'bg-blue-50 border-blue-500 text-blue-800 shadow-sm ring-2 ring-blue-100'
  };
  saveAppState();
  closeTemplateEditor();
  renderTemplateLibrary();
  showToast(`Template "${name}" ${id ? 'updated' : 'saved'}`, 'success');
}

function deleteTaskTemplate(key) {
  if (!TASK_TEMPLATES[key]?.custom) return;
  delete TASK_TEMPLATES[key];
  saveAppState();
  renderTemplateLibrary();
  showToast('Template removed', 'info');
}

function launchTemplateAssignment(key) {
  if (!TASK_TEMPLATES[key]) return;
  openAssignModal();
  applyTaskTemplate(key);
}

let assignState = {
  mode: 'single', // 'single' | 'multi' | 'team'
  selectedSingleSquad: 'all',
  selectedMultiSquad: 'all',
  selectedMultiDevIds: new Set(),
  multiSplitMode: 'split' // 'split' | 'full'
};

function openAssignModal() {
  renderAssignmentTemplatePills();
  // Reset template pills
  resetTaskTemplatePills();

  // Populate Assigned By Dropdown
  const assignBySel = document.getElementById('assign-by-select');
  if (assignBySel) {
    assignBySel.innerHTML = `
      <option value="Marcus Vance (Project Manager)" selected>Marcus Vance (Project Manager)</option>
      <option value="David Miller (Tech Lead - Squad A)">David Miller (Tech Lead - Squad A)</option>
      <option value="Sarah Jenkins (Tech Lead - Squad B)">Sarah Jenkins (Tech Lead - Squad B)</option>
      <option value="Robert Chang (Tech Lead - Squad C)">Robert Chang (Tech Lead - Squad C)</option>
      <option value="Elena Rostova (Tech Lead - Squad D)">Elena Rostova (Tech Lead - Squad D)</option>
      <option value="Marcus Brody (Tech Lead - Squad E)">Marcus Brody (Tech Lead - Squad E)</option>
    `;
  }

  // Populate Squad Selectors
  populateAssignSquadDropdowns();

  // Reset multi dev selections
  assignState.selectedMultiDevIds.clear();
  assignState.selectedSingleSquad = 'all';
  assignState.selectedMultiSquad = 'all';
  assignState.multiSplitMode = 'split';

  // Default mode: single
  switchAssignMode('single');
  toggleRecurringAssignmentFields();

  document.getElementById('modal-assign').classList.remove('hidden');
}

function closeAssignModal() {
  document.getElementById('modal-assign').classList.add('hidden');
}

function openAssignModalWithDev(devId) {
  openAssignModal();
  const dev = DEVELOPERS.find(d => d.id === devId);
  if (dev) {
    assignState.selectedSingleSquad = dev.squadId;
    const squadFilter = document.getElementById('assign-single-squad-filter');
    if (squadFilter) squadFilter.value = dev.squadId;
    populateSingleAssigneeDropdown(dev.squadId);
    const assignDevSel = document.getElementById('assign-dev-select');
    if (assignDevSel) assignDevSel.value = devId;
    runAssignmentSimulation();
  }
}

function openAssignModalWithSquad(squadId) {
  openAssignModal();
  switchAssignMode('team');
  const teamSquad = document.getElementById('assign-team-squad-select');
  if (teamSquad) {
    teamSquad.value = squadId;
    runTeamAssignmentSimulation();
  }
}

function openAssignModalForClient(clientId) {
  openAssignModal();
}

function populateAssignSquadDropdowns() {
  const squadOptions = `
    <option value="all">All Squads (${SQUADS.length})</option>
    ${SQUADS.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
  `;

  const singleSquad = document.getElementById('assign-single-squad-filter');
  const multiSquad = document.getElementById('assign-multi-squad-filter');
  const teamSquad = document.getElementById('assign-team-squad-select');

  if (singleSquad) singleSquad.innerHTML = squadOptions;
  if (multiSquad) multiSquad.innerHTML = squadOptions;
  if (teamSquad) teamSquad.innerHTML = SQUADS.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
}

function switchAssignMode(mode) {
  assignState.mode = mode;

  const btnSingle = document.getElementById('assign-mode-btn-single');
  const btnMulti = document.getElementById('assign-mode-btn-multi');
  const btnTeam = document.getElementById('assign-mode-btn-team');

  const panelSingle = document.getElementById('assign-panel-single');
  const panelMulti = document.getElementById('assign-panel-multi');
  const panelTeam = document.getElementById('assign-panel-team');

  const helper = document.getElementById('assign-mode-helper');

  const activeClass = 'py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 bg-white text-blue-700 shadow-sm';
  const inactiveClass = 'py-2 px-3 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-800 transition-all flex items-center justify-center gap-2';

  if (btnSingle) btnSingle.className = mode === 'single' ? activeClass : inactiveClass;
  if (btnMulti) btnMulti.className = mode === 'multi' ? activeClass : inactiveClass;
  if (btnTeam) btnTeam.className = mode === 'team' ? activeClass : inactiveClass;

  if (panelSingle) panelSingle.classList.toggle('hidden', mode !== 'single');
  if (panelMulti) panelMulti.classList.toggle('hidden', mode !== 'multi');
  if (panelTeam) panelTeam.classList.toggle('hidden', mode !== 'team');

  if (helper) {
    if (mode === 'single') helper.innerText = 'Assign directly to one engineer with pre-flight check';
    else if (mode === 'multi') helper.innerText = 'Assign to a collaborative pair or multi-dev pod';
    else helper.innerText = 'Assign to the entire squad backlog and Tech Lead';
  }

  if (mode === 'single') {
    populateSingleAssigneeDropdown(assignState.selectedSingleSquad);
    runAssignmentSimulation();
  } else if (mode === 'multi') {
    renderMultiAssignDevList();
    runMultiAssignmentSimulation();
  } else if (mode === 'team') {
    runTeamAssignmentSimulation();
  }
}

function onAssignHoursChange() {
  if (assignState.mode === 'single') runAssignmentSimulation();
  else if (assignState.mode === 'multi') runMultiAssignmentSimulation();
  else if (assignState.mode === 'team') runTeamAssignmentSimulation();
}

// ── Single Mode Logic ──

function onSingleSquadFilterChange(squadId) {
  assignState.selectedSingleSquad = squadId;
  populateSingleAssigneeDropdown(squadId);
  runAssignmentSimulation();
}

function populateSingleAssigneeDropdown(squadId = 'all') {
  const sel = document.getElementById('assign-dev-select');
  if (!sel) return;
  sel.innerHTML = '';

  const devs = DEVELOPERS.filter(d => squadId === 'all' || d.squadId === squadId);
  devs.forEach(d => {
    const c = getDeveloperCapacity(d.id);
    const opt = document.createElement('option');
    opt.value = d.id;
    opt.innerText = `${d.name} (${d.role}) — ${c.availableBuffer.toFixed(1)}h free`;
    sel.appendChild(opt);
  });
}

function runAssignmentSimulation() {
  const devSelect = document.getElementById('assign-dev-select');
  if (!devSelect || !devSelect.value) return;

  const devId = devSelect.value;
  const hrs = parseFloat(document.getElementById('assign-hours-input').value) || 0;
  const sim = simulateAssignment(devId, hrs);
  const box = document.getElementById('sim-audit-container');
  const btn = document.getElementById('btn-submit-task-assignment');

  if (sim.isOverallocated) {
    box.className = 'p-3.5 rounded-2xl border bg-rose-50 border-rose-200 space-y-2.5';
    box.innerHTML = `
      <div class="flex items-center justify-between text-xs font-semibold text-rose-700">
        <span class="flex items-center gap-1.5"><i class="fa-solid fa-triangle-exclamation text-xs"></i> Capacity Breach</span>
        <span class="font-mono bg-rose-100 px-2 py-0.5 rounded-full text-rose-700 border border-rose-200 font-bold">+${sim.simulatedOverage.toFixed(1)}h over limit</span>
      </div>
      <div class="text-xs text-slate-600">
        <strong>${sim.current.developer.name}</strong> is currently at <strong>${sim.current.totalLoad.toFixed(1)}h</strong>. Adding <strong>${hrs.toFixed(1)}h</strong> results in <strong>${sim.simulatedTotal.toFixed(1)}h / 40h</strong> workload.
      </div>
      ${sim.alternatives.length ? `
        <div class="pt-2 border-t border-rose-200/80 flex items-center justify-between text-xs">
          <span class="text-emerald-700 font-medium">
            💡 Recommended alternative: <strong>${sim.alternatives[0].developer.name}</strong> (${sim.alternatives[0].availableBuffer.toFixed(1)}h free buffer)
          </span>
          <button type="button" onclick="autoSelectDev('${sim.alternatives[0].developer.id}')" class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors">
            Switch
          </button>
        </div>` : ''}`;
    if (btn) {
      btn.innerText = 'Force Assign (Overtime)';
      btn.className = 'px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold shadow-md shadow-rose-200 transition-all flex items-center gap-2';
    }
  } else {
    box.className = 'p-3.5 rounded-2xl border bg-emerald-50 border-emerald-200 space-y-2';
    box.innerHTML = `
      <div class="flex items-center justify-between text-xs font-semibold text-emerald-700">
        <span class="flex items-center gap-1.5"><i class="fa-solid fa-circle-check text-xs"></i> Pre-Flight Passed (Within Capacity)</span>
        <span class="font-mono bg-emerald-100 px-2 py-0.5 rounded-full text-emerald-800 font-bold">${sim.simulatedRemaining.toFixed(1)}h buffer left</span>
      </div>
      <div class="text-xs text-slate-600">
        <strong>${sim.current.developer.name}</strong>: <strong>${sim.current.totalLoad.toFixed(1)}h</strong> + <strong>${hrs.toFixed(1)}h</strong> → <strong>${sim.simulatedTotal.toFixed(1)}h / 40.0h</strong> (${Math.round((sim.simulatedTotal/40)*100)}% load)
      </div>`;
    if (btn) {
      btn.innerText = 'Confirm Assignment';
      btn.className = 'px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-200 transition-all flex items-center gap-2';
    }
  }
}

function autoSelectDev(devId) {
  const sel = document.getElementById('assign-dev-select');
  if (sel) {
    sel.value = devId;
    runAssignmentSimulation();
  }
}

// ── Multiple Developers Mode Logic ──

function onMultiSquadFilterChange(squadId) {
  assignState.selectedMultiSquad = squadId;
  renderMultiAssignDevList();
  runMultiAssignmentSimulation();
}

function onMultiSplitModeChange(mode) {
  assignState.multiSplitMode = mode;
  runMultiAssignmentSimulation();
}

function filterMultiAssignDevList(query) {
  renderMultiAssignDevList(query);
}

function renderMultiAssignDevList(query = '') {
  const container = document.getElementById('assign-multi-dev-list');
  if (!container) return;

  const squadId = assignState.selectedMultiSquad;
  const q = (query || '').toLowerCase().trim();

  const devs = DEVELOPERS.filter(d => {
    if (squadId !== 'all' && d.squadId !== squadId) return false;
    if (!q) return true;
    const curSquad = SQUADS.find(s => s.id === d.squadId);
    return d.name.toLowerCase().includes(q) || d.role.toLowerCase().includes(q) || (curSquad && curSquad.name.toLowerCase().includes(q));
  });

  if (!devs.length) {
    container.innerHTML = '<div class="text-xs text-slate-400 font-mono text-center py-4">No developers match filter.</div>';
    return;
  }

  container.innerHTML = devs.map(d => {
    const isChecked = assignState.selectedMultiDevIds.has(d.id);
    const cap = getDeveloperCapacity(d.id);
    const curSquad = SQUADS.find(s => s.id === d.squadId);

    return `
      <label class="flex items-center justify-between p-2.5 rounded-xl ${isChecked ? 'bg-blue-50/80 border border-blue-200' : 'bg-white border border-slate-100 hover:border-slate-200'} cursor-pointer transition-all">
        <div class="flex items-center gap-3 min-w-0">
          <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="toggleMultiAssignDev('${d.id}')" class="rounded accent-blue-600 w-4 h-4 cursor-pointer">
          <div class="w-7 h-7 rounded-full bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center font-mono flex-shrink-0">
            ${d.initials || 'DEV'}
          </div>
          <div class="min-w-0">
            <div class="text-xs font-bold text-slate-900 truncate">${d.name}</div>
            <div class="text-[11px] text-slate-500 font-mono truncate">${d.role} · ${curSquad ? curSquad.name.replace(/\s\(.*\)/, '') : ''}</div>
          </div>
        </div>
        <span class="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full ${cap.isOverallocated ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'} flex-shrink-0">
          ${cap.isOverallocated ? `+${cap.overage.toFixed(1)}h over` : `${cap.availableBuffer.toFixed(1)}h free`}
        </span>
      </label>
    `;
  }).join('');
}

function toggleMultiAssignDev(devId) {
  if (assignState.selectedMultiDevIds.has(devId)) {
    assignState.selectedMultiDevIds.delete(devId);
  } else {
    assignState.selectedMultiDevIds.add(devId);
  }
  const searchInput = document.getElementById('assign-multi-dev-search');
  renderMultiAssignDevList(searchInput ? searchInput.value : '');
  runMultiAssignmentSimulation();
}

function runMultiAssignmentSimulation() {
  const box = document.getElementById('multi-sim-audit-container');
  const btn = document.getElementById('btn-submit-task-assignment');
  if (!box) return;

  const totalHrs = parseFloat(document.getElementById('assign-hours-input').value) || 0;
  const count = assignState.selectedMultiDevIds.size;

  if (count === 0) {
    box.className = 'p-3.5 rounded-2xl border bg-slate-50 border-slate-200 text-center text-xs text-slate-500 font-mono';
    box.innerHTML = '👉 Select 2 or more developers from the list above to assign this task as a pair / pod.';
    if (btn) {
      btn.innerText = 'Select Developers';
      btn.className = 'px-6 py-2.5 rounded-xl bg-slate-300 text-slate-600 text-sm font-bold cursor-not-allowed';
    }
    return;
  }

  const hoursPerDev = assignState.multiSplitMode === 'split' ? (totalHrs / count) : totalHrs;
  let hasBreach = false;

  const devSims = Array.from(assignState.selectedMultiDevIds).map(devId => {
    const sim = simulateAssignment(devId, hoursPerDev);
    if (sim.isOverallocated) hasBreach = true;
    return sim;
  });

  const statusPill = hasBreach
    ? `<span class="bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded-full text-xs font-mono">⚠️ Capacity Breach</span>`
    : `<span class="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full text-xs font-mono">✅ All Within Capacity</span>`;

  box.className = `p-3.5 rounded-2xl border ${hasBreach ? 'bg-rose-50 border-rose-200' : 'bg-blue-50 border-blue-200'} space-y-2.5`;
  box.innerHTML = `
    <div class="flex items-center justify-between text-xs">
      <span class="font-bold text-slate-800">
        ${count} Engineers Selected · ${hoursPerDev.toFixed(1)}h each ${assignState.multiSplitMode === 'split' ? '(Split equally)' : '(Full hours)'}
      </span>
      ${statusPill}
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
      ${devSims.map(s => `
        <div class="p-2 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
          <span class="font-semibold text-slate-800 truncate">${s.current.developer.name}</span>
          <span class="font-mono text-[11px] ${s.isOverallocated ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}">
            ${s.simulatedTotal.toFixed(1)}h / 40h
          </span>
        </div>
      `).join('')}
    </div>
  `;

  if (btn) {
    if (hasBreach) {
      btn.innerText = 'Force Assign Pod (Overtime)';
      btn.className = 'px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold shadow-md shadow-rose-200 transition-all flex items-center gap-2';
    } else {
      btn.innerText = `Assign to ${count} Developers`;
      btn.className = 'px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-200 transition-all flex items-center gap-2';
    }
  }
}

// ── Entire Team / Squad Mode Logic ──

function runTeamAssignmentSimulation() {
  const box = document.getElementById('team-sim-audit-container');
  const squadSelect = document.getElementById('assign-team-squad-select');
  const btn = document.getElementById('btn-submit-task-assignment');
  if (!box || !squadSelect) return;

  const squadId = squadSelect.value;
  const squad = SQUADS.find(s => s.id === squadId);
  if (!squad) return;

  const squadDevs = DEVELOPERS.filter(d => d.squadId === squad.id);
  const totalCap = squadDevs.length * 40;
  let totalAlloc = 0;
  squadDevs.forEach(d => {
    totalAlloc += getDeveloperCapacity(d.id).totalLoad;
  });
  const utilPct = totalCap > 0 ? Math.round((totalAlloc / totalCap) * 100) : 0;
  const freeSquadBuffer = Math.max(0, totalCap - totalAlloc);

  box.className = 'p-4 rounded-2xl border bg-indigo-50/70 border-indigo-200 space-y-3';
  box.innerHTML = `
    <div class="flex items-center justify-between">
      <div>
        <div class="text-sm font-bold text-slate-900">${squad.name}</div>
        <div class="text-xs text-slate-500 font-mono mt-0.5">Tech Lead: <strong class="text-slate-800">${squad.lead}</strong> · ${squadDevs.length} Active Engineers</div>
      </div>
      <span class="text-xs font-mono font-bold px-2.5 py-1 rounded-full ${utilPct >= 90 ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'}">
        ${utilPct}% Squad Load
      </span>
    </div>
    <div class="p-3 bg-white rounded-xl border border-indigo-100 text-xs space-y-1.5 font-mono text-slate-600">
      <div class="flex justify-between"><span>Squad Total Capacity:</span><strong class="text-slate-800">${totalCap}h / sprint</strong></div>
      <div class="flex justify-between"><span>Allocated Load:</span><strong>${totalAlloc.toFixed(1)}h</strong></div>
      <div class="flex justify-between text-emerald-700"><span>Available Squad Buffer:</span><strong>${freeSquadBuffer.toFixed(1)}h free</strong></div>
    </div>
    <div class="text-xs text-indigo-900 font-medium flex items-center gap-1.5">
      <i class="fa-solid fa-circle-info text-indigo-500"></i>
      This task will be queued directly into <strong>${squad.name}</strong> and assigned to Tech Lead <strong>${squad.lead}</strong> for sprint execution.
    </div>
  `;

  if (btn) {
    btn.innerText = `Assign to ${squad.name.replace(/\s\(.*\)/, '')}`;
    btn.className = 'px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md shadow-indigo-200 transition-all flex items-center gap-2';
  }
}

// ── Submit Unified Task Assignment ──

function submitNewTaskAssignment() {
  const title = document.getElementById('assign-title-input').value.trim();
  const assignedBy = document.getElementById('assign-by-select') ? document.getElementById('assign-by-select').value : 'Marcus Vance (Project Manager)';
  const hours = parseFloat(document.getElementById('assign-hours-input').value) || 0;
  const priority = document.getElementById('assign-priority-select').value;
  const taskType = document.getElementById('assign-type-select').value || 'PROJECT_SPRINT';
  const recurrence = (taskType === 'RECURRING_ROUTINE' || taskType === 'RECURRING')
    ? (document.getElementById('assign-recurrence-select')?.value || 'WEEKLY')
    : null;
  const category = document.getElementById('assign-category-select') ? document.getElementById('assign-category-select').value : 'DEVELOPMENT';
  const dueDateValue = document.getElementById('assign-due-date-input')?.value || '2026-09-06T18:00';
  const dueDate = document.getElementById('assign-due-date-input').value || 'Sep 6, 2026 · 06:00 PM';

  if (!title) {
    showToast('⚠️ Please enter a Task Title.');
    document.getElementById('assign-title-input').focus();
    return;
  }

  if (hours <= 0) {
    showToast('⚠️ Please specify valid estimated hours.');
    document.getElementById('assign-hours-input').focus();
    return;
  }

  // 1. Single Developer Mode
  if (assignState.mode === 'single') {
    const devId = document.getElementById('assign-dev-select').value;
    const dev = DEVELOPERS.find(d => d.id === devId);
    if (!dev) { showToast('⚠️ Select a valid developer.'); return; }
    const squad = SQUADS.find(s => s.id === dev.squadId);
    const squadId = squad ? squad.id : 'squad_a';
    const projectCode = squad ? squad.projectCode : 'ALPHA';

    TASKS.unshift({
      id: `tsk_${Date.now()}`,
      title,
      clientId: squadId,
      squadId: squadId,
      projectCode: projectCode,
      assignedTo: devId,
      taskType: taskType,
      recurrence,
      category: category,
      priority,
      status: 'IN_PROGRESS',
      estimatedHours: hours,
      loggedHours: 0,
      assignedBy: assignedBy,
      assignedAt: 'Sep 2, 2026 · 02:30 PM',
      dueDate: dueDateValue,
      isTimerRunning: false
    });

    closeAssignModal();
    showToast(`✅ "${title}" assigned to ${dev.name} (${hours}h) [${projectCode}].`);
  }

  // 2. Multiple Developers (Pod) Mode
  else if (assignState.mode === 'multi') {
    const count = assignState.selectedMultiDevIds.size;
    if (count === 0) {
      showToast('⚠️ Please select at least one developer for the pod.');
      return;
    }

    const hoursPerDev = assignState.multiSplitMode === 'split' ? (hours / count) : hours;
    const assignedDevNames = [];

    Array.from(assignState.selectedMultiDevIds).forEach((devId, idx) => {
      const dev = DEVELOPERS.find(d => d.id === devId);
      if (dev) {
        const squad = SQUADS.find(s => s.id === dev.squadId);
        const squadId = squad ? squad.id : 'squad_a';
        const projectCode = squad ? squad.projectCode : 'ALPHA';
        assignedDevNames.push(dev.name);
        TASKS.unshift({
          id: `tsk_${Date.now()}_${idx}`,
          title: count > 1 ? `${title} (Pod: ${dev.name.split(' ')[0]})` : title,
          clientId: squadId,
          squadId: squadId,
          projectCode: projectCode,
          assignedTo: devId,
          taskType: taskType,
          recurrence,
          category: category,
          priority,
          status: 'IN_PROGRESS',
          estimatedHours: hoursPerDev,
          loggedHours: 0,
          assignedBy: assignedBy,
          assignedAt: 'Sep 2, 2026 · 02:30 PM',
          dueDate: dueDateValue,
          isTimerRunning: false
        });
      }
    });

    closeAssignModal();
    showToast(`✅ "${title}" assigned to ${count} engineers (${hoursPerDev.toFixed(1)}h each).`);
  }

  // 3. Entire Squad / Team Mode
  else if (assignState.mode === 'team') {
    const squadSelect = document.getElementById('assign-team-squad-select');
    const squadId = squadSelect ? squadSelect.value : null;
    const squad = SQUADS.find(s => s.id === squadId);
    if (!squad) { showToast('⚠️ Select a valid squad.'); return; }

    // Find Squad Lead or first dev in squad
    const leadDev = DEVELOPERS.find(d => d.name === squad.lead) || DEVELOPERS.find(d => d.squadId === squad.id);
    const assignedDevId = leadDev ? leadDev.id : 'dev_12';

    TASKS.unshift({
      id: `tsk_${Date.now()}`,
      title: `[${squad.name.replace(/\s\(.*\)/, '')}] ${title}`,
      clientId: squad.id,
      squadId: squad.id,
      projectCode: squad.projectCode,
      assignedTo: assignedDevId,
      taskType: taskType,
      recurrence,
      category: category,
      priority,
      status: 'IN_PROGRESS',
      estimatedHours: hours,
      loggedHours: 0,
      assignedBy: assignedBy,
      assignedAt: 'Sep 2, 2026 · 02:30 PM',
      dueDate: dueDateValue,
      isTimerRunning: false
    });

    closeAssignModal();
    showToast(`✅ "${title}" assigned to ${squad.name} (Lead: ${squad.lead}).`);
  }

  saveAppState();
  renderKPIs();
  renderRoster();
  renderDeveloperFuelGauge();
  renderDeveloperTasks();
  renderDevAnalyticsDashboard();
  renderDeveloperWorkLogs();
  const activeSquad = SQUADS.find(s => s.id === state.currentManagerSquadId) || SQUADS[0];
  renderSquadTaskBoard(activeSquad);
  renderSquadHubCharts(activeSquad);
}

// ─── Time Logging & Timer ───

function openLogTimeModal(taskId) {
  if (state.currentRole === 'manager') {
    showToast('Time logging is reserved for Developers. Switch to Developer view (top-right toggle) to log work hours.', 'info');
    return;
  }
  let t = null;
  if (taskId) {
    t = TASKS.find(x => x.id === taskId);
  } else {
    const activeDevId = state.currentDevId;
    t = TASKS.find(x => x.assignedTo === activeDevId && x.status === 'IN_PROGRESS')
      || TASKS.find(x => x.assignedTo === activeDevId && x.status !== 'COMPLETED')
      || TASKS.find(x => x.assignedTo === activeDevId)
      || TASKS[0];
  }
  if (!t) return;
  document.getElementById('log-task-id').value = t.id;
  const titleEl = document.getElementById('log-modal-task-title');
  if (titleEl) titleEl.innerText = t.title;

  const devEl = document.getElementById('log-modal-dev-name');
  if (devEl) {
    const dev = DEVELOPERS.find(d => d.id === (t.assignedTo || state.currentDevId));
    devEl.innerText = dev ? `Engineer: ${dev.name}` : '';
  }
  
  const hrsInput = document.getElementById('log-hours-input');
  if (hrsInput) {
    hrsInput.value = '1.0';
    setTimeout(() => { hrsInput.focus(); hrsInput.select(); }, 50);
  }
  
  const noteInput = document.getElementById('log-notes-input');
  if (noteInput) {
    noteInput.value = '';
  }
  
  document.getElementById('modal-log-time').classList.remove('hidden');
}

function closeLogTimeModal() {
  document.getElementById('modal-log-time').classList.add('hidden');
}

function applyQuickLogHours(hours) {
  const hrsInput = document.getElementById('log-hours-input');
  const hrsError = document.getElementById('log-hours-error');
  if (hrsInput) {
    hrsInput.value = hours.toFixed(1);
    hrsInput.classList.remove('input-error');
    hrsInput.classList.add('input-success');
    setTimeout(() => hrsInput.classList.remove('input-success'), 600);
  }
  if (hrsError) hrsError.classList.add('hidden');
}

function submitTimeLog() {
  const taskId = document.getElementById('log-task-id').value;
  const hrsInput = document.getElementById('log-hours-input');
  const hrsError = document.getElementById('log-hours-error');
  const noteInput = document.getElementById('log-notes-input');
  const noteError = document.getElementById('log-notes-error');

  if (hrsInput) hrsInput.classList.remove('input-error');
  if (noteInput) noteInput.classList.remove('input-error');
  if (hrsError) hrsError.classList.add('hidden');
  if (noteError) noteError.classList.add('hidden');

  const hrs = parseFloat(hrsInput ? hrsInput.value : 0) || 0;
  const notes = noteInput ? noteInput.value.trim() : '';

  const t = TASKS.find(x => x.id === taskId);
  if (!t) {
    showToast('Task not found. Please select a valid task.', 'danger');
    return;
  }

  let hasError = false;
  if (hrs <= 0 || isNaN(hrs)) {
    if (hrsInput) hrsInput.classList.add('input-error');
    if (hrsError) {
      hrsError.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Please enter hours greater than 0.';
      hrsError.classList.remove('hidden');
    }
    hasError = true;
  }

  if (hasError) {
    showToast('Please specify valid hours spent.', 'warning');
    if (hrsInput) hrsInput.focus();
    return;
  }

  const finalNotes = notes || 'Completed scheduled sprint implementation and local verification.';

  // Update task hours
  t.loggedHours = cleanHours((t.loggedHours || 0) + hrs);

  // If task was in TO_DO status, advance it to IN_PROGRESS
  if (t.status === 'TO_DO') {
    t.status = 'IN_PROGRESS';
  }

  const cl = CLIENTS.find(c => c.id === t.clientId);
  const devId = t.assignedTo || state.currentDevId;
  const dev = DEVELOPERS.find(d => d.id === devId);

  // Add to work logs history
  WORK_LOGS.unshift({
    id: `log_${Date.now()}`,
    taskId: taskId,
    developerId: devId,
    devName: dev ? dev.name : 'Engineer',
    taskTitle: t.title,
    hours: hrs,
    notes: finalNotes,
    timestamp: 'Just now',
    clientCode: cl ? cl.code : 'TASK'
  });

  if (noteInput) {
    noteInput.value = '';
  }

  showToast(`Logged ${hrs}h on "${t.title}"`, 'success');
  closeLogTimeModal();
  saveAppState();

  // Re-render all dashboard views
  renderDeveloperTasks();
  renderDeveloperWorkLogs();
  renderDevAnalyticsDashboard();
  renderKPIs();
  renderRoster();
  renderClientsTab();
  const currentDev = DEVELOPERS.find(d => d.id === (state.currentManagerDevId || state.currentDevId)) || DEVELOPERS[0];
  renderManagerDevHub();

  if (currentDrawerTaskId === taskId) {
    renderTaskLogDrawerBody(taskId);
    const estEl = document.getElementById('task-log-drawer-est');
    if (estEl) estEl.innerText = `${cleanHours(t.estimatedHours)}h`;
    const loggedEl = document.getElementById('task-log-drawer-logged');
    if (loggedEl) loggedEl.innerText = `${cleanHours(t.loggedHours)}h`;
    const remEl = document.getElementById('task-log-drawer-remaining');
    if (remEl) remEl.innerText = `${cleanHours(Math.max(0, t.estimatedHours - t.loggedHours))}h`;
  }
}

function toggleTaskTimer(taskId) {
  if (state.activeTimer.taskId === taskId && state.activeTimer.isRunning) { state.activeTimer.isRunning = false; showToast('Timer paused.'); }
  else { state.activeTimer.taskId = taskId; state.activeTimer.isRunning = true; showToast('Timer started.'); }
  renderDeveloperTasks();
}

function startGlobalTimer() {
  setInterval(() => {
    if (state.activeTimer.isRunning) {
      state.activeTimer.secondsElapsed++;
      const h = String(Math.floor(state.activeTimer.secondsElapsed / 3600)).padStart(2, '0');
      const m = String(Math.floor((state.activeTimer.secondsElapsed % 3600) / 60)).padStart(2, '0');
      const s = String(state.activeTimer.secondsElapsed % 60).padStart(2, '0');
      const el = document.getElementById('dev-timer-display');
      if (el) el.innerText = `${h}:${m}:${s}`;
    }
  }, 1000);
}


// ─── Toast ───

function showToast(msg, type = 'info') {
  const toast = document.getElementById('app-toast');
  const msgEl = document.getElementById('toast-message');
  if (!toast || !msgEl) return;
  msgEl.innerText = msg;

  const iconContainer = toast.querySelector('div:first-child');
  toast.classList.remove('toast-success', 'toast-warning', 'toast-danger', 'toast-error', 'toast-info', 'toast-hide', 'opacity-0');

  if (type === 'success') {
    toast.classList.add('toast-success');
    if (iconContainer) iconContainer.innerHTML = '<i class="fa-solid fa-circle-check text-emerald-400 text-sm"></i>';
  } else if (type === 'warning') {
    toast.classList.add('toast-warning');
    if (iconContainer) iconContainer.innerHTML = '<i class="fa-solid fa-triangle-exclamation text-amber-400 text-sm"></i>';
  } else if (type === 'danger' || type === 'error') {
    toast.classList.add('toast-danger');
    if (iconContainer) iconContainer.innerHTML = '<i class="fa-solid fa-circle-exclamation text-rose-400 text-sm"></i>';
  } else {
    toast.classList.add('toast-info');
    if (iconContainer) iconContainer.innerHTML = '<i class="fa-solid fa-circle-info text-blue-400 text-sm"></i>';
  }

  toast.classList.add('toast-visible');
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.classList.remove('toast-visible');
    toast.classList.add('toast-hide');
    setTimeout(() => { toast.classList.add('opacity-0'); }, 300);
  }, 3500);
}


// ─── Navigation Binding ───

function debounce(func, wait = 150) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function renderNavigation() {
  const searchEl = document.getElementById('roster-search-input');
  if (searchEl) {
    searchEl.addEventListener('input', debounce(e => {
      state.searchQuery = e.target.value;
      renderRoster();
    }, 120));
  }
  const squadEl = document.getElementById('roster-squad-select');
  if (squadEl) squadEl.addEventListener('change', e => { state.selectedSquadFilter = e.target.value; renderRoster(); });
}

function handleSearch(q) { state.searchQuery = q; renderRoster(); }
function handleSquadFilter(sq) { state.selectedSquadFilter = sq; renderRoster(); }


// ═══════════════════════════════════════════════════════════
// DEVELOPER ANALYTICS DASHBOARD
// ═══════════════════════════════════════════════════════════

// Recurring task metadata (frequency tagging)
const RECURRING_META = {
  'tsk_rec_101': { freq: 'daily',   schedule: 'Every day · 9:30 AM',          icon: '🌅' },
  'tsk_rec_102': { freq: 'daily',   schedule: 'Every afternoon · 4:00 PM',    icon: '👁️' },
  'tsk_rec_103': { freq: 'weekly',  schedule: 'Mondays · 11:00 AM',           icon: '📅' },
  'tsk_rec_104': { freq: 'weekly',  schedule: 'Thursdays · 3:00 PM',          icon: '🏗️' },
  'tsk_rec_105': { freq: 'monthly', schedule: '1st Monday of month',          icon: '📊' },
  'tsk_rec_106': { freq: 'monthly', schedule: 'Last Friday of month',         icon: '🎯' }
};

function renderDevAnalyticsDashboard() {
  const devTasks = TASKS.filter(t => t.assignedTo === state.currentDevId);
  const done = devTasks.filter(t => t.status === 'COMPLETED');
  const total = devTasks.length;
  const pct = total > 0 ? Math.round((done.length / total) * 100) : 0;
  const totalLogged = devTasks.reduce((s, t) => s + t.loggedHours, 0);
  const totalEst = devTasks.reduce((s, t) => s + t.estimatedHours, 0);
  
  // Overdue: past due date & not completed (approximated by checking date fields)
  const today = new Date('2026-09-02');
  const overdue = devTasks.filter(t => {
    if (t.status === 'COMPLETED') return false;
    const raw = (t.dueDate || '').replace(/\s·.*/, '').trim();
    const d = new Date(raw);
    return !isNaN(d) && d < today;
  });

  // Update KPI cards
  const el = (id, val) => { const e = document.getElementById(id); if (e) e.innerText = val; };
  el('dash-kpi-total', total);
  el('dash-kpi-total-sub', `${devTasks.filter(t => t.status !== 'COMPLETED').length} active`);
  el('dash-kpi-done', done.length);
  el('dash-kpi-done-sub', `${pct}% completion rate`);
  el('dash-kpi-logged', `${totalLogged.toFixed(1)}h`);
  el('dash-kpi-logged-sub', `of ${totalEst.toFixed(1)}h estimated`);
  el('dash-kpi-overdue', overdue.length);
  el('dash-kpi-overdue-sub', overdue.length > 0 ? 'tasks past due date' : 'all tasks on schedule');

  renderTaskDonutChart(devTasks);
  renderHoursBarChart();
  renderSprintRing(devTasks);
}

function renderTaskDonutChart(tasks) {
  const sprint = tasks.filter(t => t.taskType === 'PROJECT_SPRINT').length;
  const adhoc  = tasks.filter(t => t.taskType === 'AD_HOC_EMERGENCY').length;
  const recur  = tasks.filter(t => t.taskType === 'RECURRING').length;
  const total  = sprint + adhoc + recur;

  const el = document.getElementById('donut-center-num');
  if (el) el.innerText = total;

  const canvas = document.getElementById('chart-task-donut');
  if (!canvas) return;

  if (chartDonut) { chartDonut.destroy(); chartDonut = null; }
  chartDonut = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: ['Pre-Planning', 'Ad-Hoc Emergency', 'Recurring'],
      datasets: [{
        data: [sprint, adhoc, recur],
        backgroundColor: ['#3b82f6', '#f59e0b', '#a855f7'],
        borderWidth: 0,
        hoverOffset: 4,
        spacing: 2
      }]
    },
    options: {
      cutout: '72%',
      plugins: { legend: { display: false }, tooltip: { callbacks: {
        label: ctx => ` ${ctx.label}: ${ctx.raw} task${ctx.raw !== 1 ? 's' : ''}`
      }}},
      animation: { duration: 600, easing: 'easeInOutQuart' }
    }
  });

  // Legend
  const legend = document.getElementById('chart-donut-legend');
  if (legend) {
    const items = [
      { label: 'Pre-Planning',       count: sprint, color: 'bg-blue-500', est: tasks.filter(t => t.taskType === 'PROJECT_SPRINT').reduce((s,t) => s+t.estimatedHours, 0) },
      { label: 'Ad-Hoc Emergency',   count: adhoc,  color: 'bg-amber-500', est: tasks.filter(t => t.taskType === 'AD_HOC_EMERGENCY').reduce((s,t) => s+t.estimatedHours, 0) },
      { label: 'Recurring',          count: recur,  color: 'bg-purple-500', est: tasks.filter(t => t.taskType === 'RECURRING').reduce((s,t) => s+t.estimatedHours, 0) }
    ];
    legend.innerHTML = items.map(i => `
      <div class="flex items-center justify-between text-xs">
        <span class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full ${i.color} flex-shrink-0"></span>
          <span class="text-slate-600 font-medium">${i.label}</span>
        </span>
        <div class="flex items-center gap-2 font-mono">
          <span class="text-slate-900 font-bold">${i.count}</span>
          <span class="text-slate-300">·</span>
          <span class="text-slate-500">${i.est.toFixed(0)}h</span>
        </div>
      </div>`).join('');
  }
}

function renderHoursBarChart() {
  const canvas = document.getElementById('chart-hours-bar');
  if (!canvas) return;

  let labels, sprintData, adhocData, recurData;

  if (state.hoursChartView === 'week') {
    labels = ['Mon\nSep 1', 'Tue\nSep 2', 'Wed\nSep 3', 'Thu\nSep 4', 'Fri\nSep 5'];
    sprintData  = [4.5, 3.0, 0,   2.0, 0];
    adhocData   = [0,   4.0, 0,   0,   0];
    recurData   = [1.5, 1.5, 1.5, 1.5, 1.5];
  } else {
    labels = ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4'];
    sprintData  = [18.5, 12.0, 20.0, 8.0];
    adhocData   = [4.0,  0,    6.0,  2.0];
    recurData   = [8.0,  8.0,  8.0,  8.0];
  }

  if (chartBar) { chartBar.destroy(); chartBar = null; }
  chartBar = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Pre-Planning', data: sprintData, backgroundColor: '#3b82f6', borderRadius: 4, borderSkipped: false },
        { label: 'Ad-Hoc',      data: adhocData,  backgroundColor: '#f59e0b', borderRadius: 4, borderSkipped: false },
        { label: 'Recurring',   data: recurData,  backgroundColor: '#a855f7', borderRadius: 4, borderSkipped: false }
      ]
    },

    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: {
        label: ctx => ` ${ctx.dataset.label}: ${ctx.raw}h`
      }}},
      scales: {
        x: { stacked: true, grid: { display: false }, ticks: { font: { size: 10, family: 'JetBrains Mono' }, color: '#94a3b8' } },
        y: { stacked: true, grid: { color: '#f1f5f9' }, ticks: { font: { size: 10, family: 'JetBrains Mono' }, color: '#94a3b8', callback: v => `${v}h` }, beginAtZero: true }
      },
      animation: { duration: 600 }
    }
  });
}

function switchHoursChartView(view) {
  state.hoursChartView = view;
  const w = document.getElementById('chart-btn-week');
  const m = document.getElementById('chart-btn-month');
  if (view === 'week') {
    if (w) w.className = 'px-2.5 py-1 rounded-md text-xs bg-white text-slate-700 font-semibold shadow-sm transition-all';
    if (m) m.className = 'px-2.5 py-1 rounded-md text-xs text-slate-500 font-medium transition-all';
  } else {
    if (w) w.className = 'px-2.5 py-1 rounded-md text-xs text-slate-500 font-medium transition-all';
    if (m) m.className = 'px-2.5 py-1 rounded-md text-xs bg-white text-slate-700 font-semibold shadow-sm transition-all';
  }
  renderHoursBarChart();
}

function renderSprintRing(tasks) {
  const done = tasks.filter(t => t.status === 'COMPLETED').length;
  const total = tasks.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const rem = Math.max(0, total - done);
  const hoursLeft = tasks.filter(t => t.status !== 'COMPLETED').reduce((s, t) => s + Math.max(0, t.estimatedHours - (t.loggedHours || 0)), 0);

  const el = (id, val) => { const e = document.getElementById(id); if (e) e.innerText = val; };
  el('sprint-ring-pct', `${pct}%`);
  el('sprint-info-total', total);
  el('sprint-info-done', done);
  el('sprint-info-rem', rem);
  el('sprint-info-hours', `${hoursLeft.toFixed(1)}h`);

  const badge = document.getElementById('sprint-ring-badge');
  if (badge) badge.innerText = `${pct}% Delivered`;

  // Render Type Breakdown under progress ring
  const breakdownContainer = document.getElementById('sprint-type-breakdown');
  if (breakdownContainer) {
    const sprintTotal = tasks.filter(t => t.taskType === 'PROJECT_SPRINT').length;
    const sprintDone = tasks.filter(t => t.taskType === 'PROJECT_SPRINT' && t.status === 'COMPLETED').length;
    const adhocTotal = tasks.filter(t => t.taskType === 'AD_HOC_EMERGENCY').length;
    const adhocDone = tasks.filter(t => t.taskType === 'AD_HOC_EMERGENCY' && t.status === 'COMPLETED').length;
    const recurTotal = tasks.filter(t => t.taskType === 'RECURRING').length;
    const recurDone = tasks.filter(t => t.taskType === 'RECURRING' && t.status === 'COMPLETED').length;

    breakdownContainer.innerHTML = `
      <div class="flex items-center justify-between text-[11px]">
        <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-blue-500"></span> Pre-Planning</span>
        <span class="font-bold text-slate-700">${sprintDone} / ${sprintTotal} (${sprintTotal ? Math.round((sprintDone/sprintTotal)*100) : 0}%)</span>
      </div>
      <div class="flex items-center justify-between text-[11px]">
        <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-amber-500"></span> Ad-Hoc</span>
        <span class="font-bold text-slate-700">${adhocDone} / ${adhocTotal} (${adhocTotal ? Math.round((adhocDone/adhocTotal)*100) : 0}%)</span>
      </div>
      <div class="flex items-center justify-between text-[11px]">
        <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-purple-500"></span> Recurring</span>
        <span class="font-bold text-slate-700">${recurDone} / ${recurTotal} (${recurTotal ? Math.round((recurDone/recurTotal)*100) : 0}%)</span>
      </div>
    `;
  }

  const canvas = document.getElementById('chart-sprint-ring');
  if (!canvas) return;
  if (chartRing) { chartRing.destroy(); chartRing = null; }

  chartRing = new Chart(canvas, {
    type: 'doughnut',
    data: {
      datasets: [{
        data: [done, Math.max(0, total - done)],
        backgroundColor: ['#10b981', '#f1f5f9'],
        borderWidth: 0,
        hoverOffset: 0
      }]
    },
    options: {
      cutout: '76%',
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      animation: { duration: 600 }
    }
  });
}


// ── Date Search by Assigned Date ──

function applyDevDateFilter() {
  const input = document.getElementById('dev-date-filter');
  const clearBtn = document.getElementById('dev-date-clear-btn');
  
  if (input) state.devDateFilter = input.value || null;
  if (clearBtn) clearBtn.classList.toggle('hidden', !state.devDateFilter);
  
  renderDeveloperTasks();
}

function clearDevDateFilter() {
  state.devDateFilter = null;
  const input = document.getElementById('dev-date-filter');
  const clearBtn = document.getElementById('dev-date-clear-btn');
  
  if (input) input.value = '';
  if (clearBtn) clearBtn.classList.add('hidden');
  
  renderDeveloperTasks();
}




// ── Recurring Sub-Filters ──

function setRecurringFilter(freq) {
  state.recurringFilter = freq;
  ['all', 'daily', 'weekly', 'monthly'].forEach(f => {
    const btn = document.getElementById(`rec-tab-${f}`);
    if (!btn) return;
    const isActive = f === freq;
    btn.className = `px-2.5 py-1 rounded-md text-[11px] transition-all ${
      isActive ? 'bg-purple-50 text-purple-700 font-semibold border border-purple-200'
               : 'bg-slate-50 text-slate-600 font-medium border border-slate-200 hover:bg-slate-100'
    }`;
  });
  renderDeveloperTasks();
}

function setRecurringSidebarFilter(freq) {
  state.recurringSidebarFilter = freq;
  ['daily', 'weekly', 'monthly'].forEach(f => {
    const btn = document.getElementById(`rec-sidebar-${f}`);
    if (!btn) return;
    const isActive = f === freq;
    btn.className = `flex-1 py-2 rounded-xl text-xs transition-all ${
      isActive ? 'font-bold bg-purple-50 text-purple-700 border border-purple-300 shadow-sm'
               : 'font-medium text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100'
    }`;
  });
  renderRecurringSidebar();
}

function renderRecurringSidebar() {
  const container = document.getElementById('recurring-sidebar-list');
  if (!container) return;

  const SIDEBAR_ITEMS = {
    daily: [
      { icon: '🌅', title: 'Daily Standup & Squad Sync',  schedule: 'Every day · 9:30 AM', hours: 2.5, logged: 1.5 },
      { icon: '👁️', title: 'PR Reviews & Mentoring Devs', schedule: 'Every afternoon · 4:00 PM', hours: 3.5, logged: 2.0 }
    ],
    weekly: [
      { icon: '📅', title: 'Sprint Planning & Backlog Grooming', schedule: 'Mondays · 11:00 AM', hours: 1.0, logged: 1.0 },
      { icon: '🏗️', title: 'Backend Architecture & API Sync', schedule: 'Thursdays · 3:00 PM', hours: 1.0, logged: 0.0 }
    ],
    monthly: [
      { icon: '📊', title: 'Engineering All-Hands Meeting', schedule: '1st Monday of month', hours: 2.0, logged: 0.0 },
      { icon: '🎯', title: 'Quarterly OKR Review', schedule: 'Last Friday of month', hours: 1.5, logged: 0.0 }
    ]
  };

  const items = SIDEBAR_ITEMS[state.recurringSidebarFilter] || [];

  if (!items.length) {
    container.innerHTML = '<div class="text-sm text-slate-400 font-mono text-center py-6">No recurring items for this period.</div>';
    return;
  }

  container.innerHTML = items.map(item => {
    const pct = Math.min(100, item.hours > 0 ? Math.round((item.logged / item.hours) * 100) : 0);
    const isDone = pct >= 100;
    return `
    <div class="p-4 rounded-2xl ${isDone ? 'bg-emerald-50/40 border-emerald-200' : 'bg-purple-50/40 border-purple-100'} border space-y-3 transition-all hover:border-purple-300">
      <div class="flex items-start justify-between gap-2">
        <div class="flex items-center gap-2.5 min-w-0">
          <span class="text-xl flex-shrink-0">${item.icon}</span>
          <div>
            <div class="text-sm font-bold text-slate-900 leading-snug">${item.title}</div>
            <div class="text-xs text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
              <i class="fa-regular fa-clock text-[10px] text-purple-400"></i> ${item.schedule}
            </div>
          </div>
        </div>
        <span class="text-xs font-mono font-bold px-2.5 py-1 rounded-full ${isDone ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-purple-100 text-purple-800 border border-purple-200'} flex-shrink-0">
          ${item.hours}h / wk
        </span>
      </div>

      <div class="space-y-1.5 pt-1">
        <div class="w-full bg-slate-200/70 rounded-full h-2 overflow-hidden">
          <div class="h-full rounded-full transition-all duration-500 ${isDone ? 'bg-emerald-500' : 'bg-purple-500'}" style="width:${pct}%"></div>
        </div>
        <div class="flex justify-between items-center text-xs font-mono text-slate-500">
          <span>Logged: <strong class="text-slate-700">${item.logged}h</strong></span>
          <span class="font-semibold ${isDone ? 'text-emerald-700' : 'text-purple-700'}">${pct}% completed</span>
        </div>
      </div>
    </div>`;
  }).join('');
}



// ── Deadline Timeline Sidebar ──

function renderDeadlineTimeline() {
  const container = document.getElementById('deadline-timeline');
  const countBadge = document.getElementById('dev-deadlines-count');
  if (!container) return;

  const devTasks = TASKS.filter(t =>
    t.assignedTo === state.currentDevId &&
    t.status !== 'COMPLETED' &&
    t.status !== 'PENDING_REVIEW' &&
    t.status !== 'PENDING_ACCEPTANCE'
  );

  const today = new Date('2026-09-02');

  const withDates = devTasks.map(t => {
    const raw = (t.dueDate || '').replace(/\s·.*/, '').replace(/\s\(.*\)/, '').trim();
    const d = new Date(raw);
    return { ...t, parsedDate: isNaN(d) ? null : d };
  }).filter(t => t.parsedDate).sort((a, b) => a.parsedDate - b.parsedDate).slice(0, 5);

  if (countBadge) countBadge.innerText = `${withDates.length} upcoming`;

  if (!withDates.length) {
    container.innerHTML = '<div class="text-sm text-slate-400 font-mono text-center py-6">No upcoming deadlines.</div>';
    return;
  }

  container.innerHTML = withDates.map(t => {
    const diff = Math.ceil((t.parsedDate - today) / (1000 * 60 * 60 * 24));
    const isOverdue = diff < 0;
    const isToday = diff === 0;
    const isTomorrow = diff === 1;
    
    let urgencyBadge = '';
    let cardBorder = 'border-slate-200 bg-white hover:border-slate-300';
    let leftAccent = 'bg-blue-500';

    if (isOverdue) {
      urgencyBadge = `<span class="px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-rose-50 text-rose-700 border border-rose-200"><i class="fa-solid fa-triangle-exclamation mr-1"></i>Overdue (${Math.abs(diff)}d)</span>`;
      cardBorder = 'border-rose-200 bg-rose-50/20 hover:border-rose-300';
      leftAccent = 'bg-rose-500';
    } else if (isToday) {
      urgencyBadge = `<span class="px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-rose-50 text-rose-700 border border-rose-200"><i class="fa-solid fa-fire mr-1"></i>Due Today</span>`;
      cardBorder = 'border-rose-200 bg-rose-50/20 hover:border-rose-300';
      leftAccent = 'bg-rose-500';
    } else if (isTomorrow) {
      urgencyBadge = `<span class="px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-amber-50 text-amber-700 border border-amber-200"><i class="fa-regular fa-clock mr-1"></i>Tomorrow</span>`;
      cardBorder = 'border-amber-200 bg-amber-50/20 hover:border-amber-300';
      leftAccent = 'bg-amber-500';
    } else {
      urgencyBadge = `<span class="px-2.5 py-1 rounded-full text-xs font-semibold font-mono bg-slate-100 text-slate-700 border border-slate-200">In ${diff} days</span>`;
      cardBorder = 'border-slate-200 bg-white hover:border-slate-300';
      leftAccent = t.taskType === 'AD_HOC_EMERGENCY' ? 'bg-amber-500' : t.taskType === 'RECURRING' ? 'bg-purple-500' : 'bg-blue-500';
    }

    const cl = CLIENTS.find(c => c.id === t.clientId);
    const typeName = t.taskType === 'PROJECT_SPRINT' ? 'Pre-Planning' : t.taskType === 'AD_HOC_EMERGENCY' ? 'Ad-Hoc' : 'Recurring';
    const typeBadgeColor = t.taskType === 'PROJECT_SPRINT' ? 'text-blue-700 bg-blue-50 border-blue-200' : t.taskType === 'AD_HOC_EMERGENCY' ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-purple-700 bg-purple-50 border-purple-200';
    const hoursRemaining = Math.max(0, t.estimatedHours - t.loggedHours);

    return `
    <div class="relative p-3.5 rounded-2xl border ${cardBorder} shadow-sm transition-all overflow-hidden space-y-2.5">
      <div class="absolute inset-y-0 left-0 w-1 ${leftAccent} rounded-l-2xl"></div>
      
      <div class="flex items-start justify-between gap-2 pl-2">
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2 mb-1 flex-wrap">
            <span class="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-mono font-bold uppercase border border-slate-200">${cl ? cl.code : 'TASK'}</span>
            <span class="px-2 py-0.5 rounded text-[10px] font-semibold border ${typeBadgeColor}">${typeName}</span>
          </div>
          <h4 class="text-sm font-bold text-slate-900 leading-snug truncate">${t.title}</h4>
        </div>
        <div class="flex-shrink-0">
          ${urgencyBadge}
        </div>
      </div>

      <div class="flex items-center justify-between text-xs text-slate-500 font-mono pl-2 pt-1 border-t border-slate-100">
        <span class="flex items-center gap-1.5">
          <i class="fa-regular fa-calendar text-slate-400"></i> ${t.dueDate || 'Sep 5, 2026'}
        </span>
        <span>
          <strong>${hoursRemaining.toFixed(1)}h</strong> remaining
        </span>
      </div>
    </div>`;
  }).join('');
}



// ═══════════════════════════════════════════════════════════
// MANAGER: TEAMS / SQUADS HUB (DEDICATED SQUAD DASHBOARD)
// ═══════════════════════════════════════════════════════════

function switchManagerSquadHub(squadId) {
  state.currentManagerSquadId = squadId;
  state.managerSquadTaskTypeFilter = 'ALL';
  state.managerSquadPersonFilter = 'all';
  switchManagerTab('squads_hub');
}

function renderSquadsHub() {
  const squad = SQUADS.find(s => s.id === state.currentManagerSquadId) || SQUADS[0];
  if (!squad) return;

  renderSquadHubNavPills(squad);
  renderSquadHubHero(squad);
  renderSquadHubKPIs(squad);
  renderSquadHubCharts(squad);
  renderSquadTaskBoard(squad);
  renderSquadMembersGrid(squad);
}

function renderSquadHubNavPills(activeSquad) {
  const container = document.getElementById('squads-hub-nav-pills');
  if (!container) return;

  const colorDots = {
    blue: 'bg-blue-500',
    indigo: 'bg-indigo-500',
    emerald: 'bg-emerald-500',
    purple: 'bg-purple-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    cyan: 'bg-cyan-500',
    orange: 'bg-orange-500'
  };

  container.innerHTML = SQUADS.map(s => {
    const isActive = s.id === activeSquad.id;
    const devs = DEVELOPERS.filter(d => d.squadId === s.id);
    const dot = colorDots[s.color] || 'bg-indigo-500';
    return `
      <button onclick="switchManagerSquadHub('${s.id}')"
        class="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 flex-shrink-0 ${
          isActive
            ? 'bg-slate-900 text-white shadow-md'
            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium'
        }">
        <span class="w-2 h-2 rounded-full ${dot}"></span>
        <span>${s.name.replace(/\s\(.*\)/, '')}</span>
        <span class="text-[10px] font-mono px-1.5 py-0.2 rounded-full ${isActive ? 'bg-slate-800 text-indigo-300' : 'bg-slate-200 text-slate-600'}">
          ${devs.length}
        </span>
      </button>
    `;
  }).join('');
}

function renderSquadHubHero(squad) {
  const banner = document.getElementById('squad-hub-hero-banner');
  if (!banner) return;

  const squadDevs = DEVELOPERS.filter(d => d.squadId === squad.id);
  const totalCap = squadDevs.length * 40;
  let totalAlloc = 0;
  squadDevs.forEach(d => {
    totalAlloc += getDeveloperCapacity(d.id).totalLoad;
  });
  const utilPct = totalCap > 0 ? ((totalAlloc / totalCap) * 100).toFixed(1) : '0.0';
  const freeBuffer = Math.max(0, totalCap - totalAlloc);

  banner.innerHTML = `
    <div class="relative z-10 space-y-6">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="space-y-1.5">
          <div class="flex items-center gap-3">
            <span class="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              Team Pod Active
            </span>
            <span class="text-xs font-mono text-slate-400 flex items-center gap-1.5">
              <i class="fa-solid fa-user-shield text-indigo-400"></i> Tech Lead: <strong class="text-white">${squad.lead}</strong>
            </span>
          </div>
          <h2 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">${squad.name}</h2>
          <p class="text-xs sm:text-sm text-slate-300 max-w-2xl">${squad.focus || 'Core engineering pod delivering end-to-end features, reliability, and architectural scalability.'}</p>
        </div>

        <div class="flex items-center gap-3 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 flex-shrink-0">
          <div class="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold shadow-md">
            <i class="fa-solid fa-chart-pie"></i>
          </div>
          <div>
            <div class="text-xs font-mono text-slate-300 uppercase tracking-wider">Sprint Utilization</div>
            <div class="text-2xl font-extrabold text-white font-mono">${utilPct}%</div>
          </div>
        </div>
      </div>

      <!-- Capacity Fuel Bar -->
      <div class="space-y-2">
        <div class="flex justify-between items-center text-xs font-mono text-slate-300">
          <span class="flex items-center gap-2">
            <i class="fa-solid fa-bolt text-amber-400"></i>
            <span><strong>${totalAlloc.toFixed(1)}h</strong> Allocated of <strong>${totalCap}.0h</strong> Sprint Capacity</span>
          </span>
          <span class="font-bold text-emerald-400">${freeBuffer.toFixed(1)}h available buffer</span>
        </div>
        <div class="w-full bg-slate-800/80 rounded-full h-3 overflow-hidden border border-white/10 p-0.5">
          <div class="h-full rounded-full transition-all duration-700 ${parseFloat(utilPct) > 95 ? 'bg-gradient-to-r from-rose-500 to-amber-500' : 'bg-gradient-to-r from-indigo-500 via-blue-500 to-emerald-400'}" style="width: ${Math.min(100, parseFloat(utilPct))}%"></div>
        </div>
      </div>
    </div>
  `;
}

function renderSquadHubKPIs(squad) {
  const grid = document.getElementById('squad-hub-kpi-grid');
  if (!grid) return;

  const squadDevs = DEVELOPERS.filter(d => d.squadId === squad.id);
  const totalCap = squadDevs.length * 40;
  let totalAlloc = 0;
  let overbookedCount = 0;
  squadDevs.forEach(d => {
    const c = getDeveloperCapacity(d.id);
    totalAlloc += c.totalLoad;
    if (c.isOverallocated) overbookedCount++;
  });

  const squadTasks = TASKS.filter(t => squadDevs.some(d => d.id === t.assignedTo));
  const activeTasks = squadTasks.filter(t => t.status !== 'COMPLETED').length;
  const completedTasks = squadTasks.filter(t => t.status === 'COMPLETED').length;

  grid.innerHTML = `
    <div class="kpi-card kpi-card-indigo space-y-3">
      <div class="flex items-center justify-between">
        <span class="kpi-label">Squad Engineers</span>
        <span class="kpi-icon bg-indigo-50 text-indigo-600"><i class="fa-solid fa-users"></i></span>
      </div>
      <div>
        <span class="kpi-value text-slate-900">${squadDevs.length}</span>
        <span class="text-xs text-slate-400 ml-1">engineers</span>
      </div>
      <div class="kpi-sub">40.0h capacity / engineer</div>
    </div>

    <div class="kpi-card kpi-card-blue space-y-3">
      <div class="flex items-center justify-between">
        <span class="kpi-label">Allocated Load</span>
        <span class="kpi-icon bg-blue-50 text-blue-600"><i class="fa-solid fa-business-time"></i></span>
      </div>
      <div>
        <span class="kpi-value text-blue-600">${totalAlloc.toFixed(0)}h</span>
        <span class="text-xs text-slate-400 ml-1">/ ${totalCap}h</span>
      </div>
      <div class="kpi-sub text-emerald-600 font-semibold">${Math.max(0, totalCap - totalAlloc).toFixed(0)}h free buffer left</div>
    </div>

    <div class="kpi-card kpi-card-purple space-y-3">
      <div class="flex items-center justify-between">
        <span class="kpi-label">Active Tasks</span>
        <span class="kpi-icon bg-purple-50 text-purple-600"><i class="fa-solid fa-list-check"></i></span>
      </div>
      <div>
        <span class="kpi-value text-purple-600">${activeTasks}</span>
        <span class="text-xs text-slate-400 ml-1">in flight</span>
      </div>
      <div class="kpi-sub">${completedTasks} tasks completed</div>
    </div>

    <div class="kpi-card ${overbookedCount > 0 ? 'kpi-card-rose' : 'kpi-card-emerald'} space-y-3">
      <div class="flex items-center justify-between">
        <span class="kpi-label ${overbookedCount > 0 ? 'text-red-500' : ''}">Overbooked</span>
        <span class="kpi-icon ${overbookedCount > 0 ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'}">
          <i class="fa-solid ${overbookedCount > 0 ? 'fa-triangle-exclamation' : 'fa-circle-check'}"></i>
        </span>
      </div>
      <div>
        <span class="kpi-value ${overbookedCount > 0 ? 'text-red-500' : 'text-emerald-600'}">${overbookedCount}</span>
        <span class="text-xs text-slate-400 ml-1">engineers</span>
      </div>
      <div class="kpi-sub ${overbookedCount > 0 ? 'text-red-500 font-semibold' : 'text-emerald-600'}">
        ${overbookedCount > 0 ? '⚠️ Over 40h limit' : '✅ All engineers within limit'}
      </div>
    </div>
  `;
}

function renderSquadHubCharts(squad) {
  const squadDevs = DEVELOPERS.filter(d => d.squadId === squad.id);
  const devIds = squadDevs.map(d => d.id);
  const squadTasks = TASKS.filter(t => devIds.includes(t.assignedTo));

  let sprintHours = 0, adhocHours = 0, recurHours = 0;
  let sprintTasks = 0, adhocTasks = 0, recurTasks = 0;
  
  squadTasks.forEach(t => {
    if (t.taskType === 'PROJECT_SPRINT') {
      sprintHours += t.estimatedHours;
      sprintTasks++;
    } else if (t.taskType === 'AD_HOC_EMERGENCY') {
      adhocHours += t.estimatedHours;
      adhocTasks++;
    } else if (t.taskType === 'RECURRING') {
      recurHours += t.estimatedHours;
      recurTasks++;
    }
  });

  const totalHours = sprintHours + adhocHours + recurHours;

  const totalTag = document.getElementById('squad-chart-total-hours');
  if (totalTag) totalTag.innerText = `${totalHours.toFixed(1)}h Total`;
  const devsCountTag = document.getElementById('squad-chart-devs-count');
  if (devsCountTag) devsCountTag.innerText = `${squadDevs.length} engineers`;

  const isSprintActive = state.managerSquadTaskTypeFilter === 'PROJECT_SPRINT';
  const isAdhocActive = state.managerSquadTaskTypeFilter === 'AD_HOC_EMERGENCY';
  const isRecurActive = state.managerSquadTaskTypeFilter === 'RECURRING';
  const hasTypeFilter = state.managerSquadTaskTypeFilter !== 'ALL';

  // Chart 1: Donut with interactive slice click
  const donutCanvas = document.getElementById('chart-squad-donut');
  if (donutCanvas) {
    if (chartSquadDonut) { chartSquadDonut.destroy(); chartSquadDonut = null; }
    chartSquadDonut = new Chart(donutCanvas, {
      type: 'doughnut',
      data: {
        labels: ['Pre-Planning', 'Ad-Hoc', 'Recurring'],
        datasets: [{
          data: [sprintHours, adhocHours, recurHours],
          backgroundColor: [
            isSprintActive ? '#2563eb' : (hasTypeFilter ? '#93c5fd' : '#3b82f6'),
            isAdhocActive ? '#d97706' : (hasTypeFilter ? '#fcd34d' : '#f59e0b'),
            isRecurActive ? '#7e22ce' : (hasTypeFilter ? '#d8b4fe' : '#a855f7')
          ],
          borderWidth: [isSprintActive ? 3 : 0, isAdhocActive ? 3 : 0, isRecurActive ? 3 : 0],
          borderColor: '#ffffff',
          offset: [isSprintActive ? 12 : 0, isAdhocActive ? 12 : 0, isRecurActive ? 12 : 0],
          hoverOffset: 8,
          spacing: 3
        }]
      },
      options: {
        cutout: '70%',
        responsive: true,
        maintainAspectRatio: false,
        onClick: (event, elements) => {
          if (elements && elements.length > 0) {
            const index = elements[0].index;
            const typeMap = ['PROJECT_SPRINT', 'AD_HOC_EMERGENCY', 'RECURRING'];
            filterSquadTasksByType(typeMap[index]);
          }
        },
        onHover: (event, chartElement) => {
          if (event.native && event.native.target) {
            event.native.target.style.cursor = chartElement[0] ? 'pointer' : 'default';
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.label}: ${ctx.raw.toFixed(1)}h (${totalHours > 0 ? Math.round((ctx.raw/totalHours)*100) : 0}%) · Click to filter tasks`
            }
          }
        }
      }
    });

    const legend = document.getElementById('chart-squad-donut-legend');
    if (legend) {
      legend.innerHTML = `
        <div class="space-y-2">
          <!-- Pre-Planning -->
          <div onclick="filterSquadTasksByType('PROJECT_SPRINT')" title="Click to filter Pre-Planning tasks"
            class="p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
              isSprintActive
                ? 'bg-blue-100/90 border-blue-400 ring-2 ring-blue-400 shadow-sm'
                : 'bg-blue-50/60 border-blue-100 hover:bg-blue-100/70 hover:border-blue-200'
            }">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0"></span>
              <div>
                <span class="text-slate-800 font-bold block leading-tight">Pre-Planning</span>
                <span class="text-[10px] text-slate-400 font-mono">${sprintTasks} tasks · ${totalHours > 0 ? Math.round((sprintHours/totalHours)*100) : 0}%</span>
              </div>
            </div>
            <div class="text-right">
              <span class="font-mono text-blue-700 font-extrabold text-xs block">${sprintHours.toFixed(1)}h</span>
              ${isSprintActive ? '<span class="text-[9px] font-bold text-blue-600 uppercase tracking-wider">Active Filter</span>' : '<span class="text-[9px] text-slate-400">Filter ➔</span>'}
            </div>
          </div>

          <!-- Ad-Hoc -->
          <div onclick="filterSquadTasksByType('AD_HOC_EMERGENCY')" title="Click to filter Ad-Hoc emergency tasks"
            class="p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
              isAdhocActive
                ? 'bg-amber-100/90 border-amber-400 ring-2 ring-amber-400 shadow-sm'
                : 'bg-amber-50/60 border-amber-100 hover:bg-amber-100/70 hover:border-amber-200'
            }">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0"></span>
              <div>
                <span class="text-slate-800 font-bold block leading-tight">Ad-Hoc</span>
                <span class="text-[10px] text-slate-400 font-mono">${adhocTasks} tasks · ${totalHours > 0 ? Math.round((adhocHours/totalHours)*100) : 0}%</span>
              </div>
            </div>
            <div class="text-right">
              <span class="font-mono text-amber-700 font-extrabold text-xs block">${adhocHours.toFixed(1)}h</span>
              ${isAdhocActive ? '<span class="text-[9px] font-bold text-amber-600 uppercase tracking-wider">Active Filter</span>' : '<span class="text-[9px] text-slate-400">Filter ➔</span>'}
            </div>
          </div>

          <!-- Recurring -->
          <div onclick="filterSquadTasksByType('RECURRING')" title="Click to filter Recurring routine tasks"
            class="p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
              isRecurActive
                ? 'bg-purple-100/90 border-purple-400 ring-2 ring-purple-400 shadow-sm'
                : 'bg-purple-50/60 border-purple-100 hover:bg-purple-100/70 hover:border-purple-200'
            }">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-purple-500 flex-shrink-0"></span>
              <div>
                <span class="text-slate-800 font-bold block leading-tight">Recurring</span>
                <span class="text-[10px] text-slate-400 font-mono">${recurTasks} tasks · ${totalHours > 0 ? Math.round((recurHours/totalHours)*100) : 0}%</span>
              </div>
            </div>
            <div class="text-right">
              <span class="font-mono text-purple-700 font-extrabold text-xs block">${recurHours.toFixed(1)}h</span>
              ${isRecurActive ? '<span class="text-[9px] font-bold text-purple-600 uppercase tracking-wider">Active Filter</span>' : '<span class="text-[9px] text-slate-400">Filter ➔</span>'}
            </div>
          </div>

          <!-- Clear filter button if active -->
          ${hasTypeFilter ? `
            <button onclick="filterSquadTasksByType('ALL')" class="w-full text-center py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 border border-slate-200 shadow-xs">
              <i class="fa-solid fa-xmark text-slate-400"></i> Clear Filter (Show All ${totalHours.toFixed(1)}h)
            </button>
          ` : ''}
        </div>
      `;
    }
  }

  // Chart 2: Squad Engineers Load Comparison Bar Chart
  const barCanvas = document.getElementById('chart-squad-bar');
  if (barCanvas) {
    if (chartSquadBar) { chartSquadBar.destroy(); chartSquadBar = null; }

    const labels = squadDevs.map(d => d.name.split(' ')[0]);
    const loads = squadDevs.map(d => getDeveloperCapacity(d.id).totalLoad);
    const bgColors = squadDevs.map(d => {
      const cap = getDeveloperCapacity(d.id);
      if (cap.isOverallocated) return '#f43f5e';
      if (cap.isNearCapacity) return '#f59e0b';
      return '#10b981';
    });

    chartSquadBar = new Chart(barCanvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Total Load (Hours)',
          data: loads,
          backgroundColor: bgColors,
          borderRadius: 6,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: Math.max(48, Math.max(...loads) + 4),
            grid: { color: '#f1f5f9' },
            ticks: { font: { family: 'JetBrains Mono', size: 10 } }
          },
          x: {
            grid: { display: false },
            ticks: { font: { family: 'Inter', size: 11, weight: 'bold' } }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => {
                const load = ctx.raw;
                const status = load > 40 ? `(+${(load - 40).toFixed(1)}h Overbooked)` : `(${(40 - load).toFixed(1)}h Free)`;
                return ` Workload: ${load.toFixed(1)}h / 40.0h ${status}`;
              }
            }
          }
        }
      }
    });
  }
}

function filterSquadTasksByType(type) {
  if (state.managerSquadTaskTypeFilter === type) {
    state.managerSquadTaskTypeFilter = 'ALL';
  } else {
    state.managerSquadTaskTypeFilter = type;
  }
  const squad = SQUADS.find(s => s.id === state.currentManagerSquadId) || SQUADS[0];
  renderSquadHubCharts(squad);
  renderSquadTaskBoard(squad);

  const labels = {
    PROJECT_SPRINT: 'Pre-Planning',
    AD_HOC_EMERGENCY: 'Ad-Hoc Emergency',
    RECURRING: 'Recurring Routine',
    ALL: 'All Categories'
  };
  showToast(`Filter: Showing ${labels[state.managerSquadTaskTypeFilter] || 'All'}`);

  if (state.managerSquadTaskTypeFilter !== 'ALL') {
    const board = document.getElementById('squad-task-board-container');
    if (board) {
      board.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
}

function setSquadTaskViewMode(mode) {
  state.managerSquadTaskViewMode = mode;
  const btnBoard = document.getElementById('squad-view-btn-board');
  const btnList = document.getElementById('squad-view-btn-list');
  const btnGrid = document.getElementById('squad-view-btn-grid');

  const activeClass = 'px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 bg-white text-indigo-700 shadow-sm';
  const inactiveClass = 'px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 text-slate-600 hover:text-slate-900';

  if (btnBoard) btnBoard.className = mode === 'board' ? activeClass : inactiveClass;
  if (btnList) btnList.className = mode === 'list' ? activeClass : inactiveClass;
  if (btnGrid) btnGrid.className = mode === 'grid' ? activeClass : inactiveClass;

  const squad = SQUADS.find(s => s.id === state.currentManagerSquadId) || SQUADS[0];
  renderSquadTaskBoard(squad);
}

function renderSquadTaskBoard(squad) {
  const container = document.getElementById('squad-task-board-container');
  const filterPills = document.getElementById('squad-task-filter-pills');
  const facepileContainer = document.getElementById('squad-person-filter-facepile');
  const bannerContainer = document.getElementById('squad-person-filter-banner');
  if (!container) return;

  const squadDevs = DEVELOPERS.filter(d => d.squadId === squad.id);
  const devIds = squadDevs.map(d => d.id);
  let squadTasks = TASKS.filter(t => devIds.includes(t.assignedTo));

  // Render Clean & Scalable Assignee Filter Bar
  if (facepileContainer) {
    const isAll = !state.managerSquadPersonFilter || state.managerSquadPersonFilter === 'all';
    const selectedDevId = state.managerSquadPersonFilter;
    const selectedDev = squadDevs.find(d => d.id === selectedDevId);

    // Dedup devs by ID
    const uniqueDevs = Array.from(new Map(squadDevs.map(d => [d.id, d])).values());

    const activeTasks = isAll
      ? squadTasks
      : squadTasks.filter(t => t.assignedTo === selectedDevId);
    const totalHours = activeTasks.reduce((s, t) => s + (t.estimatedHours || 0), 0);

    let filterBarHtml = `
      <!-- Left side: Filter label, All button, Dropdown Search Selector, and Selected Dev Tag -->
      <div class="flex items-center gap-2.5 flex-wrap">
        <div class="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
          <i class="fa-solid fa-user-tag text-indigo-500"></i>
          <span>Assignee:</span>
        </div>

        <!-- All Engineers Button -->
        <button onclick="setSquadPersonFilter('all')"
          class="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
            isAll
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/90 shadow-2xs font-medium'
          }">
          <span>All Engineers</span>
          <span class="text-xs font-mono font-bold ${isAll ? 'text-slate-300' : 'text-slate-500'}">(${uniqueDevs.length})</span>
        </button>

        <!-- Dropdown Selector -->
        <div class="relative">
          <select id="squad-assignee-select" onchange="setSquadPersonFilter(this.value)"
            class="text-xs font-semibold py-1.5 pl-3 pr-8 rounded-xl bg-white border ${!isAll ? 'border-indigo-400 ring-2 ring-indigo-100 text-indigo-900 font-bold' : 'border-slate-200/90 text-slate-800'} hover:border-slate-300 focus:ring-2 focus:ring-indigo-500 shadow-2xs transition-all cursor-pointer outline-none">
            <option value="all" ${isAll ? 'selected' : ''}>Filter by Engineer (${uniqueDevs.length})...</option>
            ${uniqueDevs.map(dev => {
              const devTaskCount = TASKS.filter(t => t.assignedTo === dev.id).length;
              return `<option value="${dev.id}" ${selectedDevId === dev.id ? 'selected' : ''}>${dev.name} · ${dev.role.split(' ')[0]} (${devTaskCount} tasks)</option>`;
            }).join('')}
          </select>
        </div>

        ${!isAll && selectedDev ? `
          <div class="flex items-center gap-1.5">
            <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs">
              <span class="w-2 h-2 rounded-full bg-indigo-500"></span>
              <span class="truncate max-w-[150px] font-bold">${selectedDev.name}</span>
              <button onclick="setSquadPersonFilter('all')" title="Clear filter" class="hover:text-indigo-950 text-indigo-400 hover:text-indigo-700 ml-0.5">
                <i class="fa-solid fa-xmark text-xs"></i>
              </button>
            </span>
            <button onclick="switchManagerDevHub('${selectedDev.id}')" title="Inspect 360° Developer Dashboard"
              class="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-all">
              <i class="fa-solid fa-id-badge text-indigo-600 text-[11px]"></i>
              <span>360° Profile</span>
            </button>
          </div>
        ` : ''}
      </div>

      <!-- Right side: Clean Workload summary stats -->
      <div class="flex items-center gap-2.5">
        <div class="flex items-center gap-2 px-3.5 py-1.5 bg-white border border-slate-200/90 rounded-xl shadow-2xs text-xs font-mono">
          <span class="text-slate-600"><strong class="text-slate-900 font-bold">${activeTasks.length}</strong> ${activeTasks.length === 1 ? 'task' : 'tasks'}</span>
          <span class="text-slate-300">•</span>
          <span class="text-slate-600"><strong class="text-indigo-600 font-bold">${totalHours.toFixed(1)}h</strong> ${!isAll ? 'assigned' : 'total'}</span>
        </div>
      </div>
    `;

    facepileContainer.innerHTML = filterBarHtml;
  }

  // Active Person Filter Banner - keep hidden since toolbar handles it seamlessly
  if (bannerContainer) {
    bannerContainer.className = 'hidden';
    bannerContainer.innerHTML = '';
  }

  // Filter tasks by specific person if active
  if (state.managerSquadPersonFilter && state.managerSquadPersonFilter !== 'all') {
    squadTasks = squadTasks.filter(t => t.assignedTo === state.managerSquadPersonFilter);
  }

  // Filter by Type (Pre-Planning vs Ad-Hoc vs Recurring)
  if (state.managerSquadTaskTypeFilter !== 'ALL') {
    squadTasks = squadTasks.filter(t => t.taskType === state.managerSquadTaskTypeFilter);
  }

  const viewMode = state.managerSquadTaskViewMode || 'board';

  const typeBadgeMap = {
    PROJECT_SPRINT: '<span class="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1.5 shadow-xs"><i class="fa-solid fa-code-commit text-[10px]"></i> Pre-Planning Tasks <button onclick="filterSquadTasksByType(\'ALL\')" class="hover:text-blue-950 font-bold ml-1 text-xs"><i class="fa-solid fa-circle-xmark"></i></button></span>',
    AD_HOC_EMERGENCY: '<span class="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1.5 shadow-xs"><i class="fa-solid fa-fire-flame-curved text-[10px]"></i> Ad-Hoc Tasks <button onclick="filterSquadTasksByType(\'ALL\')" class="hover:text-amber-950 font-bold ml-1 text-xs"><i class="fa-solid fa-circle-xmark"></i></button></span>',
    RECURRING: '<span class="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300 flex items-center gap-1.5 shadow-xs"><i class="fa-solid fa-repeat text-[10px]"></i> Recurring Routine <button onclick="filterSquadTasksByType(\'ALL\')" class="hover:text-purple-950 font-bold ml-1 text-xs"><i class="fa-solid fa-circle-xmark"></i></button></span>'
  };

  // 1. KANBAN BOARD VIEW (Default 4-Stage Workflow Columns)
  if (viewMode === 'board') {
    if (filterPills) {
      filterPills.innerHTML = state.managerSquadTaskTypeFilter !== 'ALL' ? (typeBadgeMap[state.managerSquadTaskTypeFilter] || '') : '';
    }

    const todoTasks = squadTasks.filter(t => t.status === 'TO_DO');
    const inProgTasks = squadTasks.filter(t => t.status === 'IN_PROGRESS');
    const pendingTasks = squadTasks.filter(t => t.status === 'PENDING_REVIEW' || t.status === 'PENDING_ACCEPTANCE');
    const doneTasks = squadTasks.filter(t => t.status === 'COMPLETED');

    const todoH = todoTasks.reduce((s, t) => s + t.estimatedHours, 0);
    const inProgH = inProgTasks.reduce((s, t) => s + t.estimatedHours, 0);
    const pendingH = pendingTasks.reduce((s, t) => s + t.estimatedHours, 0);
    const doneH = doneTasks.reduce((s, t) => s + (t.loggedHours || t.estimatedHours), 0);

    const col1 = renderKanbanColumnHtml(
      'To Do',
      '<span class="w-2.5 h-2.5 rounded-full bg-slate-400"></span>',
      { border: 'border-slate-200/80', bg: 'bg-slate-50/50', divider: 'border-slate-200/60', badge: 'bg-slate-100 text-slate-700' },
      todoTasks.length,
      todoH,
      todoTasks.map(t => renderKanbanCardHtml(t, true)).join(''),
      'TO_DO'
    );

    const col2 = renderKanbanColumnHtml(
      'In Progress',
      '<span class="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>',
      { border: 'border-blue-200/80', bg: 'bg-blue-50/30', divider: 'border-blue-200/60', badge: 'bg-blue-100 text-blue-800' },
      inProgTasks.length,
      inProgH,
      inProgTasks.map(t => renderKanbanCardHtml(t, true)).join(''),
      'IN_PROGRESS'
    );

    const col3 = renderKanbanColumnHtml(
      'Pending Review',
      '<span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>',
      { border: 'border-amber-200/80', bg: 'bg-amber-50/30', divider: 'border-amber-200/60', badge: 'bg-amber-100 text-amber-800' },
      pendingTasks.length,
      pendingH,
      pendingTasks.map(t => renderKanbanCardHtml(t, true)).join(''),
      'PENDING_REVIEW'
    );

    const col4 = renderKanbanColumnHtml(
      'Completed',
      '<span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>',
      { border: 'border-emerald-200/80', bg: 'bg-emerald-50/30', divider: 'border-emerald-200/60', badge: 'bg-emerald-100 text-emerald-800' },
      doneTasks.length,
      doneH,
      doneTasks.map(t => renderKanbanCardHtml(t, true)).join(''),
      'COMPLETED'
    );

    container.className = 'kanban-board-container';
    container.innerHTML = col1 + col2 + col3 + col4;
    return;
  }

  // 2. LIST MATRIX TABLE VIEW
  if (viewMode === 'list') {
    const allCount = squadTasks.length;
    const inProgressCount = squadTasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'TO_DO').length;
    const pendingCount = squadTasks.filter(t => t.status === 'PENDING_REVIEW' || t.status === 'PENDING_ACCEPTANCE').length;
    const doneCount = squadTasks.filter(t => t.status === 'COMPLETED').length;

    if (filterPills) {
      const filters = [
        { id: 'ALL', label: 'All', count: allCount },
        { id: 'IN_PROGRESS', label: 'Active', count: inProgressCount },
        { id: 'PENDING', label: 'Pending', count: pendingCount },
        { id: 'COMPLETED', label: 'Done', count: doneCount }
      ];
      filterPills.innerHTML = `
        ${state.managerSquadTaskTypeFilter !== 'ALL' ? (typeBadgeMap[state.managerSquadTaskTypeFilter] || '') : ''}
        ${filters.map(f => {
          const isActive = state.managerSquadTaskFilter === f.id;
          return `
            <button onclick="setSquadTaskFilter('${f.id}')"
              class="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                isActive ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold' : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
              }">
              ${f.label} <span class="font-mono text-[10px] opacity-75">(${f.count})</span>
            </button>
          `;
        }).join('')}
      `;
    }

    const filteredTasks = squadTasks.filter(t => {
      if (state.managerSquadTaskFilter === 'ALL') return true;
      if (state.managerSquadTaskFilter === 'IN_PROGRESS') return t.status === 'IN_PROGRESS' || t.status === 'TO_DO';
      if (state.managerSquadTaskFilter === 'PENDING') return t.status === 'PENDING_REVIEW' || t.status === 'PENDING_ACCEPTANCE';
      if (state.managerSquadTaskFilter === 'COMPLETED') return t.status === 'COMPLETED';
      return true;
    });

    container.className = 'w-full';
    container.innerHTML = renderTaskMatrixTableHtml(filteredTasks, true);
    return;
  }

  // 3. GRID / CARD VIEW
  if (viewMode === 'grid') {
    const allCount = squadTasks.length;
    const inProgressCount = squadTasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'TO_DO').length;
    const pendingCount = squadTasks.filter(t => t.status === 'PENDING_REVIEW' || t.status === 'PENDING_ACCEPTANCE').length;
    const doneCount = squadTasks.filter(t => t.status === 'COMPLETED').length;

    if (filterPills) {
      const filters = [
        { id: 'ALL', label: 'All Statuses', count: allCount },
        { id: 'IN_PROGRESS', label: 'In Progress', count: inProgressCount },
        { id: 'PENDING', label: 'Pending Review', count: pendingCount },
        { id: 'COMPLETED', label: 'Completed', count: doneCount }
      ];

      filterPills.innerHTML = `
        ${state.managerSquadTaskTypeFilter !== 'ALL' ? (typeBadgeMap[state.managerSquadTaskTypeFilter] || '') : ''}
        ${filters.map(f => {
          const isActive = state.managerSquadTaskFilter === f.id;
          return `
            <button onclick="setSquadTaskFilter('${f.id}')"
              class="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isActive ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm' : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
              }">
              ${f.label} <span class="font-mono text-[10px] ml-1 opacity-75">(${f.count})</span>
            </button>
          `;
        }).join('')}
      `;
    }

    const filteredTasks = squadTasks.filter(t => {
      if (state.managerSquadTaskFilter === 'ALL') return true;
      if (state.managerSquadTaskFilter === 'IN_PROGRESS') return t.status === 'IN_PROGRESS' || t.status === 'TO_DO';
      if (state.managerSquadTaskFilter === 'PENDING') return t.status === 'PENDING_REVIEW' || t.status === 'PENDING_ACCEPTANCE';
      if (state.managerSquadTaskFilter === 'COMPLETED') return t.status === 'COMPLETED';
      return true;
    });

    if (!filteredTasks.length) {
      const typeNames = {
        PROJECT_SPRINT: 'Pre-Planning',
        AD_HOC_EMERGENCY: 'Ad-Hoc',
        RECURRING: 'Recurring'
      };
      const activeTypeName = typeNames[state.managerSquadTaskTypeFilter];
      const msg = activeTypeName
        ? `No <strong>${activeTypeName}</strong> tasks found matching the active status filter for ${squad.name}.`
        : `No tasks in this category for ${squad.name}.`;
      container.className = 'w-full';
      container.innerHTML = `
        <div class="py-10 text-center text-slate-400 font-mono text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
          <div>${msg}</div>
          ${state.managerSquadTaskTypeFilter !== 'ALL' ? `<button onclick="filterSquadTasksByType('ALL')" class="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold">Show All Tasks</button>` : ''}
        </div>`;
      return;
    }

    container.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';
    container.innerHTML = filteredTasks.map(t => {
      const dev = DEVELOPERS.find(d => d.id === t.assignedTo);
      const projectBadge = squad ? (squad.projectCode || squad.name.replace(/\s\(.*\)/, '')) : 'PROJECT';
      const isDone = t.status === 'COMPLETED';
      const isPending = t.status === 'PENDING_REVIEW' || t.status === 'PENDING_ACCEPTANCE';
      const pct = Math.min(100, Math.round((t.loggedHours / t.estimatedHours) * 100)) || 0;

      let priorityBadge = '';
      if (t.priority === 'P1_HIGH') priorityBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">P1 Urgent</span>';
      else if (t.priority === 'P2_MEDIUM') priorityBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-50 text-amber-700 border border-amber-200">P2 Standard</span>';
      else priorityBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 text-slate-600">P3 Low</span>';

      let typeBadge = '';
      if (t.taskType === 'PROJECT_SPRINT') {
        typeBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200"><i class="fa-solid fa-code-commit text-[9px] mr-1"></i>Pre-Planning</span>';
      } else if (t.taskType === 'AD_HOC_EMERGENCY') {
        typeBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200"><i class="fa-solid fa-fire-flame-curved text-[9px] mr-1"></i>Ad-Hoc</span>';
      } else if (t.taskType === 'RECURRING') {
        typeBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200"><i class="fa-solid fa-repeat text-[9px] mr-1"></i>Recurring</span>';
      }

      return `
        <div class="bg-white rounded-2xl border ${isPending ? 'border-amber-200 bg-amber-50/20' : isDone ? 'border-emerald-200 bg-emerald-50/10' : 'border-slate-200'} p-4 shadow-card hover:shadow-card-hover transition-all space-y-3">
          <div class="flex items-start justify-between gap-2">
            <div class="space-y-1 min-w-0">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-mono font-bold uppercase border border-indigo-200">${projectBadge}</span>
                ${typeBadge}
                ${getTaskCategoryBadge(t.category, t.title)}
                ${priorityBadge}
                ${isDone ? '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">Done</span>' : ''}
                ${isPending ? '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 animate-pulse">Pending</span>' : ''}
              </div>
              <h4 class="text-sm font-bold text-slate-900 leading-snug truncate" title="${t.title}">${t.title}</h4>
            </div>
            <span class="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-lg flex-shrink-0">
              ${cleanHours(t.estimatedHours)}h
            </span>
          </div>

          <!-- Assignee & Due Date -->
          <div class="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
            <div onclick="switchManagerDevHub('${dev ? dev.id : ''}')" class="flex items-center gap-2 cursor-pointer hover:text-blue-600 transition-colors">
              <div class="w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center font-mono">${dev ? dev.initials : '??'}</div>
              <span class="font-bold text-slate-800 truncate">${dev ? dev.name : 'Unassigned'}</span>
            </div>
            <span class="text-[11px] font-mono text-slate-400 truncate">${t.dueDate || 'Sep 5'}</span>
          </div>

          <!-- Progress Bar -->
          <div class="space-y-1">
            <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div class="h-full rounded-full transition-all ${isDone ? 'bg-emerald-500' : 'bg-blue-500'}" style="width: ${pct}%"></div>
            </div>
            <div class="flex justify-between items-center text-[10px] font-mono text-slate-400">
              <span>Logged: <strong>${cleanHours(t.loggedHours)}h</strong></span>
              <span>${pct}% complete</span>
            </div>
          </div>

          <!-- Card Actions -->
          <div class="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
            <button onclick="switchManagerDevHub('${dev ? dev.id : ''}')" class="px-2.5 py-1 rounded-lg bg-cyan-50 hover:bg-cyan-100 text-cyan-800 text-[11px] font-semibold transition-colors flex items-center gap-1">
              <i class="fa-solid fa-id-badge text-[9px]"></i> 360° View
            </button>
            <button onclick="openAssignModalWithDev('${dev ? dev.id : ''}')" class="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors">
              Reassign
            </button>
          </div>
        </div>
      `;
    }).join('');
    return;
  }
}

function setSquadTaskFilter(filter) {
  state.managerSquadTaskFilter = filter;
  const squad = SQUADS.find(s => s.id === state.currentManagerSquadId) || SQUADS[0];
  renderSquadTaskBoard(squad);
}

function setSquadPersonFilter(devId) {
  state.managerSquadPersonFilter = devId;
  const squad = SQUADS.find(s => s.id === state.currentManagerSquadId) || SQUADS[0];
  renderSquadTaskBoard(squad);
  if (devId && devId !== 'all') {
    const dev = DEVELOPERS.find(d => d.id === devId);
    showToast(`Filtered tasks for ${dev ? dev.name : 'selected engineer'}`, 'info');
  } else {
    showToast('Showing all squad tasks', 'info');
  }
}

function renderSquadMembersGrid(squad) {
  const container = document.getElementById('squad-members-grid-container');
  const badge = document.getElementById('squad-members-count-badge');
  if (!container) return;

  const squadDevs = DEVELOPERS.filter(d => d.squadId === squad.id);
  if (badge) badge.innerText = `${squadDevs.length} Engineers in ${squad.name.replace(/\s\(.*\)/, '')}`;

  container.innerHTML = squadDevs.map(dev => {
    const cap = getDeveloperCapacity(dev.id);
    const r = (cap.recurringHours / 40) * 100;
    const s = (cap.sprintHours / 40) * 100;
    const a = (cap.adhocHours / 40) * 100;

    return `
      <div class="bg-slate-50/80 rounded-2xl border ${cap.isOverallocated ? 'border-rose-200 bg-rose-50/20' : 'border-slate-200'} p-4 space-y-3 hover:border-indigo-300 transition-all">
        <div class="flex items-start justify-between gap-2">
          <div class="flex items-center gap-3 min-w-0">
            <div onclick="switchManagerDevHub('${dev.id}')" title="Inspect 360°" class="w-10 h-10 rounded-xl bg-white border border-slate-200 hover:border-blue-400 flex items-center justify-center font-bold text-slate-800 text-xs flex-shrink-0 cursor-pointer shadow-sm">
              ${dev.initials}
            </div>
            <div class="min-w-0">
              <div onclick="switchManagerDevHub('${dev.id}')" class="text-sm font-bold text-slate-900 hover:text-blue-600 cursor-pointer truncate transition-colors">${dev.name}</div>
              <div class="text-xs text-slate-400 truncate">${dev.role}</div>
            </div>
          </div>
          <span class="text-xs font-mono font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${cap.isOverallocated ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'}">
            ${cap.isOverallocated ? `+${cap.overage.toFixed(1)}h over` : `${cap.availableBuffer.toFixed(1)}h free`}
          </span>
        </div>

        <div class="w-full bg-slate-200/80 rounded-full h-2.5 overflow-hidden flex border border-slate-200">
          <div class="bg-purple-500 h-full" style="width:${r}%"></div>
          <div class="bg-blue-500 h-full" style="width:${s}%"></div>
          <div class="bg-amber-500 h-full" style="width:${a}%"></div>
        </div>

        <div class="flex items-center justify-between text-xs font-mono pt-2 border-t border-slate-200">
          <span class="text-slate-600"><strong>${cap.totalLoad.toFixed(1)}h</strong> / 40h</span>
          <button onclick="switchManagerDevHub('${dev.id}')" class="px-3 py-1 rounded-xl bg-white hover:bg-slate-900 hover:text-white text-slate-800 text-xs font-bold border border-slate-200 shadow-sm transition-all flex items-center gap-1.5">
            <i class="fa-solid fa-id-badge text-cyan-600 text-[10px]"></i> Inspect 360°
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function openAssignModalForCurrentSquad() {
  openAssignModal();
  switchAssignMode('team');
  const teamSelect = document.getElementById('assign-team-squad-select');
  if (teamSelect) {
    teamSelect.value = state.currentManagerSquadId;
    runTeamAssignmentSimulation();
  }
}



// ═══════════════════════════════════════════════════════════
// MANAGER: DEVELOPER 360° MANAGEMENT HUB
// ═══════════════════════════════════════════════════════════

function switchManagerDevHub(devId) {
  state.currentManagerDevId = devId;
  const dev = DEVELOPERS.find(d => d.id === devId);
  if (dev) state.currentManagerSquadId = dev.squadId;
  switchManagerTab('dev_hub');
}

function renderManagerDevHub() {
  const dev = DEVELOPERS.find(d => d.id === state.currentManagerDevId) || DEVELOPERS[0];
  if (!dev) return;

  populateManagerDevDropdowns(dev);
  renderManagerDevHero(dev);
  renderManagerDevKPIs(dev);
  renderManagerDevBlockerAnalysis(dev);
  renderManagerDevCharts(dev);
  renderManagerDevTaskBoard(dev);
  renderManagerDevWorkLogs(dev);
}

function populateManagerDevDropdowns(activeDev) {
  const squadFilter = document.getElementById('mgr-dev-squad-filter');
  const devSelect = document.getElementById('mgr-dev-select');
  if (!squadFilter || !devSelect) return;

  // Populate Squad Filter Dropdown
  squadFilter.innerHTML = `
    <option value="all">All Teams (${SQUADS.length})</option>
    ${SQUADS.map(s => `<option value="${s.id}" ${activeDev.squadId === s.id ? 'selected' : ''}>${s.name.replace(/\s\(.*\)/, '')}</option>`).join('')}
  `;

  // Populate Developer Dropdown
  const curSquadFilter = squadFilter.value;
  const devs = DEVELOPERS.filter(d => curSquadFilter === 'all' || d.squadId === curSquadFilter);

  devSelect.innerHTML = devs.map(d => {
    const c = getDeveloperCapacity(d.id);
    const statusText = c.isOverallocated ? `(+${c.overage.toFixed(1)}h over)` : `(${c.availableBuffer.toFixed(1)}h free)`;
    return `<option value="${d.id}" ${d.id === activeDev.id ? 'selected' : ''}>${d.name} · ${d.role.split(' ')[0]} ${statusText}</option>`;
  }).join('');
}

function navigateManagerDev(delta) {
  const curIndex = DEVELOPERS.findIndex(d => d.id === state.currentManagerDevId);
  if (curIndex === -1) return;
  let nextIndex = curIndex + delta;
  if (nextIndex < 0) nextIndex = DEVELOPERS.length - 1;
  if (nextIndex >= DEVELOPERS.length) nextIndex = 0;
  state.currentManagerDevId = DEVELOPERS[nextIndex].id;
  renderManagerDevHub();
}

function onManagerDevSquadFilterChange(squadId) {
  const devs = DEVELOPERS.filter(d => squadId === 'all' || d.squadId === squadId);
  if (devs.length) {
    state.currentManagerDevId = devs[0].id;
    renderManagerDevHub();
  }
}

function onManagerDevSelectChange(devId) {
  state.currentManagerDevId = devId;
  renderManagerDevHub();
}

function renderManagerDevHero(dev) {
  const heroCard = document.getElementById('mgr-dev-hero-card');
  if (!heroCard) return;

  const cap = getDeveloperCapacity(dev.id);
  const squad = SQUADS.find(s => s.id === dev.squadId);
  const r = (cap.recurringHours / 40) * 100;
  const s = (cap.sprintHours / 40) * 100;
  const a = (cap.adhocHours / 40) * 100;
  const p = (cap.pendingHours / 40) * 100;
  const buf = Math.max(0, (cap.availableBuffer / 40) * 100);

  // Health / Allocation status verdict pill
  const statusLabel = cap.isOverallocated
    ? `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs"><span class="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span> Overbooked (+${cap.overage.toFixed(1)}h)</span>`
    : cap.utilizationPct >= 85
      ? `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs"><span class="w-2 h-2 rounded-full bg-amber-500"></span> High Load (${cap.utilizationPct}%)</span>`
      : `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs"><span class="w-2 h-2 rounded-full bg-emerald-500"></span> Optimal (${cap.utilizationPct}%)</span>`;

  heroCard.innerHTML = `
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
      <div class="flex items-center gap-4 min-w-0">
        <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white font-extrabold text-lg flex items-center justify-center font-mono shadow-md flex-shrink-0">
          ${dev.initials}
        </div>
        <div class="min-w-0 space-y-1">
          <div class="flex items-center gap-2.5 flex-wrap">
            <h2 class="text-xl font-bold text-slate-900 tracking-tight truncate">${dev.name}</h2>
            ${squad ? getSquadPillBadgeHtml(squad, 'text-xs px-3 py-0.5') : ''}
          </div>
          <div class="text-xs text-slate-500 font-sans flex items-center gap-3 flex-wrap">
            <span class="flex items-center gap-1"><i class="fa-solid fa-code text-blue-500"></i> ${dev.role}</span>
            <span class="flex items-center gap-1 text-slate-400"><i class="fa-regular fa-envelope"></i> ${dev.email || `${dev.name.toLowerCase().replace(' ', '.')}@workdash.internal`}</span>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-3 self-end md:self-auto">
        <div class="text-right">
          <div class="text-xs text-slate-400 font-medium mb-1">Weekly Status</div>
          ${statusLabel}
        </div>
      </div>
    </div>

    <!-- Fuel Gauge Bar -->
    <div class="space-y-2.5 pt-1">
      <div class="flex justify-between items-center text-xs font-mono">
        <span class="text-slate-600">Workload: <strong class="${cap.isOverallocated ? 'text-rose-600' : 'text-slate-900'} font-bold">${cap.totalLoad.toFixed(1)}h</strong> / 40.0h Limit</span>
        <span class="font-bold text-xs ${cap.isOverallocated ? 'text-rose-600' : 'text-slate-700'}">${cap.utilizationPct}% Utilized</span>
      </div>

      <div class="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex border border-slate-200/80">
        <div class="bg-purple-500 h-full rounded-l-full transition-all duration-300" style="width:${r}%" title="Recurring: ${cap.recurringHours.toFixed(1)}h"></div>
        <div class="bg-blue-500 h-full transition-all duration-300" style="width:${s}%" title="Pre-Planning: ${cap.sprintHours.toFixed(1)}h"></div>
        <div class="bg-amber-500 h-full transition-all duration-300" style="width:${a}%" title="Ad-Hoc: ${cap.adhocHours.toFixed(1)}h"></div>
        ${p > 0 ? `<div class="bg-rose-400 h-full animate-pulse transition-all duration-300" style="width:${p}%" title="Pending: ${cap.pendingHours.toFixed(1)}h"></div>` : ''}
        ${!cap.isOverallocated && buf > 0 ? `<div class="bg-emerald-400/30 h-full rounded-r-full transition-all duration-300" style="width:${buf}%" title="Free Buffer: ${cap.availableBuffer.toFixed(1)}h"></div>` : ''}
      </div>

      <div class="flex items-center justify-between text-xs font-mono text-slate-600 pt-0.5 flex-wrap gap-2">
        <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-purple-500"></span> ${cap.recurringHours.toFixed(1)}h Recurring</span>
        <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-blue-500"></span> ${cap.sprintHours.toFixed(1)}h Pre-Planning</span>
        <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-amber-500"></span> ${cap.adhocHours.toFixed(1)}h Ad-Hoc</span>
        <span class="flex items-center gap-1.5 ${cap.isOverallocated ? 'text-rose-600 font-bold' : 'text-emerald-700'}"><span class="w-2 h-2 rounded-full ${cap.isOverallocated ? 'bg-rose-500' : 'bg-emerald-500'}"></span> ${cap.isOverallocated ? `+${cap.overage.toFixed(1)}h Overtime` : `${cap.availableBuffer.toFixed(1)}h Free Buffer`}</span>
      </div>
    </div>
  `;
}

function renderManagerDevKPIs(dev) {
  const grid = document.getElementById('mgr-dev-kpi-grid');
  if (!grid) return;

  const cap = getDeveloperCapacity(dev.id);
  const devTasks = TASKS.filter(t => t.assignedTo === dev.id);
  const activeTasks = devTasks.filter(t => t.status !== 'COMPLETED').length;
  const loggedSprint = devTasks.reduce((acc, t) => acc + t.loggedHours, 0);

  grid.innerHTML = `
    <div class="kpi-card kpi-card-blue space-y-3">
      <div class="flex items-center justify-between">
        <span class="kpi-label">Weekly Limit</span>
        <span class="kpi-icon bg-slate-100 text-slate-700 font-bold text-xs font-mono">40h</span>
      </div>
      <div>
        <span class="kpi-value text-slate-900">40.0h</span>
        <span class="text-xs text-slate-400 ml-1">hard cap</span>
      </div>
      <div class="kpi-sub">Company SLA Standard</div>
    </div>

    <div class="kpi-card ${cap.isOverallocated ? 'kpi-card-rose' : 'kpi-card-blue'} space-y-3">
      <div class="flex items-center justify-between">
        <span class="kpi-label ${cap.isOverallocated ? 'text-red-500' : ''}">Committed Work</span>
        <span class="kpi-icon ${cap.isOverallocated ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-600'}"><i class="fa-solid fa-briefcase"></i></span>
      </div>
      <div>
        <span class="kpi-value ${cap.isOverallocated ? 'text-red-500' : 'text-blue-600'}">${cap.totalLoad.toFixed(1)}h</span>
        <span class="text-xs text-slate-400 ml-1">allocated</span>
      </div>
      <div class="kpi-sub ${cap.isOverallocated ? 'text-red-500 font-bold' : 'text-emerald-600 font-semibold'}">
        ${cap.isOverallocated ? `+${cap.overage.toFixed(1)}h overtime` : `${cap.availableBuffer.toFixed(1)}h capacity buffer`}
      </div>
    </div>

    <div class="kpi-card kpi-card-purple space-y-3">
      <div class="flex items-center justify-between">
        <span class="kpi-label">Active Tasks</span>
        <span class="kpi-icon bg-purple-50 text-purple-600"><i class="fa-solid fa-bars-progress"></i></span>
      </div>
      <div>
        <span class="kpi-value text-purple-600">${activeTasks}</span>
        <span class="text-xs text-slate-400 ml-1">tasks</span>
      </div>
      <div class="kpi-sub">${devTasks.filter(t => t.status === 'COMPLETED').length} tasks completed</div>
    </div>

    <div class="kpi-card kpi-card-emerald space-y-3">
      <div class="flex items-center justify-between">
        <span class="kpi-label">Logged Hours</span>
        <span class="kpi-icon bg-emerald-50 text-emerald-600"><i class="fa-solid fa-stopwatch"></i></span>
      </div>
      <div>
        <span class="kpi-value text-emerald-600">${loggedSprint.toFixed(1)}h</span>
        <span class="text-xs text-slate-400 ml-1">logged</span>
      </div>
      <div class="kpi-sub">Actual sprint time recorded</div>
    </div>
  `;
}

function renderManagerDevCharts(dev) {
  const cap = getDeveloperCapacity(dev.id);

  // Update total tag
  const totalTag = document.getElementById('mgr-dev-chart-total-tag');
  if (totalTag) totalTag.innerText = `${cap.totalLoad.toFixed(1)}h Total Load`;

  // Chart 1: Bar Chart
  const barCanvas = document.getElementById('chart-mgr-dev-bar');
  if (barCanvas) {
    if (chartMgrDevBar) { chartMgrDevBar.destroy(); chartMgrDevBar = null; }

    const isWeek = state.managerDevChartPeriod === 'week';
    const labels = isWeek ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] : ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    const sprintData = isWeek ? [4.0, 3.5, 0, 4.0, 2.0] : [16.0, 14.0, 18.0, 12.0];
    const adhocData = isWeek ? [0, 2.0, 0, 0, 1.5] : [2.0, 0, 4.0, 2.0];
    const recurData = isWeek ? [1.5, 1.5, 1.5, 1.5, 1.5] : [7.5, 7.5, 7.5, 7.5];

    chartMgrDevBar = new Chart(barCanvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Pre-Planning', data: sprintData, backgroundColor: '#3b82f6', borderRadius: 4 },
          { label: 'Ad-Hoc', data: adhocData, backgroundColor: '#f59e0b', borderRadius: 4 },
          { label: 'Recurring', data: recurData, backgroundColor: '#a855f7', borderRadius: 4 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { stacked: true, grid: { display: false } },
          y: { stacked: true, grid: { color: '#f1f5f9' }, ticks: { font: { family: 'JetBrains Mono', size: 10 } } }
        },
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 } } },
          tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.raw}h` } }
        }
      }
    });
  }

  // Chart 2: Donut Chart
  const donutCanvas = document.getElementById('chart-mgr-dev-donut');
  if (donutCanvas) {
    if (chartMgrDevDonut) { chartMgrDevDonut.destroy(); chartMgrDevDonut = null; }

    const devTasks = TASKS.filter(t => t.assignedTo === dev.id);
    const sprintCount = devTasks.filter(t => t.taskType === 'PROJECT_SPRINT').length;
    const adhocCount = devTasks.filter(t => t.taskType === 'AD_HOC_EMERGENCY').length;
    const recurringCount = devTasks.filter(t => t.taskType === 'RECURRING').length;

    chartMgrDevDonut = new Chart(donutCanvas, {
      type: 'doughnut',
      data: {
        labels: ['Pre-Planning Tasks', 'Ad-Hoc Emergency', 'Recurring Maintenance'],
        datasets: [{
          data: [cap.sprintHours, cap.adhocHours, cap.recurringHours],
          backgroundColor: ['#3b82f6', '#f59e0b', '#a855f7'],
          borderWidth: 0,
          hoverOffset: 6,
          spacing: 2
        }]
      },
      options: {
        cutout: '70%',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.label}: ${ctx.raw.toFixed(1)}h (Click slice to filter)`
            }
          }
        },
        onHover: (evt, activeEls) => {
          if (evt && evt.native && evt.native.target) {
            evt.native.target.style.cursor = activeEls.length ? 'pointer' : 'default';
          }
        },
        onClick: (evt, activeEls) => {
          if (activeEls && activeEls.length > 0) {
            const index = activeEls[0].index;
            const types = ['PROJECT_SPRINT', 'AD_HOC_EMERGENCY', 'RECURRING'];
            if (types[index]) {
              setManagerDevTaskTypeFilter(types[index]);
            }
          }
        }
      }
    });

    const legend = document.getElementById('chart-mgr-dev-donut-legend');
    if (legend) {
      const isSprintActive = state.managerDevTaskTypeFilter === 'PROJECT_SPRINT';
      const isAdhocActive = state.managerDevTaskTypeFilter === 'AD_HOC_EMERGENCY';
      const isRecurActive = state.managerDevTaskTypeFilter === 'RECURRING';
      const isAnyActive = state.managerDevTaskTypeFilter && state.managerDevTaskTypeFilter !== 'ALL';

      legend.innerHTML = `
        <div onclick="setManagerDevTaskTypeFilter('PROJECT_SPRINT')"
          class="p-2.5 rounded-xl border transition-all cursor-pointer select-none flex items-center justify-between ${
            isSprintActive
              ? 'bg-blue-100/95 border-blue-400 ring-2 ring-blue-400 shadow-sm'
              : isAnyActive
                ? 'bg-blue-50/40 border-blue-100 opacity-60 hover:opacity-100 hover:bg-blue-50/80'
                : 'bg-blue-50/70 border-blue-100 hover:bg-blue-100/70 hover:border-blue-200'
          }" title="Click to view only Pre-Planning tasks">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0 ${isSprintActive ? 'animate-pulse' : ''}"></span>
            <span class="text-slate-800 text-xs font-semibold">Pre-Planning</span>
            <span class="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${isSprintActive ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'}">
              ${sprintCount} tasks
            </span>
          </div>
          <div class="flex items-center gap-1.5 font-mono">
            <span class="text-blue-700 font-bold text-xs">${cap.sprintHours.toFixed(1)}h</span>
            ${isSprintActive ? '<i class="fa-solid fa-circle-check text-blue-600 text-xs"></i>' : '<i class="fa-solid fa-chevron-right text-[10px] text-slate-300"></i>'}
          </div>
        </div>

        <div onclick="setManagerDevTaskTypeFilter('AD_HOC_EMERGENCY')"
          class="p-2.5 rounded-xl border transition-all cursor-pointer select-none flex items-center justify-between ${
            isAdhocActive
              ? 'bg-amber-100/95 border-amber-400 ring-2 ring-amber-400 shadow-sm'
              : isAnyActive
                ? 'bg-amber-50/40 border-amber-100 opacity-60 hover:opacity-100 hover:bg-amber-50/80'
                : 'bg-amber-50/70 border-amber-100 hover:bg-amber-100/70 hover:border-amber-200'
          }" title="Click to view only Ad-Hoc Emergency tasks">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0 ${isAdhocActive ? 'animate-pulse' : ''}"></span>
            <span class="text-slate-800 text-xs font-semibold">Ad-Hoc</span>
            <span class="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${isAdhocActive ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-800'}">
              ${adhocCount} tasks
            </span>
          </div>
          <div class="flex items-center gap-1.5 font-mono">
            <span class="text-amber-700 font-bold text-xs">${cap.adhocHours.toFixed(1)}h</span>
            ${isAdhocActive ? '<i class="fa-solid fa-circle-check text-amber-600 text-xs"></i>' : '<i class="fa-solid fa-chevron-right text-[10px] text-slate-300"></i>'}
          </div>
        </div>

        <div onclick="setManagerDevTaskTypeFilter('RECURRING')"
          class="p-2.5 rounded-xl border transition-all cursor-pointer select-none flex items-center justify-between ${
            isRecurActive
              ? 'bg-purple-100/95 border-purple-400 ring-2 ring-purple-400 shadow-sm'
              : isAnyActive
                ? 'bg-purple-50/40 border-purple-100 opacity-60 hover:opacity-100 hover:bg-purple-50/80'
                : 'bg-purple-50/70 border-purple-100 hover:bg-purple-100/70 hover:border-purple-200'
          }" title="Click to view only Recurring tasks">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-purple-500 flex-shrink-0 ${isRecurActive ? 'animate-pulse' : ''}"></span>
            <span class="text-slate-800 text-xs font-semibold">Recurring</span>
            <span class="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${isRecurActive ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-800'}">
              ${recurringCount} tasks
            </span>
          </div>
          <div class="flex items-center gap-1.5 font-mono">
            <span class="text-purple-700 font-bold text-xs">${cap.recurringHours.toFixed(1)}h</span>
            ${isRecurActive ? '<i class="fa-solid fa-circle-check text-purple-600 text-xs"></i>' : '<i class="fa-solid fa-chevron-right text-[10px] text-slate-300"></i>'}
          </div>
        </div>

        <div class="flex items-center justify-between pt-1 px-1 text-[11px] font-mono text-slate-400">
          <span class="flex items-center gap-1"><i class="fa-solid fa-arrow-pointer text-[10px]"></i> Click category to filter tasks</span>
          ${isAnyActive ? `
            <button onclick="setManagerDevTaskTypeFilter('ALL')" class="text-blue-600 hover:text-blue-800 font-bold underline transition-colors">
              Reset (Show All)
            </button>
          ` : ''}
        </div>
      `;
    }
  }
}

function setManagerDevTaskTypeFilter(type) {
  if (state.managerDevTaskTypeFilter === type) {
    state.managerDevTaskTypeFilter = 'ALL';
  } else {
    state.managerDevTaskTypeFilter = type;
  }
  saveAppState();
  const dev = DEVELOPERS.find(d => d.id === (state.currentManagerDevId || state.currentDevId)) || DEVELOPERS[0];
  renderManagerDevCharts(dev);
  renderManagerDevTaskBoard(dev);

  const labels = {
    PROJECT_SPRINT: 'Pre-Planning Tasks',
    AD_HOC_EMERGENCY: 'Ad-Hoc Emergency Tasks',
    RECURRING: 'Recurring Routine Tasks',
    ALL: 'All Workload Tasks'
  };
  showToast(`Filter: Showing ${labels[state.managerDevTaskTypeFilter] || 'All Tasks'}`);

  if (state.managerDevTaskTypeFilter !== 'ALL') {
    const board = document.getElementById('mgr-dev-task-board-container');
    if (board) {
      board.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
}

function setManagerDevChartPeriod(period) {
  state.managerDevChartPeriod = period;
  const bWeek = document.getElementById('mgr-dev-btn-week');
  const bMonth = document.getElementById('mgr-dev-btn-month');
  if (bWeek && bMonth) {
    bWeek.className = period === 'week' ? 'px-2.5 py-1 rounded-md bg-white text-blue-600 font-bold shadow-sm' : 'px-2.5 py-1 rounded-md text-slate-600';
    bMonth.className = period === 'month' ? 'px-2.5 py-1 rounded-md bg-white text-blue-600 font-bold shadow-sm' : 'px-2.5 py-1 rounded-md text-slate-600';
  }
  const dev = DEVELOPERS.find(d => d.id === state.currentManagerDevId) || DEVELOPERS[0];
  renderManagerDevCharts(dev);
}

function setManagerDevTaskViewMode(mode) {
  state.managerDevTaskViewMode = mode;
  const btnBoard = document.getElementById('mgr-dev-view-btn-board');
  const btnList = document.getElementById('mgr-dev-view-btn-list');
  const btnGrid = document.getElementById('mgr-dev-view-btn-grid');

  const activeClass = 'px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 bg-white text-blue-700 shadow-sm';
  const inactiveClass = 'px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 text-slate-600 hover:text-slate-900';

  if (btnBoard) btnBoard.className = mode === 'board' ? activeClass : inactiveClass;
  if (btnList) btnList.className = mode === 'list' ? activeClass : inactiveClass;
  if (btnGrid) btnGrid.className = mode === 'grid' ? activeClass : inactiveClass;

  const dev = DEVELOPERS.find(d => d.id === state.currentManagerDevId) || DEVELOPERS[0];
  renderManagerDevTaskBoard(dev);
}

function setManagerDevTaskFilter(filter) {
  state.managerDevTaskFilter = filter;
  const dev = DEVELOPERS.find(d => d.id === state.currentManagerDevId) || DEVELOPERS[0];
  renderManagerDevTaskBoard(dev);
}

// ═══════════════════════════════════════════════════════════
// KANBAN DRAG & DROP INTERACTION SYSTEM
// ═══════════════════════════════════════════════════════════

let draggedTaskId = null;

function onKanbanCardDragStart(event, taskId) {
  draggedTaskId = taskId;
  if (event.dataTransfer) {
    event.dataTransfer.setData('text/plain', taskId);
    event.dataTransfer.effectAllowed = 'move';
  }
  const el = event.currentTarget;
  if (el) {
    setTimeout(() => el.classList.add('dragging'), 0);
  }
}

function onKanbanCardDragEnd(event) {
  draggedTaskId = null;
  const el = event.currentTarget;
  if (el) {
    el.classList.remove('dragging');
  }
  document.querySelectorAll('.kanban-column-dropzone').forEach(col => {
    col.classList.remove('drag-over');
  });
}

function onKanbanColumnDragOver(event) {
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }
}

function onKanbanColumnDragEnter(event) {
  event.preventDefault();
  const col = event.currentTarget;
  if (col && col.classList.contains('kanban-column-dropzone')) {
    col.classList.add('drag-over');
  }
}

function onKanbanColumnDragLeave(event) {
  const col = event.currentTarget;
  if (col && !col.contains(event.relatedTarget)) {
    col.classList.remove('drag-over');
  }
}

function onKanbanColumnDrop(event, targetStatus) {
  event.preventDefault();
  const col = event.currentTarget;
  if (col) {
    col.classList.remove('drag-over');
  }

  const taskId = (event.dataTransfer ? event.dataTransfer.getData('text/plain') : null) || draggedTaskId;
  if (!taskId || !targetStatus) return;

  const task = TASKS.find(t => t.id === taskId);
  if (!task) return;

  if (task.status === targetStatus) return;

  task.status = targetStatus;

  // Handle auto-completion & hours updates
  if (targetStatus === 'COMPLETED') {
    if (task.loggedHours < task.estimatedHours) {
      task.loggedHours = task.estimatedHours;
    }
    const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    task.completedAt = todayStr;
    if (state.activeTimer && state.activeTimer.taskId === task.id) {
      clearInterval(state.activeTimer.intervalId);
      state.activeTimer = { taskId: null, isRunning: false, seconds: 0, intervalId: null };
    }
  } else {
    task.completedAt = null;
  }

  const statusLabels = {
    TO_DO: 'To Do',
    IN_PROGRESS: 'In Progress',
    PENDING_REVIEW: 'Pending Review',
    PENDING_ACCEPTANCE: 'Pending Review',
    COMPLETED: 'Completed'
  };

  showToast(`Task moved to "${statusLabels[targetStatus] || targetStatus}" ✨`);
  saveAppState();

  // Synchronize and re-render all relevant dashboard views
  renderDeveloperTasks();
  renderDeveloperMetrics();
  renderDeveloperWorkLogs();

  const currentDev = DEVELOPERS.find(d => d.id === (state.currentManagerDevId || state.currentDevId)) || DEVELOPERS[0];
  renderManagerDevTaskBoard(currentDev);
  renderManagerDevWorkLogs(currentDev);
  renderManagerDevHub();
  renderSquadSprintTaskBoard();
  renderSquadCapacityHub();
  renderManagerKpis();
  renderLiveActivityStream();
}

function toggleKanbanCardDetails(btnEl, taskId) {
  const card = btnEl.closest('.kanban-card');
  const panel = card ? card.querySelector('.kc-details') : null;
  if (!panel) return;
  const icon = btnEl.querySelector('i');
  const willShow = panel.classList.contains('hidden');
  panel.classList.toggle('hidden');
  if (icon) {
    icon.classList.toggle('fa-eye', !willShow);
    icon.classList.toggle('fa-eye-slash', willShow);
  }
  btnEl.classList.toggle('bg-blue-50', willShow);
  btnEl.classList.toggle('text-blue-600', willShow);
}

function renderKanbanCardHtml(t, showAssignee, isManagerView) {
  const isManager = (isManagerView !== undefined) ? isManagerView : (state.currentRole === 'manager');
  const dev = DEVELOPERS.find(d => d.id === t.assignedTo);
  const squad = dev ? SQUADS.find(s => s.id === dev.squadId) : (t.squadId ? SQUADS.find(s => s.id === t.squadId) : null);
  const projectBadge = squad ? (squad.projectCode || squad.name.replace(/\s\(.*\)/, '')) : 'PROJECT';
  const isDone = t.status === 'COMPLETED';
  const isPending = t.status === 'PENDING_REVIEW' || t.status === 'PENDING_ACCEPTANCE';
  const pct = Math.min(100, Math.round((t.loggedHours / t.estimatedHours) * 100)) || 0;
  const taskLogs = WORK_LOGS.filter(l => l.taskId === t.id);
  const formattedDueDate = formatShortDate(t.dueDate);

  let priBadge = '';
  if (t.priority === 'P1_HIGH') priBadge = '<span class="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">P1 Urgent</span>';
  else if (t.priority === 'P2_MEDIUM') priBadge = '<span class="px-2 py-0.5 rounded-md text-xs font-mono font-semibold bg-amber-50 text-amber-700 border border-amber-200">P2 Standard</span>';
  else priBadge = '<span class="px-2 py-0.5 rounded-md text-xs font-mono font-medium bg-slate-100 text-slate-600 border border-slate-200">P3 Low</span>';

  let typeBadge = '';
  if (t.taskType === 'PROJECT_SPRINT') {
    typeBadge = '<span class="px-2 py-0.5 rounded-md text-xs font-mono font-semibold bg-blue-50 text-blue-700 border border-blue-200"><i class="fa-solid fa-code-commit text-[10px] mr-1"></i>Pre-Planning</span>';
  } else if (t.taskType === 'AD_HOC_EMERGENCY') {
    typeBadge = '<span class="px-2 py-0.5 rounded-md text-xs font-mono font-semibold bg-amber-50 text-amber-700 border border-amber-200"><i class="fa-solid fa-fire-flame-curved text-[10px] mr-1"></i>Ad-Hoc</span>';
  } else if (t.taskType === 'RECURRING') {
    typeBadge = '<span class="px-2 py-0.5 rounded-md text-xs font-mono font-semibold bg-purple-50 text-purple-700 border border-purple-200"><i class="fa-solid fa-repeat text-[10px] mr-1"></i>Recurring</span>';
  }

  const catBadge = getTaskCategoryBadge(t.category, t.title);

  return `
    <div class="kanban-card bg-white rounded-2xl border ${isPending ? 'border-amber-200 shadow-sm ring-1 ring-amber-100' : isDone ? 'border-emerald-200 bg-emerald-50/10' : 'border-slate-200'} p-3.5 shadow-card hover:shadow-card-hover transition-all select-none"
      draggable="true"
      data-task-id="${t.id}"
      ondragstart="onKanbanCardDragStart(event, '${t.id}')"
      ondragend="onKanbanCardDragEnd(event)">

      <!-- ═══ Always visible: the essentials ═══ -->
      <div class="space-y-2.5 cursor-grab active:cursor-grabbing">

        <!-- Project · Priority · Hours -->
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-mono font-bold uppercase border border-indigo-200">${projectBadge}</span>
            ${t.priority === 'P1_HIGH' ? priBadge : ''}
          </div>
          <span class="text-xs font-mono font-bold text-slate-700 flex-shrink-0 tabular-nums">${cleanHours(t.estimatedHours)}h</span>
        </div>

        <!-- Title -->
        <h5 class="text-sm font-semibold text-slate-900 leading-snug line-clamp-2" title="${t.title}">${t.title}</h5>

        ${showAssignee && dev ? `
          <div onclick="event.stopPropagation(); switchManagerDevHub('${dev.id}')" class="flex items-center gap-2 cursor-pointer hover:text-blue-600 transition-colors">
            <div class="w-5 h-5 rounded bg-slate-100 border border-slate-200 text-slate-800 text-[10px] font-bold flex items-center justify-center font-mono">${dev.initials}</div>
            <span class="text-xs font-semibold text-slate-700 truncate">${dev.name}</span>
          </div>
        ` : ''}

        <!-- Compact progress -->
        <div class="flex items-center gap-2">
          <div class="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-100">
            <div class="h-full rounded-full transition-all duration-300 ${isDone ? 'bg-emerald-500' : 'bg-blue-500'}" style="width: ${pct}%"></div>
          </div>
          <span class="text-xs font-mono font-bold text-slate-500 flex-shrink-0">${pct}%</span>
        </div>

        <!-- Footer: due date + expand toggle -->
        <div class="flex items-center justify-between text-xs font-medium text-slate-500 pt-0.5">
          <span class="truncate flex items-center gap-1.5"><i class="fa-regular fa-calendar text-[11px] text-slate-400"></i> ${formattedDueDate}</span>
          <button onclick="event.stopPropagation(); toggleKanbanCardDetails(this, '${t.id}')" title="Show more details"
            class="kc-toggle-btn w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all flex-shrink-0">
            <i class="fa-regular fa-eye text-xs"></i>
          </button>
        </div>
      </div>

      <!-- ═══ Hidden by default: everything else, revealed on tap ═══ -->
      <div class="kc-details hidden mt-3 pt-3 border-t border-slate-100 space-y-2.5">

        <div class="flex items-center gap-1.5 flex-wrap">
          ${t.priority === 'P1_HIGH' ? '' : priBadge}
          ${typeBadge}
          ${catBadge}
        </div>

        <div class="flex justify-between items-center text-xs font-mono text-slate-500">
          <span>Logged: <strong class="text-slate-800 font-semibold">${cleanHours(t.loggedHours)}h</strong> / ${cleanHours(t.estimatedHours)}h</span>
        </div>

        <div class="flex items-center gap-1.5 flex-wrap pt-1">
          <button onclick="event.stopPropagation(); openTaskLogDrawer('${t.id}')" class="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold transition-all flex items-center gap-1 text-xs border border-indigo-200" title="View Logs & History">
            <i class="fa-solid fa-clock-rotate-left text-[10px]"></i> Logs (${taskLogs.length})
          </button>
          ${isManager ? `
            <button onclick="event.stopPropagation(); openAssignModalWithDev('${t.assignedTo}')" class="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-all text-xs border border-slate-200" title="Reassign Task">
              Reassign
            </button>
          ` : `
            ${!isDone ? `
              <button onclick="event.stopPropagation(); openLogTimeModal('${t.id}')" class="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold transition-all flex items-center gap-1 text-xs" title="Log Hours">
                <i class="fa-solid fa-plus text-[10px]"></i> Log Time
              </button>
            ` : `
              <span class="px-2 py-0.5 rounded text-xs font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1"><i class="fa-solid fa-check text-[9px]"></i> Done</span>
            `}
          `}
        </div>
      </div>
    </div>
  `;
}

function renderKanbanColumnHtml(title, iconHtml, colorTheme, count, totalHours, cardListHtml, explicitStatusKey) {
  const statusKey = explicitStatusKey || (
    title.toLowerCase().includes('to do') ? 'TO_DO' :
    title.toLowerCase().includes('in prog') ? 'IN_PROGRESS' :
    title.toLowerCase().includes('review') || title.toLowerCase().includes('pending') ? 'PENDING_REVIEW' :
    title.toLowerCase().includes('complete') || title.toLowerCase().includes('done') ? 'COMPLETED' : 'TO_DO'
  );

  return `
    <div class="kanban-column-dropzone rounded-2xl border ${colorTheme.border} ${colorTheme.bg} p-3.5 flex flex-col transition-all duration-200 shadow-2xs"
      data-status="${statusKey}"
      ondragover="onKanbanColumnDragOver(event)"
      ondragenter="onKanbanColumnDragEnter(event)"
      ondragleave="onKanbanColumnDragLeave(event)"
      ondrop="onKanbanColumnDrop(event, '${statusKey}')">
      
      <!-- Column Header (Fixed Header at top) -->
      <div class="flex items-center justify-between pb-2.5 mb-2.5 border-b ${colorTheme.divider} select-none flex-shrink-0">
        <div class="flex items-center gap-2 min-w-0">
          ${iconHtml}
          <h4 class="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono truncate">${title}</h4>
        </div>
        <div class="flex items-center gap-1.5 flex-shrink-0">
          <span class="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold ${colorTheme.badge}">${count}</span>
          <span class="text-xs font-mono text-slate-500 font-semibold">${cleanHours(totalHours)}h</span>
        </div>
      </div>

      <!-- Column Card List (Independent Internal Vertical Scroll) -->
      <div class="kanban-column-body space-y-2.5 flex-1 overflow-y-auto pr-1 min-h-[100px] max-h-[490px]">
        ${count > 0 ? cardListHtml : `
          <div class="py-8 text-center text-xs text-slate-400 font-mono border-2 border-dashed border-slate-200/80 rounded-xl flex flex-col items-center justify-center gap-2">
            <i class="fa-solid fa-arrows-up-down-left-right text-slate-300 text-sm"></i>
            <span>Drop tasks here</span>
          </div>
        `}
      </div>
    </div>
  `;
}

function renderTaskMatrixTableHtml(tasks, showAssignee) {
  if (!tasks.length) {
    return `<div class="py-12 text-center text-slate-400 font-mono text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">No matching tasks in this view.</div>`;
  }

  return `
    <div class="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-slate-200 bg-slate-50/80 text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
              <th class="px-5 py-3.5">Task & Project</th>
              <th class="px-4 py-3.5">Workload Type</th>
              <th class="px-4 py-3.5">Category</th>
              ${showAssignee ? '<th class="px-4 py-3.5">Assignee</th>' : ''}
              <th class="px-4 py-3.5">Priority</th>
              <th class="px-4 py-3.5">Due Date</th>
              <th class="px-4 py-3.5">Hours / Progress</th>
              <th class="px-4 py-3.5">Status</th>
              <th class="px-4 py-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-xs">
            ${tasks.map(t => {
              const dev = DEVELOPERS.find(d => d.id === t.assignedTo);
              const squad = dev ? SQUADS.find(s => s.id === dev.squadId) : (t.squadId ? SQUADS.find(s => s.id === t.squadId) : null);
              const projectBadge = squad ? (squad.projectCode || squad.name.replace(/\s\(.*\)/, '')) : 'PROJECT';
              const isDone = t.status === 'COMPLETED';
              const isPending = t.status === 'PENDING_REVIEW' || t.status === 'PENDING_ACCEPTANCE';
              const pct = Math.min(100, Math.round((t.loggedHours / t.estimatedHours) * 100)) || 0;
              const formattedDueDate = formatShortDate(t.dueDate);

              let priBadge = '';
              if (t.priority === 'P1_HIGH') priBadge = '<span class="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">P1 Urgent</span>';
              else if (t.priority === 'P2_MEDIUM') priBadge = '<span class="px-2.5 py-0.5 rounded-md text-xs font-mono font-semibold bg-amber-50 text-amber-700 border border-amber-200">P2 Standard</span>';
              else priBadge = '<span class="px-2.5 py-0.5 rounded-md text-xs font-mono font-medium bg-slate-100 text-slate-600 border border-slate-200">P3 Low</span>';

              let statusBadge = '';
              if (isDone) statusBadge = '<span class="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800">Done</span>';
              else if (isPending) statusBadge = '<span class="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-amber-100 text-amber-800 animate-pulse">Needs Review</span>';
              else if (t.status === 'IN_PROGRESS') statusBadge = '<span class="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">In Progress</span>';
              else statusBadge = '<span class="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-600">To Do</span>';

              let typeBadge = '';
              if (t.taskType === 'PROJECT_SPRINT') {
                typeBadge = '<span class="px-2 py-0.5 rounded-md text-xs font-mono font-medium bg-blue-50 text-blue-700 border border-blue-200">Pre-Planning</span>';
              } else if (t.taskType === 'AD_HOC_EMERGENCY') {
                typeBadge = '<span class="px-2 py-0.5 rounded-md text-xs font-mono font-medium bg-amber-50 text-amber-700 border border-amber-200">Ad-Hoc</span>';
              } else {
                typeBadge = '<span class="px-2 py-0.5 rounded-md text-xs font-mono font-medium bg-purple-50 text-purple-700 border border-purple-200">Recurring</span>';
              }

              return `
                <tr class="hover:bg-slate-50/80 transition-colors">
                  <td class="px-5 py-3.5 max-w-xs">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-xs font-mono font-bold uppercase border border-indigo-200">${projectBadge}</span>
                    </div>
                    <div class="text-sm font-semibold text-slate-900 truncate" title="${t.title}">${t.title}</div>
                  </td>
                  <td class="px-4 py-3.5 whitespace-nowrap">${typeBadge}</td>
                  <td class="px-4 py-3.5 whitespace-nowrap">${getTaskCategoryBadge(t.category, t.title)}</td>
                  ${showAssignee ? `
                    <td class="px-4 py-3.5 whitespace-nowrap">
                      <div onclick="switchManagerDevHub('${dev ? dev.id : ''}')" class="flex items-center gap-2 cursor-pointer hover:text-blue-600 transition-colors">
                        <div class="w-6 h-6 rounded-md bg-slate-100 border border-slate-200 font-mono font-bold text-xs flex items-center justify-center text-slate-700">${dev ? dev.initials : '??'}</div>
                        <span class="text-xs font-semibold text-slate-800">${dev ? dev.name : 'Unassigned'}</span>
                      </div>
                    </td>
                  ` : ''}
                  <td class="px-4 py-3.5 whitespace-nowrap">${priBadge}</td>
                  <td class="px-4 py-3.5 whitespace-nowrap font-mono text-slate-700 text-xs font-medium">${formattedDueDate}</td>
                  <td class="px-4 py-3.5 w-40">
                    <div class="font-mono text-xs text-slate-700 mb-1.5 flex justify-between">
                      <span><strong>${cleanHours(t.loggedHours)}h</strong> / ${cleanHours(t.estimatedHours)}h</span>
                      <span class="font-bold ${isDone ? 'text-emerald-600' : 'text-blue-600'}">${pct}%</span>
                    </div>
                    <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div class="h-full rounded-full ${isDone ? 'bg-emerald-500' : 'bg-blue-500'}" style="width:${pct}%"></div>
                    </div>
                  </td>
                  <td class="px-4 py-3.5 whitespace-nowrap">${statusBadge}</td>
                  <td class="px-4 py-3.5 text-right whitespace-nowrap">
                    ${(showAssignee || state.currentRole === 'manager') ? `
                      <button onclick="openAssignModalWithDev('${t.assignedTo}')" class="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors" title="Reassign Task">
                        Reassign
                      </button>
                    ` : `
                      <div class="flex items-center justify-end gap-1.5">
                        <button onclick="openTaskLogDrawer('${t.id}')" class="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors">
                          Logs (${(WORK_LOGS.filter(l => l.taskId === t.id)).length})
                        </button>
                        ${!isDone ? `
                          <button onclick="openLogTimeModal('${t.id}')" class="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors">
                            + Log
                          </button>
                        ` : ''}
                      </div>
                    `}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderManagerDevTaskBoard(dev) {
  const container = document.getElementById('mgr-dev-task-board-container');
  const filterPills = document.getElementById('mgr-dev-task-filter-pills');
  const categoryTabs = document.getElementById('mgr-dev-task-category-tabs');
  const filterBanner = document.getElementById('mgr-dev-task-filter-banner');
  if (!container) return;

  const allDevTasks = TASKS.filter(t => t.assignedTo === dev.id);
  const activeTypeFilter = state.managerDevTaskTypeFilter || 'ALL';

  // 1. Render Category Filter Tabs
  if (categoryTabs) {
    const tabs = [
      { id: 'ALL', label: 'All Tasks', count: allDevTasks.length, dot: 'bg-slate-400', color: 'slate' },
      { id: 'PROJECT_SPRINT', label: 'Pre-Planning', count: allDevTasks.filter(t => t.taskType === 'PROJECT_SPRINT').length, dot: 'bg-blue-500', color: 'blue' },
      { id: 'AD_HOC_EMERGENCY', label: 'Ad-Hoc', count: allDevTasks.filter(t => t.taskType === 'AD_HOC_EMERGENCY').length, dot: 'bg-amber-500', color: 'amber' },
      { id: 'RECURRING', label: 'Recurring', count: allDevTasks.filter(t => t.taskType === 'RECURRING').length, dot: 'bg-purple-500', color: 'purple' }
    ];

    categoryTabs.innerHTML = tabs.map(tab => {
      const isActive = activeTypeFilter === tab.id;
      return `
        <button onclick="setManagerDevTaskTypeFilter('${tab.id}')"
          class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            isActive
              ? 'bg-blue-50 text-blue-700 border border-blue-300 font-bold shadow-sm ring-1 ring-blue-200'
              : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
          }">
          <span class="w-2 h-2 rounded-full ${tab.dot}"></span>
          <span>${tab.label}</span>
          <span class="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold ${
            isActive ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-600'
          }">${tab.count}</span>
        </button>
      `;
    }).join('');
  }

  // 2. Filter tasks by Workload Type
  let devTasks = allDevTasks;
  if (activeTypeFilter !== 'ALL') {
    devTasks = devTasks.filter(t => t.taskType === activeTypeFilter);
  }

  // 3. Render Active Filter Notice Banner
  if (filterBanner) {
    if (activeTypeFilter !== 'ALL') {
      const typeMeta = {
        PROJECT_SPRINT: { name: 'Pre-Planning', bg: 'bg-blue-500', border: 'border-blue-200' },
        AD_HOC_EMERGENCY: { name: 'Ad-Hoc Emergency', bg: 'bg-amber-500', border: 'border-amber-200' },
        RECURRING: { name: 'Recurring Routine', bg: 'bg-purple-500', border: 'border-purple-200' }
      }[activeTypeFilter] || { name: activeTypeFilter, bg: 'bg-blue-500', border: 'border-blue-200' };

      const totalFilteredHours = devTasks.reduce((s, t) => s + (t.estimatedHours || 0), 0);

      filterBanner.className = 'p-3 rounded-2xl bg-blue-50/90 border border-blue-200 flex items-center justify-between gap-3 text-xs text-blue-900 font-mono shadow-xs';
      filterBanner.innerHTML = `
        <div class="flex items-center gap-2.5 min-w-0">
          <span class="w-2.5 h-2.5 rounded-full ${typeMeta.bg} animate-pulse flex-shrink-0"></span>
          <span class="truncate">Filtering workload: <strong class="font-bold underline">${typeMeta.name}</strong> (${devTasks.length} tasks · ${totalFilteredHours.toFixed(1)}h total)</span>
        </div>
        <button onclick="setManagerDevTaskTypeFilter('ALL')" class="px-2.5 py-1 rounded-lg bg-white hover:bg-blue-100 text-blue-700 font-bold border border-blue-200 transition-all flex items-center gap-1 text-xs flex-shrink-0 shadow-xs">
          <i class="fa-solid fa-xmark"></i> Show All Tasks
        </button>
      `;
    } else {
      filterBanner.className = 'hidden';
      filterBanner.innerHTML = '';
    }
  }

  const viewMode = state.managerDevTaskViewMode || 'board';

  // 1. KANBAN BOARD VIEW (Default 4-Stage Workflow Columns)
  if (viewMode === 'board') {
    if (filterPills) filterPills.innerHTML = ''; // Not needed in board view since all 4 stages are on-screen

    const todoTasks = devTasks.filter(t => t.status === 'TO_DO');
    const inProgTasks = devTasks.filter(t => t.status === 'IN_PROGRESS');
    const pendingTasks = devTasks.filter(t => t.status === 'PENDING_REVIEW' || t.status === 'PENDING_ACCEPTANCE');
    const doneTasks = devTasks.filter(t => t.status === 'COMPLETED');

    const todoH = todoTasks.reduce((s, t) => s + t.estimatedHours, 0);
    const inProgH = inProgTasks.reduce((s, t) => s + t.estimatedHours, 0);
    const pendingH = pendingTasks.reduce((s, t) => s + t.estimatedHours, 0);
    const doneH = doneTasks.reduce((s, t) => s + (t.loggedHours || t.estimatedHours), 0);

    const col1 = renderKanbanColumnHtml(
      'To Do',
      '<span class="w-2.5 h-2.5 rounded-full bg-slate-400"></span>',
      { border: 'border-slate-200/80', bg: 'bg-slate-50/50', divider: 'border-slate-200/60', badge: 'bg-slate-100 text-slate-700' },
      todoTasks.length,
      todoH,
      todoTasks.map(t => renderKanbanCardHtml(t, false)).join(''),
      'TO_DO'
    );

    const col2 = renderKanbanColumnHtml(
      'In Progress',
      '<span class="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>',
      { border: 'border-blue-200/80', bg: 'bg-blue-50/30', divider: 'border-blue-200/60', badge: 'bg-blue-100 text-blue-800' },
      inProgTasks.length,
      inProgH,
      inProgTasks.map(t => renderKanbanCardHtml(t, false)).join('')
    );

    const col3 = renderKanbanColumnHtml(
      'Pending Review',
      '<span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>',
      { border: 'border-amber-200/80', bg: 'bg-amber-50/30', divider: 'border-amber-200/60', badge: 'bg-amber-100 text-amber-800' },
      pendingTasks.length,
      pendingH,
      pendingTasks.map(t => renderKanbanCardHtml(t, false)).join(''),
      'PENDING_REVIEW'
    );

    const col4 = renderKanbanColumnHtml(
      'Completed',
      '<span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>',
      { border: 'border-emerald-200/80', bg: 'bg-emerald-50/30', divider: 'border-emerald-200/60', badge: 'bg-emerald-100 text-emerald-800' },
      doneTasks.length,
      doneH,
      doneTasks.map(t => renderKanbanCardHtml(t, false)).join('')
    );

    container.className = 'kanban-board-container';
    container.innerHTML = col1 + col2 + col3 + col4;
    return;
  }

  // 2. LIST MATRIX TABLE VIEW
  if (viewMode === 'list') {
    if (filterPills) {
      const allCount = devTasks.length;
      const inProgressCount = devTasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'TO_DO').length;
      const pendingCount = devTasks.filter(t => t.status === 'PENDING_REVIEW' || t.status === 'PENDING_ACCEPTANCE').length;
      const doneCount = devTasks.filter(t => t.status === 'COMPLETED').length;
      const filters = [
        { id: 'ALL', label: 'All', count: allCount },
        { id: 'IN_PROGRESS', label: 'Active', count: inProgressCount },
        { id: 'PENDING', label: 'Pending', count: pendingCount },
        { id: 'COMPLETED', label: 'Done', count: doneCount }
      ];
      filterPills.innerHTML = filters.map(f => {
        const isActive = state.managerDevTaskFilter === f.id;
        return `
          <button onclick="setManagerDevTaskFilter('${f.id}')"
            class="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              isActive ? 'bg-blue-50 text-blue-700 border border-blue-200 font-bold' : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
            }">
            ${f.label} <span class="font-mono text-[10px] opacity-75">(${f.count})</span>
          </button>
        `;
      }).join('');
    }

    const filteredTasks = devTasks.filter(t => {
      if (state.managerDevTaskFilter === 'ALL') return true;
      if (state.managerDevTaskFilter === 'IN_PROGRESS') return t.status === 'IN_PROGRESS' || t.status === 'TO_DO';
      if (state.managerDevTaskFilter === 'PENDING') return t.status === 'PENDING_REVIEW' || t.status === 'PENDING_ACCEPTANCE';
      if (state.managerDevTaskFilter === 'COMPLETED') return t.status === 'COMPLETED';
      return true;
    });

    container.className = 'w-full';
    container.innerHTML = renderTaskMatrixTableHtml(filteredTasks, false);
    return;
  }

  // 3. GRID / CARD VIEW
  if (viewMode === 'grid') {
    const allCount = devTasks.length;
    const inProgressCount = devTasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'TO_DO').length;
    const pendingCount = devTasks.filter(t => t.status === 'PENDING_REVIEW' || t.status === 'PENDING_ACCEPTANCE').length;
    const doneCount = devTasks.filter(t => t.status === 'COMPLETED').length;

    if (filterPills) {
      const filters = [
        { id: 'ALL', label: 'All Tasks', count: allCount },
        { id: 'IN_PROGRESS', label: 'In Progress', count: inProgressCount },
        { id: 'PENDING', label: 'Pending Review', count: pendingCount },
        { id: 'COMPLETED', label: 'Completed', count: doneCount }
      ];
      filterPills.innerHTML = filters.map(f => {
        const isActive = state.managerDevTaskFilter === f.id;
        return `
          <button onclick="setManagerDevTaskFilter('${f.id}')"
            class="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              isActive ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm' : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
            }">
            ${f.label} <span class="font-mono text-[10px] ml-1 opacity-75">(${f.count})</span>
          </button>
        `;
      }).join('');
    }

    const filteredTasks = devTasks.filter(t => {
      if (state.managerDevTaskFilter === 'ALL') return true;
      if (state.managerDevTaskFilter === 'IN_PROGRESS') return t.status === 'IN_PROGRESS' || t.status === 'TO_DO';
      if (state.managerDevTaskFilter === 'PENDING') return t.status === 'PENDING_REVIEW' || t.status === 'PENDING_ACCEPTANCE';
      if (state.managerDevTaskFilter === 'COMPLETED') return t.status === 'COMPLETED';
      return true;
    });

    if (!filteredTasks.length) {
      container.className = 'w-full';
      container.innerHTML = `<div class="py-10 text-center text-slate-400 font-mono text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">No tasks in this status for ${dev.name}.</div>`;
      return;
    }

    container.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';
    container.innerHTML = filteredTasks.map(t => renderKanbanCardHtml(t, false)).join('');
  }
}

function renderManagerDevWorkLogs(dev) {
  const container = document.getElementById('mgr-dev-worklogs-container');
  if (!container) return;

  const devLogs = WORK_LOGS.filter(l => l.developerId === dev.id);

  if (!devLogs.length) {
    container.innerHTML = `<div class="p-8 text-center text-slate-400 font-mono text-xs bg-slate-50 rounded-2xl border border-slate-100">No work logs recorded yet for ${dev.name}.</div>`;
    return;
  }

  container.innerHTML = devLogs.map(l => `
    <div class="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50 transition-all space-y-2 shadow-xs">
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-2 min-w-0">
          <span class="px-2 py-0.5 rounded-md bg-white text-indigo-700 text-[10px] font-mono font-bold uppercase border border-indigo-200 flex-shrink-0">${l.clientCode || 'TASK'}</span>
          <span class="text-xs font-bold text-slate-900 truncate">${l.taskTitle}</span>
        </div>
        <div class="flex items-center gap-2 flex-shrink-0">
          <span class="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            +${l.hours}h logged
          </span>
          <button onclick="openTaskLogDrawer('${l.taskId}')" class="px-2.5 py-1 rounded-lg bg-white hover:bg-indigo-50 text-indigo-600 text-[11px] font-bold border border-slate-200 hover:border-indigo-200 transition-all flex items-center gap-1 shadow-xs">
            <i class="fa-solid fa-clock-rotate-left text-[10px]"></i> View Log
          </button>
        </div>
      </div>
      <p class="text-xs text-slate-600 pl-3 border-l-2 border-indigo-400 italic font-sans leading-relaxed">"${l.notes}"</p>
      <div class="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-100">
        <span>Recorded by <strong class="text-slate-600 font-semibold">${dev.name}</strong></span>
        <span><i class="fa-regular fa-clock mr-1 text-slate-300"></i>${l.timestamp}</span>
      </div>
    </div>
  `).join('');
}

function openAssignModalWithCurrentDev() {
  openAssignModalWithDev(state.currentManagerDevId);
}



// ═══════════════════════════════════════════════════════════
// MANAGER: DATE & SCHEDULE TASK DISPATCHER HUB
// ═══════════════════════════════════════════════════════════

const SPRINT_DATE_PRESETS = [
  { id: '2026-09-01', label: 'Yesterday (Sep 1)', formatted: 'Sep 1, 2026' },
  { id: '2026-09-02', label: 'Today (Sep 2)', formatted: 'Sep 2, 2026', isToday: true },
  { id: '2026-09-03', label: 'Tomorrow (Sep 3)', formatted: 'Sep 3, 2026' },
  { id: '2026-09-04', label: 'Thu (Sep 4)', formatted: 'Sep 4, 2026' },
  { id: '2026-09-05', label: 'Fri (Sep 5)', formatted: 'Sep 5, 2026' },
  { id: '2026-09-08', label: 'Next Mon (Sep 8)', formatted: 'Sep 8, 2026' },
  { id: 'ALL', label: 'All Dates', formatted: 'All Upcoming Dates' }
];

function switchManagerDateViewMode(mode) {
  state.managerDateViewMode = mode;
  const btnGrouped = document.getElementById('mgr-date-view-btn-grouped');
  const btnMatrix = document.getElementById('mgr-date-view-btn-matrix');
  const activeClass = 'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all bg-white text-slate-900 shadow-sm flex items-center gap-1.5';
  const inactiveClass = 'px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-slate-600 hover:text-slate-900 flex items-center gap-1.5';
  if (btnGrouped && btnMatrix) {
    btnGrouped.className = mode === 'grouped' ? activeClass : inactiveClass;
    btnMatrix.className = mode === 'matrix' ? activeClass : inactiveClass;
  }
  renderManagerDateScheduleResults();
}

function selectManagerQuickDate(dateId) {
  state.managerSelectedDate = dateId;
  const dateInput = document.getElementById('mgr-schedule-date-input');
  if (dateInput && dateId !== 'ALL') {
    dateInput.value = dateId;
  }
  renderManagerDateScheduleHub();
}

function onManagerDateScheduleChange(dateValue) {
  if (!dateValue) return;
  state.managerSelectedDate = dateValue;
  renderManagerDateScheduleHub();
}

function onManagerScheduleSearchInput(query) {
  state.managerDateSearchQuery = query.toLowerCase().trim();
  renderManagerDateScheduleResults();
}

function onManagerScheduleSquadFilterChange(squadId) {
  state.managerDateSquadFilter = squadId;
  renderManagerDateScheduleResults();
}

function setManagerScheduleStatusFilter(status) {
  state.managerDateStatusFilter = status;
  renderManagerDateScheduleHub();
}

function isTaskMatchingDate(task, dateId) {
  if (dateId === 'ALL') return true;

  let targetYear = null, targetMonth = null, targetDay = null;
  let targetFormatted = '';
  let targetShort = '';

  try {
    const parts = dateId.split('-');
    if (parts.length === 3) {
      targetYear = parseInt(parts[0]);
      targetMonth = parseInt(parts[1]) - 1;
      targetDay = parseInt(parts[2]);
      const d = new Date(targetYear, targetMonth, targetDay);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      targetFormatted = `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
      targetShort = `${months[d.getMonth()]} ${d.getDate()}`;
    }
  } catch (e) {}

  const targetDateObj = (targetYear !== null) ? new Date(targetYear, targetMonth, targetDay) : null;

  function parseDate(str) {
    if (!str) return null;
    const clean = str.replace(/\s·.*/, '').replace(/\s\(.*\)/, '').trim();
    const d = new Date(clean);
    return isNaN(d.getTime()) ? null : d;
  }

  const assignedDate = parseDate(task.assignedAt);
  const dueDate = parseDate(task.dueDate);

  // 1. Direct text search match on assignedAt, dueDate, or completedAt
  if (targetFormatted || targetShort) {
    const matchStr = (val) => val && (val.includes(targetFormatted) || (targetShort && val.includes(targetShort)));
    if (matchStr(task.assignedAt) || matchStr(task.dueDate) || matchStr(task.completedAt)) {
      return true;
    }
  }

  // 2. Date span check: active if targetDate is between assignedDate and dueDate
  if (targetDateObj && assignedDate && dueDate) {
    const targetTime = new Date(targetDateObj.getFullYear(), targetDateObj.getMonth(), targetDateObj.getDate()).getTime();
    const assignedTime = new Date(assignedDate.getFullYear(), assignedDate.getMonth(), assignedDate.getDate()).getTime();
    const dueTime = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate()).getTime();

    if (targetTime >= assignedTime && targetTime <= dueTime) {
      return true;
    }
  }

  return false;
}

function getFilteredDateTasks() {
  const selectedDate = state.managerSelectedDate;
  const sq = state.managerDateSquadFilter;
  const stat = state.managerDateStatusFilter;
  const q = state.managerDateSearchQuery;

  return TASKS.filter(task => {
    // 1. Date filter
    if (!isTaskMatchingDate(task, selectedDate)) return false;

    // 2. Developer & Squad filter
    const dev = DEVELOPERS.find(d => d.id === task.assignedTo);
    if (sq !== 'all') {
      if (!dev || dev.squadId !== sq) return false;
    }

    // 3. Status filter
    if (stat === 'IN_PROGRESS' && task.status !== 'IN_PROGRESS' && task.status !== 'TO_DO') return false;
    if (stat === 'PENDING' && task.status !== 'PENDING_REVIEW' && task.status !== 'PENDING_ACCEPTANCE') return false;
    if (stat === 'COMPLETED' && task.status !== 'COMPLETED') return false;

    // 4. Keyword search
    if (q) {
      const devName = dev ? dev.name.toLowerCase() : '';
      const devRole = dev ? dev.role.toLowerCase() : '';
      const title = task.title.toLowerCase();
      const cl = CLIENTS.find(c => c.id === task.clientId);
      const clName = cl ? cl.name.toLowerCase() : '';
      const clCode = cl ? cl.code.toLowerCase() : '';
      if (!title.includes(q) && !devName.includes(q) && !devRole.includes(q) && !clName.includes(q) && !clCode.includes(q)) {
        return false;
      }
    }

    return true;
  });
}

function renderManagerDateScheduleHub() {
  renderManagerDateQuickPills();
  renderManagerDateSquadFilterDropdown();
  renderManagerDateStatusPills();
  renderManagerDateSummaryKPIs();
  renderManagerDateScheduleResults();
}

function renderManagerDateQuickPills() {
  const container = document.getElementById('mgr-date-quick-pills');
  if (!container) return;

  container.innerHTML = SPRINT_DATE_PRESETS.map(preset => {
    const isActive = state.managerSelectedDate === preset.id;
    return `
      <button onclick="selectManagerQuickDate('${preset.id}')"
        class="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 flex-shrink-0 ${
          isActive
            ? 'bg-slate-900 text-white shadow-xs'
            : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/70 font-medium'
        }">
        ${preset.isToday ? '<span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>' : ''}
        <span>${preset.label}</span>
      </button>
    `;
  }).join('');
}

function renderManagerDateSquadFilterDropdown() {
  const sel = document.getElementById('mgr-schedule-squad-filter');
  if (!sel) return;

  sel.innerHTML = `
    <option value="all">All Squads (${SQUADS.length})</option>
    ${SQUADS.map(s => `<option value="${s.id}" ${state.managerDateSquadFilter === s.id ? 'selected' : ''}>${s.name.replace(/\s\(.*\)/, '')}</option>`).join('')}
  `;
}

function renderManagerDateStatusPills() {
  const container = document.getElementById('mgr-schedule-status-pills');
  if (!container) return;

  const currentTasks = TASKS.filter(t => isTaskMatchingDate(t, state.managerSelectedDate));
  const allCount = currentTasks.length;
  const inProgressCount = currentTasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'TO_DO').length;
  const pendingCount = currentTasks.filter(t => t.status === 'PENDING_REVIEW' || t.status === 'PENDING_ACCEPTANCE').length;
  const completedCount = currentTasks.filter(t => t.status === 'COMPLETED').length;

  const statuses = [
    { id: 'ALL', label: 'All', count: allCount },
    { id: 'IN_PROGRESS', label: 'In Progress', count: inProgressCount },
    { id: 'PENDING', label: 'Pending', count: pendingCount },
    { id: 'COMPLETED', label: 'Done', count: completedCount }
  ];

  container.innerHTML = statuses.map(s => {
    const isActive = state.managerDateStatusFilter === s.id;
    return `
      <button onclick="setManagerScheduleStatusFilter('${s.id}')"
        class="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
          isActive
            ? 'bg-slate-900 text-white shadow-2xs'
            : 'bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium'
        }">
        <span>${s.label}</span>
        <span class="text-[10px] opacity-75">(${s.count})</span>
      </button>
    `;
  }).join('');
}

function renderManagerDateSummaryKPIs() {
  const container = document.getElementById('mgr-date-summary-banner');
  if (!container) return;

  const matchedTasks = getFilteredDateTasks();
  const totalTasks = matchedTasks.length;
  const totalHours = matchedTasks.reduce((acc, t) => acc + t.estimatedHours, 0);
  const loggedHours = matchedTasks.reduce((acc, t) => acc + t.loggedHours, 0);

  // Unique working developers
  const devIds = new Set(matchedTasks.map(t => t.assignedTo));
  const doneTasks = matchedTasks.filter(t => t.status === 'COMPLETED').length;
  const compPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  // Date label
  let dateTitle = 'All Upcoming Dates';
  const foundPreset = SPRINT_DATE_PRESETS.find(p => p.id === state.managerSelectedDate);
  if (foundPreset) {
    dateTitle = foundPreset.formatted;
  } else if (state.managerSelectedDate !== 'ALL') {
    try {
      const parts = state.managerSelectedDate.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        dateTitle = d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
      }
    } catch (e) { dateTitle = state.managerSelectedDate; }
  }

  container.innerHTML = `
    <div class="kpi-card space-y-2.5">
      <div class="flex items-center justify-between">
        <span class="kpi-label">Date Selected</span>
        <span class="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center text-xs"><i class="fa-solid fa-calendar-check"></i></span>
      </div>
      <div class="font-bold text-base text-slate-900 truncate" title="${dateTitle}">${dateTitle}</div>
      <div class="text-xs text-slate-500 font-medium">${totalTasks} tasks on schedule</div>
    </div>

    <div class="kpi-card space-y-2.5">
      <div class="flex items-center justify-between">
        <span class="kpi-label">Scheduled Workload</span>
        <span class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs"><i class="fa-solid fa-clock"></i></span>
      </div>
      <div class="flex items-baseline gap-1.5">
        <span class="kpi-value text-slate-900">${totalHours.toFixed(1)}h</span>
      </div>
      <div class="text-xs text-slate-500 font-medium">${loggedHours.toFixed(1)}h logged so far</div>
    </div>

    <div class="kpi-card space-y-2.5">
      <div class="flex items-center justify-between">
        <span class="kpi-label">Assigned Engineers</span>
        <span class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs"><i class="fa-solid fa-users"></i></span>
      </div>
      <div class="flex items-baseline gap-1.5">
        <span class="kpi-value text-slate-900">${devIds.size}</span>
        <span class="text-xs text-slate-500 font-semibold">engineers</span>
      </div>
      <div class="text-xs text-slate-500 font-medium">active on this date</div>
    </div>

    <div class="kpi-card space-y-2.5">
      <div class="flex items-center justify-between">
        <span class="kpi-label text-emerald-700 font-bold">Delivery Progress</span>
        <span class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs"><i class="fa-solid fa-circle-check"></i></span>
      </div>
      <div class="flex items-baseline gap-1.5">
        <span class="kpi-value text-emerald-600">${compPct}%</span>
      </div>
      <div class="text-xs text-emerald-700 font-medium">${doneTasks} of ${totalTasks} completed</div>
    </div>
  `;
}

function renderManagerDateScheduleResults() {
  const container = document.getElementById('mgr-date-results-container');
  if (!container) return;

  const matchedTasks = getFilteredDateTasks();

  if (!matchedTasks.length) {
    container.innerHTML = `
      <div class="py-14 text-center bg-white rounded-2xl border border-dashed border-slate-200 space-y-3 p-6">
        <div class="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 mx-auto flex items-center justify-center text-xl shadow-sm">
          <i class="fa-solid fa-calendar-xmark"></i>
        </div>
        <h4 class="text-base font-bold text-slate-800">No Tasks Scheduled on this Date</h4>
        <p class="text-xs text-slate-500 max-w-md mx-auto">There are no tasks assigned or scheduled for the selected date matching your current filters. Pick another date above or assign a new task.</p>
        <button onclick="openAssignModal()" class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all">
          + Assign Task on this Date
        </button>
      </div>
    `;
    return;
  }

  // ── Mode 1: Group by Assigned Person (Developer-Centric) ──
  if (state.managerDateViewMode === 'grouped') {
    // Group tasks by developer ID
    const devMap = new Map();
    matchedTasks.forEach(t => {
      if (!devMap.has(t.assignedTo)) devMap.set(t.assignedTo, []);
      devMap.get(t.assignedTo).push(t);
    });

    let html = `
      <div class="flex items-center justify-between text-xs text-slate-500 pb-1">
        <span>Showing <strong>${devMap.size} Engineers</strong> with <strong>${matchedTasks.length} Assigned Tasks</strong></span>
        <button onclick="openAssignModal()" class="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1">
          <i class="fa-solid fa-plus text-[10px]"></i> Assign Another Task
        </button>
      </div>
      <div class="space-y-4">
    `;

    devMap.forEach((tasks, devId) => {
      const dev = DEVELOPERS.find(d => d.id === devId);
      const squad = dev ? SQUADS.find(s => s.id === dev.squadId) : null;
      const dayHours = tasks.reduce((sum, t) => sum + t.estimatedHours, 0);

      // Sort tasks chronologically by dueDate
      tasks.sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));

      html += `
        <div class="bg-white rounded-2xl border border-slate-200/90 shadow-card overflow-hidden">
          <!-- Developer Header Bar -->
          <div class="p-4 bg-slate-50/70 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <div onclick="switchManagerDevHub('${dev ? dev.id : ''}')"
                class="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs cursor-pointer hover:bg-slate-800 transition-colors flex-shrink-0">
                ${dev ? dev.initials : '??'}
              </div>
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <h4 onclick="switchManagerDevHub('${dev ? dev.id : ''}')"
                    class="text-sm font-bold text-slate-900 hover:text-blue-600 cursor-pointer transition-colors truncate">
                    ${dev ? dev.name : 'Unknown Developer'}
                  </h4>
                  ${squad ? getSquadPillBadgeHtml(squad, 'text-xs px-2.5 py-0.5') : ''}
                </div>
                <div class="text-xs text-slate-500 truncate">${dev ? dev.role : 'Engineer'}</div>
              </div>
            </div>

            <div class="flex items-center gap-2.5 self-end sm:self-auto">
              <span class="px-3 py-1 rounded-xl bg-white border border-slate-200/80 text-xs text-slate-700 font-medium shadow-2xs">
                <strong>${dayHours.toFixed(1)}h</strong> planned · ${tasks.length} tasks
              </span>
              <button onclick="switchManagerDevHub('${dev ? dev.id : ''}')"
                class="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 border border-slate-200/60">
                <i class="fa-solid fa-id-badge text-[11px] text-slate-400"></i> Profile
              </button>
            </div>
          </div>

          <!-- Tasks Assigned to this Developer on this Date -->
          <div class="p-2 sm:p-3 divide-y divide-slate-100">
            ${tasks.map(t => {
              const isDone = t.status === 'COMPLETED';
              const isPending = t.status === 'PENDING_REVIEW' || t.status === 'PENDING_ACCEPTANCE';
              const cleanTitle = t.title.replace(/^\[.*?\]\s*/, '');
              const cleanDueDate = formatShortDate(t.dueDate);
              const assignedBy = t.assignedBy ? t.assignedBy.replace(/\s\(.*\)/, '') : 'Marcus Vance';

              let statusPill = '';
              if (isDone) {
                statusPill = `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60"><i class="fa-solid fa-check text-[10px]"></i> Done</span>`;
              } else if (isPending) {
                statusPill = `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60"><i class="fa-regular fa-clock text-[10px]"></i> Review</span>`;
              } else {
                statusPill = `<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60"><span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span> In Progress</span>`;
              }

              return `
                <div class="p-3 hover:bg-slate-50/60 rounded-xl transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div class="space-y-1 flex-1 min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                      ${statusPill}
                      <span class="text-sm font-semibold text-slate-900 tracking-tight truncate">${cleanTitle}</span>
                      ${t.priority === 'P1_HIGH' ? '<span class="px-2.5 py-0.5 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/70">Urgent</span>' : ''}
                      ${t.taskType === 'RECURRING' ? '<span class="px-2.5 py-0.5 rounded-md text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">Routine</span>' : ''}
                    </div>
                    <div class="flex items-center gap-2 text-xs text-slate-500">
                      <span>Due <strong class="text-slate-700 font-medium">${cleanDueDate}</strong></span>
                      <span class="text-slate-300">•</span>
                      <span>Assigned by ${assignedBy}</span>
                      ${isDone && t.completedAt ? `<span class="text-slate-300">•</span><span class="text-emerald-700 font-medium">Completed on ${formatShortDate(t.completedAt)}</span>` : ''}
                    </div>
                  </div>

                  <div class="flex items-center gap-3 flex-shrink-0 self-end md:self-center">
                    <div class="text-right">
                      <span class="text-xs font-mono font-medium ${isDone ? 'text-emerald-700 bg-emerald-50 border-emerald-100' : 'text-slate-700 bg-slate-50 border-slate-200/80'} px-2.5 py-1 rounded-lg border inline-block">
                        <strong>${cleanHours(t.loggedHours)}h</strong> / ${cleanHours(t.estimatedHours)}h
                      </span>
                    </div>
                    <button onclick="openAssignModalWithDev('${dev ? dev.id : ''}')" title="Reassign Task"
                      class="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors border border-slate-200/70 shadow-2xs">
                      Reassign
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    });

    html += `</div>`;
    container.innerHTML = html;
    return;
  }

  // ── Mode 2: Detailed Task Matrix (List / Table View) ──
  container.innerHTML = `
    <div class="bg-white rounded-2xl border border-slate-200/90 shadow-card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-slate-200 bg-slate-50/80 text-xs font-bold text-slate-600 uppercase tracking-wider font-mono">
              <th class="px-5 py-3.5">Task & Project</th>
              <th class="px-4 py-3.5">Assigned Date</th>
              <th class="px-4 py-3.5">Due Date</th>
              <th class="px-4 py-3.5">Assignee</th>
              <th class="px-4 py-3.5">Squad</th>
              <th class="px-4 py-3.5">Priority</th>
              <th class="px-4 py-3.5">Logged</th>
              <th class="px-4 py-3.5">Status</th>
              <th class="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-xs">
            ${matchedTasks.map(t => {
              const dev = DEVELOPERS.find(d => d.id === t.assignedTo);
              const squad = dev ? SQUADS.find(s => s.id === dev.squadId) : (t.squadId ? SQUADS.find(s => s.id === t.squadId) : null);
              const isDone = t.status === 'COMPLETED';
              const isPending = t.status === 'PENDING_REVIEW' || t.status === 'PENDING_ACCEPTANCE';
              const cleanTitle = t.title.replace(/^\[.*?\]\s*/, '');
              const assignedDateStr = formatShortDate(t.assignedAt);
              const dueDateStr = formatShortDate(t.dueDate);

              let priBadge = '';
              if (t.priority === 'P1_HIGH') priBadge = '<span class="px-2.5 py-0.5 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/70">Urgent</span>';
              else if (t.priority === 'P2_MEDIUM') priBadge = '<span class="px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700">Standard</span>';
              else priBadge = '<span class="px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-50 text-slate-500">Low</span>';

              let statusBadge = '';
              if (isDone) statusBadge = '<span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">Done</span>';
              else if (isPending) statusBadge = '<span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">Review</span>';
              else statusBadge = '<span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">In Progress</span>';

              return `
                <tr class="hover:bg-slate-50/70 transition-colors">
                  <td class="px-5 py-3.5 max-w-xs">
                    <div class="font-semibold text-sm text-slate-900 truncate" title="${cleanTitle}">${cleanTitle}</div>
                  </td>

                  <td class="px-4 py-3.5 text-slate-600 whitespace-nowrap font-mono font-medium">${assignedDateStr}</td>
                  <td class="px-4 py-3.5 font-medium text-slate-800 whitespace-nowrap font-mono">${dueDateStr}</td>

                  <td class="px-4 py-3.5">
                    <div onclick="switchManagerDevHub('${dev ? dev.id : ''}')" class="flex items-center gap-2 cursor-pointer hover:text-blue-600 transition-colors">
                      <div class="w-6 h-6 rounded-lg bg-slate-900 text-white font-mono font-bold text-xs flex items-center justify-center flex-shrink-0">
                        ${dev ? dev.initials : '??'}
                      </div>
                      <span class="font-semibold text-xs text-slate-900 truncate">${dev ? dev.name : 'Unassigned'}</span>
                    </div>
                  </td>

                  <td class="px-4 py-3.5">
                    ${squad ? getSquadPillBadgeHtml(squad, 'text-xs px-2.5 py-0.5') : '<span class="text-slate-400">-</span>'}
                  </td>

                  <td class="px-4 py-3.5">${priBadge}</td>

                  <td class="px-4 py-3.5 font-mono text-xs text-slate-700">
                    <strong>${cleanHours(t.loggedHours)}h</strong> / ${cleanHours(t.estimatedHours)}h
                  </td>

                  <td class="px-4 py-3.5">${statusBadge}</td>

                  <td class="px-5 py-3.5 text-right">
                    <button onclick="openAssignModalWithDev('${dev ? dev.id : ''}')" title="Reassign Task"
                      class="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors">
                      Reassign
                    </button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}



// ═══════════════════════════════════════════════════════════
// MANAGER: TASK COMPLETION & BLOCKER INTELLIGENCE HUB
// ═══════════════════════════════════════════════════════════

function renderBlockersBadge() {
  const badge = document.getElementById('nav-badge-blockers');
  if (!badge) return;
  const count = TASKS.filter(t => t.isBlocked && t.status !== 'COMPLETED').length;
  badge.innerText = count;
}

function onBlockerSquadFilterChange(squadId) {
  state.managerBlockerSquadFilter = squadId;
  renderBlockersTab();
}

function onBlockerCategoryFilterChange(cat) {
  state.managerBlockerCategoryFilter = cat;
  renderBlockersTab();
}

function onBlockerSearchInput(val) {
  state.managerBlockerSearchQuery = (val || '').trim().toLowerCase();
  const clearBtn = document.getElementById('blockers-search-clear-btn');
  if (clearBtn) {
    if (state.managerBlockerSearchQuery) clearBtn.classList.remove('hidden');
    else clearBtn.classList.add('hidden');
  }
  renderBlockerDevCards();
}

function clearBlockerSearch() {
  const input = document.getElementById('blockers-search-input');
  if (input) input.value = '';
  state.managerBlockerSearchQuery = '';
  const clearBtn = document.getElementById('blockers-search-clear-btn');
  if (clearBtn) clearBtn.classList.add('hidden');
  renderBlockerDevCards();
}

function setBlockerViewMode(mode) {
  state.managerBlockerViewMode = mode;
  const btnMatrix = document.getElementById('blockers-view-btn-matrix');
  const btnCards = document.getElementById('blockers-view-btn-cards');
  const activeClass = 'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 bg-white text-slate-900 shadow-sm';
  const inactiveClass = 'px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 text-slate-600 hover:text-slate-900';
  if (btnMatrix) btnMatrix.className = mode === 'matrix' ? activeClass : inactiveClass;
  if (btnCards) btnCards.className = mode === 'cards' ? activeClass : inactiveClass;
  renderBlockerDevCards();
}

function setBlockerStatusFilter(status) {
  state.managerBlockerStatusFilter = status;
  renderBlockersTab();
}

function renderBlockersTab() {
  renderBlockersBadge();
  populateBlockerDropdowns();
  renderBlockerKPIs();
  renderBlockerStatusPills();
  renderBlockerDevCards();
}

function populateBlockerDropdowns() {
  const squadSelect = document.getElementById('blockers-squad-filter');
  if (squadSelect) {
    const curVal = state.managerBlockerSquadFilter || 'all';
    squadSelect.innerHTML = `
      <option value="all">All Squads (${SQUADS.length})</option>
      ${SQUADS.map(s => `<option value="${s.id}" ${s.id === curVal ? 'selected' : ''}>${s.name.replace(/\s\(.*\)/, '')}</option>`).join('')}
    `;
  }
}

function renderBlockerKPIs() {
  const container = document.getElementById('blockers-kpi-container');
  if (!container) return;

  const incompleteTasks = TASKS.filter(t => t.status !== 'COMPLETED');
  const blockedTasks = incompleteTasks.filter(t => t.isBlocked);
  const criticalTasks = blockedTasks.filter(t => t.blockerSeverity === 'CRITICAL_BLOCKER' || t.blockerSeverity === 'HIGH');
  const riskTasks = blockedTasks.filter(t => t.blockerSeverity === 'HIGH_DELIVERY_RISK' || t.blockerSeverity === 'MEDIUM');
  const hoursAtRisk = cleanHours(blockedTasks.reduce((s, t) => s + (t.estimatedHours || 0), 0));
  const resolvedCount = 8; // Resolved deliverables this sprint

  container.innerHTML = `
    <!-- KPI 1: Critical Blockers -->
    <div class="kpi-card space-y-2.5">
      <div class="flex items-center justify-between">
        <span class="kpi-label text-rose-600 font-bold">Critical Blockers</span>
        <span class="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center text-xs"><i class="fa-solid fa-triangle-exclamation"></i></span>
      </div>
      <div class="flex items-baseline gap-1.5">
        <span class="kpi-value text-rose-600 font-bold">${criticalTasks.length}</span>
        <span class="text-xs text-rose-500 font-medium">immediate action</span>
      </div>
      <div class="text-xs text-rose-600 font-medium flex items-center gap-1.5">
        <i class="fa-solid fa-circle-exclamation text-[11px]"></i> Escalation required
      </div>
    </div>

    <!-- KPI 2: Delivery Risks -->
    <div class="kpi-card space-y-2.5">
      <div class="flex items-center justify-between">
        <span class="kpi-label text-amber-600 font-bold">Delivery Risks</span>
        <span class="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-xs"><i class="fa-solid fa-shield-halved"></i></span>
      </div>
      <div class="flex items-baseline gap-1.5">
        <span class="kpi-value text-amber-600 font-bold">${riskTasks.length}</span>
        <span class="text-xs text-amber-600 font-medium">under monitoring</span>
      </div>
      <div class="text-xs text-slate-500 font-medium">Active contingency plan</div>
    </div>

    <!-- KPI 3: Impacted Sprint Hours -->
    <div class="kpi-card space-y-2.5">
      <div class="flex items-center justify-between">
        <span class="kpi-label">Hours at Risk</span>
        <span class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs"><i class="fa-solid fa-clock"></i></span>
      </div>
      <div class="flex items-baseline gap-1.5">
        <span class="kpi-value text-slate-900">${hoursAtRisk}h</span>
        <span class="text-xs text-slate-400">budget</span>
      </div>
      <div class="text-xs text-slate-500 font-medium">Across blocked workstreams</div>
    </div>

    <!-- KPI 4: Unblocked & Resolved -->
    <div class="kpi-card space-y-2.5">
      <div class="flex items-center justify-between">
        <span class="kpi-label text-emerald-600 font-bold">Resolved Deliverables</span>
        <span class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs"><i class="fa-solid fa-circle-check"></i></span>
      </div>
      <div class="flex items-baseline gap-1.5">
        <span class="kpi-value text-emerald-600 font-bold">${resolvedCount}</span>
        <span class="text-xs text-emerald-600 font-medium">milestones</span>
      </div>
      <div class="text-xs text-emerald-600 font-medium">Deliverables on track</div>
    </div>
  `;
}

function formatShortDate(val) {
  if (!val) return 'Sep 5, 2026';
  if (typeof val === 'string') {
    if (val.includes('·')) {
      return val.split('·')[0].trim();
    }
    if (/^\d{4}-\d{2}-\d{2}/.test(val)) {
      try {
        const parts = val.split('T')[0].split('-');
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        if (!isNaN(d.getTime())) {
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
        }
      } catch (e) {}
    }
    return val;
  }
  return 'Sep 5, 2026';
}

function renderBlockerStatusPills() {
  const container = document.getElementById('blockers-quick-status-pills');
  if (!container) return;

  const incompleteTasks = TASKS.filter(t => t.status !== 'COMPLETED');
  const blockedTasks = incompleteTasks.filter(t => t.isBlocked);
  const criticalCount = blockedTasks.filter(t => t.blockerSeverity === 'CRITICAL_BLOCKER' || t.blockerSeverity === 'HIGH').length;
  const riskCount = blockedTasks.filter(t => t.blockerSeverity === 'HIGH_DELIVERY_RISK' || t.blockerSeverity === 'MEDIUM').length;

  const cur = state.managerBlockerStatusFilter || 'ALL_BLOCKED';
  const pills = [
    { id: 'ALL_BLOCKED', label: 'Active Blockers', count: blockedTasks.length },
    { id: 'CRITICAL', label: 'Critical', count: criticalCount },
    { id: 'RISKS', label: 'High Risk', count: riskCount },
    { id: 'ALL_TASKS', label: 'All Tasks', count: TASKS.length }
  ];

  container.innerHTML = pills.map(p => {
    const isActive = cur === p.id;
    return `
      <button onclick="setBlockerStatusFilter('${p.id}')"
        class="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
          isActive
            ? 'bg-slate-900 text-white shadow-xs'
            : 'bg-slate-100/90 hover:bg-slate-200/80 text-slate-600 font-medium'
        }">
        <span>${p.label}</span>
        <span class="text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
          isActive ? 'bg-white/20 text-white' : 'bg-white text-slate-500 border border-slate-200/80 shadow-2xs'
        }">${p.count}</span>
      </button>
    `;
  }).join('');
}

function toggleBlockerExpand(taskId) {
  if (!state.expandedBlockerIds) {
    state.expandedBlockerIds = new Set();
  }
  if (state.expandedBlockerIds.has(taskId)) {
    state.expandedBlockerIds.delete(taskId);
  } else {
    state.expandedBlockerIds.add(taskId);
  }
  renderBlockerDevCards();
}

function renderBlockerDevCards() {
  const container = document.getElementById('blockers-dev-cards-container');
  if (!container) return;

  const sq = state.managerBlockerSquadFilter || 'all';
  const cat = state.managerBlockerCategoryFilter || 'all';
  const stat = state.managerBlockerStatusFilter || 'ALL_BLOCKED';
  const q = state.managerBlockerSearchQuery || '';
  const viewMode = state.managerBlockerViewMode || 'matrix';

  let candidateTasks = TASKS.slice();

  if (stat === 'ALL_BLOCKED') {
    candidateTasks = candidateTasks.filter(t => t.isBlocked && t.status !== 'COMPLETED');
  } else if (stat === 'CRITICAL') {
    candidateTasks = candidateTasks.filter(t => t.isBlocked && t.blockerSeverity === 'HIGH' && t.status !== 'COMPLETED');
  } else if (stat === 'RISKS') {
    candidateTasks = candidateTasks.filter(t => t.isBlocked && t.blockerSeverity !== 'HIGH' && t.status !== 'COMPLETED');
  }

  if (sq !== 'all') {
    candidateTasks = candidateTasks.filter(t => {
      const dev = DEVELOPERS.find(d => d.id === t.assignedTo);
      return (dev && dev.squadId === sq) || t.squadId === sq;
    });
  }

  if (cat !== 'all') {
    candidateTasks = candidateTasks.filter(t => t.blockerCategory === cat);
  }

  if (q) {
    candidateTasks = candidateTasks.filter(t => {
      const dev = DEVELOPERS.find(d => d.id === t.assignedTo);
      const squad = dev ? SQUADS.find(s => s.id === dev.squadId) : null;
      const titleMatch = t.title.toLowerCase().includes(q);
      const reasonMatch = (t.incompleteReason || '').toLowerCase().includes(q);
      const impactMatch = (t.blockerImpact || '').toLowerCase().includes(q);
      const mitMatch = (t.mitigationAction || '').toLowerCase().includes(q);
      const devMatch = dev ? dev.name.toLowerCase().includes(q) : false;
      const squadMatch = squad ? squad.name.toLowerCase().includes(q) : false;
      return titleMatch || reasonMatch || impactMatch || mitMatch || devMatch || squadMatch;
    });
  }

  if (candidateTasks.length === 0) {
    container.innerHTML = `
      <div class="empty-state bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-card space-y-3">
        <div class="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl mx-auto border border-emerald-100 shadow-sm">
          <i class="fa-solid fa-circle-check"></i>
        </div>
        <h4 class="font-bold text-slate-800 text-base">🎉 All Clear! Zero Active Blockers</h4>
        <p class="text-xs text-slate-500 max-w-sm mx-auto font-mono">No tasks match the active filters. All sprint workstreams are proceeding on schedule without impediments.</p>
        <div class="pt-2">
          <button onclick="setBlockerStatusFilter('ALL_TASKS')" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors">
            View All Sprint Tasks
          </button>
        </div>
      </div>
    `;
    return;
  }

  // 1. ACTION MATRIX TABLE VIEW (Simple & Clean Before Dropdown, Full Details After Dropdown)
  if (viewMode === 'matrix') {
    container.innerHTML = `
      <div class="bg-white rounded-2xl border border-slate-200/90 shadow-card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                <th class="px-5 py-3.5 whitespace-nowrap w-32">Severity</th>
                <th class="px-5 py-3.5">Blocker & Project Name</th>
                <th class="px-5 py-3.5 text-right whitespace-nowrap w-40">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-xs">
              ${candidateTasks.map(t => {
                const dev = DEVELOPERS.find(d => d.id === t.assignedTo);
                const squad = dev ? SQUADS.find(s => s.id === dev.squadId) : null;
                const isCritical = t.blockerSeverity === 'HIGH';
                const isBlocked = t.isBlocked;
                const isExpanded = state.expandedBlockerIds && state.expandedBlockerIds.has(t.id);
                const projectBadge = squad ? (squad.projectCode || 'PROJECT') : 'PROJECT';
                const squadName = squad ? getSquadShortName(squad) : 'Engineering';
                const fullSquadName = squad ? squad.name : 'Engineering Squad';
                const impactText = t.blockerImpact || (isCritical ? '+2.5h delay' : 'Minor timeline risk');
                const mitText = t.mitigationAction || 'Manager follow-up active';
                const targetDateFormatted = formatShortDate(t.expectedResolutionDate || t.dueDate);

                return `
                  <!-- Simple Clean Row (Before Dropdown: Just Blocker & Project Name) -->
                  <tr class="hover:bg-slate-50/80 transition-colors group cursor-pointer ${
                    isExpanded ? 'bg-indigo-50/20' : (isBlocked && isCritical ? 'bg-rose-50/10' : '')
                  }" onclick="if (!event.target.closest('button') && !event.target.closest('select') && !event.target.closest('a')) toggleBlockerExpand('${t.id}')">
                    
                    <!-- Severity -->
                    <td class="px-5 py-3.5 whitespace-nowrap align-middle">
                      ${isBlocked ? (
                        isCritical 
                          ? '<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200/80 shadow-2xs"><span class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span> Critical</span>'
                          : '<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80 shadow-2xs"><span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span> High Risk</span>'
                      ) : '<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> On Track</span>'}
                    </td>

                    <!-- Blocker & Project Name (Simple, Neat & Clean) -->
                    <td class="px-5 py-3.5 align-middle">
                      <div class="flex items-center gap-2 flex-wrap">
                        <span class="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-mono font-bold uppercase border border-indigo-100">${projectBadge}</span>
                        <span class="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">${t.title}</span>
                        <span class="text-xs text-slate-400 font-medium">· ${squadName}</span>
                      </div>
                    </td>

                    <!-- Dropdown Toggle & Quick Action Icons -->
                    <td class="px-5 py-3.5 text-right whitespace-nowrap align-middle">
                      <div class="flex items-center justify-end gap-1.5" onclick="event.stopPropagation()">
                        ${isBlocked ? `
                          <button onclick="resolveBlocker('${t.id}')"
                            class="w-8 h-8 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200/90 hover:border-emerald-600 transition-all flex items-center justify-center shadow-2xs group cursor-pointer"
                            title="Resolve Blocker">
                            <i class="fa-solid fa-check text-xs transition-transform group-hover:scale-110"></i>
                          </button>
                        ` : ''}
                        <button onclick="toggleBlockerExpand('${t.id}')"
                          class="w-8 h-8 rounded-xl ${isExpanded ? 'bg-indigo-600 text-white shadow-xs border border-indigo-600' : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200/80 shadow-2xs'} transition-all flex items-center justify-center cursor-pointer"
                          title="${isExpanded ? 'Collapse details' : 'Show full blocker details'}">
                          <i class="fa-solid fa-chevron-down text-xs transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}"></i>
                        </button>
                      </div>
                    </td>
                  </tr>

                  <!-- Expanded Dropdown Section (Exact Full Details Matching Current Screenshot) -->
                  ${isExpanded ? `
                    <tr class="bg-slate-50/70 border-b border-slate-200/80">
                      <td colspan="3" class="px-5 py-4">
                        <div class="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
                          
                          <div class="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                            
                            <!-- 1. Task & Workstream -->
                            <div class="md:col-span-3 space-y-1.5">
                              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Task & Workstream</div>
                              <div class="space-y-0.5">
                                <div class="flex items-center gap-1.5 flex-wrap">
                                  <span class="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-mono font-bold uppercase border border-indigo-100">${projectBadge}</span>
                                  <span class="text-xs text-slate-500 font-medium">${fullSquadName}</span>
                                </div>
                                <div class="font-bold text-slate-900 text-sm leading-snug pt-0.5">${t.title}</div>
                              </div>
                            </div>

                            <!-- 2. Assignee -->
                            <div class="md:col-span-2 space-y-1.5">
                              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Assignee</div>
                              ${dev ? `
                                <div onclick="switchManagerDevHub('${dev.id}')" class="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity" title="View 360° Developer Dashboard">
                                  <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-100 to-slate-200 border border-slate-200 font-mono font-bold text-xs flex items-center justify-center text-slate-700 shadow-2xs">${dev.initials}</div>
                                  <div>
                                    <span class="font-bold text-slate-800 text-xs block leading-tight">${dev.name}</span>
                                    <span class="text-[10px] text-slate-400 font-medium leading-tight">${dev.role ? dev.role.split(' ')[0] : 'Engineer'}</span>
                                  </div>
                                </div>
                              ` : '<span class="text-slate-400 text-xs">Unassigned</span>'}
                            </div>

                            <!-- 3. Impediment & Mitigation (Exact layout from screenshot) -->
                            <div class="md:col-span-4 space-y-2">
                              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Impediment & Mitigation</div>
                              ${isBlocked ? `
                                <div class="text-slate-900 font-semibold text-xs leading-relaxed">
                                  ${t.incompleteReason || 'Blocker reported by team.'}
                                </div>
                                <div class="flex flex-col gap-1.5 pt-0.5">
                                  <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 text-slate-700 font-medium border border-slate-200/80 text-[11px] self-start">
                                    <i class="fa-solid fa-shield-halved text-blue-500 text-[10px]"></i>
                                    <span>${mitText}</span>
                                  </div>
                                  ${impactText ? `
                                    <div class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 font-medium border border-rose-100 text-[10px] font-mono self-start">
                                      <i class="fa-solid fa-triangle-exclamation text-[10px]"></i>
                                      <span>${impactText}</span>
                                    </div>
                                  ` : ''}
                                </div>
                              ` : `
                                <div class="inline-flex items-center gap-1.5 text-emerald-700 font-medium text-xs py-0.5">
                                  <i class="fa-solid fa-circle-check text-emerald-500"></i> No active impediments
                                </div>
                              `}
                            </div>

                            <!-- 4. Target Date -->
                            <div class="md:col-span-1 space-y-1.5">
                              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Target Date</div>
                              <div class="flex items-center gap-1.5 font-mono text-slate-600 text-xs font-semibold">
                                <i class="fa-regular fa-calendar text-slate-400 text-xs"></i>
                                <span>${targetDateFormatted}</span>
                              </div>
                            </div>

                            <!-- 5. Actions -->
                            <div class="md:col-span-2 space-y-1.5 flex flex-col items-start md:items-end">
                              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono w-full md:text-right">Actions</div>
                              <div class="flex items-center gap-2 pt-1">
                                ${isBlocked ? `
                                  <button onclick="resolveBlocker('${t.id}')"
                                    class="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs" title="Resolve blocker">
                                    <i class="fa-solid fa-check text-[10px]"></i> Resolve
                                  </button>
                                  <button onclick="openEditBlockerModal('${t.id}')"
                                    class="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5" title="Edit details">
                                    <i class="fa-solid fa-pen text-[10px] text-slate-400"></i> Edit
                                  </button>
                                ` : `
                                  <button onclick="openEditBlockerModal('${t.id}')"
                                    class="px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 hover:border-rose-200 text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5">
                                    <i class="fa-solid fa-ban text-[10px] text-rose-500"></i> + Blocker
                                  </button>
                                `}
                              </div>
                            </div>

                          </div>
                        </div>
                      </td>
                    </tr>
                  ` : ''}
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
    return;
  }

  // 2. ACTION CARDS VIEW (Clean & Simple Before Dropdown, Full Details After Dropdown)
  if (viewMode === 'cards') {
    container.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        ${candidateTasks.map(t => {
          const dev = DEVELOPERS.find(d => d.id === t.assignedTo);
          const squad = dev ? SQUADS.find(s => s.id === dev.squadId) : null;
          const isCritical = t.blockerSeverity === 'HIGH';
          const isBlocked = t.isBlocked;
          const isExpanded = state.expandedBlockerIds && state.expandedBlockerIds.has(t.id);
          const projectBadge = squad ? (squad.projectCode || 'PROJECT') : 'PROJECT';
          const squadName = squad ? getSquadShortName(squad) : 'Engineering';
          const fullSquadName = squad ? squad.name : 'Engineering Squad';
          const impactText = t.blockerImpact || (isCritical ? '+2.5h delay' : 'Minor delay');
          const mitText = t.mitigationAction || 'Manager follow-up active';
          const targetDateFormatted = formatShortDate(t.expectedResolutionDate || t.dueDate);

          return `
            <div class="bg-white rounded-2xl border ${isCritical ? 'border-rose-200/90 shadow-card' : 'border-slate-200/90 shadow-card'} p-5 hover:shadow-card-hover transition-all space-y-3.5">
              
              <!-- Card Header: Simple Blocker & Project Name -->
              <div class="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                <div class="space-y-1 min-w-0">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-mono font-bold uppercase border border-indigo-100">${projectBadge}</span>
                    ${isBlocked ? (
                      isCritical
                        ? '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200/80">🔴 Critical</span>'
                        : '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80">⚠️ High Risk</span>'
                    ) : '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">✓ On Track</span>'}
                    <span class="text-xs font-medium text-slate-400">${squadName}</span>
                  </div>
                  <h4 class="text-sm font-bold text-slate-900 leading-snug" title="${t.title}">${t.title}</h4>
                </div>

                <div class="flex items-center gap-1.5 flex-shrink-0" onclick="event.stopPropagation()">
                  ${isBlocked ? `
                    <button onclick="resolveBlocker('${t.id}')"
                      class="w-8 h-8 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200/90 hover:border-emerald-600 transition-all flex items-center justify-center shadow-2xs group cursor-pointer"
                      title="Resolve Blocker">
                      <i class="fa-solid fa-check text-xs transition-transform group-hover:scale-110"></i>
                    </button>
                  ` : ''}
                  <button onclick="toggleBlockerExpand('${t.id}')"
                    class="w-8 h-8 rounded-xl ${isExpanded ? 'bg-indigo-600 text-white shadow-xs border border-indigo-600' : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200/80 shadow-2xs'} transition-all flex items-center justify-center cursor-pointer"
                    title="${isExpanded ? 'Collapse details' : 'Show full blocker details'}">
                    <i class="fa-solid fa-chevron-down text-xs transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}"></i>
                  </button>
                </div>
              </div>

              <!-- Expanded Details in Card (After Dropdown) -->
              ${isExpanded ? `
                <div class="space-y-3 pt-1 animate-fadeIn">
                  <!-- Assignee & Target Date -->
                  <div class="flex items-center justify-between text-xs text-slate-600 pb-2 border-b border-slate-100">
                    <div onclick="switchManagerDevHub('${dev ? dev.id : ''}')" class="flex items-center gap-2 cursor-pointer hover:text-blue-600 transition-colors">
                      <div class="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 font-bold text-[10px] flex items-center justify-center text-slate-700 font-mono">${dev ? dev.initials : '??'}</div>
                      <div>
                        <span class="font-medium text-slate-800 block leading-tight">${dev ? dev.name : 'Unassigned'}</span>
                        <span class="text-[10px] text-slate-400">${dev ? (dev.role || 'Engineer') : ''}</span>
                      </div>
                    </div>
                    <div class="text-right">
                      <span class="text-[11px] font-mono font-semibold text-slate-600 flex items-center gap-1">
                        <i class="fa-regular fa-calendar text-[10px] text-slate-400"></i> ${targetDateFormatted}
                      </span>
                    </div>
                  </div>

                  <!-- Impediment & Mitigation Details -->
                  ${isBlocked ? `
                    <div class="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/70 space-y-2 text-xs">
                      <p class="text-slate-900 font-semibold leading-relaxed">${t.incompleteReason || 'Blocker logged by team.'}</p>
                      <div class="flex flex-col gap-1.5 pt-1 border-t border-slate-200/60">
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white text-slate-700 font-medium border border-slate-200/80 text-[11px] self-start">
                          <i class="fa-solid fa-shield-halved text-blue-500 text-[10px]"></i> ${mitText}
                        </span>
                        ${impactText ? `
                          <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 font-medium border border-rose-100 text-[10px] font-mono self-start">
                            <i class="fa-solid fa-triangle-exclamation text-[10px]"></i> ${impactText}
                          </span>
                        ` : ''}
                      </div>
                    </div>
                  ` : `
                    <div class="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 text-xs text-emerald-700 flex items-center gap-2 font-medium">
                      <i class="fa-solid fa-circle-check text-emerald-500"></i> No active impediments · Proceeding on schedule
                    </div>
                  `}

                  <!-- Actions -->
                  <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    ${isBlocked ? `
                      <button onclick="resolveBlocker('${t.id}')"
                        class="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5">
                        <i class="fa-solid fa-check text-[10px]"></i> Resolve
                      </button>
                      <button onclick="openEditBlockerModal('${t.id}')"
                        class="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5">
                        <i class="fa-solid fa-pen text-[10px] text-slate-400"></i> Edit
                      </button>
                    ` : `
                      <button onclick="openEditBlockerModal('${t.id}')"
                        class="px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 hover:border-rose-200 text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5">
                        <i class="fa-solid fa-ban text-[10px] text-rose-500"></i> + Blocker
                      </button>
                    `}
                  </div>
                </div>
              ` : ''}

            </div>
          `;
        }).join('')}
      </div>
    `;
    return;
  }
}

// ── Developer 360° Hub Integration ──
function renderManagerDevBlockerAnalysis(dev) {
  const container = document.getElementById('mgr-dev-blocker-analysis-container');
  if (!container || !dev) return;

  const devTasks = TASKS.filter(t => t.assignedTo === dev.id);
  const completed = devTasks.filter(t => t.status === 'COMPLETED');
  const incomplete = devTasks.filter(t => t.status !== 'COMPLETED');
  const blocked = incomplete.filter(t => t.isBlocked);
  const completionPct = Math.round((completed.length / devTasks.length) * 100) || 0;

  if (devTasks.length === 0) {
    container.innerHTML = '';
    return;
  }

  if (blocked.length === 0) {
    container.innerHTML = `
      <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <span class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm shadow-sm">
            <i class="fa-solid fa-circle-check"></i>
          </span>
          <div>
            <h4 class="font-bold text-slate-900 text-sm">Sprint Delivery on Track · Zero Active Blockers</h4>
            <p class="text-xs text-slate-500 font-mono">All ${devTasks.length} assigned tasks for ${dev.name} are progressing without impediments (${completed.length} completed, ${completionPct}% delivered).</p>
          </div>
        </div>

        <button onclick="openCreateBlockerModal()" class="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold font-mono transition-colors self-start sm:self-auto flex items-center gap-1.5">
          <i class="fa-solid fa-ban text-rose-600 text-[10px]"></i> + Log Blocker
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="bg-white rounded-2xl border border-rose-200 p-5 shadow-card space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-rose-100">
        <div class="flex items-center gap-3">
          <span class="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-base shadow-sm">
            <i class="fa-solid fa-ban"></i>
          </span>
          <div>
            <h4 class="font-extrabold text-slate-900 text-base">Active Delivery Impediments & Risks (${blocked.length})</h4>
            <p class="text-xs text-slate-500 font-mono">Critical blockers and mitigation steps for ${dev.name}</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <span class="px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-100 text-rose-800 border border-rose-200">
            🚨 ${blocked.length} Blocked
          </span>
          <span class="px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-700">
            ${completed.length} of ${devTasks.length} Done (${completionPct}%)
          </span>
        </div>
      </div>

      <div class="space-y-3">
        ${blocked.map(t => {
          const isCritical = t.blockerSeverity === 'HIGH';
          const isExpanded = state.expandedBlockerIds && state.expandedBlockerIds.has(t.id);
          const impactText = t.blockerImpact || (isCritical ? '+2.5h budget overrun' : 'Minor schedule delay');
          const mitText = t.mitigationAction || 'Manager follow-up active';
          const targetDateFormatted = formatShortDate(t.expectedResolutionDate || t.dueDate);

          return `
            <div class="rounded-2xl bg-white border ${isCritical ? 'border-rose-200 hover:border-rose-300' : 'border-slate-200 hover:border-slate-300'} shadow-2xs overflow-hidden transition-all">
              <!-- Compact Row (Before Dropdown) -->
              <div class="p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
                onclick="if (!event.target.closest('button') && !event.target.closest('a')) toggleDevBlockerExpand('${t.id}')">
                
                <div class="flex items-center gap-3 min-w-0 flex-1">
                  <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 ${isCritical ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-amber-50 text-amber-800 border border-amber-200'}">
                    ${isCritical ? '🔴 Critical' : '⚠️ High Risk'}
                  </span>
                  <h5 class="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate" title="${t.title}">${t.title}</h5>
                </div>

                <div class="flex items-center gap-3 self-end sm:self-auto flex-shrink-0">
                  <span class="text-xs font-mono text-slate-500 flex items-center gap-1.5">
                    <i class="fa-regular fa-calendar text-slate-400 text-xs"></i> <strong>${targetDateFormatted}</strong>
                  </span>
                  
                  <div class="flex items-center gap-1.5" onclick="event.stopPropagation()">
                    <button onclick="resolveBlocker('${t.id}')"
                      class="w-8 h-8 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200/90 hover:border-emerald-600 transition-all flex items-center justify-center shadow-2xs group/btn cursor-pointer"
                      title="Resolve Blocker">
                      <i class="fa-solid fa-check text-xs transition-transform group-hover/btn:scale-110"></i>
                    </button>
                    <button onclick="openEditBlockerModal('${t.id}')"
                      class="w-8 h-8 rounded-xl bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/80 transition-all flex items-center justify-center shadow-2xs cursor-pointer"
                      title="Edit Blocker">
                      <i class="fa-solid fa-pen text-xs"></i>
                    </button>
                    <button onclick="toggleDevBlockerExpand('${t.id}')"
                      class="w-8 h-8 rounded-xl ${isExpanded ? 'bg-indigo-600 text-white shadow-xs border border-indigo-600' : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200/80 shadow-2xs'} transition-all flex items-center justify-center cursor-pointer"
                      title="${isExpanded ? 'Collapse details' : 'Show full blocker details'}">
                      <i class="fa-solid fa-chevron-down text-xs transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}"></i>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Expanded Details (After Dropdown) -->
              ${isExpanded ? `
                <div class="p-4 pt-3 bg-slate-50/60 border-t border-slate-100 space-y-3 animate-fadeIn">
                  <div class="p-3.5 bg-white rounded-xl border border-slate-200/80 text-xs space-y-2 shadow-2xs">
                    <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Impediment Details</div>
                    <p class="text-slate-800 font-semibold leading-relaxed">${t.incompleteReason || 'Blocker logged.'}</p>
                    <div class="flex items-center gap-2 flex-wrap text-xs pt-1">
                      <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 text-slate-700 font-medium border border-slate-200/80 text-[11px]">
                        <i class="fa-solid fa-shield-halved text-blue-500 text-[10px]"></i> ${mitText}
                      </span>
                      ${impactText ? `
                        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 font-medium border border-rose-100 text-[11px] font-mono">
                          <i class="fa-solid fa-triangle-exclamation text-[10px]"></i> ${impactText}
                        </span>
                      ` : ''}
                    </div>
                  </div>
                </div>
              ` : ''}
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function renderManagerDevBlockers(devOrId) {
  const dev = typeof devOrId === 'string' ? (DEVELOPERS.find(d => d.id === devOrId) || DEVELOPERS[0]) : (devOrId || DEVELOPERS[0]);
  if (dev) {
    renderManagerDevBlockerAnalysis(dev);
  }
}

function toggleDevBlockerExpand(taskId) {
  if (!state.expandedBlockerIds) {
    state.expandedBlockerIds = new Set();
  }
  if (state.expandedBlockerIds.has(taskId)) {
    state.expandedBlockerIds.delete(taskId);
  } else {
    state.expandedBlockerIds.add(taskId);
  }
  const devId = state.currentManagerDevId || (DEVELOPERS[0] ? DEVELOPERS[0].id : null);
  const dev = DEVELOPERS.find(d => d.id === devId) || DEVELOPERS[0];
  if (dev) {
    renderManagerDevBlockerAnalysis(dev);
  }
}

// ── Blocker Presets & Handlers (Clean, Spacious Modal) ──

const BLOCKER_PRESETS = {
  api_keys: {
    key: 'api_keys',
    icon: '🔑',
    label: 'API Keys',
    category: 'CLIENT_DEPENDENCY',
    severity: 'CRITICAL_BLOCKER',
    description: 'Awaiting client production API keys and OAuth2 client secrets for payment gateway integration.',
    impact: 'QA paused; payment checkout integration delayed by 24h.',
    mitigation: 'PM escalated directly with client technical lead for expedited key provisioning.'
  },
  db_lag: {
    key: 'db_lag',
    icon: '🗄️',
    label: 'Database Lag',
    category: 'TECHNICAL_IMPEDIMENT',
    severity: 'CRITICAL_BLOCKER',
    description: 'Staging DB replica snapshot sync lag causing migration script timeout and integrity check failure.',
    impact: 'Database partitioning delayed; blocks staging environment cutover.',
    mitigation: 'DBA scheduled maintenance window for replica synchronization.'
  },
  pr_review: {
    key: 'pr_review',
    icon: '👥',
    label: 'PR Review',
    category: 'REVIEW_BOTTLENECK',
    severity: 'HIGH_DELIVERY_RISK',
    description: 'Pending secondary security architecture review and Tech Lead approval before merging to staging.',
    impact: 'Merge delayed by 1 sprint day; testing blocked.',
    mitigation: 'Tech Lead notified to prioritize architectural review today.'
  },
  cicd_failure: {
    key: 'cicd_failure',
    icon: '⚙️',
    label: 'CI/CD Fail',
    category: 'INFRASTRUCTURE',
    severity: 'CRITICAL_BLOCKER',
    description: 'Runner out-of-memory error during Docker container build in GitHub Actions deployment pipeline.',
    impact: 'Automatic staging deployments halted; manual hotfix deploy required.',
    mitigation: 'DevOps upgraded GitHub Action runner memory limit from 4GB to 8GB.'
  },
  outage_3rdparty: {
    key: 'outage_3rdparty',
    icon: '📦',
    label: '3rd-Party Outage',
    category: 'TECHNICAL_IMPEDIMENT',
    severity: 'CRITICAL_BLOCKER',
    description: 'External SMS OTP verification provider reporting widespread downtime and 503 Service Unavailable errors.',
    impact: 'User registration and 2FA login verification flows completely halted.',
    mitigation: 'Switched to fallback email OTP authentication sandbox until provider resolves incident.'
  }
};

function renderBlockerTemplatePills() {
  const select = document.getElementById('blocker-preset-select');
  if (!select) return;
  const currentVal = select.value || '';
  
  let html = `<option value="">⚡ Select a 1-Click Blocker Preset to auto-fill...</option>`;
  Object.entries(BLOCKER_PRESETS).forEach(([key, preset]) => {
    const sevLabel = preset.severity === 'HIGH' ? 'Critical Blocker' : 'High Delivery Risk';
    html += `<option value="${key}">${preset.icon || '⚠️'} ${preset.label} — ${sevLabel}</option>`;
  });
  select.innerHTML = html;
  if (currentVal && BLOCKER_PRESETS[currentVal]) {
    select.value = currentVal;
  }
}

function applyBlockerPreset(presetKey) {
  if (!presetKey) return;
  const preset = BLOCKER_PRESETS[presetKey];
  if (!preset) return;

  const select = document.getElementById('blocker-preset-select');
  if (select && select.value !== presetKey) {
    select.value = presetKey;
  }

  const catSelect = document.getElementById('edit-blocker-category-select');
  if (catSelect) catSelect.value = preset.category;

  const sevSelect = document.getElementById('edit-blocker-severity-select');
  if (sevSelect) {
    sevSelect.value = preset.severity;
    onBlockerSeveritySelectChange(preset.severity);
  }

  const reasonInput = document.getElementById('edit-blocker-reason-text');
  if (reasonInput) reasonInput.value = preset.description;

  const impactInput = document.getElementById('edit-blocker-impact-text');
  if (impactInput) impactInput.value = preset.impact;

  const mitInput = document.getElementById('edit-blocker-mitigation');
  if (mitInput) mitInput.value = preset.mitigation;

  showToast(`⚡ Loaded "${preset.label}" preset (${preset.severity === 'HIGH' ? 'Critical' : 'High Risk'})`, 'info');
}

function resetBlockerPresetSelect() {
  const select = document.getElementById('blocker-preset-select');
  if (select) select.value = '';
}

function formatDateToInput(dateStr) {
  if (!dateStr) return '2026-09-11';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  return '2026-09-11';
}

function populateBlockerTaskDropdown(selectedTaskId) {
  const taskSelect = document.getElementById('modal-blocker-task-select');
  if (!taskSelect) return;

  const incompleteTasks = TASKS.filter(t => t.status !== 'COMPLETED');
  taskSelect.innerHTML = `
    <option value="">-- Choose Task to Raise Blocker --</option>
    ${DEVELOPERS.map(dev => {
      const devTasks = incompleteTasks.filter(t => t.assignedTo === dev.id);
      const squad = SQUADS.find(s => s.id === dev.squadId);
      if (devTasks.length === 0) return '';
      return `
        <optgroup label="${dev.name} · ${squad ? squad.name.replace(/\s\(.*\)/, '') : ''}">
          ${devTasks.map(t => `<option value="${t.id}" ${t.id === selectedTaskId ? 'selected' : ''}>[${squad ? squad.projectCode || 'PROJECT' : 'PROJECT'}] ${t.title} ${t.isBlocked ? '(🚨 Blocked)' : ''}</option>`).join('')}
        </optgroup>
      `;
    }).join('')}
  `;

  if (selectedTaskId) {
    taskSelect.value = selectedTaskId;
    updateBlockerTaskContextBadge(selectedTaskId);
  } else if (incompleteTasks.length > 0) {
    taskSelect.value = incompleteTasks[0].id;
    updateBlockerTaskContextBadge(incompleteTasks[0].id);
  }
}

function updateBlockerTaskContextBadge(taskId) {
  const contextContainer = document.getElementById('modal-blocker-task-context');
  const badge = document.getElementById('modal-blocker-context-badge');
  const devSpan = document.getElementById('modal-blocker-context-dev');
  const hoursSpan = document.getElementById('modal-blocker-context-hours');

  if (!taskId) {
    if (contextContainer) contextContainer.classList.add('hidden');
    return;
  }

  const task = TASKS.find(t => t.id === taskId);
  if (!task) {
    if (contextContainer) contextContainer.classList.add('hidden');
    return;
  }

  const dev = DEVELOPERS.find(d => d.id === task.assignedTo);
  const squad = dev ? SQUADS.find(s => s.id === dev.squadId) : (task.squadId ? SQUADS.find(s => s.id === task.squadId) : null);

  if (contextContainer) contextContainer.classList.remove('hidden');
  if (badge) badge.innerText = squad ? (squad.projectCode || squad.name.replace(/\s\(.*\)/, '')) : 'PROJECT';
  if (devSpan) devSpan.innerText = dev ? `Assigned to: ${dev.name}` : 'Unassigned';
  if (hoursSpan) hoursSpan.innerText = `${cleanHours(task.estimatedHours)}h budget`;
}

function onBlockerSeveritySelectChange(sev) {
  const normalizedSev = (sev === 'CRITICAL_BLOCKER' || sev === 'HIGH' || sev === 'CRITICAL') ? 'CRITICAL_BLOCKER' : 'HIGH_DELIVERY_RISK';
  const hiddenInput = document.getElementById('edit-blocker-severity');
  if (hiddenInput) hiddenInput.value = normalizedSev;
  const sevSelect = document.getElementById('edit-blocker-severity-select');
  if (sevSelect && sevSelect.value !== normalizedSev) sevSelect.value = normalizedSev;
}

function setModalBlockerSeverity(sev) {
  onBlockerSeveritySelectChange(sev);
}

function onBlockerTaskSelectChange(taskId) {
  if (!taskId) {
    updateBlockerTaskContextBadge(null);
    return;
  }
  const task = TASKS.find(t => t.id === taskId);
  if (!task) return;

  state.editingBlockerTaskId = taskId;
  const idInput = document.getElementById('edit-blocker-task-id');
  if (idInput) idInput.value = task.id;

  updateBlockerTaskContextBadge(task.id);

  // Sync category
  const catSelect = document.getElementById('edit-blocker-category-select');
  if (catSelect) {
    catSelect.value = task.blockerCategory || 'TECHNICAL_IMPEDIMENT';
  }

  // Sync severity (normalized to CRITICAL_BLOCKER or HIGH_DELIVERY_RISK)
  const sev = (task.blockerSeverity === 'CRITICAL_BLOCKER' || task.blockerSeverity === 'HIGH') ? 'CRITICAL_BLOCKER' : 'HIGH_DELIVERY_RISK';
  onBlockerSeveritySelectChange(sev);

  // Sync description
  const reasonInput = document.getElementById('edit-blocker-reason-text');
  if (reasonInput) {
    if (task.incompleteReason && task.incompleteReason !== 'Impediment reported by team.' && !task.incompleteReason.includes('resolved')) {
      reasonInput.value = task.incompleteReason;
    } else {
      reasonInput.value = '';
    }
  }

  // Sync impact
  const impactInput = document.getElementById('edit-blocker-impact-text');
  if (impactInput) {
    impactInput.value = task.blockerImpact || '';
  }

  // Sync mitigation
  const mitInput = document.getElementById('edit-blocker-mitigation');
  if (mitInput) mitInput.value = task.mitigationAction || '';

  // Sync resolution date
  const resDateInput = document.getElementById('edit-blocker-resolution-date');
  if (resDateInput) {
    resDateInput.value = task.expectedResolutionDate ? formatDateToInput(task.expectedResolutionDate) : '2026-09-11';
  }

  // Resolve button & submit button styling
  const resolveBtn = document.getElementById('modal-blocker-resolve-btn');
  const submitText = document.getElementById('modal-blocker-submit-text');
  const modalTitle = document.getElementById('modal-blocker-title');
  const modalSubtitle = document.getElementById('modal-blocker-subtitle');

  if (task.isBlocked) {
    if (resolveBtn) resolveBtn.classList.remove('hidden');
    if (submitText) submitText.innerText = 'Update Blocker';
    if (modalTitle) modalTitle.innerText = 'Update Blocker & Risk';
    if (modalSubtitle) modalSubtitle.innerText = `Active impediment on "${task.title}"`;
  } else {
    if (resolveBtn) resolveBtn.classList.add('hidden');
    if (submitText) submitText.innerText = 'Raise Blocker';
    if (modalTitle) modalTitle.innerText = 'Raise a Blocker';
    if (modalSubtitle) modalSubtitle.innerText = 'Report an impediment halting your work';
  }
}

function openCreateBlockerModal(preselectedTaskId) {
  const modal = document.getElementById('modal-edit-blocker');
  if (!modal) return;

  renderBlockerTemplatePills();
  resetBlockerPresetSelect();

  const modalTitle = document.getElementById('modal-blocker-title');
  const modalSubtitle = document.getElementById('modal-blocker-subtitle');
  const submitText = document.getElementById('modal-blocker-submit-text');
  if (modalTitle) modalTitle.innerText = 'Raise a Blocker';
  if (modalSubtitle) modalSubtitle.innerText = 'Report an impediment halting your work';
  if (submitText) submitText.innerText = 'Raise Blocker';

  const targetTaskId = preselectedTaskId || (TASKS.find(t => t.status !== 'COMPLETED') ? TASKS.find(t => t.status !== 'COMPLETED').id : null);

  populateBlockerTaskDropdown(targetTaskId);

  if (targetTaskId) {
    onBlockerTaskSelectChange(targetTaskId);
  }

  modal.classList.remove('hidden');
}

function openEditBlockerModal(taskId) {
  const task = TASKS.find(t => t.id === taskId);
  if (!task) return;

  const modal = document.getElementById('modal-edit-blocker');
  if (!modal) return;

  renderBlockerTemplatePills();
  populateBlockerTaskDropdown(taskId);
  onBlockerTaskSelectChange(taskId);

  modal.classList.remove('hidden');
}

function closeEditBlockerModal() {
  const modal = document.getElementById('modal-edit-blocker');
  if (modal) modal.classList.add('hidden');
  state.editingBlockerTaskId = null;
}

function setQuickBlockerPreset(reason, mitigation) {
  const reasonInput = document.getElementById('edit-blocker-reason-text');
  if (reasonInput) reasonInput.value = reason;
  const mitInput = document.getElementById('edit-blocker-mitigation');
  if (mitInput && mitigation) mitInput.value = mitigation;
}

function setQuickBlockerField1(blockerDescWithImpact, defaultMitigation) {
  setQuickBlockerPreset(blockerDescWithImpact, defaultMitigation);
}

function setQuickMitigation(mitigationText) {
  const mitInput = document.getElementById('edit-blocker-mitigation');
  if (mitInput) mitInput.value = mitigationText;
}

function setQuickBlockerReason(templateText, category, impact, mitigation) {
  setQuickBlockerPreset(impact ? `${templateText} ${impact}` : templateText, mitigation);
}

function saveBlockerReason() {
  const taskId = document.getElementById('edit-blocker-task-id').value;
  const task = TASKS.find(t => t.id === taskId);
  if (!task) {
    showToast('Please select a valid task to report a blocker.', 'warning');
    return;
  }

  const rawReason = (document.getElementById('edit-blocker-reason-text').value || '').trim();
  const impact = (document.getElementById('edit-blocker-impact-text') ? document.getElementById('edit-blocker-impact-text').value : '').trim();
  const mit = (document.getElementById('edit-blocker-mitigation').value || '').trim();
  const cat = (document.getElementById('edit-blocker-category-select') ? document.getElementById('edit-blocker-category-select').value : 'TECHNICAL_IMPEDIMENT') || 'TECHNICAL_IMPEDIMENT';
  const sev = (document.getElementById('edit-blocker-severity-select') ? document.getElementById('edit-blocker-severity-select').value : 'HIGH') || 'HIGH';
  const resDate = document.getElementById('edit-blocker-resolution-date') ? document.getElementById('edit-blocker-resolution-date').value : '';

  if (!rawReason) {
    showToast('Please provide a blocker description before saving.', 'warning');
    const reasonInput = document.getElementById('edit-blocker-reason-text');
    if (reasonInput) reasonInput.focus();
    return;
  }

  task.isBlocked = true;
  task.blockerCategory = cat;
  task.blockerSeverity = sev;
  task.incompleteReason = rawReason;
  task.blockerImpact = impact || (rawReason.length > 25 ? rawReason : (sev === 'HIGH' ? '+2.5h delay; delivery milestone blocked.' : 'Minor timeline delay.'));
  task.mitigationAction = mit || 'Manager escalation active.';
  if (resDate) {
    task.expectedResolutionDate = resDate;
  }
  task.blockerLoggedBy = 'Marcus Vance (Manager)';
  task.blockerLoggedAt = 'Today · Just now';

  // Automatically stop active timer if running
  if (task.isTimerRunning) {
    task.isTimerRunning = false;
    if (typeof stopTaskTimer === 'function') stopTaskTimer(task.id);
  }

  closeEditBlockerModal();
  renderBlockersTab();
  if (state.activeTab === 'dev_hub') {
    const dev = DEVELOPERS.find(d => d.id === task.assignedTo);
    if (dev) {
      renderManagerDevBlockers(dev.id);
      renderManagerDevBlockerAnalysis(dev);
    }
  }
  if (typeof renderSprintTasks === 'function') renderSprintTasks();
  if (typeof renderScheduleGrid === 'function') renderScheduleGrid();
  if (typeof renderKanbanBoard === 'function') renderKanbanBoard();
  if (typeof renderBlockersBadge === 'function') renderBlockersBadge();

  showToast(`🚨 Blocker logged for "${task.title}"`, 'warning');
}

function resolveBlocker(taskId) {
  const task = TASKS.find(t => t.id === taskId);
  if (!task) return;

  task.isBlocked = false;
  task.incompleteReason = 'Blocker resolved · Work proceeding on track.';
  task.blockerImpact = null;
  task.blockerSeverity = null;

  renderBlockersTab();
  if (state.activeTab === 'dev_hub') {
    const dev = DEVELOPERS.find(d => d.id === task.assignedTo);
    if (dev) {
      renderManagerDevBlockers(dev.id);
      renderManagerDevBlockerAnalysis(dev);
    }
  }
  if (typeof renderSprintTasks === 'function') renderSprintTasks();
  if (typeof renderScheduleGrid === 'function') renderScheduleGrid();
  if (typeof renderKanbanBoard === 'function') renderKanbanBoard();
  if (typeof renderBlockersBadge === 'function') renderBlockersBadge();

  showToast(`✓ Blocker marked resolved for "${task.title}"`, 'success');
}

function resolveBlockerFromModal() {
  const taskId = document.getElementById('edit-blocker-task-id').value;
  if (taskId) {
    resolveBlocker(taskId);
    closeEditBlockerModal();
  }
}



// ─── Bootstrap ───

window.addEventListener('DOMContentLoaded', initApp);

