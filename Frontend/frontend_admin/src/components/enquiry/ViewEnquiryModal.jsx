import React, { useState } from 'react';
import DocumentsTab from './DocumentsTab';
import AuditHistoryTab from './AuditHistoryTab';
import ActivityFeedTab from './ActivityFeedTab';

const ViewEnquiryModal = ({ show, onClose, selectedEnquiry, onRefresh }) => {
    const [activeTab, setActiveTab] = useState('details');

    if (!show || !selectedEnquiry) return null;

    return (
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
                                <h5 className="modal-title font-weight-bold mb-0">Enquiry Details</h5>
                                <span className="small text-white-50">{selectedEnquiry.project_number} - {selectedEnquiry.project_name}</span>
                            </div>
                        </div>
                        <button type="button" className="enq-modal-close-icon" onClick={onClose}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>

                    {/* Tabs Navigation */}
                    <div className="bg-light border-bottom px-4 pt-3">
                        <ul className="nav nav-tabs border-0" style={{ gap: '10px' }}>
                            <li className="nav-item">
                                <button type="button" className={`nav-link border-0 ${activeTab === 'details' ? 'active bg-white text-primary font-weight-bold shadow-sm rounded-top' : 'text-muted'}`} onClick={() => { setActiveTab('details'); }} style={{ padding: '0.75rem 1.25rem' }}>
                                    Details
                                </button>
                            </li>
                            <li className="nav-item">
                                <button type="button" className={`nav-link border-0 ${activeTab === 'documents' ? 'active bg-white text-primary font-weight-bold shadow-sm rounded-top' : 'text-muted'}`} onClick={() => { setActiveTab('documents'); }} style={{ padding: '0.75rem 1.25rem' }}>
                                    Documents
                                </button>
                            </li>
                            <li className="nav-item">
                                <button type="button" className={`nav-link border-0 ${activeTab === 'history' ? 'active bg-white text-primary font-weight-bold shadow-sm rounded-top' : 'text-muted'}`} onClick={() => { setActiveTab('history'); }} style={{ padding: '0.75rem 1.25rem' }}>
                                    Audit History
                                </button>
                            </li>
                            <li className="nav-item">
                                <button type="button" className={`nav-link border-0 ${activeTab === 'activities' ? 'active bg-white text-primary font-weight-bold shadow-sm rounded-top' : 'text-muted'}`} onClick={() => { setActiveTab('activities'); }} style={{ padding: '0.75rem 1.25rem' }}>
                                    Activity Feed
                                </button>
                            </li>
                        </ul>
                    </div>

                    <div className="modal-body p-4" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
                        <div style={{ display: activeTab === 'details' ? 'block' : 'none' }}>
                        {/* Top Info Cards (2 Columns) */}
                        <div className="row g-3 mb-4">
                            <div className="col-md-6">
                                <div className="enq-details-card">
                                    <div className="enq-details-label">Customer Name</div>
                                    <div className="enq-details-value">{selectedEnquiry.customer?.name || 'N/A'}</div>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="enq-details-card">
                                    <div className="enq-details-label">SBU</div>
                                    <div className="enq-details-value">{selectedEnquiry.sbu?.name || 'N/A'}</div>
                                </div>
                            </div>
                        </div>

                        {/* Inline Badges */}
                        <div className="d-flex flex-wrap gap-4 mb-4 font-weight-semibold" style={{ fontSize: '0.85rem' }}>
                            <div>
                                <span className="text-secondary">Division: </span>
                                <span className="enq-inline-badge">{selectedEnquiry.division?.name || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="text-secondary">RFQ Type: </span>
                                <span className="enq-inline-badge">{selectedEnquiry.rfq_type?.name || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="text-secondary">Status: </span>
                                <span className={`enq-inline-badge ${selectedEnquiry.status?.toLowerCase() === 'completed' ? 'status-completed' : 'priority-medium'}`}>
                                    {selectedEnquiry.status}
                                </span>
                            </div>
                        </div>

                        {/* Time Blocks (3 Columns) */}
                        <div className="row g-3 mb-4">
                            <div className="col-md-4">
                                <div className="enq-time-block start shadow-sm">
                                    <div className="enq-time-block-label">RFQ Date</div>
                                    <div className="enq-time-block-value">
                                        {new Date(selectedEnquiry.rfq_date).toLocaleDateString(undefined, {
                                            month: 'short', day: 'numeric', year: '2-digit'
                                        })}
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="enq-time-block end shadow-sm">
                                    <div className="enq-time-block-label">RFQ Due Date</div>
                                    <div className="enq-time-block-value" style={{ fontSize: '0.85rem' }}>
                                        {new Date(selectedEnquiry.rfq_due_date).toLocaleDateString(undefined, {
                                            month: 'short', day: 'numeric', year: '2-digit'
                                        })}, {selectedEnquiry.rfq_due_time?.substring(0, 5) || ''}
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="enq-time-block total shadow-sm">
                                    <div className="enq-time-block-label">RFQ Aging</div>
                                    <div className="enq-time-block-value">
                                        {selectedEnquiry.rfq_aging} Days
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Clarifications */}
                        <div className="row g-3 mb-4">
                            <div className="col-md-6">
                                <div className="enq-details-card">
                                    <div className="enq-details-label">Clarification To CS</div>
                                    <div className="enq-details-value text-wrap" style={{ fontSize: '0.9rem', fontWeight: 'normal' }}>
                                        {selectedEnquiry.clarification_to_cs || 'No clarification requested.'}
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="enq-details-card">
                                    <div className="enq-details-label">Clarification From CS</div>
                                    <div className="enq-details-value text-wrap" style={{ fontSize: '0.9rem', fontWeight: 'normal' }}>
                                        {selectedEnquiry.clarification_from_cs || 'No response received.'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Remarks */}
                        <div className="mb-4">
                            <div className="enq-details-label">Remarks / Description</div>
                            <div className="enq-remarks-box">
                                {selectedEnquiry.remarks || 'No remarks provided.'}
                            </div>
                        </div>

                        {/* Engineering Estimation Details */}
                        <h6 className="font-weight-bold text-primary mb-3 pb-2 border-bottom" style={{ fontSize: '0.95rem' }}>Engineering Estimation Details</h6>
                        <div className="row g-3 mb-4">
                            <div className="col-md-6">
                                <div className="enq-details-card">
                                    <div className="enq-details-label">Expected Date of Engineering</div>
                                    <div className="enq-details-value" style={{ fontSize: '0.9rem' }}>
                                        {selectedEnquiry.ed_of_engg || 'N/A'}
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="enq-details-card">
                                    <div className="enq-details-label">Actual Date of Engineering</div>
                                    <div className="enq-details-value" style={{ fontSize: '0.9rem' }}>
                                        {selectedEnquiry.actual_date_of_engg || 'N/A'}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mb-4">
                            <div className="enq-details-label">Engineering Remarks</div>
                            <div className="enq-remarks-box" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#4b5563' }}>
                                {selectedEnquiry.engg_remarks || 'No engineering remarks recorded.'}
                            </div>
                        </div>

                        {/* Costing Estimation Details */}
                        <h6 className="font-weight-bold text-primary mb-3 pb-2 border-bottom" style={{ fontSize: '0.95rem' }}>Costing Estimation Details</h6>
                        <div className="row g-3 mb-4">
                            <div className="col-md-6">
                                <div className="enq-details-card">
                                    <div className="enq-details-label">Expected Date of Costing</div>
                                    <div className="enq-details-value" style={{ fontSize: '0.9rem' }}>
                                        {selectedEnquiry.ed_of_costing || 'N/A'}
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="enq-details-card">
                                    <div className="enq-details-label">Actual Date of Costing</div>
                                    <div className="enq-details-value" style={{ fontSize: '0.9rem' }}>
                                        {selectedEnquiry.actual_date_of_costing || 'N/A'}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mb-4">
                            <div className="enq-details-label">Costing Remarks</div>
                            <div className="enq-remarks-box" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#4b5563' }}>
                                {selectedEnquiry.costing_remarks || 'No costing remarks recorded.'}
                            </div>
                        </div>

                        {/* Finished Goods sub-table */}
                        <div className="mb-4">
                            <div className="enq-details-label">Finished Goods (FG) Details</div>
                            <div className="table-responsive bg-light rounded shadow-sm border">
                                <table className="table table-sm table-hover mb-0">
                                    <thead>
                                        <tr>
                                            <th className="ps-3 text-secondary py-2">FG Part No</th>
                                            <th className="text-secondary py-2">Description</th>
                                            <th className="text-secondary pe-3 text-end py-2">Quantity</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedEnquiry.fg_details?.length === 0 ? (
                                            <tr>
                                                <td colSpan="3" className="text-center p-3 text-muted">No FG details associated.</td>
                                            </tr>
                                        ) : (
                                            selectedEnquiry.fg_details?.map((detail, idx) => (
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
                        </div>

                        {/* Attached Documents */}
                        <div className="mb-4">
                            <div className="enq-details-label">Attached Documents</div>
                            <div className="d-flex gap-3 mt-2">
                                {selectedEnquiry.rfq_document ? (
                                    <a href={selectedEnquiry.rfq_document} target="_blank" rel="noreferrer" className="btn btn-outline-primary btn-sm d-flex align-items-center gap-2 rounded-pill px-3">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                            <polyline points="14 2 14 8 20 8" />
                                            <line x1="12" y1="18" x2="12" y2="12" />
                                            <line x1="9" y1="15" x2="15" y2="15" />
                                        </svg>
                                        View RFQ Doc
                                    </a>
                                ) : (
                                    <span className="text-muted small d-flex align-items-center gap-1">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10" />
                                            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                                        </svg>
                                        No RFQ Doc
                                    </span>
                                )}

                                {selectedEnquiry.po_document ? (
                                    <a href={selectedEnquiry.po_document} target="_blank" rel="noreferrer" className="btn btn-outline-info btn-sm d-flex align-items-center gap-2 rounded-pill px-3">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                            <polyline points="14 2 14 8 20 8" />
                                            <line x1="12" y1="18" x2="12" y2="12" />
                                            <line x1="9" y1="15" x2="15" y2="15" />
                                        </svg>
                                        View PO Doc
                                    </a>
                                ) : (
                                    <span className="text-muted small d-flex align-items-center gap-1">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10" />
                                            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                                        </svg>
                                        No PO Doc
                                    </span>
                                )}
                            </div>
                        </div>

                        </div>

                        {activeTab === 'documents' && (
                            <DocumentsTab 
                                enq={selectedEnquiry} 
                                canEdit={false} 
                                rfqFile={null} 
                                setRfqFile={() => {}} 
                                poFile={null} 
                                setPoFile={() => {}} 
                            />
                        )}

                        {activeTab === 'history' && (
                            <AuditHistoryTab auditLogs={selectedEnquiry.audit_logs} />
                        )}

                        {activeTab === 'activities' && (
                            <ActivityFeedTab enq={selectedEnquiry} onSuccess={onRefresh} />
                        )}
                    </div>
                    <div className="modal-footer border-0 p-3 bg-light d-flex justify-content-end">
                        <button type="button" className="enq-modal-btn-close shadow-sm" onClick={onClose}>
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewEnquiryModal;
