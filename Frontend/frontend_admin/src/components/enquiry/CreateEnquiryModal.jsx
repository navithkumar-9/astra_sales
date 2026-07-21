import React, { useState, useEffect } from 'react';
import { enquiryService } from '../../services/enquiryService';
import { useToast } from '../../context/ToastContext';
import API from '../../api/axios';
import { masterDataService } from '../../services/masterDataService';
import { userService } from '../../services/userService';

const CreateEnquiryModal = ({ show, onClose, onSuccess }) => {
    const { showToast } = useToast();
    const today = new Date().toISOString().split('T')[0];

    // Form inputs
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
    const [rfqDocument, setRfqDocument] = useState(null);
    const [poDocument, setPoDocument] = useState(null);
    const [fgDetails, setFgDetails] = useState([{ fg_part_no: '', description: '', qty: '' }]);
    const [previousProjectNumber, setPreviousProjectNumber] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});

    // Dropdowns
    const [customers, setCustomers] = useState([]);
    const [sbus, setSbus] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [rfqTypes, setRfqTypes] = useState([]);
    const [fgTypes, setFgTypes] = useState([]);
    const [salesReps, setSalesReps] = useState([]);

    useEffect(() => {
        if (show) {
            fetchDropdowns();
            fetchLatestProjectNumber();
            resetForm();
        }
    }, [show]);

    const resetForm = () => {
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
        setRfqDocument(null);
        setPoDocument(null);
        setValidationErrors({});
    };

    const fetchDropdowns = async () => {
        try {
            const [custRes, sbuRes, divRes, rfqRes, fgRes, salesRes] = await Promise.all([
                masterDataService.getCustomers({ page_size: 100 }),
                masterDataService.getSBUs({ page_size: 100 }),
                masterDataService.getDivisions({ page_size: 100 }),
                masterDataService.getRFQs({ page_size: 100 }),
                masterDataService.getFGs({ page_size: 100 }),
                userService.getSalesReps()
            ]);
            setCustomers(custRes.results || custRes);
            setSbus(sbuRes.results || sbuRes);
            setDivisions(divRes.results || divRes);
            setRfqTypes(rfqRes.results || rfqRes);
            setFgTypes(fgRes.results || fgRes);
            setSalesReps(salesRes.results || salesRes);
        } catch (err) {
            showToast('Failed to load lookup configurations.', 'error');
        }
    };

    const fetchLatestProjectNumber = async () => {
        try {
            const res = await API.get('/enquiries/?page_size=1');
            const responseData = res.data.success ? res.data.data : res.data;
            const latestList = responseData.results || responseData;
            if (latestList && latestList.length > 0) {
                const prevProjNum = latestList[0].project_number;
                setPreviousProjectNumber(prevProjNum);
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

        setValidationErrors({});
        setSubmitting(true);
        const payloadData = {
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

        const formData = new FormData();
        Object.keys(payloadData).forEach(key => {
            if (key === 'fg_details') {
                formData.append('fg_details', JSON.stringify(payloadData[key]));
            } else {
                formData.append(key, payloadData[key]);
            }
        });

        if (rfqDocument) {
            formData.append('rfq_document', rfqDocument);
        }
        if (poDocument) {
            formData.append('po_document', poDocument);
        }

        try {
            await enquiryService.create(formData);
            showToast('New enquiry created successfully!', 'success');
            onSuccess();
        } catch (err) {
            let errorMsg = 'Failed to create enquiry.';
            if (err.response?.data?.errors) {
                const errData = err.response.data.errors;
                setValidationErrors(errData);
                errorMsg = 'Please correct the highlighted validation errors.';
            } else if (err.response?.data?.message) {
                errorMsg = err.response.data.message;
            }
            showToast(errorMsg, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (!show) return null;

    return (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(4px)', zIndex: 1050 }}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                    
                    {/* Header with signature Purple Admin gradient */}
                    <div className="enq-modal-header text-white d-flex align-items-center justify-content-between" style={{ 
                        background: 'linear-gradient(to right, #da8cff, #9a55ff)',
                        padding: '1.5rem 2rem'
                    }}>
                        <div className="d-flex align-items-center gap-3">
                            <div className="enq-modal-icon-wrap shadow-sm" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M12 5v14M5 12h14"/>
                                </svg>
                            </div>
                            <div>
                                <h5 className="modal-title font-weight-bold mb-0" style={{ letterSpacing: '0.5px' }}>New Enquiry Request</h5>
                                {previousProjectNumber && (
                                    <span className="text-white-50 small" style={{ fontSize: '0.82rem' }}>Prev Proj: {previousProjectNumber}</span>
                                )}
                            </div>
                        </div>
                        <button type="button" className="enq-modal-close-icon border-0" onClick={onClose} style={{ 
                            background: 'rgba(255, 255, 255, 0.2)', 
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff'
                        }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>
                    <form onSubmit={handleCreateSubmit} className="modal-body p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                        <div className="row g-3 mb-4">
                            <div className="col-md-4">
                                <label className="form-label font-weight-semibold">Project Number</label>
                                <div className="input-group">
                                    <input
                                        type="text"
                                        className={`form-control ${validationErrors.project_number ? 'is-invalid' : ''}`}
                                        value={projectNumber}
                                        onChange={(e) => {
                                            setProjectNumber(e.target.value);
                                            setValidationErrors(prev => ({ ...prev, project_number: undefined }));
                                        }}
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
                                    {validationErrors.project_number && <div className="invalid-feedback d-block">{validationErrors.project_number.join(', ')}</div>}
                                </div>
                            </div>
                            <div className="col-md-8">
                                <label className="form-label font-weight-semibold">Project Name <span className="text-danger">*</span></label>
                                <input
                                    type="text"
                                    className={`form-control ${validationErrors.project_name ? 'is-invalid' : ''}`}
                                    placeholder="Enter project name"
                                    value={projectName}
                                    onChange={(e) => {
                                        setProjectName(e.target.value);
                                        setValidationErrors(prev => ({ ...prev, project_name: undefined }));
                                    }}
                                    required
                                />
                                {validationErrors.project_name && <div className="invalid-feedback">{validationErrors.project_name.join(', ')}</div>}
                            </div>
                        </div>

                        <div className="row g-3 mb-4">
                            <div className="col-md-4">
                                <label className="form-label font-weight-semibold">RFQ Date <span className="text-danger">*</span></label>
                                <input
                                    type="date"
                                    className={`form-control ${validationErrors.rfq_date ? 'is-invalid' : ''}`}
                                    value={rfqDate}
                                    onChange={(e) => {
                                        setRfqDate(e.target.value);
                                        setValidationErrors(prev => ({ ...prev, rfq_date: undefined }));
                                    }}
                                    required
                                />
                                {validationErrors.rfq_date && <div className="invalid-feedback">{validationErrors.rfq_date.join(', ')}</div>}
                            </div>
                            <div className="col-md-4">
                                <label className="form-label font-weight-semibold">RFQ No <span className="text-danger">*</span></label>
                                <input
                                    type="text"
                                    className={`form-control ${validationErrors.rfq_no ? 'is-invalid' : ''}`}
                                    placeholder="RFQ No"
                                    value={rfqNo}
                                    onChange={(e) => {
                                        setRfqNo(e.target.value);
                                        setValidationErrors(prev => ({ ...prev, rfq_no: undefined }));
                                    }}
                                    required
                                />
                                {validationErrors.rfq_no && <div className="invalid-feedback">{validationErrors.rfq_no.join(', ')}</div>}
                            </div>
                            <div className="col-md-4">
                                <label className="form-label font-weight-semibold">Customer <span className="text-danger">*</span></label>
                                <select
                                    className={`form-select ${validationErrors.customer ? 'is-invalid' : ''}`}
                                    value={selectedCustomer}
                                    onChange={(e) => {
                                        setSelectedCustomer(e.target.value);
                                        setValidationErrors(prev => ({ ...prev, customer: undefined }));
                                    }}
                                    required
                                >
                                    <option value="">Select Customer</option>
                                    {customers.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                                {validationErrors.customer && <div className="invalid-feedback">{validationErrors.customer.join(', ')}</div>}
                            </div>
                        </div>

                        <div className="row g-3 mb-4">
                            <div className="col-md-4">
                                <label className="form-label font-weight-semibold">SBU <span className="text-danger">*</span></label>
                                <select
                                    className={`form-select ${validationErrors.sbu ? 'is-invalid' : ''}`}
                                    value={selectedSbu}
                                    onChange={(e) => {
                                        setSelectedSbu(e.target.value);
                                        setValidationErrors(prev => ({ ...prev, sbu: undefined }));
                                    }}
                                    required
                                >
                                    <option value="">Select SBU</option>
                                    {sbus.map((s) => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                                {validationErrors.sbu && <div className="invalid-feedback">{validationErrors.sbu.join(', ')}</div>}
                            </div>
                            <div className="col-md-4">
                                <label className="form-label font-weight-semibold">Division <span className="text-danger">*</span></label>
                                <select
                                    className={`form-select ${validationErrors.division ? 'is-invalid' : ''}`}
                                    value={selectedDivision}
                                    onChange={(e) => {
                                        setSelectedDivision(e.target.value);
                                        setValidationErrors(prev => ({ ...prev, division: undefined }));
                                    }}
                                    required
                                >
                                    <option value="">Select Division</option>
                                    {divisions.map((d) => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                                {validationErrors.division && <div className="invalid-feedback">{validationErrors.division.join(', ')}</div>}
                            </div>
                            <div className="col-md-4">
                                <label className="form-label font-weight-semibold">Sales Rep <span className="text-danger">*</span></label>
                                <select
                                    className={`form-select ${validationErrors.sales_rep ? 'is-invalid' : ''}`}
                                    value={selectedSalesRep}
                                    onChange={(e) => {
                                        setSelectedSalesRep(e.target.value);
                                        setValidationErrors(prev => ({ ...prev, sales_rep: undefined }));
                                    }}
                                    required
                                >
                                    <option value="">Select Sales Rep</option>
                                    {salesReps.map((s) => (
                                        <option key={s.id} value={s.id}>{s.name || s.username}</option>
                                    ))}
                                </select>
                                {validationErrors.sales_rep && <div className="invalid-feedback">{validationErrors.sales_rep.join(', ')}</div>}
                            </div>
                        </div>

                        <div className="row g-3 mb-4">
                            <div className="col-md-4">
                                <label className="form-label font-weight-semibold">RFQ Type <span className="text-danger">*</span></label>
                                <select
                                    className={`form-select ${validationErrors.rfq_type ? 'is-invalid' : ''}`}
                                    value={selectedRfqType}
                                    onChange={(e) => {
                                        setSelectedRfqType(e.target.value);
                                        setValidationErrors(prev => ({ ...prev, rfq_type: undefined }));
                                    }}
                                    required
                                >
                                    <option value="">Select RFQ Type</option>
                                    {rfqTypes.map((r) => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                                {validationErrors.rfq_type && <div className="invalid-feedback">{validationErrors.rfq_type.join(', ')}</div>}
                            </div>
                            <div className="col-md-4">
                                <label className="form-label font-weight-semibold">FG Type <span className="text-danger">*</span></label>
                                <select
                                    className={`form-select ${validationErrors.fg_type ? 'is-invalid' : ''}`}
                                    value={selectedFgType}
                                    onChange={(e) => {
                                        setSelectedFgType(e.target.value);
                                        setValidationErrors(prev => ({ ...prev, fg_type: undefined }));
                                    }}
                                    required
                                >
                                    <option value="">Select FG Type</option>
                                    {fgTypes.map((f) => (
                                        <option key={f.id} value={f.id}>{f.fg_type}</option>
                                    ))}
                                </select>
                                {validationErrors.fg_type && <div className="invalid-feedback">{validationErrors.fg_type.join(', ')}</div>}
                            </div>
                            <div className="col-md-4">
                                <label className="form-label font-weight-semibold">RFQ Assign Date</label>
                                <input
                                    type="date"
                                    className={`form-control ${validationErrors.rfq_assign_date ? 'is-invalid' : ''}`}
                                    value={rfqAssignDate}
                                    readOnly
                                />
                                {validationErrors.rfq_assign_date && <div className="invalid-feedback">{validationErrors.rfq_assign_date.join(', ')}</div>}
                            </div>
                        </div>

                        <div className="row g-3 mb-4">
                            <div className="col-md-6">
                                <label className="form-label font-weight-semibold">RFQ Due Date <span className="text-danger">*</span></label>
                                <input
                                    type="date"
                                    className={`form-control ${validationErrors.rfq_due_date ? 'is-invalid' : ''}`}
                                    value={rfqDueDate}
                                    onChange={(e) => {
                                        setRfqDueDate(e.target.value);
                                        setValidationErrors(prev => ({ ...prev, rfq_due_date: undefined }));
                                    }}
                                    required
                                />
                                {validationErrors.rfq_due_date && <div className="invalid-feedback">{validationErrors.rfq_due_date.join(', ')}</div>}
                            </div>
                            <div className="col-md-6">
                                <label className="form-label font-weight-semibold">RFQ Due Time <span className="text-danger">*</span></label>
                                <input
                                    type="time"
                                    className={`form-control ${validationErrors.rfq_due_time ? 'is-invalid' : ''}`}
                                    value={rfqDueTime}
                                    onChange={(e) => {
                                        setRfqDueTime(e.target.value);
                                        setValidationErrors(prev => ({ ...prev, rfq_due_time: undefined }));
                                    }}
                                    required
                                />
                                {validationErrors.rfq_due_time && <div className="invalid-feedback">{validationErrors.rfq_due_time.join(', ')}</div>}
                            </div>
                        </div>

                        <div className="row g-3 mb-4">
                            <div className="col-12">
                                <div className="alert alert-warning border-0 shadow-none d-flex align-items-center gap-2 mb-0" style={{ fontSize: '0.85rem', borderRadius: '8px' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="flex-shrink-0">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="16" x2="12" y2="12" />
                                        <line x1="12" y1="8" x2="12.01" y2="8" />
                                    </svg>
                                    <span>RFQ and PO documents can only be uploaded after the RFQ status is marked as Won.</span>
                                </div>
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
                                            value={detail.qty}
                                            min="1"
                                            onChange={(e) => handleFgDetailChange(idx, 'qty', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-1">
                                        <button
                                            type="button"
                                            className="btn btn-outline-danger btn-sm w-100 p-0"
                                            style={{ height: '31px' }}
                                            onClick={() => removeFgRow(idx)}
                                            disabled={fgDetails.length === 1}
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="3 6 5 6 21 6" />
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                            <button
                                type="button"
                                className="btn btn-light border font-weight-semibold"
                                onClick={onClose}
                                disabled={submitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn btn-gradient-primary border-0 font-weight-semibold d-flex align-items-center gap-2"
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                                            <polyline points="17 21 17 13 7 13 7 21" />
                                            <polyline points="7 3 7 8 15 8" />
                                        </svg>
                                        Save Enquiry
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateEnquiryModal;
