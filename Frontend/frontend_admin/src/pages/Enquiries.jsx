import { useState, useEffect } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getAvatarStyle } from '../utils/avatar';
import EnquiryTable from '../components/common/EnquiryTable';
import { enquiryService } from '../services/enquiryService';
import CreateEnquiryModal from '../components/enquiry/CreateEnquiryModal';
import ViewEnquiryModal from '../components/enquiry/ViewEnquiryModal';

const Enquiries = () => {
    const { user } = useAuth();
    const { showToast } = useToast();

    // Check role permissions
    const isSuperAdmin = user?.role === 'SUPERADMIN';
    const isAdmin = user?.role === 'ADMIN';
    const isRfqTracker = user?.role === 'RFQ_TRACKER';
    const canCreate = isSuperAdmin || isAdmin || isRfqTracker;
    const canDelete = isSuperAdmin || isAdmin || isRfqTracker;

    const today = new Date().toISOString().split('T')[0];

    // Enquiries listing states
    const [enquiries, setEnquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [search, setSearch] = useState('');
    const pageSize = 10;

    // Modal control states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedEnquiry, setSelectedEnquiry] = useState(null);

    // Modals now manage their own state.

    // Fetch enquiries list
    const fetchEnquiries = async () => {
        try {
            const responseData = await enquiryService.getAll({
                page,
                page_size: pageSize,
                search
            });
            if (responseData && responseData.results) {
                setEnquiries(responseData.results);
                setTotalCount(responseData.count || 0);
            } else {
                setEnquiries(Array.isArray(responseData) ? responseData : []);
                setTotalCount(Array.isArray(responseData) ? responseData.length : 0);
            }
        } catch (err) {
            showToast('Failed to fetch enquiries.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Reset pagination on search change
    useEffect(() => {
        setPage(1);
    }, [search]);

    // Fetch listing on change
    useEffect(() => {
        setLoading(true);
        const delayDebounce = setTimeout(() => {
            fetchEnquiries();
        }, 300);
        return () => clearTimeout(delayDebounce);
    }, [page, search]);

    // Dropdowns and forms are handled by CreateEnquiryModal.

    const handleDeleteEnquiry = async (id) => {
        if (window.confirm("Are you sure you want to delete this enquiry? All associated items will be deleted cascade.")) {
            try {
                await enquiryService.delete(id);
                showToast("Enquiry deleted successfully.", "success");
                fetchEnquiries();
            } catch (err) {
                showToast("Failed to delete enquiry.", "error");
            }
        }
    };

    const openCreateModal = () => {
        setShowCreateModal(true);
    };

    const handleViewEnquiry = (enquiry) => {
        setSelectedEnquiry(enquiry);
        setShowViewModal(true);
    };

    const handleRefreshEnquiry = async () => {
        if (selectedEnquiry) {
            try {
                const updatedEnq = await enquiryService.getById(selectedEnquiry.id);
                setSelectedEnquiry(updatedEnq);
                setEnquiries(prev => prev.map(e => e.id === selectedEnquiry.id ? updatedEnq : e));
            } catch (err) {
                console.error("Failed to refresh enquiry details", err);
            }
        }
    };

    const getStatusClass = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed':
                return 'bg-success-subtle text-success';
            case 'rejected':
                return 'bg-danger-subtle text-danger';
            case 'pending':
                return 'bg-warning-subtle text-warning';
            default:
                return 'bg-primary-subtle text-primary';
        }
    };

    return (
        <div className="page container-fluid px-4 py-4">
            <div className="page-header d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 className="page-title h3 font-weight-bold mb-1">Enquiry Tracker</h1>
                    <p className="page-subtitle text-muted mb-0">List and manage sales request enquiries</p>
                </div>
                {canCreate && (
                    <button 
                        className="btn btn-gradient-primary d-flex align-items-center gap-2 border-0 shadow-sm"
                        onClick={openCreateModal}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Add Enquiry
                    </button>
                )}
            </div>

            {/* Modern Search Input */}
            <div className="row mb-4">
                <div className="col-md-4">
                    <div className="modern-search-wrapper shadow-sm">
                        <span className="modern-search-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-muted">
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                        </span>
                        <input
                            type="text"
                            className="form-control modern-search-input border-0"
                            placeholder="Search by project no or rfq..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Enquiries List Table */}
            {loading && enquiries.length === 0 ? (
                <div className="d-flex flex-column align-items-center justify-content-center min-vh-50 mt-5">
                    <div className="page-loader-spinner mb-3"></div>
                    <div className="text-muted font-weight-bold">Loading enquiries...</div>
                </div>
            ) : (
                <div className="card shadow border-0 overflow-hidden" style={{ borderRadius: '16px' }}>
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0" style={{ borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #edf2f7' }}>
                                <tr>
                                    <th className="text-uppercase text-secondary font-weight-bold py-3 ps-4" style={{ fontSize: '0.72rem', letterSpacing: '0.8px' }}>S.No</th>
                                    <th className="text-uppercase text-secondary font-weight-bold py-3" style={{ fontSize: '0.72rem', letterSpacing: '0.8px' }}>Project No</th>
                                    <th className="text-uppercase text-secondary font-weight-bold py-3" style={{ fontSize: '0.72rem', letterSpacing: '0.8px' }}>RFQ Date</th>
                                    <th className="text-uppercase text-secondary font-weight-bold py-3" style={{ fontSize: '0.72rem', letterSpacing: '0.8px' }}>RFQ No</th>
                                    <th className="text-uppercase text-secondary font-weight-bold py-3" style={{ fontSize: '0.72rem', letterSpacing: '0.8px' }}>Customer Name</th>
                                    <th className="text-uppercase text-secondary font-weight-bold py-3" style={{ fontSize: '0.72rem', letterSpacing: '0.8px' }}>Division</th>
                                    <th className="text-uppercase text-secondary font-weight-bold py-3" style={{ fontSize: '0.72rem', letterSpacing: '0.8px' }}>ED of Engg</th>
                                    <th className="text-uppercase text-secondary font-weight-bold py-3" style={{ fontSize: '0.72rem', letterSpacing: '0.8px' }}>ED of Costing</th>
                                    <th className="text-uppercase text-secondary font-weight-bold py-3" style={{ fontSize: '0.72rem', letterSpacing: '0.8px' }}>ED of Sales</th>
                                    <th className="text-uppercase text-secondary font-weight-bold py-3" style={{ fontSize: '0.72rem', letterSpacing: '0.8px' }}>Status</th>
                                    <th className="text-uppercase text-secondary font-weight-bold text-center py-3 pe-4" style={{ fontSize: '0.72rem', letterSpacing: '0.8px' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody style={{ background: '#fff' }}>
                                {enquiries.length === 0 ? (
                                    <tr>
                                        <td colSpan="11" className="text-center p-5 text-muted">
                                            No enquiries registered.
                                        </td>
                                    </tr>
                                ) : (
                                    enquiries.map((enq, idx) => (
                                        <tr key={enq.id} className="modern-table-row">
                                            <td className="ps-4 py-3 align-middle text-secondary font-weight-medium">
                                                <span className="badge bg-light text-secondary rounded-circle p-2" style={{ width: '26px', height: '26px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    {(page - 1) * pageSize + idx + 1}
                                                </span>
                                            </td>
                                            <td className="py-3 align-middle font-weight-bold text-dark">
                                                {enq.project_number}
                                            </td>
                                            <td className="py-3 align-middle">
                                                <div className="d-flex align-items-center gap-1 text-secondary">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-75">
                                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                                        <line x1="16" y1="2" x2="16" y2="6" />
                                                        <line x1="8" y1="2" x2="8" y2="6" />
                                                        <line x1="3" y1="10" x2="21" y2="10" />
                                                    </svg>
                                                    <span>{enq.rfq_date}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 align-middle font-weight-medium text-dark">{enq.rfq_no}</td>
                                            <td className="py-3 align-middle font-weight-semibold text-dark">
                                                {enq.customer?.name || 'N/A'}
                                            </td>
                                            <td className="py-3 align-middle text-secondary font-weight-medium">{enq.division?.name || 'N/A'}</td>
                                            <td className="py-3 align-middle text-muted">
                                                {enq.ed_of_engg ? (
                                                    <div className="d-flex align-items-center gap-1">
                                                        <span className="bullet-dot bg-success" style={{ width: '6px', height: '6px', borderRadius: '50%' }}></span>
                                                        <span>{enq.ed_of_engg}</span>
                                                    </div>
                                                ) : 'N/A'}
                                            </td>
                                            <td className="py-3 align-middle text-muted">
                                                {enq.ed_of_costing ? (
                                                    <div className="d-flex align-items-center gap-1">
                                                        <span className="bullet-dot bg-warning" style={{ width: '6px', height: '6px', borderRadius: '50%' }}></span>
                                                        <span>{enq.ed_of_costing}</span>
                                                    </div>
                                                ) : 'N/A'}
                                            </td>
                                            <td className="py-3 align-middle text-muted">
                                                {enq.ed_of_sales ? (
                                                    <div className="d-flex align-items-center gap-1">
                                                        <span className="bullet-dot bg-info" style={{ width: '6px', height: '6px', borderRadius: '50%' }}></span>
                                                        <span>{enq.ed_of_sales}</span>
                                                    </div>
                                                ) : 'N/A'}
                                            </td>
                                            <td className="py-3 align-middle">
                                                <span className={`badge rounded-pill ${getStatusClass(enq.status)} px-3 py-2`} style={{ fontSize: '0.72rem', fontWeight: '600' }}>
                                                    {enq.status}
                                                </span>
                                            </td>
                                            <td className="py-3 align-middle text-center pe-4">
                                                <div className="d-flex gap-2 justify-content-center">
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
                                                    {canDelete && (
                                                        <button
                                                            className="btn btn-action-delete rounded-circle shadow-sm"
                                                            onClick={() => handleDeleteEnquiry(enq.id)}
                                                            title="Delete Enquiry"
                                                        >
                                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                                <polyline points="3 6 5 6 21 6" />
                                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {totalCount > pageSize && (
                        <div className="pagination">
                            <button 
                                className="pagination-btn" 
                                disabled={page === 1} 
                                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                            >
                                Previous
                            </button>
                            <span className="pagination-info">
                                Page {page} of {Math.ceil(totalCount / pageSize)} ({totalCount} items)
                            </span>
                            <button 
                                className="pagination-btn" 
                                disabled={page >= Math.ceil(totalCount / pageSize)}
                                onClick={() => setPage(prev => prev + 1)}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            )}

            <CreateEnquiryModal 
                show={showCreateModal} 
                onClose={() => setShowCreateModal(false)} 
                onSuccess={() => {
                    setShowCreateModal(false);
                    fetchEnquiries();
                }} 
            />

            <ViewEnquiryModal 
                show={showViewModal} 
                onClose={() => setShowViewModal(false)} 
                selectedEnquiry={selectedEnquiry} 
                onRefresh={handleRefreshEnquiry}
            />
        </div>
    );
};

export default Enquiries;
