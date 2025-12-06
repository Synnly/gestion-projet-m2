import { Request } from 'express';

/**
 * Déclaration TypeScript pour étendre le type Request d'Express
 * Ajoute la propriété 'user' qui contient le payload JWT décodé
 * Type-safety : Dans les contrôleurs, middlewares et services,
 * on peut accéder à req.user.sub ou req.user.email directement,
 * avec autocomplétion et vérification de type, sans caster req
 * ou définir un type local.
 */
declare global {
    namespace Express {
        interface Request {
            user?: {
                sub?: string;
                email?: string;
                role?: string;
                [key: string]: any;
            };
        }
    }
}

export {};
