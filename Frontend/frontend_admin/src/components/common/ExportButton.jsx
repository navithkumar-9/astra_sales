import { useState } from 'react';
import API from '../../api/axios';
import { useToast } from '../../context/ToastContext';

const ExportButton = ({ filters = {} }) => {
    const { showToast } = useToast();
    const [exporting, setExporting] = useState(false);

    const startExport = async () => {
        try {
            setExporting(true);
            showToast('Export started. Preparing download...', 'info');

            const response = await API.post('/exports/', {
                format: 'csv',
                filters: filters
            }, {
                responseType: 'blob'
            });

            // Create blob and download immediately
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;

            // Extract filename from headers if possible
            const contentDisposition = response.headers['content-disposition'];
            let filename = `enquiry_export_${new Date().toISOString().split('T')[0]}.csv`;
            if (contentDisposition) {
                const matches = /filename="([^"]+)"/.exec(contentDisposition);
                if (matches != null && matches[1]) {
                    filename = matches[1];
                }
            }

            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);

            showToast('Download complete!', 'success');
        } catch (err) {
            showToast('Failed to generate export file.', 'error');
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="d-flex align-items-center gap-2">
            {!exporting ? (
                <button
                    className="btn d-flex align-items-center gap-2 border-0 shadow-sm"
                    onClick={startExport}
                    style={{
                        background: 'linear-gradient(to right, #da8cff, #9a55ff)',
                        color: 'white',
                        fontWeight: '600',
                        padding: '10px 20px',
                        borderRadius: '10px',
                        transition: 'opacity 0.2s'
                    }}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Export CSV
                </button>
            ) : (
                <button
                    className="btn d-flex align-items-center gap-2 border-0 shadow-sm"
                    disabled
                    style={{
                        background: '#e0e0e0',
                        color: '#888',
                        fontWeight: '600',
                        padding: '10px 20px',
                        borderRadius: '10px',
                        cursor: 'not-allowed'
                    }}
                >
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    Exporting...
                </button>
            )}
        </div>
    );
};

export default ExportButton;
