export type userContext = {
    accessToken: string;
    get: (access: string) => { id: string; role: string; isVerified: boolean; isValid: boolean };
};
