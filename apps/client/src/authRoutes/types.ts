/*
* @Description enum of roles 
*
*/
export const roleEnum = {
     STUDENTS : 'STUDENTS',
     COMPANY: 'COMPANY',
     ADMIN : 'ADMIN'
    } as const;

export type roleEnum = (typeof roleEnum)[keyof typeof roleEnum];
