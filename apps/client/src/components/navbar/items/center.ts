import type { NavItem } from './types';

export const centerNavItems: NavItem[] = [
    {
        key: 'home-company',
        title: 'TABLEAU DE BORD',
        to: '/company/dashboard',
        type: 'link',
        role: ['COMPANY'],
    },
    {
        key: 'home-student',
        title: 'TABLEAU DE BORD',
        to: '/student/dashboard',
        type: 'link',
        role: ['STUDENT'],
    },
    {
        key: 'home-admin',
        title: 'TABLEAU DE BORD',
        to: '/admin/dashboard',
        type: 'link',
        role: ['ADMIN'],
    },
     {
        key: 'admin-stats-link', // New item for admin stats
        title: 'Statistiques', // Title for the link
        to: '/admin/stats', // Route to the stats page
        role: ['ADMIN'], // Only visible for ADMIN role
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
