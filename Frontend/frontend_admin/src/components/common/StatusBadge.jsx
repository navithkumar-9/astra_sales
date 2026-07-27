import React from 'react';

const STATUS_CONFIG = {
    'Pending with Engg': {
        bg: '#e0f2fe',
        color: '#0369a1',
        border: '#bae6fd',
        label: 'Pending with Engg'
    },
    'Pending with Costing': {
        bg: '#f3e8ff',
        color: '#6b21a8',
        border: '#e9d5ff',
        label: 'Pending with Costing'
    },
    'Sales to Quote': {
        bg: '#fff7ed',
        color: '#c2410c',
        border: '#ffedd5',
        label: 'Sales to Quote'
    },
    'Pending with Sales': {
        bg: '#fefce8',
        color: '#a16207',
        border: '#fef08a',
        label: 'Pending with Sales'
    },
    'Quote Submitted': {
        bg: '#f0f9ff',
        color: '#0284c7',
        border: '#bae6fd',
        label: 'Quote Submitted'
    },
    'On Hold': {
        bg: '#fffbe6',
        color: '#d97706',
        border: '#fef3c7',
        label: 'On Hold'
    },
    'Open - L1': {
        bg: '#fff1f2',
        color: '#be123c',
        border: '#fecdd3',
        label: 'Open - L1'
    },
    'Won': {
        bg: '#ecfdf5',
        color: '#047857',
        border: '#a7f3d0',
        label: 'Won'
    },
    'Lost': {
        bg: '#f1f5f9',
        color: '#475569',
        border: '#e2e8f0',
        label: 'Lost'
    },
    'Regretted': {
        bg: '#fff5f5',
        color: '#c53030',
        border: '#feb2b2',
        label: 'Regretted'
    },
    'Quote Regretted': {
        bg: '#fff5f5',
        color: '#c53030',
        border: '#feb2b2',
        label: 'Quote Regretted'
    }
};

const DEFAULT_CONFIG = {
    bg: '#f8fafc',
    color: '#475569',
    border: '#e2e8f0',
    label: 'Unknown'
};

export const getStatusBadgeStyle = (status) => {
    return STATUS_CONFIG[status] || DEFAULT_CONFIG;
};

const StatusBadge = ({ status, size = 'normal', className = '', style = {} }) => {
    const config = getStatusBadgeStyle(status);
    const isSmall = size === 'small' || size === 'sm';
    
    return (
        <span 
            className={`badge rounded-pill d-inline-flex align-items-center justify-content-center ${className}`}
            style={{
                backgroundColor: config.bg,
                color: config.color,
                border: `1px solid ${config.border}`,
                fontSize: isSmall ? '0.68rem' : '0.74rem',
                fontWeight: '700',
                padding: isSmall ? '3px 8px' : '5px 11px',
                letterSpacing: '0.3px',
                whiteSpace: 'nowrap',
                lineHeight: 1.3,
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                ...style
            }}
        >
            {status || config.label}
        </span>
    );
};

export default StatusBadge;
