import type { NavItem } from './types';

export const centerNavItems: NavItem[] = [
    {
        key: 'forums',
        title: 'Forums',
        to: '/forums',
        type: 'link',
        role: ['ADMIN', 'STUDENT', 'COMPANY'],
    },

     {
        key: 'admin-link', 
        title: 'Dashboard admin', 
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
