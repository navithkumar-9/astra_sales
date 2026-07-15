import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getAvatarStyle } from '../utils/avatar';
import EnquiryTable from '../components/common/EnquiryTable';
import { enquiryService } from '../services/enquiryService';
import { userService } from '../services/userService';
import { masterDataService } from '../services/masterDataService';

const PendingSales = () => {
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
    
    // Master data
    const [salesReps, setSalesReps] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [sbus, setSbus] = useState([]);
    const [divisions, setDivisions] = useState([]);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [viewOnly, setViewOnly] = useState(false);
    const [selectedEnq, setSelectedEnq] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Editable Core Details
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [selectedSbu, setSelectedSbu] = useState('');
    const [selectedDivision, setSelectedDivision] = useState('');
    const [rfqNo, setRfqNo] = useState('');
    const [rfqDate, setRfqDate] = useState('');
    const [rfqDueDate, setRfqDueDate] = useState('');

    // Edit form states
    const [edOfEngg, setEdOfEngg] = useState('');
    const [actualDateOfEngg, setActualDateOfEngg] = useState('');
    const [enggRemarks, setEnggRemarks] = useState('');

    const [edOfCosting, setEdOfCosting] = useState('');
    const [actualDateOfCosting, setActualDateOfCosting] = useState('');
    const [costingRemarks, setCostingRemarks] = useState('');

    const [edOfSales, setEdOfSales] = useState('');
    const [actualDateOfSales, setActualDateOfSales] = useState('');
    const [salesRemarks, setSalesRemarks] = useState('');
    const [selectedSalesRep, setSelectedSalesRep] = useState('');
    const [status, setStatus] = useState('Pending with Sales');

    // Quote & PO fields
    const [quoteDate, setQuoteDate] = useState('');
    const [quoteValue, setQuoteValue] = useState('');
    const [openL1Value, setOpenL1Value] = useState('');
    const [openL1Date, setOpenL1Date] = useState('');
    const [lostValue, setLostValue] = useState('');
    const [poNo, setPoNo] = useState('');
    const [poReceiptDate, setPoReceiptDate] = useState('');
    const [poValue, setPoValue] = useState('');

    // Fetch Pending with Sales enquiries
    const fetchEnquiries = async () => {
        try {
            const list = await enquiryService.getAll({ 
                status: 'Pending with Sales', 
                page_size: 100, 
                search 
            });
            setEnquiries(list.results || list || []);
        } catch (err) {
            showToast('Failed to fetch Pending with Sales enquiries.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Load master data
    const fetchMasterData = async () => {
        try {
            const [salesRes, custRes, sbuRes, divRes] = await Promise.all([
                userService.getSalesReps(),
                masterDataService.getCustomers({ page_size: 100 }),
                masterDataService.getSBUs({ page_size: 100 }),
                masterDataService.getDivisions({ page_size: 100 })
            ]);
            setSalesReps(salesRes.results || salesRes || []);
            setCustomers(custRes.results || custRes || []);
            setSbus(sbuRes.results || sbuRes || []);
            setDivisions(divRes.results || divRes || []);
        } catch (err) {
            showToast('Failed to load master data.', 'error');
        }
    };

    useEffect(() => {
        fetchMasterData();
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
        
        setSelectedCustomer(enq.customer?.id || '');
        setSelectedSbu(enq.sbu?.id || '');
        setSelectedDivision(enq.division?.id || '');
        setRfqNo(enq.rfq_no || '');
        setRfqDate(enq.rfq_date || '');
        setRfqDueDate(enq.rfq_due_date || '');

        setEdOfEngg(enq.ed_of_engg || '');
        setActualDateOfEngg(enq.actual_date_of_engg || '');
        setEnggRemarks(enq.engg_remarks || '');

        setEdOfCosting(enq.ed_of_costing || '');
        setActualDateOfCosting(enq.actual_date_of_costing || '');
        setCostingRemarks(enq.costing_remarks || '');

        setEdOfSales(enq.ed_of_sales || '');
        setActualDateOfSales(enq.actual_date_of_sales || '');
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

    const handleStatusChange = (e) => {
        const newStatus = e.target.value;
        setStatus(newStatus);
        
        if (newStatus === 'Pending with Engg') {
            setEdOfEngg('');
            setActualDateOfEngg('');
        } else if (newStatus === 'Pending with Costing') {
            setEdOfCosting('');
            setActualDateOfCosting('');
        } else if (newStatus === 'Sales to Quote' || newStatus === 'Pending with Sales') {
            setEdOfSales('');
            setActualDateOfSales('');
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!selectedSalesRep) {
            showToast('Please assign a Sales Representative.', 'warning');
            return;
        }

        setSubmitting(true);
        const payload = {
            ...selectedEnq,
            customer: parseInt(selectedCustomer) || selectedEnq.customer?.id,
            sbu: parseInt(selectedSbu) || selectedEnq.sbu?.id,
            division: parseInt(selectedDivision) || selectedEnq.division?.id,
            rfq_no: rfqNo || selectedEnq.rfq_no,
            rfq_date: rfqDate || selectedEnq.rfq_date,
            rfq_due_date: rfqDueDate || selectedEnq.rfq_due_date,
            rfq_type: selectedEnq.rfq_type?.id,
            fg_type: selectedEnq.fg_type?.id,
            fg_details: selectedEnq.fg_details || [],
            sales_rep: parseInt(selectedSalesRep),
            ed_of_engg: edOfEngg || null,
            actual_date_of_engg: actualDateOfEngg || null,
            engg_remarks: enggRemarks || '',
            ed_of_costing: edOfCosting || null,
            actual_date_of_costing: actualDateOfCosting || null,
            costing_remarks: costingRemarks || '',
            ed_of_sales: edOfSales || null,
            actual_date_of_sales: actualDateOfSales || null,
            sales_remarks: salesRemarks || '',
            quote_date: quoteDate || null,
            quote_value: quoteValue || null,
            open_l1_value: openL1Value || null,
            open_l1_date: openL1Date || null,
            lost_value: lostValue || null,
            po_no: poNo || '',
            po_receipt_date: poReceiptDate || null,
            po_value: poValue || null,
            status: status
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
                    <h1 className="page-title h3 font-weight-bold mb-1">Pending with Sales</h1>
                    <p className="page-subtitle text-muted mb-0">Manage project enquiries in Pending with Sales stage</p>
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
                    { label: 'RFQ No' },
                    { label: 'RFQ Due Date' },
                    { label: 'RFQ Due Time' },
                    { label: 'ED Of Engg' },
                    { label: 'ED Of Costing' },
                    { label: 'ED Of Sales' },
                    { label: 'RFQ Type' },
                    { label: 'Action', className: 'text-center pe-4' }
                ]}
                data={enquiries}
                loading={loading}
                emptyMessage="No enquiries in Pending with Sales stage."
                renderRow={(enq, idx) => (
                    <tr key={enq.id} className="modern-table-row">
                        <td className="ps-4 py-3 align-middle text-secondary font-weight-medium">
                            <span className="badge bg-light text-secondary rounded-circle p-2" style={{ width: '26px', height: '26px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                {idx + 1}
                            </span>
                        </td>
                        <td className="py-3 align-middle font-weight-bold text-dark">{enq.project_number}</td>
                        <td className="py-3 align-middle font-weight-medium text-dark">{enq.rfq_no}</td>
                        <td className="py-3 align-middle text-muted">{enq.rfq_due_date || 'N/A'}</td>
                        <td className="py-3 align-middle text-muted">{enq.rfq_due_time?.substring(0, 5) || 'N/A'}</td>
                        <td className="py-3 align-middle text-muted">{enq.ed_of_engg || 'N/A'}</td>
                        <td className="py-3 align-middle text-muted">{enq.ed_of_costing || 'N/A'}</td>
                        <td className="py-3 align-middle text-muted">{enq.ed_of_sales || 'N/A'}</td>
                        <td className="py-3 align-middle text-dark font-weight-medium">{enq.rfq_type?.name || 'N/A'}</td>
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
                                            {canEdit && !viewOnly ? "Edit Pending Sales Details" : "Pending Sales Summary"}
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
                                        <label className="form-label font-weight-semibold">Customer Name</label>
                                        <select
                                            className="form-select"
                                            value={selectedCustomer}
                                            onChange={(e) => setSelectedCustomer(e.target.value)}
                                            disabled={!canEdit || viewOnly}
                                        >
                                            <option value="">Select Customer</option>
                                            {customers.map((c) => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label font-weight-semibold">SBU</label>
                                        <select
                                            className="form-select"
                                            value={selectedSbu}
                                            onChange={(e) => setSelectedSbu(e.target.value)}
                                            disabled={!canEdit || viewOnly}
                                        >
                                            <option value="">Select SBU</option>
                                            {sbus.map((s) => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label font-weight-semibold">Division</label>
                                        <select
                                            className="form-select"
                                            value={selectedDivision}
                                            onChange={(e) => setSelectedDivision(e.target.value)}
                                            disabled={!canEdit || viewOnly}
                                        >
                                            <option value="">Select Division</option>
                                            {divisions.map((d) => (
                                                <option key={d.id} value={d.id}>{d.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="row g-3 mb-4">
                                    <div className="col-md-4">
                                        <label className="form-label font-weight-semibold">RFQ No</label>
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            value={rfqNo} 
                                            onChange={(e) => setRfqNo(e.target.value)} 
                                            disabled={!canEdit || viewOnly} 
                                        />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label font-weight-semibold">RFQ Date</label>
                                        <input 
                                            type="date" 
                                            className="form-control" 
                                            value={rfqDate} 
                                            onChange={(e) => setRfqDate(e.target.value)} 
                                            disabled={!canEdit || viewOnly} 
                                        />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label font-weight-semibold">RFQ Due Date</label>
                                        <input 
                                            type="date" 
                                            className="form-control" 
                                            value={rfqDueDate} 
                                            onChange={(e) => setRfqDueDate(e.target.value)} 
                                            disabled={!canEdit || viewOnly} 
                                        />
                                    </div>
                                </div>

                                {/* Engineering Estimation */}
                                <h6 className="font-weight-bold text-primary mb-3 pb-2 border-bottom">Engineering Estimation</h6>
                                <div className="row g-3 mb-4">
                                    <div className="col-md-6">
                                        <label className="form-label font-weight-semibold">Expected Date of Engg</label>
                                        <input type="date" className="form-control" value={edOfEngg} onChange={(e) => setEdOfEngg(e.target.value)} disabled={!canEdit || viewOnly} />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label font-weight-semibold">Actual Date of Engg</label>
                                        <input type="date" className="form-control" value={actualDateOfEngg} onChange={(e) => setActualDateOfEngg(e.target.value)} disabled={!canEdit || viewOnly} />
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label font-weight-semibold">Engineering Remarks</label>
                                        <textarea className="form-control" rows="2" value={enggRemarks} onChange={(e) => setEnggRemarks(e.target.value)} disabled={!canEdit || viewOnly} />
                                    </div>
                                </div>

                                {/* Costing Estimation */}
                                <h6 className="font-weight-bold text-primary mb-3 pb-2 border-bottom">Costing Estimation</h6>
                                <div className="row g-3 mb-4">
                                    <div className="col-md-6">
                                        <label className="form-label font-weight-semibold">Expected Date of Costing</label>
                                        <input type="date" className="form-control" value={edOfCosting} onChange={(e) => setEdOfCosting(e.target.value)} disabled={!canEdit || viewOnly} />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label font-weight-semibold">Actual Date of Costing</label>
                                        <input type="date" className="form-control" value={actualDateOfCosting} onChange={(e) => setActualDateOfCosting(e.target.value)} disabled={!canEdit || viewOnly} />
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label font-weight-semibold">Costing Remarks</label>
                                        <textarea className="form-control" rows="2" value={costingRemarks} onChange={(e) => setCostingRemarks(e.target.value)} disabled={!canEdit || viewOnly} />
                                    </div>
                                </div>

                                {/* Sales Fields */}
                                <h6 className="font-weight-bold text-primary mb-3 pb-2 border-bottom">Sales Estimation & Action</h6>
                                <div className="row g-3 mb-4">
                                    {/* Expected Date of Sales */}
                                    <div className="col-md-6">
                                        <label className="form-label font-weight-semibold">Expected Date of Sales</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            value={edOfSales}
                                            onChange={(e) => setEdOfSales(e.target.value)}
                                            disabled={!canEdit || viewOnly}
                                        />
                                    </div>
                                    {/* Actual Date of Sales */}
                                    <div className="col-md-6">
                                        <label className="form-label font-weight-semibold">Actual Date of Sales</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            value={actualDateOfSales}
                                            onChange={(e) => setActualDateOfSales(e.target.value)}
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
                                            onChange={handleStatusChange}
                                            disabled={!canEdit || viewOnly}
                                        >
                                            <option value="Pending with Engg">Pending with Engg</option>
                                            <option value="Pending with Costing">Pending with Costing</option>
                                            <option value="Pending with Sales">Pending with Sales</option>
                                            <option value="Quote Submitted">Quote Submitted</option>
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

export default PendingSales;
