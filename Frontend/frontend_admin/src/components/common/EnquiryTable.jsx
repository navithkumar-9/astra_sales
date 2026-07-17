import React from 'react';

const EnquiryTable = ({ columns, data, loading, emptyMessage, renderRow, sortField, sortDirection, onSort }) => {
    if (loading && data.length === 0) {
        return (
            <div className="d-flex flex-column align-items-center justify-content-center min-vh-50 mt-5">
                <div className="page-loader-spinner mb-3"></div>
                <div className="text-muted font-weight-bold">Loading enquiries...</div>
            </div>
        );
    }

    const handleSort = (field) => {
        if (!onSort || !field) return;
        if (sortField === field) {
            onSort(field, sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            onSort(field, 'desc');
        }
    };

    return (
        <div className="card shadow border-0 overflow-hidden" style={{ borderRadius: '16px' }}>
            <div className="table-responsive">
                <table className="table table-hover align-middle mb-0" style={{ borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid #edf2f7' }}>
                        <tr>
                            {columns.map((col, idx) => (
                                <th 
                                    key={idx}
                                    className={`text-uppercase text-secondary font-weight-bold py-3 ${col.className || ''}`}
                                    style={{ 
                                        fontSize: '0.72rem', 
                                        letterSpacing: '0.8px', 
                                        cursor: col.sortField ? 'pointer' : 'default',
                                        ...col.style 
                                    }}
                                    onClick={() => col.sortField && handleSort(col.sortField)}
                                >
                                    <div className="d-flex align-items-center">
                                        {col.label}
                                        {col.sortField && (
                                            <span className="ms-1 d-inline-flex flex-column" style={{ fontSize: '10px', lineHeight: '0.8' }}>
                                                <i className={`fas fa-caret-up ${sortField === col.sortField && sortDirection === 'asc' ? 'text-primary' : 'text-muted opacity-25'}`}></i>
                                                <i className={`fas fa-caret-down ${sortField === col.sortField && sortDirection === 'desc' ? 'text-primary' : 'text-muted opacity-25'}`}></i>
                                            </span>
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody style={{ background: '#fff' }}>
                        {data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="text-center p-5 text-muted">
                                    {emptyMessage || 'No enquiries found.'}
                                </td>
                            </tr>
                        ) : (
                            data.map((item, idx) => renderRow(item, idx))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default EnquiryTable;
