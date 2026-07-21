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
            if (data && data.kpis) {
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
                quoted_over_90: 'true', // Filter for this specific page
                ...filters
            };
            if (!params.status) params.status = 'Quote Submitted'; // default base status
            
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

    // Reset pagination on filter or sort change
    useEffect(() => {
        setPage(1);
    }, [filters, sortField, sortDirection, pageSize]);

    // Fetch listing on change
    useEffect(() => {
        setLoading(true);
        const delayDebounce = setTimeout(() => {
            fetchEnquiries();
        }, 300);
        return () => clearTimeout(delayDebounce);
    }, [page, pageSize, filters, sortField, sortDirection]);

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
        <div className="page-container p-4 fade-in">
            <div className="row mb-4 align-items-center">
                <div className="col-md-6">
                    <h4 className="font-weight-bold text-dark mb-1">Quoted (&gt;90 Days)</h4>
                    <p className="page-subtitle text-muted mb-0">Monitor quotes submitted over 90 days ago</p>
                </div>
            </div>

            {/* KPI Cards Row */}
            <div className="row mb-4">
                <div className="col-md-3 mb-3">
                    <div className="card shadow-sm border-0 h-100" style={{ borderRadius: '12px', borderLeft: '4px solid #0d6efd' }}>
                        <div className="card-body py-3 px-4">
                            <h6 className="text-muted font-weight-bold text-uppercase mb-2" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Total Quoted Records</h6>
                            <h3 className="mb-0 font-weight-bold text-dark">
                                {statsLoading ? <span className="spinner-border spinner-border-sm"></span> : stats.totalQuotedRecords}
                            </h3>
                        </div>
                    </div>
                </div>
                <div className="col-md-3 mb-3">
                    <div className="card shadow-sm border-0 h-100" style={{ borderRadius: '12px', borderLeft: '4px solid #dc3545' }}>
                        <div className="card-body py-3 px-4">
                            <h6 className="text-muted font-weight-bold text-uppercase mb-2" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Quoted &gt; 90 Days</h6>
                            <h3 className="mb-0 font-weight-bold text-dark">
                                {statsLoading ? <span className="spinner-border spinner-border-sm"></span> : stats.quotedOver90}
                            </h3>
                        </div>
                    </div>
                </div>
                <div className="col-md-3 mb-3">
                    <div className="card shadow-sm border-0 h-100" style={{ borderRadius: '12px', borderLeft: '4px solid #fd7e14' }}>
                        <div className="card-body py-3 px-4">
                            <h6 className="text-muted font-weight-bold text-uppercase mb-2" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Awaiting Client Reply</h6>
                            <h3 className="mb-0 font-weight-bold text-dark">
                                {statsLoading ? <span className="spinner-border spinner-border-sm"></span> : stats.quotedAwaitingReply}
                            </h3>
                        </div>
                    </div>
                </div>
                <div className="col-md-3 mb-3">
                    <div className="card shadow-sm border-0 h-100" style={{ borderRadius: '12px', borderLeft: '4px solid #198754' }}>
                        <div className="card-body py-3 px-4">
                            <h6 className="text-muted font-weight-bold text-uppercase mb-2" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Client Response</h6>
                            <h3 className="mb-0 font-weight-bold text-dark">
                                {statsLoading ? <span className="spinner-border spinner-border-sm"></span> : stats.quotedClientResponse}
                            </h3>
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
                        emptyMessage="No enquiries over 90 days found."
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
                                    {enq.quote_value ? `${parseFloat(enq.quote_value).toLocaleString('en-US', { style: 'currency', currency: 'AED' })}` : 'N/A'}
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
