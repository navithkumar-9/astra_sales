import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { enquiryService } from '../../services/enquiryService';
import { userService } from '../../services/userService';
import DocumentsTab from './DocumentsTab';
import AuditHistoryTab from './AuditHistoryTab';
import ActivityFeedTab from './ActivityFeedTab';

const EditSalesModal = ({ enq, show, onClose, onSuccess, canEdit, viewOnly }) => {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState('details');
    
    // File Upload States
    const [rfqFile, setRfqFile] = useState(null);
    const [poFile, setPoFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [salesReps, setSalesReps] = useState([]);

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

    useEffect(() => {
        if (enq && show) {
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
            
            setActiveTab('details');
            setRfqFile(null);
            setPoFile(null);

            fetchSalesReps();
        }
    }, [enq, show]);

    const fetchSalesReps = async () => {
        try {
            const list = await userService.getSalesReps();
            setSalesReps(list.results || list || []);
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
        // If they enter quote values and it's currently Sales to Quote, auto transition
        if (quoteDate && quoteValue && status === 'Sales to Quote') {
            newStatus = 'Pending with Sales';
        }

        const payload = {
            ...enq,
            customer: enq.customer?.id,
            sbu: enq.sbu?.id,
            division: enq.division?.id,
            rfq_type: enq.rfq_type?.id,
            fg_type: enq.fg_type?.id,
            fg_details: enq.fg_details || [],
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
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 1050 }}>
            <div className="modal-dialog modal-xl modal-dialog-centered">
                <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                    <div className="enq-modal-header text-white d-flex align-items-center justify-content-between" style={{ background: 'linear-gradient(135deg, #a561ff, #7f39fb)', padding: '1rem' }}>
                        <div className="d-flex align-items-center gap-3">
                            <div>
                                <h5 className="modal-title font-weight-bold mb-0">
                                    {canEdit && !viewOnly ? "Edit Sales Details" : "Sales Details Summary"}
                                </h5>
                                <span className="small text-white-50">{enq.project_number} - {enq.project_name}</span>
                            </div>
                        </div>
                        <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
                    </div>
                    
                    {/* Tabs Navigation */}
                    <div className="bg-light border-bottom px-4 pt-3">
                        <ul className="nav nav-tabs border-0" style={{ gap: '10px' }}>
                            <li className="nav-item">
                                <button type="button" className={`nav-link border-0 ${activeTab === 'details' ? 'active bg-white text-primary font-weight-bold shadow-sm rounded-top' : 'text-muted'}`} onClick={() => setActiveTab('details')} style={{ padding: '0.75rem 1.25rem' }}>
                                    Details
                                </button>
                            </li>
                            <li className="nav-item">
                                <button type="button" className={`nav-link border-0 ${activeTab === 'documents' ? 'active bg-white text-primary font-weight-bold shadow-sm rounded-top' : 'text-muted'}`} onClick={() => setActiveTab('documents')} style={{ padding: '0.75rem 1.25rem' }}>
                                    Documents
                                </button>
                            </li>
                            <li className="nav-item">
                                <button type="button" className={`nav-link border-0 ${activeTab === 'history' ? 'active bg-white text-primary font-weight-bold shadow-sm rounded-top' : 'text-muted'}`} onClick={() => setActiveTab('history')} style={{ padding: '0.75rem 1.25rem' }}>
                                    Audit History
                                </button>
                            </li>
                            <li className="nav-item">
                                <button type="button" className={`nav-link border-0 ${activeTab === 'activities' ? 'active bg-white text-primary font-weight-bold shadow-sm rounded-top' : 'text-muted'}`} onClick={() => setActiveTab('activities')} style={{ padding: '0.75rem 1.25rem' }}>
                                    Activity Feed
                                </button>
                            </li>
                        </ul>
                    </div>

                    <form onSubmit={handleSave} className="modal-body p-4" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
                        
                        <div style={{ display: activeTab === 'details' ? 'block' : 'none' }}>
                            <h6 className="font-weight-bold text-primary mb-3 pb-2 border-bottom">Project Information</h6>
                        <div className="row g-3 mb-4">
                            <div className="col-md-2">
                                <div className="enq-details-label text-muted small">Customer Name</div>
                                <div className="enq-details-value font-weight-semibold">{enq.customer?.name || 'N/A'}</div>
                            </div>
                            <div className="col-md-2">
                                <div className="enq-details-label text-muted small">SBU</div>
                                <div className="enq-details-value font-weight-semibold">{enq.sbu?.name || 'N/A'}</div>
                            </div>
                            <div className="col-md-2">
                                <div className="enq-details-label text-muted small">Division</div>
                                <div className="enq-details-value font-weight-semibold">{enq.division?.name || 'N/A'}</div>
                            </div>
                            <div className="col-md-2">
                                <div className="enq-details-label text-muted small">RFQ No</div>
                                <div className="enq-details-value font-weight-semibold">{enq.rfq_no}</div>
                            </div>
                            <div className="col-md-2">
                                <div className="enq-details-label text-muted small">RFQ Date</div>
                                <div className="enq-details-value font-weight-semibold">{enq.rfq_date}</div>
                            </div>
                            <div className="col-md-2">
                                <div className="enq-details-label text-muted small">RFQ Due Date</div>
                                <div className="enq-details-value font-weight-semibold">{enq.rfq_due_date}</div>
                            </div>
                        </div>

                        <h6 className="font-weight-bold text-primary mb-3 pb-2 border-bottom">Sales Estimation & Action</h6>
                        <div className="row g-3 mb-4">
                            <div className="col-md-6">
                                <label className="form-label font-weight-semibold">Sales Representative <span className="text-danger">*</span></label>
                                <select className="form-select" value={selectedSalesRep} onChange={(e) => setSelectedSalesRep(e.target.value)} disabled={!canEdit || viewOnly} required>
                                    <option value="">Select Sales Rep</option>
                                    {salesReps.map(rep => (
                                        <option key={rep.id} value={rep.id}>{rep.name || rep.username}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-6">
                                <label className="form-label font-weight-semibold">Status</label>
                                <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)} disabled={!canEdit || viewOnly}>
                                    <option value="Pending with Engg">Pending with Engg</option>
                                    <option value="Pending with Costing">Pending with Costing</option>
                                    <option value="Pending with Sales">Pending with Sales</option>
                                    <option value="Sales to Quote">Sales to Quote</option>
                                    <option value="Quote Submitted">Quote Submitted</option>
                                </select>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="form-label font-weight-semibold">Sales Team Remarks</label>
                            <textarea className="form-control" rows="2" placeholder="Add sales remarks / notes" value={salesRemarks} onChange={(e) => setSalesRemarks(e.target.value)} disabled={!canEdit || viewOnly} />
                        </div>

                        <h6 className="font-weight-bold text-primary mb-3 pb-2 border-bottom">Quote & PO Tracking</h6>
                        <div className="row g-3 mb-4">
                            <div className="col-md-3">
                                <label className="form-label font-weight-semibold">Quote Date</label>
                                <input type="date" className="form-control" value={quoteDate} onChange={(e) => setQuoteDate(e.target.value)} disabled={!canEdit || viewOnly} />
                            </div>
                            <div className="col-md-3">
                                <label className="form-label font-weight-semibold">Quote Value</label>
                                <input type="number" className="form-control" value={quoteValue} onChange={(e) => setQuoteValue(e.target.value)} disabled={!canEdit || viewOnly} />
                            </div>
                            <div className="col-md-3">
                                <label className="form-label font-weight-semibold">Open-L1 Value</label>
                                <input type="number" className="form-control" value={openL1Value} onChange={(e) => setOpenL1Value(e.target.value)} disabled={!canEdit || viewOnly} />
                            </div>
                            <div className="col-md-3">
                                <label className="form-label font-weight-semibold">Open-L1 Date</label>
                                <input type="date" className="form-control" value={openL1Date} onChange={(e) => setOpenL1Date(e.target.value)} disabled={!canEdit || viewOnly} />
                            </div>
                            <div className="col-md-3">
                                <label className="form-label font-weight-semibold">Lost Value</label>
                                <input type="number" className="form-control" value={lostValue} onChange={(e) => setLostValue(e.target.value)} disabled={!canEdit || viewOnly} />
                            </div>
                            <div className="col-md-3">
                                <label className="form-label font-weight-semibold">PO No</label>
                                <input type="text" className="form-control" value={poNo} onChange={(e) => setPoNo(e.target.value)} disabled={!canEdit || viewOnly} />
                            </div>
                            <div className="col-md-3">
                                <label className="form-label font-weight-semibold">PO Receipt Date</label>
                                <input type="date" className="form-control" value={poReceiptDate} onChange={(e) => setPoReceiptDate(e.target.value)} disabled={!canEdit || viewOnly} />
                            </div>
                                <div className="col-md-3">
                                    <label className="form-label font-weight-semibold">PO Value</label>
                                    <input type="number" className="form-control" value={poValue} onChange={(e) => setPoValue(e.target.value)} disabled={!canEdit || viewOnly} />
                                </div>
                            </div>
                        </div>

                        {activeTab === 'documents' && (
                            <DocumentsTab 
                                enq={enq} 
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
                            <ActivityFeedTab enq={enq} onSuccess={onSuccess} />
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
