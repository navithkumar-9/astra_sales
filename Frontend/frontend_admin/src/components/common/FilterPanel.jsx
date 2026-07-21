import React, { useState, useEffect } from 'react';
import { masterDataService } from '../../services/masterDataService';
import { userService } from '../../services/userService';

const FilterPanel = ({ filters, onFilterChange, showStatusFilter = true }) => {
    const [customers, setCustomers] = useState([]);
    const [salesReps, setSalesReps] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [sbus, setSbus] = useState([]);
    const [isExpanded, setIsExpanded] = useState(false);

    // Count of active filters (excluding search, which is always visible)
    const activeFilterCount = [
        filters.status,
        filters.customer,
        filters.sales_rep,
        filters.division,
        filters.sbu,
        filters.rfq_date_from,
        filters.rfq_date_to,
        filters.aging_min,
        filters.aging_max,
    ].filter(Boolean).length;

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
                console.error('Failed to fetch lookups for filters', err);
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
            aging_max: '',
        });
    };

    const inputStyle = {
        borderRadius: '8px',
        border: '1.5px solid #e5e7eb',
        fontSize: '0.85rem',
        color: '#374151',
        transition: 'border-color 0.15s',
    };

    return (
        <div
            className="card border-0 mb-4"
            style={{
                borderRadius: '14px',
                boxShadow: '0 2px 10px rgba(15,23,42,0.06)',
                overflow: 'hidden',
            }}
        >
            {/* ── Always-visible top bar ── */}
            <div
                className="d-flex align-items-center gap-3 px-4 py-3"
                style={{ background: '#ffffff', borderBottom: isExpanded ? '1.5px solid #f1f5f9' : 'none' }}
            >
                {/* Search input — always visible */}
                <div className="position-relative flex-grow-1" style={{ maxWidth: '360px' }}>
                    <span
                        className="position-absolute top-50 translate-middle-y"
                        style={{ left: '12px', color: '#9ca3af', pointerEvents: 'none' }}
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                    </span>
                    <input
                        type="text"
                        className="form-control form-control-sm"
                        name="search"
                        value={filters.search || ''}
                        onChange={handleChange}
                        placeholder="Search project, RFQ no..."
                        style={{ ...inputStyle, paddingLeft: '36px' }}
                    />
                </div>

                {/* Spacer */}
                <div className="flex-grow-1" />

                {/* Active filter badge */}
                {activeFilterCount > 0 && (
                    <span
                        style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '3px 10px',
                            borderRadius: '12px',
                            background: 'rgba(154,85,255,0.1)',
                            color: '#9a55ff',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
                    </span>
                )}

                {/* Expand/collapse toggle */}
                <button
                    type="button"
                    className="btn btn-sm d-flex align-items-center gap-2"
                    onClick={() => setIsExpanded(!isExpanded)}
                    style={{
                        borderRadius: '8px',
                        border: '1.5px solid #e5e7eb',
                        background: isExpanded ? 'rgba(154,85,255,0.06)' : '#ffffff',
                        color: isExpanded ? '#9a55ff' : '#6b7280',
                        fontWeight: 600,
                        fontSize: '0.82rem',
                        padding: '6px 14px',
                        transition: 'all 0.15s',
                        whiteSpace: 'nowrap',
                    }}
                >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                    </svg>
                    Filters
                    <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        style={{
                            transform: isExpanded ? 'rotate(180deg)' : 'none',
                            transition: 'transform 0.25s',
                        }}
                    >
                        <polyline points="6 9 12 15 18 9" />
                    </svg>
                </button>

                {/* Clear button — only when filters are active */}
                {activeFilterCount > 0 && (
                    <button
                        type="button"
                        className="btn btn-sm"
                        onClick={handleClear}
                        style={{
                            borderRadius: '8px',
                            border: '1.5px solid #fecdd3',
                            background: '#fff1f2',
                            color: '#e02424',
                            fontWeight: 600,
                            fontSize: '0.82rem',
                            padding: '6px 14px',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        Clear
                    </button>
                )}
            </div>
            
            {/* ── Collapsible advanced filters ── */}
            {isExpanded && (
                <div
                    className="px-4 py-3"
                    style={{ background: '#fafbfc', borderTop: '1.5px solid #f1f5f9' }}
                >
                    <div className="row g-3">
                        {showStatusFilter && (
                            <div className="col-xl-3 col-md-4 col-sm-6">
                                <label className="form-label mb-1" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Status</label>
                                <select className="form-select form-select-sm" name="status" value={filters.status || ''} onChange={handleChange} style={inputStyle}>
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

                        <div className="col-xl-3 col-md-4 col-sm-6">
                            <label className="form-label mb-1" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Customer</label>
                            <select className="form-select form-select-sm" name="customer" value={filters.customer || ''} onChange={handleChange} style={inputStyle}>
                                <option value="">All Customers</option>
                                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>

                        <div className="col-xl-3 col-md-4 col-sm-6">
                            <label className="form-label mb-1" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Sales Person</label>
                            <select className="form-select form-select-sm" name="sales_rep" value={filters.sales_rep || ''} onChange={handleChange} style={inputStyle}>
                                <option value="">All Sales Reps</option>
                                {salesReps.map((r) => <option key={r.id} value={r.id}>{r.name || r.username}</option>)}
                            </select>
                        </div>

                        <div className="col-xl-3 col-md-4 col-sm-6">
                            <label className="form-label mb-1" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Division</label>
                            <select className="form-select form-select-sm" name="division" value={filters.division || ''} onChange={handleChange} style={inputStyle}>
                                <option value="">All Divisions</option>
                                {divisions.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>

                        <div className="col-xl-3 col-md-4 col-sm-6">
                            <label className="form-label mb-1" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>SBU</label>
                            <select className="form-select form-select-sm" name="sbu" value={filters.sbu || ''} onChange={handleChange} style={inputStyle}>
                                <option value="">All SBUs</option>
                                {sbus.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>

                        <div className="col-xl-3 col-md-4 col-sm-6">
                            <label className="form-label mb-1" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>RFQ Date From</label>
                            <input type="date" className="form-control form-control-sm" name="rfq_date_from" value={filters.rfq_date_from || ''} onChange={handleChange} style={inputStyle} />
                        </div>

                        <div className="col-xl-3 col-md-4 col-sm-6">
                            <label className="form-label mb-1" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>RFQ Date To</label>
                            <input type="date" className="form-control form-control-sm" name="rfq_date_to" value={filters.rfq_date_to || ''} onChange={handleChange} style={inputStyle} />
                        </div>

                        <div className="col-xl-3 col-md-4 col-sm-6">
                            <label className="form-label mb-1" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Aging Type</label>
                            <select className="form-select form-select-sm" name="aging_type" value={filters.aging_type || 'enquiry_aging'} onChange={handleChange} style={inputStyle}>
                                <option value="enquiry_aging">Enquiry Aging (RFQ → Quote)</option>
                                <option value="quote_submission_aging">Quote Submission Aging</option>
                            </select>
                        </div>

                        <div className="col-xl-2 col-md-3 col-sm-6">
                            <label className="form-label mb-1" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Aging Min (Days)</label>
                            <input type="number" min="0" className="form-control form-control-sm" name="aging_min" value={filters.aging_min || ''} onChange={handleChange} placeholder="e.g. 30" style={inputStyle} />
                        </div>

                        <div className="col-xl-2 col-md-3 col-sm-6">
                            <label className="form-label mb-1" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Aging Max (Days)</label>
                            <input type="number" min="0" className="form-control form-control-sm" name="aging_max" value={filters.aging_max || ''} onChange={handleChange} placeholder="e.g. 90" style={inputStyle} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FilterPanel;
