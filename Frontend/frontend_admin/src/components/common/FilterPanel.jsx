import React, { useState, useEffect } from 'react';
import { masterDataService } from '../../services/masterDataService';
import { userService } from '../../services/userService';

const FilterPanel = ({ filters, onFilterChange, showStatusFilter = true }) => {
    const [customers, setCustomers] = useState([]);
    const [salesReps, setSalesReps] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [sbus, setSbus] = useState([]);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        const fetchLookups = async () => {
            try {
                const [custRes, sbuRes, divRes] = await Promise.all([
                    masterDataService.getCustomers(),
                    masterDataService.getSBUs(),
                    masterDataService.getDivisions()
                ]);
                setCustomers(custRes.results || custRes || []);
                setSbus(sbuRes.results || sbuRes || []);
                setDivisions(divRes.results || divRes || []);
                
                const repRes = await userService.getSalesReps();
                setSalesReps(repRes.results || repRes || []);
            } catch (err) {
                console.error("Failed to fetch lookups for filters", err);
            }
        };
        fetchLookups();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        onFilterChange({ ...filters, [name]: value });
    };

    const handleClear = () => {
        onFilterChange({
            search: '',
            status: filters.status && !showStatusFilter ? filters.status : '',
            customer: '',
            sales_rep: '',
            division: '',
            sbu: '',
            rfq_date_from: '',
            rfq_date_to: '',
            aging_type: 'enquiry_aging',
            aging_min: '',
            aging_max: ''
        });
    };

    return (
        <div className="filter-panel card shadow-sm border-0 mb-4" style={{ borderRadius: '12px' }}>
            <div className="card-header bg-white border-bottom-0 d-flex justify-content-between align-items-center py-3" onClick={() => setIsExpanded(!isExpanded)} style={{ cursor: 'pointer', borderRadius: '12px' }}>
                <div className="d-flex align-items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
                        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                    </svg>
                    <span className="font-weight-bold text-dark">Advanced Filters</span>
                </div>
                <button className="btn btn-sm btn-light rounded-circle" type="button">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}>
                        <polyline points="6 9 12 15 18 9" />
                    </svg>
                </button>
            </div>
            
            {isExpanded && (
                <div className="card-body pt-0 border-top">
                    <div className="row g-3 mt-1">
                        <div className="col-md-3">
                            <label className="form-label small font-weight-bold text-secondary mb-1">Search (Project/RFQ No)</label>
                            <input type="text" className="form-control form-control-sm" name="search" value={filters.search || ''} onChange={handleChange} placeholder="Keyword..." />
                        </div>
                        
                        {showStatusFilter && (
                            <div className="col-md-3">
                                <label className="form-label small font-weight-bold text-secondary mb-1">Status</label>
                                <select className="form-select form-select-sm" name="status" value={filters.status || ''} onChange={handleChange}>
                                    <option value="">All Statuses</option>
                                    <option value="Pending with Engg">Pending with Engineering</option>
                                    <option value="Pending with Costing">Pending with Costing</option>
                                    <option value="Sales to Quote">Sales to Quote</option>
                                    <option value="Pending with Sales">Pending with Sales</option>
                                    <option value="Quote Submitted">Quote Submitted</option>
                                    <option value="On Hold">On Hold</option>
                                    <option value="Open - L1">Open - L1</option>
                                    <option value="Won">Won</option>
                                    <option value="Lost">Lost</option>
                                    <option value="Regretted">Regretted</option>
                                    <option value="Quote Regretted">Quote Regretted</option>
                                </select>
                            </div>
                        )}

                        <div className="col-md-3">
                            <label className="form-label small font-weight-bold text-secondary mb-1">Customer</label>
                            <select className="form-select form-select-sm" name="customer" value={filters.customer || ''} onChange={handleChange}>
                                <option value="">All Customers</option>
                                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>

                        <div className="col-md-3">
                            <label className="form-label small font-weight-bold text-secondary mb-1">Sales Person</label>
                            <select className="form-select form-select-sm" name="sales_rep" value={filters.sales_rep || ''} onChange={handleChange}>
                                <option value="">All Sales Reps</option>
                                {salesReps.map(r => <option key={r.id} value={r.id}>{r.name || r.username}</option>)}
                            </select>
                        </div>

                        <div className="col-md-3">
                            <label className="form-label small font-weight-bold text-secondary mb-1">RFQ Date From</label>
                            <input type="date" className="form-control form-control-sm" name="rfq_date_from" value={filters.rfq_date_from || ''} onChange={handleChange} />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label small font-weight-bold text-secondary mb-1">RFQ Date To</label>
                            <input type="date" className="form-control form-control-sm" name="rfq_date_to" value={filters.rfq_date_to || ''} onChange={handleChange} />
                        </div>

                        <div className="col-md-3">
                            <label className="form-label small font-weight-bold text-secondary mb-1">Division (Location)</label>
                            <select className="form-select form-select-sm" name="division" value={filters.division || ''} onChange={handleChange}>
                                <option value="">All Divisions</option>
                                {divisions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>
                        
                        <div className="col-md-3">
                            <label className="form-label small font-weight-bold text-secondary mb-1">SBU</label>
                            <select className="form-select form-select-sm" name="sbu" value={filters.sbu || ''} onChange={handleChange}>
                                <option value="">All SBUs</option>
                                {sbus.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>

                        <div className="col-md-3">
                            <label className="form-label small font-weight-bold text-secondary mb-1">Aging Type</label>
                            <select className="form-select form-select-sm" name="aging_type" value={filters.aging_type || 'enquiry_aging'} onChange={handleChange}>
                                <option value="enquiry_aging">Enquiry Aging (RFQ to Quote)</option>
                                <option value="quote_submission_aging">Quote Submission Aging (Quote to Submit)</option>
                                <option value="rfq_aging">Current Overall Aging</option>
                            </select>
                        </div>
                        <div className="col-md-3">
                            <label className="form-label small font-weight-bold text-secondary mb-1">Aging Min (Days)</label>
                            <input type="number" min="0" className="form-control form-control-sm" name="aging_min" value={filters.aging_min || ''} onChange={handleChange} placeholder="e.g. 30" />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label small font-weight-bold text-secondary mb-1">Aging Max (Days)</label>
                            <input type="number" min="0" className="form-control form-control-sm" name="aging_max" value={filters.aging_max || ''} onChange={handleChange} placeholder="e.g. 90" />
                        </div>
                        
                        <div className="col-md-3 d-flex align-items-end justify-content-end">
                            <button type="button" className="btn btn-sm btn-outline-secondary px-4 w-100" onClick={handleClear}>
                                Clear Filters
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FilterPanel;
