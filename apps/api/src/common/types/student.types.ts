/**
 * Interface used to temporarely store the students login, 
 * before sending the account creation email to them.
 */
export interface StudentLoginInfo {
    email: string;
    rawPassword: string;
    firstName: string;
    lastName: string;
}