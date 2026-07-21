/* eslint-disable no-unused-vars, react-hooks/exhaustive-deps, react-hooks/rules-of-hooks */
import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { enquiryService } from '../../services/enquiryService';
import { userService } from '../../services/userService';
import { masterDataService } from '../../services/masterDataService';
import DocumentsTab from './DocumentsTab';
import AuditHistoryTab from './AuditHistoryTab';
import ActivityFeedTab from './ActivityFeedTab';

const EditSalesModal = ({ enq, show, onClose, onSuccess, onRefresh, canEdit, viewOnly }) => {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState('details');
    
    // File Upload States
    const [rfqFile, setRfqFile] = useState(null);
    const [poFile, setPoFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    
    // Master Data States
    const [salesReps, setSalesReps] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [sbus, setSbus] = useState([]);
    const [divisions, setDivisions] = useState([]);

    // Core Project Info States
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [selectedSbu, setSelectedSbu] = useState('');
    const [selectedDivision, setSelectedDivision] = useState('');
    const [rfqNo, setRfqNo] = useState('');
    const [rfqDate, setRfqDate] = useState('');
    const [rfqDueDate, setRfqDueDate] = useState('');

    // Engineering & Costing States
    const [edOfEngg, setEdOfEngg] = useState('');
    const [actualDateOfEngg, setActualDateOfEngg] = useState('');
    const [enggRemarks, setEnggRemarks] = useState('');
    const [edOfCosting, setEdOfCosting] = useState('');
    const [actualDateOfCosting, setActualDateOfCosting] = useState('');
    const [costingRemarks, setCostingRemarks] = useState('');

    // Sales States
    const [salesRemarks, setSalesRemarks] = useState('');
    const [selectedSalesRep, setSelectedSalesRep] = useState('');
    const [status, setStatus] = useState(enq?.status || 'Sales to Quote');

    const [quoteDate, setQuoteDate] = useState('');
    const [quoteValue, setQuoteValue] = useState('');
    const [openL1Value, setOpenL1Value] = useState('');
    const [openL1Date, setOpenL1Date] = useState('');
    const [lostValue, setLostValue] = useState('');
    const [poNo, setPoNo] = useState('');
    const [poReceiptDate, setPoReceiptDate] = useState('');
    const [poValue, setPoValue] = useState('');
    const [clarificationToCs, setClarificationToCs] = useState('');
    const [clarificationFromCs, setClarificationFromCs] = useState('');
    const [remarks, setRemarks] = useState('');

    const [wasOpen, setWasOpen] = useState(false);

    useEffect(() => {
        if (enq && show) {
            if (!wasOpen) {
                setActiveTab('details');
                setRfqFile(null);
                setPoFile(null);
                setWasOpen(true);
            }
            
            // Core
            setSelectedCustomer(enq.customer?.id || '');
            setSelectedSbu(enq.sbu?.id || '');
            setSelectedDivision(enq.division?.id || '');
            setRfqNo(enq.rfq_no || '');
            setRfqDate(enq.rfq_date || '');
            setRfqDueDate(enq.rfq_due_date || '');

            // Engg & Costing
            setEdOfEngg(enq.ed_of_engg || '');
            setActualDateOfEngg(enq.actual_date_of_engg || '');
            setEnggRemarks(enq.engg_remarks || '');
            setEdOfCosting(enq.ed_of_costing || '');
            setActualDateOfCosting(enq.actual_date_of_costing || '');
            setCostingRemarks(enq.costing_remarks || '');

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
            setClarificationToCs(enq.clarification_to_cs || '');
            setClarificationFromCs(enq.clarification_from_cs || '');
            setRemarks(enq.remarks || '');

            fetchMasterData();
        } else if (!show) {
            setWasOpen(false);
        }
    }, [enq, show, wasOpen]);

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
            console.error(err);
        }
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
            ...enq,
            customer: parseInt(selectedCustomer) || enq.customer?.id,
            sbu: parseInt(selectedSbu) || enq.sbu?.id,
            division: parseInt(selectedDivision) || enq.division?.id,
            rfq_no: rfqNo || enq.rfq_no,
            rfq_date: rfqDate || enq.rfq_date,
            rfq_due_date: rfqDueDate || enq.rfq_due_date,
            rfq_type: enq.rfq_type?.id,
            fg_type: enq.fg_type?.id,
            fg_details: enq.fg_details || [],
            ed_of_engg: edOfEngg || null,
            actual_date_of_engg: actualDateOfEngg || null,
            engg_remarks: enggRemarks || '',
            ed_of_costing: edOfCosting || null,
            actual_date_of_costing: actualDateOfCosting || null,
            costing_remarks: costingRemarks || '',
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
            status: newStatus,
            clarification_to_cs: clarificationToCs || '',
            clarification_from_cs: clarificationFromCs || '',
            remarks: remarks || ''
        };

        try {
            // Step 1: Update JSON data
            await enquiryService.update(enq.id, payload);
            
            // Step 2: Upload Files if selected
            if (rfqFile || poFile) {
                const formData = new FormData();
                if (rfqFile) formData.append('rfq_document', rfqFile);
                if (poFile) formData.append('po_document', poFile);
                await enquiryService.patch(enq.id, formData);
            }

            showToast('Sales details saved successfully!', 'success');
            onSuccess();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to update sales details.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (!show || !enq) return null;

    return (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(4px)', zIndex: 1050 }}>
            <div className="modal-dialog modal-xl modal-dialog-centered">
                <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                    
                    {/* Header with signature Purple Admin gradient */}
                    <div className="enq-modal-header text-white d-flex align-items-center justify-content-between" style={{ 
                        background: 'linear-gradient(to right, #da8cff, #9a55ff)',
                        padding: '1.5rem 2rem'
                    }}>
                        <div className="d-flex align-items-center gap-3">
                            <div className="enq-modal-icon-wrap shadow-sm" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                                </svg>
                            </div>
                            <div>
                                <h5 className="modal-title font-weight-bold mb-0" style={{ letterSpacing: '0.5px' }}>
                                    {canEdit && !viewOnly ? "Edit Sales Details" : "Sales Details Summary"}
                                </h5>
                                <span className="small text-white-50" style={{ fontSize: '0.85rem' }}>{enq.project_number} — {enq.project_name}</span>
                            </div>
                        </div>
                        <button type="button" className="enq-modal-close-icon border-0" onClick={onClose} style={{ 
                            background: 'rgba(255, 255, 255, 0.2)', 
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff'
                        }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>
                    
                    {/* Tabs Navigation */}
                    <div className="bg-light border-bottom px-4 pt-3">
                        <ul className="nav nav-tabs border-0" style={{ gap: '6px' }}>
                            {['details', 'documents', 'history', 'activities'].map(tab => (
                                <li className="nav-item" key={tab}>
                                    <button 
                                        type="button" 
                                        className={`nav-link border-0 px-4 py-2 font-weight-bold ${activeTab === tab ? 'active bg-white text-dark shadow-sm' : 'text-muted'}`} 
                                        onClick={() => setActiveTab(tab)} 
                                        style={{ 
                                            borderRadius: '8px 8px 0 0',
                                            borderBottom: activeTab === tab ? '3px solid #9a55ff' : 'none',
                                            color: activeTab === tab ? '#9a55ff' : '#64748b'
                                        }}
                                    >
                                        {tab.charAt(0).toUpperCase() + tab.slice(1).replace('activities', 'activity feed').replace('history', 'audit history')}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <form onSubmit={handleSave} className="modal-body p-4" style={{ maxHeight: '75vh', overflowY: 'auto', backgroundColor: '#f8fafc' }}>
                        
                        <div style={{ display: activeTab === 'details' ? 'block' : 'none' }}>
                            
                            {/* Top Info Cards (2 Columns) */}
                            <div className="row g-3 mb-4">
                                <div className="col-md-6">
                                    <div className="enq-details-card bg-white border-0 shadow-sm" style={{ borderLeft: '4px solid #da8cff' }}>
                                        <label className="enq-details-label" style={{ color: '#9a55ff' }}>Customer Name</label>
                                        <select className="form-select border-0 shadow-none text-dark p-0 font-weight-bold" style={{ fontSize: '0.9rem', backgroundPosition: 'right center' }} value={selectedCustomer} onChange={(e) => setSelectedCustomer(e.target.value)} disabled={!canEdit || viewOnly}>
                                            <option value="">Select Customer</option>
                                            {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="enq-details-card bg-white border-0 shadow-sm" style={{ borderLeft: '4px solid #9a55ff' }}>
                                        <label className="enq-details-label" style={{ color: '#7f39fb' }}>SBU</label>
                                        <select className="form-select border-0 shadow-none text-dark p-0 font-weight-bold" style={{ fontSize: '0.9rem', backgroundPosition: 'right center' }} value={selectedSbu} onChange={(e) => setSelectedSbu(e.target.value)} disabled={!canEdit || viewOnly}>
                                            <option value="">Select SBU</option>
                                            {sbus.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Inline Badges */}
                            <div className="d-flex flex-wrap gap-4 mb-4 font-weight-semibold align-items-center" style={{ fontSize: '0.85rem' }}>
                                <div className="d-flex align-items-center gap-2">
                                    <span className="text-secondary">Division: </span>
                                    <select className="form-select form-select-sm bg-white text-dark shadow-sm border rounded-pill px-3 py-1" style={{ width: 'auto' }} value={selectedDivision} onChange={(e) => setSelectedDivision(e.target.value)} disabled={!canEdit || viewOnly}>
                                        <option value="">Select Division</option>
                                        {divisions.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <span className="text-secondary">RFQ Type: </span>
                                    <span className="badge bg-white text-dark shadow-sm border px-3 py-2 rounded-pill">{enq.rfq_type?.name || 'N/A'}</span>
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                    <span className="text-secondary">RFQ No: </span>
                                    <input type="text" className="form-control form-control-sm bg-white text-dark shadow-sm border rounded-pill px-3 py-1" style={{ width: '120px' }} value={rfqNo} onChange={(e) => setRfqNo(e.target.value)} disabled={!canEdit || viewOnly} />
                                </div>
                            </div>

                            {/* Time Blocks (3 Columns) */}
                            <div className="row g-3 mb-4">
                                <div className="col-md-4">
                                    <div className="enq-time-block shadow-sm border-0" style={{ background: 'linear-gradient(to right, #84d9d2, #07cdae)', color: '#fff', padding: '1.25rem' }}>
                                        <label className="enq-time-block-label" style={{ opacity: 0.85, display: 'block' }}>RFQ Date</label>
                                        <input type="date" className="form-control form-control-sm border-0 bg-transparent text-white p-0 font-weight-bold" style={{ fontSize: '1rem', colorScheme: 'dark' }} value={rfqDate} onChange={(e) => setRfqDate(e.target.value)} disabled={!canEdit || viewOnly} />
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="enq-time-block shadow-sm border-0" style={{ background: 'linear-gradient(to right, #ffbf96, #fe7096)', color: '#fff', padding: '1.25rem' }}>
                                        <label className="enq-time-block-label" style={{ opacity: 0.85, display: 'block' }}>RFQ Due Date</label>
                                        <input type="date" className="form-control form-control-sm border-0 bg-transparent text-white p-0 font-weight-bold" style={{ fontSize: '1rem', colorScheme: 'dark' }} value={rfqDueDate} onChange={(e) => setRfqDueDate(e.target.value)} disabled={!canEdit || viewOnly} />
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="enq-time-block shadow-sm border-0" style={{ background: 'linear-gradient(to right, #90caf9, #047edf)', color: '#fff', padding: '1.25rem' }}>
                                        <div className="enq-time-block-label" style={{ opacity: 0.85 }}>RFQ Aging</div>
                                        <div className="enq-time-block-value">
                                            {enq.rfq_aging} Days
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Clarifications */}
                            <div className="row g-3 mb-4">
                                <div className="col-md-6">
                                    <div className="enq-details-card bg-white border-0 shadow-sm">
                                        <label className="enq-details-label form-label font-weight-semibold text-secondary small uppercase" style={{ color: '#e056fd', letterSpacing: '0.5px', marginBottom: '8px', display: 'block' }}>Clarification To CS</label>
                                        {!viewOnly ? (
                                            <textarea
                                                className="form-control border shadow-sm"
                                                style={{ borderRadius: '10px', fontSize: '0.9rem', padding: '0.75rem' }}
                                                rows="3"
                                                value={clarificationToCs}
                                                onChange={(e) => setClarificationToCs(e.target.value)}
                                                placeholder="Enter clarification to CS..."
                                            />
                                        ) : (
                                            <div className="enq-details-value text-wrap text-secondary" style={{ fontSize: '0.9rem', fontWeight: 'normal' }}>
                                                {enq.clarification_to_cs || 'No clarification requested.'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="enq-details-card bg-white border-0 shadow-sm">
                                        <label className="enq-details-label form-label font-weight-semibold text-secondary small uppercase" style={{ color: '#e056fd', letterSpacing: '0.5px', marginBottom: '8px', display: 'block' }}>Clarification From CS</label>
                                        {!viewOnly ? (
                                            <textarea
                                                className="form-control border shadow-sm"
                                                style={{ borderRadius: '10px', fontSize: '0.9rem', padding: '0.75rem' }}
                                                rows="3"
                                                value={clarificationFromCs}
                                                onChange={(e) => setClarificationFromCs(e.target.value)}
                                                placeholder="Enter clarification from CS..."
                                            />
                                        ) : (
                                            <div className="enq-details-value text-wrap text-secondary" style={{ fontSize: '0.9rem', fontWeight: 'normal' }}>
                                                {enq.clarification_from_cs || 'No response received.'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Remarks */}
                            <div className="mb-4">
                                <label className="enq-details-label form-label font-weight-semibold text-secondary small uppercase" style={{ color: '#64748b', letterSpacing: '0.5px', marginBottom: '8px', display: 'block' }}>Remarks / Description</label>
                                {!viewOnly ? (
                                    <textarea
                                        className="form-control border shadow-sm"
                                        style={{ borderRadius: '10px', fontSize: '0.9rem', padding: '0.75rem' }}
                                        rows="3"
                                        value={remarks}
                                        onChange={(e) => setRemarks(e.target.value)}
                                        placeholder="Enter remarks/description..."
                                    />
                                ) : (
                                    <div className="enq-remarks-box bg-white border-0 shadow-sm rounded-lg" style={{ minHeight: '80px', color: '#475569', padding: '16px 20px' }}>
                                        {enq.remarks || 'No remarks provided.'}
                                    </div>
                                )}
                            </div>

                            {/* Settings & Status */}
                            <h6 className="font-weight-bold mb-3 pb-2 border-bottom" style={{ color: '#9a55ff', fontSize: '0.95rem' }}>Pipeline Settings</h6>
                            <div className="row g-3 mb-4">
                                <div className="col-md-6">
                                    <label className="form-label font-weight-semibold text-secondary small uppercase" style={{ letterSpacing: '0.5px' }}>Sales Representative <span className="text-danger">*</span></label>
                                    <select className="form-select border-0 shadow-sm" style={{ padding: '0.75rem 1rem', borderRadius: '10px' }} value={selectedSalesRep} onChange={(e) => setSelectedSalesRep(e.target.value)} disabled={!canEdit || viewOnly} required>
                                        <option value="">Select Sales Rep</option>
                                        {salesReps.map(rep => (
                                            <option key={rep.id} value={rep.id}>{rep.name || rep.username}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label font-weight-semibold text-secondary small uppercase" style={{ letterSpacing: '0.5px' }}>Status</label>
                                    <select className="form-select border-0 shadow-sm" style={{ padding: '0.75rem 1rem', borderRadius: '10px', fontWeight: 'bold', color: '#9a55ff' }} value={status} onChange={(e) => setStatus(e.target.value)} disabled={!canEdit || viewOnly}>
                                        {enq?.status === 'Pending with Sales' || enq?.status === 'Quote Submitted' ? (
                                            <>
                                                <option value="Pending with Sales">Pending with Sales</option>
                                                <option value="Quote Submitted">Quote Submitted</option>
                                                <option value="Pending with Costing">Pending with Costing</option>
                                                <option value="Pending with Engg">Pending with Engg</option>
                                            </>
                                        ) : (
                                            <>
                                                <option value="Sales to Quote">Sales to Quote</option>
                                                <option value="On Hold">On Hold</option>
                                                <option value="Regretted">Regretted</option>
                                                <option value="Open - L1">Open - L1</option>
                                                <option value="Won">Won</option>
                                                <option value="Lost">Lost</option>
                                                <option value="Quote Regretted">Quote Regretted</option>
                                            </>
                                        )}
                                    </select>
                                </div>
                            </div>

                            {/* Engineering Estimation Details */}
                            <h6 className="font-weight-bold mb-3 pb-2 border-bottom" style={{ color: '#9a55ff', fontSize: '0.95rem' }}>Engineering Estimation Details</h6>
                            <div className="row g-3 mb-4">
                                <div className="col-md-6">
                                    <div className="enq-details-card bg-white border-0 shadow-sm">
                                        <label className="enq-details-label">Expected Date of Engineering</label>
                                        <input type="date" className="form-control border-0 bg-transparent text-secondary p-0 font-weight-bold shadow-none" style={{ fontSize: '0.9rem' }} value={edOfEngg} onChange={(e) => setEdOfEngg(e.target.value)} disabled={!canEdit || viewOnly} />
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="enq-details-card bg-white border-0 shadow-sm">
                                        <label className="enq-details-label">Actual Date of Engineering</label>
                                        <input type="date" className="form-control border-0 bg-transparent text-secondary p-0 font-weight-bold shadow-none" style={{ fontSize: '0.9rem' }} value={actualDateOfEngg} onChange={(e) => setActualDateOfEngg(e.target.value)} disabled={!canEdit || viewOnly} />
                                    </div>
                                </div>
                            </div>
                            <div className="mb-4">
                                <label className="form-label font-weight-semibold text-secondary small uppercase" style={{ letterSpacing: '0.5px' }}>Engineering Remarks</label>
                                <textarea className="form-control border-0 shadow-sm" style={{ borderRadius: '12px', padding: '1rem' }} rows="2" placeholder="Add engineering remarks" value={enggRemarks} onChange={(e) => setEnggRemarks(e.target.value)} disabled={!canEdit || viewOnly} />
                            </div>

                            {/* Costing Estimation Details */}
                            <h6 className="font-weight-bold mb-3 pb-2 border-bottom" style={{ color: '#9a55ff', fontSize: '0.95rem' }}>Costing Estimation Details</h6>
                            <div className="row g-3 mb-4">
                                <div className="col-md-6">
                                    <div className="enq-details-card bg-white border-0 shadow-sm">
                                        <label className="enq-details-label">Expected Date of Costing</label>
                                        <input type="date" className="form-control border-0 bg-transparent text-secondary p-0 font-weight-bold shadow-none" style={{ fontSize: '0.9rem' }} value={edOfCosting} onChange={(e) => setEdOfCosting(e.target.value)} disabled={!canEdit || viewOnly} />
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="enq-details-card bg-white border-0 shadow-sm">
                                        <label className="enq-details-label">Actual Date of Costing</label>
                                        <input type="date" className="form-control border-0 bg-transparent text-secondary p-0 font-weight-bold shadow-none" style={{ fontSize: '0.9rem' }} value={actualDateOfCosting} onChange={(e) => setActualDateOfCosting(e.target.value)} disabled={!canEdit || viewOnly} />
                                    </div>
                                </div>
                            </div>
                            <div className="mb-4">
                                <label className="form-label font-weight-semibold text-secondary small uppercase" style={{ letterSpacing: '0.5px' }}>Costing Remarks</label>
                                <textarea className="form-control border-0 shadow-sm" style={{ borderRadius: '12px', padding: '1rem' }} rows="2" placeholder="Add costing remarks" value={costingRemarks} onChange={(e) => setCostingRemarks(e.target.value)} disabled={!canEdit || viewOnly} />
                            </div>

                            {/* Sales Estimation & Action */}
                            <h6 className="font-weight-bold mb-3 pb-2 border-bottom" style={{ color: '#9a55ff', fontSize: '0.95rem' }}>Sales Estimation & Action</h6>
                            <div className="mb-4">
                                <label className="form-label font-weight-semibold text-secondary small uppercase" style={{ letterSpacing: '0.5px' }}>Sales Team Remarks</label>
                                <textarea className="form-control border-0 shadow-sm" style={{ borderRadius: '12px', padding: '1rem' }} rows="2" placeholder="Add sales remarks" value={salesRemarks} onChange={(e) => setSalesRemarks(e.target.value)} disabled={!canEdit || viewOnly} />
                            </div>

                            {/* Quote & PO Tracking */}
                            <h6 className="font-weight-bold mb-3 pb-2 border-bottom" style={{ color: '#9a55ff', fontSize: '0.95rem' }}>Quote & PO Tracking</h6>
                            <div className="row g-3 mb-4">
                                <div className="col-md-3">
                                    <div className="enq-details-card bg-white border-0 shadow-sm">
                                        <label className="enq-details-label">Quote Date</label>
                                        <input type="date" className="form-control border-0 bg-transparent text-secondary p-0 font-weight-bold shadow-none" style={{ fontSize: '0.9rem' }} value={quoteDate} onChange={(e) => setQuoteDate(e.target.value)} disabled={!canEdit || viewOnly} />
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="enq-details-card bg-white border-0 shadow-sm">
                                        <label className="enq-details-label">Quote Value ($)</label>
                                        <input type="number" className="form-control border-0 bg-transparent text-secondary p-0 font-weight-bold shadow-none" style={{ fontSize: '0.9rem' }} value={quoteValue} onChange={(e) => setQuoteValue(e.target.value)} disabled={!canEdit || viewOnly} />
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="enq-details-card bg-white border-0 shadow-sm">
                                        <label className="enq-details-label">Open-L1 Value ($)</label>
                                        <input type="number" className="form-control border-0 bg-transparent text-secondary p-0 font-weight-bold shadow-none" style={{ fontSize: '0.9rem' }} value={openL1Value} onChange={(e) => setOpenL1Value(e.target.value)} disabled={!canEdit || viewOnly} />
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="enq-details-card bg-white border-0 shadow-sm">
                                        <label className="enq-details-label">Open-L1 Date</label>
                                        <input type="date" className="form-control border-0 bg-transparent text-secondary p-0 font-weight-bold shadow-none" style={{ fontSize: '0.9rem' }} value={openL1Date} onChange={(e) => setOpenL1Date(e.target.value)} disabled={!canEdit || viewOnly} />
                                    </div>
                                </div>
                            </div>
                            <div className="row g-3 mb-4">
                                <div className="col-md-3">
                                    <div className="enq-details-card bg-white border-0 shadow-sm">
                                        <label className="enq-details-label">Lost Value ($)</label>
                                        <input type="number" className="form-control border-0 bg-transparent text-secondary p-0 font-weight-bold shadow-none" style={{ fontSize: '0.9rem' }} value={lostValue} onChange={(e) => setLostValue(e.target.value)} disabled={!canEdit || viewOnly} />
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="enq-details-card bg-white border-0 shadow-sm">
                                        <label className="enq-details-label">PO No</label>
                                        <input type="text" className="form-control border-0 bg-transparent text-secondary p-0 font-weight-bold shadow-none" style={{ fontSize: '0.9rem' }} value={poNo} onChange={(e) => setPoNo(e.target.value)} disabled={!canEdit || viewOnly} />
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="enq-details-card bg-white border-0 shadow-sm">
                                        <label className="enq-details-label">PO Receipt Date</label>
                                        <input type="date" className="form-control border-0 bg-transparent text-secondary p-0 font-weight-bold shadow-none" style={{ fontSize: '0.9rem' }} value={poReceiptDate} onChange={(e) => setPoReceiptDate(e.target.value)} disabled={!canEdit || viewOnly} />
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="enq-details-card bg-white border-0 shadow-sm">
                                        <label className="enq-details-label">PO Value ($)</label>
                                        <input type="number" className="form-control border-0 bg-transparent text-secondary p-0 font-weight-bold shadow-none" style={{ fontSize: '0.9rem' }} value={poValue} onChange={(e) => setPoValue(e.target.value)} disabled={!canEdit || viewOnly} />
                                    </div>
                                </div>
                            </div>

                            {/* Finished Goods Details (READ ONLY) */}
                            <div className="mb-4">
                                <div className="enq-details-label">Finished Goods (FG) Details</div>
                                <div className="table-responsive bg-white rounded-lg shadow-sm border-0">
                                    <table className="table table-hover mb-0">
                                        <thead style={{ backgroundColor: 'rgba(154, 85, 255, 0.05)' }}>
                                            <tr>
                                                <th className="ps-3 text-secondary py-2 border-0" style={{ fontSize: '0.75rem' }}>FG Part No</th>
                                                <th className="text-secondary py-2 border-0" style={{ fontSize: '0.75rem' }}>Description</th>
                                                <th className="text-secondary pe-3 text-end py-2 border-0" style={{ fontSize: '0.75rem' }}>Quantity</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {enq.fg_details?.length === 0 ? (
                                                <tr>
                                                    <td colSpan="3" className="text-center p-3 text-muted">No FG details associated.</td>
                                                </tr>
                                            ) : (
                                                enq.fg_details?.map((detail, idx) => (
                                                    <tr key={detail.id || idx}>
                                                        <td className="ps-3 font-weight-semibold text-dark py-2 border-0" style={{ fontSize: '0.85rem' }}>{detail.fg_part_no}</td>
                                                        <td className="text-muted py-2 border-0" style={{ fontSize: '0.85rem' }}>{detail.description || 'N/A'}</td>
                                                        <td className="pe-3 text-end font-weight-bold py-2 border-0" style={{ fontSize: '0.85rem' }}>{detail.qty}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {activeTab === 'documents' && (
                            <DocumentsTab 
                                enq={enq} 
                                currentStatus={status}
                                canEdit={canEdit && !viewOnly} 
                                rfqFile={rfqFile} 
                                setRfqFile={setRfqFile} 
                                poFile={poFile} 
                                setPoFile={setPoFile} 
                            />
                        )}

                        {activeTab === 'history' && (
                            <AuditHistoryTab auditLogs={enq.audit_logs} />
                        )}

                        {activeTab === 'activities' && (
                            <ActivityFeedTab enq={enq} onSuccess={onRefresh} />
                        )}

                        <div className="d-flex gap-2 justify-content-end mt-4 pt-3 border-top">
                            <button type="button" className="btn btn-secondary px-4" onClick={onClose}>Close</button>
                            {canEdit && !viewOnly && (
                                <button type="submit" className="btn btn-gradient-primary border-0 shadow px-4" disabled={submitting}>
                                    {submitting ? 'Saving...' : 'Save Changes'}
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditSalesModal;
