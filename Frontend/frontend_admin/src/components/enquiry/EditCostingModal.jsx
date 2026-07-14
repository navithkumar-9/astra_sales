import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { enquiryService } from '../../services/enquiryService';
import { userService } from '../../services/userService';
import DocumentsTab from './DocumentsTab';
import AuditHistoryTab from './AuditHistoryTab';
import ActivityFeedTab from './ActivityFeedTab';

const EditCostingModal = ({ enq, show, onClose, onSuccess, onRefresh, canEdit, viewOnly }) => {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState('details');
    
    // File Upload States
    const [rfqFile, setRfqFile] = useState(null);
    const [poFile, setPoFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [salesReps, setSalesReps] = useState([]);

    const [edOfCosting, setEdOfCosting] = useState('');
    const [actualDateOfCosting, setActualDateOfCosting] = useState('');
    const [costingRemarks, setCostingRemarks] = useState('');
    const [selectedSalesRep, setSelectedSalesRep] = useState('');
    const [status, setStatus] = useState('Pending with Costing');

    const [wasOpen, setWasOpen] = useState(false);

    useEffect(() => {
        if (enq && show) {
            if (!wasOpen) {
                setActiveTab('details');
                setRfqFile(null);
                setPoFile(null);
                setWasOpen(true);
            }
            setEdOfCosting(enq.ed_of_costing || '');
            setActualDateOfCosting(enq.actual_date_of_costing || '');
            setCostingRemarks(enq.costing_remarks || '');
            setSelectedSalesRep(enq.sales_rep?.id || '');
            setStatus(enq.status || 'Pending with Costing');
            fetchSalesReps();
        } else if (!show) {
            setWasOpen(false);
        }
    }, [enq, show, wasOpen]);

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
        let targetStatus = status;
        if (edOfCosting && actualDateOfCosting) {
            targetStatus = 'Sales to Quote';
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
            ed_of_costing: edOfCosting || null,
            actual_date_of_costing: actualDateOfCosting || null,
            costing_remarks: costingRemarks || '',
            status: targetStatus
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

            showToast('Costing details saved successfully!', 'success');
            onSuccess();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to update costing details.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (!show || !enq) return null;

    return (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(4px)', zIndex: 1050 }}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                    
                    {/* Header with signature Purple Admin gradient */}
                    <div className="enq-modal-header text-white d-flex align-items-center justify-content-between" style={{ 
                        background: 'linear-gradient(to right, #da8cff, #9a55ff)',
                        padding: '1.5rem 2rem'
                    }}>
                        <div className="d-flex align-items-center gap-3">
                            <div className="enq-modal-icon-wrap shadow-sm" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M20 7h-7L10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
                                </svg>
                            </div>
                            <div>
                                <h5 className="modal-title font-weight-bold mb-0" style={{ letterSpacing: '0.5px' }}>
                                    {canEdit && !viewOnly ? "Edit Costing Details" : "Costing Details Summary"}
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

                    <form onSubmit={handleSave} className="modal-body p-4" style={{ maxHeight: '65vh', overflowY: 'auto', backgroundColor: '#f8fafc' }}>
                        
                        <div style={{ display: activeTab === 'details' ? 'block' : 'none' }}>
                            <h6 className="font-weight-bold mb-3 pb-2 border-bottom" style={{ color: '#9a55ff', fontSize: '0.95rem' }}>Project Information</h6>
                            <div className="row g-3 mb-4">
                                <div className="col-md-4">
                                    <div className="enq-details-card bg-white border-0 shadow-sm" style={{ borderLeft: '4px solid #da8cff', padding: '12px 16px' }}>
                                        <div className="enq-details-label" style={{ color: '#9a55ff', fontSize: '0.65rem' }}>Customer Name</div>
                                        <div className="enq-details-value text-dark" style={{ fontSize: '0.9rem' }}>{enq.customer?.name || 'N/A'}</div>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="enq-details-card bg-white border-0 shadow-sm" style={{ borderLeft: '4px solid #9a55ff', padding: '12px 16px' }}>
                                        <div className="enq-details-label" style={{ color: '#7f39fb', fontSize: '0.65rem' }}>SBU</div>
                                        <div className="enq-details-value text-dark" style={{ fontSize: '0.9rem' }}>{enq.sbu?.name || 'N/A'}</div>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="enq-details-card bg-white border-0 shadow-sm" style={{ borderLeft: '4px solid #6366f1', padding: '12px 16px' }}>
                                        <div className="enq-details-label" style={{ color: '#6366f1', fontSize: '0.65rem' }}>Division</div>
                                        <div className="enq-details-value text-dark" style={{ fontSize: '0.9rem' }}>{enq.division?.name || 'N/A'}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="row g-3 mb-4">
                                <div className="col-md-4">
                                    <div className="enq-details-card bg-white border-0 shadow-sm" style={{ borderLeft: '4px solid #06b6d4', padding: '12px 16px' }}>
                                        <div className="enq-details-label" style={{ color: '#06b6d4', fontSize: '0.65rem' }}>RFQ No</div>
                                        <div className="enq-details-value text-dark" style={{ fontSize: '0.9rem' }}>{enq.rfq_no}</div>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="enq-details-card bg-white border-0 shadow-sm" style={{ borderLeft: '4px solid #10b981', padding: '12px 16px' }}>
                                        <div className="enq-details-label" style={{ color: '#10b981', fontSize: '0.65rem' }}>RFQ Date</div>
                                        <div className="enq-details-value text-dark" style={{ fontSize: '0.9rem' }}>{enq.rfq_date}</div>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="enq-details-card bg-white border-0 shadow-sm" style={{ borderLeft: '4px solid #f59e0b', padding: '12px 16px' }}>
                                        <div className="enq-details-label" style={{ color: '#f59e0b', fontSize: '0.65rem' }}>RFQ Due Date</div>
                                        <div className="enq-details-value text-dark" style={{ fontSize: '0.85rem' }}>{enq.rfq_due_date} ({enq.rfq_due_time?.substring(0, 5)})</div>
                                    </div>
                                </div>
                            </div>

                            <h6 className="font-weight-bold mb-3 pb-2 border-bottom" style={{ color: '#9a55ff', fontSize: '0.95rem' }}>Costing Status & Action</h6>
                            <div className="row g-3 mb-4">
                                <div className="col-md-6">
                                    <label className="form-label font-weight-semibold text-secondary small uppercase" style={{ letterSpacing: '0.5px' }}>Expected Date of Costing</label>
                                    <input
                                        type="date"
                                        className="form-control border-0 shadow-sm"
                                        style={{ padding: '0.75rem 1rem', borderRadius: '10px' }}
                                        value={edOfCosting}
                                        onChange={(e) => setEdOfCosting(e.target.value)}
                                        disabled={!canEdit || viewOnly}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label font-weight-semibold text-secondary small uppercase" style={{ letterSpacing: '0.5px' }}>Actual Date of Costing</label>
                                    <input
                                        type="date"
                                        className="form-control border-0 shadow-sm"
                                        style={{ padding: '0.75rem 1rem', borderRadius: '10px' }}
                                        value={actualDateOfCosting}
                                        onChange={(e) => setActualDateOfCosting(e.target.value)}
                                        disabled={!canEdit || viewOnly}
                                    />
                                </div>
                            </div>

                            <div className="row g-3 mb-4">
                                <div className="col-md-6">
                                    <label className="form-label font-weight-semibold text-secondary small uppercase" style={{ letterSpacing: '0.5px' }}>Sales Representative <span className="text-danger">*</span></label>
                                    <select
                                        className="form-select border-0 shadow-sm"
                                        style={{ padding: '0.75rem 1rem', borderRadius: '10px' }}
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
                                <div className="col-md-6">
                                    <label className="form-label font-weight-semibold text-secondary small uppercase" style={{ letterSpacing: '0.5px' }}>Status</label>
                                    <select
                                        className="form-select border-0 shadow-sm"
                                        style={{ padding: '0.75rem 1rem', borderRadius: '10px', fontWeight: 'bold', color: '#9a55ff' }}
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                        disabled={!canEdit || viewOnly}
                                    >
                                        <option value="Pending with Costing">Pending with Costing</option>
                                        <option value="Sales to Quote">Sales to Quote</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="form-label font-weight-semibold text-secondary small uppercase" style={{ letterSpacing: '0.5px' }}>Costing Remarks</label>
                                <textarea
                                    className="form-control border-0 shadow-sm"
                                    style={{ borderRadius: '12px', padding: '1rem' }}
                                    rows="3"
                                    placeholder="Add costing remarks / notes"
                                    value={costingRemarks}
                                    onChange={(e) => setCostingRemarks(e.target.value)}
                                    disabled={!canEdit || viewOnly}
                                />
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

export default EditCostingModal;
