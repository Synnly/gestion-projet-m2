import type { NavItem } from './types';

export const rightNavItems: NavItem[] = [
    {
        key: 'addOffer',
        title: 'Ajouter annonce',
        to: '/company/offers/add',
        type: 'button',
        className: 'btn btn-primary text-black rounded-xl',
        role: ['COMPANY'],
    },
    {
        key: 'profileDropdown',
        title: 'ProfileDropdown',
        type: 'dropdown',
        role: ['COMPANY'],
        children: [
            {
                key: 'profile',
                title: 'Profil',
                to: '/company/profile',
                type: 'link',
            },
            {
                key: 'logout',
                title: 'Se déconnecter',
                type: 'link',
                to: '/logout',
                className: 'text-red-600',
            },
        ],
    },
];
