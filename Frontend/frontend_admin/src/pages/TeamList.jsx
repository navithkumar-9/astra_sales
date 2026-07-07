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
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const pageSize = 10;

    // Search and Filter states
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

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
        try {
            const res = await API.get(
                `/users/?page=${page}&page_size=${pageSize}&search=${encodeURIComponent(search)}&role=${roleFilter}&is_active=${statusFilter}`
            );
            const responseData = res.data.success ? res.data.data : res.data;
            if (responseData && responseData.results) {
                setMembers(responseData.results);
                setTotalCount(responseData.count || 0);
            } else {
                setMembers(Array.isArray(responseData) ? responseData : []);
                setTotalCount(Array.isArray(responseData) ? responseData.length : 0);
            }
        } catch (err) {
            showToast(err.response?.data?.error || 'Failed to fetch team members.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Check permissions
    useEffect(() => {
        if (!canManage) {
            showToast('You do not have permission to view this page.', 'error');
            navigate('/dashboard');
        }
    }, [user, navigate]);

    // Reset page to 1 when filters change
    useEffect(() => {
        setPage(1);
    }, [search, roleFilter, statusFilter]);

    // Debounced search fetch trigger
    useEffect(() => {
        setLoading(true);
        const delayDebounce = setTimeout(() => {
            fetchMembers();
        }, 300);
        return () => clearTimeout(delayDebounce);
    }, [page, search, roleFilter, statusFilter]);

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
                return 'role-superadmin';
            case 'ADMIN':
                return 'role-admin';
            default:
                return 'role-member';
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

    if (loading && members.length === 0) {
        return (
            <div className="d-flex flex-column align-items-center justify-content-center min-vh-50 mt-5">
                <div className="page-loader-spinner mb-3"></div>
                <div className="text-muted font-weight-bold">Loading team list...</div>
            </div>
        );
    }

    return (
        <div className="page container-fluid px-4 py-4">
            <div className="page-header d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 className="page-title h3 font-weight-bold mb-1">Team Members</h1>
                    <p className="page-subtitle text-muted mb-0">Manage user accounts and roles permissions</p>
                </div>
                <button 
                    className="btn btn-gradient-primary d-flex align-items-center gap-2 border-0 shadow-sm" 
                    onClick={() => navigate('/create-member')}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add Member
                </button>
            </div>

            {/* Filters and Search Bar */}
            <div className="row g-3 mb-4 align-items-center">
                <div className="col-md-6">
                    <div className="input-group">
                        <span className="input-group-text bg-white border-end-0">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted">
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                        </span>
                        <input
                            type="text"
                            className="form-control border-start-0 ps-0"
                            placeholder="Search by name or username..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
                <div className="col-md-3">
                    <select
                        className="form-select text-secondary font-weight-bold"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                    >
                        <option value="">All Roles</option>
                        <option value="SUPERADMIN">Superadmin</option>
                        <option value="ADMIN">Admin</option>
                        <option value="RFQ_TRACKER">RFQ Tracker</option>
                        <option value="SALES_REP">Sales Rep</option>
                    </select>
                </div>
                <div className="col-md-3">
                    <select
                        className="form-select text-secondary font-weight-bold"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">All Statuses</option>
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                    </select>
                </div>
            </div>

            <div className="card shadow-sm border-0 overflow-hidden">
                <div className="table-responsive">
                    <table className="table table-hover mb-0 data-table">
                        <thead className="bg-light">
                            <tr>
                                <th className="text-uppercase text-secondary font-weight-bold">Member</th>
                                <th className="text-uppercase text-secondary font-weight-bold">Username</th>
                                <th className="text-uppercase text-secondary font-weight-bold">Role</th>
                                <th className="text-uppercase text-secondary font-weight-bold">Status</th>
                                <th className="text-uppercase text-secondary font-weight-bold">Joined</th>
                                <th className="text-uppercase text-secondary font-weight-bold">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {members.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center p-5 text-muted">
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
                                            <td className="align-middle">
                                                <div className="d-flex align-items-center gap-3">
                                                    <div 
                                                        className="avatar-circle shadow-sm flex-shrink-0"
                                                        style={{
                                                            width: '36px',
                                                            height: '36px',
                                                            background: avatar.bg,
                                                            color: avatar.text
                                                        }}
                                                    >
                                                        {(member.name || member.username).substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-weight-bold text-dark">{member.name || 'No Name'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="align-middle">{member.username}</td>
                                            <td className="align-middle">
                                                <span className={`badge rounded-pill ${getRoleBadgeClass(member.role)} px-3 py-2`}>
                                                    {formatRoleName(member.role)}
                                                </span>
                                            </td>
                                            <td className="align-middle">
                                                <span className={`badge rounded-pill ${member.is_active ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'} px-3 py-2`}>
                                                    {member.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="text-muted align-middle">
                                                {new Date(member.date_joined).toLocaleDateString(undefined, {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </td>
                                            <td className="align-middle">
                                                {allowedToManage ? (
                                                    <div className="d-flex gap-2">
                                                        <button 
                                                            className="btn btn-link text-secondary p-1 text-decoration-none" 
                                                            onClick={() => handleEditClick(member)}
                                                            title="Edit Member"
                                                        >
                                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                                <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                            </svg>
                                                        </button>
                                                        {member.id !== user.id && (
                                                            <button 
                                                                className="btn btn-link text-danger p-1 text-decoration-none" 
                                                                onClick={() => handleDeleteClick(member)}
                                                                title="Delete Member"
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
                                                    <span className="text-muted small">View-only</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
                {totalCount > pageSize && (
                    <div className="pagination">
                        <button 
                            className="pagination-btn" 
                            disabled={page === 1} 
                            onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                        >
                            Previous
                        </button>
                        <span className="pagination-info">
                            Page {page} of {Math.ceil(totalCount / pageSize)} ({totalCount} items)
                        </span>
                        <button 
                            className="pagination-btn" 
                            disabled={page >= Math.ceil(totalCount / pageSize)} 
                            onClick={() => setPage(prev => prev + 1)}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {/* EDIT MEMBER MODAL */}
            {editingMember && (
                <div className="modal-overlay d-flex align-items-center justify-content-center position-fixed w-100 h-100 top-0 start-0 z-3 bg-dark bg-opacity-50">
                    <div className="modal-card bg-white rounded shadow-lg p-4 w-100" style={{ maxWidth: '500px' }}>
                        <div className="modal-header d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
                            <h5 className="mb-0 font-weight-bold">Edit Team Member</h5>
                            <button className="btn-close" onClick={() => setEditingMember(null)}></button>
                        </div>
                        <form onSubmit={handleEditSubmit}>
                            <div className="mb-3">
                                <label className="form-label font-weight-bold text-secondary">Username</label>
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    value={editForm.username}
                                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                                    required 
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label font-weight-bold text-secondary">Full Name</label>
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                />
                            </div>
                            {editingMember.id !== user.id && (
                                <div className="mb-3">
                                    <label className="form-label font-weight-bold text-secondary">Role</label>
                                    <select 
                                        className="form-select bg-light" 
                                        value={editForm.role}
                                        onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                        required
                                    >
                                        {getAllowedRoles().map((role) => (
                                            <option key={role.value} value={role.value}>
                                                {role.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div className="mb-3">
                                <label className="form-label font-weight-bold text-secondary">New Password (leave blank to keep current)</label>
                                <input 
                                    type="password" 
                                    className="form-control" 
                                    placeholder="Enter new password"
                                    value={editForm.password}
                                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                                />
                            </div>
                            {editingMember.id !== user.id && (
                                <div className="mb-4 form-check">
                                    <input 
                                        type="checkbox" 
                                        className="form-check-input"
                                        id="edit-is-active"
                                        checked={editForm.is_active}
                                        onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                                    />
                                    <label htmlFor="edit-is-active" className="form-check-label cursor-pointer">
                                        Account is Active
                                    </label>
                                </div>
                            )}
                            <div className="d-flex justify-content-end gap-2">
                                <button type="button" className="btn-cancel-white" onClick={() => setEditingMember(null)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-gradient-primary border-0 shadow-sm text-white">
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DELETE MEMBER MODAL */}
            {deletingMember && (
                <div className="modal-overlay d-flex align-items-center justify-content-center position-fixed w-100 h-100 top-0 start-0 z-3 bg-dark bg-opacity-50">
                    <div className="modal-card bg-white rounded shadow-lg p-4 w-100" style={{ maxWidth: '400px' }}>
                        <div className="modal-header d-flex justify-content-between align-items-center mb-3">
                            <h5 className="mb-0 font-weight-bold text-danger">Delete Team Member</h5>
                            <button className="btn-close" onClick={() => setDeletingMember(null)}></button>
                        </div>
                        <div className="mb-4">
                            <p className="mb-1">Are you sure you want to delete <strong>{deletingMember.name || deletingMember.username}</strong>?</p>
                            <p className="text-muted small mb-0">This action is permanent and cannot be undone.</p>
                        </div>
                        <div className="d-flex justify-content-end gap-2">
                            <button className="btn-cancel-white" onClick={() => setDeletingMember(null)}>
                                Cancel
                            </button>
                            <button className="btn btn-danger border-0 shadow-sm" onClick={handleDeleteConfirm}>
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
