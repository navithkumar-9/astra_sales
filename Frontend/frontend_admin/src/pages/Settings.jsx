import { useEffect, useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Settings = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const location = useLocation();

    const isSuperAdmin = user?.role === 'SUPERADMIN';
    const isAdmin = user?.role === 'ADMIN';
    const canManage = isSuperAdmin || isAdmin;

    const tabs = useMemo(() => [
        { id: 'sbu', label: 'SBU', endpoint: '/sbus/', field: 'name', displayField: 'SBU Name' },
        { id: 'division', label: 'Division', endpoint: '/divisions/', field: 'name', displayField: 'Division Name' },
        { id: 'fg', label: 'FG Type', endpoint: '/fgs/', field: 'fg_type', displayField: 'FG Type' },
        { id: 'rfq', label: 'RFQ', endpoint: '/rfqs/', field: 'name', displayField: 'RFQ Name' },
        { id: 'customer', label: 'Customer', endpoint: '/customers/', field: 'name', displayField: 'RFQ Customer Name' },
        { id: 'mail', label: 'Notification Mail', endpoint: '/mails/', field: 'email', displayField: 'Mail Id' },
    ], []);

    const [activeTab, setActiveTab] = useState('sbu');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const tab = queryParams.get('tab');
        if (tab && tabs.some(t => t.id === tab)) {
            setActiveTab(tab);
        }
    }, [location.search, tabs]);

    // Modal forms state
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [deletingItem, setDeletingItem] = useState(null);

    const [formValue, setFormValue] = useState('');

    const currentTab = useMemo(() => tabs.find(t => t.id === activeTab), [activeTab, tabs]);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const res = await API.get(currentTab.endpoint);
            // DefaultRouter returns list directly, but let's check envelope first
            const data = res.data.success ? res.data.data : res.data;
            setItems(Array.isArray(data) ? data : []);
        } catch (err) {
            showToast(`Failed to fetch ${currentTab.label} items.`, 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, [activeTab]);

    const handleAddClick = () => {
        setFormValue('');
        setIsAddOpen(true);
    };

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        if (!formValue.trim()) return;
        try {
            const payload = { [currentTab.field]: formValue.trim() };
            const res = await API.post(currentTab.endpoint, payload);
            if (res.status === 201 || res.data.success) {
                showToast(`${currentTab.label} added successfully.`, 'success');
                setIsAddOpen(false);
                fetchItems();
            }
        } catch (err) {
            const errorMsg = err.response?.data?.error || err.response?.data?.[currentTab.field]?.[0] || `Failed to add ${currentTab.label}.`;
            showToast(errorMsg, 'error');
        }
    };

    const handleEditClick = (item) => {
        setEditingItem(item);
        setFormValue(item[currentTab.field]);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!formValue.trim() || !editingItem) return;
        try {
            const payload = { [currentTab.field]: formValue.trim() };
            const res = await API.put(`${currentTab.endpoint}${editingItem.id}/`, payload);
            if (res.status === 200 || res.data.success) {
                showToast(`${currentTab.label} updated successfully.`, 'success');
                setEditingItem(null);
                fetchItems();
            }
        } catch (err) {
            const errorMsg = err.response?.data?.error || err.response?.data?.[currentTab.field]?.[0] || `Failed to update ${currentTab.label}.`;
            showToast(errorMsg, 'error');
        }
    };

    const handleDeleteClick = (item) => {
        setDeletingItem(item);
    };

    const handleDeleteConfirm = async () => {
        if (!deletingItem) return;
        try {
            const res = await API.delete(`${currentTab.endpoint}${deletingItem.id}/`);
            if (res.status === 204 || res.status === 200 || res.data.success) {
                showToast(`${currentTab.label} deleted successfully.`, 'success');
                setDeletingItem(null);
                fetchItems();
            }
        } catch (err) {
            showToast(err.response?.data?.error || `Failed to delete ${currentTab.label}.`, 'error');
        }
    };

    return (
        <div className="page">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 className="page-title">Configuration Settings</h1>
                    <p className="page-subtitle">Manage organization lookups and directories</p>
                </div>
                {canManage && (
                    <button 
                        className="btn-primary-gradient" 
                        onClick={handleAddClick}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.6rem 1.2rem', borderRadius: '8px', border: 'none', color: '#fff', cursor: 'pointer' }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Add {currentTab.label}
                    </button>
                )}
            </div>

            {/* Tabs List */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '4px' }}>
                {tabs.map((tab) => {
                    const isActive = tab.id === activeTab;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                borderBottom: isActive ? '2px solid var(--primary-color)' : '2px solid transparent',
                                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                                padding: '10px 16px',
                                cursor: 'pointer',
                                fontWeight: isActive ? '600' : '400',
                                fontSize: '0.9rem',
                                transition: 'all 0.15s ease',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {loading ? (
                <div className="page" style={{ minHeight: '300px' }}>
                    <div className="page-loader">
                        <div className="page-loader-spinner"></div>
                        <div className="page-loader-text">Loading {currentTab.label} list...</div>
                    </div>
                </div>
            ) : (
                <div className="card" style={{ padding: '0px', overflow: 'hidden' }}>
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '60%' }}>{currentTab.displayField}</th>
                                    <th>Created At</th>
                                    {canManage && <th style={{ textAlign: 'right' }}>Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan={canManage ? 3 : 2} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                            No {currentTab.label} items configured.
                                        </td>
                                    </tr>
                                ) : (
                                    items.map((item) => (
                                        <tr key={item.id}>
                                            <td className="text-bold">{item[currentTab.field]}</td>
                                            <td className="text-muted">
                                                {new Date(item.created_at).toLocaleDateString(undefined, {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </td>
                                            {canManage && (
                                                <td style={{ textAlign: 'right' }}>
                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                        <button 
                                                            className="btn-icon" 
                                                            onClick={() => handleEditClick(item)}
                                                            title={`Edit ${currentTab.label}`}
                                                            style={{ border: 'none', padding: '6px', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)' }}
                                                        >
                                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                                <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                            </svg>
                                                        </button>
                                                        <button 
                                                            className="btn-icon" 
                                                            onClick={() => handleDeleteClick(item)}
                                                            title={`Delete ${currentTab.label}`}
                                                            style={{ border: 'none', padding: '6px', background: 'transparent', cursor: 'pointer', color: '#ff6b6b' }}
                                                        >
                                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <polyline points="3 6 5 6 21 6" />
                                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ADD MODAL */}
            {isAddOpen && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <div className="modal-header">
                            <h2>Add {currentTab.label}</h2>
                            <button className="modal-close" onClick={() => setIsAddOpen(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleAddSubmit}>
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label className="form-label">{currentTab.displayField}</label>
                                <input
                                    type={currentTab.id === 'mail' ? 'email' : 'text'}
                                    className="form-input"
                                    placeholder={`Enter ${currentTab.displayField.toLowerCase()}`}
                                    value={formValue}
                                    onChange={(e) => setFormValue(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-cancel-white" onClick={() => setIsAddOpen(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary-gradient" style={{ border: 'none', color: '#fff', cursor: 'pointer' }}>
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT MODAL */}
            {editingItem && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <div className="modal-header">
                            <h2>Edit {currentTab.label}</h2>
                            <button className="modal-close" onClick={() => setEditingItem(null)}>&times;</button>
                        </div>
                        <form onSubmit={handleEditSubmit}>
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label className="form-label">{currentTab.displayField}</label>
                                <input
                                    type={currentTab.id === 'mail' ? 'email' : 'text'}
                                    className="form-input"
                                    placeholder={`Enter ${currentTab.displayField.toLowerCase()}`}
                                    value={formValue}
                                    onChange={(e) => setFormValue(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-cancel-white" onClick={() => setEditingItem(null)}>
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

            {/* DELETE CONFIRM MODAL */}
            {deletingItem && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <div className="modal-header">
                            <h2>Delete {currentTab.label}</h2>
                            <button className="modal-close" onClick={() => setDeletingItem(null)}>&times;</button>
                        </div>
                        <div style={{ marginBottom: '2rem' }}>
                            <p>Are you sure you want to delete <strong>{deletingItem[currentTab.field]}</strong>?</p>
                            <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '8px' }}>
                                This action is permanent and cannot be undone.
                            </p>
                        </div>
                        <div className="modal-actions">
                            <button className="btn-cancel-white" onClick={() => setDeletingItem(null)}>
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

export default Settings;
