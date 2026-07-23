/* eslint-disable no-unused-vars, react-hooks/exhaustive-deps, react-hooks/rules-of-hooks */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const CreateMember = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        username: '',
        name: '',
        role: '',
        password: '',
    });
    const [loading, setLoading] = useState(false);

    const isSuperAdmin = user?.role === 'SUPERADMIN';
    const isAdmin = user?.role === 'ADMIN';
    const canManage = isSuperAdmin || isAdmin;

    useEffect(() => {
        if (!canManage) {
            showToast('You do not have permission to access this page.', 'error');
            navigate('/dashboard');
            return;
        }
        // Set default role selection
        if (isSuperAdmin) {
            setForm((prev) => ({ ...prev, role: 'ADMIN' }));
        } else if (isAdmin) {
            setForm((prev) => ({ ...prev, role: 'RFQ_TRACKER' }));
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await API.post('/users/', form);
            if (res.data.success) {
                showToast('Team member created successfully!', 'success');
                navigate('/team');
            }
        } catch (err) {
            const errorMsg = err.response?.data?.error || err.response?.data?.errors?.non_field_errors?.[0] || 'Failed to create member.';
            showToast(errorMsg, 'error');
        } finally {
            setLoading(false);
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

    return (
        <div className="page">
            <div className="page-header mb-4">
                <h1 className="page-title">Create Member</h1>
                <p className="page-subtitle">Add a new user to the organization</p>
            </div>

            <div className="card shadow-sm p-4 mx-auto" style={{ maxWidth: '540px' }}>
                <form onSubmit={handleSubmit}>
                    <div className="form-group mb-3">
                        <label className="form-label">Username</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Enter username"
                            value={form.username}
                            onChange={(e) => setForm({ ...form, username: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group mb-3">
                        <label className="form-label">Full Name</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Enter full name"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                        />
                    </div>
                    <div className="form-group mb-3">
                        <label className="form-label">Role</label>
                        <select
                            className="form-input form-control bg-transparent text-dark w-100"
                            value={form.role}
                            onChange={(e) => setForm({ ...form, role: e.target.value })}
                            required
                        >
                            {getAllowedRoles().map((role) => (
                                <option key={role.value} value={role.value} className="text-dark bg-white">
                                    {role.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group mb-4">
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="Enter password"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            required
                        />
                    </div>
                    <div className="d-flex gap-2 justify-content-end">
                        <button
                            type="button"
                            className="btn-cancel-white px-4"
                            onClick={() => navigate('/team')}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-gradient-primary d-flex align-items-center gap-2 border-0 text-white"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="spinner"></span>
                            ) : null}
                            Create Account
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateMember;
