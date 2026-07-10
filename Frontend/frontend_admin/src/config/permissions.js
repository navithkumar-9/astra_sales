export const ROLES = {
    SUPERADMIN: 'SUPERADMIN',
    ADMIN: 'ADMIN',
    SALES_REP: 'SALES_REP',
    RFQ_TRACKER: 'RFQ_TRACKER'
};

export const PERMISSIONS = {
    // Master Data
    CAN_VIEW_MASTER_DATA: [ROLES.SUPERADMIN, ROLES.ADMIN],
    CAN_MANAGE_USERS: [ROLES.SUPERADMIN],
    
    // Enquiries / Pipeline
    CAN_EDIT_ENGG: [ROLES.RFQ_TRACKER],
    CAN_EDIT_COSTING: [ROLES.RFQ_TRACKER],
    CAN_EDIT_SALES: [ROLES.RFQ_TRACKER, ROLES.SALES_REP],
    
    // Feature Visibility
    CAN_VIEW_DASHBOARD: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.SALES_REP, ROLES.RFQ_TRACKER],
    CAN_VIEW_REPORTS: [ROLES.SUPERADMIN, ROLES.ADMIN]
};

/**
 * Check if a user role has a specific permission
 * @param {string} userRole - The role of the current user
 * @param {Array<string>} permissionRoles - Array of roles allowed for the permission
 * @returns {boolean}
 */
export const hasPermission = (userRole, permissionRoles) => {
    if (!userRole || !permissionRoles) return false;
    return permissionRoles.includes(userRole);
};
