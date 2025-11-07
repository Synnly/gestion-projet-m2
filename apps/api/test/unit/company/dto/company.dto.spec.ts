import { CompanyDto } from '../../../../src/company/dto/company.dto';
import { StructureType, LegalStatus } from '../../../../src/company/company.schema';

describe('CompanyDto', () => {
    describe('constructor', () => {


        it('should create instance successfully when constructor is called with all fields', () => {
            const data = {
                _id: '507f1f77bcf86cd799439011',
                email: 'test@example.com',
                name: 'Test Company',
                siretNumber: '12345678901234',
                nafCode: '6202A',
                structureType: StructureType.PrivateCompany,
                legalStatus: LegalStatus.SARL,
                streetNumber: '10',
                streetName: 'Rue de Test',
                postalCode: '75001',
                city: 'Paris',
                country: 'France',
                isValid: true,
            };

            const dto = new CompanyDto(data);

            expect(dto._id).toBe('507f1f77bcf86cd799439011');
            expect(dto.email).toBe('test@example.com');
            expect(dto.name).toBe('Test Company');
            expect(dto.siretNumber).toBe('12345678901234');
            expect(dto.nafCode).toBe('6202A');
            expect(dto.structureType).toBe(StructureType.PrivateCompany);
            expect(dto.legalStatus).toBe(LegalStatus.SARL);
            expect(dto.streetNumber).toBe('10');
            expect(dto.streetName).toBe('Rue de Test');
            expect(dto.postalCode).toBe('75001');
            expect(dto.city).toBe('Paris');
            expect(dto.country).toBe('France');
            expect(dto.isValid).toBe(true);
        });

    it('should create instance successfully when constructor is called with minimal fields', () => {
            const data = {
                _id: '507f1f77bcf86cd799439011',
                email: 'test@example.com',
                name: 'Test Company',
            };

            const dto = new CompanyDto(data);

            expect(dto._id).toBe('507f1f77bcf86cd799439011');
            expect(dto.email).toBe('test@example.com');
            expect(dto.name).toBe('Test Company');
            expect(dto.siretNumber).toBeUndefined();
            expect(dto.nafCode).toBeUndefined();
            expect(dto.structureType).toBeUndefined();
            expect(dto.legalStatus).toBeUndefined();
            expect(dto.streetNumber).toBeUndefined();
            expect(dto.streetName).toBeUndefined();
            expect(dto.postalCode).toBeUndefined();
            expect(dto.city).toBeUndefined();
            expect(dto.country).toBeUndefined();
            expect(dto.isValid).toBeUndefined();
        });

    it('should create instance successfully when constructor is called without data', () => {
            const dto = new CompanyDto();

            expect(dto).toBeDefined();
            expect(dto._id).toBeUndefined();
            expect(dto.email).toBeUndefined();
            expect(dto.name).toBeUndefined();
        });

    it('should create instance successfully when constructor is called with undefined', () => {
            const dto = new CompanyDto(undefined);

            expect(dto).toBeDefined();
            expect(dto._id).toBeUndefined();
            expect(dto.email).toBeUndefined();
            expect(dto.name).toBeUndefined();
        });

    it('should create instance successfully when constructor is called with null values', () => {
            const data = {
                _id: '507f1f77bcf86cd799439011',
                email: 'test@example.com',
                name: 'Test Company',
                siretNumber: null as any,
                nafCode: null as any,
                structureType: null as any,
                legalStatus: null as any,
                streetNumber: null as any,
                streetName: null as any,
                postalCode: null as any,
                city: null as any,
                country: null as any,
                isValid: null as any,
            };

            const dto = new CompanyDto(data);

            expect(dto._id).toBe('507f1f77bcf86cd799439011');
            expect(dto.email).toBe('test@example.com');
            expect(dto.name).toBe('Test Company');
            expect(dto.siretNumber).toBeNull();
            expect(dto.nafCode).toBeNull();
            expect(dto.structureType).toBeNull();
            expect(dto.legalStatus).toBeNull();
            expect(dto.streetNumber).toBeNull();
            expect(dto.streetName).toBeNull();
            expect(dto.postalCode).toBeNull();
            expect(dto.city).toBeNull();
            expect(dto.country).toBeNull();
            expect(dto.isValid).toBeNull();
        });

    it('should create instance successfully when constructor is called with empty strings', () => {
            const data = {
                _id: '',
                email: '',
                name: '',
                siretNumber: '',
                nafCode: '',
                streetNumber: '',
                streetName: '',
                postalCode: '',
                city: '',
                country: '',
            };

            const dto = new CompanyDto(data);

            expect(dto._id).toBe('');
            expect(dto.email).toBe('');
            expect(dto.name).toBe('');
            expect(dto.siretNumber).toBe('');
            expect(dto.nafCode).toBe('');
            expect(dto.streetNumber).toBe('');
            expect(dto.streetName).toBe('');
            expect(dto.postalCode).toBe('');
            expect(dto.city).toBe('');
            expect(dto.country).toBe('');
        });

    it('should create instance successfully when constructor is called with each StructureType value', () => {
            Object.values(StructureType).forEach((structureType) => {
                const data = {
                    _id: '507f1f77bcf86cd799439011',
                    email: 'test@example.com',
                    name: 'Test Company',
                    structureType: structureType,
                };

                const dto = new CompanyDto(data);

                expect(dto.structureType).toBe(structureType);
            });
        });

    it('should create instance successfully when constructor is called with each LegalStatus value', () => {
            Object.values(LegalStatus).forEach((legalStatus) => {
                const data = {
                    _id: '507f1f77bcf86cd799439011',
                    email: 'test@example.com',
                    name: 'Test Company',
                    legalStatus: legalStatus,
                };

                const dto = new CompanyDto(data);

                expect(dto.legalStatus).toBe(legalStatus);
            });
        });

    it('should create instance successfully when constructor is called with isValid false', () => {
            const data = {
                _id: '507f1f77bcf86cd799439011',
                email: 'test@example.com',
                name: 'Test Company',
                isValid: false,
            };

            const dto = new CompanyDto(data);

            expect(dto.isValid).toBe(false);
        });

    it('should create instance successfully when constructor is called with isValid true', () => {
            const data = {
                _id: '507f1f77bcf86cd799439011',
                email: 'test@example.com',
                name: 'Test Company',
                isValid: true,
            };

            const dto = new CompanyDto(data);

            expect(dto.isValid).toBe(true);
        });

    it('should create instance successfully when constructor is called with partial address data', () => {
            const data = {
                _id: '507f1f77bcf86cd799439011',
                email: 'test@example.com',
                name: 'Test Company',
                city: 'Paris',
                country: 'France',
            };

            const dto = new CompanyDto(data);

            expect(dto.city).toBe('Paris');
            expect(dto.country).toBe('France');
            expect(dto.streetNumber).toBeUndefined();
            expect(dto.streetName).toBeUndefined();
            expect(dto.postalCode).toBeUndefined();
        });

    it('should create instance successfully when constructor is called with extra properties', () => {
            const data = {
                _id: '507f1f77bcf86cd799439011',
                email: 'test@example.com',
                name: 'Test Company',
                extraField: 'extra value',
                anotherExtra: 123,
            } as any;

            const dto = new CompanyDto(data);

            expect(dto._id).toBe('507f1f77bcf86cd799439011');
            expect(dto.email).toBe('test@example.com');
            expect(dto.name).toBe('Test Company');
            expect((dto as any).extraField).toBe('extra value');
            expect((dto as any).anotherExtra).toBe(123);
        });

    it('should create instance successfully when constructor is passed a Company entity object', () => {
            const company = {
                _id: '507f1f77bcf86cd799439011',
                email: 'test@example.com',
                password: 'hashedPassword',
                name: 'Test Company',
                isValid: true,
            };

            const dto = new CompanyDto(company);

            expect(dto._id).toBe('507f1f77bcf86cd799439011');
            expect(dto.email).toBe('test@example.com');
            expect(dto.name).toBe('Test Company');
            expect(dto.isValid).toBe(true);
            expect((dto as any).password).toBe('hashedPassword');
        });

    it('should create multiple instances independently when constructor is called repeatedly', () => {
            const data1 = {
                _id: '507f1f77bcf86cd799439011',
                email: 'test1@example.com',
                name: 'Test Company 1',
            };

            const data2 = {
                _id: '507f1f77bcf86cd799439012',
                email: 'test2@example.com',
                name: 'Test Company 2',
            };

            const dto1 = new CompanyDto(data1);
            const dto2 = new CompanyDto(data2);

            expect(dto1._id).toBe('507f1f77bcf86cd799439011');
            expect(dto2._id).toBe('507f1f77bcf86cd799439012');
            expect(dto1.email).toBe('test1@example.com');
            expect(dto2.email).toBe('test2@example.com');
        });

    it('should create instance successfully when constructor is called with nested objects', () => {
            const data = {
                _id: '507f1f77bcf86cd799439011',
                email: 'test@example.com',
                name: 'Test Company',
                nestedObject: {
                    key: 'value',
                },
            } as any;

            const dto = new CompanyDto(data);

            expect(dto._id).toBe('507f1f77bcf86cd799439011');
            expect((dto as any).nestedObject).toEqual({ key: 'value' });
        });

    it('should create instance successfully when constructor is called with array properties', () => {
            const data = {
                _id: '507f1f77bcf86cd799439011',
                email: 'test@example.com',
                name: 'Test Company',
                arrayProp: ['item1', 'item2'],
            } as any;

            const dto = new CompanyDto(data);

            expect(dto._id).toBe('507f1f77bcf86cd799439011');
            expect((dto as any).arrayProp).toEqual(['item1', 'item2']);
        });
    });

    describe('property access', () => {


        it('should allow property modification when properties are modified after construction', () => {
            const dto = new CompanyDto({
                _id: '507f1f77bcf86cd799439011',
                email: 'test@example.com',
                name: 'Test Company',
            });

            dto.name = 'Modified Company';
            dto.email = 'modified@example.com';

            expect(dto.name).toBe('Modified Company');
            expect(dto.email).toBe('modified@example.com');
        });

    it('should allow adding optional properties successfully when properties are set after creation', () => {
            const dto = new CompanyDto({
                _id: '507f1f77bcf86cd799439011',
                email: 'test@example.com',
                name: 'Test Company',
            });

            dto.siretNumber = '12345678901234';
            dto.isValid = true;

            expect(dto.siretNumber).toBe('12345678901234');
            expect(dto.isValid).toBe(true);
        });
    });
});
