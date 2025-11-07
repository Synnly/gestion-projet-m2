export enum Role {
    USER = 'USER',
    COMPANY = 'COMPANY',
    ADMIN = 'ADMIN',
}

/**
 * RoleHierarchy describes which roles are implied by a granted role.
 * Key: granted role. Value: array of roles that the granted role includes.
 * This allows simple hierarchical checks: a user granted ADMIN implicitly has COMPANY and USER.
 */
export const RoleHierarchy: Readonly<Record<Role, Role[]>> = {
    [Role.USER]: [Role.USER],
    [Role.COMPANY]: [Role.USER, Role.COMPANY],
    [Role.ADMIN]: [Role.USER, Role.COMPANY, Role.ADMIN],
};
