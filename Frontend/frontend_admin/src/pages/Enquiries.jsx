import { useState, useEffect } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getAvatarStyle } from '../utils/avatar';

const Enquiries = () => {
    const { user } = useAuth();
    const { showToast } = useToast();

    // Check role permissions
    const isSuperAdmin = user?.role === 'SUPERADMIN';
    const isAdmin = user?.role === 'ADMIN';
    const isRfqTracker = user?.role === 'RFQ_TRACKER';
    const canCreate = isSuperAdmin || isAdmin || isRfqTracker;
    const canDelete = isSuperAdmin || isAdmin || isRfqTracker;

    const today = new Date().toISOString().split('T')[0];

    // Enquiries listing states
    const [enquiries, setEnquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [search, setSearch] = useState('');
    const pageSize = 10;

    // Modal control states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedEnquiry, setSelectedEnquiry] = useState(null);

    // Form inputs for creation
    const [projectNumber, setProjectNumber] = useState('');
    const [isProjectNumEditable, setIsProjectNumEditable] = useState(false);
    const [rfqDate, setRfqDate] = useState(today);
    const [rfqNo, setRfqNo] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [selectedSbu, setSelectedSbu] = useState('');
    const [projectName, setProjectName] = useState('');
    const [selectedDivision, setSelectedDivision] = useState('');
    const [rfqDueDate, setRfqDueDate] = useState('');
    const [rfqDueTime, setRfqDueTime] = useState('');
    const [rfqAssignDate, setRfqAssignDate] = useState(today);
    const [selectedRfqType, setSelectedRfqType] = useState('');
    const [selectedFgType, setSelectedFgType] = useState('');
    const [selectedSalesRep, setSelectedSalesRep] = useState('');
    
    // Dynamic FG inputs
    const [fgDetails, setFgDetails] = useState([{ fg_part_no: '', description: '', qty: '' }]);
    const [previousProjectNumber, setPreviousProjectNumber] = useState('');

    // Dropdown list data
    const [customers, setCustomers] = useState([]);
    const [sbus, setSbus] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [rfqTypes, setRfqTypes] = useState([]);
    const [fgTypes, setFgTypes] = useState([]);
    const [salesReps, setSalesReps] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    // Helper to fetch latest enquiry project number and generate incremented number (+1)
    const fetchLatestProjectNumber = async () => {
        try {
            const res = await API.get('/enquiries/?page_size=1');
            const responseData = res.data.success ? res.data.data : res.data;
            const latestList = responseData.results || responseData;
            if (latestList && latestList.length > 0) {
                const prevProjNum = latestList[0].project_number;
                setPreviousProjectNumber(prevProjNum);
                
                // Extract numeric portion
                const match = prevProjNum.match(/\d+/);
                if (match) {
                    const nextVal = parseInt(match[0]) + 1;
                    const prefix = prevProjNum.replace(/\d+/, '');
                    setProjectNumber(`${prefix}${nextVal}`);
                } else {
                    setProjectNumber('TISPL-4001');
                }
            } else {
                setPreviousProjectNumber('None (First Enquiry)');
                setProjectNumber('TISPL-4001');
            }
        } catch (err) {
            setPreviousProjectNumber('N/A');
            setProjectNumber(`TISPL-${Math.floor(1000 + Math.random() * 9000)}`);
        }
    };

    // Fetch enquiries list
    const fetchEnquiries = async () => {
        try {
            const res = await API.get(
                `/enquiries/?page=${page}&page_size=${pageSize}&search=${encodeURIComponent(search)}`
            );
            const responseData = res.data.success ? res.data.data : res.data;
            if (responseData && responseData.results) {
                setEnquiries(responseData.results);
                setTotalCount(responseData.count || 0);
            } else {
                setEnquiries(Array.isArray(responseData) ? responseData : []);
                setTotalCount(Array.isArray(responseData) ? responseData.length : 0);
            }
        } catch (err) {
            showToast('Failed to fetch enquiries.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Reset pagination on search change
    useEffect(() => {
        setPage(1);
    }, [search]);

    // Fetch listing on change
    useEffect(() => {
        setLoading(true);
        const delayDebounce = setTimeout(() => {
            fetchEnquiries();
        }, 300);
        return () => clearTimeout(delayDebounce);
    }, [page, search]);

    // Fetch dropdown data when create modal opens (not on every page load)
    const fetchDropdowns = async () => {
        try {
            const [custRes, sbuRes, divRes, rfqRes, fgRes, salesRes] = await Promise.all([
                API.get('/customers/?page_size=100'),
                API.get('/sbus/?page_size=100'),
                API.get('/divisions/?page_size=100'),
                API.get('/rfqs/?page_size=100'),
                API.get('/fgs/?page_size=100'),
                API.get('/users/?role=SALES_REP&page_size=100')
            ]);

            setCustomers(custRes.data.success ? custRes.data.data.results || custRes.data.data : custRes.data.results || custRes.data);
            setSbus(sbuRes.data.success ? sbuRes.data.data.results || sbuRes.data.data : sbuRes.data.results || sbuRes.data);
            setDivisions(divRes.data.success ? divRes.data.data.results || divRes.data.data : divRes.data.results || divRes.data);
            setRfqTypes(rfqRes.data.success ? rfqRes.data.data.results || rfqRes.data.data : rfqRes.data.results || rfqRes.data);
            setFgTypes(fgRes.data.success ? fgRes.data.data.results || fgRes.data.data : fgRes.data.results || fgRes.data);
            setSalesReps(salesRes.data.success ? salesRes.data.data.results || salesRes.data.data : salesRes.data.results || salesRes.data);
        } catch (err) {
            showToast('Failed to load lookup configurations.', 'error');
        }
    };

    // Add enquiry row
    const handleFgDetailChange = (index, field, value) => {
        const newDetails = [...fgDetails];
        newDetails[index][field] = value;
        setFgDetails(newDetails);
    };

    const addFgRow = () => {
        setFgDetails([...fgDetails, { fg_part_no: '', description: '', qty: '' }]);
    };

    const removeFgRow = (index) => {
        if (fgDetails.length > 1) {
            setFgDetails(fgDetails.filter((_, i) => i !== index));
        }
    };

    const handleDeleteEnquiry = async (id) => {
        if (window.confirm("Are you sure you want to delete this enquiry? All associated items will be deleted cascade.")) {
            try {
                await API.delete(`/enquiries/${id}/`);
                showToast("Enquiry deleted successfully.", "success");
                fetchEnquiries();
            } catch (err) {
                showToast("Failed to delete enquiry.", "error");
            }
        }
    };

    const openCreateModal = () => {
        fetchDropdowns();
        fetchLatestProjectNumber();
        setIsProjectNumEditable(false);
        setRfqDate(today);
        setRfqNo('');
        setSelectedCustomer('');
        setSelectedSbu('');
        setProjectName('');
        setSelectedDivision('');
        setRfqDueDate('');
        setRfqDueTime('');
        setRfqAssignDate(today);
        setSelectedRfqType('');
        setSelectedFgType('');
        setSelectedSalesRep('');
        setFgDetails([{ fg_part_no: '', description: '', qty: '' }]);
        setShowCreateModal(true);
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!rfqNo || !selectedCustomer || !selectedSbu || !projectName || !selectedDivision || !rfqDueDate || !rfqDueTime || !selectedRfqType || !selectedFgType || !selectedSalesRep) {
            showToast('Please fill in all required fields.', 'warning');
            return;
        }

        for (const item of fgDetails) {
            if (!item.fg_part_no || !item.qty) {
                showToast('Please specify FG Part No and Quantity for all rows.', 'warning');
                return;
            }
        }

        setSubmitting(true);
        const payload = {
            project_number: projectNumber,
            rfq_date: rfqDate,
            rfq_no: rfqNo,
            customer: parseInt(selectedCustomer),
            sbu: parseInt(selectedSbu),
            project_name: projectName,
            division: parseInt(selectedDivision),
            rfq_due_date: rfqDueDate,
            rfq_due_time: rfqDueTime,
            rfq_assign_date: rfqAssignDate,
            rfq_type: parseInt(selectedRfqType),
            fg_type: parseInt(selectedFgType),
            sales_rep: parseInt(selectedSalesRep),
            fg_details: fgDetails.map(item => ({
                fg_part_no: item.fg_part_no,
                description: item.description || '',
                qty: parseInt(item.qty)
            }))
        };

        try {
            await API.post('/enquiries/', payload);
            showToast('New enquiry created successfully!', 'success');
            setShowCreateModal(false);
            fetchEnquiries();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to create enquiry.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleViewEnquiry = (enquiry) => {
        setSelectedEnquiry(enquiry);
        setShowViewModal(true);
    };

    const getStatusClass = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed':
                return 'bg-success-subtle text-success';
            case 'rejected':
                return 'bg-danger-subtle text-danger';
            case 'pending':
                return 'bg-warning-subtle text-warning';
            default:
                return 'bg-primary-subtle text-primary';
        }
    };

    return (
        <div className="page container-fluid px-4 py-4">
            <div className="page-header d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 className="page-title h3 font-weight-bold mb-1">Enquiry Tracker</h1>
                    <p className="page-subtitle text-muted mb-0">List and manage sales request enquiries</p>
                </div>
                {canCreate && (
                    <button 
                        className="btn btn-gradient-primary d-flex align-items-center gap-2 border-0 shadow-sm"
                        onClick={openCreateModal}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Add Enquiry
                    </button>
                )}
            </div>

            {/* Modern Search Input */}
            <div className="row mb-4">
                <div className="col-md-4">
                    <div className="modern-search-wrapper shadow-sm">
                        <span className="modern-search-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-muted">
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                        </span>
                        <input
                            type="text"
                            className="form-control modern-search-input border-0"
                            placeholder="Search by project no or rfq..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Enquiries List Table */}
            {loading && enquiries.length === 0 ? (
                <div className="d-flex flex-column align-items-center justify-content-center min-vh-50 mt-5">
                    <div className="page-loader-spinner mb-3"></div>
                    <div className="text-muted font-weight-bold">Loading enquiries...</div>
                </div>
            ) : (
                <div className="card shadow border-0 overflow-hidden" style={{ borderRadius: '16px' }}>
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0" style={{ borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #edf2f7' }}>
                                <tr>
                                    <th className="text-uppercase text-secondary font-weight-bold py-3 ps-4" style={{ fontSize: '0.72rem', letterSpacing: '0.8px' }}>S.No</th>
                                    <th className="text-uppercase text-secondary font-weight-bold py-3" style={{ fontSize: '0.72rem', letterSpacing: '0.8px' }}>Project No</th>
                                    <th className="text-uppercase text-secondary font-weight-bold py-3" style={{ fontSize: '0.72rem', letterSpacing: '0.8px' }}>RFQ Date</th>
                                    <th className="text-uppercase text-secondary font-weight-bold py-3" style={{ fontSize: '0.72rem', letterSpacing: '0.8px' }}>RFQ No</th>
                                    <th className="text-uppercase text-secondary font-weight-bold py-3" style={{ fontSize: '0.72rem', letterSpacing: '0.8px' }}>Customer Name</th>
                                    <th className="text-uppercase text-secondary font-weight-bold py-3" style={{ fontSize: '0.72rem', letterSpacing: '0.8px' }}>Division</th>
                                    <th className="text-uppercase text-secondary font-weight-bold py-3" style={{ fontSize: '0.72rem', letterSpacing: '0.8px' }}>ED of Engg</th>
                                    <th className="text-uppercase text-secondary font-weight-bold py-3" style={{ fontSize: '0.72rem', letterSpacing: '0.8px' }}>ED of Costing</th>
                                    <th className="text-uppercase text-secondary font-weight-bold py-3" style={{ fontSize: '0.72rem', letterSpacing: '0.8px' }}>ED of Sales</th>
                                    <th className="text-uppercase text-secondary font-weight-bold py-3" style={{ fontSize: '0.72rem', letterSpacing: '0.8px' }}>Status</th>
                                    <th className="text-uppercase text-secondary font-weight-bold text-center py-3 pe-4" style={{ fontSize: '0.72rem', letterSpacing: '0.8px' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody style={{ background: '#fff' }}>
                                {enquiries.length === 0 ? (
                                    <tr>
                                        <td colSpan="11" className="text-center p-5 text-muted">
                                            No enquiries registered.
                                        </td>
                                    </tr>
                                ) : (
                                    enquiries.map((enq, idx) => (
                                        <tr key={enq.id} className="modern-table-row">
                                            <td className="ps-4 py-3 align-middle text-secondary font-weight-medium">
                                                <span className="badge bg-light text-secondary rounded-circle p-2" style={{ width: '26px', height: '26px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    {(page - 1) * pageSize + idx + 1}
                                                </span>
                                            </td>
                                            <td className="py-3 align-middle font-weight-bold text-dark">
                                                {enq.project_number}
                                            </td>
                                            <td className="py-3 align-middle">
                                                <div className="d-flex align-items-center gap-1 text-secondary">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-75">
                                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                                        <line x1="16" y1="2" x2="16" y2="6" />
                                                        <line x1="8" y1="2" x2="8" y2="6" />
                                                        <line x1="3" y1="10" x2="21" y2="10" />
                                                    </svg>
                                                    <span>{enq.rfq_date}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 align-middle font-weight-medium text-dark">{enq.rfq_no}</td>
                                            <td className="py-3 align-middle font-weight-semibold text-dark">
                                                {enq.customer?.name || 'N/A'}
                                            </td>
                                            <td className="py-3 align-middle text-secondary font-weight-medium">{enq.division?.name || 'N/A'}</td>
                                            <td className="py-3 align-middle text-muted">
                                                {enq.ed_of_engg ? (
                                                    <div className="d-flex align-items-center gap-1">
                                                        <span className="bullet-dot bg-success" style={{ width: '6px', height: '6px', borderRadius: '50%' }}></span>
                                                        <span>{enq.ed_of_engg}</span>
                                                    </div>
                                                ) : 'N/A'}
                                            </td>
                                            <td className="py-3 align-middle text-muted">
                                                {enq.ed_of_costing ? (
                                                    <div className="d-flex align-items-center gap-1">
                                                        <span className="bullet-dot bg-warning" style={{ width: '6px', height: '6px', borderRadius: '50%' }}></span>
                                                        <span>{enq.ed_of_costing}</span>
                                                    </div>
                                                ) : 'N/A'}
                                            </td>
                                            <td className="py-3 align-middle text-muted">
                                                {enq.ed_of_sales ? (
                                                    <div className="d-flex align-items-center gap-1">
                                                        <span className="bullet-dot bg-info" style={{ width: '6px', height: '6px', borderRadius: '50%' }}></span>
                                                        <span>{enq.ed_of_sales}</span>
                                                    </div>
                                                ) : 'N/A'}
                                            </td>
                                            <td className="py-3 align-middle">
                                                <span className={`badge rounded-pill ${getStatusClass(enq.status)} px-3 py-2`} style={{ fontSize: '0.72rem', fontWeight: '600' }}>
                                                    {enq.status}
                                                </span>
                                            </td>
                                            <td className="py-3 align-middle text-center pe-4">
                                                <div className="d-flex gap-2 justify-content-center">
                                                    <button
                                                        className="btn btn-action-view rounded-circle shadow-sm"
                                                        onClick={() => handleViewEnquiry(enq)}
                                                        title="View Enquiry Details"
                                                    >
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                            <circle cx="12" cy="12" r="3" />
                                                        </svg>
                                                    </button>
                                                    {canDelete && (
                                                        <button
                                                            className="btn btn-action-delete rounded-circle shadow-sm"
                                                            onClick={() => handleDeleteEnquiry(enq.id)}
                                                            title="Delete Enquiry"
                                                        >
                                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                                <polyline points="3 6 5 6 21 6" />
                                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
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

            {/* Create Enquiry Modal */}
            {showCreateModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg">
                            <div className="modal-header text-white border-0 py-3 d-flex align-items-center justify-content-between" style={{ background: 'linear-gradient(135deg, #a561ff, #7f39fb)' }}>
                                <h5 className="modal-title font-weight-bold mb-0">New Enquiry Request</h5>
                                <div className="d-flex align-items-center gap-3">
                                    {previousProjectNumber && (
                                        <span className="badge bg-white text-primary font-weight-bold px-2.5 py-1.5 shadow-sm" style={{ fontSize: '0.72rem', borderRadius: '6px' }}>
                                            Prev Proj: {previousProjectNumber}
                                        </span>
                                    )}
                                    <button type="button" className="btn-close btn-close-white" onClick={() => setShowCreateModal(false)}></button>
                                </div>
                            </div>
                            <form onSubmit={handleCreateSubmit} className="modal-body p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                                <div className="row g-3 mb-4">
                                    <div className="col-md-4">
                                        <label className="form-label font-weight-semibold">Project Number</label>
                                        <div className="input-group">
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={projectNumber}
                                                onChange={(e) => setProjectNumber(e.target.value)}
                                                disabled={!isProjectNumEditable}
                                            />
                                            <button
                                                type="button"
                                                className={`btn ${isProjectNumEditable ? 'btn-gradient-primary text-white border-0' : 'btn-outline-secondary'}`}
                                                onClick={() => setIsProjectNumEditable(!isProjectNumEditable)}
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                    <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="col-md-8">
                                        <label className="form-label font-weight-semibold">Project Name <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Enter project name"
                                            value={projectName}
                                            onChange={(e) => setProjectName(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="row g-3 mb-4">
                                    <div className="col-md-4">
                                        <label className="form-label font-weight-semibold">RFQ Date <span className="text-danger">*</span></label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            value={rfqDate}
                                            onChange={(e) => setRfqDate(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label font-weight-semibold">RFQ No <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="RFQ No"
                                            value={rfqNo}
                                            onChange={(e) => setRfqNo(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label font-weight-semibold">Customer <span className="text-danger">*</span></label>
                                        <select
                                            className="form-select"
                                            value={selectedCustomer}
                                            onChange={(e) => setSelectedCustomer(e.target.value)}
                                            required
                                        >
                                            <option value="">Select Customer</option>
                                            {customers.map((c) => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="row g-3 mb-4">
                                    <div className="col-md-4">
                                        <label className="form-label font-weight-semibold">SBU <span className="text-danger">*</span></label>
                                        <select
                                            className="form-select"
                                            value={selectedSbu}
                                            onChange={(e) => setSelectedSbu(e.target.value)}
                                            required
                                        >
                                            <option value="">Select SBU</option>
                                            {sbus.map((s) => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label font-weight-semibold">Division <span className="text-danger">*</span></label>
                                        <select
                                            className="form-select"
                                            value={selectedDivision}
                                            onChange={(e) => setSelectedDivision(e.target.value)}
                                            required
                                        >
                                            <option value="">Select Division</option>
                                            {divisions.map((d) => (
                                                <option key={d.id} value={d.id}>{d.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label font-weight-semibold">Sales Rep <span className="text-danger">*</span></label>
                                        <select
                                            className="form-select"
                                            value={selectedSalesRep}
                                            onChange={(e) => setSelectedSalesRep(e.target.value)}
                                            required
                                        >
                                            <option value="">Select Sales Rep</option>
                                            {salesReps.map((s) => (
                                                <option key={s.id} value={s.id}>{s.name || s.username}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="row g-3 mb-4">
                                    <div className="col-md-4">
                                        <label className="form-label font-weight-semibold">RFQ Type <span className="text-danger">*</span></label>
                                        <select
                                            className="form-select"
                                            value={selectedRfqType}
                                            onChange={(e) => setSelectedRfqType(e.target.value)}
                                            required
                                        >
                                            <option value="">Select RFQ Type</option>
                                            {rfqTypes.map((r) => (
                                                <option key={r.id} value={r.id}>{r.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label font-weight-semibold">FG Type <span className="text-danger">*</span></label>
                                        <select
                                            className="form-select"
                                            value={selectedFgType}
                                            onChange={(e) => setSelectedFgType(e.target.value)}
                                            required
                                        >
                                            <option value="">Select FG Type</option>
                                            {fgTypes.map((f) => (
                                                <option key={f.id} value={f.id}>{f.fg_type}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label font-weight-semibold">RFQ Assign Date</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            value={rfqAssignDate}
                                            readOnly
                                        />
                                    </div>
                                </div>

                                <div className="row g-3 mb-4">
                                    <div className="col-md-6">
                                        <label className="form-label font-weight-semibold">RFQ Due Date <span className="text-danger">*</span></label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            value={rfqDueDate}
                                            onChange={(e) => setRfqDueDate(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label font-weight-semibold">RFQ Due Time <span className="text-danger">*</span></label>
                                        <input
                                            type="time"
                                            className="form-control"
                                            value={rfqDueTime}
                                            onChange={(e) => setRfqDueTime(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="mb-2">
                                    <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                                        <h6 className="font-weight-bold text-primary mb-0">FG Details</h6>
                                        <button
                                            type="button"
                                            className="btn btn-gradient-primary btn-sm d-flex align-items-center gap-1 border-0"
                                            onClick={addFgRow}
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <line x1="12" y1="5" x2="12" y2="19" />
                                                <line x1="5" y1="12" x2="19" y2="12" />
                                            </svg>
                                            Add FG
                                        </button>
                                    </div>
                                    {fgDetails.map((detail, idx) => (
                                        <div key={idx} className="row g-2 align-items-end mb-2">
                                            <div className="col-md-4">
                                                <input
                                                    type="text"
                                                    className="form-control form-control-sm"
                                                    placeholder="FG Part No *"
                                                    value={detail.fg_part_no}
                                                    onChange={(e) => handleFgDetailChange(idx, 'fg_part_no', e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="col-md-5">
                                                <input
                                                    type="text"
                                                    className="form-control form-control-sm"
                                                    placeholder="Description"
                                                    value={detail.description}
                                                    onChange={(e) => handleFgDetailChange(idx, 'description', e.target.value)}
                                                />
                                            </div>
                                            <div className="col-md-2">
                                                <input
                                                    type="number"
                                                    className="form-control form-control-sm"
                                                    placeholder="Qty *"
                                                    min="1"
                                                    value={detail.qty}
                                                    onChange={(e) => handleFgDetailChange(idx, 'qty', e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="col-md-1 text-end">
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-danger w-100"
                                                    onClick={() => removeFgRow(idx)}
                                                    disabled={fgDetails.length === 1}
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <polyline points="3 6 5 6 21 6" />
                                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="d-flex gap-2 justify-content-end mt-4 pt-3 border-top">
                                    <button
                                        type="button"
                                        className="btn btn-cancel-white border shadow-sm px-4"
                                        onClick={() => setShowCreateModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-gradient-primary border-0 shadow px-4"
                                        disabled={submitting}
                                    >
                                        {submitting ? 'Submitting...' : 'Save Enquiry'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* View Enquiry Details Modal (Reference Style) */}
            {showViewModal && selectedEnquiry && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                            <div className="enq-modal-header text-white d-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center gap-3">
                                    <div className="enq-modal-icon-wrap shadow-sm">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                            <polyline points="14 2 14 8 20 8" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h5 className="modal-title font-weight-bold mb-0">Enquiry Details</h5>
                                        <span className="small text-white-50">{selectedEnquiry.project_number} - {selectedEnquiry.project_name}</span>
                                    </div>
                                </div>
                                <button type="button" className="enq-modal-close-icon" onClick={() => setShowViewModal(false)}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </div>
                            <div className="modal-body p-4" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
                                {/* Top Info Cards (2 Columns) */}
                                <div className="row g-3 mb-4">
                                    <div className="col-md-6">
                                        <div className="enq-details-card">
                                            <div className="enq-details-label">Customer Name</div>
                                            <div className="enq-details-value">{selectedEnquiry.customer?.name || 'N/A'}</div>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="enq-details-card">
                                            <div className="enq-details-label">SBU</div>
                                            <div className="enq-details-value">{selectedEnquiry.sbu?.name || 'N/A'}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Inline Badges */}
                                <div className="d-flex flex-wrap gap-4 mb-4 font-weight-semibold" style={{ fontSize: '0.85rem' }}>
                                    <div>
                                        <span className="text-secondary">Division: </span>
                                        <span className="enq-inline-badge">{selectedEnquiry.division?.name || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="text-secondary">RFQ Type: </span>
                                        <span className="enq-inline-badge">{selectedEnquiry.rfq_type?.name || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="text-secondary">Status: </span>
                                        <span className={`enq-inline-badge ${selectedEnquiry.status?.toLowerCase() === 'completed' ? 'status-completed' : 'priority-medium'}`}>
                                            {selectedEnquiry.status}
                                        </span>
                                    </div>
                                </div>

                                {/* Time Blocks (3 Columns) */}
                                <div className="row g-3 mb-4">
                                    <div className="col-md-4">
                                        <div className="enq-time-block start shadow-sm">
                                            <div className="enq-time-block-label">RFQ Date</div>
                                            <div className="enq-time-block-value">
                                                {new Date(selectedEnquiry.rfq_date).toLocaleDateString(undefined, {
                                                    month: 'short', day: 'numeric', year: '2-digit'
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="enq-time-block end shadow-sm">
                                            <div className="enq-time-block-label">RFQ Due Date</div>
                                            <div className="enq-time-block-value" style={{ fontSize: '0.85rem' }}>
                                                {new Date(selectedEnquiry.rfq_due_date).toLocaleDateString(undefined, {
                                                    month: 'short', day: 'numeric', year: '2-digit'
                                                })}, {selectedEnquiry.rfq_due_time.substring(0, 5)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="enq-time-block total shadow-sm">
                                            <div className="enq-time-block-label">RFQ Aging</div>
                                            <div className="enq-time-block-value">
                                                {selectedEnquiry.rfq_aging} Days
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Clarifications */}
                                <div className="row g-3 mb-4">
                                    <div className="col-md-6">
                                        <div className="enq-details-card">
                                            <div className="enq-details-label">Clarification To CS</div>
                                            <div className="enq-details-value text-wrap" style={{ fontSize: '0.9rem', fontWeight: 'normal' }}>
                                                {selectedEnquiry.clarification_to_cs || 'No clarification requested.'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="enq-details-card">
                                            <div className="enq-details-label">Clarification From CS</div>
                                            <div className="enq-details-value text-wrap" style={{ fontSize: '0.9rem', fontWeight: 'normal' }}>
                                                {selectedEnquiry.clarification_from_cs || 'No response received.'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Remarks */}
                                <div className="mb-4">
                                    <div className="enq-details-label">Remarks / Description</div>
                                    <div className="enq-remarks-box">
                                        {selectedEnquiry.remarks || 'No remarks provided.'}
                                    </div>
                                </div>

                                {/* Engineering Estimation Details */}
                                <h6 className="font-weight-bold text-primary mb-3 pb-2 border-bottom" style={{ fontSize: '0.95rem' }}>Engineering Estimation Details</h6>
                                <div className="row g-3 mb-4">
                                    <div className="col-md-6">
                                        <div className="enq-details-card">
                                            <div className="enq-details-label">Expected Date of Engineering</div>
                                            <div className="enq-details-value" style={{ fontSize: '0.9rem' }}>
                                                {selectedEnquiry.ed_of_engg || 'N/A'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="enq-details-card">
                                            <div className="enq-details-label">Actual Date of Engineering</div>
                                            <div className="enq-details-value" style={{ fontSize: '0.9rem' }}>
                                                {selectedEnquiry.actual_date_of_engg || 'N/A'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <div className="enq-details-label">Engineering Remarks</div>
                                    <div className="enq-remarks-box" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#4b5563' }}>
                                        {selectedEnquiry.engg_remarks || 'No engineering remarks recorded.'}
                                    </div>
                                </div>

                                {/* Costing Estimation Details */}
                                <h6 className="font-weight-bold text-primary mb-3 pb-2 border-bottom" style={{ fontSize: '0.95rem' }}>Costing Estimation Details</h6>
                                <div className="row g-3 mb-4">
                                    <div className="col-md-6">
                                        <div className="enq-details-card">
                                            <div className="enq-details-label">Expected Date of Costing</div>
                                            <div className="enq-details-value" style={{ fontSize: '0.9rem' }}>
                                                {selectedEnquiry.ed_of_costing || 'N/A'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="enq-details-card">
                                            <div className="enq-details-label">Actual Date of Costing</div>
                                            <div className="enq-details-value" style={{ fontSize: '0.9rem' }}>
                                                {selectedEnquiry.actual_date_of_costing || 'N/A'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <div className="enq-details-label">Costing Remarks</div>
                                    <div className="enq-remarks-box" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#4b5563' }}>
                                        {selectedEnquiry.costing_remarks || 'No costing remarks recorded.'}
                                    </div>
                                </div>

                                {/* Finished Goods sub-table */}
                                <div className="mb-4">
                                    <div className="enq-details-label">Finished Goods (FG) Details</div>
                                    <div className="table-responsive bg-light rounded shadow-sm border">
                                        <table className="table table-sm table-hover mb-0">
                                            <thead>
                                                <tr>
                                                    <th className="ps-3 text-secondary py-2">FG Part No</th>
                                                    <th className="text-secondary py-2">Description</th>
                                                    <th className="text-secondary pe-3 text-end py-2">Quantity</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedEnquiry.fg_details?.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="3" className="text-center p-3 text-muted">No FG details associated.</td>
                                                    </tr>
                                                ) : (
                                                    selectedEnquiry.fg_details?.map((detail, idx) => (
                                                        <tr key={detail.id || idx}>
                                                            <td className="ps-3 font-weight-semibold text-dark py-2">{detail.fg_part_no}</td>
                                                            <td className="text-muted py-2">{detail.description || 'N/A'}</td>
                                                            <td className="pe-3 text-end font-weight-bold py-2">{detail.qty}</td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Logged date footer */}
                                <div className="enq-footer-time mb-2">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <polyline points="12 6 12 12 16 14" />
                                    </svg>
                                    <span>Enquiry registered at {new Date(selectedEnquiry.created_at).toLocaleString()}</span>
                                </div>
                            </div>
                            <div className="modal-footer border-0 p-3 bg-light d-flex justify-content-end">
                                <button type="button" className="enq-modal-btn-close shadow-sm" onClick={() => setShowViewModal(false)}>
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Enquiries;
