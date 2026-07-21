import React from 'react';

const Pagination = ({ count, page, pageSize, onPageChange, onPageSizeChange }) => {
    const totalPages = Math.ceil(count / pageSize) || 1;

    const handleFirst = () => onPageChange(1);
    const handlePrev = () => onPageChange(Math.max(1, page - 1));
    const handleNext = () => onPageChange(Math.min(totalPages, page + 1));
    const handleLast = () => onPageChange(totalPages);

    const startItem = count > 0 ? (page - 1) * pageSize + 1 : 0;
    const endItem = Math.min(page * pageSize, count);

    // Build visible page numbers (window of up to 5)
    const getPageNumbers = () => {
        const delta = 2;
        const pages = [];
        const left = Math.max(1, page - delta);
        const right = Math.min(totalPages, page + delta);
        for (let i = left; i <= right; i++) pages.push(i);
        return pages;
    };
    const pageNumbers = getPageNumbers();

    const btnBase = {
        border: '1.5px solid #e5e7eb',
        background: '#ffffff',
        borderRadius: '8px',
        fontSize: '0.82rem',
        fontWeight: 500,
        color: '#4b5563',
        cursor: 'pointer',
        padding: '6px 12px',
        transition: 'all 0.15s',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '36px',
        height: '36px',
        lineHeight: 1,
        fontFamily: 'inherit',
    };

    const btnDisabled = {
        ...btnBase,
        opacity: 0.4,
        cursor: 'not-allowed',
        pointerEvents: 'none',
    };

    const btnActive = {
        ...btnBase,
        background: 'linear-gradient(135deg, #da8cff, #9a55ff)',
        border: '1.5px solid #9a55ff',
        color: '#ffffff',
        fontWeight: 700,
        boxShadow: '0 2px 8px rgba(154,85,255,0.25)',
    };

    return (
        <div
            className="d-flex justify-content-between align-items-center flex-wrap gap-3"
            style={{ marginTop: '16px' }}
        >
            {/* Left: rows-per-page selector */}
            <div className="d-flex align-items-center gap-2">
                <span style={{ fontSize: '0.82rem', color: '#6b7280', whiteSpace: 'nowrap' }}>Rows per page</span>
                <select
                    className="form-select form-select-sm"
                    style={{
                        width: '76px',
                        borderRadius: '8px',
                        border: '1.5px solid #e5e7eb',
                        fontSize: '0.82rem',
                        color: '#374151',
                        fontWeight: 500,
                        cursor: 'pointer',
                    }}
                    value={pageSize}
                    onChange={(e) => onPageSizeChange(Number(e.target.value))}
                >
                    {[10, 25, 50, 100].map((n) => (
                        <option key={n} value={n}>{n}</option>
                    ))}
                </select>
            </div>

            {/* Center: record count */}
            <span style={{ fontSize: '0.82rem', color: '#9ca3af', whiteSpace: 'nowrap' }}>
                {count > 0 ? (
                    <>
                        Showing <strong style={{ color: '#374151' }}>{startItem}–{endItem}</strong> of{' '}
                        <strong style={{ color: '#374151' }}>{count}</strong> records
                    </>
                ) : (
                    'No records found'
                )}
            </span>

            {/* Right: page navigation */}
            <div className="d-flex align-items-center gap-1">
                {/* First */}
                <button
                    style={page === 1 ? btnDisabled : btnBase}
                    onClick={handleFirst}
                    disabled={page === 1}
                    title="First page"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="11 17 6 12 11 7" />
                        <polyline points="18 17 13 12 18 7" />
                    </svg>
                </button>

                {/* Prev */}
                <button
                    style={page === 1 ? btnDisabled : btnBase}
                    onClick={handlePrev}
                    disabled={page === 1}
                    title="Previous page"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                </button>

                {/* Page number pills */}
                {pageNumbers[0] > 1 && (
                    <>
                        <button style={btnBase} onClick={() => onPageChange(1)}>1</button>
                        {pageNumbers[0] > 2 && (
                            <span style={{ ...btnBase, cursor: 'default', border: 'none', background: 'transparent', color: '#9ca3af' }}>…</span>
                        )}
                    </>
                )}

                {pageNumbers.map((p) => (
                    <button
                        key={p}
                        style={p === page ? btnActive : btnBase}
                        onClick={() => onPageChange(p)}
                    >
                        {p}
                    </button>
                ))}

                {pageNumbers[pageNumbers.length - 1] < totalPages && (
                    <>
                        {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                            <span style={{ ...btnBase, cursor: 'default', border: 'none', background: 'transparent', color: '#9ca3af' }}>…</span>
                        )}
                        <button style={btnBase} onClick={() => onPageChange(totalPages)}>{totalPages}</button>
                    </>
                )}

                {/* Next */}
                <button
                    style={page === totalPages ? btnDisabled : btnBase}
                    onClick={handleNext}
                    disabled={page === totalPages}
                    title="Next page"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="9 18 15 12 9 6" />
                    </svg>
                </button>

                {/* Last */}
                <button
                    style={page === totalPages ? btnDisabled : btnBase}
                    onClick={handleLast}
                    disabled={page === totalPages}
                    title="Last page"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="13 17 18 12 13 7" />
                        <polyline points="6 17 11 12 6 7" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default Pagination;
