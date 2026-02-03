import type { userPayload } from '../stores/userStore';

export type userContext = {
    accessToken: string;
    get: (access: string) => userPayload;
};
