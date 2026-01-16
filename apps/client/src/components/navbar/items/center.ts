import type { NavItem } from './types';

export const centerNavItems: NavItem[] = [
    {
        key: 'forums',
        title: 'FORUMS',
        to: '/forums',
        type: 'link',
        role: ['ADMIN', 'STUDENT', 'COMPANY'],
    },
    {
        key: 'admin-dashboard',
        title: 'ADMINISTRATION',
        to: '/admin/dashboard',
        type: 'link',
        role: ['ADMIN'],
    },

    /*{
        key: 'offers',
        title: 'Annonces',
        to: '/company/dashboard/internships',
        type: 'link',
        role: ['COMPANY'],
    },
      {
        key: 'applications',
        title: 'Candidatures',
        to: '/company/applications',
        type: 'link',
        role: ['COMPANY'],
    },*/
];
