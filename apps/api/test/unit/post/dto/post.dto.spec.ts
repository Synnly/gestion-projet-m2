import { Types } from 'mongoose';
import { PostDto } from '../../../../src/post/dto/post.dto';

describe('PostDto', () => {
    describe('constructor', () => {
        it('should create instance successfully when constructor is called with all fields', () => {
            const data: any = {
                _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
                title: 'Titre Offre',
                description: 'Développeur Front End',
                duration: '6 mois',
                startDate: '21/03/2026',
                minSalary: 1500,
                maxSalary: 2000,
                sector: 'IT',
                keySkills: ['Rapide', 'Ponctuel'],
                adress: 'Paris, France',
                type: 'Présentiel',
            };

            const dto = new PostDto(data);

            expect(dto._id.toHexString()).toBe('507f1f77bcf86cd799439011');
            expect(dto.title).toBe('Titre Offre');
            expect(dto.description).toBe('Développeur Front End');
            expect(dto.duration).toBe('6 mois');
            expect(dto.startDate).toBe('21/03/2026');
            expect(dto.minSalary).toBe(1500);
            expect(dto.maxSalary).toBe(2000);
            expect(dto.sector).toBe('IT');
            expect(dto.keySkills).toStrictEqual(['Rapide', 'Ponctuel']);
            expect(dto.adress).toBe('Paris, France');
            expect(dto.type).toBe('Présentiel');
            expect(dto.isVisible).toBe(true);
        });
        it('should create instance successfully when constructor is called with all fields except title, isVisible set to false', () => {
            const data: any = {
                _id: new Types.ObjectId('507f1f77bcf86cd799439012'),
                title: '',
                description: 'Développeur Back End',
                duration: '2 mois',
                creationDate: '18/11/2025',
                startDate: '15/04/2026',
                minSalary: 1300,
                maxSalary: 2200,
                sector: 'IT',
                keySkills: ['Rapide', 'Ponctuel'],
                adress: 'Paris, France',
                type: 'Présentiel',
            };

            const dto = new PostDto(data);

            expect(dto._id.toHexString()).toBe('507f1f77bcf86cd799439012');
            expect(dto.title).toBe('');
            expect(dto.description).toBe('Développeur Back End');
            expect(dto.duration).toBe('2 mois');
            expect(dto.startDate).toBe('15/04/2026');
            expect(dto.minSalary).toBe(1300);
            expect(dto.maxSalary).toBe(2200);
            expect(dto.sector).toBe('IT');
            expect(dto.keySkills).toStrictEqual(['Rapide', 'Ponctuel']);
            expect(dto.adress).toBe('Paris, France');
            expect(dto.type).toBe('Présentiel');
            expect(dto.isVisible).toBe(false);
        });
        it('should create instance successfully when constructor is called with all fields except description, isVisible set to false', () => {
            const data: any = {
                _id: new Types.ObjectId('507f1f77bcf86cd799439032'),
                title: 'Titre Offre développeur',
                description: '',
                duration: '4 mois',
                creationDate: '18/11/2025',
                startDate: '03/05/2026',
                minSalary: 1200,
                maxSalary: 1900,
                sector: 'IT',
                keySkills: ['Rapide', 'Ponctuel'],
                adress: 'Paris, France',
                type: 'Hybride',
            };
            const dto = new PostDto(data);
            expect(dto._id.toHexString()).toBe('507f1f77bcf86cd799439032');
            expect(dto.title).toBe('Titre Offre développeur');
            expect(dto.description).toBe('');
            expect(dto.duration).toBe('4 mois');
            expect(dto.startDate).toBe('03/05/2026');
            expect(dto.minSalary).toBe(1200);
            expect(dto.maxSalary).toBe(1900);
            expect(dto.sector).toBe('IT');
            expect(dto.keySkills).toStrictEqual(['Rapide', 'Ponctuel']);
            expect(dto.adress).toBe('Paris, France');
            expect(dto.type).toBe('Hybride');
            expect(dto.isVisible).toBe(false);
        });
    });
});
