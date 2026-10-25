import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Users, TrendingUp, AlertTriangle, ShieldCheck, 
  IndianRupee, Activity, Cpu, Sliders, PlayCircle, 
  Lightbulb, Search, Bell, Moon, Sun, ArrowUpRight, 
  ArrowDownRight, CheckCircle2, ChevronRight, ChevronLeft,
  ChevronsLeft, ChevronsRight, X, Menu,
  Upload, FileText, BarChart3, Database, RefreshCw,
  Clock, Award, Sparkles, UserCheck, Briefcase, Building2,
  CheckSquare, Filter, Layers, HelpCircle, Bot, Send,
  MessageSquare, Trash2, ArrowRight, LayoutGrid, Grid3X3,
  Target, ArrowUpDown, Calendar, Check, Download, Printer, Copy
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  Cell, LineChart, Line, CartesianGrid, AreaChart, Area 
} from 'recharts';
import { 
  INITIAL_EMPLOYEES, 
  DEPARTMENT_METRICS, 
  RETENTION_PLAYBOOK, 
  MODEL_BENCHMARKS 
} from './data/mockData';
import './App.css';

const API_BASE_URL = 'http://127.0.0.1:8000';

const VALID_TABS = ['dashboard', 'directory', 'departments', 'matrix', 'simulator', 'playbook', 'interventions', 'models'];

export const ROLE_PERMISSIONS = {
  'HR Executive': {
    name: 'HR Executive / People Ops',
    badge: 'HR Administrator',
    tagline: 'Enterprise Workforce Overview, Departmental Capacity & Retention Policy Governance',
    defaultTab: 'dashboard',
    allowedTabs: ['dashboard', 'directory', 'departments', 'matrix', 'playbook', 'interventions'],
    canExportDossier: true,
    canSimulate: true,
    canApprovePlans: true,
    canRetrainModel: false
  },
  'Team Lead': {
    name: 'Team Lead / Department Mgr',
    badge: 'Engineering Team Lead',
    tagline: 'Direct Team Flight Risk Diagnosis, 1-on-1 What-If Levers & Retention Proposals',
    defaultTab: 'simulator',
    allowedTabs: ['directory', 'matrix', 'simulator', 'interventions'],
    canExportDossier: false,
    canSimulate: true,
    canApprovePlans: false,
    canRetrainModel: false
  },
  'Data Analyst': {
    name: 'Data Scientist / ML Ops',
    badge: 'ML Ops Specialist',
    tagline: 'Champion Soft-Voting Ensemble Metrics, ROC-AUC, Feature Importance & Pipeline Retraining',
    defaultTab: 'models',
    allowedTabs: ['models', 'directory', 'matrix', 'simulator'],
    canExportDossier: false,
    canSimulate: true,
    canApprovePlans: false,
    canRetrainModel: true
  }
};

const getInitialRole = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('retentionai_active_role');
    if (saved && ROLE_PERMISSIONS[saved]) {
      return saved;
    }
  }
  return 'HR Executive';
};

const getInitialTab = () => {
  if (typeof window !== 'undefined') {
    const role = getInitialRole();
    const roleConfig = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS['HR Executive'];
    const hash = window.location.hash.replace(/^#\/?/, '').trim();
    if (VALID_TABS.includes(hash) && roleConfig.allowedTabs.includes(hash)) {
      return hash;
    }
    const saved = localStorage.getItem('retentionai_active_tab');
    if (saved && VALID_TABS.includes(saved) && roleConfig.allowedTabs.includes(saved)) {
      return saved;
    }
    return roleConfig.defaultTab;
  }
  return 'dashboard';
};

const getInitialTheme = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('retentionai_theme');
    if (saved !== null) {
      return saved === 'dark';
    }
  }
  return true;
};

export default function App() {
  // Navigation & Theme State with Persistence
  const [activeRole, setActiveRole] = useState(getInitialRole);
  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [isDarkMode, setIsDarkMode] = useState(getInitialTheme);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [riskFilter, setRiskFilter] = useState('All');
  const [dirPage, setDirPage] = useState(1);
  const dirPageSize = 5;

  const currentRoleConfig = ROLE_PERMISSIONS[activeRole] || ROLE_PERMISSIONS['HR Executive'];
  const isTabAllowed = (tab) => currentRoleConfig.allowedTabs.includes(tab);

  const navigateTo = (tab, replace = false) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
    localStorage.setItem('retentionai_active_tab', tab);
    
    const targetHash = `#/${tab}`;
    if (window.location.hash !== targetHash) {
      if (replace) {
        window.history.replaceState({ tab }, '', targetHash);
      } else {
        window.history.pushState({ tab }, '', targetHash);
      }
    }
  };

  const handleRoleChange = (newRole) => {
    setActiveRole(newRole);
    localStorage.setItem('retentionai_active_role', newRole);
    
    const roleConfig = ROLE_PERMISSIONS[newRole] || ROLE_PERMISSIONS['HR Executive'];
    if (!roleConfig.allowedTabs.includes(activeTab)) {
      navigateTo(roleConfig.defaultTab);
    }
    showToast(`Switched RBAC perspective to ${roleConfig.name}`);
    setIsMobileMenuOpen(false);
  };

  // URL Hash & Browser History (Back / Forward Navigation to Dashboard)
  useEffect(() => {
    const currentTab = getInitialTab();
    if (window.location.hash !== `#/${currentTab}`) {
      window.history.replaceState({ tab: currentTab }, '', `#/${currentTab}`);
    }

    const handlePopState = () => {
      const hash = window.location.hash.replace(/^#\/?/, '').trim();
      const currentRole = localStorage.getItem('retentionai_active_role') || 'HR Executive';
      const roleConfig = ROLE_PERMISSIONS[currentRole] || ROLE_PERMISSIONS['HR Executive'];

      if (VALID_TABS.includes(hash) && roleConfig.allowedTabs.includes(hash)) {
        setActiveTab(hash);
        localStorage.setItem('retentionai_active_tab', hash);
      } else {
        // Fallback to role's primary view
        setActiveTab(roleConfig.defaultTab);
        localStorage.setItem('retentionai_active_tab', roleConfig.defaultTab);
        window.history.replaceState({ tab: roleConfig.defaultTab }, '', `#/${roleConfig.defaultTab}`);
      }
      setIsMobileMenuOpen(false);
      setIsModalOpen(false);
    };

    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Theme synchronization effect
  useEffect(() => {
    if (!isDarkMode) {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }
  }, [isDarkMode]);

  // Live Backend State
  const [employees, setEmployees] = useState(INITIAL_EMPLOYEES);
  const [departmentData, setDepartmentData] = useState(DEPARTMENT_METRICS);
  const [kpiData, setKpiData] = useState(null);
  const [modelMetrics, setModelMetrics] = useState(MODEL_BENCHMARKS);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  // Intervention Tracker State (Committed retention plans)
  const [committedPlans, setCommittedPlans] = useState([
    {
      id: "INT-101",
      empId: "EMP-1",
      name: "Aarav Sharma",
      department: "Sales",
      role: "Sales Executive",
      action: "Base Salary Calibration (+12%) & On-Call Cap",
      costInr: 342000,
      riskBefore: 88,
      riskAfter: 42,
      date: "Today",
      status: "Approved"
    },
    {
      id: "INT-102",
      empId: "EMP-4",
      name: "Rohan Verma",
      department: "Research & Development",
      role: "Laboratory Technician",
      action: "Fast-Track Promotion Milestone & Workload Balancing",
      costInr: 150000,
      riskBefore: 76,
      riskAfter: 35,
      date: "Yesterday",
      status: "In Progress"
    }
  ]);

  // Employee State & Modals
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notification, setNotification] = useState(null);

  // Simulator State
  const [simTargetEmp, setSimTargetEmp] = useState(INITIAL_EMPLOYEES[0]);
  const [simSalaryDelta, setSimSalaryDelta] = useState(12); // +12% salary adjustment
  const [simOvertimeHours, setSimOvertimeHours] = useState(15); // reduced to 15h
  const [simRemoteDays, setSimRemoteDays] = useState(3); // 3 days/week
  const [simPromotionStatus, setSimPromotionStatus] = useState(true); // fast-track promotion
  const [simBonusAmount, setSimBonusAmount] = useState(150000); // ₹1.5 Lakhs
  const [liveSimResult, setLiveSimResult] = useState(null);

  // Model Threshold Simulator State
  const [decisionThreshold, setDecisionThreshold] = useState(0.40); // 0.40 threshold for high recall

  // Training pipeline simulation
  const [isRetraining, setIsRetraining] = useState(false);
  const [playbookCategoryFilter, setPlaybookCategoryFilter] = useState('All');

  // Helper notification trigger
  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Export Workforce Risk Dossier as CSV
  const handleExportDossier = () => {
    if (!filteredEmployees || filteredEmployees.length === 0) {
      showToast('No employee records available to export.');
      return;
    }

    try {
      const headers = [
        'Employee ID',
        'Employee Name',
        'Department',
        'Role',
        'Tenure (Years)',
        'Annual CTC (INR)',
        'Market Ratio',
        'Overtime (Hours/Mo)',
        'Last Promotion (Months Ago)',
        'Satisfaction Score (1-10)',
        'Performance Rating (1-5)',
        'Flight Risk Score (%)',
        'Risk Tier',
        'Primary Flight Risk Drivers',
        'Est. Replacement Cost (INR)',
        'Retention Status'
      ];

      const csvRows = [headers.join(',')];

      filteredEmployees.forEach(emp => {
        const replacementCost = Math.round(emp.salary * 1.5);
        const drivers = (emp.primaryDrivers || []).join('; ');

        const row = [
          `"${(emp.id || '').replace(/"/g, '""')}"`,
          `"${(emp.name || '').replace(/"/g, '""')}"`,
          `"${(emp.department || '').replace(/"/g, '""')}"`,
          `"${(emp.role || '').replace(/"/g, '""')}"`,
          emp.tenureYears ?? '',
          emp.salary ?? '',
          emp.salaryMarketRatio ?? '',
          emp.overtimeHoursMonth ?? '',
          emp.lastPromotionMonths ?? '',
          emp.satisfactionScore ?? '',
          emp.performanceRating ?? '',
          emp.riskScore ?? '',
          `"${(emp.riskTier || '').replace(/"/g, '""')}"`,
          `"${drivers.replace(/"/g, '""')}"`,
          replacementCost,
          `"${(emp.status || 'Under Active Review').replace(/"/g, '""')}"`
        ];
        csvRows.push(row.join(','));
      });

      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      const deptSlug = deptFilter === 'All' ? 'All_Depts' : deptFilter.replace(/\s+/g, '_');
      link.setAttribute('href', url);
      link.setAttribute('download', `RetentionAI_Risk_Dossier_${deptSlug}_${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast(`Exported ${filteredEmployees.length} employee records to CSV dossier.`);
    } catch (err) {
      console.error('Export failed:', err);
      showToast('Failed to export risk dossier.');
    }
  };

  // Copilot Assistant State
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [copilotQuery, setCopilotQuery] = useState('');
  const [isCopilotLoading, setIsCopilotLoading] = useState(false);
  const [copilotMessages, setCopilotMessages] = useState([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      headline: 'RetentionAI Copilot Ready',
      text: "### AI Retention Copilot\n\nI can analyze attrition risk trends across our 1,470 employees, diagnose department burnout, investigate compensation disparities, or draft personalized 1-on-1 retention plans for any team member.\n\n*Select a prompt below or ask any question about your workforce:*",
      suggestedPrompts: [
        "Show top 5 flight risks across all departments",
        "Why is Sales experiencing high attrition?",
        "Who is at risk due to overtime and burnout?",
        "Who has promotion lag ≥ 3 years?"
      ],
      timestamp: "Just now"
    }
  ]);
  const copilotMessagesEndRef = useRef(null);

  useEffect(() => {
    if (isCopilotOpen) {
      copilotMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [copilotMessages, isCopilotOpen]);

  const handleSendCopilot = async (overrideText = null, contextEmpId = null) => {
    const text = (overrideText !== null ? overrideText : copilotQuery).trim();
    if (!text || isCopilotLoading) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setCopilotMessages(prev => [...prev, userMsg]);
    setCopilotQuery('');
    setIsCopilotLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/copilot/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: text,
          context_employee_id: contextEmpId,
          role: activeRole
        })
      });

      if (res.ok) {
        const data = await res.json();
        const botMsg = {
          id: `bot-${Date.now()}`,
          sender: 'assistant',
          headline: data.headline,
          text: data.answer,
          metrics: data.metrics || [],
          employees: data.employees || [],
          recommendations: data.recommendations || [],
          suggestedPrompts: data.suggestedPrompts || [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setCopilotMessages(prev => [...prev, botMsg]);
      } else {
        throw new Error('Copilot endpoint returned non-200');
      }
    } catch (err) {
      // Fallback local intelligent response
      const botMsg = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        headline: 'Workforce Retention Diagnostics',
        text: `### 🤖 Workforce Insights on "${text}"\n\nBased on indexed workforce metrics:\n- **Predicted Workforce Risk:** ~16.1% company-wide attrition probability.\n- **Primary Drivers:** Overtime burnout and promotion lag are the primary attrition drivers.\n- **Recommended Action:** Review compensation ratios in the **Employee Explorer** or run the **What-If Simulator** to model retention interventions.`,
        metrics: [
          { label: "Dataset", value: "1,470 Staff", badge: "Info" },
          { label: "Status", value: "Active", badge: "Normal" }
        ],
        suggestedPrompts: [
          "Show top 5 flight risks across all departments",
          "Why is Sales experiencing high attrition?",
          "Who is at risk due to overtime and burnout?"
        ],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setCopilotMessages(prev => [...prev, botMsg]);
    } finally {
      setIsCopilotLoading(false);
    }
  };

  const askCopilotAboutEmployee = (emp) => {
    setSelectedEmployee(null);
    setIsModalOpen(false);
    setIsCopilotOpen(true);
    handleSendCopilot(`Draft a retention plan for ${emp.name} (${emp.id})`, emp.id);
  };

  // Safe inline markdown renderer for Copilot text
  const renderCopilotText = (rawText) => {
    if (!rawText) return null;
    const lines = rawText.split('\n');
    const elements = [];
    let currentList = [];
    let isOrdered = false;

    const flushList = () => {
      if (currentList.length > 0) {
        if (isOrdered) {
          elements.push(
            <ol key={`ol-${elements.length}`} style={{ margin: '6px 0 10px 0', paddingLeft: 20 }}>
              {currentList.map((item, idx) => <li key={idx} style={{ marginBottom: 4 }}>{formatInline(item)}</li>)}
            </ol>
          );
        } else {
          elements.push(
            <ul key={`ul-${elements.length}`} style={{ margin: '6px 0 10px 0', paddingLeft: 20 }}>
              {currentList.map((item, idx) => <li key={idx} style={{ marginBottom: 4 }}>{formatInline(item)}</li>)}
            </ul>
          );
        }
        currentList = [];
      }
    };

    const formatInline = (str) => {
      const parts = [];
      // Regex for **bold** and *italic*
      const regex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
      let lastIdx = 0;
      let match;

      while ((match = regex.exec(str)) !== null) {
        if (match.index > lastIdx) {
          parts.push(str.substring(lastIdx, match.index));
        }
        const token = match[0];
        if (token.startsWith('**') && token.endsWith('**')) {
          parts.push(<strong key={match.index} style={{ color: 'var(--text-main)' }}>{token.slice(2, -2)}</strong>);
        } else if (token.startsWith('*') && token.endsWith('*')) {
          parts.push(<em key={match.index} style={{ color: 'var(--text-muted)' }}>{token.slice(1, -1)}</em>);
        }
        lastIdx = match.index + token.length;
      }
      if (lastIdx < str.length) {
        parts.push(str.substring(lastIdx));
      }
      return parts.length > 0 ? parts : str;
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) {
        flushList();
        return;
      }

      if (trimmed.startsWith('#### ')) {
        flushList();
        elements.push(<h4 key={index} style={{ fontSize: '0.84rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', margin: '12px 0 6px 0' }}>{formatInline(trimmed.slice(5))}</h4>);
      } else if (trimmed.startsWith('### ')) {
        flushList();
        elements.push(<h3 key={index} style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 10px 0' }}>{formatInline(trimmed.slice(4))}</h3>);
      } else if (/^\d+\.\s/.test(trimmed)) {
        if (currentList.length > 0 && !isOrdered) flushList();
        isOrdered = true;
        currentList.push(trimmed.replace(/^\d+\.\s/, ''));
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        if (currentList.length > 0 && isOrdered) flushList();
        isOrdered = false;
        currentList.push(trimmed.slice(2));
      } else {
        flushList();
        elements.push(<p key={index} style={{ margin: '0 0 8px 0', fontSize: '0.88rem', lineHeight: 1.55 }}>{formatInline(trimmed)}</p>);
      }
    });

    flushList();
    return elements;
  };

  // Talent Retention Matrix State
  const [matrixData, setMatrixData] = useState(null);
  const [selectedQuadrantId, setSelectedQuadrantId] = useState('high_perf_high_risk');
  const [isCohortModalOpen, setIsCohortModalOpen] = useState(false);
  const [matrixDeptFilter, setMatrixDeptFilter] = useState('All');
  const [matrixSearchQuery, setMatrixSearchQuery] = useState('');
  const [matrixRiskFilter, setMatrixRiskFilter] = useState('All');
  const [matrixSortCol, setMatrixSortCol] = useState('riskScore');
  const [matrixSortDir, setMatrixSortDir] = useState('desc');
  const [matrixPage, setMatrixPage] = useState(1);
  const [matrixPageSize, setMatrixPageSize] = useState(10);
  const [isMatrixLoading, setIsMatrixLoading] = useState(false);

  const fetchMatrixData = async (dept = 'All') => {
    setIsMatrixLoading(true);
    try {
      const url = dept && dept !== 'All' 
        ? `${API_BASE_URL}/api/matrix?department=${encodeURIComponent(dept)}`
        : `${API_BASE_URL}/api/matrix`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setMatrixData(data);
      }
    } catch (e) {
      console.error('Failed to fetch matrix data', e);
    } finally {
      setIsMatrixLoading(false);
    }
  };

  useEffect(() => {
    fetchMatrixData(matrixDeptFilter);
  }, [matrixDeptFilter]);

  // Active Quadrant Data
  const currentMatrixQuadrant = useMemo(() => {
    return (matrixData?.quadrants || []).find(q => q.id === selectedQuadrantId) || (matrixData?.quadrants || [])[0] || null;
  }, [matrixData, selectedQuadrantId]);

  // Filtered & Sorted Matrix Cohort Employees
  const matrixFilteredEmployees = useMemo(() => {
    if (!currentMatrixQuadrant || !currentMatrixQuadrant.employees) return [];
    let list = [...currentMatrixQuadrant.employees];

    if (matrixSearchQuery.trim()) {
      const sq = matrixSearchQuery.toLowerCase().trim();
      list = list.filter(e => 
        (e.name || '').toLowerCase().includes(sq) ||
        (e.id || '').toLowerCase().includes(sq) ||
        (e.role || '').toLowerCase().includes(sq) ||
        (e.department || '').toLowerCase().includes(sq)
      );
    }

    if (matrixRiskFilter !== 'All') {
      list = list.filter(e => (e.riskTier || '').toLowerCase() === matrixRiskFilter.toLowerCase());
    }

    list.sort((a, b) => {
      let valA = a[matrixSortCol];
      let valB = b[matrixSortCol];
      if (typeof valA === 'string') {
        const cmp = valA.localeCompare(valB || '');
        return matrixSortDir === 'asc' ? cmp : -cmp;
      }
      valA = valA ?? 0;
      valB = valB ?? 0;
      return matrixSortDir === 'asc' ? valA - valB : valB - valA;
    });

    return list;
  }, [currentMatrixQuadrant, matrixSearchQuery, matrixRiskFilter, matrixSortCol, matrixSortDir]);

  const matrixTotalPages = Math.max(1, Math.ceil(matrixFilteredEmployees.length / matrixPageSize));
  
  const matrixPaginatedEmployees = useMemo(() => {
    const start = (matrixPage - 1) * matrixPageSize;
    return matrixFilteredEmployees.slice(start, start + matrixPageSize);
  }, [matrixFilteredEmployees, matrixPage, matrixPageSize]);

  useEffect(() => {
    setMatrixPage(1);
  }, [selectedQuadrantId, matrixDeptFilter, matrixSearchQuery, matrixRiskFilter, matrixPageSize]);

  const handleMatrixSort = (col) => {
    if (matrixSortCol === col) {
      setMatrixSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setMatrixSortCol(col);
      setMatrixSortDir('desc');
    }
  };

  const getMatrixPageNumbers = () => {
    if (matrixTotalPages <= 7) {
      return Array.from({ length: matrixTotalPages }, (_, i) => i + 1);
    }
    const pages = [1];
    if (matrixPage > 3) pages.push('...-left');
    const start = Math.max(2, matrixPage - 1);
    const end = Math.min(matrixTotalPages - 1, matrixPage + 1);
    for (let i = start; i <= end; i++) {
      if (!pages.includes(i)) pages.push(i);
    }
    if (matrixPage < matrixTotalPages - 2) pages.push('...-right');
    if (!pages.includes(matrixTotalPages)) pages.push(matrixTotalPages);
    return pages;
  };

  const handleExportMatrixCohortCSV = () => {
    if (!matrixFilteredEmployees || matrixFilteredEmployees.length === 0) {
      showToast('No cohort personnel available to export.');
      return;
    }
    try {
      const headers = [
        'Employee ID',
        'Employee Name',
        'Department',
        'Role',
        'Tenure (Years)',
        'Annual CTC (INR)',
        'Market Ratio',
        'Overtime (Hours/Mo)',
        'Last Promotion (Months Ago)',
        'Satisfaction Score (1-10)',
        'Performance Rating (1-5)',
        'Flight Risk Score (%)',
        'Risk Tier',
        'Quadrant Title',
        'Primary Drivers'
      ];
      const rows = [headers.join(',')];
      matrixFilteredEmployees.forEach(emp => {
        const drivers = (emp.primaryDrivers || []).join('; ');
        const row = [
          `"${(emp.id || '').replace(/"/g, '""')}"`,
          `"${(emp.name || '').replace(/"/g, '""')}"`,
          `"${(emp.department || '').replace(/"/g, '""')}"`,
          `"${(emp.role || '').replace(/"/g, '""')}"`,
          emp.tenureYears ?? '',
          emp.salary ?? '',
          emp.salaryMarketRatio ?? '',
          emp.overtimeHoursMonth ?? '',
          emp.lastPromotionMonths ?? '',
          emp.satisfactionScore ?? '',
          emp.performanceRating ?? '',
          emp.riskScore ?? '',
          `"${(emp.riskTier || '').replace(/"/g, '""')}"`,
          `"${(currentMatrixQuadrant?.title || '').replace(/"/g, '""')}"`,
          `"${drivers.replace(/"/g, '""')}"`
        ];
        rows.push(row.join(','));
      });
      const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const quadSlug = (currentMatrixQuadrant?.title || 'Cohort').replace(/[^a-zA-Z0-9]/g, '_');
      link.setAttribute('href', url);
      link.setAttribute('download', `RetentionAI_${quadSlug}_Cohort_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast(`Exported ${matrixFilteredEmployees.length} personnel to CSV.`);
    } catch (err) {
      console.error('Export failed:', err);
      showToast('Failed to export cohort CSV.');
    }
  };

  const renderCohortTable = (isModal = false) => {
    if (!currentMatrixQuadrant) {
      return (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
          No quadrant data loaded.
        </div>
      );
    }

    return (
      <div className={`cohort-roster-section ${isModal ? 'in-modal' : ''}`}>
        {/* Controls Bar */}
        <div className="matrix-roster-controls">
          <div className="matrix-roster-search-group">
            <div className="search-box" style={{ maxWidth: 280, position: 'relative' }}>
              <Search size={15} />
              <input 
                type="text" 
                placeholder="Search by name, role, ID..."
                value={matrixSearchQuery}
                onChange={(e) => setMatrixSearchQuery(e.target.value)}
              />
              {matrixSearchQuery && (
                <button 
                  className="search-clear-btn" 
                  onClick={() => setMatrixSearchQuery('')}
                  title="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="filter-select-wrapper">
              <select 
                className="filter-select"
                value={matrixRiskFilter}
                onChange={(e) => setMatrixRiskFilter(e.target.value)}
                style={{ padding: '7px 12px', fontSize: '0.82rem' }}
              >
                <option value="All">All Risk Tiers</option>
                <option value="Critical">Critical Risk (≥80%)</option>
                <option value="High">High Risk (60-79%)</option>
                <option value="Medium">Medium Risk (35-59%)</option>
                <option value="Low">Low Risk (&lt;35%)</option>
              </select>
            </div>
          </div>

          <div className="matrix-roster-actions">
            <button 
              className="btn-secondary"
              onClick={handleExportMatrixCohortCSV}
              title="Download cohort roster as CSV"
              style={{ padding: '7px 12px', fontSize: '0.82rem' }}
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>

            {!isModal && (
              <button 
                className="btn-secondary"
                onClick={() => setIsCohortModalOpen(true)}
                title="Open Expanded Focus Modal"
                style={{ padding: '7px 12px', fontSize: '0.82rem' }}
              >
                <LayoutGrid size={14} />
                <span>Focus Modal</span>
              </button>
            )}

            {isModal && (
              <button 
                className="btn-secondary" 
                onClick={() => {
                  if (matrixDeptFilter && matrixDeptFilter !== 'All') {
                    setDeptFilter(matrixDeptFilter);
                  }
                  setIsCohortModalOpen(false);
                  navigateTo('directory');
                }}
                title="Open Cohort in Directory Tab"
                style={{ padding: '7px 12px', fontSize: '0.82rem' }}
              >
                <Users size={14} />
                <span>View in Directory</span>
              </button>
            )}
          </div>
        </div>

        {/* Table Wrap */}
        <div className={`table-responsive ${isModal ? 'cohort-table-wrap' : 'matrix-table-wrap'}`}>
          <table className="enterprise-table">
            <thead>
              <tr>
                <th 
                  className="sortable" 
                  onClick={() => handleMatrixSort('name')}
                  title="Sort by Employee Name"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>Employee</span>
                    <ArrowUpDown size={12} color={matrixSortCol === 'name' ? 'var(--accent-primary)' : 'var(--text-faint)'} />
                  </div>
                </th>
                <th 
                  className="sortable" 
                  onClick={() => handleMatrixSort('role')}
                  title="Sort by Role"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>Department & Role</span>
                    <ArrowUpDown size={12} color={matrixSortCol === 'role' ? 'var(--accent-primary)' : 'var(--text-faint)'} />
                  </div>
                </th>
                <th 
                  className="sortable" 
                  onClick={() => handleMatrixSort('riskScore')}
                  title="Sort by Risk Probability"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>Flight Risk</span>
                    <ArrowUpDown size={12} color={matrixSortCol === 'riskScore' ? 'var(--accent-primary)' : 'var(--text-faint)'} />
                  </div>
                </th>
                <th 
                  className="sortable" 
                  onClick={() => handleMatrixSort('salary')}
                  title="Sort by Base CTC"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>Base CTC & Market</span>
                    <ArrowUpDown size={12} color={matrixSortCol === 'salary' ? 'var(--accent-primary)' : 'var(--text-faint)'} />
                  </div>
                </th>
                <th 
                  className="sortable" 
                  onClick={() => handleMatrixSort('overtimeHoursMonth')}
                  title="Sort by Monthly Overtime"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>Overtime / Mo</span>
                    <ArrowUpDown size={12} color={matrixSortCol === 'overtimeHoursMonth' ? 'var(--accent-primary)' : 'var(--text-faint)'} />
                  </div>
                </th>
                <th 
                  className="sortable" 
                  onClick={() => handleMatrixSort('lastPromotionMonths')}
                  title="Sort by Last Promotion Stagnation"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>Last Promotion</span>
                    <ArrowUpDown size={12} color={matrixSortCol === 'lastPromotionMonths' ? 'var(--accent-primary)' : 'var(--text-faint)'} />
                  </div>
                </th>
                <th>Primary Flight Drivers</th>
                <th style={{ textAlign: 'right' }}>Interventions</th>
              </tr>
            </thead>
            <tbody>
              {matrixPaginatedEmployees.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <AlertTriangle size={24} color="#f59e0b" />
                      <span style={{ fontWeight: 600 }}>No personnel match the filter criteria in this quadrant.</span>
                      <button 
                        className="btn-secondary" 
                        style={{ marginTop: 6, fontSize: '0.78rem' }}
                        onClick={() => {
                          setMatrixSearchQuery('');
                          setMatrixRiskFilter('All');
                        }}
                      >
                        Reset Cohort Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                matrixPaginatedEmployees.map((emp) => (
                  <tr key={emp.id}>
                    <td>
                      <div className="emp-cell">
                        <img src={emp.avatar} alt={emp.name} className="table-avatar" />
                        <div>
                          <div 
                            className="emp-name" 
                            title="Click to view dossier"
                            onClick={() => { 
                              setSelectedEmployee(emp); 
                              setIsModalOpen(true); 
                            }}
                          >
                            {emp.name}
                          </div>
                          <div className="emp-id">{emp.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{emp.role}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.department}</div>
                    </td>
                    <td>
                      <span className={`risk-badge ${emp.riskTier === 'Critical' ? 'critical' : emp.riskTier === 'High' ? 'high' : emp.riskTier === 'Medium' ? 'medium' : 'low'}`}>
                        {emp.riskScore}% ({emp.riskTier})
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                        ₹{(emp.salary / 100000).toFixed(1)} LPA
                      </div>
                      <div style={{ 
                        fontSize: '0.72rem', 
                        fontWeight: 600,
                        color: emp.salaryMarketRatio < 0.85 ? '#fb7185' : emp.salaryMarketRatio < 1.0 ? '#facc15' : '#34d399' 
                      }}>
                        {Math.round(emp.salaryMarketRatio * 100)}% of market
                      </div>
                    </td>
                    <td>
                      <span style={{ 
                        color: emp.overtimeHoursMonth > 20 ? '#fb7185' : 'inherit', 
                        fontWeight: emp.overtimeHoursMonth > 20 ? 700 : 500 
                      }}>
                        {emp.overtimeHoursMonth} hrs
                      </span>
                    </td>
                    <td>
                      <span style={{ 
                        color: emp.lastPromotionMonths >= 36 ? '#eab308' : 'inherit',
                        fontWeight: emp.lastPromotionMonths >= 36 ? 700 : 400
                      }}>
                        {emp.lastPromotionMonths} mos ago
                      </span>
                    </td>
                    <td>
                      <div className="driver-tags">
                        {(emp.primaryDrivers || []).slice(0, 2).map((d, i) => (
                          <span key={i} className="driver-tag">
                            {d}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                        <button 
                          className="btn-action-trigger"
                          title="Generate 1-on-1 Plan with AI Copilot"
                          onClick={() => {
                            if (isModal) setIsCohortModalOpen(false);
                            askCopilotAboutEmployee(emp);
                          }}
                        >
                          <Sparkles size={13} />
                          <span>Copilot</span>
                        </button>
                        <button 
                          className="btn-action-trigger"
                          title="Test Levers in What-If Simulator"
                          onClick={() => {
                            if (isModal) setIsCohortModalOpen(false);
                            setSimTargetEmp(emp);
                            navigateTo('simulator');
                          }}
                        >
                          <Sliders size={13} />
                          <span>Simulate</span>
                        </button>
                        <button 
                          className="icon-btn"
                          title="View Profile Dossier"
                          onClick={() => {
                            setSelectedEmployee(emp);
                            setIsModalOpen(true);
                          }}
                          style={{ width: 30, height: 30 }}
                        >
                          <UserCheck size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="table-pagination-bar">
          <div className="pagination-info">
            <span>
              Showing <strong>{matrixFilteredEmployees.length === 0 ? 0 : (matrixPage - 1) * matrixPageSize + 1}</strong>–<strong>{Math.min(matrixPage * matrixPageSize, matrixFilteredEmployees.length)}</strong> of <strong>{matrixFilteredEmployees.length}</strong> personnel in cohort
            </span>
            <div className="pagination-page-size">
              <span>Show:</span>
              <select 
                className="pagination-select"
                value={matrixPageSize}
                onChange={(e) => setMatrixPageSize(Number(e.target.value))}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="pagination-nav">
            <button 
              className="pagination-btn"
              onClick={() => setMatrixPage(1)}
              disabled={matrixPage === 1}
              title="First Page"
            >
              <ChevronsLeft size={16} />
            </button>
            <button 
              className="pagination-btn"
              onClick={() => setMatrixPage(prev => Math.max(1, prev - 1))}
              disabled={matrixPage === 1}
              title="Previous Page"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="pagination-numbers">
              {getMatrixPageNumbers().map((p, idx) => {
                if (typeof p === 'string') {
                  return <span key={`matrix-ellipsis-${idx}`} className="pagination-ellipsis">...</span>;
                }
                return (
                  <button
                    key={`matrix-page-${p}`}
                    className={`pagination-num-btn ${p === matrixPage ? 'active' : ''}`}
                    onClick={() => setMatrixPage(p)}
                  >
                    {p}
                  </button>
                );
              })}
            </div>

            <button 
              className="pagination-btn"
              onClick={() => setMatrixPage(prev => Math.min(matrixTotalPages, prev + 1))}
              disabled={matrixPage === matrixTotalPages || matrixFilteredEmployees.length === 0}
              title="Next Page"
            >
              <ChevronRight size={16} />
            </button>
            <button 
              className="pagination-btn"
              onClick={() => setMatrixPage(matrixTotalPages)}
              disabled={matrixPage === matrixTotalPages || matrixFilteredEmployees.length === 0}
              title="Last Page"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Notification & Risk Anomaly Alert State
  const [alertsData, setAlertsData] = useState([]);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [alertCategory, setAlertCategory] = useState('All');
  const alertsDropdownRef = useRef(null);

  const unreadAlertsCount = useMemo(() => {
    return alertsData.filter(a => !a.read).length;
  }, [alertsData]);

  // Click outside to close notifications dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (alertsDropdownRef.current && !alertsDropdownRef.current.contains(e.target)) {
        setIsAlertsOpen(false);
      }
    };
    if (isAlertsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAlertsOpen]);

  const handleMarkAllAlertsRead = () => {
    setAlertsData(prev => prev.map(a => ({ ...a, read: true })));
    showToast('All risk alerts marked as acknowledged');
  };

  const handleDismissAlert = (id, e) => {
    e.stopPropagation();
    setAlertsData(prev => prev.filter(a => a.id !== id));
  };

  // Workflow Automation State
  const [scheduleModalEmp, setScheduleModalEmp] = useState(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [meetingDate, setMeetingDate] = useState('Tomorrow at 10:30 AM');
  const [talkingPointsEmp, setTalkingPointsEmp] = useState(null);
  const [talkingPointsData, setTalkingPointsData] = useState(null);
  const [isTalkingPointsOpen, setIsTalkingPointsOpen] = useState(false);
  const [isCommittingPlan, setIsCommittingPlan] = useState(false);

  // Commit Simulated Retention Package
  const handleCommitSimulationPlan = async () => {
    if (!simTargetEmp || isCommittingPlan) return;
    setIsCommittingPlan(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/interventions/commit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: simTargetEmp.id,
          salary_delta_pct: simSalaryDelta,
          overtime_hours: simOvertimeHours,
          remote_days: simRemoteDays,
          promotion_fast_track: simPromotionStatus,
          bonus_inr: simBonusAmount,
          status: 'Approved'
        })
      });

      if (res.ok) {
        const data = await res.json();
        const committedRecord = data.intervention;
        
        // Add to committed plans
        setCommittedPlans(prev => [committedRecord, ...prev]);

        // Update employee in state
        setEmployees(prev => prev.map(e => e.id === simTargetEmp.id ? {
          ...e,
          riskScore: committedRecord.riskAfter,
          riskTier: committedRecord.riskAfter < 35 ? 'Low' : committedRecord.riskAfter < 60 ? 'Medium' : 'High',
          status: 'Mitigation Active'
        } : e));

        showToast(`⚡ Retention plan for ${simTargetEmp.name} committed! Risk reduced to ${committedRecord.riskAfter}%.`);
        navigateTo('interventions');
      } else {
        throw new Error('Failed to commit intervention');
      }
    } catch (e) {
      // Offline fallback commitment
      const simulatedScore = Math.max(6, simTargetEmp.riskScore - 35);
      const fallbackRecord = {
        id: `INT-${100 + committedPlans.length + 1}`,
        empId: simTargetEmp.id,
        name: simTargetEmp.name,
        department: simTargetEmp.department,
        role: simTargetEmp.role,
        action: `+${simSalaryDelta}% Merit Raise, ${simOvertimeHours}h OT Cap, ${simRemoteDays} Remote Days`,
        costInr: Math.round(simTargetEmp.salary * (simSalaryDelta / 100) + simBonusAmount),
        riskBefore: simTargetEmp.riskScore,
        riskAfter: simulatedScore,
        date: "Just now",
        status: "Approved",
        roiMultiplier: "4.2x",
        notes: "Committed retention package via What-If simulator."
      };
      setCommittedPlans(prev => [fallbackRecord, ...prev]);
      showToast(`⚡ Retention plan for ${simTargetEmp.name} committed!`);
      navigateTo('interventions');
    } finally {
      setIsCommittingPlan(false);
    }
  };

  // Open 1-on-1 scheduler
  const handleOpenScheduleModal = (emp) => {
    setScheduleModalEmp(emp);
    setIsScheduleModalOpen(true);
    setIsModalOpen(false);
  };

  // Confirm schedule 1-on-1 meeting
  const handleConfirmSchedule = async () => {
    if (!scheduleModalEmp) return;
    try {
      await fetch(`${API_BASE_URL}/api/workflow/schedule-meeting`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: scheduleModalEmp.id,
          meeting_date: meetingDate
        })
      });
    } catch (e) {
      // graceful fallback
    }
    showToast(`📅 1-on-1 Retention Review scheduled for ${scheduleModalEmp.name} on ${meetingDate}`);
    setIsScheduleModalOpen(false);
  };

  // Open Manager Talking Points
  const handleOpenTalkingPoints = async (emp) => {
    setTalkingPointsEmp(emp);
    setIsModalOpen(false);
    setIsTalkingPointsOpen(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/workflow/talking-points/${emp.id}`);
      if (res.ok) {
        const data = await res.json();
        setTalkingPointsData(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch Live Data from Backend on Load
  useEffect(() => {
    const fetchLiveData = async () => {
      try {
        const [kpiRes, deptRes, empRes, metRes, matRes, alertsRes, intervRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/kpis`).then(r => r.ok ? r.json() : null),
          fetch(`${API_BASE_URL}/api/departments`).then(r => r.ok ? r.json() : null),
          fetch(`${API_BASE_URL}/api/employees?limit=1470`).then(r => r.ok ? r.json() : null),
          fetch(`${API_BASE_URL}/api/model/metrics`).then(r => r.ok ? r.json() : null),
          fetch(`${API_BASE_URL}/api/matrix`).then(r => r.ok ? r.json() : null),
          fetch(`${API_BASE_URL}/api/alerts`).then(r => r.ok ? r.json() : null),
          fetch(`${API_BASE_URL}/api/interventions`).then(r => r.ok ? r.json() : null),
        ]);

        if (kpiRes) {
          setKpiData(kpiRes);
          setIsBackendConnected(true);
        }
        if (matRes) {
          setMatrixData(matRes);
        }
        if (alertsRes && alertsRes.alerts) {
          setAlertsData(alertsRes.alerts);
        }
        if (intervRes && intervRes.interventions) {
          setCommittedPlans(intervRes.interventions);
        }
        if (deptRes && deptRes.length > 0) {
          setDepartmentData(deptRes);
        }
        if (empRes && empRes.data && empRes.data.length > 0) {
          setEmployees(empRes.data);
          setSimTargetEmp(empRes.data[0]);
        }
        if (metRes && metRes.metrics) {
          setModelMetrics({
            activeModel: metRes.active_model || "Soft-Voting Ensemble (Champion)",
            trainedOn: `${metRes.trained_records.toLocaleString()} Verified Records (${metRes.total_features} Features)`,
            accuracy: `${metRes.metrics.accuracy}%`,
            rocAuc: `${metRes.metrics.roc_auc}`,
            precision: `${metRes.metrics.precision}%`,
            recall: `${metRes.metrics.recall}%`,
            f1Score: `${metRes.metrics.f1_score}%`,
            topFeatures: metRes.top_features || MODEL_BENCHMARKS.topFeatures,
            confusionMatrix: {
              truePositive: metRes.metrics.confusion_matrix.true_positive,
              falsePositive: metRes.metrics.confusion_matrix.false_positive,
              trueNegative: metRes.metrics.confusion_matrix.true_negative,
              falseNegative: metRes.metrics.confusion_matrix.false_negative
            }
          });
        }
      } catch (err) {
        console.warn("Using offline state fallback:", err);
      }
    };
    fetchLiveData();
  }, []);

  // Live simulation API call
  useEffect(() => {
    if (!simTargetEmp) return;
    const triggerSimulate = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/predict/simulate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employee_id: simTargetEmp.id,
            salary_delta_pct: simSalaryDelta,
            overtime_hours: simOvertimeHours,
            remote_days: simRemoteDays,
            promotion_fast_track: simPromotionStatus,
            bonus_inr: simBonusAmount
          })
        });
        if (res.ok) {
          const data = await res.json();
          setLiveSimResult(data);
        }
      } catch (e) {
        // Fallback handled in computed
      }
    };
    const timer = setTimeout(triggerSimulate, 150);
    return () => clearTimeout(timer);
  }, [simTargetEmp, simSalaryDelta, simOvertimeHours, simRemoteDays, simPromotionStatus, simBonusAmount]);

  // Toggle Theme
  const toggleTheme = () => {
    const newDark = !isDarkMode;
    setIsDarkMode(newDark);
    localStorage.setItem('retentionai_theme', newDark ? 'dark' : 'light');
  };

  // Filtered employees for directory
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesSearch = 
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDept = deptFilter === 'All' || emp.department === deptFilter;
      const matchesRisk = riskFilter === 'All' || emp.riskTier === riskFilter;
      return matchesSearch && matchesDept && matchesRisk;
    });
  }, [employees, searchQuery, deptFilter, riskFilter]);

  // Reset directory pagination when filters change
  useEffect(() => {
    setDirPage(1);
  }, [searchQuery, deptFilter, riskFilter]);

  // Paginated employees for directory view
  const totalDirPages = Math.max(1, Math.ceil(filteredEmployees.length / dirPageSize));
  const paginatedEmployees = useMemo(() => {
    const startIndex = (dirPage - 1) * dirPageSize;
    return filteredEmployees.slice(startIndex, startIndex + dirPageSize);
  }, [filteredEmployees, dirPage, dirPageSize]);

  // Generate pagination button sequence with ellipsis
  const getDirPageNumbers = () => {
    const pages = [];
    const maxButtons = 5;
    if (totalDirPages <= maxButtons + 2) {
      for (let i = 1; i <= totalDirPages; i++) pages.push(i);
    } else {
      pages.push(1);
      let start = Math.max(2, dirPage - 1);
      let end = Math.min(totalDirPages - 1, dirPage + 1);

      if (dirPage <= 3) {
        start = 2;
        end = 4;
      } else if (dirPage >= totalDirPages - 2) {
        start = totalDirPages - 3;
        end = totalDirPages - 1;
      }

      if (start > 2) pages.push('ellipsis-start');
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalDirPages - 1) pages.push('ellipsis-end');
      pages.push(totalDirPages);
    }
    return pages;
  };

  // Computed / Fallback Risk Calculation
  const simulatedRisk = useMemo(() => {
    if (liveSimResult) {
      return {
        score: liveSimResult.simulated_risk_score,
        tier: liveSimResult.simulated_risk_tier,
        delta: liveSimResult.risk_reduced_points,
        costSavings: liveSimResult.replacement_cost_avoided_inr
      };
    }
    if (!simTargetEmp) return { score: 50, tier: 'Medium', costSavings: 0, delta: 0 };
    
    let baseScore = simTargetEmp.riskScore;
    const salaryImpact = (simSalaryDelta - 0) * 1.8;
    const otDiff = simTargetEmp.overtimeHoursMonth - simOvertimeHours;
    const otImpact = otDiff * 0.9;
    const remoteDiff = simRemoteDays - 2;
    const remoteImpact = remoteDiff * 4.0;
    const promoImpact = simPromotionStatus ? 14 : 0;
    const bonusImpact = (simBonusAmount / 50000) * 1.5;

    let computedScore = Math.round(baseScore - salaryImpact - otImpact - remoteImpact - promoImpact - bonusImpact);
    computedScore = Math.max(6, Math.min(95, computedScore));

    let tier = 'Low';
    if (computedScore >= 75) tier = 'Critical';
    else if (computedScore >= 60) tier = 'High';
    else if (computedScore >= 35) tier = 'Medium';

    const replacementCost = Math.round(simTargetEmp.salary * 1.5);
    const costSavings = Math.round(replacementCost * ((baseScore - computedScore) / 100));

    return {
      score: computedScore,
      tier,
      delta: Math.max(0, baseScore - computedScore),
      costSavings
    };
  }, [liveSimResult, simTargetEmp, simSalaryDelta, simOvertimeHours, simRemoteDays, simPromotionStatus, simBonusAmount]);

  // Handle Apply Intervention to Live State
  const applyIntervention = (empId) => {
    setEmployees(prev => prev.map(e => {
      if (e.id === empId) {
        return {
          ...e,
          riskScore: simulatedRisk.score,
          riskTier: simulatedRisk.tier,
          status: 'Intervention Plan Active'
        };
      }
      return e;
    }));

    // Add to committed plans
    if (simTargetEmp) {
      setCommittedPlans(prev => [
        {
          id: `INT-${Date.now().toString().slice(-4)}`,
          empId: simTargetEmp.id,
          name: simTargetEmp.name,
          department: simTargetEmp.department,
          role: simTargetEmp.role,
          action: `Compensation Calibration (+${simSalaryDelta}%) & OT Cap (${simOvertimeHours}h)`,
          costInr: Math.round(simTargetEmp.salary * (simSalaryDelta / 100)) + simBonusAmount,
          riskBefore: simTargetEmp.riskScore,
          riskAfter: simulatedRisk.score,
          date: "Just now",
          status: "Approved"
        },
        ...prev
      ]);
    }

    showToast(`Retention plan committed for ${simTargetEmp.name}! Risk reduced by ${simRiskDelta} pts.`);
  };

  const simRiskDelta = simTargetEmp ? simTargetEmp.riskScore - simulatedRisk.score : 0;
  const highRiskCount = employees.filter(e => e.riskTier === 'Critical' || e.riskTier === 'High').length;

  // Render Risk Tier Badge
  const renderRiskBadge = (tier, score) => {
    const tierClass = tier.toLowerCase();
    return (
      <span className={`risk-badge ${tierClass}`}>
        <span className="dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }}></span>
        {tier} {score ? `(${score}%)` : ''}
      </span>
    );
  };

  return (
    <div className={`app-container ${!isDarkMode ? 'light-theme' : ''}`}>
      {/* Toast Notification */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: 24,
          right: 24,
          zIndex: 9999,
          background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: 12,
          boxShadow: '0 10px 25px rgba(79, 70, 229, 0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontWeight: 600,
          fontSize: '0.9rem'
        }}>
          <Sparkles size={18} />
          {notification}
        </div>
      )}

      {/* Mobile Drawer Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="mobile-nav-backdrop" 
          onClick={() => setIsMobileMenuOpen(false)}
          aria-label="Close navigation overlay"
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="brand-wrapper">
          <div 
            style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
            onClick={() => navigateTo(currentRoleConfig.defaultTab)}
            title="Go to Home"
          >
            <div className="brand-icon-box">
              {/* RetentionAI custom SVG logo mark */}
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="RetentionAI logo">
                {/* Connection lines */}
                <line x1="13" y1="4" x2="4" y2="20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
                <line x1="13" y1="4" x2="22" y2="20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
                <line x1="4" y1="20" x2="22" y2="20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
                <line x1="13" y1="4" x2="13" y2="20" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.3" strokeDasharray="2 2"/>
                {/* Nodes */}
                <circle cx="13" cy="4" r="3" fill="currentColor"/>
                <circle cx="4" cy="20" r="2.5" fill="currentColor" opacity="0.75"/>
                <circle cx="22" cy="20" r="2.5" fill="currentColor" opacity="0.75"/>
                {/* Center pulse arc — represents monitoring */}
                <path d="M9 13 Q13 9 17 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.9"/>
              </svg>
            </div>
            <div className="brand-text">
              <h1>RetentionAI</h1>
              <span>Enterprise ML Platform</span>
            </div>
          </div>
          <button 
            className="mobile-drawer-close" 
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Role Selector */}
        <div className="role-badge-box">
          <div className="role-badge-label">
            <span>Current Role Perspective</span>
            <UserCheck size={14} />
          </div>
          <select 
            className="role-select"
            value={activeRole}
            onChange={(e) => handleRoleChange(e.target.value)}
          >
            <option value="HR Executive">HR Executive / People Ops</option>
            <option value="Team Lead">Team Lead / Engineering Mgr</option>
            <option value="Data Analyst">Data Scientist / ML Ops</option>
          </select>
        </div>

        {/* Navigation Menu (Filtered by RBAC Role) */}
        <nav className="nav-section">
          <div className="nav-section-title">
            {activeRole === 'Data Analyst' ? 'ML Intelligence & Diagnostics' : activeRole === 'Team Lead' ? 'Team Mitigation Ops' : 'Workforce Intelligence'}
          </div>
          
          {isTabAllowed('dashboard') && (
            <button 
              className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => navigateTo('dashboard')}
            >
              <div className="nav-item-content">
                <BarChart3 size={18} />
                <span>Executive Dashboard</span>
              </div>
            </button>
          )}

          {isTabAllowed('directory') && (
            <button 
              className={`nav-item ${activeTab === 'directory' ? 'active' : ''}`}
              onClick={() => navigateTo('directory')}
            >
              <div className="nav-item-content">
                <Users size={18} />
                <span>{activeRole === 'Team Lead' ? 'Team Risk Explorer' : activeRole === 'Data Analyst' ? 'Diagnostic Records' : 'Flight Risk Explorer'}</span>
              </div>
              <span className="nav-pill">{highRiskCount} Risk</span>
            </button>
          )}

          {isTabAllowed('departments') && (
            <button 
              className={`nav-item ${activeTab === 'departments' ? 'active' : ''}`}
              onClick={() => navigateTo('departments')}
            >
              <div className="nav-item-content">
                <Building2 size={18} />
                <span>Department Radar</span>
              </div>
            </button>
          )}

          {isTabAllowed('matrix') && (
            <button 
              className={`nav-item ${activeTab === 'matrix' ? 'active' : ''}`}
              onClick={() => navigateTo('matrix')}
            >
              <div className="nav-item-content">
                <LayoutGrid size={18} />
                <span>Talent 9-Box Matrix</span>
              </div>
              <span className="nav-pill" style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#f472b6', borderColor: 'rgba(236, 72, 153, 0.3)' }}>9-Box</span>
            </button>
          )}

          {isTabAllowed('simulator') && (
            <button 
              className={`nav-item ${activeTab === 'simulator' ? 'active' : ''}`}
              onClick={() => navigateTo('simulator')}
            >
              <div className="nav-item-content">
                <Sliders size={18} />
                <span>What-If Simulator</span>
              </div>
              <span className="nav-pill live">AI Live</span>
            </button>
          )}

          {(isTabAllowed('playbook') || isTabAllowed('interventions') || isTabAllowed('models')) && (
            <div className="nav-section-title" style={{ marginTop: 14 }}>
              {activeRole === 'Data Analyst' ? 'Model Governance' : 'Strategy & Action'}
            </div>
          )}
          
          {isTabAllowed('playbook') && (
            <button 
              className={`nav-item ${activeTab === 'playbook' ? 'active' : ''}`}
              onClick={() => navigateTo('playbook')}
            >
              <div className="nav-item-content">
                <Lightbulb size={18} />
                <span>Retention Playbook</span>
              </div>
            </button>
          )}

          {isTabAllowed('interventions') && (
            <button 
              className={`nav-item ${activeTab === 'interventions' ? 'active' : ''}`}
              onClick={() => navigateTo('interventions')}
            >
              <div className="nav-item-content">
                <CheckSquare size={18} />
                <span>{activeRole === 'Team Lead' ? 'Propose Retention Plan' : 'Intervention Tracker'}</span>
              </div>
              <span className="nav-pill live">{committedPlans.length} Active</span>
            </button>
          )}

          {isTabAllowed('models') && (
            <button 
              className={`nav-item ${activeTab === 'models' ? 'active' : ''}`}
              onClick={() => navigateTo('models')}
            >
              <div className="nav-item-content">
                <Cpu size={18} />
                <span>ML Model & Benchmarks</span>
              </div>
            </button>
          )}
        </nav>
      </aside>

      {/* Main Container */}
      <main className="main-content">
        {/* Top Header Bar */}
        <header className="top-header">
          <div className="header-left-wrap">
            <button 
              className="mobile-menu-btn" 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="header-left">
              <h2 className="page-title">
                {activeTab === 'dashboard' && 'Workforce Attrition Overview'}
                {activeTab === 'directory' && (activeRole === 'Team Lead' ? 'Team Member Risk Assessment' : activeRole === 'Data Analyst' ? 'Model Test Sample Diagnostics' : 'Employee Risk Explorer')}
                {activeTab === 'departments' && 'Departmental Risk Distribution'}
                {activeTab === 'matrix' && 'Talent Retention Matrix (Performance vs Flight Risk)'}
                {activeTab === 'simulator' && 'AI What-If Retention Simulator'}
                {activeTab === 'playbook' && 'Prescriptive Retention Playbook'}
                {activeTab === 'interventions' && (activeRole === 'Team Lead' ? 'Submit Retention Interventions' : 'Mitigation Actions & ROI Log')}
                {activeTab === 'models' && 'Champion ML Architecture & Benchmarks'}
              </h2>
            </div>
          </div>

          <div className="search-box">
            <Search size={16} />
            <input 
              type="text" 
              placeholder="Search employee, ID, role or department..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="header-right">
            <button 
              className="header-copilot-btn" 
              onClick={() => setIsCopilotOpen(true)}
              title="Open AI Retention Copilot"
            >
              <Sparkles size={15} />
              <span>Ask Copilot</span>
            </button>
            <button className="icon-btn" onClick={toggleTheme} title="Toggle Dark/Light Mode">
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {/* Live Notification & Risk Anomaly Dropdown */}
            <div className="notif-center-wrapper" ref={alertsDropdownRef}>
              <button 
                className={`icon-btn notif-bell-btn ${isAlertsOpen ? 'active' : ''}`}
                onClick={() => setIsAlertsOpen(!isAlertsOpen)}
                title="Workforce Risk Anomaly Alerts"
                aria-label="Notifications"
              >
                <Bell size={18} />
                {unreadAlertsCount > 0 && (
                  <span className="notif-badge">
                    <span className="notif-ping"></span>
                    {unreadAlertsCount}
                  </span>
                )}
              </button>

              {isAlertsOpen && (
                <div className="notif-dropdown-menu">
                  <div className="notif-dropdown-header">
                    <div className="notif-header-title">
                      <Bell size={16} className="notif-title-icon" />
                      <h4>Risk Anomaly Center</h4>
                      {unreadAlertsCount > 0 && (
                        <span className="notif-count-pill">{unreadAlertsCount} Unread</span>
                      )}
                    </div>
                    {unreadAlertsCount > 0 && (
                      <button className="notif-mark-read-btn" onClick={handleMarkAllAlertsRead}>
                        Mark all read
                      </button>
                    )}
                  </div>

                  {/* Category Filter Chips */}
                  <div className="notif-categories-bar">
                    {['All', 'Flight Risk', 'Burnout', 'Compensation', 'Stagnation', 'Milestones'].map((cat) => (
                      <button
                        key={cat}
                        className={`notif-category-chip ${alertCategory === cat ? 'active' : ''}`}
                        onClick={() => setAlertCategory(cat)}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Alerts List */}
                  <div className="notif-feed-container">
                    {alertsData.filter(a => alertCategory === 'All' || a.category === alertCategory).length === 0 ? (
                      <div className="notif-empty-state">
                        <CheckCircle2 size={26} className="notif-empty-icon" />
                        <p>No active anomalies in this category.</p>
                      </div>
                    ) : (
                      alertsData.filter(a => alertCategory === 'All' || a.category === alertCategory).map((alert) => (
                        <div 
                          key={alert.id}
                          className={`notif-card ${alert.severity} ${alert.read ? 'read' : 'unread'}`}
                        >
                          <div className="notif-card-top">
                            <div className="notif-badge-group">
                              <span className={`notif-sev-tag ${alert.severity}`}>
                                {alert.category}
                              </span>
                              {alert.department && (
                                <span className="notif-dept-tag">{alert.department}</span>
                              )}
                            </div>
                            <div className="notif-meta-right">
                              <span className="notif-time">{alert.timestamp}</span>
                              <button 
                                className="notif-dismiss-btn"
                                onClick={(e) => handleDismissAlert(alert.id, e)}
                                title="Dismiss notification"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          </div>

                          <h5 className="notif-title">{alert.title}</h5>
                          <p className="notif-msg">{alert.message}</p>

                          {/* Action Triggers */}
                          <div className="notif-actions-row">
                            {alert.employeeId ? (
                              <>
                                <button 
                                  className="notif-action-btn primary"
                                  onClick={() => {
                                    const emp = employees.find(e => e.id === alert.employeeId);
                                    if (emp) {
                                      setSelectedEmployee(emp);
                                      setIsModalOpen(true);
                                      setIsAlertsOpen(false);
                                    }
                                  }}
                                >
                                  <UserCheck size={12} />
                                  <span>View Dossier</span>
                                </button>
                                <button 
                                  className="notif-action-btn copilot"
                                  onClick={() => {
                                    const emp = employees.find(e => e.id === alert.employeeId);
                                    setIsAlertsOpen(false);
                                    if (emp) {
                                      askCopilotAboutEmployee(emp);
                                    } else {
                                      setIsCopilotOpen(true);
                                      handleSendCopilot(`Diagnose anomaly for ${alert.title}`);
                                    }
                                  }}
                                >
                                  <Sparkles size={12} />
                                  <span>Ask Copilot</span>
                                </button>
                                <button 
                                  className="notif-action-btn simulate"
                                  onClick={() => {
                                    const emp = employees.find(e => e.id === alert.employeeId);
                                    setIsAlertsOpen(false);
                                    if (emp) setSimTargetEmp(emp);
                                    navigateTo('simulator');
                                  }}
                                >
                                  <Sliders size={12} />
                                  <span>Simulate</span>
                                </button>
                              </>
                            ) : alert.department ? (
                              <>
                                <button 
                                  className="notif-action-btn primary"
                                  onClick={() => {
                                    setDeptFilter(alert.department);
                                    navigateTo('directory');
                                    setIsAlertsOpen(false);
                                  }}
                                >
                                  <Building2 size={12} />
                                  <span>Filter {alert.department}</span>
                                </button>
                                <button 
                                  className="notif-action-btn copilot"
                                  onClick={() => {
                                    setIsAlertsOpen(false);
                                    setIsCopilotOpen(true);
                                    handleSendCopilot(`Why is ${alert.department} experiencing high burnout?`);
                                  }}
                                >
                                  <Sparkles size={12} />
                                  <span>Diagnose in Copilot</span>
                                </button>
                              </>
                            ) : null}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="notif-dropdown-footer">
                    <span>Active Telemetry • 1,470 Records Scanned</span>
                  </div>
                </div>
              )}
            </div>
            <div className="user-profile-badge">
              <div className="user-avatar-emoji">
                {activeRole === 'HR Executive' ? <Briefcase size={16} /> : activeRole === 'Team Lead' ? <Users size={16} /> : <Cpu size={16} />}
              </div>
              <div className="user-profile-details">
                <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>{currentRoleConfig.badge}</div>
                <div style={{ fontSize: '0.72rem', color: '#818cf8', fontWeight: 600 }}>{activeRole}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Views */}
        <div className="content-body">
          {/* TAB 1: EXECUTIVE DASHBOARD */}
          {activeTab === 'dashboard' && (
            <>
              {/* KPI Cards Grid */}
              <div className="kpi-grid">
                <div className="kpi-card" style={{ '--card-accent': 'linear-gradient(90deg, #6366f1, #8b5cf6)' }}>
                  <div className="kpi-header">
                    <span>Workforce Attrition Risk</span>
                    <div className="kpi-icon"><TrendingUp size={18} /></div>
                  </div>
                  <div className="kpi-value-row">
                    <span className="kpi-value">{kpiData?.predicted_attrition_rate || "27.9%"}</span>
                    <span className="kpi-delta negative-good">
                      <ArrowDownRight size={14} /> -3.2% MoM
                    </span>
                  </div>
                  <span className="kpi-subtext">Calculated across {kpiData?.total_workforce || 1470} active team members</span>
                </div>

                <div className="kpi-card" style={{ '--card-accent': 'linear-gradient(90deg, #f43f5e, #fb7185)' }}>
                  <div className="kpi-header">
                    <span>Critical / High Flight Risk</span>
                    <div className="kpi-icon" style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e' }}>
                      <AlertTriangle size={18} />
                    </div>
                  </div>
                  <div className="kpi-value-row">
                    <span className="kpi-value">{kpiData?.high_risk_headcount || "166"}</span>
                    <span className="kpi-delta positive-bad">
                      <ArrowUpRight size={14} /> Urgent Attention
                    </span>
                  </div>
                  <span className="kpi-subtext">Immediate intervention recommended</span>
                </div>

                <div className="kpi-card" style={{ '--card-accent': 'linear-gradient(90deg, #06b6d4, #3b82f6)' }}>
                  <div className="kpi-header">
                    <span>Estimated Cost at Risk</span>
                    <div className="kpi-icon" style={{ background: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4' }}>
                      <IndianRupee size={18} />
                    </div>
                  </div>
                  <div className="kpi-value-row">
                    <span className="kpi-value">{kpiData?.cost_at_risk_formatted || "₹35.34 Cr"}</span>
                    <span className="kpi-delta negative-good">
                      <ArrowDownRight size={14} /> ₹2.4 Cr protected
                    </span>
                  </div>
                  <span className="kpi-subtext">Replacement & retraining turnover cost</span>
                </div>

                <div className="kpi-card" style={{ '--card-accent': 'linear-gradient(90deg, #10b981, #34d399)' }}>
                  <div className="kpi-header">
                    <span>Retention ROI Multiplier</span>
                    <div className="kpi-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                      <ShieldCheck size={18} />
                    </div>
                  </div>
                  <div className="kpi-value-row">
                    <span className="kpi-value">{kpiData?.retention_roi_multiplier || "4.8x"}</span>
                    <span className="kpi-delta negative-good">
                      <ArrowUpRight size={14} /> Top Quartile
                    </span>
                  </div>
                  <span className="kpi-subtext">Intervention savings vs compensation bump</span>
                </div>
              </div>

              {/* Main Charts Row */}
              <div className="grid-2-col">
                {/* Department Risk Distribution Chart */}
                <div className="chart-card">
                  <div className="card-title-row">
                    <h3 className="card-title">
                      <BarChart3 size={18} color="#6366f1" />
                      Departmental Flight Risk & High-Risk Headcount
                    </h3>
                    <button 
                      className="btn-secondary" 
                      style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                      onClick={() => navigateTo('departments')}
                    >
                      Deep Dive &rarr;
                    </button>
                  </div>
                  <div style={{ height: 300, width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={departmentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)"} />
                        <XAxis dataKey="department" stroke={isDarkMode ? "#64748b" : "#64748b"} fontSize={11} tickLine={false} />
                        <YAxis stroke={isDarkMode ? "#64748b" : "#64748b"} fontSize={12} tickLine={false} unit="%" />
                        <Tooltip 
                          cursor={{ fill: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(99, 102, 241, 0.08)', radius: 6 }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              const riskColor = data.avgRisk > 30 ? '#f43f5e' : data.avgRisk > 20 ? '#f59e0b' : '#10b981';
                              return (
                                <div style={{
                                  backgroundColor: isDarkMode ? '#0d1322' : '#ffffff',
                                  border: isDarkMode ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.08)',
                                  borderRadius: 12,
                                  padding: '12px 16px',
                                  boxShadow: isDarkMode 
                                    ? '0 12px 30px rgba(0,0,0,0.6)' 
                                    : '0 10px 25px -5px rgba(0,0,0,0.12), 0 8px 10px -6px rgba(0,0,0,0.08)',
                                  minWidth: 200,
                                  color: isDarkMode ? '#f1f5f9' : '#0f172a'
                                }}>
                                  <div style={{ 
                                    fontWeight: 700, 
                                    fontSize: '0.9rem', 
                                    marginBottom: 8,
                                    color: isDarkMode ? '#f8fafc' : '#0f172a',
                                    borderBottom: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
                                    paddingBottom: 6
                                  }}>
                                    {data.department}
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
                                    <span style={{ fontSize: '0.78rem', color: isDarkMode ? '#94a3b8' : '#64748b' }}>Avg Flight Risk:</span>
                                    <span style={{ fontWeight: 800, fontSize: '0.88rem', color: riskColor }}>
                                      {data.avgRisk}%
                                    </span>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                                    <span style={{ fontSize: '0.78rem', color: isDarkMode ? '#94a3b8' : '#64748b' }}>High-Risk Headcount:</span>
                                    <span style={{ 
                                      fontWeight: 700, 
                                      fontSize: '0.8rem', 
                                      color: data.highRiskCount > 0 ? (isDarkMode ? '#fb7185' : '#e11d48') : (isDarkMode ? '#34d399' : '#059669'),
                                      background: isDarkMode ? 'rgba(244, 63, 94, 0.12)' : 'rgba(244, 63, 94, 0.08)',
                                      padding: '2px 8px',
                                      borderRadius: 6
                                    }}>
                                      {data.highRiskCount} {data.headCount ? `/ ${data.headCount}` : ''}
                                    </span>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="avgRisk" radius={[6, 6, 0, 0]}>
                          {departmentData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.avgRisk > 30 ? '#f43f5e' : entry.avgRisk > 20 ? '#f59e0b' : '#10b981'} 
                              className="department-bar-cell"
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Real-time High Risk Feed */}
                <div className="chart-card">
                  <div className="card-title-row">
                    <h3 className="card-title">
                      <AlertTriangle size={18} color="#fb7185" />
                      Critical Attention Queue
                    </h3>
                    <button 
                      className="btn-secondary" 
                      style={{ padding: '4px 10px', fontSize: '0.75rem' }} 
                      onClick={() => {
                        setRiskFilter('Critical');
                        navigateTo('directory');
                      }}
                    >
                      View All ({highRiskCount})
                    </button>
                  </div>

                  <div className="risk-feed-list">
                    {employees.filter(e => e.riskTier === 'Critical' || e.riskTier === 'High').slice(0, 6).map(emp => (
                      <div 
                        key={emp.id} 
                        className="risk-feed-item"
                        onClick={() => {
                          setSelectedEmployee(emp);
                          setIsModalOpen(true);
                        }}
                      >
                        <div className="feed-emp-info">
                          <img src={emp.avatar} alt={emp.name} className="feed-emp-avatar" />
                          <div className="feed-emp-details">
                            <h4>{emp.name}</h4>
                            <p>{emp.role} • {emp.department}</p>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          {renderRiskBadge(emp.riskTier, emp.riskScore)}
                          <div style={{ fontSize: '0.72rem', color: '#818cf8', marginTop: 4 }}>
                            Inspect &rarr;
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: EMPLOYEE DIRECTORY & RISK EXPLORER */}
          {activeTab === 'directory' && (
            <div className="chart-card">
              <div className="toolbar-row">
                <div className="filter-group">
                  <select 
                    className="filter-select"
                    value={deptFilter}
                    onChange={(e) => setDeptFilter(e.target.value)}
                  >
                    <option value="All">All Departments</option>
                    <option value="Research & Development">Research & Development</option>
                    <option value="Sales">Sales</option>
                    <option value="Human Resources">Human Resources</option>
                  </select>

                  <select 
                    className="filter-select"
                    value={riskFilter}
                    onChange={(e) => setRiskFilter(e.target.value)}
                  >
                    <option value="All">All Risk Tiers</option>
                    <option value="Critical">Critical Risk (&gt;75%)</option>
                    <option value="High">High Risk (60-75%)</option>
                    <option value="Medium">Medium Risk (35-60%)</option>
                    <option value="Low">Low Risk (&lt;35%)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  {currentRoleConfig.canExportDossier ? (
                    <button 
                      className="btn-primary"
                      onClick={handleExportDossier}
                      title="Download Full Risk Dossier (CSV)"
                    >
                      <Download size={16} />
                      Export Risk Dossier
                    </button>
                  ) : (
                    <div className="rbac-scope-badge">
                      <ShieldCheck size={14} color="#818cf8" />
                      <span>{activeRole} Scoped View</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Table */}
              <div className="table-container" style={{ marginTop: 16 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Department & Role</th>
                      <th>Tenure / Compensation</th>
                      <th>Overtime (Mo)</th>
                      <th>Primary Flight Drivers</th>
                      <th>Risk Probability</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedEmployees.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--text-muted)' }}>
                          No personnel matched the active filter criteria.
                        </td>
                      </tr>
                    ) : (
                      paginatedEmployees.map(emp => (
                        <tr key={emp.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <img src={emp.avatar} alt={emp.name} style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }} />
                              <div>
                                <div style={{ fontWeight: 700 }}>{emp.name}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.id}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{emp.role}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.department}</div>
                          </td>
                          <td>
                            <div>{emp.tenureYears} Years</div>
                            <div style={{ fontSize: '0.75rem', color: emp.salaryMarketRatio < 0.9 ? '#fb7185' : '#34d399', fontWeight: 600 }}>
                              ₹{(emp.salary / 100000).toFixed(1)} LPA ({Math.round(emp.salaryMarketRatio * 100)}% market)
                            </div>
                          </td>
                          <td>
                            <span style={{ fontWeight: 600, color: emp.overtimeHoursMonth > 25 ? '#fb923c' : 'inherit' }}>
                              {emp.overtimeHoursMonth}h / mo
                            </span>
                          </td>
                          <td>
                            <div className="driver-tags">
                              {emp.primaryDrivers.map((driver, i) => (
                                <span key={i} className="driver-tag">{driver}</span>
                              ))}
                            </div>
                          </td>
                          <td>
                            {renderRiskBadge(emp.riskTier, emp.riskScore)}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button 
                                className="btn-secondary" 
                                style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                                onClick={() => {
                                  setSimTargetEmp(emp);
                                  navigateTo('simulator');
                                }}
                              >
                                <Sliders size={14} /> Simulate
                              </button>
                              <button 
                                className="btn-primary" 
                                style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                                onClick={() => {
                                  setSelectedEmployee(emp);
                                  setIsModalOpen(true);
                                }}
                              >
                                Details
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Interactive Pagination Bar */}
              <div className="table-pagination-bar">
                <div className="pagination-info">
                  <span>
                    Showing <strong>{filteredEmployees.length === 0 ? 0 : (dirPage - 1) * dirPageSize + 1}</strong>–<strong>{Math.min(dirPage * dirPageSize, filteredEmployees.length)}</strong> of <strong>{filteredEmployees.length}</strong> personnel (5 per page)
                  </span>
                </div>

                <div className="pagination-nav">
                  <button 
                    className="pagination-btn"
                    onClick={() => setDirPage(1)}
                    disabled={dirPage === 1}
                    title="First Page"
                  >
                    <ChevronsLeft size={16} />
                  </button>
                  <button 
                    className="pagination-btn"
                    onClick={() => setDirPage(prev => Math.max(1, prev - 1))}
                    disabled={dirPage === 1}
                    title="Previous Page"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <div className="pagination-numbers">
                    {getDirPageNumbers().map((p, idx) => {
                      if (typeof p === 'string') {
                        return <span key={idx} className="pagination-ellipsis">...</span>;
                      }
                      return (
                        <button
                          key={p}
                          className={`pagination-num-btn ${p === dirPage ? 'active' : ''}`}
                          onClick={() => setDirPage(p)}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>

                  <button 
                    className="pagination-btn"
                    onClick={() => setDirPage(prev => Math.min(totalDirPages, prev + 1))}
                    disabled={dirPage === totalDirPages || filteredEmployees.length === 0}
                    title="Next Page"
                  >
                    <ChevronRight size={16} />
                  </button>
                  <button 
                    className="pagination-btn"
                    onClick={() => setDirPage(totalDirPages)}
                    disabled={dirPage === totalDirPages || filteredEmployees.length === 0}
                    title="Last Page"
                  >
                    <ChevronsRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DEPARTMENT RADAR & CAPACITY */}
          {activeTab === 'departments' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div className="grid-3-col">
                {departmentData.map(d => (
                  <div key={d.department} className="chart-card">
                    <div className="card-title-row">
                      <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{d.department}</span>
                      <span className={`risk-badge ${d.avgRisk > 30 ? 'critical' : d.avgRisk > 20 ? 'medium' : 'low'}`}>
                        {d.avgRisk}% Risk
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, background: 'var(--bg-input)', padding: 12, borderRadius: 10 }}>
                      <div className="metric-pill">
                        <span>Total Headcount</span>
                        <span>{d.headCount} Employees</span>
                      </div>
                      <div className="metric-pill">
                        <span>High Flight Risk</span>
                        <span style={{ color: d.highRiskCount > 5 ? '#fb7185' : 'inherit' }}>{d.highRiskCount} Members</span>
                      </div>
                      <div className="metric-pill">
                        <span>Average CTC</span>
                        <span>₹{(d.avgSalary / 100000).toFixed(1)} LPA</span>
                      </div>
                      <div className="metric-pill">
                        <span>Attrition Forecast</span>
                        <span style={{ color: '#fb923c' }}>{d.attritionForecast}</span>
                      </div>
                    </div>

                    <button 
                      className="btn-secondary" 
                      style={{ justifyContent: 'center' }}
                      onClick={() => {
                        setDeptFilter(d.department);
                        navigateTo('directory');
                      }}
                    >
                      Filter {d.department} Team &rarr;
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: TALENT RETENTION 9-BOX MATRIX */}
          {activeTab === 'matrix' && (
            <div className="matrix-view-layout">
              {/* Matrix Top Summary KPI Bar */}
              <div className="matrix-kpi-banner">
                <div className="matrix-kpi-card urgent">
                  <div className="matrix-kpi-icon-wrap urgent-icon">
                    <Target size={22} />
                  </div>
                  <div className="matrix-kpi-details">
                    <div className="matrix-kpi-num">
                      {matrixData?.urgentHeadcount ?? 105}
                    </div>
                    <div className="matrix-kpi-lbl">Stars at Urgent Flight Risk</div>
                    <div className="matrix-kpi-sub">Immediate Retention Levers Needed</div>
                  </div>
                </div>

                <div className="matrix-kpi-card exposure">
                  <div className="matrix-kpi-icon-wrap exposure-icon">
                    <IndianRupee size={22} />
                  </div>
                  <div className="matrix-kpi-details">
                    <div className="matrix-kpi-num">
                      {matrixData?.totalCostFormatted ?? '₹35.34 Cr'}
                    </div>
                    <div className="matrix-kpi-lbl">Total High-Risk Financial Exposure</div>
                    <div className="matrix-kpi-sub">Projected Replacement & Lost IP Cost</div>
                  </div>
                </div>

                <div className="matrix-kpi-card safe">
                  <div className="matrix-kpi-icon-wrap safe-icon">
                    <ShieldCheck size={22} />
                  </div>
                  <div className="matrix-kpi-details">
                    <div className="matrix-kpi-num">
                      {matrixData?.quadrants?.find(q => q.id === 'high_perf_low_risk')?.count ?? 741}
                    </div>
                    <div className="matrix-kpi-lbl">Star Anchors (Low Risk)</div>
                    <div className="matrix-kpi-sub">High Performers with High Loyalty</div>
                  </div>
                </div>

                {/* Department Filter Controls */}
                <div className="matrix-kpi-card filter-card">
                  <div className="filter-card-header">
                    <div className="filter-header-left">
                      <Filter size={14} className="filter-icon" />
                      <span>Department Scope</span>
                    </div>
                    <span className="filter-active-label">
                      {matrixDeptFilter === 'All' ? '1,470 Records' : matrixDeptFilter === 'Research & Development' ? '961 Records' : matrixDeptFilter === 'Sales' ? '446 Records' : '63 Records'}
                    </span>
                  </div>
                  <div className="matrix-dept-pills-grid">
                    {[
                      { id: 'All', label: 'All', count: '1,470' },
                      { id: 'Sales', label: 'Sales', count: '446' },
                      { id: 'Research & Development', label: 'R&D', count: '961' },
                      { id: 'Human Resources', label: 'HR', count: '63' }
                    ].map(({ id, label, count }) => (
                      <button 
                        key={id}
                        type="button"
                        className={`matrix-dept-segment-btn ${matrixDeptFilter === id ? 'active' : ''}`}
                        onClick={() => setMatrixDeptFilter(id)}
                        title={`Filter by ${id} (${count} employees)`}
                      >
                        <span className="btn-dept-name">{label}</span>
                        <span className="btn-dept-count">{count}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3x3 Matrix Grid Container */}
              <div className="matrix-grid-section">
                <div className="matrix-section-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <LayoutGrid size={18} className="matrix-header-icon" />
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>
                      9-Box Talent Flight Risk Matrix
                    </h3>
                  </div>
                  <div className="matrix-axis-legend">
                    <div className="matrix-legend-item">
                      <span className="dot dot-urgent"></span>
                      <span>Urgent Flight Risk</span>
                    </div>
                    <div className="matrix-legend-item">
                      <span className="dot dot-warning"></span>
                      <span>Moderate / Under Strain</span>
                    </div>
                    <div className="matrix-legend-item">
                      <span className="dot dot-safe"></span>
                      <span>Safe / High Stability</span>
                    </div>
                  </div>
                </div>

                {/* 3x3 Grid Canvas with 2D Row and Column Headers */}
                <div className="matrix-canvas-wrapper">
                  {/* Top Column Labels (X-Axis: Flight Risk) */}
                  <div className="matrix-canvas-header">
                    <div className="matrix-axis-corner">
                      <span className="corner-y">Performance ↑</span>
                      <span className="corner-x">Risk →</span>
                    </div>
                    <div className="matrix-col-title low">
                      <span>Low Flight Risk (&lt;35%)</span>
                      <small>Stable & Retained</small>
                    </div>
                    <div className="matrix-col-title med">
                      <span>Medium Flight Risk (35-59%)</span>
                      <small>Moderate Vulnerability</small>
                    </div>
                    <div className="matrix-col-title high">
                      <span>Critical Flight Risk (≥60%)</span>
                      <small>Urgent Retention Priority</small>
                    </div>
                  </div>

                  {/* Matrix Rows (Y-Axis: Performance) */}
                  <div className="matrix-rows-container">
                    {[
                      { rowIdx: 0, perfName: 'High Performance', perfSub: 'Exceeds Expectations', perfClass: 'high-perf' },
                      { rowIdx: 1, perfName: 'Core Performance', perfSub: 'Meets Expectations', perfClass: 'med-perf' },
                      { rowIdx: 2, perfName: 'Developing', perfSub: 'Growth & Coaching', perfClass: 'low-perf' },
                    ].map(({ rowIdx, perfName, perfSub, perfClass }) => {
                      const rowQuadrants = (matrixData?.quadrants || []).filter(q => q.row === rowIdx);
                      return (
                        <div key={rowIdx} className="matrix-canvas-row">
                          <div className={`matrix-row-header ${perfClass}`}>
                            <span className="row-perf-title">{perfName}</span>
                            <small className="row-perf-sub">{perfSub}</small>
                          </div>
                          <div className="matrix-row-cards">
                            {rowQuadrants.map((q) => {
                              const isSelected = selectedQuadrantId === q.id;
                              return (
                                <div 
                                  key={q.id}
                                  className={`matrix-quadrant-card ${q.badgeColor} ${isSelected ? 'selected' : ''}`}
                                  onClick={() => {
                                    setSelectedQuadrantId(q.id);
                                  }}
                                >
                                  <div className="quadrant-header">
                                    <span className="quadrant-title">{q.title}</span>
                                    <span className={`quadrant-priority-tag ${q.badgeColor}`}>
                                      {q.priority}
                                    </span>
                                  </div>

                                  <p className="quadrant-tagline">{q.tagline}</p>

                                  <div className="quadrant-stats-row">
                                    <div className="quadrant-headcount-box">
                                      <span className="quadrant-count">{q.count}</span>
                                      <span className="quadrant-pct">{q.percentage}% workforce</span>
                                    </div>
                                    <div className="quadrant-cost-box">
                                      <span className="quadrant-cost">{q.costFormatted}</span>
                                      <span className="quadrant-cost-lbl">Exposure</span>
                                    </div>
                                  </div>

                                  <div className="quadrant-meter-track">
                                    <div 
                                      className={`quadrant-meter-fill ${q.badgeColor}`}
                                      style={{ width: `${Math.min(100, Math.max(12, q.percentage * 2.2))}%` }}
                                    />
                                  </div>

                                  <div 
                                    className="quadrant-footer-hint"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedQuadrantId(q.id);
                                      setIsCohortModalOpen(true);
                                    }}
                                  >
                                    <span>Inspect Cohort ({q.count}) →</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* In-Page Active Quadrant Cohort Section */}
              <div className="matrix-cohort-section" id="matrix-cohort-table-section">
                <div className="matrix-cohort-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div className={`cohort-modal-icon ${currentMatrixQuadrant?.badgeColor || 'normal'}`}>
                      <LayoutGrid size={22} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: '1.18rem', fontWeight: 800, margin: 0 }}>
                          {currentMatrixQuadrant?.title || 'Quadrant Personnel'}
                        </h3>
                        <span className={`status-badge ${currentMatrixQuadrant?.badgeColor === 'critical' ? 'critical' : currentMatrixQuadrant?.badgeColor === 'warning' || currentMatrixQuadrant?.badgeColor === 'high' ? 'high' : 'stable'}`}>
                          {currentMatrixQuadrant?.priority || 'Overview'}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2, marginBottom: 0 }}>
                        {currentMatrixQuadrant?.count || 0} Personnel • {currentMatrixQuadrant?.percentage || 0}% of Workforce • Scope: {matrixDeptFilter === 'All' ? 'All Departments' : matrixDeptFilter}
                      </p>
                    </div>
                  </div>

                  <div className="matrix-cohort-stats-pills">
                    <div className="strategy-stat-pill">
                      <span className="lbl">Exposure at Risk</span>
                      <span className="val">{currentMatrixQuadrant?.costFormatted || '₹0'}</span>
                    </div>
                    <div className="strategy-stat-pill">
                      <span className="lbl">Avg Flight Risk</span>
                      <span className="val" style={{ color: (currentMatrixQuadrant?.avgRiskScore || 0) >= 60 ? '#fb7185' : '#818cf8' }}>
                        {currentMatrixQuadrant?.avgRiskScore || 0}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Strategic Blueprint Banner */}
                {currentMatrixQuadrant?.strategy && (
                  <div className={`quadrant-strategy-banner ${currentMatrixQuadrant.badgeColor}`}>
                    <div className="strategy-banner-left">
                      <p className="strategy-text">
                        <strong>Prescriptive HR Blueprint:</strong> {currentMatrixQuadrant.strategy}
                      </p>
                    </div>
                  </div>
                )}

                {/* Render the Cohort Table */}
                {renderCohortTable(false)}
              </div>
            </div>
          )}

          {/* TAB 4: WHAT-IF RETENTION SIMULATOR */}
          {activeTab === 'simulator' && (
            <div className="simulator-layout">
              {/* Controls Column */}
              <div className="chart-card">
                <div className="card-title-row">
                  <h3 className="card-title">
                    <Sliders size={18} color="#6366f1" />
                    Target Profile & Retention Levers
                  </h3>
                  {/* Select Employee to simulate */}
                  <select 
                    className="filter-select"
                    value={simTargetEmp ? simTargetEmp.id : ''}
                    onChange={(e) => {
                      const found = employees.find(emp => emp.id === e.target.value);
                      if (found) setSimTargetEmp(found);
                    }}
                  >
                    {employees.slice(0, 40).map(e => (
                      <option key={e.id} value={e.id}>
                        {e.name} ({e.role} - Risk: {e.riskScore}%)
                      </option>
                    ))}
                  </select>
                </div>

                {simTargetEmp && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'var(--bg-input)', padding: 14, borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
                    <img src={simTargetEmp.avatar} alt={simTargetEmp.name} style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover' }} />
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontWeight: 700 }}>{simTargetEmp.name}</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {simTargetEmp.department} • Current Base: ₹{(simTargetEmp.salary).toLocaleString('en-IN')} (₹{(simTargetEmp.salary / 100000).toFixed(1)} LPA) • Market Ratio: {Math.round(simTargetEmp.salaryMarketRatio * 100)}%
                      </p>
                    </div>
                    <div>
                      {renderRiskBadge(simTargetEmp.riskTier, simTargetEmp.riskScore)}
                    </div>
                  </div>
                )}

                <div className="simulator-controls">
                  {/* Slider 1: Base Compensation Adjustment */}
                  <div className="slider-group">
                    <div className="slider-header">
                      <span>Base Salary Calibration (%)</span>
                      <span className="slider-value">+{simSalaryDelta}% (₹{simTargetEmp ? Math.round(simTargetEmp.salary * (1 + simSalaryDelta / 100)).toLocaleString('en-IN') : ''})</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="30" 
                      step="1" 
                      value={simSalaryDelta}
                      onChange={(e) => setSimSalaryDelta(Number(e.target.value))}
                      className="custom-range"
                    />
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Brings salary closer to 100%+ of peer Indian tech benchmark</span>
                  </div>

                  {/* Slider 2: Monthly Overtime Hours */}
                  <div className="slider-group">
                    <div className="slider-header">
                      <span>Monthly Overtime Cap</span>
                      <span className="slider-value">{simOvertimeHours} hrs / month</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="45" 
                      step="1" 
                      value={simOvertimeHours}
                      onChange={(e) => setSimOvertimeHours(Number(e.target.value))}
                      className="custom-range"
                    />
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Current workload: {simTargetEmp?.overtimeHoursMonth}h (Reduction lowers burnout coefficient)</span>
                  </div>

                  {/* Slider 3: Remote / WFH Days */}
                  <div className="slider-group">
                    <div className="slider-header">
                      <span>Remote Days / Week</span>
                      <span className="slider-value">{simRemoteDays} Days WFH</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="5" 
                      step="1" 
                      value={simRemoteDays}
                      onChange={(e) => setSimRemoteDays(Number(e.target.value))}
                      className="custom-range"
                    />
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Work-life autonomy flexibility factor</span>
                  </div>

                  {/* Slider 4: One-time Retention Milestone Bonus */}
                  <div className="slider-group">
                    <div className="slider-header">
                      <span>Retention Milestone Bonus</span>
                      <span className="slider-value">₹{simBonusAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="1000000" 
                      step="25000" 
                      value={simBonusAmount}
                      onChange={(e) => setSimBonusAmount(Number(e.target.value))}
                      className="custom-range"
                    />
                  </div>

                  {/* Checkbox: Fast track promotion */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-input)', padding: '14px 18px', borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>Fast-Track Promotion & Title Review</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Sets upcoming promotion milestone in next appraisal cycle</div>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={simPromotionStatus}
                      onChange={(e) => setSimPromotionStatus(e.target.checked)}
                      style={{ width: 18, height: 18, accentColor: '#6366f1', cursor: 'pointer' }}
                    />
                  </div>
                </div>
              </div>

              {/* Real-time AI Simulation Outcome Card */}
              <div className="chart-card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div className="card-title-row">
                  <h3 className="card-title">
                    <Sparkles size={18} color="#38bdf8" />
                    Simulated AI Outcome
                  </h3>
                  <span className="card-badge">Live ML Inference</span>
                </div>

                <div className="gauge-result-card" style={{
                  '--gauge-color': simulatedRisk.tier === 'Critical' ? '#f43f5e' : simulatedRisk.tier === 'High' ? '#f97316' : simulatedRisk.tier === 'Medium' ? '#eab308' : '#10b981',
                  '--gauge-glow': simulatedRisk.tier === 'Critical' ? 'rgba(244, 63, 94, 0.3)' : 'rgba(16, 185, 129, 0.3)'
                }}>
                  <div className="gauge-circle">
                    <span className="gauge-number">{simulatedRisk.score}%</span>
                    <span className="gauge-label">Attrition Risk</span>
                  </div>

                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                      {simulatedRisk.tier} Flight Risk
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: '#34d399', fontWeight: 600, marginTop: 4 }}>
                      ↓ {simRiskDelta > 0 ? `Reduced by ${simRiskDelta} risk points` : 'No reduction'}
                    </p>
                  </div>
                </div>

                {/* Economic ROI Impact */}
                <div style={{ background: 'var(--bg-input)', padding: 18, borderRadius: 14, border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Estimated Replacement Cost Avoided:</span>
                    <span style={{ fontWeight: 800, color: '#34d399' }}>+₹{simulatedRisk.costSavings.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Calculated Package Cost:</span>
                    <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                      ₹{(Math.round((simTargetEmp?.salary || 0) * (simSalaryDelta / 100)) + simBonusAmount).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', borderTop: '1px solid var(--border-subtle)', paddingTop: 8 }}>
                    <span style={{ fontWeight: 700 }}>Net Estimated Retention ROI:</span>
                    <span style={{ fontWeight: 800, color: '#6366f1' }}>
                      {simRiskDelta > 15 ? '3.4x Payoff' : '1.8x Payoff'}
                    </span>
                  </div>
                </div>

                {/* Commit Action */}
                <button 
                  className="btn-primary" 
                  style={{ width: '100%', justifyContent: 'center', padding: 14 }}
                  onClick={handleCommitSimulationPlan}
                  disabled={isCommittingPlan || !simTargetEmp}
                >
                  {isCommittingPlan ? (
                    <>
                      <RefreshCw size={18} className="spin-animate" />
                      Committing Plan to Tracker...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} />
                      Commit Retention Plan to Tracker
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: RETENTION PLAYBOOK */}
          {activeTab === 'playbook' && (
            <div className="playbook-view-layout">
              {/* Playbook Compact Summary & Filter Header */}
              <div className="playbook-header-strip">
                <div className="playbook-summary-metrics">
                  <div className="playbook-summary-pill">
                    <Briefcase size={15} color="#818cf8" />
                    <span>Catalog:</span>
                    <strong>{RETENTION_PLAYBOOK.length} Policies</strong>
                  </div>
                  <div className="playbook-summary-divider" />
                  <div className="playbook-summary-pill">
                    <TrendingUp size={15} color="#10b981" />
                    <span>Max Lift:</span>
                    <strong style={{ color: '#10b981' }}>+36% Retention</strong>
                  </div>
                  <div className="playbook-summary-divider" />
                  <div className="playbook-summary-pill">
                    <Clock size={15} color="#f59e0b" />
                    <span>Velocity:</span>
                    <strong>1–2 Weeks</strong>
                  </div>
                  <div className="playbook-summary-divider" />
                  <div className="playbook-summary-pill">
                    <ShieldCheck size={15} color="#3b82f6" />
                    <span>Coverage:</span>
                    <strong>100% Risk Factors</strong>
                  </div>
                </div>

                <div className="playbook-filter-tabs">
                  {['All', 'Compensation', 'Work-Life Balance', 'Career Growth', 'Flexibility'].map(cat => {
                    const count = cat === 'All' 
                      ? RETENTION_PLAYBOOK.length 
                      : RETENTION_PLAYBOOK.filter(p => p.category === cat).length;
                    return (
                      <button
                        key={cat}
                        className={`playbook-tab-btn ${playbookCategoryFilter === cat ? 'active' : ''}`}
                        onClick={() => setPlaybookCategoryFilter(cat)}
                      >
                        {cat} <span className="playbook-tab-count">{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Playbook Compact Cards Grid */}
              <div className="playbook-grid">
                {RETENTION_PLAYBOOK
                  .filter(play => playbookCategoryFilter === 'All' || play.category === playbookCategoryFilter)
                  .map(play => (
                  <div key={play.id} className="playbook-card compact">
                    <div className="playbook-header">
                      <div className="playbook-tags-row">
                        <span className={`playbook-cat-tag ${play.category.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>
                          {play.category}
                        </span>
                        <span className="playbook-strat-id">{play.id}</span>
                      </div>
                      <span className="playbook-impact-badge">
                        <Award size={12} /> {play.impactScore}/100 Impact
                      </span>
                    </div>

                    <div className="playbook-body">
                      <h4 className="playbook-card-title">{play.title}</h4>
                      <p className="playbook-card-desc">{play.description}</p>
                    </div>

                    <div className="playbook-metrics-grid compact">
                      <div className="playbook-metric-item">
                        <span className="playbook-metric-label">Lift</span>
                        <span className="playbook-metric-value boost">{play.estimatedRetentionBoost}</span>
                      </div>
                      <div className="playbook-metric-item">
                        <span className="playbook-metric-label">Cost/Emp</span>
                        <span className="playbook-metric-value">{play.avgCostPerEmployee}</span>
                      </div>
                      <div className="playbook-metric-item">
                        <span className="playbook-metric-label">Target</span>
                        <span className="playbook-metric-value" title={play.targetRisk}>{play.targetRisk}</span>
                      </div>
                      <div className="playbook-metric-item">
                        <span className="playbook-metric-label">Velocity</span>
                        <span className="playbook-metric-value">{play.implementationTime}</span>
                      </div>
                    </div>

                    <div className="playbook-actions-row">
                      <button 
                        className="btn-secondary playbook-action-btn"
                        onClick={() => {
                          navigateTo('simulator');
                          showToast(`Opened Simulator to evaluate ${play.title}`);
                        }}
                      >
                        <Sliders size={14} /> Test in Simulator
                      </button>
                      <button 
                        className="btn-primary playbook-action-btn" 
                        onClick={() => showToast(`Initiated automated rollout workflow for ${play.title}`)}
                      >
                        <PlayCircle size={14} /> Deploy Strategy
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: INTERVENTION TRACKER & ACTION LOGS */}
          {activeTab === 'interventions' && (
            <div className="chart-card">
              <div className="card-title-row">
                <div>
                  <h3 className="card-title">
                    <CheckSquare size={18} color="#10b981" />
                    Active Retention Intervention Tracker
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    Log of committed management interventions, budget allocated, and before/after flight risk reduction.
                  </p>
                </div>
                <button 
                  className="btn-primary"
                  onClick={() => navigateTo('simulator')}
                >
                  <Sliders size={16} /> New Simulation
                </button>
              </div>

              <div className="table-container" style={{ marginTop: 14 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Plan ID</th>
                      <th>Employee</th>
                      <th>Department & Role</th>
                      <th>Intervention Action</th>
                      <th>Package Budget</th>
                      <th>Risk Before → After</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {committedPlans.map(plan => (
                      <tr key={plan.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#818cf8' }}>
                          {plan.id}
                        </td>
                        <td>
                          <div style={{ fontWeight: 700 }}>{plan.name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{plan.empId}</div>
                        </td>
                        <td>
                          <div>{plan.role}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{plan.department}</div>
                        </td>
                        <td style={{ fontWeight: 500 }}>
                          {plan.action}
                        </td>
                        <td style={{ fontWeight: 700, color: '#38bdf8' }}>
                          ₹{(plan.costInr / 100000).toFixed(2)} Lakhs
                        </td>
                        <td>
                          <span style={{ color: '#fb7185', fontWeight: 700 }}>{plan.riskBefore}%</span>
                          <span style={{ margin: '0 6px', color: 'var(--text-muted)' }}>&rarr;</span>
                          <span style={{ color: '#34d399', fontWeight: 800 }}>{plan.riskAfter}%</span>
                        </td>
                        <td>
                          <span className="risk-badge low">
                            {plan.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: ML MODEL INTELLIGENCE & THRESHOLD OPTIMIZATION */}
          {activeTab === 'models' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Benchmark Summary */}
              <div className="chart-card">
                <div className="card-title-row">
                  <div>
                    <h3 className="card-title">
                      <Cpu size={18} color="#6366f1" />
                      Active Champion ML Architecture & Benchmarks
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      Architecture: <strong>{modelMetrics.activeModel}</strong> • Trained on {modelMetrics.trainedOn}
                    </p>
                  </div>
                  <span className="card-badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#34d399' }}>
                    Production Model Active
                  </span>
                </div>

                <div className="ml-benchmark-grid" style={{ marginTop: 14 }}>
                  <div className="ml-metric-box">
                    <div className="val">{modelMetrics.accuracy}</div>
                    <div className="lbl">Overall Accuracy</div>
                  </div>
                  <div className="ml-metric-box">
                    <div className="val">{modelMetrics.rocAuc}</div>
                    <div className="lbl">ROC-AUC Score</div>
                  </div>
                  <div className="ml-metric-box">
                    <div className="val">{modelMetrics.precision}</div>
                    <div className="lbl">Precision</div>
                  </div>
                  <div className="ml-metric-box">
                    <div className="val">{modelMetrics.recall}</div>
                    <div className="lbl">Recall (Flight Risk)</div>
                  </div>
                </div>
              </div>

              {/* Threshold Calibration Slider */}
              <div className="chart-card">
                <div className="card-title-row">
                  <h3 className="card-title">
                    <Sliders size={18} color="#38bdf8" />
                    Interactive Decision Threshold Optimization
                  </h3>
                  <span className="card-badge">Threshold: {(decisionThreshold * 100).toFixed(0)}%</span>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  In HR retention, missing an at-risk employee (False Negative) is costly. Lowering the decision threshold catches more potential resignations early.
                </p>
                <div style={{ marginTop: 10 }}>
                  <input 
                    type="range" 
                    min="0.25" 
                    max="0.65" 
                    step="0.05"
                    value={decisionThreshold}
                    onChange={(e) => setDecisionThreshold(Number(e.target.value))}
                    className="custom-range"
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
                    <span>0.25 (Max Recall / Early Warning)</span>
                    <span style={{ color: '#818cf8', fontWeight: 700 }}>Balanced Operating Point (0.40)</span>
                    <span>0.65 (High Precision)</span>
                  </div>
                </div>
              </div>

              {/* Feature Importance & Confusion Matrix */}
              <div className="grid-2-col">
                {/* Feature Importance Bar Chart */}
                <div className="chart-card">
                  <div className="card-title-row">
                    <h3 className="card-title">
                      <BarChart3 size={18} color="#06b6d4" />
                      Top Predictive Feature Importances (Trained Model)
                    </h3>
                  </div>
                  <div style={{ height: 260, width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={modelMetrics.topFeatures} 
                        layout="vertical"
                        margin={{ top: 5, right: 20, left: 70, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)"} />
                        <XAxis type="number" stroke={isDarkMode ? "#64748b" : "#64748b"} fontSize={11} domain={[0, 0.1]} />
                        <YAxis dataKey="feature" type="category" stroke={isDarkMode ? "#94a3b8" : "#475569"} fontSize={11} width={130} />
                        <Tooltip 
                          cursor={{ fill: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(99, 102, 241, 0.08)', radius: 4 }}
                          contentStyle={{ 
                            backgroundColor: isDarkMode ? '#0d1322' : '#ffffff', 
                            borderColor: isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)', 
                            borderRadius: 10,
                            boxShadow: isDarkMode ? '0 10px 25px rgba(0,0,0,0.5)' : '0 10px 25px -5px rgba(0,0,0,0.12)',
                            color: isDarkMode ? '#f1f5f9' : '#0f172a'
                          }}
                          itemStyle={{ color: isDarkMode ? '#f1f5f9' : '#0f172a', fontWeight: 600 }}
                          labelStyle={{ color: isDarkMode ? '#94a3b8' : '#475569', fontWeight: 600, marginBottom: 4 }}
                          formatter={(val) => [(val * 100).toFixed(1) + '%', 'Relative Weight']}
                        />
                        <Bar dataKey="importance" fill="#6366f1" radius={[0, 6, 6, 0]}>
                          {modelMetrics.topFeatures.map((entry, index) => (
                            <Cell key={`feat-${index}`} fill={index === 0 ? '#f43f5e' : index === 1 ? '#38bdf8' : '#818cf8'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Confusion Matrix Card */}
                <div className="chart-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div className="card-title-row">
                      <h3 className="card-title">
                        <Database size={18} color="#818cf8" />
                        Confusion Matrix Evaluation
                      </h3>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 8 }}>
                      Evaluated on 20% holdout test partition ({modelMetrics.confusionMatrix ? modelMetrics.confusionMatrix.trueNegative + modelMetrics.confusionMatrix.falsePositive + modelMetrics.confusionMatrix.falseNegative + modelMetrics.confusionMatrix.truePositive : 294} test samples).
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, margin: '14px 0' }}>
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: 14, borderRadius: 12, textAlign: 'center' }}>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34d399' }}>{modelMetrics.confusionMatrix?.trueNegative || 230}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>True Negatives (Stayed)</div>
                    </div>
                    <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', padding: 14, borderRadius: 12, textAlign: 'center' }}>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fb7185' }}>{modelMetrics.confusionMatrix?.falsePositive || 17}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>False Positives (Type I)</div>
                    </div>
                    <div style={{ background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)', padding: 14, borderRadius: 12, textAlign: 'center' }}>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#facc15' }}>{modelMetrics.confusionMatrix?.falseNegative || 24}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>False Negatives (Type II)</div>
                    </div>
                    <div style={{ background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.4)', padding: 14, borderRadius: 12, textAlign: 'center' }}>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#818cf8' }}>{modelMetrics.confusionMatrix?.truePositive || 23}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>True Positives (Detected)</div>
                    </div>
                  </div>

                  <button 
                    className="btn-primary" 
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => {
                      setIsRetraining(true);
                      showToast('Triggering full model re-training across 300 epochs...');
                      setTimeout(() => {
                        setIsRetraining(false);
                        showToast('Model re-training complete! Benchmark: 86.1% Accuracy, 0.811 ROC-AUC.');
                      }, 2000);
                    }}
                  >
                    <RefreshCw size={16} className={isRetraining ? 'pulse-dot' : ''} />
                    {isRetraining ? 'Re-optimizing Weights...' : 'Trigger Model Re-Training'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 9-Box Matrix Quadrant Cohort Deep-Dive Modal */}
      {isCohortModalOpen && currentMatrixQuadrant && (
        <div className="modal-backdrop" onClick={() => setIsCohortModalOpen(false)}>
          <div className="modal-content cohort-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div className={`cohort-modal-icon ${currentMatrixQuadrant.badgeColor}`}>
                  <LayoutGrid size={22} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{currentMatrixQuadrant.title}</h3>
                    <span className={`status-badge ${currentMatrixQuadrant.badgeColor === 'critical' ? 'critical' : currentMatrixQuadrant.badgeColor === 'warning' || currentMatrixQuadrant.badgeColor === 'high' ? 'high' : 'stable'}`}>
                      {currentMatrixQuadrant.priority}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {currentMatrixQuadrant.count} Personnel • {currentMatrixQuadrant.percentage}% of Workforce • Scope: {matrixDeptFilter === 'All' ? 'All Departments' : matrixDeptFilter}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button className="close-btn" onClick={() => setIsCohortModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="cohort-modal-body">
              {/* Strategic Blueprint Banner */}
              <div className={`quadrant-strategy-banner ${currentMatrixQuadrant.badgeColor}`}>
                <div className="strategy-banner-left">
                  <p className="strategy-text">
                    <strong>Prescriptive HR Blueprint:</strong> {currentMatrixQuadrant.strategy}
                  </p>
                </div>
                <div className="strategy-banner-right">
                  <div className="strategy-stat-pill">
                    <span className="lbl">Exposure at Risk</span>
                    <span className="val">{currentMatrixQuadrant.costFormatted}</span>
                  </div>
                  <div className="strategy-stat-pill">
                    <span className="lbl">Avg Flight Risk</span>
                    <span className="val" style={{ color: currentMatrixQuadrant.avgRiskScore >= 60 ? '#fb7185' : '#818cf8' }}>
                      {currentMatrixQuadrant.avgRiskScore}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Render Cohort Table */}
              {renderCohortTable(true)}
            </div>
          </div>
        </div>
      )}

      {/* 360 Employee Detail & Intervention Modal */}
      {isModalOpen && selectedEmployee && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <img 
                  src={selectedEmployee.avatar} 
                  alt={selectedEmployee.name} 
                  style={{ width: 54, height: 54, borderRadius: 12, objectFit: 'cover' }} 
                />
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{selectedEmployee.name}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {selectedEmployee.role} • {selectedEmployee.department} • ID: {selectedEmployee.id}
                  </p>
                </div>
              </div>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {/* Quick Metrics Grid */}
            <div className="modal-metrics-grid">
              <div className="ml-metric-box">
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f43f5e' }}>{selectedEmployee.riskScore}%</div>
                <div className="lbl">Risk Score</div>
              </div>
              <div className="ml-metric-box">
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#38bdf8' }}>₹{(selectedEmployee.salary / 100000).toFixed(1)} LPA</div>
                <div className="lbl">Base CTC</div>
              </div>
              <div className="ml-metric-box">
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#eab308' }}>{selectedEmployee.overtimeHoursMonth}h</div>
                <div className="lbl">Monthly OT</div>
              </div>
              <div className="ml-metric-box">
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#10b981' }}>{selectedEmployee.tenureYears} yrs</div>
                <div className="lbl">Tenure</div>
              </div>
            </div>

            {/* Qualitative Notes & Drivers */}
            <div style={{ background: 'var(--bg-input)', padding: 18, borderRadius: 14, border: '1px solid var(--border-subtle)' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
                Primary Flight Risk Drivers & AI Diagnostic
              </h4>
              <div className="driver-tags" style={{ marginBottom: 12 }}>
                {selectedEmployee.primaryDrivers.map((d, i) => (
                  <span key={i} className="driver-tag" style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#fb7185', borderColor: 'rgba(244, 63, 94, 0.3)' }}>
                    {d}
                  </span>
                ))}
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                "{selectedEmployee.notes}"
              </p>
            </div>

            {/* Action Bar with 1-Click Action Triggers */}
            <div className="modal-footer-actions">
              <button className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                Close
              </button>
              <button 
                className="btn-copilot-trigger"
                onClick={() => askCopilotAboutEmployee(selectedEmployee)}
              >
                <Sparkles size={16} /> Ask AI Copilot
              </button>
              <button 
                className="btn-action-schedule"
                onClick={() => handleOpenScheduleModal(selectedEmployee)}
                title="Schedule Retention 1-on-1 with structured agenda"
              >
                <Calendar size={16} /> Schedule 1-on-1
              </button>
              <button 
                className="btn-action-memo"
                onClick={() => handleOpenTalkingPoints(selectedEmployee)}
                title="View AI Manager Discussion Memo"
              >
                <FileText size={16} /> Talking Points
              </button>
              <button 
                className="btn-primary"
                onClick={() => {
                  setSimTargetEmp(selectedEmployee);
                  setIsModalOpen(false);
                  navigateTo('simulator');
                }}
              >
                <Sliders size={16} /> What-If Simulator
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule 1-on-1 Action Modal */}
      {isScheduleModalOpen && scheduleModalEmp && (
        <div className="modal-backdrop" onClick={() => setIsScheduleModalOpen(false)}>
          <div className="modal-content schedule-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div className="schedule-header-icon">
                  <Calendar size={24} color="#6366f1" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Schedule Retention 1-on-1 Check-in</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Target: <strong>{scheduleModalEmp.name}</strong> ({scheduleModalEmp.role} • {scheduleModalEmp.department})
                  </p>
                </div>
              </div>
              <button className="close-btn" onClick={() => setIsScheduleModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="schedule-modal-body">
              {/* Employee Summary Chip */}
              <div className="schedule-emp-chip">
                <img src={scheduleModalEmp.avatar} alt={scheduleModalEmp.name} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{scheduleModalEmp.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Risk: <strong style={{ color: scheduleModalEmp.riskTier === 'Critical' ? '#f43f5e' : '#fb923c' }}>{scheduleModalEmp.riskScore}% ({scheduleModalEmp.riskTier})</strong> • Overtime: {scheduleModalEmp.overtimeHoursMonth}h/mo • Base: ₹{(scheduleModalEmp.salary / 100000).toFixed(1)} LPA
                  </div>
                </div>
                {renderRiskBadge(scheduleModalEmp.riskTier, scheduleModalEmp.riskScore)}
              </div>

              {/* Date & Time Selection */}
              <div className="form-group" style={{ marginTop: 16 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: 8, display: 'block' }}>
                  Proposed Date & Time:
                </label>
                <div className="schedule-preset-chips">
                  {['Tomorrow at 10:30 AM', 'Thursday at 2:00 PM', 'Friday at 11:00 AM', 'Next Monday at 10:00 AM'].map(preset => (
                    <button 
                      key={preset} 
                      type="button"
                      className={`schedule-preset-btn ${meetingDate === preset ? 'active' : ''}`}
                      onClick={() => setMeetingDate(preset)}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <input 
                  type="text" 
                  className="custom-text-input" 
                  value={meetingDate} 
                  onChange={(e) => setMeetingDate(e.target.value)}
                  placeholder="e.g. Tomorrow at 10:30 AM"
                  style={{ marginTop: 10, width: '100%', padding: '10px 14px', borderRadius: 10, background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)' }}
                />
              </div>

              {/* Pre-configured AI Retention Agenda */}
              <div className="agenda-box" style={{ marginTop: 16, background: 'var(--bg-input)', borderRadius: 12, padding: 16, border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', color: '#818cf8' }}>
                    ⚡ Pre-Configured AI Retention Agenda (30 Mins)
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Auto-sync with Google / Outlook</span>
                </div>
                <div className="agenda-items">
                  <div className="agenda-item">
                    <span className="agenda-num">1</span>
                    <div>
                      <strong>Workload & Bandwidth Pulse (10m)</strong>
                      <p>Review current project pacing and discuss capping monthly overtime ({scheduleModalEmp.overtimeHoursMonth}h/mo).</p>
                    </div>
                  </div>
                  <div className="agenda-item">
                    <span className="agenda-num">2</span>
                    <div>
                      <strong>Compensation & Career Progression (10m)</strong>
                      <p>Discuss market benchmark ratio ({Math.round(scheduleModalEmp.salaryMarketRatio * 100)}%) and timeline for upcoming promotion cycle ({scheduleModalEmp.lastPromotionMonths} mos elapsed).</p>
                    </div>
                  </div>
                  <div className="agenda-item">
                    <span className="agenda-num">3</span>
                    <div>
                      <strong>Autonomy & Retention Agreement (10m)</strong>
                      <p>Explore hybrid flexibility options and establish agreed 30-day milestone check-in.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Calendar Sync Notice */}
              <div className="calendar-sync-notice" style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <CheckCircle2 size={16} color="#10b981" />
                <span>Calendar invite automatically attaches confidential manager talking points and ML risk diagnostics.</span>
              </div>
            </div>

            <div className="modal-footer-actions" style={{ marginTop: 20 }}>
              <button className="btn-secondary" onClick={() => setIsScheduleModalOpen(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleConfirmSchedule}>
                <Calendar size={16} /> Confirm & Dispatch Calendar Invite
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manager Talking Points Memo Modal */}
      {isTalkingPointsOpen && talkingPointsEmp && (
        <div className="modal-backdrop" onClick={() => setIsTalkingPointsOpen(false)}>
          <div className="modal-content talking-points-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div className="talking-points-header-icon">
                  <FileText size={24} color="#818cf8" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Manager Retention Talking Points</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    AI Discussion Briefing for <strong>{talkingPointsEmp.name}</strong> • {talkingPointsEmp.role} ({talkingPointsEmp.department})
                  </p>
                </div>
              </div>
              <button className="close-btn" onClick={() => setIsTalkingPointsOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="talking-points-body">
              {/* Header KPI Summary Banner */}
              <div className="tp-kpi-banner">
                <div className="tp-kpi-item">
                  <span className="tp-kpi-label">Flight Risk</span>
                  <span className="tp-kpi-value" style={{ color: talkingPointsEmp.riskScore > 65 ? '#f43f5e' : '#fb923c' }}>
                    {talkingPointsEmp.riskScore}% ({talkingPointsEmp.riskTier})
                  </span>
                </div>
                <div className="tp-kpi-item">
                  <span className="tp-kpi-label">Current Comp</span>
                  <span className="tp-kpi-value">₹{(talkingPointsEmp.salary / 100000).toFixed(1)} LPA</span>
                </div>
                <div className="tp-kpi-item">
                  <span className="tp-kpi-label">Market Ratio</span>
                  <span className="tp-kpi-value" style={{ color: talkingPointsEmp.salaryMarketRatio < 0.9 ? '#f43f5e' : '#34d399' }}>
                    {Math.round(talkingPointsEmp.salaryMarketRatio * 100)}% of Market
                  </span>
                </div>
                <div className="tp-kpi-item">
                  <span className="tp-kpi-label">Overtime Load</span>
                  <span className="tp-kpi-value" style={{ color: talkingPointsEmp.overtimeHoursMonth > 20 ? '#fb923c' : 'inherit' }}>
                    {talkingPointsEmp.overtimeHoursMonth} hrs/mo
                  </span>
                </div>
                <div className="tp-kpi-item">
                  <span className="tp-kpi-label">Est. Cost-at-Risk</span>
                  <span className="tp-kpi-value" style={{ color: '#ec4899' }}>
                    ₹{((talkingPointsEmp.salary * 1.5) / 100000).toFixed(1)} Lakhs
                  </span>
                </div>
              </div>

              {/* Primary Drivers Identified */}
              <div className="tp-blockers-section" style={{ marginTop: 14, background: 'var(--bg-input)', padding: 12, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                <span className="tp-section-title" style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                  Primary Risk Factors Identified by AI:
                </span>
                <div className="driver-tags">
                  {talkingPointsEmp.primaryDrivers?.map((d, i) => (
                    <span key={i} className="driver-tag" style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#fb7185', borderColor: 'rgba(244, 63, 94, 0.3)' }}>
                      {d}
                    </span>
                  ))}
                </div>
              </div>

              {/* 3-Phase Discussion Flow */}
              <div className="tp-phases-container" style={{ marginTop: 16 }}>
                {(talkingPointsData?.discussionPhases || [
                  {
                    phase: "1. Rapport & Psychological Safety (0-8 mins)",
                    goal: "Establish a supportive climate without leading with attrition alarmism.",
                    samplePrompts: [
                      "How has your energy and workload felt over the past couple of sprints?",
                      "What parts of your current projects are giving you the most momentum vs draining you?"
                    ]
                  },
                  {
                    phase: "2. Root Cause Diagnostics (8-18 mins)",
                    goal: "Validate ML-identified risk factors and listen actively without being defensive.",
                    samplePrompts: [
                      `I noticed we've been running high on extra hours (${talkingPointsEmp.overtimeHoursMonth}h/mo). How can we reprioritize deliverables to give you breathing room?`,
                      `It's been ${talkingPointsEmp.lastPromotionMonths} months since your last role milestone. Where do you see your scope expanding next?`
                    ]
                  },
                  {
                    phase: "3. Collaborative Solutioning & Commitments (18-30 mins)",
                    goal: "Co-create actionable retention levers and establish clear follow-up checkpoints.",
                    samplePrompts: [
                      "We are reviewing off-cycle compensation calibrations—what does competitive recognition look like for you?",
                      "Let's establish a fast-track review milestone for the upcoming quarterly cycle."
                    ]
                  }
                ]).map((phase, pIdx) => (
                  <div key={pIdx} className="tp-phase-card">
                    <div className="tp-phase-header">
                      <span className="tp-phase-badge">Phase {pIdx + 1}</span>
                      <h4>{phase.phase}</h4>
                    </div>
                    <p className="tp-phase-goal"><strong>Goal:</strong> {phase.goal}</p>
                    <div className="tp-prompts-box">
                      <span className="tp-prompts-lbl">Suggested Questions & Prompts:</span>
                      <ul className="tp-prompts-list">
                        {phase.samplePrompts.map((prompt, prIdx) => (
                          <li key={prIdx}>"{prompt}"</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recommended Retention Levers */}
              <div className="tp-levers-card" style={{ marginTop: 16 }}>
                <div className="tp-levers-title">
                  <Sparkles size={16} color="#6366f1" />
                  <span>AI-Recommended Retention Levers:</span>
                </div>
                <div className="tp-levers-grid">
                  <div className="tp-lever-pill">
                    <strong>Compensation Calibration:</strong> Propose +{talkingPointsEmp.riskScore > 70 ? '12%' : '8%'} merit correction to align with peer median.
                  </div>
                  <div className="tp-lever-pill">
                    <strong>Workload Protection:</strong> Hard cap on overtime to ≤12 hours/month with sprint re-scoping.
                  </div>
                  <div className="tp-lever-pill">
                    <strong>Workplace Flexibility:</strong> Authorize +1 remote WFH day per week.
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer-actions" style={{ marginTop: 20 }}>
              <button className="btn-secondary" onClick={() => setIsTalkingPointsOpen(false)}>
                Close Memo
              </button>
              <button 
                className="btn-secondary"
                onClick={() => {
                  const memoText = `RETENTION 1-ON-1 BRIEFING: ${talkingPointsEmp.name} (${talkingPointsEmp.role})\nRisk: ${talkingPointsEmp.riskScore}% (${talkingPointsEmp.riskTier})\nMarket Ratio: ${Math.round(talkingPointsEmp.salaryMarketRatio * 100)}%\nPrimary Drivers: ${talkingPointsEmp.primaryDrivers?.join(', ')}\n\nDiscussion Focus:\n1. Workload & Burnout Calibration\n2. Career Progression & Compensation\n3. Agreed Retention Action Plan`;
                  navigator.clipboard.writeText(memoText);
                  showToast(`📋 Talking points copied to clipboard!`);
                }}
              >
                <Copy size={16} /> Copy to Clipboard
              </button>
              <button 
                className="btn-primary"
                onClick={() => {
                  setIsTalkingPointsOpen(false);
                  handleOpenScheduleModal(talkingPointsEmp);
                }}
              >
                <Calendar size={16} /> Proceed to Schedule 1-on-1
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Copilot Launcher */}
      <button 
        className="copilot-floating-btn"
        onClick={() => setIsCopilotOpen(true)}
        title="Open AI Retention Copilot"
        aria-label="Open AI Copilot"
      >
        <div className="copilot-floating-pulse">
          <Sparkles size={18} />
        </div>
        <span>AI Copilot</span>
      </button>

      {/* Copilot Slide-Out Drawer & Backdrop */}
      <div 
        className={`copilot-backdrop ${isCopilotOpen ? 'open' : ''}`}
        onClick={() => setIsCopilotOpen(false)}
      />

      <aside className={`copilot-drawer ${isCopilotOpen ? 'open' : ''}`} aria-label="AI Retention Copilot Drawer">
        {/* Drawer Header */}
        <div className="copilot-header">
          <div className="copilot-title-group">
            <div className="copilot-icon-badge">
              <Bot size={20} />
            </div>
            <div className="copilot-title-text">
              <h3>RetentionAI Copilot</h3>
              <div className="copilot-status-dot">
                <span>Online</span>
              </div>
            </div>
          </div>
          <div className="copilot-header-actions">
            <button 
              className="icon-btn" 
              title="Clear Chat History"
              onClick={() => {
                setCopilotMessages([
                  {
                    id: 'msg-welcome-reset',
                    sender: 'assistant',
                    headline: 'Conversation Reset',
                    text: "### Conversation Cleared\n\nHow can I help you analyze workforce retention, flight risks, or burnout diagnostics today?",
                    suggestedPrompts: [
                      "Show top 5 flight risks across all departments",
                      "Why is Sales experiencing high attrition?",
                      "Who is at risk due to overtime and burnout?"
                    ],
                    timestamp: "Just now"
                  }
                ]);
              }}
            >
              <Trash2 size={16} />
            </button>
            <button 
              className="icon-btn" 
              onClick={() => setIsCopilotOpen(false)}
              title="Close Copilot"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div className="copilot-body">
          {copilotMessages.map((msg) => (
            <div key={msg.id} className={`copilot-msg ${msg.sender}`}>
              <div className="copilot-bubble">
                {renderCopilotText(msg.text)}

                {/* Metrics Tiles inside Assistant Message */}
                {msg.metrics && msg.metrics.length > 0 && (
                  <div className="copilot-metrics-grid">
                    {msg.metrics.map((m, idx) => (
                      <div key={idx} className="copilot-metric-tile">
                        <div className="copilot-metric-val">{m.value}</div>
                        <div className="copilot-metric-lbl">{m.label}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Structured Employee Cards */}
                {msg.employees && msg.employees.length > 0 && (
                  <div className="copilot-emps-container">
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-faint)', marginTop: 6, marginBottom: 2 }}>
                      Matched Personnel & Quick Actions:
                    </div>
                    {msg.employees.map((emp) => (
                      <div key={emp.id} className="copilot-emp-row">
                        <div className="copilot-emp-info">
                          <img src={emp.avatar} alt={emp.name} className="copilot-emp-avatar" />
                          <div>
                            <div className="copilot-emp-name">{emp.name}</div>
                            <div className="copilot-emp-dept">{emp.role} • {emp.department}</div>
                          </div>
                        </div>
                        <div className="copilot-emp-actions">
                          <span 
                            className="status-badge"
                            style={{ 
                              fontSize: '0.7rem', 
                              padding: '2px 6px',
                              background: emp.riskTier === 'Critical' ? 'rgba(244,63,94,0.15)' : 'rgba(249,115,22,0.15)',
                              color: emp.riskTier === 'Critical' ? '#fb7185' : '#fb923c'
                            }}
                          >
                            {emp.riskScore}%
                          </span>
                          <button 
                            className="copilot-mini-btn"
                            title="Open in Simulator"
                            onClick={() => {
                              setSimTargetEmp(emp);
                              setIsCopilotOpen(false);
                              navigateTo('simulator');
                            }}
                          >
                            <Sliders size={12} />
                          </button>
                          <button 
                            className="copilot-mini-btn"
                            title="View Full Dossier"
                            onClick={() => {
                              setSelectedEmployee(emp);
                              setIsModalOpen(true);
                            }}
                          >
                            <UserCheck size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actionable Recommendations */}
                {msg.recommendations && msg.recommendations.length > 0 && (
                  <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '10px 12px', margin: '10px 0 6px 0' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#818cf8', marginBottom: 4 }}>
                      Recommended Next Steps:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 16, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {msg.recommendations.map((rec, rIdx) => (
                        <li key={rIdx} style={{ marginBottom: 3 }}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Contextual Suggested Prompt Chips */}
                {msg.suggestedPrompts && msg.suggestedPrompts.length > 0 && (
                  <div className="copilot-suggestions-wrapper">
                    <div className="copilot-suggestions-title">Follow-up Queries:</div>
                    <div className="copilot-prompt-chips">
                      {msg.suggestedPrompts.map((prompt, pIdx) => (
                        <button 
                          key={pIdx} 
                          className="copilot-chip"
                          onClick={() => handleSendCopilot(prompt)}
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="copilot-timestamp">{msg.timestamp}</div>
            </div>
          ))}

          {/* Typing indicator */}
          {isCopilotLoading && (
            <div className="copilot-msg assistant">
              <div className="copilot-bubble" style={{ padding: 12 }}>
                <div className="copilot-typing-indicator">
                  <div className="copilot-dot"></div>
                  <div className="copilot-dot"></div>
                  <div className="copilot-dot"></div>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginLeft: 6 }}>
                    Analyzing ML ensemble telemetry...
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={copilotMessagesEndRef} />
        </div>

        {/* Drawer Footer & Input Field */}
        <form 
          className="copilot-footer"
          onSubmit={(e) => {
            e.preventDefault();
            handleSendCopilot();
          }}
        >
          <div className="copilot-input-row">
            <input 
              type="text" 
              className="copilot-input-field"
              placeholder="Ask anything (e.g. 'Why is Sales attrition high?')..."
              value={copilotQuery}
              onChange={(e) => setCopilotQuery(e.target.value)}
              disabled={isCopilotLoading}
            />
            <button 
              type="submit" 
              className="copilot-send-btn"
              disabled={!copilotQuery.trim() || isCopilotLoading}
              title="Send Query"
            >
              <Send size={16} />
            </button>
          </div>
          <div className="copilot-hint-text">
            Press <strong>Enter</strong> to send
          </div>
        </form>
      </aside>
    </div>
  );
}
