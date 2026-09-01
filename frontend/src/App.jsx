import React, { useState, useMemo } from 'react';
import { 
  Users, TrendingUp, AlertTriangle, ShieldCheck, 
  IndianRupee, Activity, Cpu, Sliders, PlayCircle, 
  Lightbulb, Search, Bell, Moon, Sun, ArrowUpRight, 
  ArrowDownRight, CheckCircle2, ChevronRight, X, 
  Upload, FileText, BarChart3, Database, RefreshCw,
  Clock, Award, Sparkles, UserCheck, Briefcase
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

export default function App() {
  // Navigation & Theme State
  const [activeRole, setActiveRole] = useState('HR Executive');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [riskFilter, setRiskFilter] = useState('All');

  // Employee State & Modals
  const [employees, setEmployees] = useState(INITIAL_EMPLOYEES);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notification, setNotification] = useState(null);

  // Simulator State (Initialized with Aarav Sharma EMP-1082)
  const [simTargetEmp, setSimTargetEmp] = useState(INITIAL_EMPLOYEES[0]);
  const [simSalaryDelta, setSimSalaryDelta] = useState(12); // +12% salary adjustment
  const [simOvertimeHours, setSimOvertimeHours] = useState(15); // reduced to 15h
  const [simRemoteDays, setSimRemoteDays] = useState(3); // 3 days/week
  const [simPromotionStatus, setSimPromotionStatus] = useState(true); // fast-track promotion
  const [simBonusAmount, setSimBonusAmount] = useState(150000); // ₹1.5 Lakhs

  // Dataset Ingestion Placeholder (Phase 2 readiness)
  const [uploadedDatasetName, setUploadedDatasetName] = useState(null);
  const [isTrainingSimulating, setIsTrainingSimulating] = useState(false);

  // Helper notification trigger
  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

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

  // Dynamic Risk Calculation in Simulator
  const simulatedRisk = useMemo(() => {
    if (!simTargetEmp) return { score: 50, tier: 'Medium', costSavings: 0 };
    
    // Baseline risk score
    let baseScore = simTargetEmp.riskScore;
    
    // Impact of salary delta
    const salaryImpact = (simSalaryDelta - 0) * 1.8; // each +1% reduces risk by 1.8 pts
    
    // Impact of overtime reduction
    const otDiff = simTargetEmp.overtimeHoursMonth - simOvertimeHours;
    const otImpact = otDiff * 0.9;
    
    // Impact of remote days
    const remoteDiff = simRemoteDays - simTargetEmp.remoteDaysPerWeek;
    const remoteImpact = remoteDiff * 4.5;
    
    // Impact of promotion
    const promoImpact = simPromotionStatus ? 14 : 0;
    
    // Impact of retention bonus
    const bonusImpact = (simBonusAmount / 50000) * 1.5;

    let computedScore = Math.round(baseScore - salaryImpact - otImpact - remoteImpact - promoImpact - bonusImpact);
    computedScore = Math.max(8, Math.min(96, computedScore));

    let tier = 'Low';
    if (computedScore >= 75) tier = 'Critical';
    else if (computedScore >= 60) tier = 'High';
    else if (computedScore >= 35) tier = 'Medium';

    // Replacement cost calculation (~1.5x salary in INR)
    const replacementCost = Math.round(simTargetEmp.salary * 1.5);
    const costSavings = Math.round(replacementCost * ((baseScore - computedScore) / 100));

    return {
      score: computedScore,
      tier,
      delta: baseScore - computedScore,
      costSavings
    };
  }, [simTargetEmp, simSalaryDelta, simOvertimeHours, simRemoteDays, simPromotionStatus, simBonusAmount]);

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
    showToast(`Retention plan applied to ${simTargetEmp.name}! Risk reduced by ${simRiskDelta} points.`);
  };

  const simRiskDelta = simTargetEmp ? simTargetEmp.riskScore - simulatedRisk.score : 0;

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

      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="brand-wrapper">
          <div className="brand-icon-box">
            <Cpu size={22} />
          </div>
          <div className="brand-text">
            <h1>RetentionAI</h1>
            <span>Workforce Intelligence</span>
          </div>
        </div>

        {/* Role Selector */}
        <div className="role-badge-box">
          <div className="role-badge-label">
            <span>Current Role View</span>
            <UserCheck size={14} />
          </div>
          <select 
            className="role-select"
            value={activeRole}
            onChange={(e) => {
              setActiveRole(e.target.value);
              showToast(`Switched view to ${e.target.value}`);
            }}
          >
            <option value="HR Executive">HR Executive / People Ops</option>
            <option value="Team Lead">Team Lead / Engineering Mgr</option>
            <option value="Data Analyst">Data Scientist / ML Ops</option>
          </select>
        </div>

        {/* Navigation Menu */}
        <nav className="nav-section">
          <div className="nav-section-title">Core Intelligence</div>
          <button 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <BarChart3 size={18} />
            <span>Executive Dashboard</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'directory' ? 'active' : ''}`}
            onClick={() => setActiveTab('directory')}
          >
            <Users size={18} />
            <span>Flight Risk Explorer</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'simulator' ? 'active' : ''}`}
            onClick={() => setActiveTab('simulator')}
          >
            <Sliders size={18} />
            <span>What-If Simulator</span>
          </button>

          <div className="nav-section-title" style={{ marginTop: 14 }}>Action & ML</div>
          <button 
            className={`nav-item ${activeTab === 'playbook' ? 'active' : ''}`}
            onClick={() => setActiveTab('playbook')}
          >
            <Lightbulb size={18} />
            <span>Retention Playbook</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'models' ? 'active' : ''}`}
            onClick={() => setActiveTab('models')}
          >
            <Cpu size={18} />
            <span>ML Model & Data (Phase 2)</span>
          </button>
        </nav>

        {/* Sidebar Footer Status */}
        <div className="sidebar-footer">
          <div className="model-status-indicator">
            <span className="pulse-dot"></span>
            <span>Model v2.4 Active (92.4% Acc)</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-wrapper">
        {/* Top Header */}
        <header className="top-header">
          <div className="header-left">
            <h2 className="page-title">
              {activeTab === 'dashboard' && 'Workforce Retention Overview'}
              {activeTab === 'directory' && 'Employee Flight Risk Directory'}
              {activeTab === 'simulator' && 'AI What-If Retention Simulator'}
              {activeTab === 'playbook' && 'AI Retention Strategy Playbook'}
              {activeTab === 'models' && 'Model Intelligence & Training Pipeline'}
            </h2>
          </div>

          <div className="search-box">
            <Search size={16} />
            <input 
              type="text" 
              placeholder="Search employee, ID, role or skill..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="header-right">
            <button className="icon-btn" onClick={toggleTheme} title="Toggle Dark/Light Mode">
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="icon-btn" onClick={() => showToast('3 critical risk alerts pending review')}>
              <Bell size={18} />
            </button>
            <div className="user-profile-badge">
              <img 
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80" 
                alt="Profile" 
                className="user-avatar"
              />
              <div style={{ lineHeight: 1.2 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>Meet Rao</div>
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
                    <span className="kpi-value">13.8%</span>
                    <span className="kpi-delta negative-good">
                      <ArrowDownRight size={14} /> -2.4% MoM
                    </span>
                  </div>
                  <span className="kpi-subtext">Calculated across 240 active team members</span>
                </div>

                <div className="kpi-card" style={{ '--card-accent': 'linear-gradient(90deg, #f43f5e, #fb7185)' }}>
                  <div className="kpi-header">
                    <span>Critical / High Flight Risk</span>
                    <div className="kpi-icon" style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e' }}>
                      <AlertTriangle size={18} />
                    </div>
                  </div>
                  <div className="kpi-value-row">
                    <span className="kpi-value">38</span>
                    <span className="kpi-delta positive-bad">
                      <ArrowUpRight size={14} /> 4 New High-Risk
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
                    <span className="kpi-value">₹1.18 Cr</span>
                    <span className="kpi-delta negative-good">
                      <ArrowDownRight size={14} /> ₹15.4 Lakh saved
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
                    <span className="kpi-value">4.8x</span>
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
                    <span className="card-badge">Live ML Prediction</span>
                  </div>
                  <div style={{ height: 300, width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={DEPARTMENT_METRICS} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="department" stroke="#64748b" fontSize={12} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={12} tickLine={false} unit="%" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0d1322', borderColor: 'rgba(255,255,255,0.1)', borderRadius: 10 }}
                          formatter={(val) => [`${val}%`, 'Avg Risk']}
                        />
                        <Bar dataKey="avgRisk" radius={[6, 6, 0, 0]}>
                          {DEPARTMENT_METRICS.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.avgRisk > 45 ? '#f43f5e' : entry.avgRisk > 35 ? '#f59e0b' : '#10b981'} 
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
                    <button className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => setActiveTab('directory')}>
                      View All
                    </button>
                  </div>

                  <div className="risk-feed-list">
                    {employees.filter(e => e.riskTier === 'Critical' || e.riskTier === 'High').map(emp => (
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
                            Inspect Profile &rarr;
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
                    <option value="Engineering">Engineering</option>
                    <option value="Product">Product</option>
                    <option value="Sales">Sales</option>
                    <option value="Customer Success">Customer Success</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Finance">Finance</option>
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
                      showToast('Simulating batch retention export report...');
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

          {/* TAB 3: WHAT-IF RETENTION SIMULATOR */}
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
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>
                        {e.name} ({e.role} - Current Risk: {e.riskScore}%)
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
                  <span className="card-badge">Live SHAP Prediction</span>
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
                  Commit Retention Plan to Workforce State
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: RETENTION PLAYBOOK */}
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

          {/* TAB 5: ML MODEL INTELLIGENCE & DATASET INGESTION (PHASE 2 READY) */}
          {activeTab === 'models' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Benchmark Summary */}
              <div className="chart-card">
                <div className="card-title-row">
                  <div>
                    <h3 className="card-title">
                      <Cpu size={18} color="#6366f1" />
                      Active Model Architecture & Benchmarks
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      Architecture: <strong>{MODEL_BENCHMARKS.activeModel}</strong> • {MODEL_BENCHMARKS.trainedOn}
                    </p>
                  </div>
                  <span className="card-badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#34d399' }}>
                    Production Ready
                  </span>
                </div>

                <div className="ml-benchmark-grid" style={{ marginTop: 14 }}>
                  <div className="ml-metric-box">
                    <div className="val">{MODEL_BENCHMARKS.accuracy}</div>
                    <div className="lbl">Overall Accuracy</div>
                  </div>
                  <div className="ml-metric-box">
                    <div className="val">{MODEL_BENCHMARKS.rocAuc}</div>
                    <div className="lbl">ROC-AUC Score</div>
                  </div>
                  <div className="ml-metric-box">
                    <div className="val">{MODEL_BENCHMARKS.precision}</div>
                    <div className="lbl">Precision</div>
                  </div>
                  <div className="ml-metric-box">
                    <div className="val">{MODEL_BENCHMARKS.recall}</div>
                    <div className="lbl">Recall (Flight Risk)</div>
                  </div>
                </div>
              </div>

              {/* Feature Importance & Ingestion Dropzone */}
              <div className="grid-2-col">
                {/* Feature Importance Bar Chart */}
                <div className="chart-card">
                  <div className="card-title-row">
                    <h3 className="card-title">
                      <BarChart3 size={18} color="#06b6d4" />
                      Top Predictive Feature Importances (SHAP Values)
                    </h3>
                  </div>
                  <div style={{ height: 260, width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={MODEL_BENCHMARKS.topFeatures} 
                        layout="vertical"
                        margin={{ top: 5, right: 20, left: 60, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis type="number" stroke="#64748b" fontSize={11} domain={[0, 0.35]} />
                        <YAxis dataKey="feature" type="category" stroke="#94a3b8" fontSize={11} width={130} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0d1322', borderColor: 'rgba(255,255,255,0.1)', borderRadius: 10 }}
                          formatter={(val) => [(val * 100).toFixed(1) + '%', 'Relative Weight']}
                        />
                        <Bar dataKey="importance" fill="#6366f1" radius={[0, 6, 6, 0]}>
                          {MODEL_BENCHMARKS.topFeatures.map((entry, index) => (
                            <Cell key={`feat-${index}`} fill={index === 0 ? '#f43f5e' : index === 1 ? '#38bdf8' : '#818cf8'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Phase 2 Dataset Ingestion Portal */}
                <div className="chart-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div className="card-title-row">
                      <h3 className="card-title">
                        <Database size={18} color="#818cf8" />
                        Phase 2: Ingest Custom Dataset
                      </h3>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 8 }}>
                      Once you place your CSV/Excel dataset file in the workspace, this pipeline will train and cross-validate custom XGBoost & Random Forest models.
                    </p>
                  </div>

                  <div 
                    className="dropzone-box"
                    onClick={() => {
                      setUploadedDatasetName('hr_workforce_dataset.csv');
                      showToast('Dataset referenced! Ready for Phase 2 model training.');
                    }}
                  >
                    <Upload size={32} color="#6366f1" />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                        {uploadedDatasetName ? `Loaded: ${uploadedDatasetName}` : 'Drop or Reference Dataset File (CSV / XLSX)'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        Supports Indian Tech / IT & Global HRMS schemas
                      </div>
                    </div>
                  </div>

                  <button 
                    className="btn-primary" 
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => {
                      setIsTrainingSimulating(true);
                      showToast('Triggering pipeline validation...');
                      setTimeout(() => {
                        setIsTrainingSimulating(false);
                        showToast('Dataset schema validated! Ready for ML training execution in Phase 2.');
                      }, 1800);
                    }}
                  >
                    <RefreshCw size={16} className={isTrainingSimulating ? 'pulse-dot' : ''} />
                    {isTrainingSimulating ? 'Validating Schema & Preprocessing...' : 'Initiate Phase 2 Training Pipeline'}
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
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
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, borderTop: '1px solid var(--border-subtle)', paddingTop: 16 }}>
              <button className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                Close
              </button>
              <button 
                className="btn-primary"
                onClick={() => {
                  setSimTargetEmp(selectedEmployee);
                  setIsModalOpen(false);
                  setActiveTab('simulator');
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
