import { Building2, CheckCircle, Search, Shield, TrendingUp, Users } from 'lucide-react';

export const features = [
    {
        icon: <Search className="w-8 h-8" />,
        title: 'Recherche simplifiée',
        description: 'Trouvez des offres de stage adaptées à votre profil grâce à nos filtres intelligents.',
    },
    {
        icon: <Building2 className="w-8 h-8" />,
        title: 'Entreprises vérifiées',
        description: 'Toutes les entreprises sont vérifiées pour garantir la qualité des offres.',
    },
    {
        icon: <Users className="w-8 h-8" />,
        title: 'Communauté active',
        description: "Échangez avec d'autres étudiants et professionnels dans nos forums.",
    },
    {
        icon: <TrendingUp className="w-8 h-8" />,
        title: 'Suivi candidatures',
        description: 'Gérez toutes vos candidatures depuis un tableau de bord unique.',
    },
    {
        icon: <Shield className="w-8 h-8" />,
        title: 'Données sécurisées',
        description: 'Vos données personnelles sont protégées selon les normes RGPD.',
    },
    {
        icon: <CheckCircle className="w-8 h-8" />,
        title: 'Process simplifié',
        description: 'Candidatez en quelques clics avec votre profil préconfiguré.',
    },
];
