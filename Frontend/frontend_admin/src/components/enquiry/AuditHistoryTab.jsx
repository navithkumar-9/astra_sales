import React from 'react';

const AuditHistoryTab = ({ auditLogs }) => {
    if (!auditLogs || auditLogs.length === 0) {
        return (
            <div className="text-center p-5 text-muted bg-light rounded border-dashed mt-3">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mb-3 opacity-50">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                </svg>
                <h6>No Audit History</h6>
                <p className="small mb-0">No tracked changes have been recorded for this enquiry yet.</p>
            </div>
        );
    }

    return (
        <div className="mt-3">
            <h6 className="font-weight-bold text-primary mb-3 pb-2 border-bottom">Change History</h6>
            <div className="table-responsive bg-light rounded shadow-sm border mb-2">
                <table className="table table-sm table-hover mb-0">
                    <thead className="bg-white">
                        <tr>
                            <th className="ps-3 text-secondary py-2">Date & Time</th>
                            <th className="text-secondary py-2">User</th>
                            <th className="text-secondary py-2">Field Changed</th>
                            <th className="text-secondary py-2">Old Value</th>
                            <th className="text-secondary pe-3 py-2">New Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        {auditLogs.map((log) => (
                            <tr key={log.id}>
                                <td className="ps-3 py-2 text-muted small">
                                    {new Date(log.created_at).toLocaleString(undefined, {
                                        month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                    })}
                                </td>
                                <td className="py-2 font-weight-medium">
                                    {log.user ? (log.user.name || log.user.username) : 'System'}
                                </td>
                                <td className="py-2">
                                    <span className="badge bg-light text-dark border">{log.field_name}</span>
                                </td>
                                <td className="py-2 text-muted text-decoration-line-through small">{log.old_value || '-'}</td>
                                <td className="pe-3 py-2 text-success font-weight-medium small">{log.new_value || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AuditHistoryTab;
