import type { NavItem } from './types';

export const rightNavItems: NavItem[] = [
    {
        key: 'addOffer',
        title: 'Ajouter annonce',
        to: '/company/offers/add',
        type: 'button',
        className: 'btn btn-primary text-primary-content',
        role: ['COMPANY'],
    },
    {
        key: 'profileDropdown',
        title: 'ProfileDropdown',
        type: 'dropdown',
        children: [
            {
                key: 'profile',
                title: 'Profil',
                to: '/company/profile',
                type: 'link',
                role: ['COMPANY'],
            },
            {
                key: 'profile',
                title: 'Profil',
                to: '/student/profile',
                type: 'link',
                role: ['STUDENT'],
            },
            {
                key: 'logout',
                title: 'Se déconnecter',
                type: 'link',
                to: '/logout',
                className: 'text-red-600',
                role: ['COMPANY', 'STUDENT', 'ADMIN'],
            },
        ],
    },
];
