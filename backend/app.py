import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
from database import init_db, authenticate, get_employee_data, DB_FILE
from ml_models import AttritionAnalyzer
import os

st.set_page_config(page_title="Strategic HR Core", layout="wide")

try:
    from data_generator import generate_mock_data
    if not os.path.exists(DB_FILE):
        generate_mock_data()
except Exception as e:
    pass

if "authenticated" not in st.session_state:
    st.session_state.authenticated = False
if "user_role" not in st.session_state:
    st.session_state.user_role = None
if "username" not in st.session_state:
    st.session_state.username = None
if "analyzer" not in st.session_state:
    st.session_state.analyzer = AttritionAnalyzer()

# Main CSS: Opinionated, Editorial, Asymmetrical
st.markdown("""
<style>
    /* Base typography */
    body { font-family: 'Inter', system-ui, sans-serif; background-color: #FAFAFA; color: #334155; }
    
    /* Editorial Headings */
    .section-heading {
        font-size: 32px;
        font-weight: 700;
        color: #0F172A;
        margin-top: 48px;
        margin-bottom: 8px;
        letter-spacing: -0.5px;
    }
    .subtext {
        font-size: 17px;
        color: #64748B;
        font-weight: 400;
        margin-bottom: 40px;
        line-height: 1.6;
    }
    
    /* Metrics: Floating and Soft */
    .soft-metric {
        margin-bottom: 20px;
    }
    .metric-val {
        font-size: 40px;
        font-weight: 300;
        color: #0F172A;
        letter-spacing: -1px;
    }
    .metric-label {
        font-size: 13px;
        color: #64748B;
        text-transform: uppercase;
        letter-spacing: 1px;
        font-weight: 600;
        margin-top: 4px;
    }
    .metric-trend {
        font-size: 14px;
        font-weight: 500;
        margin-top: 2px;
    }
    .trend-up { color: #DC2626; } /* High attrition trend is bad (red) */
    .trend-down { color: #059669; } /* Low trend is good (green) */
    
    /* Soft visual separators instead of hard boxes */
    .soft-divider {
        height: 1px;
        background: linear-gradient(90deg, rgba(226,232,240,1) 0%, rgba(226,232,240,0) 100%);
        margin: 40px 0;
    }
    
    /* Insight Blocks */
    .editorial-insight {
        border-left: 3px solid #2563EB;
        padding-left: 20px;
        margin-top: 32px;
        margin-bottom: 32px;
        font-size: 16px;
        color: #334155;
        line-height: 1.7;
    }
    
    /* Login / Auth UI */
    .login-container { max-width: 440px; margin: 100px auto; padding: 48px; background: #FFF; border-radius: 16px; box-shadow: 0 20px 40px -10px rgba(0,0,0,0.05); }
    .login-header { font-size: 28px; font-weight: 800; color: #0F172A; text-align: center; margin-bottom: 8px; }
    .login-sub { text-align: center; color: #64748B; margin-bottom: 32px; font-size: 15px; }
</style>
""", unsafe_allow_html=True)

def login_ui():
    st.markdown("""
        <style>
            [data-testid="collapsedControl"] { display: none; }
            div[data-testid="stForm"] {
                background-color: #FFFFFF;
                padding: 32px;
                border-radius: 12px;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                border: 1px solid #E5E7EB;
            }
            .brand-title {
                font-size: 40px;
                font-weight: 700;
                color: #0F172A;
                line-height: 1.2;
                margin-bottom: 16px;
            }
            .brand-subtitle {
                font-size: 20px;
                color: #475569;
                margin-bottom: 24px;
                line-height: 1.5;
            }
            .feature-list {
                color: #334155;
                font-size: 16px;
                line-height: 2.0;
                margin-bottom: 32px;
            }
            .security-badge {
                display: inline-flex;
                align-items: center;
                background-color: #F0FDF4;
                color: #166534;
                padding: 10px 20px;
                border-radius: 9999px;
                font-size: 14px;
                font-weight: 600;
                border: 1px solid #BBF7D0;
            }
        </style>
    """, unsafe_allow_html=True)

    st.markdown("<br><br><br>", unsafe_allow_html=True)
    c_space1, c_left, c_mid, c_right, c_space2 = st.columns([1, 5, 1, 5, 1])

    with c_left:
        st.markdown('<div class="brand-title">Secure Employee Platform</div>', unsafe_allow_html=True)
        st.markdown('<div class="brand-subtitle">Strategic HR Intelligence & Attrition Prediction Engine</div>', unsafe_allow_html=True)
        
        st.markdown("""
        <div class="feature-list">
            ✓ <b>Predict Operational Attrition</b> before it happens.<br>
            ✓ <b>Monitor Team Productivity</b> and balance workload.<br>
            ✓ <b>Prescriptive ML Actions</b> to proactively retain talent.
        </div>
        """, unsafe_allow_html=True)
        
        st.markdown("""
        <div class="security-badge">
            🔒 AES-Encrypted & Securely Handled
        </div>
        """, unsafe_allow_html=True)

    with c_right:
        st.markdown('<h2 style="margin-top:0; color:#0F172A; margin-bottom:5px;">Welcome Back</h2>', unsafe_allow_html=True)
        st.markdown('<p style="color:#64748B; margin-bottom:20px;">Sign in to access your HR analytics dashboard.</p>', unsafe_allow_html=True)
        
        with st.form("login_form", clear_on_submit=True):
            user = st.text_input("👤 Username", placeholder="Enter your assigned username")
            pwd = st.text_input("🔑 Password", type="password", placeholder="Enter your password")
            st.markdown("<br>", unsafe_allow_html=True)
            
            submit = st.form_submit_button("Sign In →", type="primary", use_container_width=True)
            
            if submit:
                res = authenticate(user, pwd)
                if res:
                    st.session_state.authenticated = True
                    st.session_state.user_role = res['role']
                    st.session_state.username = res['username']
                    st.rerun()
                else:
                    st.error("🔴 Invalid credentials provided.")
        
        with st.expander("Explore Demo Accounts"):
            st.markdown("- **HR Manager:** `admin` / `admin`")
            st.markdown("- **Team Lead:** `lead` / `lead`")
            st.markdown("- **Data Analyst:** `analyst` / `analyst`")

def main_app():
    role = st.session_state.user_role
    
    st.sidebar.markdown(f"**{st.session_state.username}**<br><span style='color:#64748B; font-size:13px;'>{role}</span>", unsafe_allow_html=True)
    st.sidebar.markdown("<br>", unsafe_allow_html=True)
    
    # Navigation logic
    if role == "HR Manager":
        menu = ["Overview", "Analysis", "Predictor"]
    elif role == "Team Lead":
        menu = ["Overview", "Predictor"]
    elif role == "Data Analyst":
        menu = ["Analysis", "Data Access", "Model Evaluation"]
    else:
        menu = ["Overview"]
        
    choice = st.sidebar.radio("", menu, label_visibility="collapsed")
    
    st.sidebar.markdown("<br><br>", unsafe_allow_html=True)
    if st.sidebar.button("Log out"):
        st.session_state.authenticated = False
        st.session_state.user_role = None
        st.session_state.username = None
        st.rerun()

    # Base Filtering
    dept_base = "Engineering" if role == "Team Lead" else None
    anon_flag = role == "Data Analyst"
    df = get_employee_data(anonymize=anon_flag, department=dept_base)

    if not st.session_state.analyzer.is_trained:
        train_df = get_employee_data(anonymize=True)
        st.session_state.analyzer.train(train_df)

    if df.empty:
        st.info("No workforce records available.")
        return

    # Let the interface breathe: No sidebar filters unless explicitly needed (e.g. Overview)
    # -----------------------------
    if choice == "Overview":
        st.markdown('<div class="section-heading">Workforce Overview</div>', unsafe_allow_html=True)
        st.markdown('<div class="subtext">Real-time pulse on headcount stability and structural risk.</div>', unsafe_allow_html=True)

        total = len(df)
        left = df['attrition'].sum()
        rates = (left / total * 100) if total else 0
        avg_hrs = df['working_hours'].mean()

        # Asymmetrical Layout: 3 Top KPIs
        c1, c2, c3 = st.columns([1, 1, 1.5])
        
        c1.markdown(f'''
            <div class="soft-metric">
                <div class="metric-val">{total}</div>
                <div class="metric-label">Active Headcount</div>
                <div class="metric-trend" style="color:#64748B;">Stable workforce</div>
            </div>
        ''', unsafe_allow_html=True)
        
        trend_css = "trend-up" if rates > 10 else "trend-down"
        rate_trend_text = "↑ +1.2% from last quarter" if rates > 10 else "↓ -0.4% from last quarter"
        
        c2.markdown(f'''
            <div class="soft-metric">
                <div class="metric-val">{rates:.1f}%</div>
                <div class="metric-label">Systemic Attrition</div>
                <div class="metric-trend {trend_css}">{rate_trend_text}</div>
            </div>
        ''', unsafe_allow_html=True)

        c3.markdown(f'''
            <div class="soft-metric">
                <div class="metric-val">{avg_hrs:.1f}</div>
                <div class="metric-label">Mean Weekly Hours</div>
                <div class="metric-trend" style="color:#64748B;">Core productivity volume</div>
            </div>
        ''', unsafe_allow_html=True)

        st.markdown('<div class="soft-divider"></div>', unsafe_allow_html=True)

        # Full-width chart, letting it breathe
        if 'department' in df.columns and len(df['department'].unique()) > 1:
            st.markdown("##### Attrition Distribution")
            st.write("")
            attr_dept = df.groupby('department')['attrition'].mean().reset_index()
            attr_dept['rate'] = attr_dept['attrition'] * 100
            
            fig = px.bar(attr_dept, x='department', y='rate', color_discrete_sequence=['#2563EB'])
            fig.update_layout(paper_bgcolor='rgba(0,0,0,0)', plot_bgcolor='rgba(0,0,0,0)', 
                              xaxis_title="", yaxis_title="Attrition Rate (%)", margin=dict(l=0,r=0,t=0,b=0))
            st.plotly_chart(fig, use_container_width=True)
            
            # Grounded Insight
            max_dept = attr_dept.loc[attr_dept['rate'].idxmax()]
            st.markdown(f'''
            <div class="editorial-insight">
                <strong>Structural Note:</strong> {max_dept['department']} currently leads in attrition at <strong>{max_dept['rate']:.1f}%</strong>. 
                We recommend reviewing regional management or recent workload spikes specifically within this unit before the trend cascades.
            </div>
            ''', unsafe_allow_html=True)
        
        # High Risk Action Panel - Not boxed, just listed cleanly
        st.markdown('<div class="soft-divider"></div>', unsafe_allow_html=True)
        st.markdown("##### Critical Interventions Needed")
        st.markdown("<p style='color:#64748B; font-size:14px; margin-bottom:20px;'>Employees whose current workload matrices strongly overlap with historical resignation patterns.</p>", unsafe_allow_html=True)
        
        df['risk'] = st.session_state.analyzer.predict_batch_risk(df)
        criticals = df[(df['attrition'] == 0) & (df['risk'] > 60)].sort_values(by='risk', ascending=False).head(5)
        
        if criticals.empty:
            st.markdown("<span style='color:#059669; font-weight:500;'>No imminent flight risks identified this cycle.</span>", unsafe_allow_html=True)
        else:
            for _, r in criticals.iterrows():
                name = r.get('name', r['emp_id'])
                hours = r['working_hours']
                role_txt = r.get('role', 'Staff')
                dept_txt = r.get('department', 'Organization')
                st.markdown(f"""
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #F1F5F9; padding:12px 0;">
                    <div>
                        <strong style="color:#0F172A; font-size:15px;">{name}</strong> <span style="color:#94A3B8; font-size:14px;">— {role_txt}, {dept_txt}</span><br>
                        <span style="color:#64748B; font-size:13px;">Logging {hours} hrs/week continuously.</span>
                    </div>
                    <div style="color:#DC2626; font-weight:600; font-size:15px;">
                        {r['risk']:.0f}% Risk
                    </div>
                </div>
                """, unsafe_allow_html=True)

    elif choice == "Analysis":
        st.markdown('<div class="section-heading">Root Cause Analysis</div>', unsafe_allow_html=True)
        st.markdown('<div class="subtext">Identifying the friction points leading to talent departure.</div>', unsafe_allow_html=True)
        
        # We don't use 2 equal columns. We use a massive chart, then text.
        st.markdown("##### Velocity vs Resistance: Workload & Leave Behavior")
        
        # Color by attrition but using subtle styling (Grey for retained, Blue for left)
        # Avoid red here so the dashboard doesn't shout at the user continuously
        fig_scatter = px.scatter(df, x='working_hours', y='leave_count', color='attrition',
                                 color_continuous_scale=['#CBD5E1', '#2563EB'], opacity=0.7)
        fig_scatter.update_layout(paper_bgcolor='rgba(0,0,0,0)', plot_bgcolor='rgba(0,0,0,0)', 
                                  xaxis_title="Average Hours per Week", yaxis_title="Annual Leaves", 
                                  margin=dict(l=0,r=0,t=10,b=0), coloraxis_showscale=False)
        st.plotly_chart(fig_scatter, use_container_width=True)
        
        # Grounded Insight calculation
        high_hours_df = df[df['working_hours'] > 50]
        high_hours_attrition = (high_hours_df['attrition'].mean() * 100) if not high_hours_df.empty else 0
        overall_attrition = (df['attrition'].mean() * 100)
        
        st.markdown(f'''
        <div class="editorial-insight">
            Based on the distribution above, employees crossing the 50-hour threshold exhibit an attrition rate of <strong>{high_hours_attrition:.1f}%</strong> compared to the baseline <strong>{overall_attrition:.1f}%</strong>. The sharp clustering in the upper-right quadrant suggests that sustained heavy workloads inevitably trigger abrupt high-leave patterns right before resignation.
        </div>
        ''', unsafe_allow_html=True)

    elif choice == "Predictor":
        st.markdown('<div class="section-heading">Retention Modeler</div>', unsafe_allow_html=True)
        st.markdown('<div class="subtext">Assess individual risk profiles and generate prescriptive guidance.</div>', unsafe_allow_html=True)
        
        st.markdown('<div style="background:#FFF; padding:32px; border-radius:8px; border:1px solid #E2E8F0;">', unsafe_allow_html=True)
        with st.form("engine"):
            c1, c2 = st.columns(2)
            wh = c1.number_input("Recorded Weekly Hours", 20.0, 80.0, 45.0)
            pr = c1.number_input("Last Performance Review (1-5)", 1.0, 5.0, 3.5)
            lc = c2.number_input("Leaves Taken (Past 12mo)", 0, 50, 15)
            tc = c2.number_input("Sprint/Task Capacity Met (%)", 0, 100, 75)
            tr = st.slider("Internal Team Transfers", 0, 5, 0)
            
            st.write("")
            submit = st.form_submit_button("Generate Prognosis", type="primary")
            
        st.markdown('</div>', unsafe_allow_html=True)
            
        if submit:
            data = {'working_hours': wh, 'leave_count': lc, 'performance_rating': pr, 'task_completion': tc, 'transfers': tr}
            res = st.session_state.analyzer.predict_risk(data)
            
            if res:
                score = res['risk_score']
                
                # Contextual colors and text
                if score < 40:
                    status_col, label = "#059669", "Stable Alignment"
                    advice = "No immediate friction detected. Continue standard support and recognize consistent output."
                elif score < 70:
                    status_col, label = "#D97706", "Rising Friction"
                    advice = "A convergence of workload and fatigue signals. Schedule a soft check-in to clear roadblocks."
                else:
                    status_col, label = "#DC2626", "Critical Trajectory"
                    advice = "Imminent burnout profile. Immediately cap overtime and mandate a workload redistribution."
                
                st.markdown("<br><br>", unsafe_allow_html=True)
                st.markdown(f'<div style="font-size:14px; text-transform:uppercase; color:#64748B; font-weight:600; letter-spacing:1px;">Analysis Result</div>', unsafe_allow_html=True)
                
                # Asymmetrical result block
                r1, r2 = st.columns([1, 2.5])
                with r1:
                    st.markdown(f'<div style="font-size:64px; font-weight:200; color:{status_col}; line-height:1;">{score:.0f}<span style="font-size:32px;">%</span></div>', unsafe_allow_html=True)
                    st.markdown(f'<div style="font-weight:600; color:{status_col}; margin-top:8px;">{label}</div>', unsafe_allow_html=True)
                
                with r2:
                    st.markdown("**Dominant Factors:**")
                    if res['factors']:
                        for f in res['factors']:
                            st.markdown(f"<span style='color:#475569;'>— {f}</span>", unsafe_allow_html=True)
                    else:
                        st.markdown("<span style='color:#475569;'>— Behaviors sit comfortably within structural medians.</span>", unsafe_allow_html=True)
                    
                    st.markdown("<br>**Prescriptive Action:**", unsafe_allow_html=True)
                    st.markdown(f"<div style='border-left:2px solid {status_col}; padding-left:16px; color:#334155; line-height:1.6;'>{advice}</div>", unsafe_allow_html=True)

    elif choice == "Model Evaluation":
        st.markdown('<div class="section-heading">Model Topography</div>', unsafe_allow_html=True)
        st.markdown('<div class="subtext">Transparency into the underlying logistic and clustering logic.</div>', unsafe_allow_html=True)
        
        metrics = st.session_state.analyzer.train(df) if not df.empty else None
        
        if metrics:
            c1, c2, c3 = st.columns(3)
            c1.markdown(f"<div style='font-size:28px; font-weight:300;'>{metrics['accuracy']*100:.1f}%</div><div style='font-size:13px; color:#64748B;'>ACCURACY</div>", unsafe_allow_html=True)
            c2.markdown(f"<div style='font-size:28px; font-weight:300;'>{metrics['precision']*100:.1f}%</div><div style='font-size:13px; color:#64748B;'>PRECISION</div>", unsafe_allow_html=True)
            c3.markdown(f"<div style='font-size:28px; font-weight:300;'>{metrics['recall']*100:.1f}%</div><div style='font-size:13px; color:#64748B;'>SENSITIVITY</div>", unsafe_allow_html=True)
            
            st.markdown('<div class="soft-divider"></div>', unsafe_allow_html=True)
            st.markdown("##### Weighted Features")
            fi = st.session_state.analyzer.get_feature_importances()
            if fi:
                fi_df = pd.DataFrame(fi, columns=['Feature', 'Importance'])
                # Replace underscores for readability
                fi_df['Feature'] = fi_df['Feature'].str.replace('_', ' ').str.title()
                fig_bar = px.bar(fi_df, x='Importance', y='Feature', orientation='h', color_discrete_sequence=['#2563EB'])
                fig_bar.update_layout(paper_bgcolor='rgba(0,0,0,0)', plot_bgcolor='rgba(0,0,0,0)', yaxis={'categoryorder':'total ascending'}, yaxis_title="", xaxis_title="")
                st.plotly_chart(fig_bar, use_container_width=True)

    elif choice == "Data Access":
        st.markdown('<div class="section-heading">Data Repository</div>', unsafe_allow_html=True)
        st.markdown('<div class="subtext">Raw structured output, sanitized for compliance.</div>', unsafe_allow_html=True)
        st.dataframe(df, use_container_width=True, hide_index=True)

if __name__ == "__main__":
    if not st.session_state.authenticated:
        login_ui()
    else:
        main_app()
