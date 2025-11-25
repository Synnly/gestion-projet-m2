/**
 * Enumeration of user roles in the system
 * Defines the three levels of user access
 */
export enum Role {
    STUDENT = 'STUDENT',
    COMPANY = 'COMPANY',
    ADMIN = 'ADMIN',
}

/**
 * Defines the hierarchical relationship between roles
 * Each role has access to its own permissions plus any roles included in its hierarchy
 * For example, ADMIN has access to STUDENT, COMPANY, and ADMIN permissions
 * @readonly
 */
export const RoleHierarchy: Readonly<Record<Role, Role[]>> = {
    [Role.STUDENT]: [Role.STUDENT],
    [Role.COMPANY]: [Role.COMPANY],
    [Role.ADMIN]: [Role.STUDENT, Role.COMPANY, Role.ADMIN],
};
