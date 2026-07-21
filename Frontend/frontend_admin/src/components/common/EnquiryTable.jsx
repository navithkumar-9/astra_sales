import React from 'react';

// SVG sort icon — matches the codebase's inline SVG pattern, no FA dependency
const SortIcon = ({ active, direction }) => (
    <span
        className="ms-1"
        style={{
            display: 'inline-flex',
            flexDirection: 'column',
            gap: '1px',
            verticalAlign: 'middle',
            lineHeight: 0,
        }}
    >
        {/* Up caret */}
        <svg
            width="8"
            height="5"
            viewBox="0 0 8 5"
            fill={active && direction === 'asc' ? 'var(--primary, #9a55ff)' : '#ccd0d9'}
            style={{ display: 'block' }}
        >
            <path d="M4 0L8 5H0L4 0Z" />
        </svg>
        {/* Down caret */}
        <svg
            width="8"
            height="5"
            viewBox="0 0 8 5"
            fill={active && direction === 'desc' ? 'var(--primary, #9a55ff)' : '#ccd0d9'}
            style={{ display: 'block' }}
        >
            <path d="M4 5L0 0H8L4 5Z" />
        </svg>
    </span>
);

const EnquiryTable = ({ columns, data, loading, emptyMessage, renderRow, sortField, sortDirection, onSort }) => {
    if (loading && data.length === 0) {
        return (
            <div className="d-flex flex-column align-items-center justify-content-center mt-5" style={{ minHeight: '200px' }}>
                <div className="page-loader-spinner mb-3"></div>
                <div className="text-muted fw-semibold" style={{ fontSize: '0.88rem', letterSpacing: '0.5px' }}>Loading enquiries...</div>
            </div>
        );
    }

    const handleSort = (field) => {
        if (!onSort || !field) return;
        if (sortField === field) {
            onSort(field, sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            onSort(field, 'asc');
        }
    };

    return (
        <div
            className="card border-0 overflow-hidden"
            style={{
                borderRadius: '14px',
                boxShadow: '0 2px 12px rgba(15,23,42,0.07)',
            }}
        >
            <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                    <thead
                        style={{
                            background: '#f8fafc',
                            borderBottom: '2px solid #edf2f7',
                        }}
                    >
                        <tr>
                            {columns.map((col, idx) => (
                                <th 
                                    key={idx}
                                    className={`py-3 ${col.className || ''}`}
                                    style={{
                                        fontSize: '0.72rem',
                                        fontWeight: 700,
                                        letterSpacing: '0.7px',
                                        textTransform: 'uppercase',
                                        color: '#64748b',
                                        cursor: col.sortField ? 'pointer' : 'default',
                                        userSelect: col.sortField ? 'none' : 'auto',
                                        whiteSpace: 'nowrap',
                                        ...col.style,
                                    }}
                                    onClick={() => col.sortField && handleSort(col.sortField)}
                                    title={col.sortField ? `Sort by ${col.label}` : undefined}
                                >
                                    <div className="d-flex align-items-center gap-1">
                                        {col.label}
                                        {col.sortField && (
                                            <SortIcon
                                                active={sortField === col.sortField}
                                                direction={sortDirection}
                                            />
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody style={{ background: '#fff' }}>
                        {data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="text-center py-5">
                                    <div className="d-flex flex-column align-items-center gap-2" style={{ color: '#94a3b8' }}>
                                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.4">
                                            <circle cx="11" cy="11" r="8" />
                                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                        </svg>
                                        <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>
                                            {emptyMessage || 'No enquiries found.'}
                                        </span>
                                    </div>
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
