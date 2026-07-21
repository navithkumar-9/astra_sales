import { useState, useEffect } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getAvatarStyle } from '../utils/avatar';
import EnquiryTable from '../components/common/EnquiryTable';
import { enquiryService } from '../services/enquiryService';
import CreateEnquiryModal from '../components/enquiry/CreateEnquiryModal';
import ViewEnquiryModal from '../components/enquiry/ViewEnquiryModal';
import ExportButton from '../components/common/ExportButton';
import FilterPanel from '../components/common/FilterPanel';
import Pagination from '../components/common/Pagination';


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
    const [pageSize, setPageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [filters, setFilters] = useState({});
    const [sortField, setSortField] = useState('created_at');
    const [sortDirection, setSortDirection] = useState('desc');

    // Modal control states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedEnquiry, setSelectedEnquiry] = useState(null);

    // Modals now manage their own state.

    // Fetch enquiries list
    const fetchEnquiries = async () => {
        try {
            const params = {
                page,
                page_size: pageSize,
                ordering: sortField ? `${sortDirection === 'desc' ? '-' : ''}${sortField}` : undefined,
                ...filters
            };
            const responseData = await enquiryService.getAll(params);
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

    const handleViewEnquiry = async (enquiry) => {
        setSelectedEnquiry(enquiry);
        setShowViewModal(true);
        try {
            const detail = await enquiryService.getById(enquiry.id);
            setSelectedEnquiry(detail);
        } catch (err) {
            showToast('Failed to load full enquiry details.', 'error');
        }
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
                <div className="d-flex align-items-center gap-3">
                    <ExportButton filters={filters} />
                    {canCreate && (
                        <button 
                            className="btn btn-gradient-primary d-flex align-items-center gap-2 border-0 shadow-sm"
                            onClick={openCreateModal}
                            style={{ margin: 0 }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            Add Enquiry
                        </button>
                    )}
                </div>
            </div>

            <div className="row mb-4">
                <div className="col-12">
                    <FilterPanel filters={filters} onFilterChange={setFilters} showStatusFilter={true} />
                </div>
            </div>

            <div className="row">
                <div className="col-12">
                    <EnquiryTable 
                        columns={[
                            { label: 'S.No', className: 'ps-4' },
                            { label: 'Project No', sortField: 'project_number' },
                            { label: 'RFQ Date', sortField: 'rfq_date' },
                            { label: 'RFQ No', sortField: 'rfq_no' },
                            { label: 'Customer', sortField: 'customer__name' },
                            { label: 'Division' },
                            { label: 'Status', sortField: 'status' },
                            { label: 'Actions', className: 'text-center pe-4' }
                        ]}
                        data={enquiries}
                        loading={loading}
                        emptyMessage="No enquiries found matching your search."
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onSort={(field, dir) => {
                            setSortField(field);
                            setSortDirection(dir);
                        }}
                        renderRow={(enq, idx) => (
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
                                <td className="py-3 align-middle">
                                    <span className="badge bg-light text-dark px-3 py-2" style={{ fontSize: '0.72rem', fontWeight: '600' }}>
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
