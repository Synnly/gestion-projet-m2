// Comprehensive filter definitions matching API PaginationDto / QueryBuilder
export const internshipFilters = [
    { label: 'Type', key: 'type', options: ['Présentiel', 'Télétravail', 'Hybride'] },
    { label: 'Secteur', key: 'sector', options: ['Technologie',
        'Informatique / IT',
        'Marketing',
        'Design',
        'Finance',
        'Communication',
        'Ressources Humaines',
        'Juridique',
        'Ingénierie',
        'Data / IA',
        'Product Management',
        'Support / Customer Success',
        'Opérations / Logistique',
        'Santé / Biotech',
        'Éducation / Formation'] },
    { label: 'Durée', key: 'duration', options: ['1 mois', '2 mois', '3 mois', '6 mois'] },
    { label: 'Salaire min', key: 'minSalary', options: ['0', '500', '1000', '1500', '2000'] },
    { label: 'Salaire max', key: 'maxSalary', options: ['500', '1000', '1500', '2000', '2500'] },
    { label: 'Ville', key: 'city', options: [] },
    { label: 'Rayon (km)', key: 'radiusKm', options: [] },
];

export const sortOptions = [
    { label: 'Plus récentes', value: 'dateDesc' },
    { label: 'Plus anciennes', value: 'dateAsc' },
    { label: 'Pertinence (texte)', value: 'relevance' },
];

// Helpful presets for mapping UI options to API-friendly payloads
export const mapOptionToPayload = (key: string, value: string | number | undefined) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (key === 'minSalary' || key === 'maxSalary' || key === 'radiusKm') return Number(value);
    if (key === 'keySkills') return value; // backend accepts string or array
    return value;
};
