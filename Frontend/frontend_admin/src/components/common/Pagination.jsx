import React from 'react';

const Pagination = ({ count, page, pageSize, onPageChange, onPageSizeChange }) => {
    const totalPages = Math.ceil(count / pageSize) || 1;

    const handleFirst = () => onPageChange(1);
    const handlePrev = () => onPageChange(Math.max(1, page - 1));
    const handleNext = () => onPageChange(Math.min(totalPages, page + 1));
    const handleLast = () => onPageChange(totalPages);

    const startItem = (page - 1) * pageSize + 1;
    const endItem = Math.min(page * pageSize, count);

    return (
        <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-3">
            <div className="d-flex align-items-center gap-2">
                <span className="text-muted small">Show</span>
                <select 
                    className="form-select form-select-sm" 
                    style={{ width: '80px' }} 
                    value={pageSize} 
                    onChange={(e) => onPageSizeChange(Number(e.target.value))}
                >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                </select>
                <span className="text-muted small">entries</span>
            </div>
            
            <div className="text-muted small">
                Showing {count > 0 ? startItem : 0} to {endItem} of {count} entries
            </div>

            <nav>
                <ul className="pagination pagination-sm mb-0">
                    <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={handleFirst}>First</button>
                    </li>
                    <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={handlePrev}>Previous</button>
                    </li>
                    
                    <li className="page-item active">
                        <span className="page-link">{page} / {totalPages}</span>
                    </li>

                    <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={handleNext}>Next</button>
                    </li>
                    <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={handleLast}>Last</button>
                    </li>
                </ul>
            </nav>
        </div>
    );
};

export default Pagination;
