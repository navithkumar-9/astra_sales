import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getAvatarStyle } from '../utils/avatar';
import EnquiryTable from '../components/common/EnquiryTable';
import { enquiryService } from '../services/enquiryService';
import { userService } from '../services/userService';

const PendingEngg = () => {
    const { user } = useAuth();
    const { showToast } = useToast();

    // Check roles
    const isSuperAdmin = user?.role === 'SUPERADMIN';
    const isAdmin = user?.role === 'ADMIN';
    const isRfqTracker = user?.role === 'RFQ_TRACKER';
    const canEdit = isRfqTracker; // RFQ trackers can edit, Admins/Superadmins only view

    const [enquiries, setEnquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [salesReps, setSalesReps] = useState([]);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [viewOnly, setViewOnly] = useState(false);
    const [selectedEnq, setSelectedEnq] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Edit form states
    const [edOfEngg, setEdOfEngg] = useState('');
    const [actualDateOfEngg, setActualDateOfEngg] = useState('');
    const [enggRemarks, setEnggRemarks] = useState('');
    const [selectedSalesRep, setSelectedSalesRep] = useState('');
    const [status, setStatus] = useState('Pending with Engg');

    // Fetch pending engineering enquiries
    const fetchEnquiries = async () => {
        try {
            const list = await enquiryService.getAll({ 
                status: 'Pending with Engg', 
                page_size: 100, 
                search 
            });
            setEnquiries(list.results || list || []);
        } catch (err) {
            showToast('Failed to fetch pending engineering enquiries.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Load sales reps lookup
    const fetchSalesReps = async () => {
        try {
            const list = await userService.getSalesReps();
            setSalesReps(list.results || list || []);
        } catch (err) {
            showToast('Failed to load Sales Representatives.', 'error');
        }
    };

    useEffect(() => {
        fetchSalesReps();
    }, []);

    useEffect(() => {
        setLoading(true);
        const delayDebounce = setTimeout(() => {
            fetchEnquiries();
        }, 300);
        return () => clearTimeout(delayDebounce);
    }, [search]);

    const handleActionClick = (enq, viewOnlyMode = false) => {
        setSelectedEnq(enq);
        setEdOfEngg(enq.ed_of_engg || '');
        setActualDateOfEngg(enq.actual_date_of_engg || '');
        setEnggRemarks(enq.engg_remarks || '');
        setSelectedSalesRep(enq.sales_rep?.id || '');
        setStatus(enq.status || 'Pending with Engg');
        setViewOnly(viewOnlyMode);
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!selectedSalesRep) {
            showToast('Please assign a Sales Representative.', 'warning');
            return;
        }

        setSubmitting(true);
        // Auto transition status to Pending with Costing if both expected date and actual date are filled
        let targetStatus = status;
        if (edOfEngg && actualDateOfEngg) {
            targetStatus = 'Pending with Costing';
        }

        const payload = {
            ...selectedEnq,
            customer: selectedEnq.customer?.id,
            sbu: selectedEnq.sbu?.id,
            division: selectedEnq.division?.id,
            rfq_type: selectedEnq.rfq_type?.id,
            fg_type: selectedEnq.fg_type?.id,
            fg_details: selectedEnq.fg_details || [],
            sales_rep: parseInt(selectedSalesRep),
            ed_of_engg: edOfEngg || null,
            actual_date_of_engg: actualDateOfEngg || null,
            engg_remarks: enggRemarks || '',
            status: targetStatus
        };

        try {
            await enquiryService.update(selectedEnq.id, payload);
            showToast('Engineering details saved successfully!', 'success');
            setShowModal(false);
            fetchEnquiries();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to update engineering details.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="page container-fluid px-4 py-4">
            <div className="page-header d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 className="page-title h3 font-weight-bold mb-1">Pending with Engg</h1>
                    <p className="page-subtitle text-muted mb-0">Manage project enquiries pending engineering details</p>
                </div>
            </div>

            {/* Search Input */}
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

            {/* Table Listing */}
            <EnquiryTable 
                columns={[
                    { label: 'S.No', className: 'ps-4' },
                    { label: 'Project No' },
                    { label: 'RFQ Date' },
                    { label: 'RFQ No' },
                    { label: 'Customer Name' },
                    { label: 'Division' },
                    { label: 'Expected Date' },
                    { label: 'Actual Date' },
                    { label: 'Sales Rep' },
                    { label: 'Action', className: 'text-center pe-4' }
                ]}
                data={enquiries}
                loading={loading}
                emptyMessage="No enquiries pending with Engineering."
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
                        <td className="py-3 align-middle text-muted">{enq.ed_of_engg || 'N/A'}</td>
                        <td className="py-3 align-middle text-muted">{enq.actual_date_of_engg || 'N/A'}</td>
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

            {/* Edit / View Modal */}
            {showModal && selectedEnq && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                            <div className="enq-modal-header text-white d-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center gap-3">
                                    <div className="enq-modal-icon-wrap shadow-sm">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                            <polyline points="14 2 14 8 20 8" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h5 className="modal-title font-weight-bold mb-0">
                                            {canEdit && !viewOnly ? "Edit Engineering Details" : "Engineering Details Summary"}
                                        </h5>
                                        <span className="small text-white-50">{selectedEnq.project_number} - {selectedEnq.project_name}</span>
                                    </div>
                                </div>
                                <button type="button" className="enq-modal-close-icon" onClick={() => setShowModal(false)}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </div>
                            <form onSubmit={handleSave} className="modal-body p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                                {/* Enquiry Details (ReadOnly) */}
                                <h6 className="font-weight-bold text-primary mb-3 pb-2 border-bottom">Project Information</h6>
                                <div className="row g-3 mb-4">
                                    <div className="col-md-4">
                                        <div className="enq-details-card">
                                            <div className="enq-details-label">Customer Name</div>
                                            <div className="enq-details-value" style={{ fontSize: '0.9rem' }}>{selectedEnq.customer?.name || 'N/A'}</div>
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="enq-details-card">
                                            <div className="enq-details-label">SBU</div>
                                            <div className="enq-details-value" style={{ fontSize: '0.9rem' }}>{selectedEnq.sbu?.name || 'N/A'}</div>
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="enq-details-card">
                                            <div className="enq-details-label">Division</div>
                                            <div className="enq-details-value" style={{ fontSize: '0.9rem' }}>{selectedEnq.division?.name || 'N/A'}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="row g-3 mb-4">
                                    <div className="col-md-4">
                                        <div className="enq-details-card">
                                            <div className="enq-details-label">RFQ No</div>
                                            <div className="enq-details-value" style={{ fontSize: '0.9rem' }}>{selectedEnq.rfq_no}</div>
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="enq-details-card">
                                            <div className="enq-details-label">RFQ Date</div>
                                            <div className="enq-details-value" style={{ fontSize: '0.9rem' }}>{selectedEnq.rfq_date}</div>
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="enq-details-card">
                                            <div className="enq-details-label">RFQ Due Date</div>
                                            <div className="enq-details-value" style={{ fontSize: '0.9rem' }}>{selectedEnq.rfq_due_date} ({selectedEnq.rfq_due_time?.substring(0, 5)})</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Engineering Fields (Editable/ReadOnly based on Role) */}
                                <h6 className="font-weight-bold text-primary mb-3 pb-2 border-bottom">Engineering Status & Action</h6>
                                <div className="row g-3 mb-4">
                                    {/* Expected Date of Engineering */}
                                    <div className="col-md-6">
                                        <label className="form-label font-weight-semibold">Expected Date of Engineering</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            value={edOfEngg}
                                            onChange={(e) => setEdOfEngg(e.target.value)}
                                            disabled={!canEdit || viewOnly}
                                        />
                                    </div>
                                    {/* Actual Date of Engineering */}
                                    <div className="col-md-6">
                                        <label className="form-label font-weight-semibold">Actual Date of Engineering</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            value={actualDateOfEngg}
                                            onChange={(e) => setActualDateOfEngg(e.target.value)}
                                            disabled={!canEdit || viewOnly}
                                        />
                                    </div>
                                </div>

                                <div className="row g-3 mb-4">
                                    {/* Sales Representative */}
                                    <div className="col-md-6">
                                        <label className="form-label font-weight-semibold">Sales Representative <span className="text-danger">*</span></label>
                                        <select
                                            className="form-select"
                                            value={selectedSalesRep}
                                            onChange={(e) => setSelectedSalesRep(e.target.value)}
                                            disabled={!canEdit || viewOnly}
                                            required
                                        >
                                            <option value="">Select Sales Rep</option>
                                            {salesReps.map(rep => (
                                                <option key={rep.id} value={rep.id}>{rep.name || rep.username}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {/* Status */}
                                    <div className="col-md-6">
                                        <label className="form-label font-weight-semibold">Status</label>
                                        <select
                                            className="form-select"
                                            value={status}
                                            onChange={(e) => setStatus(e.target.value)}
                                            disabled={!canEdit || viewOnly}
                                        >
                                            <option value="Pending with Engg">Pending with Engg</option>
                                            <option value="Pending with Costing">Pending with Costing</option>
                                            <option value="Pending with Sales">Pending with Sales</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className="form-label font-weight-semibold">Engineering Remarks</label>
                                    <textarea
                                        className="form-control"
                                        rows="3"
                                        placeholder="Add engineering remarks / notes"
                                        value={enggRemarks}
                                        onChange={(e) => setEnggRemarks(e.target.value)}
                                        disabled={!canEdit || viewOnly}
                                    />
                                </div>

                                {/* Dynamic FG details sub-table (Read-only reference) */}
                                <h6 className="font-weight-bold text-primary mb-3 pb-2 border-bottom">Finished Goods (FG) List</h6>
                                <div className="table-responsive bg-light rounded shadow-sm border mb-2">
                                    <table className="table table-sm table-hover mb-0">
                                        <thead>
                                            <tr>
                                                <th className="ps-3 text-secondary py-2">FG Part No</th>
                                                <th className="text-secondary py-2">Description</th>
                                                <th className="text-secondary pe-3 text-end py-2">Quantity</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedEnq.fg_details?.length === 0 ? (
                                                <tr>
                                                    <td colSpan="3" className="text-center p-3 text-muted">No FG details associated.</td>
                                                </tr>
                                            ) : (
                                                selectedEnq.fg_details?.map((detail, idx) => (
                                                    <tr key={detail.id || idx}>
                                                        <td className="ps-3 font-weight-semibold text-dark py-2">{detail.fg_part_no}</td>
                                                        <td className="text-muted py-2">{detail.description || 'N/A'}</td>
                                                        <td className="pe-3 text-end font-weight-bold py-2">{detail.qty}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="d-flex gap-2 justify-content-end mt-4 pt-3 border-top">
                                    <button
                                        type="button"
                                        className="btn btn-secondary px-4"
                                        onClick={() => setShowModal(false)}
                                    >
                                        Close
                                    </button>
                                    {canEdit && !viewOnly && (
                                        <button
                                            type="submit"
                                            className="btn btn-gradient-primary border-0 shadow px-4"
                                            disabled={submitting}
                                        >
                                            {submitting ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PendingEngg;
