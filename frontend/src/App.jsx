import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  AlertCircle, LayoutDashboard, TrendingUp, Frown, Activity, 
  Users, Lightbulb, ShieldCheck, Download, ChevronRight, 
  ArrowUpRight, ArrowDownRight, Bell, Search, Settings, 
  Zap, Lock, User, Sun, Moon, Filter, Play, ActivitySquare, SlidersHorizontal, X, FileSearch, Upload
} from 'lucide-react';
import './App.css';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const roleNavConfig = {
  "HR Manager": {
    intelligence: [
      { name: 'Dashboard', icon: LayoutDashboard },
      { name: 'Attrition Risk', icon: TrendingUp },
      { name: 'Disengagement', icon: Frown },
    ],
    operations: [
      { name: 'Directory', icon: Users },
      { name: 'Recommendations', icon: Lightbulb },
      { name: 'Access Control', icon: ShieldCheck }
    ]
  },
  "Team Lead": {
    intelligence: [
      { name: 'Team Capacity', icon: Activity },
      { name: 'Burnout Warnings', icon: AlertCircle },
    ],
    operations: [
      { name: 'Team Directory', icon: Users }
    ]
  },
  "Data Analyst": {
    intelligence: [
      { name: 'Data Pipeline (Anon)', icon: LayoutDashboard },
      { name: 'Model Metrics', icon: Activity }
    ],
    operations: [
      { name: 'Feature Tuning', icon: Settings },
      { name: 'Model Re-training', icon: Zap }
    ]
  }
};

export default function App() {
  const [user, setUser] = useState(null); // {username, role}
  const [activeTab, setActiveTab] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [dashData, setDashData] = useState(null);
  const [isDark, setIsDark] = useState(false);
  const [dirSearch, setDirSearch] = useState('');
  
  // Advanced Simulation State
  const [insightTime, setInsightTime] = useState('Last 6 Months');
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [simValues, setSimValues] = useState({ working_hours: 40, performance_rating: 3, leave_count: 0, task_completion: 0, transfers: 0, salary: 0 });
  const [simRisk, setSimRisk] = useState(0);

  const openReviewModal = (emp) => {
    setSelectedEmp(emp);
    setSimValues({ 
      working_hours: emp.working_hours, 
      performance_rating: emp.performance_rating, 
      leave_count: emp.leave_count, 
      task_completion: emp.task_completion, 
      transfers: emp.transfers, 
      salary: emp.salary 
    });
    setSimRisk(emp.predicted_risk);
    setReviewModalOpen(true);
  };

  useEffect(() => {
    if (selectedEmp) {
      const fetchRisk = async () => {
        try {
          const response = await axios.post('http://localhost:8000/api/predict', {
            working_hours: parseFloat(simValues.working_hours),
            leave_count: parseInt(simValues.leave_count),
            performance_rating: parseFloat(simValues.performance_rating),
            task_completion: parseFloat(simValues.task_completion),
            transfers: parseInt(simValues.transfers)
          });
          setSimRisk(response.data.risk_score);
        } catch (err) {
          console.error("Error predicting risk", err);
        }
      };
      
      const timer = setTimeout(() => {
        fetchRisk();
      }, 250); // debounce API requests
      
      return () => clearTimeout(timer);
    }
  }, [simValues, selectedEmp]);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }, [isDark]);

  useEffect(() => {
    if (user) {
      axios.get(`http://localhost:8000/api/dashboard?role=${user.role}`)
        .then(res => setDashData(res.data))
        .catch(err => console.error("Error fetching dashboard data", err));
    }
  }, [user]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const cleanData = {
        username: loginData.username.trim(),
        password: loginData.password.trim()
      };
      const res = await axios.post('http://localhost:8000/api/login', cleanData);
      const u = res.data;
      setUser(u);
      
      if (u.role === 'HR Manager') setActiveTab('Dashboard');
      else if (u.role === 'Team Lead') setActiveTab('Team Capacity');
      else if (u.role === 'Data Analyst') setActiveTab('Data Pipeline (Anon)');
      
      setError('');
    } catch (err) {
      setError('Invalid credentials. Please try again.');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setLoginData({ username: '', password: '' });
    setDashData(null);
  };

  const handleCommitRetentionPlan = async () => {
    if (!selectedEmp) return;
    try {
      await axios.post(`http://localhost:8000/api/employees/${selectedEmp.emp_id}/update`, {
        working_hours: parseFloat(simValues.working_hours),
        performance_rating: parseFloat(simValues.performance_rating),
        leave_count: parseInt(simValues.leave_count),
        task_completion: parseFloat(simValues.task_completion),
        transfers: parseInt(simValues.transfers)
      });
      
      const res = await axios.get(`http://localhost:8000/api/dashboard?role=${user.role}`);
      setDashData(res.data);
      
      setReviewModalOpen(false);
      setSelectedEmp(null);
      alert("Retention plan committed successfully! Metrics updated in core database.");
    } catch (err) {
      console.error("Error committing retention plan", err);
      alert("Failed to commit retention plan. Please try again.");
    }
  };

  if (!user) {
    return (
      <div className={`app-container login-wrapper ${isLoaded ? 'loaded' : ''}`}>
        <div className="bg-orb orb-1"></div>
        <div className="bg-orb orb-2"></div>
        <div className="login-card">
          <div className="login-logo">
            <Zap size={32} />
          </div>
          <h2 className="login-title">RETENTION AI</h2>
          <p className="login-subtitle">Authenticate to access Command Center</p>
          
          {error && <div className="login-error">{error}</div>}
          
          <form onSubmit={handleLogin} className="login-form">
            <div className="input-group">
              <User size={18} className="input-icon" />
              <input 
                type="text" 
                placeholder="Username" 
                value={loginData.username}
                onChange={e => setLoginData({...loginData, username: e.target.value})}
                required
              />
            </div>
            <div className="input-group">
              <Lock size={18} className="input-icon" />
              <input 
                type="password" 
                placeholder="Password" 
                value={loginData.password}
                onChange={e => setLoginData({...loginData, password: e.target.value})}
                required
              />
            </div>
            <button type="submit" className="btn-primary login-btn">Secure Login</button>
          </form>

          <div className="demo-credentials">
            <strong>System Roles (Demo Logins):</strong>
            <p>admin / admin (HR Manager)</p>
            <p>lead / lead (Team Lead)</p>
            <p>analyst / analyst (Data Analyst)</p>
          </div>
        </div>
      </div>
    );
  }

  const { intelligence, operations } = roleNavConfig[user.role] || roleNavConfig["HR Manager"];

  return (
    <div className={`app-container ${isLoaded ? 'loaded' : ''}`}>
      <div className="bg-orb orb-1"></div>
      <div className="bg-orb orb-2"></div>

      <nav className="glass-sidebar" aria-label="Main Navigation">
        <div className="sidebar-brand">
          <div className="brand-logo">
            <Zap size={24} className="brand-icon" />
          </div>
          <div className="brand-text">
            <div className="sidebar-title">RETENTION AI</div>
            <div className="sidebar-subtitle">{user.role} View</div>
          </div>
        </div>

        <div className="sidebar-scroll">
          <div className="sidebar-section">
            <h2 className="sidebar-section-title">INTELLIGENCE</h2>
            <ul className="nav-list">
              {intelligence.map(item => (
                <li key={item.name}>
                  <button 
                    className={`sidebar-item ${activeTab === item.name ? 'active' : ''}`}
                    onClick={() => setActiveTab(item.name)}
                  >
                    <item.icon size={18} className="nav-icon" />
                    <span>{item.name}</span>
                    {activeTab === item.name && <ChevronRight size={16} className="active-indicator" />}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="sidebar-section">
            <h2 className="sidebar-section-title">OPERATIONS</h2>
            <ul className="nav-list">
              {operations.map(item => (
                <li key={item.name}>
                  <button 
                    className={`sidebar-item ${activeTab === item.name ? 'active' : ''}`}
                    onClick={() => setActiveTab(item.name)}
                  >
                    <item.icon size={18} className="nav-icon" />
                    <span>{item.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="user-profile" title="Click icon to logout">
            <div className="avatar">{user.username.substring(0,2).toUpperCase()}</div>
            <div className="user-info">
              <span className="user-name">{user.username}</span>
              <span className="user-role">{user.role}</span>
            </div>
            <button className="icon-btn" onClick={handleLogout} style={{width: 32, height: 32, zIndex: 20}}>
              <Settings size={16} className="settings-icon" />
            </button>
          </div>
        </div>
      </nav>

      <main className="main-wrapper" id="main-content">
        <header className="top-bar">
          <div className="header-text">
            <h1 className="main-title">{activeTab}</h1>
            <p className="main-subtitle">Secure Access: {user.role} · {user.role === 'Team Lead' ? 'Engineering Dept' : (user.role === 'Data Analyst' ? 'Anonymized Dataset' : 'All Departments')}</p>
          </div>
          <div className="top-actions">
            <button className="btn-primary" style={{display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 1rem', fontSize: '0.85rem', whiteSpace: 'nowrap'}} onClick={() => prompt('Enter external DB connection URI:')}>
              <Upload size={16} /> Upload Data
            </button>
            <div className="search-bar">
              <Search size={18} />
              <input type="text" placeholder="Search..." />
            </div>
            <button className="icon-btn" onClick={() => setIsDark(!isDark)} aria-label="Toggle Theme">
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button className="icon-btn">
              <Bell size={20} />
              <span className="notification-dot"></span>
            </button>
          </div>
        </header>

        {activeTab === 'Dashboard' && (
          <>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
              <h2 style={{color: 'var(--text-primary)', margin: 0, fontSize: '1.2rem'}}>Dynamic Insight Engine</h2>
              <select style={{background: 'var(--glass-bg)', color: 'var(--text-primary)', padding: '0.4rem 0.8rem', border: '1px solid var(--glass-border)', borderRadius: '6px', fontSize: '0.85rem', outline: 'none'}} value={insightTime} onChange={(e) => setInsightTime(e.target.value)}>
                 <option>Last 30 Days</option>
                 <option>Last 3 Months</option>
                 <option>Last 6 Months</option>
                 <option>1 Year Horizon</option>
              </select>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              {dashData?.data && (
                <div className="glass-panel" style={{padding: '1.5rem', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)', cursor: 'pointer', transition: 'transform 0.2s'}} onClick={() => setActiveTab('Attrition Risk')} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                   <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem'}}>
                     <AlertCircle size={20} color="var(--accent-red)"/> 
                     <h3 style={{margin: 0, color: 'var(--text-primary)', fontSize: '1rem'}}>Surge in Flight Risks</h3>
                   </div>
                   <p style={{fontSize: '0.9rem', color: 'var(--text-secondary)'}}>Model detected {dashData.data.filter(e => e.predicted_risk > 50).length} high-risk personnel in {insightTime}.</p>
                   <div style={{marginTop: '1.25rem'}}>
                      <strong style={{fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Core Drivers:</strong>
                      <ul style={{fontSize: '0.85rem', color: 'var(--text-primary)', paddingLeft: '1.2rem', marginTop: '0.5rem', marginBottom: 0}}>
                        <li style={{marginBottom: '0.25rem'}}>Excess {insightTime === 'Last 30 Days' ? 'clinical' : 'operational'} overtime tracking flagged</li>
                        <li>Below-average job satisfaction proxy matched</li>
                      </ul>
                   </div>
                </div>
              )}
              
              <div className="glass-panel" style={{padding: '1.5rem', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.1)'}}>
                   <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem'}}>
                     <ActivitySquare size={20} color="var(--accent-emerald)"/> 
                     <h3 style={{margin: 0, color: 'var(--text-primary)', fontSize: '1rem'}}>Retention Metric Stable</h3>
                   </div>
                   <p style={{fontSize: '0.9rem', color: 'var(--text-secondary)'}}>Surgical department attrition risk normalized over the {insightTime}.</p>
                   <div style={{marginTop: '1.25rem'}}>
                      <strong style={{fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Core Drivers:</strong>
                      <ul style={{fontSize: '0.85rem', color: 'var(--text-primary)', paddingLeft: '1.2rem', marginTop: '0.5rem', marginBottom: 0}}>
                        <li>Recent cross-department comp cycle adjustments</li>
                      </ul>
                   </div>
              </div>
            </div>



        <section className="kpi-row">
          <KpiCard 
            title="TOTAL HEADCOUNT" 
            value={dashData?.kpis ? dashData.kpis.total_headcount : "..."} 
            trend="Active Profiles" 
            isPositive={true} 
            color="blue" 
            onClick={() => setActiveTab('Directory')}
          />
          <KpiCard 
            title="ATTRITION RATE" 
            value={dashData?.kpis ? dashData.kpis.attrition_rate : "..."} 
            suffix="%" 
            trend="Model Output" 
            isPositive={false} 
            color="red" 
            onClick={() => setActiveTab('Attrition Risk')}
          />
          <KpiCard 
            title="AVG WEEKLY HOURS" 
            value={dashData?.kpis ? dashData.kpis.avg_weekly_hours : "..."} 
            suffix="h" 
            trend="Capacity Proxy" 
            isPositive={dashData?.kpis?.avg_weekly_hours <= 40} 
            color={dashData?.kpis?.avg_weekly_hours > 45 ? 'orange' : 'emerald'} 
          />
          {user.role === 'Data Analyst' ? (
            <KpiCard 
              title="MODEL ACCURACY" 
              value="89.4" 
              suffix="%" 
              trend="RandomForest" 
              isPositive={true} 
              color="purple" 
            />
          ) : (
            <KpiCard 
              title="BURNOUT INDEX (PROXY)" 
              value={dashData?.kpis ? dashData.kpis.burnout_index : "..."} 
              suffix="/100" 
              trend={dashData?.kpis?.burnout_index > 60 ? "Critical Warning" : "Stable Baseline"} 
              isPositive={dashData?.kpis?.burnout_index < 60} 
              color={dashData?.kpis?.burnout_index > 60 ? "orange" : "emerald"} 
            />
          )}
        </section>

        <div className="dashboard-grid">
          <section className="chart-card glass-panel" style={{display: 'flex', flexDirection: 'column'}}>
            <header className="card-header" style={{flex: '0 0 auto', marginBottom: '1rem'}}>
              <h3 className="card-title">
                {user.role === 'Data Analyst' ? 'Feature Importance (Global)' : 'Disengagement Vectors'}
              </h3>
              <span className="badge-ai" style={{cursor: 'pointer'}} title="Powered by Recharts">Live Interactive Data</span>
            </header>
            <div style={{ flex: '1 1 auto', width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashData?.data ? [
                    { name: "Overtime Proxy", pct: Math.round(dashData.data.filter(e => e.working_hours > 40).length / dashData.data.length * 100), fill: "var(--accent-red)" },
                    { name: "Perf Friction", pct: Math.round(dashData.data.filter(e => e.performance_rating < 3).length / dashData.data.length * 100), fill: "var(--accent-orange)" },
                    { name: "WLB Deficit", pct: Math.round(dashData.data.filter(e => e.leave_count < 10).length / dashData.data.length * 100), fill: "var(--accent-purple)" },
                    { name: "High Flight Risk", pct: Math.round(dashData.data.filter(e => e.predicted_risk > 50).length / dashData.data.length * 100), fill: "var(--accent-blue)" }
                  ] : []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{fill: 'rgba(150,150,150,0.1)'}} 
                    contentStyle={{background: 'var(--glass-bg)', borderColor: 'var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)', boxShadow: '0 8px 32px rgba(0,0,0,0.12)'}} 
                    formatter={(value) => [`${value}% of total personnel`, 'Prevalence']}
                  />
                  <Bar dataKey="pct" radius={[4, 4, 0, 0]} animationDuration={1500} barSize={45}>
                    {dashData?.data && [
                        { fill: "var(--accent-red)" },
                        { fill: "var(--accent-orange)" },
                        { fill: "var(--accent-purple)" },
                        { fill: "var(--accent-blue)" }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} style={{transition: 'fill 0.3s ease-out'}} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="chart-card glass-panel">
            <header className="card-header">
              <h3 className="card-title">Event Stream</h3>
              <button className="btn-text">Filter</button>
            </header>
            <div className="event-list">
              {dashData?.data && dashData.data.filter(emp => emp.predicted_risk > 50).slice(0, 3).map((emp, i) => (
                 <EventItem key={i} type="danger" title={`${emp.name} flagged for high attrition risk (${(emp.predicted_risk).toFixed(0)}%)`} meta={`Dept: ${emp.department} · Overtime: ${emp.working_hours > 40 ? 'Yes' : 'No'}`} onAction={() => { setActiveTab('Attrition Risk'); setTimeout(() => openReviewModal(emp), 100); }} />
              ))}
              {dashData?.data && dashData.data.filter(emp => emp.predicted_risk > 50).length === 0 && (
                 <EventItem type="success" title="No high-risk profiles detected across organization." meta="Stable" />
              )}
              <EventItem type="info" title="System synchronised with Database backend" meta="Just now" />
            </div>
          </section>
        </div>
        </>
        )}

        {/* Directory Tab View */}
        {activeTab === 'Directory' && (
          <div className="directory-container glass-panel" style={{ padding: '2rem' }}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
              <h2 style={{color: 'var(--text-primary)', margin: 0}}>Personnel Directory</h2>
              <div className="search-bar" style={{width: '300px'}}>
                <Search size={16} />
                <input 
                  type="text" 
                  placeholder="Search by name, ID, or department..." 
                  value={dirSearch}
                  onChange={(e) => setDirSearch(e.target.value)}
                  style={{width: '100%'}}
                />
              </div>
            </div>
            
            {!dashData?.data ? (
              <p className="text-muted">Loading personnel records...</p>
            ) : (
              <div style={{ overflowX: 'auto', maxHeight: '65vh', overflowY: 'auto', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>
              <table style={{width: '100%', textAlign: 'left', borderCollapse: 'separate', borderSpacing: 0}}>
                <thead style={{position: 'sticky', top: 0, zIndex: 10}}>
                  <tr style={{background: 'var(--bg-card, #f8fafc)', color: 'var(--text-muted)', fontSize: '0.85rem'}}>
                    <th style={{padding: '1rem', whiteSpace: 'nowrap', borderBottom: '1px solid var(--glass-border)'}}>ID / NAME</th>
                    <th style={{padding: '1rem', whiteSpace: 'nowrap', borderBottom: '1px solid var(--glass-border)'}}>DEPARTMENT</th>
                    <th style={{padding: '1rem', whiteSpace: 'nowrap', borderBottom: '1px solid var(--glass-border)'}}>ROLE</th>
                    <th style={{padding: '1rem', whiteSpace: 'nowrap', borderBottom: '1px solid var(--glass-border)'}}>MONTHLY INCOME</th>
                    <th style={{padding: '1rem', whiteSpace: 'nowrap', borderBottom: '1px solid var(--glass-border)'}}>EXCESS OT?</th>
                    <th style={{padding: '1rem', whiteSpace: 'nowrap', borderBottom: '1px solid var(--glass-border)'}}>ATTRITION RISK</th>
                    <th style={{padding: '1rem', whiteSpace: 'nowrap', borderBottom: '1px solid var(--glass-border)'}}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {dashData.data
                    .filter(emp => 
                      emp.name.toLowerCase().includes(dirSearch.toLowerCase()) || 
                      emp.department.toLowerCase().includes(dirSearch.toLowerCase()) ||
                      emp.emp_id.toLowerCase().includes(dirSearch.toLowerCase())
                    )
                    .map(emp => (
                    <tr key={emp.emp_id} style={{borderBottom: '1px solid rgba(0,0,0,0.02)', color: 'var(--text-primary)'}}>
                      <td style={{padding: '1rem', whiteSpace: 'nowrap'}}><strong>{emp.emp_id}</strong><br/><span style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>{emp.name}</span></td>
                      <td style={{padding: '1rem', whiteSpace: 'nowrap'}}>{emp.department}</td>
                      <td style={{padding: '1rem', whiteSpace: 'nowrap'}}>{emp.role}</td>
                      <td style={{padding: '1rem', whiteSpace: 'nowrap'}}>${emp.salary.toLocaleString()}</td>
                      <td style={{padding: '1rem', whiteSpace: 'nowrap'}}>{emp.working_hours > 40 ? <span style={{color: 'var(--accent-red)'}}>Yes</span> : 'No'}</td>
                      <td style={{padding: '1rem', whiteSpace: 'nowrap'}}><strong>{(emp.predicted_risk).toFixed(1)}%</strong></td>
                      <td style={{padding: '1rem', whiteSpace: 'nowrap'}}>
                        <span className={`badge`} style={{background: emp.predicted_risk > 50 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: emp.predicted_risk > 50 ? 'var(--accent-red)' : 'var(--accent-emerald)', padding: '0.25rem 0.75rem', borderRadius: '100px', fontSize: '0.8rem'}}>
                          {emp.predicted_risk > 50 ? 'At Risk' : 'Retained'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {dashData.data.filter(emp => emp.name.toLowerCase().includes(dirSearch.toLowerCase()) || emp.department.toLowerCase().includes(dirSearch.toLowerCase()) || emp.emp_id.toLowerCase().includes(dirSearch.toLowerCase())).length === 0 && (
                    <tr>
                      <td colSpan="7" style={{textAlign: 'center', padding: '2rem', color: 'var(--text-muted)'}}>No employees found matching "{dirSearch}"</td>
                    </tr>
                  )}
                </tbody>
              </table>
              </div>
            )}
          </div>
        )}

        {/* Attrition Risk Detail View */}
        {/* Attrition Risk Detail View */}
        {activeTab === 'Attrition Risk' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minMax(300px, 1fr) 2fr', gap: '1.5rem' }}>
               {/* Left Column: Chart & Stats */}
               <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
                 <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '1.1rem' }}>Risk by Department</h3>
                 <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Distribution of high-risk profiles</p>
                 <div style={{ height: '250px', width: '100%', marginBottom: '1rem' }}>
                    <ResponsiveContainer>
                       <BarChart data={(() => {
                           const highRiskEmps = dashData?.data ? dashData.data.filter(emp => emp.predicted_risk > 50) : [];
                           const deptCounts = highRiskEmps.reduce((acc, emp) => {
                             acc[emp.department] = (acc[emp.department] || 0) + 1;
                             return acc;
                           }, {});
                           return Object.keys(deptCounts).map(dept => ({ name: dept, count: deptCounts[dept] })).sort((a,b) => b.count - a.count);
                       })()} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                         <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                         <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                         <Tooltip cursor={{fill: 'rgba(150,150,150,0.1)'}} contentStyle={{background: 'var(--glass-bg)', borderColor: 'var(--glass-border)', color: 'var(--text-primary)', borderRadius: '8px'}} />
                         <Bar dataKey="count" fill="var(--accent-red)" radius={[4, 4, 0, 0]} barSize={25} />
                       </BarChart>
                    </ResponsiveContainer>
                 </div>
                 
                 <div style={{ marginTop: 'auto', padding: '1.25rem', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-red)', marginBottom: '0.5rem' }}>
                      <AlertCircle size={18} />
                      <strong style={{ fontSize: '0.9rem' }}>Critical Threshold (&gt;50%)</strong>
                   </div>
                   <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>These employees require immediate 1-on-1 retention reviews. The algorithm confidently identifies correlated historical turnover attributes.</p>
                 </div>
               </div>

               {/* Right Column: Interactive List */}
               <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '72vh' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '1.1rem' }}>High Flight-Risk Profiles</h3>
                    <div className="search-bar" style={{ width: '220px' }}>
                      <Search size={14} />
                      <input type="text" placeholder="Search profiles..." id="risk-search" style={{ fontSize: '0.85rem' }} onChange={(e) => {
                         const term = e.target.value.toLowerCase();
                         document.querySelectorAll('.risk-card-item').forEach(el => {
                            el.style.display = el.innerText.toLowerCase().includes(term) ? 'flex' : 'none';
                         });
                      }}/>
                    </div>
                  </div>
                  
                  <div style={{ overflowY: 'auto', paddingRight: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                    {dashData?.data && dashData.data.filter(emp => emp.predicted_risk > 50).map((emp, i) => (
                      <div key={i} className="risk-card-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', border: '1px solid var(--glass-border)', borderRadius: '12px', background: 'var(--glass-bg)', transition: 'all 0.2s', cursor: 'pointer' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.boxShadow = 'none'; }}>
                         
                         <div style={{ flex: 1 }}>
                           <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem'}}>
                             <h4 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '1rem' }}>{emp.name}</h4>
                             <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '100px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>{emp.emp_id}</span>
                           </div>
                           <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.85rem' }}>{emp.role} · {emp.department} | ${emp.salary.toLocaleString()}/mo</p>
                           <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.75rem' }}>
                              <span style={{ fontSize: '0.8rem', color: emp.working_hours > 40 ? 'var(--accent-red)' : 'var(--text-secondary)' }}>
                                 <strong>Hrs/Wk:</strong> {emp.working_hours > 40 ? 'Overtime Flag' : 'Standard'}
                              </span>
                              <span style={{ fontSize: '0.8rem', color: emp.performance_rating < 3 ? 'var(--accent-orange)' : 'var(--text-secondary)' }}>
                                 <strong>Perf Proxy:</strong> {(emp.performance_rating).toFixed(1)} / 4.0
                              </span>
                           </div>
                         </div>
                         
                         <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginLeft: '1rem' }}>
                           <div style={{display: 'flex', alignItems: 'baseline', gap: '2px'}}>
                             <span style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--accent-red)', lineHeight: 1 }}>{emp.predicted_risk.toFixed(1)}</span>
                             <span style={{ fontSize: '0.85rem', color: 'var(--accent-red)', fontWeight: 500 }}>%</span>
                           </div>
                           <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Attr. Prob</span>
                           <button className="btn-alert" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }} onClick={(e) => { e.stopPropagation(); openReviewModal(emp); }}>
                             Simulate Case
                           </button>
                         </div>
                      </div>
                    ))}
                    {dashData?.data && dashData.data.filter(emp => emp.predicted_risk > 50).length === 0 && <p className="text-muted" style={{textAlign: 'center', marginTop: '2rem'}}>No high risk personnel matched.</p>}
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* Disengagement Vectors Deep Dive */}
        {activeTab === 'Disengagement' && (
          <div className="glass-panel" style={{padding: '2rem'}}>
             <h2 style={{color: 'var(--text-primary)', marginBottom: '1.5rem'}}>Proxy Metric Distributions</h2>
             <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem'}}>
                <div style={{background: 'var(--glass-bg)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--glass-border)'}}>
                  <h3 style={{color: 'var(--text-primary)', marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem'}}>Work-Life Balance Deficits (Proxy)</h3>
                  <p style={{color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem'}}>Employees logging under 10 leave intervals indicate severely disrupted work expectations or resourcing.</p>
                  {dashData?.data && dashData.data.filter(emp => emp.leave_count < 10).slice(0,5).map((emp, i) => (
                    <div key={i} style={{display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', color: 'var(--text-primary)'}}>
                      <span>{emp.name} ({emp.department})</span>
                      <strong style={{color: 'var(--accent-orange)'}}>{emp.leave_count} leaves logged</strong>
                    </div>
                  ))}
                </div>
                
                <div style={{background: 'var(--glass-bg)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--glass-border)'}}>
                  <h3 style={{color: 'var(--text-primary)', marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem'}}>Performance Friction (Proxy)</h3>
                  <p style={{color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem'}}>Associates indexing below 3.0 on standard operational checks, suggesting potential disengagement.</p>
                  {dashData?.data && dashData.data.filter(emp => emp.performance_rating < 3).slice(0,5).map((emp, i) => (
                    <div key={i} style={{display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', color: 'var(--text-primary)'}}>
                      <span>{emp.name} ({emp.role})</span>
                      <strong style={{color: 'var(--accent-red)'}}>{emp.performance_rating.toFixed(1)} / 4.0</strong>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        )}

        {/* Recommendations Panel */}
        {activeTab === 'Recommendations' && (
          <div className="glass-panel" style={{padding: '2rem'}}>
             <h2 style={{color: 'var(--text-primary)', marginBottom: '1.5rem'}}>Automated Analytical Actions</h2>
             {!dashData?.recommendations ? (
                 <p className="text-muted">Generating...</p>
             ) : (
                <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                  {dashData.recommendations.map((rec, i) => (
                    <div key={i} style={{background: 'var(--glass-bg)', border: `1px solid ${rec.color || 'var(--glass-border)'}`, padding: '1.5rem', borderRadius: '8px', borderLeft: `8px solid ${rec.color || '#fff'}`}}>
                       <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                          <h3 style={{color: 'var(--text-primary)', margin: 0}}>{rec.issue}</h3>
                          <span style={{padding: '0.2rem 0.8rem', borderRadius: '100px', fontSize: '0.8rem', background: rec.urgency === 'High' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.1)', color: rec.color}}>
                            {rec.urgency} Priority
                          </span>
                       </div>
                       <p style={{color: 'var(--text-secondary)', marginTop: '0.75rem'}}>{rec.action}</p>
                       {rec.urgency === 'High' && <button className="btn-primary" style={{marginTop: '1rem', padding: '0.5rem 1rem'}}>Execute System Policy</button>}
                    </div>
                  ))}
                </div>
             )}
          </div>
        )}

        {/* Access Control Profile */}
        {activeTab === 'Access Control' && (
          <div className="glass-panel" style={{padding: '2rem'}}>
             <h2 style={{color: 'var(--text-primary)', marginBottom: '1.5rem'}}>RBAC Policies & Audit Logs</h2>
             <table style={{width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '1rem', background: 'var(--glass-bg)', borderRadius: '12px'}}>
                <thead>
                  <tr style={{borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)'}}>
                    <th style={{padding: '1rem'}}>User Handle</th>
                    <th>RBAC Clearances</th>
                    <th>Last Authenticated</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {['admin - HR Manager', 'lead - Team Lead', 'analyst - Data Analyst'].map((userProfile, i) => {
                     const [id, role] = userProfile.split(' - ');
                     return (
                        <tr key={i} style={{borderBottom: '1px solid rgba(0,0,0,0.02)', color: 'var(--text-primary)'}}>
                          <td style={{padding: '1rem'}}><strong>{id}</strong></td>
                          <td>
                            <span style={{background: 'rgba(168, 85, 247, 0.1)', color: 'var(--accent-purple)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem'}}>{role}</span>
                            {role === 'HR Manager' && <span style={{background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-emerald)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', marginLeft: '0.5rem'}}>Superuser</span>}
                          </td>
                          <td style={{color: 'var(--text-secondary)'}}>Today, {new Date().toLocaleTimeString()}</td>
                          <td><button className="btn-text" style={{textDecoration: 'underline'}}>Revoke Tokens</button></td>
                        </tr>
                     );
                  })}
                </tbody>
             </table>
             <div style={{marginTop: '3rem'}}>
               <h3 style={{color: 'var(--text-primary)', fontSize: '1rem'}}>System Information</h3>
                        <p style={{color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem'}}>Dataset Binding: employee_data.db (IBM Watson Healthcare Mapped Strategy)<br/>Security Wrapper: bcrypt + cryptography.fernet<br/>Authentication State: Stateless Front-channel</p>
             </div>
          </div>
        )}
      </main>

      {reviewModalOpen && selectedEmp && (
        <div className="modal-backdrop" onClick={() => setReviewModalOpen(false)}>
          <div className="modal-container glass-panel" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <h3>Retention Modeler: {selectedEmp.name}</h3>
                <p>Employee ID: {selectedEmp.emp_id} · Department: {selectedEmp.department} · Current Role: {selectedEmp.role}</p>
              </div>
              <button className="modal-close-btn" onClick={() => setReviewModalOpen(false)} aria-label="Close modal">
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              {/* Left Column: Interactive Parameters */}
              <div>
                <h4 className="modal-section-title">What-If Parameter Adjustments</h4>
                
                <div className="slider-group">
                  <div className="slider-header">
                    <span>Weekly Working Hours</span>
                    <span><strong>{simValues.working_hours} hrs</strong> (Current: {selectedEmp.working_hours} hrs)</span>
                  </div>
                  <div className="slider-input-container">
                    <input 
                      type="range" 
                      min="20" 
                      max="80" 
                      step="0.5"
                      value={simValues.working_hours} 
                      onChange={e => setSimValues({...simValues, working_hours: parseFloat(e.target.value)})}
                    />
                    <span className="slider-value-badge">{simValues.working_hours}</span>
                  </div>
                </div>

                <div className="slider-group">
                  <div className="slider-header">
                    <span>Performance Rating Review</span>
                    <span><strong>{simValues.performance_rating} / 4.0</strong> (Current: {selectedEmp.performance_rating})</span>
                  </div>
                  <div className="slider-input-container">
                    <input 
                      type="range" 
                      min="1" 
                      max="4" 
                      step="0.1"
                      value={simValues.performance_rating} 
                      onChange={e => setSimValues({...simValues, performance_rating: parseFloat(e.target.value)})}
                    />
                    <span className="slider-value-badge">{(simValues.performance_rating).toFixed(1)}</span>
                  </div>
                </div>

                <div className="slider-group">
                  <div className="slider-header">
                    <span>Leave Count (Annual)</span>
                    <span><strong>{simValues.leave_count} leaves</strong> (Current: {selectedEmp.leave_count})</span>
                  </div>
                  <div className="slider-input-container">
                    <input 
                      type="range" 
                      min="0" 
                      max="50" 
                      step="1"
                      value={simValues.leave_count} 
                      onChange={e => setSimValues({...simValues, leave_count: parseInt(e.target.value)})}
                    />
                    <span className="slider-value-badge">{simValues.leave_count}</span>
                  </div>
                </div>

                <div className="slider-group">
                  <div className="slider-header">
                    <span>Task Completion Efficiency</span>
                    <span><strong>{simValues.task_completion}%</strong> (Current: {selectedEmp.task_completion}%)</span>
                  </div>
                  <div className="slider-input-container">
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      step="5"
                      value={simValues.task_completion} 
                      onChange={e => setSimValues({...simValues, task_completion: parseFloat(e.target.value)})}
                    />
                    <span className="slider-value-badge">{simValues.task_completion}%</span>
                  </div>
                </div>

                <div className="slider-group">
                  <div className="slider-header">
                    <span>Team Transfers</span>
                    <span><strong>{simValues.transfers} transfers</strong> (Current: {selectedEmp.transfers})</span>
                  </div>
                  <div className="slider-input-container">
                    <input 
                      type="range" 
                      min="0" 
                      max="5" 
                      step="1"
                      value={simValues.transfers} 
                      onChange={e => setSimValues({...simValues, transfers: parseInt(e.target.value)})}
                    />
                    <span className="slider-value-badge">{simValues.transfers}</span>
                  </div>
                </div>
              </div>
              
              {/* Right Column: Live Prediction & Decision Support */}
              <div>
                <h4 className="modal-section-title">AI Prognosis & Decision Support</h4>
                
                {/* Attrition Risk Percentage Indicator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline' }}>
                    <span style={{ 
                      fontSize: '3.5rem', 
                      fontWeight: '700', 
                      color: simRisk > 60 ? 'var(--accent-red)' : (simRisk > 35 ? 'var(--accent-orange)' : 'var(--accent-emerald)'),
                      lineHeight: 1 
                    }}>
                      {simRisk.toFixed(0)}
                    </span>
                    <span style={{ 
                      fontSize: '1.5rem', 
                      fontWeight: '600',
                      color: simRisk > 60 ? 'var(--accent-red)' : (simRisk > 35 ? 'var(--accent-orange)' : 'var(--accent-emerald)')
                    }}>%</span>
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '1rem', color: 'var(--text-primary)' }}>Attrition Probability</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Updated dynamically via ML Engine</div>
                  </div>
                </div>
                
                {/* Decision Support Card */}
                <div className={`decision-support-card status-${simRisk > 60 ? 'high' : (simRisk > 35 ? 'medium' : 'low')}`}>
                  {simRisk > 60 ? (
                    <>
                      <span className="decision-badge high">Immediate Action Required</span>
                      <p className="decision-text">
                        <strong>Critical Burnout Profile:</strong> The simulated parameters indicate extreme flight risk. 
                        We recommend capping weekly hours, assigning a senior mentor, and initiating an urgent check-in.
                      </p>
                    </>
                  ) : simRisk > 35 ? (
                    <>
                      <span className="decision-badge medium">Retention Nudge Advisable</span>
                      <p className="decision-text">
                        <strong>Rising Fatigue Signals:</strong> Moderate attrition risk detected. We recommend checking in on 
                        workplace satisfaction and ensuring they are taking appropriate leave intervals.
                      </p>
                    </>
                  ) : (
                    <>
                      <span className="decision-badge low">Stable Alignment</span>
                      <p className="decision-text">
                        <strong>Healthy Engagement:</strong> Low flight risk profile. Maintain current working arrangements, 
                        promote recognition of their output, and schedule standard reviews.
                      </p>
                    </>
                  )}
                </div>
                
                {/* Personalized AI Suggestion Bubble */}
                <div className="suggestion-bubble">
                  <div className="suggestion-bubble-title">
                    <Lightbulb size={16} />
                    <span>Personalized AI Guidance</span>
                  </div>
                  <p className="suggestion-bubble-text">
                    {simValues.working_hours > 45 ? (
                      "Target: Reduce working hours. Capping hours to 40 per week reduces predicted attrition risk."
                    ) : simValues.performance_rating < 3.0 ? (
                      "Target: Engagement booster. Schedule a skill mentoring session to address task performance barriers."
                    ) : simValues.leave_count < 10 ? (
                      "Target: Work-life balance. Encourage the associate to utilize remaining paid leaves to reset."
                    ) : (
                      "All metrics look stable. No major friction factors identified for this profile."
                    )}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn-outline" onClick={() => setReviewModalOpen(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleCommitRetentionPlan}>
                Commit Retention Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({ title, value, suffix, trend, isPositive, color, id, onClick }) {
  const TrendIcon = isPositive ? ArrowUpRight : ArrowDownRight;
  return (
    <div className={`kpi-card glass-panel theme-${color}`} id={id} onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default', transition: 'transform 0.2s', ...(onClick ? {':hover': {transform: 'translateY(-2px)'}} : {}) }}>
      <h3 className="kpi-title">{title}</h3>
      <div className="kpi-main">
        <span className="kpi-value">{value}</span>
        {suffix && <span className="kpi-suffix">{suffix}</span>}
      </div>
      <div className={`kpi-trend ${isPositive ? 'trend-up' : 'trend-down'}`}>
        <TrendIcon size={16} />
        <span>{trend}</span>
      </div>
    </div>
  );
}

function Factor({ label, pct, color }) {
  return (
    <div className="factor-item">
      <div className="factor-header">
        <span className="factor-name">{label}</span>
        <span className="factor-pct">{pct}%</span>
      </div>
      <div className="factor-bar-bg">
        <div className="factor-bar-fill slide-in" style={{ width: `${pct}%`, background: color }}></div>
      </div>
    </div>
  );
}

function EventItem({ type, title, meta, onAction }) {
  return (
    <div className={`event-item event-${type}`} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
      <div style={{display: 'flex', gap: '1rem', flex: 1}}>
        <div className="event-indicator"></div>
        <div className="event-content">
          <h4 className="event-title">{title}</h4>
          <p className="event-meta">{meta}</p>
        </div>
      </div>
      {onAction && <button className={`btn-outline opacity-75`} onClick={onAction} style={{padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderRadius: '6px', background: 'transparent', border: `1px solid var(--accent-${type === 'danger' ? 'red' : 'blue'})`, color: `var(--accent-${type==='danger'?'red':'blue'})`, cursor: 'pointer', flexShrink: 0, fontWeight: 500}}>Take Action</button>}
    </div>
  );
}
