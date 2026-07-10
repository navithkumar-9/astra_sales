import React, { useState, useEffect } from 'react';
import { enquiryService } from '../services/enquiryService';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import EditEnggModal from '../components/enquiry/EditEnggModal';
import EditCostingModal from '../components/enquiry/EditCostingModal';
import EditSalesModal from '../components/enquiry/EditSalesModal';
import { hasPermission, PERMISSIONS } from '../config/permissions';

const PIPELINE_STAGES = [
    { id: 'Pending with Engg', label: 'Pending with Engg', color: '#3b82f6' },
    { id: 'Pending with Costing', label: 'Pending with Costing', color: '#f59e0b' },
    { id: 'Pending with Sales', label: 'Pending with Sales', color: '#8b5cf6' },
    { id: 'Sales to Quote', label: 'Sales to Quote', color: '#ec4899' },
    { id: 'Quote Submitted', label: 'Quote Submitted', color: '#10b981' }
];

const KanbanBoard = () => {
    const { showToast } = useToast();
    const { user } = useAuth();
    
    const [loading, setLoading] = useState(true);
    const [enquiries, setEnquiries] = useState([]);

    // Modal & Interaction States
    const [selectedEnq, setSelectedEnq] = useState(null);
    const [showModalType, setShowModalType] = useState(null); // 'ENGG', 'COSTING', 'SALES'
    const [viewOnly, setViewOnly] = useState(true);

    // Permission Logic
    const userRole = user?.role;
    const canEditEngg = hasPermission(userRole, PERMISSIONS.CAN_EDIT_ENGG);
    const canEditCosting = hasPermission(userRole, PERMISSIONS.CAN_EDIT_COSTING);
    const canEditSales = hasPermission(userRole, PERMISSIONS.CAN_EDIT_SALES);

    useEffect(() => {
        fetchEnquiries();
    }, []);

    const fetchEnquiries = async () => {
        setLoading(true);
        try {
            const res = await enquiryService.getAll({ page_size: 1000 });
            setEnquiries(res.results || res || []);
        } catch (err) {
            showToast('Failed to load enquiries for Kanban Board.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const getEnquiriesByStage = (stageId) => {
        return enquiries.filter(enq => enq.status === stageId);
    };

    const calculateDaysInStage = (enq) => {
        // Approximate calculation for demonstration. In a real scenario, use actual transition logs if available.
        // For now, we'll use rfq_aging.
        return enq.rfq_aging;
    };

    const handleCardClick = (enq) => {
        setSelectedEnq(enq);
        
        if (enq.status === 'Pending with Engg') {
            setShowModalType('ENGG');
            setViewOnly(!canEditEngg);
        } else if (enq.status === 'Pending with Costing') {
            setShowModalType('COSTING');
            setViewOnly(!canEditCosting);
        } else if (['Sales to Quote', 'Pending with Sales', 'Quote Submitted'].includes(enq.status)) {
            setShowModalType('SALES');
            setViewOnly(!canEditSales);
        } else {
            // Default fallback
            setShowModalType('ENGG');
            setViewOnly(true);
        }
    };

    const handleModalClose = () => {
        setShowModalType(null);
        setSelectedEnq(null);
    };

    const handleModalSuccess = () => {
        handleModalClose();
        fetchEnquiries();
    };

    return (
        <div className="page container-fluid px-4 py-4 h-100 d-flex flex-column" style={{ overflow: 'hidden' }}>
            <div className="page-header mb-4 flex-shrink-0">
                <h1 className="page-title h3 font-weight-bold mb-1">Interactive CRM Pipeline</h1>
                <p className="page-subtitle text-muted mb-0">Click any card to view or edit details based on your role.</p>
            </div>

            {loading ? (
                <div className="d-flex flex-column align-items-center justify-content-center flex-grow-1">
                    <div className="page-loader-spinner mb-3"></div>
                    <div className="text-muted font-weight-bold">Loading Kanban Board...</div>
                </div>
            ) : (
                <div className="kanban-board-container flex-grow-1" style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem' }}>
                    {PIPELINE_STAGES.map(stage => (
                        <div key={stage.id} className="kanban-column d-flex flex-column" style={{ minWidth: '300px', maxWidth: '300px', background: '#f1f5f9', borderRadius: '12px', padding: '1rem' }}>
                            <div className="kanban-column-header mb-3 pb-2 border-bottom d-flex align-items-center justify-content-between">
                                <h6 className="font-weight-bold mb-0" style={{ color: stage.color }}>{stage.label}</h6>
                                <span className="badge bg-white text-dark shadow-sm rounded-pill">{getEnquiriesByStage(stage.id).length}</span>
                            </div>
                            
                            <div className="kanban-column-body flex-grow-1" style={{ overflowY: 'auto', paddingRight: '4px' }}>
                                {getEnquiriesByStage(stage.id).length === 0 ? (
                                    <div className="text-center p-4 text-muted small border-dashed rounded bg-white opacity-50">
                                        No enquiries
                                    </div>
                                ) : (
                                    getEnquiriesByStage(stage.id).map(enq => (
                                        <div 
                                            key={enq.id} 
                                            className="kanban-card card shadow-sm border-0 mb-3" 
                                            style={{ borderRadius: '10px', borderLeft: `4px solid ${stage.color}`, cursor: 'pointer', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
                                            onClick={() => handleCardClick(enq)}
                                            onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 .5rem 1rem rgba(0,0,0,.15)'; }}
                                            onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 .125rem .25rem rgba(0,0,0,.075)'; }}
                                        >
                                            <div className="card-body p-3">
                                                <div className="d-flex justify-content-between align-items-start mb-2">
                                                    <h6 className="font-weight-bold mb-0 text-dark">{enq.project_number}</h6>
                                                    <span className="badge bg-light text-secondary border" style={{ fontSize: '0.65rem' }}>
                                                        {calculateDaysInStage(enq)}d
                                                    </span>
                                                </div>
                                                <div className="text-muted small mb-2 text-truncate" title={enq.customer?.name}>
                                                    {enq.customer?.name || 'Unknown Customer'}
                                                </div>
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <span className="text-secondary" style={{ fontSize: '0.7rem', fontWeight: '500' }}>
                                                        {enq.rfq_no}
                                                    </span>
                                                    <div className="d-flex align-items-center gap-1 text-muted" style={{ fontSize: '0.7rem' }}>
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <circle cx="12" cy="12" r="10" />
                                                            <polyline points="12 6 12 12 16 14" />
                                                        </svg>
                                                        {new Date(enq.rfq_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modals */}
            <EditEnggModal 
                enq={selectedEnq} 
                show={showModalType === 'ENGG'} 
                onClose={handleModalClose} 
                onSuccess={handleModalSuccess} 
                canEdit={canEditEngg} 
                viewOnly={viewOnly} 
            />
            
            <EditCostingModal 
                enq={selectedEnq} 
                show={showModalType === 'COSTING'} 
                onClose={handleModalClose} 
                onSuccess={handleModalSuccess} 
                canEdit={canEditCosting} 
                viewOnly={viewOnly} 
            />

            <EditSalesModal 
                enq={selectedEnq} 
                show={showModalType === 'SALES'} 
                onClose={handleModalClose} 
                onSuccess={handleModalSuccess} 
                canEdit={canEditSales} 
                viewOnly={viewOnly} 
            />

        </div>
    );
};

export default KanbanBoard;
