/* eslint-disable no-unused-vars, react-hooks/exhaustive-deps, react-hooks/rules-of-hooks */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import EnquiryTable from '../components/common/EnquiryTable';
import FilterPanel from '../components/common/FilterPanel';
import Pagination from '../components/common/Pagination';
import ViewEnquiryModal from '../components/enquiry/ViewEnquiryModal';
import { enquiryService } from '../services/enquiryService';
import API from '../api/axios';

const QuotedOver90 = () => {
    const { user } = useAuth();
    const { showToast } = useToast();

    // Enquiries listing states
    const [enquiries, setEnquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [filters, setFilters] = useState({});
    const [sortField, setSortField] = useState('created_at');
    const [sortDirection, setSortDirection] = useState('desc');
    
    // >90 Days Eye Toggle Filter state (false = show all Quote Submitted, true = show >90 days only)
    const [onlyOver90, setOnlyOver90] = useState(false);

    // KPI stats state
    const [stats, setStats] = useState({
        totalQuotedRecords: 0,
        quotedOver90: 0,
        quotedAwaitingReply: 0,
        quotedClientResponse: 0
    });
    const [statsLoading, setStatsLoading] = useState(true);

    // Modal control states
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedEnquiry, setSelectedEnquiry] = useState(null);

    // Fetch dashboard stats for KPI cards
    const fetchStats = async () => {
        try {
            setStatsLoading(true);
            const res = await API.get('/dashboard/stats/');
            const data = res.data;
            if (data && data.data && data.data.kpis) {
                const k = data.data.kpis;
                setStats({
                    totalQuotedRecords: k.totalQuotedRecords || 0,
                    quotedOver90: k.quotedOver90 || 0,
                    quotedAwaitingReply: k.quotedAwaitingReply || 0,
                    quotedClientResponse: k.quotedClientResponse || 0
                });
            } else if (data && data.kpis) {
                setStats({
                    totalQuotedRecords: data.kpis.totalQuotedRecords || 0,
                    quotedOver90: data.kpis.quotedOver90 || 0,
                    quotedAwaitingReply: data.kpis.quotedAwaitingReply || 0,
                    quotedClientResponse: data.kpis.quotedClientResponse || 0
                });
            }
        } catch (err) {
            console.error("Failed to load Quoted KPIs", err);
        } finally {
            setStatsLoading(false);
        }
    };

    // Fetch enquiries list
    const fetchEnquiries = async () => {
        try {
            const params = {
                page,
                page_size: pageSize,
                ordering: sortField ? `${sortDirection === 'desc' ? '-' : ''}${sortField}` : undefined,
                status: 'Quote Submitted',
                ...filters
            };
            
            // If Eye filter is active, apply >90 days filter
            if (onlyOver90) {
                params.quoted_over_90 = 'true';
            }
            
            const list = await enquiryService.getAll(params);
            if (list && list.results) {
                setEnquiries(list.results);
                setTotalCount(list.count || 0);
            } else {
                setEnquiries(Array.isArray(list) ? list : []);
                setTotalCount(Array.isArray(list) ? list.length : 0);
            }
        } catch (err) {
            showToast('Failed to fetch quoted enquiries.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        fetchStats();
    }, []);

    // Reset pagination on filter, sort, or toggle change
    useEffect(() => {
        setPage(1);
    }, [filters, sortField, sortDirection, pageSize, onlyOver90]);

    // Fetch listing on change
    useEffect(() => {
        setLoading(true);
        const delayDebounce = setTimeout(() => {
            fetchEnquiries();
        }, 300);
        return () => clearTimeout(delayDebounce);
    }, [page, pageSize, filters, sortField, sortDirection, onlyOver90]);

    const handleViewEnquiry = async (enquiry) => {
        setSelectedEnquiry(enquiry);
        setShowViewModal(true);
        try {
            const detail = await enquiryService.getById(enquiry.id);
            setSelectedEnquiry(detail);
        } catch (err) {
            showToast("Failed to fetch enquiry details", "error");
        }
    };

    const handleRefreshEnquiry = () => {
        fetchEnquiries();
        fetchStats();
    };

    return (
        <div className="page-container p-4 fade-in" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
                <div>
                    <h2 className="font-weight-bold text-dark mb-1" style={{ letterSpacing: '-0.5px' }}>Quoted (&gt;90 Days)</h2>
                    <p className="text-muted mb-0 small">
                        Monitor and filter quote submitted records across the pipeline
                    </p>
                </div>
                <div className="d-flex align-items-center gap-3">
                    {/* Eye Button Toggle Filter for >90 Days */}
                    <button
                        type="button"
                        className="btn btn-sm d-inline-flex align-items-center gap-2 rounded-pill px-3 shadow-sm"
                        style={{
                            background: onlyOver90
                                ? 'linear-gradient(to right, #da8cff, #9a55ff)'
                                : '#ffffff',
                            color: onlyOver90 ? '#ffffff' : '#4b5563',
                            border: onlyOver90 ? 'none' : '1.5px solid #e2e8f0',
                            fontWeight: '600',
                            fontSize: '0.85rem',
                            padding: '8px 16px',
                            transition: 'all 0.2s ease',
                            cursor: 'pointer'
                        }}
                        onClick={() => setOnlyOver90(!onlyOver90)}
                        title={onlyOver90 ? "Click to view All Quoted Records" : "Click to filter >90 Days Records"}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                        </svg>
                        <span>{onlyOver90 ? "Filter: >90 Days Only" : "Showing: All Quoted Records"}</span>
                    </button>

                    <button 
                        className="btn text-white border-0 shadow-sm rounded-pill px-3 py-2 d-inline-flex align-items-center gap-2"
                        onClick={handleRefreshEnquiry}
                        disabled={loading}
                        style={{
                            background: 'linear-gradient(to right, #da8cff, #9a55ff)',
                            fontWeight: '600',
                            fontSize: '0.85rem'
                        }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                        </svg>
                        Sync Data
                    </button>
                </div>
            </div>

            {/* KPI Cards Row (Matching Dashboard Theme) */}
            <div className="row g-3 mb-4">
                {/* Card 1: Total Quoted Records */}
                <div className="col-xl-3 col-md-4 col-sm-6">
                    <div 
                        className="card border-0 h-100 text-white shadow-sm" 
                        onClick={() => setOnlyOver90(false)}
                        role="button"
                        style={{ 
                            background: 'linear-gradient(to right, #ffbf96, #fe7096)', 
                            borderRadius: '12px',
                            boxShadow: '0 6px 20px rgba(254, 112, 150, 0.25)',
                            position: 'relative',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            transition: 'transform 0.2s ease'
                        }}
                    >
                        <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '130px', height: '130px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.13)' }} />
                        <div style={{ position: 'absolute', top: '30px', right: '-60px', width: '130px', height: '130px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.13)' }} />
                        <div className="card-body p-4 position-relative" style={{ zIndex: 2 }}>
                            <div className="d-flex justify-content-between align-items-start">
                                <div>
                                    <div className="small font-weight-bold text-uppercase tracking-wider mb-2" style={{ fontSize: '0.8rem', opacity: 0.85 }}>Total Quoted Records</div>
                                    <h2 className="mb-2 font-weight-bold" style={{ fontSize: '1.8rem', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                        {statsLoading ? <span className="spinner-border spinner-border-sm"></span> : stats.totalQuotedRecords}
                                    </h2>
                                    <div className="small mt-2" style={{ opacity: 0.8, fontSize: '0.75rem' }}>All submitted quotes (Click to view all)</div>
                                </div>
                                <div style={{ opacity: 0.85 }}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card 2: Quoted > 90 Days */}
                <div className="col-xl-3 col-md-4 col-sm-6">
                    <div 
                        className="card border-0 h-100 text-white shadow-sm" 
                        onClick={() => setOnlyOver90(true)}
                        role="button"
                        style={{ 
                            background: 'linear-gradient(to right, #84d9d2, #07cdae)', 
                            borderRadius: '12px',
                            boxShadow: '0 6px 20px rgba(7, 205, 174, 0.25)',
                            position: 'relative',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            transition: 'transform 0.2s ease'
                        }}
                    >
                        <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '130px', height: '130px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.13)' }} />
                        <div style={{ position: 'absolute', top: '30px', right: '-60px', width: '130px', height: '130px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.13)' }} />
                        <div className="card-body p-4 position-relative" style={{ zIndex: 2 }}>
                            <div className="d-flex justify-content-between align-items-start">
                                <div>
                                    <div className="small font-weight-bold text-uppercase tracking-wider mb-2" style={{ fontSize: '0.8rem', opacity: 0.85 }}>Quoted &gt; 90 Days</div>
                                    <h2 className="mb-2 font-weight-bold" style={{ fontSize: '1.8rem', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                        {statsLoading ? <span className="spinner-border spinner-border-sm"></span> : stats.quotedOver90}
                                    </h2>
                                    <div className="small mt-2" style={{ opacity: 0.8, fontSize: '0.75rem' }}>Submitted &gt; 90 days ago (Click to filter)</div>
                                </div>
                                <div style={{ opacity: 0.85 }}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card 3: Awaiting Client Reply */}
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
                                    <div className="small font-weight-bold text-uppercase tracking-wider mb-2" style={{ fontSize: '0.8rem', opacity: 0.85 }}>Awaiting Client Reply</div>
                                    <h2 className="mb-2 font-weight-bold" style={{ fontSize: '1.8rem', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                        {statsLoading ? <span className="spinner-border spinner-border-sm"></span> : stats.quotedAwaitingReply}
                                    </h2>
                                    <div className="small mt-2" style={{ opacity: 0.8, fontSize: '0.75rem' }}>Quotes in pipeline awaiting client feedback</div>
                                </div>
                                <div style={{ opacity: 0.85 }}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card 4: Client Response */}
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
                                    <div className="small font-weight-bold text-uppercase tracking-wider mb-2" style={{ fontSize: '0.8rem', opacity: 0.85 }}>Client Response</div>
                                    <h2 className="mb-2 font-weight-bold" style={{ fontSize: '1.8rem', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                        {statsLoading ? <span className="spinner-border spinner-border-sm"></span> : stats.quotedClientResponse}
                                    </h2>
                                    <div className="small mt-2" style={{ opacity: 0.8, fontSize: '0.75rem' }}>Completed responses</div>
                                </div>
                                <div style={{ opacity: 0.85 }}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="row mb-4">
                <div className="col-12">
                    <FilterPanel filters={filters} onFilterChange={setFilters} showStatusFilter={false} />
                </div>
            </div>

            {/* Table */}
            <div className="row">
                <div className="col-12">
                    <EnquiryTable 
                        columns={[
                            { label: 'RFQ No', sortField: 'rfq_no' },
                            { label: 'Quote Date', sortField: 'quote_date' },
                            { label: 'Customer', sortField: 'customer__name' },
                            { label: 'Project', sortField: 'project_name' },
                            { label: 'Quote Value', sortField: 'quote_value' },
                            { label: 'Sales Rep' },
                            { label: 'Actions', className: 'text-end' }
                        ]}
                        data={enquiries}
                        loading={loading}
                        emptyMessage={onlyOver90 ? "No enquiries over 90 days found." : "No Quote Submitted enquiries found."}
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onSort={(field, dir) => {
                            setSortField(field);
                            setSortDirection(dir);
                        }}
                        renderRow={(enq, idx) => (
                            <tr key={enq.id} className="modern-table-row">
                                <td className="py-3 ps-4 align-middle font-weight-medium text-dark">{enq.rfq_no}</td>
                                <td className="py-3 align-middle text-muted">
                                    <div className="d-flex align-items-center gap-1">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-75">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                            <line x1="16" y1="2" x2="16" y2="6" />
                                            <line x1="8" y1="2" x2="8" y2="6" />
                                            <line x1="3" y1="10" x2="21" y2="10" />
                                        </svg>
                                        <span>{enq.quote_date || 'N/A'}</span>
                                    </div>
                                </td>
                                <td className="py-3 align-middle font-weight-semibold text-dark">
                                    {enq.customer?.name || 'N/A'}
                                </td>
                                <td className="py-3 align-middle text-secondary font-weight-medium">{enq.project_name || 'N/A'}</td>
                                <td className="py-3 align-middle text-dark font-weight-bold">
                                    {enq.quote_value ? `₹${parseFloat(enq.quote_value).toLocaleString('en-IN')}` : 'N/A'}
                                </td>
                                <td className="py-3 align-middle text-secondary">
                                    {enq.sales_rep?.username || 'N/A'}
                                </td>
                                <td className="py-3 align-middle text-center pe-4">
                                    <button
                                        className="btn btn-action-view rounded-circle shadow-sm"
                                        onClick={() => handleViewEnquiry(enq)}
                                        title="View Enquiry Details"
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                        )}
                    />
                    <Pagination 
                        count={totalCount} 
                        page={page} 
                        pageSize={pageSize} 
                        onPageChange={setPage} 
                        onPageSizeChange={setPageSize} 
                    />
                </div>
            </div>

            <ViewEnquiryModal 
                show={showViewModal} 
                onClose={() => setShowViewModal(false)} 
                selectedEnquiry={selectedEnquiry} 
                onRefresh={handleRefreshEnquiry}
            />
        </div>
    );
};

export default QuotedOver90;

