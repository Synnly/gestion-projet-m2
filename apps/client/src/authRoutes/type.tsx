import type { userPayload } from '../store/userStore';

export type userContext = {
    accessToken: string;
    get: (access: string) => userPayload;
};
