import React, { useState, useEffect } from 'react';
import { enquiryService } from '../services/enquiryService';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import EditEnggModal from '../components/enquiry/EditEnggModal';
import EditCostingModal from '../components/enquiry/EditCostingModal';
import EditSalesModal from '../components/enquiry/EditSalesModal';
import { hasPermission, PERMISSIONS } from '../config/permissions';

const PIPELINE_STAGES = [
    { id: 'Pending with Engg', label: 'Pending with Engg', color: '#3b82f6', bgLight: '#eff6ff' },
    { id: 'Pending with Costing', label: 'Pending with Costing', color: '#f59e0b', bgLight: '#fef3c7' },
    { id: 'Sales to Quote', label: 'Sales to Quote', color: '#ec4899', bgLight: '#fdf2f8' },
    { id: 'Pending with Sales', label: 'Pending with Sales', color: '#8b5cf6', bgLight: '#f5f3ff' },
    { id: 'Quote Submitted', label: 'Quote Submitted', color: '#10b981', bgLight: '#ecfdf5' }
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
        return enq.rfq_aging || 0;
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

    const handleModalRefresh = async () => {
        try {
            const res = await enquiryService.getAll({ page_size: 1000 });
            const latestEnquiries = res.results || res || [];
            setEnquiries(latestEnquiries);
            
            if (selectedEnq) {
                const updatedEnq = latestEnquiries.find(e => e.id === selectedEnq.id);
                if (updatedEnq) {
                    setSelectedEnq(updatedEnq);
                }
            }
        } catch (err) {
            showToast('Failed to refresh enquiry data.', 'error');
        }
    };

    // Helper for generating custom background color for avatar bubbles
    const getAvatarBg = (username) => {
        const hash = [...(username || 'U')].reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#f97316', '#06b6d4'];
        return colors[hash % colors.length];
    };

    // Dynamic priority calculation based on SLA / aging
    const getPriority = (enq) => {
        const days = enq.rfq_aging || 0;
        const isOverdue = new Date(enq.rfq_due_date) < new Date();
        if (isOverdue) return 'urgent';
        if (days > 45) return 'high';
        if (days > 15) return 'medium';
        return 'low';
    };

    return (
        <div className="page container-fluid px-4 py-4 h-100 d-flex flex-column bg-light" style={{ overflow: 'hidden', minHeight: '90vh' }}>
            <div className="page-header mb-4 flex-shrink-0 border-bottom pb-3 d-flex justify-content-between align-items-center">
                <div>
                    <h2 className="font-weight-bold mb-1 text-dark" style={{ letterSpacing: '-0.5px' }}>Interactive CRM Pipeline</h2>
                    <p className="text-muted mb-0 small">Drag-free visual CRM board. Click any card to inspect or perform status transition updates.</p>
                </div>
                <button className="btn btn-white border shadow-sm btn-sm rounded-pill px-3 d-flex align-items-center gap-1 bg-white" onClick={fetchEnquiries}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path></svg>
                    Refresh Board
                </button>
            </div>

            {loading ? (
                <div className="d-flex flex-column align-items-center justify-content-center flex-grow-1">
                    <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}></div>
                    <div className="text-muted font-weight-bold mt-3" style={{ letterSpacing: '1px' }}>LOADING PIPELINE...</div>
                </div>
            ) : (
                <div className="kanban-board-container flex-grow-1" style={{ display: 'flex', gap: '1.25rem', overflowX: 'auto', paddingBottom: '1rem', alignItems: 'stretch' }}>
                    {PIPELINE_STAGES.map(stage => {
                        const stageEnquiries = getEnquiriesByStage(stage.id);
                        return (
                            <div key={stage.id} className="kanban-column d-flex flex-column" style={{ 
                                minWidth: '310px', 
                                maxWidth: '310px', 
                                background: '#f8fafc', 
                                borderRadius: '16px', 
                                padding: '1rem',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)'
                            }}>
                                {/* Column Header */}
                                <div className="kanban-column-header mb-3 pb-2 border-bottom d-flex align-items-center justify-content-between">
                                    <h6 className="font-weight-bold mb-0 d-flex align-items-center gap-2" style={{ color: stage.color, fontSize: '0.9rem', letterSpacing: '0.3px' }}>
                                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: stage.color, display: 'inline-block' }}></span>
                                        {stage.label}
                                    </h6>
                                    <span className="badge bg-white text-dark border shadow-sm rounded-pill" style={{ padding: '0.35em 0.7em', fontSize: '0.75rem' }}>
                                        {stageEnquiries.length}
                                    </span>
                                </div>
                                
                                {/* Column Body */}
                                <div className="kanban-column-body flex-grow-1" style={{ overflowY: 'auto', paddingRight: '4px' }}>
                                    {stageEnquiries.length === 0 ? (
                                        <div className="text-center p-5 text-muted small border-dashed rounded bg-white" style={{ opacity: 0.75, border: '2px dashed #cbd5e1' }}>
                                            No Enquiries
                                        </div>
                                    ) : (
                                        stageEnquiries.map(enq => {
                                            const days = calculateDaysInStage(enq);
                                            const ageColor = days > 60 ? '#ef4444' : days > 30 ? '#f59e0b' : '#10b981';
                                            const isOverdue = new Date(enq.rfq_due_date) < new Date() && !['Won', 'Lost', 'Regretted'].includes(enq.status);
                                            const priority = getPriority(enq);
                                            const expectedRevenue = enq.quote_value || enq.po_value || 0;
                                            
                                            return (
                                                <div 
                                                    key={enq.id} 
                                                    className="kanban-card card shadow-sm border-0 mb-3" 
                                                    style={{ 
                                                        borderRadius: '12px', 
                                                        borderLeft: `4px solid ${stage.color}`, 
                                                        cursor: 'pointer', 
                                                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                                        backgroundColor: '#ffffff'
                                                    }}
                                                    onClick={() => handleCardClick(enq)}
                                                    onMouseOver={(e) => { 
                                                        e.currentTarget.style.transform = 'translateY(-3px)'; 
                                                        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)'; 
                                                    }}
                                                    onMouseOut={(e) => { 
                                                        e.currentTarget.style.transform = 'none'; 
                                                        e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px 0 rgba(0,0,0,0.06)'; 
                                                    }}
                                                >
                                                    <div className="card-body p-3">
                                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                                            <h6 className="font-weight-bold mb-0 text-dark" style={{ fontSize: '0.85rem' }}>{enq.project_number}</h6>
                                                            <span className="badge text-white" style={{ fontSize: '0.65rem', backgroundColor: ageColor, padding: '0.25em 0.5em', borderRadius: '4px' }}>
                                                                {days} Days Old
                                                            </span>
                                                        </div>
                                                        
                                                        <div className="text-secondary small mb-2 font-weight-medium text-truncate" title={enq.customer?.name} style={{ fontSize: '0.75rem' }}>
                                                            🏢 {enq.customer?.name || 'Unknown Customer'}
                                                        </div>

                                                        {/* Expected Revenue / Quote Value */}
                                                        <div className="mb-2 text-dark font-weight-bold" style={{ fontSize: '0.8rem' }}>
                                                            💰 Est: INR {Number(expectedRevenue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </div>

                                                        {/* Badges/SBU/RFQs info */}
                                                        <div className="d-flex flex-wrap gap-1 mb-2">
                                                            <span className="badge text-white" style={{ fontSize: '0.65rem', backgroundColor: '#6366f1', fontWeight: '500' }}>
                                                                {enq.sbu?.name || 'SBU'}
                                                            </span>
                                                            <span className="badge bg-light text-dark border" style={{ fontSize: '0.65rem', fontWeight: '500' }}>
                                                                {enq.rfq_type?.name || 'RFQ'}
                                                            </span>
                                                        </div>

                                                        <div className="text-muted small mb-2" style={{ fontSize: '0.65rem' }}>
                                                            🕒 Updated: {new Date(enq.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                        </div>

                                                        {/* Card Footer: Date and Assignee */}
                                                        <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                                                            <div className="d-flex align-items-center gap-1 text-muted" style={{ fontSize: '0.7rem' }}>
                                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                                    <circle cx="12" cy="12" r="10" />
                                                                    <polyline points="12 6 12 12 16 14" />
                                                                </svg>
                                                                Due: {new Date(enq.rfq_due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                            </div>
                                                            
                                                            {/* User Avatar Circle */}
                                                            <div className="avatar-circle shadow-sm" style={{
                                                                width: '24px',
                                                                height: '24px',
                                                                borderRadius: '50%',
                                                                backgroundColor: getAvatarBg(enq.sales_rep?.username),
                                                                color: '#ffffff',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontSize: '0.65rem',
                                                                fontWeight: 'bold',
                                                                letterSpacing: '0.5px'
                                                            }} title={`Assigned Rep: ${enq.sales_rep?.username}`}>
                                                                {enq.sales_rep?.username?.charAt(0).toUpperCase() || 'U'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modals */}
            <EditEnggModal 
                enq={selectedEnq} 
                show={showModalType === 'ENGG'} 
                onClose={handleModalClose} 
                onSuccess={handleModalSuccess} 
                onRefresh={handleModalRefresh}
                canEdit={canEditEngg} 
                viewOnly={viewOnly} 
            />
            
            <EditCostingModal 
                enq={selectedEnq} 
                show={showModalType === 'COSTING'} 
                onClose={handleModalClose} 
                onSuccess={handleModalSuccess} 
                onRefresh={handleModalRefresh}
                canEdit={canEditCosting} 
                viewOnly={viewOnly} 
            />

            <EditSalesModal 
                enq={selectedEnq} 
                show={showModalType === 'SALES'} 
                onClose={handleModalClose} 
                onSuccess={handleModalSuccess} 
                onRefresh={handleModalRefresh}
                canEdit={canEditSales} 
                viewOnly={viewOnly} 
            />

        </div>
    );
};

export default KanbanBoard;

