import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getAvatarStyle } from '../utils/avatar';
import EnquiryTable from '../components/common/EnquiryTable';
import FilterPanel from '../components/common/FilterPanel';
import Pagination from '../components/common/Pagination';
import { enquiryService } from '../services/enquiryService';
import { userService } from '../services/userService';

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
    const [salesReps, setSalesReps] = useState([]);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [viewOnly, setViewOnly] = useState(false);
    const [selectedEnq, setSelectedEnq] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Edit form states
    const [salesRemarks, setSalesRemarks] = useState('');
    const [selectedSalesRep, setSelectedSalesRep] = useState('');
    const [status, setStatus] = useState('Sales to Quote');

    // Quote & PO fields
    const [quoteDate, setQuoteDate] = useState('');
    const [quoteValue, setQuoteValue] = useState('');
    const [openL1Value, setOpenL1Value] = useState('');
    const [openL1Date, setOpenL1Date] = useState('');
    const [lostValue, setLostValue] = useState('');
    const [poNo, setPoNo] = useState('');
    const [poReceiptDate, setPoReceiptDate] = useState('');
    const [poValue, setPoValue] = useState('');

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
        setSalesRemarks(enq.sales_remarks || '');
        setSelectedSalesRep(enq.sales_rep?.id || '');
        setStatus(enq.status || 'Sales to Quote');
        
        setQuoteDate(enq.quote_date || '');
        setQuoteValue(enq.quote_value || '');
        setOpenL1Value(enq.open_l1_value || '');
        setOpenL1Date(enq.open_l1_date || '');
        setLostValue(enq.lost_value || '');
        setPoNo(enq.po_no || '');
        setPoReceiptDate(enq.po_receipt_date || '');
        setPoValue(enq.po_value || '');

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
        let newStatus = status;

        const payload = {
            ...selectedEnq,
            customer: selectedEnq.customer?.id,
            sbu: selectedEnq.sbu?.id,
            division: selectedEnq.division?.id,
            rfq_type: selectedEnq.rfq_type?.id,
            fg_type: selectedEnq.fg_type?.id,
            fg_details: selectedEnq.fg_details || [],
            sales_rep: parseInt(selectedSalesRep),
            sales_remarks: salesRemarks || '',
            quote_date: quoteDate || null,
            quote_value: quoteValue || null,
            open_l1_value: openL1Value || null,
            open_l1_date: openL1Date || null,
            lost_value: lostValue || null,
            po_no: poNo || '',
            po_receipt_date: poReceiptDate || null,
            po_value: poValue || null,
            status: newStatus
        };

        try {
            await enquiryService.update(selectedEnq.id, payload);
            showToast('Sales details saved successfully!', 'success');
            setShowModal(false);
            fetchEnquiries();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to update sales details.', 'error');
        } finally {
            setSubmitting(false);
        }
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
                                            {canEdit && !viewOnly ? "Edit Sales Details" : "Sales Details Summary"}
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

                                {/* Sales Fields */}
                                <h6 className="font-weight-bold text-primary mb-3 pb-2 border-bottom">Sales Estimation & Action</h6>
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
                                            <option value="Lost">Lost</option>
                                            <option value="On Hold">On Hold</option>
                                            <option value="Regretted">Regretted</option>
                                            <option value="Open - L1">Open - L1</option>
                                            <option value="Won">Won</option>
                                            <option value="Quote Regretted">Quote Regretted</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Sales Remarks */}
                                <div className="mb-4">
                                    <label className="form-label font-weight-semibold">Sales Team Remarks</label>
                                    <textarea
                                        className="form-control"
                                        rows="3"
                                        placeholder="Add sales remarks / notes"
                                        value={salesRemarks}
                                        onChange={(e) => setSalesRemarks(e.target.value)}
                                        disabled={!canEdit || viewOnly}
                                    />
                                </div>

                                {/* Quote & PO Details */}
                                <h6 className="font-weight-bold text-primary mb-3 pb-2 border-bottom">Quote & PO Tracking</h6>
                                <div className="row g-3 mb-4">
                                    <div className="col-md-4">
                                        <label className="form-label font-weight-semibold">Quote Date</label>
                                        <input type="date" className="form-control" value={quoteDate} onChange={(e) => setQuoteDate(e.target.value)} disabled={!canEdit || viewOnly} />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label font-weight-semibold">Quote Value</label>
                                        <input type="number" className="form-control" value={quoteValue} onChange={(e) => setQuoteValue(e.target.value)} disabled={!canEdit || viewOnly} />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label font-weight-semibold">Open-L1 Value</label>
                                        <input type="number" className="form-control" value={openL1Value} onChange={(e) => setOpenL1Value(e.target.value)} disabled={!canEdit || viewOnly} />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label font-weight-semibold">Open-L1 Date</label>
                                        <input type="date" className="form-control" value={openL1Date} onChange={(e) => setOpenL1Date(e.target.value)} disabled={!canEdit || viewOnly} />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label font-weight-semibold">Lost Value</label>
                                        <input type="number" className="form-control" value={lostValue} onChange={(e) => setLostValue(e.target.value)} disabled={!canEdit || viewOnly} />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label font-weight-semibold">PO No</label>
                                        <input type="text" className="form-control" value={poNo} onChange={(e) => setPoNo(e.target.value)} disabled={!canEdit || viewOnly} />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label font-weight-semibold">PO Receipt Date</label>
                                        <input type="date" className="form-control" value={poReceiptDate} onChange={(e) => setPoReceiptDate(e.target.value)} disabled={!canEdit || viewOnly} />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label font-weight-semibold">PO Value</label>
                                        <input type="number" className="form-control" value={poValue} onChange={(e) => setPoValue(e.target.value)} disabled={!canEdit || viewOnly} />
                                    </div>
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

export default Lost;
