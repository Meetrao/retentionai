import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, TrendingUp, AlertTriangle, ShieldCheck, 
  IndianRupee, Activity, Cpu, Sliders, PlayCircle, 
  Lightbulb, Search, Bell, Moon, Sun, ArrowUpRight, 
  ArrowDownRight, CheckCircle2, ChevronRight, X, Menu,
  Upload, FileText, BarChart3, Database, RefreshCw,
  Clock, Award, Sparkles, UserCheck, Briefcase, Building2,
  CheckSquare, Filter, Layers, HelpCircle
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

export default function App() {
  // Navigation & Theme State
  const [activeRole, setActiveRole] = useState('HR Executive');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [riskFilter, setRiskFilter] = useState('All');

  const navigateTo = (tab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

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
      empId: "EMP-1082",
      name: "Aarav Sharma",
      department: "Engineering",
      role: "Senior Fullstack Engineer",
      action: "Base Salary Calibration (+12%) & On-Call Cap",
      costInr: 342000,
      riskBefore: 88,
      riskAfter: 42,
      date: "Today",
      status: "Approved"
    },
    {
      id: "INT-102",
      empId: "EMP-1045",
      name: "Rohan Verma",
      department: "Product",
      role: "Lead Product Designer",
      action: "Fast-Track Lead Promotion & 3 Days WFH",
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

  // Helper notification trigger
  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Fetch Live Data from Backend on Load
  useEffect(() => {
    const fetchLiveData = async () => {
      try {
        const [kpiRes, deptRes, empRes, metRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/kpis`).then(r => r.ok ? r.json() : null),
          fetch(`${API_BASE_URL}/api/departments`).then(r => r.ok ? r.json() : null),
          fetch(`${API_BASE_URL}/api/employees?limit=60`).then(r => r.ok ? r.json() : null),
          fetch(`${API_BASE_URL}/api/model/metrics`).then(r => r.ok ? r.json() : null),
        ]);

        if (kpiRes) {
          setKpiData(kpiRes);
          setIsBackendConnected(true);
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
    setIsDarkMode(!isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="brand-icon-box">
              <Cpu size={22} />
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
            onChange={(e) => {
              setActiveRole(e.target.value);
              showToast(`Switched view to ${e.target.value}`);
              setIsMobileMenuOpen(false);
            }}
          >
            <option value="HR Executive">HR Executive / People Ops</option>
            <option value="Team Lead">Team Lead / Engineering Mgr</option>
            <option value="Data Analyst">Data Scientist / ML Ops</option>
          </select>
        </div>

        {/* Navigation Menu */}
        <nav className="nav-section">
          <div className="nav-section-title">Workforce Intelligence</div>
          
          <button 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => navigateTo('dashboard')}
          >
            <div className="nav-item-content">
              <BarChart3 size={18} />
              <span>Executive Dashboard</span>
            </div>
          </button>

          <button 
            className={`nav-item ${activeTab === 'directory' ? 'active' : ''}`}
            onClick={() => navigateTo('directory')}
          >
            <div className="nav-item-content">
              <Users size={18} />
              <span>Flight Risk Explorer</span>
            </div>
            <span className="nav-pill">{highRiskCount} Risk</span>
          </button>

          <button 
            className={`nav-item ${activeTab === 'departments' ? 'active' : ''}`}
            onClick={() => navigateTo('departments')}
          >
            <div className="nav-item-content">
              <Building2 size={18} />
              <span>Department Radar</span>
            </div>
          </button>

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

          <div className="nav-section-title" style={{ marginTop: 14 }}>Strategy & Governance</div>
          
          <button 
            className={`nav-item ${activeTab === 'playbook' ? 'active' : ''}`}
            onClick={() => navigateTo('playbook')}
          >
            <div className="nav-item-content">
              <Lightbulb size={18} />
              <span>Retention Playbook</span>
            </div>
          </button>

          <button 
            className={`nav-item ${activeTab === 'interventions' ? 'active' : ''}`}
            onClick={() => navigateTo('interventions')}
          >
            <div className="nav-item-content">
              <CheckSquare size={18} />
              <span>Intervention Tracker</span>
            </div>
            <span className="nav-pill live">{committedPlans.length} Active</span>
          </button>

          <button 
            className={`nav-item ${activeTab === 'models' ? 'active' : ''}`}
            onClick={() => navigateTo('models')}
          >
            <div className="nav-item-content">
              <Cpu size={18} />
              <span>ML Model & Benchmarks</span>
            </div>
          </button>
        </nav>

        {/* Sidebar Footer Status */}
        <div className="sidebar-footer">
          <div className="model-status-indicator">
            <span className="pulse-dot"></span>
            <span>{isBackendConnected ? "Live API Connected (Ensemble)" : "Model v2.4 Active (86.1% Acc)"}</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-wrapper">
        {/* Top Header */}
        <header className="top-header">
          <div className="header-left-group">
            <button 
              className="mobile-menu-trigger" 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle Navigation"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="header-left">
              <div className="breadcrumb-bar">
                <span>RetentionAI</span>
                <ChevronRight size={12} />
                <span className="breadcrumb-role">{activeRole}</span>
                <ChevronRight size={12} />
                <span className="active">
                  {activeTab === 'dashboard' && 'Executive Dashboard'}
                  {activeTab === 'directory' && 'Flight Risk Explorer'}
                  {activeTab === 'departments' && 'Department Intelligence'}
                  {activeTab === 'simulator' && 'What-If Simulation'}
                  {activeTab === 'playbook' && 'Retention Strategy Catalog'}
                  {activeTab === 'interventions' && 'Intervention Tracker & ROI'}
                  {activeTab === 'models' && 'ML Model Intelligence & Benchmarks'}
                </span>
              </div>
              <h2 className="page-title">
                {activeTab === 'dashboard' && 'Workforce Attrition Overview'}
                {activeTab === 'directory' && 'Employee Risk Explorer'}
                {activeTab === 'departments' && 'Departmental Risk Distribution'}
                {activeTab === 'simulator' && 'AI What-If Retention Simulator'}
                {activeTab === 'playbook' && 'Prescriptive Retention Playbook'}
                {activeTab === 'interventions' && 'Mitigation Actions & ROI Log'}
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
            <button className="icon-btn" onClick={toggleTheme} title="Toggle Dark/Light Mode">
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="icon-btn" onClick={() => {
              setRiskFilter('Critical');
              navigateTo('directory');
              showToast('Filtered directory by Critical Risk alerts');
            }}>
              <Bell size={18} />
            </button>
            <div className="user-profile-badge">
              <img 
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80" 
                alt="Profile" 
                className="user-avatar"
              />
              <div className="user-profile-details">
                <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>HR Administrator</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{activeRole}</div>
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
                      onClick={() => setActiveTab('departments')}
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
                        setActiveTab('directory');
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

                <div style={{ display: 'flex', gap: 10 }}>
                  <button 
                    className="btn-primary"
                    onClick={() => {
                      showToast('Exporting verified workforce retention dossier (CSV/PDF)...');
                    }}
                  >
                    <FileText size={16} />
                    Export Risk Dossier
                  </button>
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
                    {filteredEmployees.map(emp => (
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
                                setActiveTab('simulator');
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
                    ))}
                  </tbody>
                </table>
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
                        setActiveTab('directory');
                      }}
                    >
                      Filter {d.department} Team &rarr;
                    </button>
                  </div>
                ))}
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
                  onClick={() => simTargetEmp && applyIntervention(simTargetEmp.id)}
                >
                  <CheckCircle2 size={18} />
                  Commit Retention Plan to Tracker
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: RETENTION PLAYBOOK */}
          {activeTab === 'playbook' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="card-title-row">
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Prescriptive AI Intervention Catalog</h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Standardized, tested retention initiatives ranked by historical retention boost and cost-efficiency.
                  </p>
                </div>
              </div>

              <div className="playbook-grid">
                {RETENTION_PLAYBOOK.map(play => (
                  <div key={play.id} className="playbook-card">
                    <div className="playbook-header">
                      <span className="playbook-category">{play.category}</span>
                      <span className="risk-badge low">Impact: {play.impactScore}/100</span>
                    </div>

                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{play.title}</h4>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                      {play.description}
                    </p>

                    <div className="playbook-metrics-row">
                      <div className="metric-pill">
                        <span>Retention Lift</span>
                        <span style={{ color: '#34d399' }}>{play.estimatedRetentionBoost}</span>
                      </div>
                      <div className="metric-pill">
                        <span>Avg Cost</span>
                        <span>{play.avgCostPerEmployee}</span>
                      </div>
                      <div className="metric-pill">
                        <span>Target Segment</span>
                        <span>{play.targetRisk}</span>
                      </div>
                      <div className="metric-pill">
                        <span>Rollout Speed</span>
                        <span>{play.implementationTime}</span>
                      </div>
                    </div>

                    <button 
                      className="btn-primary" 
                      style={{ marginTop: 8, justifyContent: 'center' }}
                      onClick={() => showToast(`Initiated automated workflow for ${play.title}`)}
                    >
                      <PlayCircle size={16} /> Deploy Strategy
                    </button>
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
                  onClick={() => setActiveTab('simulator')}
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

            {/* Action Bar */}
            <div className="modal-footer-actions">
              <button className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                Close
              </button>
              <button 
                className="btn-primary"
                onClick={() => {
                  setSimTargetEmp(selectedEmployee);
                  setIsModalOpen(false);
                  navigateTo('simulator');
                }}
              >
                <Sliders size={16} /> Open in What-If Simulator
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
