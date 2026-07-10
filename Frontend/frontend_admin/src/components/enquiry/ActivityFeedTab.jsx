import React, { useState } from 'react';
import { activityService } from '../../services/activityService';
import { useToast } from '../../context/ToastContext';

const ActivityFeedTab = ({ enq, onSuccess }) => {
    const { showToast } = useToast();
    const [activityType, setActivityType] = useState('NOTE');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);

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
            if (onSuccess) onSuccess(); // trigger a re-fetch of the enquiry to get latest activities
        } catch (error) {
            console.error('Error creating activity:', error);
            showToast('Failed to log activity', 'error');
        } finally {
            setSubmitting(false);
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

    const activities = enq.activities || [];

    return (
        <div className="mt-3">
            <h6 className="font-weight-bold text-primary mb-3 pb-2 border-bottom">Activity Timeline</h6>
            
            {/* New Activity Form */}
            <form onSubmit={handleSubmit} className="mb-4 bg-light p-3 rounded border">
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
                    <button type="submit" className="btn btn-sm btn-primary px-4" disabled={submitting || !description.trim()}>
                        {submitting ? 'Posting...' : 'Post Activity'}
                    </button>
                </div>
            </form>

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
                                        <div className="text-muted small">
                                            {new Date(activity.created_at).toLocaleString(undefined, {
                                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </div>
                                    </div>
                                    <p className="mb-0 text-secondary small" style={{ whiteSpace: 'pre-wrap' }}>
                                        {activity.description}
                                    </p>
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
