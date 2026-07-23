/* eslint-disable no-unused-vars, react-hooks/exhaustive-deps, react-hooks/rules-of-hooks */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
    Tooltip, ResponsiveContainer, XAxis, YAxis, LineChart, Line, AreaChart, Area
} from 'recharts';
import API from '../api/axios';
import { useToast } from '../context/ToastContext';

// Harmonious, premium color palette for charts
const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#f97316', '#64748b', '#06b6d4'];

const KpiCard = ({ title, value, gradient, shadowColor, icon, subtitle, onClick }) => (
    <div className="card border-0 h-100 text-white shadow-sm" onClick={onClick} role={onClick ? 'button' : undefined} style={{  
        background: gradient, 
        borderRadius: '12px',
        boxShadow: `0 6px 20px ${shadowColor}`,
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden'
    }}
    onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = `0 10px 25px ${shadowColor}`;
    }}
    onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = `0 6px 20px ${shadowColor}`;
    }}
    >
        {/* Background Decorative Circles like Purple Admin */}
        <div style={{
            position: 'absolute',
            top: '-30px',
            right: '-30px',
            width: '130px',
            height: '130px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.13)'
        }} />
        <div style={{
            position: 'absolute',
            top: '30px',
            right: '-60px',
            width: '130px',
            height: '130px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.13)'
        }} />

        <div className="card-body p-4 position-relative" style={{ zIndex: 2 }}>
            <div className="d-flex justify-content-between align-items-start">
                <div>
                    <div className="small font-weight-bold text-uppercase tracking-wider mb-2" style={{ fontSize: '0.8rem', opacity: 0.85 }}>{title}</div>
                    <h2 className="mb-2 font-weight-bold" style={{ fontSize: '1.8rem', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>{value}</h2>
                    {subtitle && <div className="small mt-2" style={{ opacity: 0.8, fontSize: '0.75rem' }}>{subtitle}</div>}
                </div>
                <div style={{ opacity: 0.85 }}>
                    {icon}
                </div>
            </div>
        </div>
    </div>
);

const ChartCard = ({ title, children, minHeight = '340px', bodyStyle = {} }) => (
    <div className="card border-0 h-100 shadow-sm" style={{ borderRadius: '16px', backgroundColor: '#ffffff' }}>
        <div className="card-header bg-white border-0 pt-4 px-4 pb-0 d-flex align-items-center justify-content-between">
            <h6 className="font-weight-bold mb-0 text-dark" style={{ letterSpacing: '0.5px' }}>{title}</h6>
        </div>
        <div className="card-body px-4 pb-4 pt-3 d-flex flex-column" style={{ minHeight, position: 'relative', ...bodyStyle }}>
            {children}
        </div>
    </div>
);

const Dashboard = () => {
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        kpis: {
            totalEnquiryCount: 0,
            overallPendingCount: 0,
            quoted90Days: 0,
            budgetaryCount: 0,
            openL1Count: 0,
            wonCount: 0,
            regrettedCount: 0,
            lostCount: 0,
            holdCount: 0,
            quotedValue: 0,
            budgetaryValue: 0,
            poValue: 0,
            openL1Value: 0,
            lostValue: 0,
            holdValue: 0,
            todaysDue: 0,
            tomorrowDue: 0,
            recentCreatedCount: 0,
            overdueCount: 0,
            winRate: 0
        },
        charts: {
            statusDistribution: [],
            monthlyTrend: [],
            pipeline: [],
            winLossTrend: [],
            salesPerformance: [],
            ageing: [],
            openOpportunities: [],
            monthlyQuoteValue: [],
            revenueForecast: [],
            topCustomers: [],
            followupTimeline: [],
            tatData: [],
            pendingByDept: []
        },
        recentQuotes: []
    });

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const res = await API.get('/dashboard/stats/');
            if (res.data.success && res.data.data) {
                setData({
                    kpis: { ...data.kpis, ...res.data.data.kpis },
                    charts: { ...data.charts, ...res.data.data.charts },
                    recentQuotes: res.data.data.recentQuotes || []
                });
            }
        } catch (err) {
            showToast('Failed to load dashboard data', 'error');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const [mailing, setMailing] = useState(false);
    const [mailCooldown, setMailCooldown] = useState(0);

    // Bug #12 fix: 60-second frontend cooldown timer
    useEffect(() => {
        if (mailCooldown <= 0) return;
        const timer = setInterval(() => {
            setMailCooldown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [mailCooldown]);

    const handleMailAll = async () => {
        if (mailCooldown > 0) return;
        try {
            setMailing(true);
            showToast('Triggering mail report delivery...', 'info');
            await API.post('/mails/mail-all/');
            showToast('Email report successfully dispatched in the background!', 'success');
            setMailCooldown(60); // Start 60-second cooldown
        } catch (err) {
            if (err.response && err.response.status === 429) {
                showToast('A report was recently sent. Please wait before trying again.', 'warning');
                setMailCooldown(30);
            } else {
                showToast('Failed to dispatch email report.', 'error');
            }
            console.error(err);
        } finally {
            setMailing(false);
        }
    };


    if (loading) {
        return (
            <div className="d-flex flex-column align-items-center justify-content-center vh-100 bg-light">
                <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status"></div>
                <div className="mt-3 font-weight-bold text-muted" style={{ letterSpacing: '1px' }}>LOADING ANALYTICS...</div>
            </div>
        );
    }

    const { kpis, charts } = data;

    const goTo = (path) => () => navigate(path);

    const handleStatusNavigate = (statusName) => {
        if (!statusName) return;
        switch(statusName) {
            case 'Pending with Engg': navigate('/pending-engg'); break;
            case 'Pending with Costing': navigate('/pending-costing'); break;
            case 'Sales to Quote': navigate('/sales-to-quote'); break;
            case 'Pending with Sales': navigate('/pending-sales'); break;
            case 'Quote Submitted': navigate('/enquiries?status=Quote%20Submitted'); break;
            case 'Open - L1': navigate('/pipeline/open-l1'); break;
            case 'Won': navigate('/pipeline/won'); break;
            case 'Lost': navigate('/pipeline/lost'); break;
            case 'Regretted':
            case 'Quote Regretted': navigate('/pipeline/regretted'); break;
            case 'On Hold': navigate('/pipeline/hold'); break;
            default: navigate('/enquiries'); break;
        }
    };

    const formatCurrency = (val) => {
        const num = Number(val);
        if (isNaN(num)) return '₹0';
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumSignificantDigits: 3 }).format(num);
    };

    // Premium custom SVGs for Purple style boxes
    const icons = {
        chart: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>,
        diamond: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 3h12l4 6-10 13L2 9z"/></svg>,
        bookmark: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>,
        cash: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
        trending: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
        clock: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
        alert: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
        award: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
    };

    return (
        <div className="container-fluid py-4 px-4 bg-light" style={{ minHeight: '100vh', overflowY: 'auto' }}>
            {/* Upper Header */}
            <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
                <div>
                    <h2 className="font-weight-bold mb-1 text-dark" style={{ letterSpacing: '-0.5px' }}>CRM Enterprise Dashboard</h2>
                    <p className="text-muted mb-0 small">Executive performance metrics and real-time pipeline status</p>
                </div>
                <div className="d-flex gap-3 align-items-center">
                    <button 
                        className="btn border shadow-sm btn-sm rounded-pill px-3 d-flex align-items-center gap-1 text-white" 
                        disabled={mailing || mailCooldown > 0}
                        onClick={handleMailAll}
                        style={{
                            background: mailCooldown > 0 
                                ? 'linear-gradient(to right, #a0a0a0, #808080)' 
                                : 'linear-gradient(to right, #da8cff, #9a55ff)',
                            border: 'none',
                            fontWeight: '600',
                            opacity: mailCooldown > 0 ? 0.7 : 1,
                        }}
                    >
                        {mailing ? (
                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" style={{ width: '12px', height: '12px' }}></span>
                        ) : (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                <polyline points="22,6 12,13 2,6" />
                            </svg>
                        )}
                        {mailCooldown > 0 ? `Mail Report (${mailCooldown}s)` : 'Mail Report'}
                    </button>
                    <button className="btn btn-white border shadow-sm btn-sm rounded-pill px-3 d-flex align-items-center gap-1 bg-white" onClick={fetchDashboardData}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path></svg>
                        Sync Data
                    </button>
                </div>
            </div>

            {/* KPIs Grid */}
            <div className="row g-3 mb-4">
                <div className="col-xl-3 col-md-4 col-sm-6">
                    <KpiCard title="Total Enquiries" value={kpis.totalEnquiryCount} gradient="linear-gradient(to right, #ffbf96, #fe7096)" shadowColor="rgba(254, 112, 150, 0.25)" icon={icons.chart} subtitle={`+${kpis.recentCreatedCount} in last 30 days`} onClick={goTo('/enquiries')} />
                </div>
                <div className="col-xl-3 col-md-4 col-sm-6">
                    <KpiCard title="Overall Pending" value={kpis.overallPendingCount} gradient="linear-gradient(to right, #90caf9, #047edf 99%)" shadowColor="rgba(4, 126, 223, 0.25)" icon={icons.clock} subtitle={`${kpis.overdueCount} Overdue`} onClick={goTo('/kanban')} />
                </div>
                <div className="col-xl-3 col-md-4 col-sm-6">
                    <KpiCard title="Today's Due" value={kpis.todaysDue} gradient="linear-gradient(to right, #ffb74d, #f57c00)" shadowColor="rgba(245, 124, 0, 0.25)" icon={icons.clock} subtitle="Pending action today" onClick={goTo(`/enquiries?rfq_due_date=${new Date().toISOString().split('T')[0]}`)} />
                </div>
                <div className="col-xl-3 col-md-4 col-sm-6">
                    <KpiCard 
                        title="Tomorrow's Due" 
                        value={kpis.tomorrowDue} 
                        gradient="linear-gradient(to right, #4dd0e1, #00acc1)" 
                        shadowColor="rgba(0, 172, 193, 0.25)" 
                        icon={icons.clock} 
                        subtitle="Pending action tomorrow" 
                        onClick={goTo(`/enquiries?rfq_due_date=${(() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; })()}`)} 
                    />
                </div>
                
                <div className="col-xl-3 col-md-4 col-sm-6">
                    <KpiCard title="Quoted (>90 Days)" value={kpis.quoted90Days} gradient="linear-gradient(to right, #84d9d2, #07cdae)" shadowColor="rgba(7, 205, 174, 0.25)" icon={icons.alert} subtitle="RFQ date > 90 days ago" onClick={goTo('/pipeline/quoted-90')} />
                </div>
                <div className="col-xl-3 col-md-4 col-sm-6">
                    <KpiCard title="Budgetary Quotes" value={kpis.budgetaryCount} gradient="linear-gradient(to right, #c3a1ff, #7f39fb)" shadowColor="rgba(127, 57, 251, 0.25)" icon={icons.bookmark} subtitle={`Value: ${formatCurrency(kpis.budgetaryValue)}`} onClick={goTo('/enquiries?rfq_type=Budgetary')} />
                </div>
                <div className="col-xl-3 col-md-4 col-sm-6">
                    <KpiCard title="Open - L1" value={kpis.openL1Count} gradient="linear-gradient(to right, #ffbf96, #fe7096)" shadowColor="rgba(254, 112, 150, 0.25)" icon={icons.award} subtitle={`Value: ${formatCurrency(kpis.openL1Value)}`} onClick={goTo('/pipeline/open-l1')} />
                </div>
                <div className="col-xl-3 col-md-4 col-sm-6">
                    <KpiCard title="Won" value={kpis.wonCount} gradient="linear-gradient(to right, #84d9d2, #07cdae)" shadowColor="rgba(7, 205, 174, 0.25)" icon={icons.diamond} subtitle={`Win Rate: ${kpis.winRate}%`} onClick={goTo('/pipeline/won')} />
                </div>
                
                <div className="col-xl-3 col-md-4 col-sm-6">
                    <KpiCard title="Lost" value={kpis.lostCount} gradient="linear-gradient(to right, #64748b, #475569)" shadowColor="rgba(100, 116, 139, 0.25)" icon={icons.clock} subtitle={`Value: ${formatCurrency(kpis.lostValue)}`} onClick={goTo('/pipeline/lost')} />
                </div>
                <div className="col-xl-3 col-md-4 col-sm-6">
                    <KpiCard title="On Hold" value={kpis.holdCount} gradient="linear-gradient(to right, #ffbf96, #fe7096)" shadowColor="rgba(254, 112, 150, 0.25)" icon={icons.bookmark} subtitle={`Value: ${formatCurrency(kpis.holdValue)}`} onClick={goTo('/pipeline/hold')} />
                </div>
                <div className="col-xl-3 col-md-4 col-sm-6">
                    <KpiCard title="Quoted Value" value={formatCurrency(kpis.quotedValue)} gradient="linear-gradient(to right, #90caf9, #047edf 99%)" shadowColor="rgba(4, 126, 223, 0.25)" icon={icons.cash} subtitle="Total quoted pipeline" onClick={goTo('/enquiries?status=Quote%20Submitted')} />
                </div>
                <div className="col-xl-3 col-md-4 col-sm-6">
                    <KpiCard title="PO Value" value={formatCurrency(kpis.poValue)} gradient="linear-gradient(to right, #84d9d2, #07cdae)" shadowColor="rgba(7, 205, 174, 0.25)" icon={icons.trending} subtitle="Total PO registered value" onClick={goTo('/pipeline/won')} />
                </div>
            </div>

            {/* Charts Grid */}
            <div className="row g-4">
                {/* 1. Enquiry Status Distribution */}
                <div className="col-lg-4 col-md-6">
                    <ChartCard title="Status Distribution">
                        <div style={{ width: '100%', height: '185px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                                    <Pie 
                                        data={charts.statusDistribution?.map(d => ({ ...d, name: d.name || d.status }))} 
                                        cx="50%" 
                                        cy="50%" 
                                        innerRadius={42} 
                                        outerRadius={68} 
                                        paddingAngle={4} 
                                        dataKey="value" 
                                        label={({ value }) => value > 0 ? `${value}` : ''}
                                        labelLine={false}
                                        style={{ cursor: 'pointer' }} 
                                        onClick={(entry) => entry && (entry.name || entry.status) && handleStatusNavigate(entry.name || entry.status)}
                                    >
                                        {charts.statusDistribution?.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} cursor="pointer" />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const data = payload[0];
                                                const statusName = data.name || data.payload?.status || 'Unknown';
                                                const val = data.value || 0;
                                                const total = charts.statusDistribution?.reduce((sum, item) => sum + (item.value || 0), 0) || 1;
                                                const pct = ((val / total) * 100).toFixed(1);
                                                return (
                                                    <div className="p-3 bg-white shadow-lg rounded-3 border-0" style={{ fontSize: '0.85rem' }}>
                                                        <div className="d-flex align-items-center gap-2 font-weight-bold mb-1" style={{ color: data.color || '#9a55ff' }}>
                                                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: data.color || '#9a55ff' }} />
                                                            {statusName}
                                                        </div>
                                                        <div className="text-dark font-weight-bold" style={{ fontSize: '0.95rem' }}>
                                                            {val} <span className="text-muted font-weight-normal" style={{ fontSize: '0.75rem' }}>enquiries ({pct}%)</span>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        {/* Detailed Status Breakdown List */}
                        <div className="mt-2 pt-2 border-top flex-grow-1" style={{ maxHeight: '130px', overflowY: 'auto' }}>
                            <div className="row g-1">
                                {charts.statusDistribution?.map((item, idx) => {
                                    const statusName = item.status || item.name;
                                    const val = item.value || 0;
                                    const total = charts.statusDistribution?.reduce((sum, i) => sum + (i.value || 0), 0) || 1;
                                    const pct = ((val / total) * 100).toFixed(1);
                                    const color = CHART_COLORS[idx % CHART_COLORS.length];
                                    return (
                                        <div 
                                            key={idx} 
                                            className="col-12 d-flex align-items-center justify-content-between p-1.5 px-2 rounded-2 bg-light mb-1" 
                                            style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                                            onClick={() => handleStatusNavigate(statusName)}
                                        >
                                            <div className="d-flex align-items-center gap-2 text-truncate pe-1">
                                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
                                                <span className="small font-weight-medium text-dark text-truncate" title={statusName}>{statusName}</span>
                                            </div>
                                            <span className="badge bg-white text-dark border shadow-sm rounded-pill font-weight-bold ms-1" style={{ fontSize: '0.72rem' }}>
                                                {val} <span className="text-muted ms-1">({pct}%)</span>
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </ChartCard>
                </div>

                {/* 2. Monthly Trend */}
                <div className="col-lg-8 col-md-6">
                    <ChartCard title="Monthly Enquiry Trend">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={charts.monthlyTrend}>
                                <defs>
                                    <linearGradient id="lineColor" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }} />
                                <Line type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 7 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </div>

                {/* 3. RFQ Pipeline */}
                <div className="col-lg-6 col-md-6">
                    <ChartCard title="RFQ Pipeline Funnel">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={charts.pipeline} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} width={120} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                                <Bar dataKey="value" fill="#8b5cf6" radius={[0, 6, 6, 0]} style={{ cursor: 'pointer' }} onClick={(entry) => entry && entry.name && handleStatusNavigate(entry.name)}>
                                    {charts.pipeline?.map((entry, index) => <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} cursor="pointer" />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </div>

                {/* 4. Win/Loss Trend */}
                <div className="col-lg-6 col-md-6">
                    <ChartCard title="Win vs Loss Trend">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={charts.winLossTrend}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                                <Legend verticalAlign="top" height={36} iconType="circle" />
                                <Bar dataKey="Won" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                                <Bar dataKey="Lost" stackId="a" fill="#ef4444" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </div>

                {/* 5. Sales Performance */}
                <div className="col-lg-6 col-md-6">
                    <ChartCard title="Sales Performance by Rep">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={charts.salesPerformance} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} width={100} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                                <Bar dataKey="count" fill="#3b82f6" radius={[0, 6, 6, 0]} style={{ cursor: 'pointer' }} onClick={() => navigate('/sales-rep-performance')}>
                                    {charts.salesPerformance?.map((entry, index) => <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} cursor="pointer" />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </div>

                {/* 8. Monthly Quote Value (Area) */}
                <div className="col-lg-6 col-md-6">
                    <ChartCard title="Monthly Quote Value">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={charts.monthlyQuoteValue}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} formatter={(val) => formatCurrency(val)} />
                                <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </div>

                {/* 6. Ageing */}
                <div className="col-lg-4 col-md-6">
                    <ChartCard title="Enquiry Ageing">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={charts.ageing}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                                <Bar dataKey="value" fill="#f59e0b" radius={[6, 6, 0, 0]} style={{ cursor: 'pointer' }} onClick={(entry) => {
                                    if (entry && entry.name && (entry.name.includes('90') || entry.name.includes('>'))) {
                                        navigate('/pipeline/quoted-90');
                                    } else {
                                        navigate('/kanban');
                                    }
                                }}>
                                    {charts.ageing?.map((entry, index) => <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} cursor="pointer" />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </div>

                {/* 16. Pending by Dept */}
                <div className="col-lg-4 col-md-6">
                    <ChartCard title="Pending by Department">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={charts.pendingByDept} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" labelLine={false} label style={{ cursor: 'pointer' }} onClick={(entry) => entry && entry.name && handleStatusNavigate(entry.name)}>
                                    {charts.pendingByDept?.map((entry, index) => <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} cursor="pointer" />)}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </div>
                
                {/* 13. Follow-up Timeline */}
                <div className="col-lg-4 col-md-6">
                    <ChartCard title="Next 7 Days Timeline">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={charts.followupTimeline}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                                <Bar dataKey="value" fill="#ef4444" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </div>
            </div>

            {/* 10 Newest Quote Submitted Enquiries */}
            <div className="card border-0 shadow-sm mt-4 mb-4" style={{ borderRadius: '16px', backgroundColor: '#ffffff' }}>
                <div className="card-header bg-white border-0 pt-4 px-4 pb-2">
                    <h5 className="font-weight-bold text-dark mb-1">Newest Quote Submitted (Last 10 Records)</h5>
                    <p className="text-muted small mb-0">Recently sent pricing quotes and proposals</p>
                </div>
                <div className="card-body px-4 pb-4 pt-2">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light" style={{ fontSize: '0.85rem', fontWeight: '600', color: '#475569' }}>
                                <tr>
                                    <th className="border-0 px-3 py-3">Project Number</th>
                                    <th className="border-0 py-3">Project Name</th>
                                    <th className="border-0 py-3">Customer</th>
                                    <th className="border-0 py-3">SBU</th>
                                    <th className="border-0 py-3 text-end">Quote Value</th>
                                    <th className="border-0 py-3">Sales Rep</th>
                                    <th className="border-0 px-3 py-3 text-end">Created At</th>
                                </tr>
                            </thead>
                            <tbody style={{ fontSize: '0.9rem', color: '#334155' }}>
                                {data.recentQuotes && data.recentQuotes.length > 0 ? (
                                    data.recentQuotes.map((enq) => (
                                        <tr key={enq.id} style={{ transition: 'background-color 0.15s', cursor: 'pointer' }} onClick={() => navigate('/enquiries?status=Quote%20Submitted')} title="Click to view Quote Submitted enquiries">
                                            <td className="px-3 py-3 font-weight-bold text-primary">{enq.project_number}</td>
                                            <td className="py-3">{enq.project_name}</td>
                                            <td className="py-3">{enq.customer}</td>
                                            <td className="py-3">
                                                <span className="badge bg-light text-dark border px-2 py-1.5" style={{ borderRadius: '6px' }}>{enq.sbu}</span>
                                            </td>
                                            <td className="py-3 text-end font-weight-bold text-success">{formatCurrency(enq.quote_value)}</td>
                                            <td className="py-3">
                                                <div className="d-flex align-items-center gap-2">
                                                    <span className="avatar-circle-sm" style={{ 
                                                        width: '28px', 
                                                        height: '28px', 
                                                        borderRadius: '50%', 
                                                        background: 'linear-gradient(to right, #da8cff, #9a55ff)',
                                                        color: 'white',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        {enq.sales_rep ? enq.sales_rep.substring(0, 2).toUpperCase() : 'SR'}
                                                    </span>
                                                    <span>{enq.sales_rep}</span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 text-end text-muted" style={{ fontSize: '0.8rem' }}>{enq.created_at}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="text-center py-4 text-muted">No recent Quote Submitted records found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

