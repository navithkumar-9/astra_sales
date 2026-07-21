/* eslint-disable no-unused-vars, react-hooks/exhaustive-deps, react-hooks/rules-of-hooks */
import React, { useState } from 'react';
import { activityService } from '../../services/activityService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const ActivityFeedTab = ({ enq, onSuccess }) => {
    const { showToast } = useToast();
    const { user } = useAuth();
    const [activityType, setActivityType] = useState('NOTE');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Edit states
    const [editingId, setEditingId] = useState(null);
    const [editText, setEditText] = useState('');
    const [updating, setUpdating] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!description.trim()) return;

        setSubmitting(true);
        try {
            await activityService.create({
                enquiry: enq.id,
                activity_type: activityType,
                description: description.trim()
            });
            showToast('Activity logged successfully!', 'success');
            setDescription('');
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error('Error creating activity:', error);
            showToast('Failed to log activity', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this activity log?')) return;
        try {
            await activityService.delete(id);
            showToast('Activity deleted successfully!', 'success');
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error('Error deleting activity:', error);
            showToast('Failed to delete activity', 'error');
        }
    };

    const handleEditStart = (activity) => {
        setEditingId(activity.id);
        setEditText(activity.description);
    };

    const handleEditCancel = () => {
        setEditingId(null);
        setEditText('');
    };

    const handleEditSave = async (id) => {
        if (!editText.trim()) return;
        setUpdating(true);
        try {
            await activityService.update(id, { description: editText.trim() });
            showToast('Activity updated successfully!', 'success');
            setEditingId(null);
            setEditText('');
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error('Error updating activity:', error);
            showToast('Failed to update activity', 'error');
        } finally {
            setUpdating(false);
        }
    };

    const getActivityIcon = (type) => {
        switch(type) {
            case 'CALL': return '📞';
            case 'EMAIL': return '✉️';
            case 'MEETING': return '🤝';
            default: return '📝';
        }
    };

    const canModify = (activity) => {
        if (!user) return false;
        if (activity.activity_type === 'SYSTEM') return false; // Prevent modification of system logs
        if (user.role === 'SUPERADMIN' || user.role === 'ADMIN') return true;
        return activity.user && activity.user.username === user.username;
    };

    const activities = enq.activities || [];

    return (
        <div className="mt-3">
            <h6 className="font-weight-bold text-primary mb-3 pb-2 border-bottom">Activity Timeline</h6>
            
            {/* New Activity Form */}
            <div className="mb-4 bg-light p-3 rounded border">
                <div className="d-flex gap-2 mb-2">
                    <select 
                        className="form-select form-select-sm" 
                        style={{ width: '130px' }}
                        value={activityType}
                        onChange={(e) => setActivityType(e.target.value)}
                    >
                        <option value="NOTE">📝 Note</option>
                        <option value="CALL">📞 Call</option>
                        <option value="EMAIL">✉️ Email</option>
                        <option value="MEETING">🤝 Meeting</option>
                    </select>
                </div>
                <textarea 
                    className="form-control mb-2" 
                    rows="2" 
                    placeholder="Log a call, email, or write a note..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
                <div className="d-flex justify-content-end">
                    <button type="button" onClick={handleSubmit} className="btn btn-sm btn-primary px-4" disabled={submitting || !description.trim()}>
                        {submitting ? 'Posting...' : 'Post Activity'}
                    </button>
                </div>
            </div>

            {/* Activity Feed */}
            {activities.length === 0 ? (
                <div className="text-center p-4 text-muted bg-light rounded border-dashed">
                    <p className="small mb-0">No activities logged yet.</p>
                </div>
            ) : (
                <div className="timeline-container ps-3 border-start border-2 border-primary">
                    {activities.map((activity) => (
                        <div key={activity.id} className="position-relative mb-4 pl-3">
                            <div className="position-absolute bg-white border border-primary rounded-circle d-flex align-items-center justify-content-center shadow-sm" 
                                 style={{ width: '32px', height: '32px', left: '-33px', top: '0', zIndex: 1 }}>
                                <span style={{ fontSize: '14px' }}>{getActivityIcon(activity.activity_type)}</span>
                            </div>
                            
                            <div className="card shadow-sm border-0 bg-light ms-3">
                                <div className="card-body p-3">
                                    <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                                        <div className="font-weight-bold text-dark small">
                                            {activity.user ? (activity.user.name || activity.user.username) : 'System'}
                                        </div>
                                        <div className="d-flex align-items-center gap-2">
                                            <div className="text-muted small mr-2">
                                                {new Date(activity.created_at).toLocaleString(undefined, {
                                                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                })}
                                            </div>
                                            {canModify(activity) && editingId !== activity.id && (
                                                <div className="d-flex gap-1">
                                                    <button 
                                                        type="button" 
                                                        className="btn btn-link p-0 text-primary small" 
                                                        style={{ fontSize: '0.75rem', textDecoration: 'none' }}
                                                        onClick={() => handleEditStart(activity)}
                                                    >
                                                        Edit
                                                    </button>
                                                    <span className="text-muted" style={{ fontSize: '0.75rem' }}>|</span>
                                                    <button 
                                                        type="button" 
                                                        className="btn btn-link p-0 text-danger small" 
                                                        style={{ fontSize: '0.75rem', textDecoration: 'none' }}
                                                        onClick={() => handleDelete(activity.id)}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {editingId === activity.id ? (
                                        <div>
                                            <textarea 
                                                className="form-control form-control-sm mb-2" 
                                                rows="2" 
                                                value={editText}
                                                onChange={(e) => setEditText(e.target.value)}
                                            />
                                            <div className="d-flex justify-content-end gap-2">
                                                <button 
                                                    type="button" 
                                                    className="btn btn-xs btn-secondary px-2 py-0"
                                                    style={{ fontSize: '0.7rem' }}
                                                    onClick={handleEditCancel}
                                                    disabled={updating}
                                                >
                                                    Cancel
                                                </button>
                                                <button 
                                                    type="button" 
                                                    className="btn btn-xs btn-primary px-2 py-0"
                                                    style={{ fontSize: '0.7rem' }}
                                                    onClick={() => handleEditSave(activity.id)}
                                                    disabled={updating || !editText.trim()}
                                                >
                                                    {updating ? 'Saving...' : 'Save'}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="mb-0 text-secondary small" style={{ whiteSpace: 'pre-wrap' }}>
                                            {activity.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ActivityFeedTab;
