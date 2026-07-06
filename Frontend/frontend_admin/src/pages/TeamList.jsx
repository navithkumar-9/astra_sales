import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getAvatarStyle } from '../utils/avatar';

const TeamList = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Edit Modal State
    const [editingMember, setEditingMember] = useState(null);
    const [editForm, setEditForm] = useState({
        username: '',
        name: '',
        role: '',
        is_active: true,
        password: '',
    });

    // Delete Modal State
    const [deletingMember, setDeletingMember] = useState(null);

    const isSuperAdmin = user?.role === 'SUPERADMIN';
    const isAdmin = user?.role === 'ADMIN';
    const canManage = isSuperAdmin || isAdmin;

    const fetchMembers = async () => {
        setLoading(true);
        try {
            const res = await API.get('/users/');
            if (res.data.success) {
                setMembers(res.data.data);
            }
        } catch (err) {
            showToast(err.response?.data?.error || 'Failed to fetch team members.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!canManage) {
            showToast('You do not have permission to view this page.', 'error');
            navigate('/dashboard');
            return;
        }
        fetchMembers();
    }, [user, navigate]);

    const handleEditClick = (member) => {
        setEditingMember(member);
        setEditForm({
            username: member.username,
            name: member.name || '',
            role: member.role,
            is_active: member.is_active,
            password: '', // default empty
        });
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!editingMember) return;
        try {
            const payload = {
                username: editForm.username,
                name: editForm.name,
                role: editForm.role,
                is_active: editForm.is_active,
            };
            if (editForm.password) {
                payload.password = editForm.password;
            }

            const res = await API.put(`/users/${editingMember.id}/`, payload);
            if (res.data.success) {
                showToast('Member updated successfully.', 'success');
                setEditingMember(null);
                fetchMembers();
            }
        } catch (err) {
            showToast(err.response?.data?.error || 'Failed to update member.', 'error');
        }
    };

    const handleDeleteClick = (member) => {
        if (member.id === user.id) {
            showToast('You cannot delete your own account!', 'error');
            return;
        }
        setDeletingMember(member);
    };

    const handleDeleteConfirm = async () => {
        if (!deletingMember) return;
        try {
            const res = await API.delete(`/users/${deletingMember.id}/`);
            if (res.data.success) {
                showToast('Member deleted successfully.', 'success');
                setDeletingMember(null);
                fetchMembers();
            }
        } catch (err) {
            showToast(err.response?.data?.error || 'Failed to delete member.', 'error');
        }
    };

    // Filter roles options creator can assign
    const getAllowedRoles = () => {
        if (isSuperAdmin) {
            return [
                { value: 'ADMIN', label: 'Admin' },
                { value: 'RFQ_TRACKER', label: 'RFQ Tracker' },
                { value: 'SALES_REP', label: 'Sales Rep' },
            ];
        }
        if (isAdmin) {
            return [
                { value: 'RFQ_TRACKER', label: 'RFQ Tracker' },
                { value: 'SALES_REP', label: 'Sales Rep' },
            ];
        }
        return [];
    };

    const getRoleBadgeClass = (role) => {
        switch (role) {
            case 'SUPERADMIN':
                return 'badge-superadmin';
            case 'ADMIN':
                return 'badge-admin';
            case 'RFQ_TRACKER':
                return 'badge-rfq';
            case 'SALES_REP':
                return 'badge-sales';
            default:
                return '';
        }
    };

    const formatRoleName = (role) => {
        switch (role) {
            case 'SUPERADMIN': return 'Superadmin';
            case 'ADMIN': return 'Admin';
            case 'RFQ_TRACKER': return 'RFQ Tracker';
            case 'SALES_REP': return 'Sales Rep';
            default: return role;
        }
    };

    if (loading) {
        return (
            <div className="page">
                <div className="page-loader">
                    <div className="page-loader-spinner"></div>
                    <div className="page-loader-text">Loading team list...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 className="page-title">Team Members</h1>
                    <p className="page-subtitle">Manage user accounts and roles permissions</p>
                </div>
                <button 
                    className="btn-primary-gradient" 
                    onClick={() => navigate('/create-member')}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.6rem 1.2rem', borderRadius: '8px', border: 'none', color: '#fff', cursor: 'pointer' }}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add Member
                </button>
            </div>

            <div className="card" style={{ padding: '0px', overflow: 'hidden' }}>
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Member</th>
                                <th>Username</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Joined</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {members.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                        No team members found.
                                    </td>
                                </tr>
                            ) : (
                                members.map((member) => {
                                    const avatar = getAvatarStyle(member.username);
                                    const allowedToManage = isSuperAdmin 
                                        ? member.role !== 'SUPERADMIN' || member.id === user.id
                                        : member.role !== 'SUPERADMIN' && member.role !== 'ADMIN';

                                    return (
                                        <tr key={member.id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{
                                                        width: '36px',
                                                        height: '36px',
                                                        borderRadius: '50%',
                                                        background: avatar.bg,
                                                        color: avatar.text,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontWeight: '600',
                                                        fontSize: '0.9rem'
                                                    }}>
                                                        {(member.name || member.username).substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="text-bold">{member.name || 'No Name'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{member.username}</td>
                                            <td>
                                                <span className={`badge ${getRoleBadgeClass(member.role)}`}>
                                                    {formatRoleName(member.role)}
                                                </span>
                                            </td>
                                            <td>
                                                <span style={{ 
                                                    display: 'inline-flex', 
                                                    alignItems: 'center', 
                                                    gap: '6px',
                                                    fontSize: '0.8rem',
                                                    color: member.is_active ? '#4bcf82' : '#ff6b6b',
                                                    fontWeight: '500'
                                                }}>
                                                    <span style={{ 
                                                        width: '6px', 
                                                        height: '6px', 
                                                        borderRadius: '50%', 
                                                        background: member.is_active ? '#4bcf82' : '#ff6b6b' 
                                                    }}></span>
                                                    {member.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="text-muted">
                                                {new Date(member.date_joined).toLocaleDateString(undefined, {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </td>
                                            <td>
                                                {allowedToManage ? (
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <button 
                                                            className="btn-icon" 
                                                            onClick={() => handleEditClick(member)}
                                                            title="Edit Member"
                                                            style={{ border: 'none', padding: '6px', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)' }}
                                                        >
                                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                                <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                            </svg>
                                                        </button>
                                                        {member.id !== user.id && (
                                                            <button 
                                                                className="btn-icon" 
                                                                onClick={() => handleDeleteClick(member)}
                                                                title="Delete Member"
                                                                style={{ border: 'none', padding: '6px', background: 'transparent', cursor: 'pointer', color: '#ff6b6b' }}
                                                            >
                                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <polyline points="3 6 5 6 21 6" />
                                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                                    <line x1="10" y1="11" x2="10" y2="17" />
                                                                    <line x1="14" y1="11" x2="14" y2="17" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted" style={{ fontSize: '0.8rem' }}>View-only</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* EDIT MEMBER MODAL */}
            {editingMember && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <div className="modal-header">
                            <h2>Edit Team Member</h2>
                            <button className="modal-close" onClick={() => setEditingMember(null)}>&times;</button>
                        </div>
                        <form onSubmit={handleEditSubmit}>
                            <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                                <label className="form-label">Username</label>
                                <input 
                                    type="text" 
                                    className="form-input" 
                                    value={editForm.username}
                                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                                    required 
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                                <label className="form-label">Full Name</label>
                                <input 
                                    type="text" 
                                    className="form-input" 
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                />
                            </div>
                            {editingMember.id !== user.id && (
                                <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                                    <label className="form-label">Role</label>
                                    <select 
                                        className="form-input" 
                                        value={editForm.role}
                                        onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                        required
                                        style={{ width: '100%', background: 'transparent', color: 'var(--text-primary)' }}
                                    >
                                        {getAllowedRoles().map((role) => (
                                            <option key={role.value} value={role.value} style={{ background: '#1e1e24' }}>
                                                {role.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                                <label className="form-label">New Password (leave blank to keep current)</label>
                                <input 
                                    type="password" 
                                    className="form-input" 
                                    placeholder="Enter new password"
                                    value={editForm.password}
                                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                                />
                            </div>
                            {editingMember.id !== user.id && (
                                <div className="form-group" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <input 
                                        type="checkbox" 
                                        id="edit-is-active"
                                        checked={editForm.is_active}
                                        onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                                    />
                                    <label htmlFor="edit-is-active" className="form-label" style={{ marginBottom: '0px', cursor: 'pointer' }}>
                                        Account is Active
                                    </label>
                                </div>
                            )}
                            <div className="modal-actions">
                                <button type="button" className="btn-cancel-white" onClick={() => setEditingMember(null)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary-gradient" style={{ border: 'none', color: '#fff', cursor: 'pointer' }}>
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DELETE MEMBER MODAL */}
            {deletingMember && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <div className="modal-header">
                            <h2>Delete Team Member</h2>
                            <button className="modal-close" onClick={() => setDeletingMember(null)}>&times;</button>
                        </div>
                        <div style={{ marginBottom: '2rem' }}>
                            <p>Are you sure you want to delete <strong>{deletingMember.name || deletingMember.username}</strong>?</p>
                            <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '8px' }}>
                                This action is permanent and cannot be undone.
                            </p>
                        </div>
                        <div className="modal-actions">
                            <button className="btn-cancel-white" onClick={() => setDeletingMember(null)}>
                                Cancel
                            </button>
                            <button className="btn-danger" onClick={handleDeleteConfirm} style={{ border: 'none', color: '#fff', cursor: 'pointer', padding: '0.6rem 1.2rem', borderRadius: '8px' }}>
                                Confirm Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamList;
