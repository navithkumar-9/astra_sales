/* eslint-disable no-unused-vars, react-hooks/exhaustive-deps, react-hooks/rules-of-hooks */
import React, { useState } from 'react';
import DocumentsTab from './DocumentsTab';
import AuditHistoryTab from './AuditHistoryTab';
import ActivityFeedTab from './ActivityFeedTab';

const ViewEnquiryModal = ({ show, onClose, selectedEnquiry, onRefresh }) => {
    const [activeTab, setActiveTab] = useState('details');

    if (!show || !selectedEnquiry) return null;

    // Helper for status styling mapping
    const getStatusStyle = (status) => {
        const s = (status || '').toLowerCase();
        if (s.includes('won')) return { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981' };
        if (s.includes('lost') || s.includes('regretted')) return { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' };
        if (s.includes('hold')) return { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' };
        return { bg: 'rgba(154, 85, 255, 0.1)', color: '#9a55ff' };
    };

    const statusStyle = getStatusStyle(selectedEnquiry.status);

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
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                    <circle cx="12" cy="12" r="3"/>
                                </svg>
                            </div>
                            <div>
                                <h5 className="modal-title font-weight-bold mb-0" style={{ letterSpacing: '0.5px' }}>Enquiry Details</h5>
                                <span className="small text-white-50" style={{ fontSize: '0.85rem' }}>{selectedEnquiry.project_number} — {selectedEnquiry.project_name}</span>
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

                    {/* Tabs Navigation styled with Purple Admin branding */}
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

                    <div className="modal-body p-4" style={{ maxHeight: '65vh', overflowY: 'auto', backgroundColor: '#f8fafc' }}>
                        <div style={{ display: activeTab === 'details' ? 'block' : 'none' }}>
                        
                        {/* Top Info Cards (2 Columns) */}
                        <div className="row g-3 mb-4">
                            <div className="col-md-6">
                                <div className="enq-details-card bg-white border-0 shadow-sm" style={{ borderLeft: '4px solid #da8cff' }}>
                                    <div className="enq-details-label" style={{ color: '#9a55ff' }}>Customer Name</div>
                                    <div className="enq-details-value text-dark">{selectedEnquiry.customer?.name || 'N/A'}</div>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="enq-details-card bg-white border-0 shadow-sm" style={{ borderLeft: '4px solid #9a55ff' }}>
                                    <div className="enq-details-label" style={{ color: '#7f39fb' }}>SBU</div>
                                    <div className="enq-details-value text-dark">{selectedEnquiry.sbu?.name || 'N/A'}</div>
                                </div>
                            </div>
                        </div>

                        {/* Inline Badges */}
                        <div className="d-flex flex-wrap gap-4 mb-4 font-weight-semibold" style={{ fontSize: '0.85rem' }}>
                            <div>
                                <span className="text-secondary">Division: </span>
                                <span className="badge bg-white text-dark shadow-sm border px-3 py-2 rounded-pill">{selectedEnquiry.division?.name || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="text-secondary">RFQ Type: </span>
                                <span className="badge bg-white text-dark shadow-sm border px-3 py-2 rounded-pill">{selectedEnquiry.rfq_type?.name || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="text-secondary">Status: </span>
                                <span className="badge px-3 py-2 rounded-pill shadow-sm" style={{ 
                                    backgroundColor: statusStyle.bg, 
                                    color: statusStyle.color,
                                    fontWeight: 'bold'
                                }}>
                                    {selectedEnquiry.status}
                                </span>
                            </div>
                        </div>

                        {/* Time Blocks (3 Columns) */}
                        <div className="row g-3 mb-4">
                            <div className="col-md-4">
                                <div className="enq-time-block shadow-sm border-0" style={{ background: 'linear-gradient(to right, #84d9d2, #07cdae)', color: '#fff', padding: '1.25rem' }}>
                                    <div className="enq-time-block-label" style={{ opacity: 0.85 }}>RFQ Date</div>
                                    <div className="enq-time-block-value">
                                        {new Date(selectedEnquiry.rfq_date).toLocaleDateString(undefined, {
                                            month: 'short', day: 'numeric', year: '2-digit'
                                        })}
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="enq-time-block shadow-sm border-0" style={{ background: 'linear-gradient(to right, #ffbf96, #fe7096)', color: '#fff', padding: '1.25rem' }}>
                                    <div className="enq-time-block-label" style={{ opacity: 0.85 }}>RFQ Due Date</div>
                                    <div className="enq-time-block-value" style={{ fontSize: '0.9rem' }}>
                                        {new Date(selectedEnquiry.rfq_due_date).toLocaleDateString(undefined, {
                                            month: 'short', day: 'numeric', year: '2-digit'
                                        })}, {selectedEnquiry.rfq_due_time?.substring(0, 5) || ''}
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="enq-time-block shadow-sm border-0" style={{ background: 'linear-gradient(to right, #90caf9, #047edf)', color: '#fff', padding: '1.25rem' }}>
                                    <div className="enq-time-block-label" style={{ opacity: 0.85 }}>RFQ Aging</div>
                                    <div className="enq-time-block-value">
                                        {selectedEnquiry.rfq_aging} Days
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Clarifications */}
                        <div className="row g-3 mb-4">
                            <div className="col-md-6">
                                <div className="enq-details-card bg-white border-0 shadow-sm">
                                    <div className="enq-details-label" style={{ color: '#e056fd' }}>Clarification To CS</div>
                                    <div className="enq-details-value text-wrap text-secondary" style={{ fontSize: '0.9rem', fontWeight: 'normal' }}>
                                        {selectedEnquiry.clarification_to_cs || 'No clarification requested.'}
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="enq-details-card bg-white border-0 shadow-sm">
                                    <div className="enq-details-label" style={{ color: '#e056fd' }}>Clarification From CS</div>
                                    <div className="enq-details-value text-wrap text-secondary" style={{ fontSize: '0.9rem', fontWeight: 'normal' }}>
                                        {selectedEnquiry.clarification_from_cs || 'No response received.'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Remarks */}
                        <div className="mb-4">
                            <div className="enq-details-label" style={{ color: '#64748b' }}>Remarks / Description</div>
                            <div className="enq-remarks-box bg-white border-0 shadow-sm rounded-lg" style={{ minHeight: '80px', color: '#475569' }}>
                                {selectedEnquiry.remarks || 'No remarks provided.'}
                            </div>
                        </div>

                        {/* Engineering Estimation Details */}
                        <h6 className="font-weight-bold mb-3 pb-2 border-bottom" style={{ fontSize: '0.95rem', color: '#9a55ff' }}>Engineering Estimation Details</h6>
                        <div className="row g-3 mb-4">
                            <div className="col-md-6">
                                <div className="enq-details-card bg-white border-0 shadow-sm">
                                    <div className="enq-details-label">Expected Date of Engineering</div>
                                    <div className="enq-details-value text-secondary" style={{ fontSize: '0.9rem' }}>
                                        {selectedEnquiry.ed_of_engg || 'N/A'}
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="enq-details-card bg-white border-0 shadow-sm">
                                    <div className="enq-details-label">Actual Date of Engineering</div>
                                    <div className="enq-details-value text-secondary" style={{ fontSize: '0.9rem' }}>
                                        {selectedEnquiry.actual_date_of_engg || 'N/A'}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mb-4">
                            <div className="enq-details-label">Engineering Remarks</div>
                            <div className="enq-remarks-box bg-white border-0 shadow-sm rounded-lg" style={{ color: '#475569' }}>
                                {selectedEnquiry.engg_remarks || 'No engineering remarks recorded.'}
                            </div>
                        </div>

                        {/* Costing Estimation Details */}
                        <h6 className="font-weight-bold mb-3 pb-2 border-bottom" style={{ fontSize: '0.95rem', color: '#9a55ff' }}>Costing Estimation Details</h6>
                        <div className="row g-3 mb-4">
                            <div className="col-md-6">
                                <div className="enq-details-card bg-white border-0 shadow-sm">
                                    <div className="enq-details-label">Expected Date of Costing</div>
                                    <div className="enq-details-value text-secondary" style={{ fontSize: '0.9rem' }}>
                                        {selectedEnquiry.ed_of_costing || 'N/A'}
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="enq-details-card bg-white border-0 shadow-sm">
                                    <div className="enq-details-label">Actual Date of Costing</div>
                                    <div className="enq-details-value text-secondary" style={{ fontSize: '0.9rem' }}>
                                        {selectedEnquiry.actual_date_of_costing || 'N/A'}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mb-4">
                            <div className="enq-details-label">Costing Remarks</div>
                            <div className="enq-remarks-box bg-white border-0 shadow-sm rounded-lg" style={{ color: '#475569' }}>
                                {selectedEnquiry.costing_remarks || 'No costing remarks recorded.'}
                            </div>
                        </div>

                        {/* Sales/Quotation Details */}
                        <h6 className="font-weight-bold mb-3 pb-2 border-bottom" style={{ fontSize: '0.95rem', color: '#9a55ff' }}>Sales Estimation & Action</h6>
                        <div className="row g-3 mb-4">
                            <div className="col-md-6">
                                <div className="enq-details-card bg-white border-0 shadow-sm">
                                    <div className="enq-details-label">Sales Representative</div>
                                    <div className="enq-details-value text-secondary" style={{ fontSize: '0.9rem' }}>
                                        {selectedEnquiry.sales_rep?.name || selectedEnquiry.sales_rep?.username || 'N/A'}
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="enq-details-card bg-white border-0 shadow-sm">
                                    <div className="enq-details-label">Sales Team Remarks</div>
                                    <div className="enq-details-value text-secondary" style={{ fontSize: '0.9rem' }}>
                                        {selectedEnquiry.sales_remarks || 'No sales remarks recorded.'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quote & PO Tracking */}
                        <h6 className="font-weight-bold mb-3 pb-2 border-bottom" style={{ fontSize: '0.95rem', color: '#9a55ff' }}>Quote & PO Tracking</h6>
                        <div className="row g-3 mb-4">
                            <div className="col-md-4">
                                <div className="enq-details-card bg-white border-0 shadow-sm">
                                    <div className="enq-details-label">Quote Date</div>
                                    <div className="enq-details-value text-secondary" style={{ fontSize: '0.9rem' }}>
                                        {selectedEnquiry.quote_date || 'N/A'}
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="enq-details-card bg-white border-0 shadow-sm">
                                    <div className="enq-details-label">Quote Value ($)</div>
                                    <div className="enq-details-value text-secondary" style={{ fontSize: '0.9rem' }}>
                                        {selectedEnquiry.quote_value ? `INR ${Number(selectedEnquiry.quote_value).toLocaleString()}` : 'N/A'}
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="enq-details-card bg-white border-0 shadow-sm">
                                    <div className="enq-details-label">Open-L1 Value ($)</div>
                                    <div className="enq-details-value text-secondary" style={{ fontSize: '0.9rem' }}>
                                        {selectedEnquiry.open_l1_value ? `INR ${Number(selectedEnquiry.open_l1_value).toLocaleString()}` : 'N/A'}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="row g-3 mb-4">
                            <div className="col-md-4">
                                <div className="enq-details-card bg-white border-0 shadow-sm">
                                    <div className="enq-details-label">Open-L1 Date</div>
                                    <div className="enq-details-value text-secondary" style={{ fontSize: '0.9rem' }}>
                                        {selectedEnquiry.open_l1_date || 'N/A'}
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="enq-details-card bg-white border-0 shadow-sm">
                                    <div className="enq-details-label">Lost Value ($)</div>
                                    <div className="enq-details-value text-secondary" style={{ fontSize: '0.9rem' }}>
                                        {selectedEnquiry.lost_value ? `INR ${Number(selectedEnquiry.lost_value).toLocaleString()}` : 'N/A'}
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="enq-details-card bg-white border-0 shadow-sm">
                                    <div className="enq-details-label">PO No</div>
                                    <div className="enq-details-value text-secondary" style={{ fontSize: '0.9rem' }}>
                                        {selectedEnquiry.po_no || 'N/A'}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="row g-3 mb-4">
                            <div className="col-md-6">
                                <div className="enq-details-card bg-white border-0 shadow-sm">
                                    <div className="enq-details-label">PO Receipt Date</div>
                                    <div className="enq-details-value text-secondary" style={{ fontSize: '0.9rem' }}>
                                        {selectedEnquiry.po_receipt_date || 'N/A'}
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="enq-details-card bg-white border-0 shadow-sm">
                                    <div className="enq-details-label">PO Value ($)</div>
                                    <div className="enq-details-value text-secondary" style={{ fontSize: '0.9rem' }}>
                                        {selectedEnquiry.po_value ? `INR ${Number(selectedEnquiry.po_value).toLocaleString()}` : 'N/A'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Finished Goods sub-table */}
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
                                        {selectedEnquiry.fg_details?.length === 0 ? (
                                            <tr>
                                                <td colSpan="3" className="text-center p-3 text-muted">No FG details associated.</td>
                                            </tr>
                                        ) : (
                                            selectedEnquiry.fg_details?.map((detail, idx) => (
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
