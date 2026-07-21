/* eslint-disable no-unused-vars, react-hooks/exhaustive-deps, react-hooks/rules-of-hooks */
import { useEffect, useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getAvatarStyle } from '../utils/avatar';
import { masterDataService } from '../services/masterDataService';

const Settings = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const location = useLocation();

    const isSuperAdmin = user?.role === 'SUPERADMIN';
    const isAdmin = user?.role === 'ADMIN';
    const canManage = isSuperAdmin || isAdmin;

    const tabs = useMemo(() => [
        { id: 'sbu', label: 'SBU', endpoint: '/sbus/', field: 'name', displayField: 'SBU Name', cacheKey: 'sbus' },
        { id: 'division', label: 'Division', endpoint: '/divisions/', field: 'name', displayField: 'Division Name', cacheKey: 'divisions' },
        { id: 'fg', label: 'FG Type', endpoint: '/fgs/', field: 'fg_type', displayField: 'FG Type', cacheKey: 'fgs' },
        { id: 'rfq', label: 'RFQ', endpoint: '/rfqs/', field: 'name', displayField: 'RFQ Name', cacheKey: 'rfqs' },
        { id: 'customer', label: 'Customer', endpoint: '/customers/', field: 'name', displayField: 'RFQ Customer Name', cacheKey: 'customers' },
        { id: 'mail', label: 'Notification Mail', endpoint: '/mails/', field: 'email', displayField: 'Mail Id' },
    ], []);

    const [activeTab, setActiveTab] = useState('sbu');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const pageSize = 10;

    // Search state variable
    const [search, setSearch] = useState('');

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
        try {
            const res = await API.get(
                `${currentTab.endpoint}?page=${page}&page_size=${pageSize}&search=${encodeURIComponent(search)}`
            );
            const responseData = res.data.success ? res.data.data : res.data;
            if (responseData && responseData.results) {
                setItems(responseData.results);
                setTotalCount(responseData.count || 0);
            } else {
                setItems(Array.isArray(responseData) ? responseData : []);
                setTotalCount(Array.isArray(responseData) ? responseData.length : 0);
            }
        } catch (err) {
            showToast(`Failed to fetch ${currentTab.label} items.`, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Reset page and search when activeTab changes
    useEffect(() => {
        setPage(1);
        setSearch('');
    }, [activeTab]);

    // Fetch items with debounced search
    useEffect(() => {
        setLoading(true);
        const delayDebounce = setTimeout(() => {
            fetchItems();
        }, 300);
        return () => clearTimeout(delayDebounce);
    }, [activeTab, page, search]);

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
                masterDataService.invalidate(currentTab.cacheKey);
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
                masterDataService.invalidate(currentTab.cacheKey);
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
                masterDataService.invalidate(currentTab.cacheKey);
                fetchItems();
            }
        } catch (err) {
            showToast(err.response?.data?.error || `Failed to delete ${currentTab.label}.`, 'error');
        }
    };

    return (
        <div className="page container-fluid px-4 py-4">
            <div className="page-header d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 className="page-title h3 font-weight-bold mb-1">Configuration Settings</h1>
                    <p className="page-subtitle text-muted mb-0">Manage organization lookups and directories</p>
                </div>
                {canManage && (
                    <button 
                        className="btn btn-gradient-primary d-flex align-items-center gap-2 border-0 shadow-sm" 
                        onClick={handleAddClick}
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
            <div className="settings-menu-tabs overflow-auto">
                {tabs.map((tab) => {
                    const isActive = tab.id === activeTab;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`settings-tab-btn text-nowrap ${isActive ? 'settings-tab-btn-active' : ''}`}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Search Bar for Configurations */}
            <div className="row mb-4">
                <div className="col-md-4">
                    <div className="input-group">
                        <span className="input-group-text bg-white border-end-0">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted">
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                        </span>
                        <input
                            type="text"
                            className="form-control border-start-0 ps-0"
                            placeholder={`Search ${currentTab.label}...`}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {loading && items.length === 0 ? (
                <div className="d-flex flex-column align-items-center justify-content-center min-vh-50">
                    <div className="page-loader-spinner mb-3"></div>
                    <div className="text-muted font-weight-bold">Loading {currentTab.label} list...</div>
                </div>
            ) : (
                <div className="card shadow-sm border-0 overflow-hidden">
                    <div className="table-responsive">
                        <table className="table table-hover mb-0 data-table">
                            <thead className="bg-light">
                                <tr>
                                    <th className="w-50 text-uppercase text-secondary font-weight-bold">{currentTab.displayField}</th>
                                    <th className="text-uppercase text-secondary font-weight-bold">Created At</th>
                                    {canManage && <th className="text-end text-uppercase text-secondary font-weight-bold">Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan={canManage ? 3 : 2} className="text-center p-5 text-muted">
                                            No {currentTab.label} items configured.
                                        </td>
                                    </tr>
                                ) : (
                                    items.map((item) => (
                                        <tr key={item.id}>
                                            <td className="font-weight-bold align-middle">
                                                <div className="d-flex align-items-center gap-3">
                                                    <div 
                                                        className="avatar-circle shadow-sm flex-shrink-0"
                                                        style={{
                                                            width: '32px',
                                                            height: '32px',
                                                            background: getAvatarStyle(item[currentTab.field] || '').background,
                                                            color: getAvatarStyle(item[currentTab.field] || '').color,
                                                            fontSize: '0.8rem'
                                                        }}
                                                    >
                                                        {(item[currentTab.field] || '').substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <span>{item[currentTab.field] || ''}</span>
                                                </div>
                                            </td>
                                            <td className="text-muted align-middle">
                                                {new Date(item.created_at).toLocaleDateString(undefined, {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </td>
                                            {canManage && (
                                                <td className="text-end align-middle">
                                                    <div className="d-flex gap-2 justify-content-end">
                                                        <button 
                                                            className="btn btn-link text-secondary p-1 text-decoration-none" 
                                                            onClick={() => handleEditClick(item)}
                                                            title={`Edit ${currentTab.label}`}
                                                        >
                                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                                <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                            </svg>
                                                        </button>
                                                        <button 
                                                            className="btn btn-link text-danger p-1 text-decoration-none" 
                                                            onClick={() => handleDeleteClick(item)}
                                                            title={`Delete ${currentTab.label}`}
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
            )}

            {/* ADD MODAL */}
            {isAddOpen && (
                <div className="modal-overlay d-flex align-items-center justify-content-center position-fixed w-100 h-100 top-0 start-0 z-3 bg-dark bg-opacity-50">
                    <div className="modal-card bg-white rounded shadow-lg p-4 w-100" style={{ maxWidth: '500px' }}>
                        <div className="modal-header d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
                            <h5 className="mb-0 font-weight-bold">Add {currentTab.label}</h5>
                            <button className="btn-close" onClick={() => setIsAddOpen(false)}></button>
                        </div>
                        <form onSubmit={handleAddSubmit}>
                            <div className="mb-4">
                                <label className="form-label font-weight-bold text-secondary">{currentTab.displayField}</label>
                                <input
                                    type={currentTab.id === 'mail' ? 'email' : 'text'}
                                    className="form-control"
                                    placeholder={`Enter ${currentTab.displayField.toLowerCase()}`}
                                    value={formValue}
                                    onChange={(e) => setFormValue(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="d-flex justify-content-end gap-2">
                                <button type="button" className="btn-cancel-white" onClick={() => setIsAddOpen(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-gradient-primary border-0 shadow-sm text-white">
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT MODAL */}
            {editingItem && (
                <div className="modal-overlay d-flex align-items-center justify-content-center position-fixed w-100 h-100 top-0 start-0 z-3 bg-dark bg-opacity-50">
                    <div className="modal-card bg-white rounded shadow-lg p-4 w-100" style={{ maxWidth: '500px' }}>
                        <div className="modal-header d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
                            <h5 className="mb-0 font-weight-bold">Edit {currentTab.label}</h5>
                            <button className="btn-close" onClick={() => setEditingItem(null)}></button>
                        </div>
                        <form onSubmit={handleEditSubmit}>
                            <div className="mb-4">
                                <label className="form-label font-weight-bold text-secondary">{currentTab.displayField}</label>
                                <input
                                    type={currentTab.id === 'mail' ? 'email' : 'text'}
                                    className="form-control"
                                    placeholder={`Enter ${currentTab.displayField.toLowerCase()}`}
                                    value={formValue}
                                    onChange={(e) => setFormValue(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="d-flex justify-content-end gap-2">
                                <button type="button" className="btn-cancel-white" onClick={() => setEditingItem(null)}>
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

            {/* DELETE CONFIRM MODAL */}
            {deletingItem && (
                <div className="modal-overlay d-flex align-items-center justify-content-center position-fixed w-100 h-100 top-0 start-0 z-3 bg-dark bg-opacity-50">
                    <div className="modal-card bg-white rounded shadow-lg p-4 w-100" style={{ maxWidth: '400px' }}>
                        <div className="modal-header d-flex justify-content-between align-items-center mb-3">
                            <h5 className="mb-0 font-weight-bold text-danger">Delete {currentTab.label}</h5>
                            <button className="btn-close" onClick={() => setDeletingItem(null)}></button>
                        </div>
                        <div className="mb-4">
                            <p className="mb-1">Are you sure you want to delete <strong>{deletingItem[currentTab.field]}</strong>?</p>
                            <p className="text-muted small mb-0">This action is permanent and cannot be undone.</p>
                        </div>
                        <div className="d-flex justify-content-end gap-2">
                            <button className="btn-cancel-white" onClick={() => setDeletingItem(null)}>
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

export default Settings;
