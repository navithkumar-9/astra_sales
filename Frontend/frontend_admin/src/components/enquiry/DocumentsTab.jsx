import React from 'react';

const DocumentsTab = ({ enq, canEdit, rfqFile, setRfqFile, poFile, setPoFile }) => {
    
    const getFileName = (url) => {
        if (!url) return '';
        const parts = url.split('/');
        return parts[parts.length - 1];
    };

    return (
        <div className="mt-3">
            <h6 className="font-weight-bold text-primary mb-3 pb-2 border-bottom">Project Documents</h6>
            
            <div className="row g-4">
                {/* RFQ Document Section */}
                <div className="col-md-6">
                    <div className="card shadow-sm border-0 bg-light h-100">
                        <div className="card-body">
                            <h6 className="font-weight-bold text-dark mb-3 d-flex align-items-center gap-2">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14 2 14 8 20 8"></polyline>
                                    <line x1="16" y1="13" x2="8" y2="13"></line>
                                    <line x1="16" y1="17" x2="8" y2="17"></line>
                                    <polyline points="10 9 9 9 8 9"></polyline>
                                </svg>
                                RFQ Document
                            </h6>
                            
                            {enq.rfq_document && (
                                <div className="mb-3 p-3 bg-white border rounded d-flex align-items-center justify-content-between">
                                    <div className="text-truncate flex-grow-1" style={{ maxWidth: '80%' }}>
                                        <span className="small text-muted d-block">Current File:</span>
                                        <a href={enq.rfq_document} target="_blank" rel="noopener noreferrer" className="font-weight-medium text-decoration-none text-primary text-truncate d-block" title={getFileName(enq.rfq_document)}>
                                            {getFileName(enq.rfq_document)}
                                        </a>
                                    </div>
                                    <a href={enq.rfq_document} download className="btn btn-sm btn-outline-secondary rounded-circle" title="Download RFQ">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                            <polyline points="7 10 12 15 17 10"></polyline>
                                            <line x1="12" y1="15" x2="12" y2="3"></line>
                                        </svg>
                                    </a>
                                </div>
                            )}

                            {canEdit && (
                                <div className="mt-2">
                                    <label className="form-label small font-weight-medium text-secondary">
                                        {enq.rfq_document ? 'Upload New RFQ (overwrites existing)' : 'Upload RFQ Document'}
                                    </label>
                                    <input 
                                        type="file" 
                                        className="form-control form-control-sm" 
                                        accept=".pdf,.doc,.docx,.xls,.xlsx"
                                        onChange={(e) => setRfqFile(e.target.files[0])}
                                    />
                                    {rfqFile && <div className="small text-success mt-1">Selected: {rfqFile.name}</div>}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* PO Document Section */}
                <div className="col-md-6">
                    <div className="card shadow-sm border-0 bg-light h-100">
                        <div className="card-body">
                            <h6 className="font-weight-bold text-dark mb-3 d-flex align-items-center gap-2">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14 2 14 8 20 8"></polyline>
                                    <line x1="16" y1="13" x2="8" y2="13"></line>
                                    <line x1="16" y1="17" x2="8" y2="17"></line>
                                    <polyline points="10 9 9 9 8 9"></polyline>
                                </svg>
                                Purchase Order (PO)
                            </h6>
                            
                            {enq.po_document && (
                                <div className="mb-3 p-3 bg-white border rounded d-flex align-items-center justify-content-between">
                                    <div className="text-truncate flex-grow-1" style={{ maxWidth: '80%' }}>
                                        <span className="small text-muted d-block">Current File:</span>
                                        <a href={enq.po_document} target="_blank" rel="noopener noreferrer" className="font-weight-medium text-decoration-none text-primary text-truncate d-block" title={getFileName(enq.po_document)}>
                                            {getFileName(enq.po_document)}
                                        </a>
                                    </div>
                                    <a href={enq.po_document} download className="btn btn-sm btn-outline-secondary rounded-circle" title="Download PO">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                            <polyline points="7 10 12 15 17 10"></polyline>
                                            <line x1="12" y1="15" x2="12" y2="3"></line>
                                        </svg>
                                    </a>
                                </div>
                            )}

                            {canEdit && (
                                <div className="mt-2">
                                    <label className="form-label small font-weight-medium text-secondary">
                                        {enq.po_document ? 'Upload New PO (overwrites existing)' : 'Upload PO Document'}
                                    </label>
                                    <input 
                                        type="file" 
                                        className="form-control form-control-sm" 
                                        accept=".pdf,.doc,.docx,.xls,.xlsx"
                                        onChange={(e) => setPoFile(e.target.files[0])}
                                    />
                                    {poFile && <div className="small text-success mt-1">Selected: {poFile.name}</div>}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DocumentsTab;
