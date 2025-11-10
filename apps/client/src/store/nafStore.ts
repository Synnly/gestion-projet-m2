import { create } from 'zustand';
import { persist } from 'zustand/middleware';
const fetchNaf = async () => {
    const res = await fetch(
        'https://public.opendatasoft.com/api/records/1.0/search/?dataset=naf2008_5_niveaux&rows=5000',
    );
    const data = await res.json();
    return data.records
        .map((r) => r.fields)
        .map((f) => ({
            activite: f.activite,
            code: f.code_section + f.code_classe,
        }));
};
// 2️⃣ Top-level await pour initialiser
const nafCode = await fetchNaf();

type nafCodeType = {
    activite: string;
    code: string;
};
type nafStore = {
    nafList: nafCodeType[];
    find: (code: string) => nafCodeType | undefined;
};

export const useNafStore = create<nafStore>()(
    persist(
        (set,get) => ({
            nafList: nafCode,
            find:(nafCode:string) => get().nafList.find(naf => naf.code = nafCode) 
        }),
        { name: 'naf-storage' },
    ),
);
