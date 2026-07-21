import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getAvatarStyle } from '../utils/avatar';
import EnquiryTable from '../components/common/EnquiryTable';
import FilterPanel from '../components/common/FilterPanel';
import Pagination from '../components/common/Pagination';
import { enquiryService } from '../services/enquiryService';
import EditSalesModal from '../components/enquiry/EditSalesModal';

const Lost = () => {
    const { user } = useAuth();
    const { showToast } = useToast();

    // Check roles
    const isSuperAdmin = user?.role === 'SUPERADMIN';
    const isAdmin = user?.role === 'ADMIN';
    const isRfqTracker = user?.role === 'RFQ_TRACKER';
    const canEdit = isRfqTracker; // RFQ trackers can edit, Admins/Superadmins only view

    const [enquiries, setEnquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [filters, setFilters] = useState({});
    const [sortField, setSortField] = useState('created_at');
    const [sortDirection, setSortDirection] = useState('desc');
    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [viewOnly, setViewOnly] = useState(false);
    const [selectedEnq, setSelectedEnq] = useState(null);

    // Fetch Sales to Quote enquiries
    const fetchEnquiries = async () => {
        try {
            const params = {
                page,
                page_size: pageSize,
                ordering: sortField ? `${sortDirection === 'desc' ? '-' : ''}${sortField}` : undefined,
                ...filters
            };
            if (!params.status) params.status = 'Lost';
            const list = await enquiryService.getAll(params);
            if (list && list.results) {
                setEnquiries(list.results);
                setTotalCount(list.count || 0);
            } else {
                setEnquiries(Array.isArray(list) ? list : []);
                setTotalCount(Array.isArray(list) ? list.length : 0);
            }
        } catch (err) {
            showToast('Failed to fetch Sales to Quote enquiries.', 'error');
        } finally {
            setLoading(false);
        }
    };



    useEffect(() => {
        setPage(1);
    }, [filters, sortField, sortDirection, pageSize]);

    useEffect(() => {
        setLoading(true);
        const delayDebounce = setTimeout(() => {
            fetchEnquiries();
        }, 300);
        return () => clearTimeout(delayDebounce);
    }, [page, pageSize, filters, sortField, sortDirection]);

    const handleActionClick = (enq, viewOnlyMode = false) => {
        setSelectedEnq(enq);
        setViewOnly(viewOnlyMode);
        setShowModal(true);
    };

    return (
        <div className="page container-fluid px-4 py-4">
            <div className="page-header d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 className="page-title h3 font-weight-bold mb-1">Lost</h1>
                    <p className="page-subtitle text-muted mb-0">Manage project enquiries in Lost stage</p>
                </div>
            </div>

            <div className="row mb-4"><div className="col-12"><FilterPanel filters={filters} onFilterChange={setFilters} showStatusFilter={false} /></div></div>

            {/* Table Listing */}
            <EnquiryTable 
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={(field, dir) => {
                    setSortField(field);
                    setSortDirection(dir);
                }} 
                columns={[
                    { label: 'S.No', className: 'ps-4' },
                    { label: 'Project No', sortField: 'project_number' },
                    { label: 'RFQ Date', sortField: 'rfq_date' },
                    { label: 'RFQ No', sortField: 'rfq_no' },
                    { label: 'Customer Name', sortField: 'customer__name' },
                    { label: 'Division' },
                    { label: 'Sales Rep' },
                    { label: 'Action', className: 'text-center pe-4' }
                ]}
                data={enquiries}
                loading={loading}
                emptyMessage="No enquiries in Lost stage."
                renderRow={(enq, idx) => (
                    <tr key={enq.id} className="modern-table-row">
                        <td className="ps-4 py-3 align-middle text-secondary font-weight-medium">
                            <span className="badge bg-light text-secondary rounded-circle p-2" style={{ width: '26px', height: '26px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                {idx + 1}
                            </span>
                        </td>
                        <td className="py-3 align-middle font-weight-bold text-dark">{enq.project_number}</td>
                        <td className="py-3 align-middle">{enq.rfq_date}</td>
                        <td className="py-3 align-middle font-weight-medium text-dark">{enq.rfq_no}</td>
                        <td className="py-3 align-middle font-weight-semibold text-dark">{enq.customer?.name || 'N/A'}</td>
                        <td className="py-3 align-middle text-secondary font-weight-medium">{enq.division?.name || 'N/A'}</td>
                        <td className="py-3 align-middle text-dark font-weight-medium">{enq.sales_rep?.name || enq.sales_rep?.username || 'N/A'}</td>
                        <td className="py-3 align-middle text-center pe-4">
                            <div className="d-flex gap-2 justify-content-center">
                                <button
                                    className="btn btn-action-view rounded-circle shadow-sm"
                                    onClick={() => handleActionClick(enq, true)}
                                    title="View Details"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                </button>
                                {canEdit && (
                                    <button
                                        className="btn btn-action-view rounded-circle shadow-sm"
                                        style={{ background: 'rgba(154, 85, 255, 0.08)', color: '#9a55ff' }}
                                        onClick={() => handleActionClick(enq, false)}
                                        title="Edit Details"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                            <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
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
                onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
            />

            {showModal && selectedEnq && (
                <EditSalesModal 
                    enq={selectedEnq} 
                    show={showModal} 
                    onClose={() => {
                        setShowModal(false);
                        setSelectedEnq(null);
                    }}
                    onSuccess={() => {
                        setShowModal(false);
                        setSelectedEnq(null);
                        fetchEnquiries();
                    }}
                    onRefresh={fetchEnquiries} 
                    canEdit={canEdit} 
                    viewOnly={viewOnly} 
                />
            )}
        </div>
    );
};

export default Lost;
