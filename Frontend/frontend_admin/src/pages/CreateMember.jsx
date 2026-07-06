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
            <div className="page-header" style={{ marginBottom: '2rem' }}>
                <h1 className="page-title">Create Member</h1>
                <p className="page-subtitle">Add a new user to the organization</p>
            </div>

            <div className="card" style={{ maxWidth: '540px', margin: '0 auto', padding: '28px' }}>
                <form onSubmit={handleSubmit}>
                    <div className="form-group" style={{ marginBottom: '1.2rem' }}>
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
                    <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                        <label className="form-label">Full Name</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Enter full name"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                        />
                    </div>
                    <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                        <label className="form-label">Role</label>
                        <select
                            className="form-input"
                            value={form.role}
                            onChange={(e) => setForm({ ...form, role: e.target.value })}
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
                    <div className="form-group" style={{ marginBottom: '2rem' }}>
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
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button
                            type="button"
                            className="btn-cancel-white"
                            onClick={() => navigate('/team')}
                            style={{ padding: '0.6rem 1.2rem', borderRadius: '8px' }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-primary-gradient"
                            disabled={loading}
                            style={{ border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            {loading ? (
                                <span className="spinner" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }}></span>
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
