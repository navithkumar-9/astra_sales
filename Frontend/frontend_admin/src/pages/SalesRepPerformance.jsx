/* eslint-disable no-unused-vars, react-hooks/exhaustive-deps, react-hooks/rules-of-hooks */
import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import { useToast } from '../context/ToastContext';

const SalesRepPerformance = () => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [performanceData, setPerformanceData] = useState({
        summary: {
            totalEnquiries: 0,
            wonCount: 0,
            regrettedCount: 0,
            lostCount: 0,
            openL1Count: 0,
            holdCount: 0,
            quoteSubmittedCount: 0,
            pendingCount: 0,
        },
        results: []
    });
    
    // Track expanded rows by sales rep ID
    const [expandedReps, setExpandedReps] = useState({});

    const fetchPerformanceData = async () => {
        try {
            setLoading(true);
            const res = await API.get('/dashboard/sales-rep-performance/');
            if (res.data.success) {
                setPerformanceData(res.data.data);
            } else {
                showToast(res.data.error || 'Failed to fetch performance data.', 'error');
            }
        } catch (err) {
            console.error('Error fetching sales rep performance:', err);
            showToast('An error occurred while loading performance stats.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPerformanceData();
    }, []);

    const toggleRow = (repId) => {
        setExpandedReps(prev => ({
            ...prev,
            [repId]: !prev[repId]
        }));
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-AE', {
            style: 'currency',
            currency: 'AED',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    // Filter results based on search query
    const filteredResults = performanceData.results.filter(rep => {
        const query = searchQuery.toLowerCase();
        return (
            rep.name.toLowerCase().includes(query) ||
            rep.username.toLowerCase().includes(query)
        );
    });

    const getWinRateColor = (rate) => {
        if (rate >= 70) return '#10b981'; // Green
        if (rate >= 40) return '#3b82f6'; // Blue
        if (rate >= 20) return '#f59e0b'; // Amber
        return '#ef4444'; // Red
    };

    return (
        <div className="page-container p-4 fade-in" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
                <div>
                    <h2 className="font-weight-bold text-dark mb-1" style={{ letterSpacing: '-0.5px' }}>Sales Rep Performance</h2>
                    <p className="text-muted mb-0 small">
                        Track and analyze enquiry workflow, outcome metrics, and pipeline valuations for sales representatives.
                    </p>
                </div>
                <div>
                    <button 
                        className="btn text-white border-0 shadow-sm rounded-pill px-3 py-2 d-inline-flex align-items-center gap-2"
                        onClick={fetchPerformanceData}
                        disabled={loading}
                        style={{
                            background: 'linear-gradient(to right, #da8cff, #9a55ff)',
                            fontWeight: '600',
                            fontSize: '0.85rem'
                        }}
                    >
                        {loading ? (
                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                            </svg>
                        )}
                        Sync Stats
                    </button>
                </div>
            </div>

            {loading && performanceData.results.length === 0 ? (
                <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '50vh' }}>
                    <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }} role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <div className="text-muted font-weight-bold" style={{ letterSpacing: '1px' }}>LOADING SALES REP ANALYTICS...</div>
                </div>
            ) : (
                <>
                    {/* KPI Dashboard Cards (Dashboard Color Theme) */}
                    <div className="row g-3 mb-4">
                        {/* Card 1: Total Enquiries */}
                        <div className="col-xl-3 col-md-4 col-sm-6">
                            <div className="card border-0 h-100 text-white shadow-sm" style={{ 
                                background: 'linear-gradient(to right, #ffbf96, #fe7096)', 
                                borderRadius: '12px',
                                boxShadow: '0 6px 20px rgba(254, 112, 150, 0.25)',
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                                <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '130px', height: '130px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.13)' }} />
                                <div style={{ position: 'absolute', top: '30px', right: '-60px', width: '130px', height: '130px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.13)' }} />
                                <div className="card-body p-4 position-relative" style={{ zIndex: 2 }}>
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <div className="small font-weight-bold text-uppercase tracking-wider mb-2" style={{ fontSize: '0.8rem', opacity: 0.85 }}>Total Enquiries</div>
                                            <h2 className="mb-2 font-weight-bold" style={{ fontSize: '1.8rem', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>{performanceData.summary.totalEnquiries}</h2>
                                            <div className="small mt-2" style={{ opacity: 0.8, fontSize: '0.75rem' }}>Assigned to all active reps</div>
                                        </div>
                                        <div style={{ opacity: 0.85 }}>
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Card 2: Total Won */}
                        <div className="col-xl-3 col-md-4 col-sm-6">
                            <div className="card border-0 h-100 text-white shadow-sm" style={{ 
                                background: 'linear-gradient(to right, #84d9d2, #07cdae)', 
                                borderRadius: '12px',
                                boxShadow: '0 6px 20px rgba(7, 205, 174, 0.25)',
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                                <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '130px', height: '130px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.13)' }} />
                                <div style={{ position: 'absolute', top: '30px', right: '-60px', width: '130px', height: '130px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.13)' }} />
                                <div className="card-body p-4 position-relative" style={{ zIndex: 2 }}>
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <div className="small font-weight-bold text-uppercase tracking-wider mb-2" style={{ fontSize: '0.8rem', opacity: 0.85 }}>Total Won</div>
                                            <h2 className="mb-2 font-weight-bold" style={{ fontSize: '1.8rem', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>{performanceData.summary.wonCount}</h2>
                                            <div className="small mt-2" style={{ opacity: 0.8, fontSize: '0.75rem' }}>
                                                Successful conversions ({performanceData.summary.totalEnquiries ? roundPercent(performanceData.summary.wonCount, performanceData.summary.totalEnquiries) : 0}%)
                                            </div>
                                        </div>
                                        <div style={{ opacity: 0.85 }}>
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 3h12l4 6-10 13L2 9z"/></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Card 3: Total Regretted */}
                        <div className="col-xl-3 col-md-4 col-sm-6">
                            <div className="card border-0 h-100 text-white shadow-sm" style={{ 
                                background: 'linear-gradient(to right, #c3a1ff, #7f39fb)', 
                                borderRadius: '12px',
                                boxShadow: '0 6px 20px rgba(127, 57, 251, 0.25)',
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                                <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '130px', height: '130px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.13)' }} />
                                <div style={{ position: 'absolute', top: '30px', right: '-60px', width: '130px', height: '130px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.13)' }} />
                                <div className="card-body p-4 position-relative" style={{ zIndex: 2 }}>
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <div className="small font-weight-bold text-uppercase tracking-wider mb-2" style={{ fontSize: '0.8rem', opacity: 0.85 }}>Total Regretted</div>
                                            <h2 className="mb-2 font-weight-bold" style={{ fontSize: '1.8rem', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>{performanceData.summary.regrettedCount}</h2>
                                            <div className="small mt-2" style={{ opacity: 0.8, fontSize: '0.75rem' }}>
                                                Regretted + Quote Regretted ({performanceData.summary.totalEnquiries ? roundPercent(performanceData.summary.regrettedCount, performanceData.summary.totalEnquiries) : 0}%)
                                            </div>
                                        </div>
                                        <div style={{ opacity: 0.85 }}>
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Card 4: Total Lost */}
                        <div className="col-xl-3 col-md-4 col-sm-6">
                            <div className="card border-0 h-100 text-white shadow-sm" style={{ 
                                background: 'linear-gradient(to right, #64748b, #475569)', 
                                borderRadius: '12px',
                                boxShadow: '0 6px 20px rgba(100, 116, 139, 0.25)',
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                                <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '130px', height: '130px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.13)' }} />
                                <div style={{ position: 'absolute', top: '30px', right: '-60px', width: '130px', height: '130px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.13)' }} />
                                <div className="card-body p-4 position-relative" style={{ zIndex: 2 }}>
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <div className="small font-weight-bold text-uppercase tracking-wider mb-2" style={{ fontSize: '0.8rem', opacity: 0.85 }}>Total Lost</div>
                                            <h2 className="mb-2 font-weight-bold" style={{ fontSize: '1.8rem', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>{performanceData.summary.lostCount}</h2>
                                            <div className="small mt-2" style={{ opacity: 0.8, fontSize: '0.75rem' }}>
                                                Lost outcomes ({performanceData.summary.totalEnquiries ? roundPercent(performanceData.summary.lostCount, performanceData.summary.totalEnquiries) : 0}%)
                                            </div>
                                        </div>
                                        <div style={{ opacity: 0.85 }}>
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Search Panel */}
                    <div className="row mb-4">
                        <div className="col-md-5">
                            <div className="input-group shadow-sm" style={{ borderRadius: '10px', overflow: 'hidden' }}>
                                <span className="input-group-text bg-white border-0 text-muted ps-3">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <circle cx="11" cy="11" r="8" />
                                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                    </svg>
                                </span>
                                <input 
                                    type="text" 
                                    className="form-control border-0 py-2.5" 
                                    placeholder="Search sales representatives by name or username..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{ fontSize: '0.92rem' }}
                                />
                                {searchQuery && (
                                    <button 
                                        className="btn btn-white border-0 text-muted pe-3" 
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <line x1="18" y1="6" x2="6" y2="18" />
                                            <line x1="6" y1="6" x2="18" y2="18" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="card border-0 shadow-sm overflow-hidden" style={{ borderRadius: '16px' }}>
                        <div className="table-responsive">
                            <table className="table align-middle mb-0" style={{ minWidth: '900px' }}>
                                <thead style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                                    <tr>
                                        <th className="ps-4 py-3 text-secondary font-weight-semibold" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>S.No</th>
                                        <th className="py-3 text-secondary font-weight-semibold" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Sales Representative</th>
                                        <th className="py-3 text-secondary font-weight-semibold" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Status</th>
                                        <th className="py-3 text-secondary font-weight-semibold text-center" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Total Enquiries</th>
                                        <th className="py-3 text-success font-weight-semibold text-center" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Won</th>
                                        <th className="py-3 text-danger font-weight-semibold text-center" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Lost</th>
                                        <th className="py-3 text-warning font-weight-semibold text-center" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Regretted</th>
                                        <th className="py-3 text-info font-weight-semibold text-center" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Quoted</th>
                                        <th className="py-3 text-secondary font-weight-semibold text-center" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Pending</th>
                                        <th className="py-3 text-secondary font-weight-semibold" style={{ fontSize: '0.8rem', textTransform: 'uppercase', width: '180px' }}>Win Rate</th>
                                        <th className="pe-4 py-3 text-secondary font-weight-semibold text-end" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredResults.length === 0 ? (
                                        <tr>
                                            <td colSpan="11" className="text-center py-5 text-muted">
                                                No sales representatives found matching your search.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredResults.map((rep, index) => {
                                            const isExpanded = !!expandedReps[rep.id];
                                            return (
                                                <React.Fragment key={rep.id}>
                                                    <tr style={{ 
                                                        borderBottom: isExpanded ? 'none' : '1px solid #f1f5f9',
                                                        backgroundColor: isExpanded ? '#f8fafc' : 'transparent',
                                                        transition: 'background-color 0.2s ease'
                                                    }}>
                                                        <td className="ps-4 py-3.5 text-secondary font-weight-medium">
                                                            {index + 1}
                                                        </td>
                                                        <td className="py-3.5">
                                                            <div className="d-flex flex-column">
                                                                <span className="font-weight-bold text-dark" style={{ fontSize: '0.95rem' }}>{rep.name}</span>
                                                                <span className="text-muted small" style={{ fontSize: '0.75rem' }}>@{rep.username}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-3.5">
                                                            <span className={`badge px-2 py-1.5 rounded-pill ${rep.isActive ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'}`} style={{ fontSize: '0.72rem', fontWeight: '600' }}>
                                                                {rep.isActive ? 'Active' : 'Inactive'}
                                                            </span>
                                                        </td>
                                                        <td className="py-3.5 text-center font-weight-bold text-dark">
                                                            {rep.totalEnquiries}
                                                        </td>
                                                        <td className="py-3.5 text-center font-weight-bold text-success">
                                                            {rep.wonCount}
                                                        </td>
                                                        <td className="py-3.5 text-center font-weight-bold text-danger">
                                                            {rep.lostCount}
                                                        </td>
                                                        <td className="py-3.5 text-center font-weight-bold text-warning">
                                                            {rep.regrettedCount}
                                                        </td>
                                                        <td className="py-3.5 text-center font-weight-semibold text-info">
                                                            {rep.quoteSubmittedCount}
                                                        </td>
                                                        <td className="py-3.5 text-center font-weight-semibold text-muted">
                                                            {rep.pendingCount}
                                                        </td>
                                                        <td className="py-3.5">
                                                            <div className="d-flex align-items-center gap-2">
                                                                <span className="font-weight-bold text-dark" style={{ minWidth: '40px', fontSize: '0.85rem' }}>
                                                                    {rep.winRate}%
                                                                </span>
                                                                <div className="progress flex-grow-1" style={{ height: '6px', borderRadius: '10px', backgroundColor: '#e2e8f0' }}>
                                                                    <div 
                                                                        className="progress-bar" 
                                                                        role="progressbar" 
                                                                        style={{ 
                                                                            width: `${rep.winRate}%`, 
                                                                            backgroundColor: getWinRateColor(rep.winRate),
                                                                            borderRadius: '10px' 
                                                                        }} 
                                                                        aria-valuenow={rep.winRate} 
                                                                        aria-valuemin="0" 
                                                                        aria-valuemax="100"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="pe-4 py-3.5 text-end">
                                                            <button 
                                                                className={`btn btn-sm rounded-circle p-2 d-inline-flex align-items-center justify-content-center border-0 shadow-none ${isExpanded ? 'bg-primary text-white' : 'bg-light text-secondary'}`}
                                                                onClick={() => toggleRow(rep.id)}
                                                                style={{ width: '32px', height: '32px', transition: 'all 0.2s ease' }}
                                                                title={isExpanded ? 'Hide Details' : 'View Details'}
                                                            >
                                                                <svg 
                                                                    width="16" 
                                                                    height="16" 
                                                                    viewBox="0 0 24 24" 
                                                                    fill="none" 
                                                                    stroke="currentColor" 
                                                                    strokeWidth="2.5"
                                                                    style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}
                                                                >
                                                                    <polyline points="6 9 12 15 18 9" />
                                                                </svg>
                                                            </button>
                                                        </td>
                                                    </tr>

                                                    {/* Expanded Row Content */}
                                                    {isExpanded && (
                                                        <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                                            <td colSpan="11" className="px-4 pb-4 pt-1">
                                                                <div className="bg-white p-4 border shadow-sm" style={{ borderRadius: '12px' }}>
                                                                    <div className="row g-4">
                                                                        {/* Status Breakdown Section */}
                                                                        <div className="col-lg-7">
                                                                            <h6 className="font-weight-bold text-dark mb-3 d-flex align-items-center gap-2" style={{ fontSize: '0.85rem' }}>
                                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-primary">
                                                                                    <rect x="3" y="3" width="7" height="9" />
                                                                                    <rect x="14" y="3" width="7" height="5" />
                                                                                    <rect x="14" y="12" width="7" height="9" />
                                                                                    <rect x="3" y="16" width="7" height="5" />
                                                                                </svg>
                                                                                RFQ Pipeline Status Distribution
                                                                            </h6>
                                                                            <div className="row row-cols-2 row-cols-sm-3 g-2.5">
                                                                                {Object.entries(rep.statuses).map(([statusName, statusCount]) => {
                                                                                    const percentage = rep.totalEnquiries ? Math.round((statusCount / rep.totalEnquiries) * 100) : 0;
                                                                                    return (
                                                                                        <div key={statusName} className="col">
                                                                                            <div className="p-2.5 rounded border border-light-subtle bg-light-subtle h-100 d-flex flex-column justify-content-between">
                                                                                                <span className="text-secondary small font-weight-medium truncate" style={{ fontSize: '0.72rem' }} title={statusName}>
                                                                                                    {statusName}
                                                                                                </span>
                                                                                                <div className="d-flex align-items-baseline gap-2 mt-1">
                                                                                                    <span className="font-weight-bold text-dark" style={{ fontSize: '1.1rem' }}>
                                                                                                        {statusCount}
                                                                                                    </span>
                                                                                                    <span className="text-muted small" style={{ fontSize: '0.68rem' }}>
                                                                                                        ({percentage}%)
                                                                                                    </span>
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        </div>

                                                                        {/* Valuations / Financials Section */}
                                                                        <div className="col-lg-5">
                                                                            <h6 className="font-weight-bold text-dark mb-3 d-flex align-items-center gap-2" style={{ fontSize: '0.85rem' }}>
                                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-success">
                                                                                    <line x1="12" y1="1" x2="12" y2="23" />
                                                                                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                                                                </svg>
                                                                                Enquiry Valuation Summary
                                                                            </h6>
                                                                            <div className="d-flex flex-column gap-2.5">
                                                                                {/* Quoted Value */}
                                                                                <div className="d-flex align-items-center justify-content-between p-2.5 rounded border bg-light-subtle">
                                                                                    <span className="text-secondary font-weight-medium" style={{ fontSize: '0.78rem' }}>Quoted Value</span>
                                                                                    <span className="font-weight-bold text-primary" style={{ fontSize: '0.92rem' }}>
                                                                                        {formatCurrency(rep.values.quoted)}
                                                                                    </span>
                                                                                </div>
                                                                                
                                                                                {/* PO Value */}
                                                                                <div className="d-flex align-items-center justify-content-between p-2.5 rounded border bg-light-subtle">
                                                                                    <span className="text-secondary font-weight-medium" style={{ fontSize: '0.78rem' }}>PO Value (Won)</span>
                                                                                    <span className="font-weight-bold text-success" style={{ fontSize: '0.92rem' }}>
                                                                                        {formatCurrency(rep.values.po)}
                                                                                    </span>
                                                                                </div>
                                                                                
                                                                                {/* Open L1 Value */}
                                                                                <div className="d-flex align-items-center justify-content-between p-2.5 rounded border bg-light-subtle">
                                                                                    <span className="text-secondary font-weight-medium" style={{ fontSize: '0.78rem' }}>Open L1 Value</span>
                                                                                    <span className="font-weight-bold text-warning" style={{ fontSize: '0.92rem' }}>
                                                                                        {formatCurrency(rep.values.openL1)}
                                                                                    </span>
                                                                                </div>

                                                                                {/* Lost Value */}
                                                                                <div className="d-flex align-items-center justify-content-between p-2.5 rounded border bg-light-subtle">
                                                                                    <span className="text-secondary font-weight-medium" style={{ fontSize: '0.78rem' }}>Lost Value</span>
                                                                                    <span className="font-weight-bold text-danger" style={{ fontSize: '0.92rem' }}>
                                                                                        {formatCurrency(rep.values.lost)}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

// Simple utility functions for the view
const roundPercent = (part, total) => {
    if (!total) return 0;
    return Math.round((part / total) * 100);
};

export default SalesRepPerformance;
