import * as crypto from 'crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EncryptionService } from '../../../src/s3/encryption.service';

describe('EncryptionService - Basic functionality', () => {
    it('should construct with valid base64 key and encrypt/decrypt data', () => {
        const key = crypto.randomBytes(32).toString('base64');
        const config = { get: jest.fn().mockReturnValue(key) } as any;
        const svc = new EncryptionService(config);

        const data = Buffer.from('hello world');
        const { encryptedData, metadata } = svc.encrypt(data);

        const decrypted = svc.decrypt(encryptedData, metadata as any);
        expect(decrypted.toString()).toBe('hello world');
    });

    it('should throw on invalid base64 key', () => {
        const config = { get: jest.fn().mockReturnValue('not-base64') } as any;
        expect(() => new EncryptionService(config)).toThrow();
    });

    it('should allow missing key in non-production and isEncryptionEnabled false', () => {
        const config = { get: jest.fn().mockReturnValue(undefined) } as any;
        const svc = new EncryptionService(config);
        expect(svc.isEncryptionEnabled()).toBe(false);
    });

    it('should throw when decrypting with wrong algorithm', () => {
        const key = crypto.randomBytes(32).toString('base64');
        const config = { get: jest.fn().mockReturnValue(key) } as any;
        const svc = new EncryptionService(config);

        const data = Buffer.from('ok');
        const { encryptedData, metadata } = svc.encrypt(data);

        // tamper algorithm
        const badMeta = { ...metadata, algorithm: 'bad-algo' } as any;
        expect(() => svc.decrypt(encryptedData, badMeta)).toThrow(/Unsupported encryption algorithm/);
    });

    it('rotateMasterKey should validate input', () => {
        const key = crypto.randomBytes(32).toString('base64');
        const config = { get: jest.fn().mockReturnValue(key) } as any;
        const svc = new EncryptionService(config);

        expect(() => svc.rotateMasterKey('not-base64')).toThrow();

        const newKey = crypto.randomBytes(32).toString('base64');
        expect(() => svc.rotateMasterKey(newKey)).not.toThrow();
    });
});

describe('EncryptionService - Production mode coverage', () => {
    it('should throw when STORAGE_MASTER_KEY missing in production', () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';

        const config = { get: jest.fn().mockReturnValue(undefined) } as any;

        expect(() => new EncryptionService(config)).toThrow('Missing STORAGE_MASTER_KEY in production');

        process.env.NODE_ENV = originalEnv;
    });

    it('should throw when key length is incorrect after decoding', () => {
        // Create a 32-byte key but modify Buffer.from to return wrong length
        const validKey = crypto.randomBytes(32).toString('base64');
        const config = { get: jest.fn().mockReturnValue(validKey) } as any;

        // Mock Buffer.from to return a buffer with wrong length
        const originalFrom = Buffer.from;
        Buffer.from = jest.fn().mockReturnValue(crypto.randomBytes(16)) as any;

        expect(() => new EncryptionService(config)).toThrow(/Master key must be 256 bits/);

        Buffer.from = originalFrom;
    });

    it('should catch and wrap Buffer.from errors', () => {
        const config = { get: jest.fn().mockReturnValue('validbase64butweirdchars!!!') } as any;

        expect(() => new EncryptionService(config)).toThrow(/Invalid STORAGE_MASTER_KEY format/);
    });

    it('should throw on decrypt authentication failure', () => {
        const key = crypto.randomBytes(32).toString('base64');
        const config = { get: jest.fn().mockReturnValue(key) } as any;
        const svc = new EncryptionService(config);

        const data = Buffer.from('test');
        const { encryptedData, metadata } = svc.encrypt(data);

        // Tamper with encrypted data to cause auth tag verification failure
        const tamperedData = Buffer.from(encryptedData);
        tamperedData[0] = tamperedData[0] ^ 0xff;

        expect(() => svc.decrypt(tamperedData, metadata as any)).toThrow(/Failed to decrypt data/);
    });
});

describe('EncryptionService', () => {
    let service: EncryptionService;
    let configService: ConfigService;

    const validMasterKey = Buffer.from('a'.repeat(32)).toString('base64');

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EncryptionService,
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn().mockReturnValue(validMasterKey),
                    },
                },
            ],
        }).compile();

        service = module.get<EncryptionService>(EncryptionService);
        configService = module.get<ConfigService>(ConfigService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('constructor', () => {
        it('should initialize with valid master key', () => {
            expect(service).toBeDefined();
        });

        it('should warn if STORAGE_MASTER_KEY is not configured', async () => {
            const module = await Test.createTestingModule({
                providers: [
                    EncryptionService,
                    {
                        provide: ConfigService,
                        useValue: {
                            get: jest.fn().mockReturnValue(undefined),
                        },
                    },
                ],
            }).compile();

            const serviceWithoutKey = module.get<EncryptionService>(EncryptionService);
            expect(serviceWithoutKey).toBeDefined();
        });

        it('should throw error for invalid master key length', async () => {
            const shortKey = Buffer.from('short').toString('base64');

            await expect(
                Test.createTestingModule({
                    providers: [
                        EncryptionService,
                        {
                            provide: ConfigService,
                            useValue: {
                                get: jest.fn().mockReturnValue(shortKey),
                            },
                        },
                    ],
                }).compile(),
            ).rejects.toThrow('Invalid STORAGE_MASTER_KEY format');
        });

        it('should throw error for invalid base64 format', async () => {
            const invalidBase64 = '!!!invalid-base64!!!';

            await expect(
                Test.createTestingModule({
                    providers: [
                        EncryptionService,
                        {
                            provide: ConfigService,
                            useValue: {
                                get: jest.fn().mockReturnValue(invalidBase64),
                            },
                        },
                    ],
                }).compile(),
            ).rejects.toThrow('Invalid STORAGE_MASTER_KEY format');
        });
    });

    describe('encrypt', () => {
        it('should encrypt data successfully', () => {
            const data = Buffer.from('test data to encrypt');

            const result = service.encrypt(data);

            expect(result.encryptedData).toBeInstanceOf(Buffer);
            expect(result.encryptedData.length).toBeGreaterThan(0);
            expect(result.metadata).toHaveProperty('algorithm');
            expect(result.metadata).toHaveProperty('dekEncrypted');
            expect(result.metadata).toHaveProperty('dekIv');
            expect(result.metadata).toHaveProperty('dekAuthTag');
            expect(result.metadata).toHaveProperty('dataIv');
            expect(result.metadata).toHaveProperty('dataAuthTag');
        });

        it('should use aes-256-gcm algorithm', () => {
            const data = Buffer.from('test');

            const result = service.encrypt(data);

            expect(result.metadata.algorithm).toBe('aes-256-gcm');
        });

        it('should generate unique encryption for same data', () => {
            const data = Buffer.from('identical data');

            const result1 = service.encrypt(data);
            const result2 = service.encrypt(data);

            // Les données chiffrées doivent être différentes (IV différent)
            expect(result1.encryptedData).not.toEqual(result2.encryptedData);
            expect(result1.metadata.dataIv).not.toBe(result2.metadata.dataIv);
        });

        it('should encrypt empty buffer', () => {
            const emptyData = Buffer.from('');

            const result = service.encrypt(emptyData);

            expect(result.encryptedData).toBeInstanceOf(Buffer);
            expect(result.metadata).toBeDefined();
        });

        it('should encrypt large data', () => {
            const largeData = Buffer.alloc(1024 * 1024); // 1MB

            const result = service.encrypt(largeData);

            expect(result.encryptedData).toBeInstanceOf(Buffer);
            expect(result.encryptedData.length).toBeGreaterThan(0);
        });
    });

    describe('decrypt', () => {
        it('should decrypt encrypted data successfully', () => {
            const originalData = Buffer.from('secret data');

            const { encryptedData, metadata } = service.encrypt(originalData);
            const decryptedData = service.decrypt(encryptedData, metadata);

            expect(decryptedData).toEqual(originalData);
        });

        it('should decrypt empty buffer', () => {
            const originalData = Buffer.from('');

            const { encryptedData, metadata } = service.encrypt(originalData);
            const decryptedData = service.decrypt(encryptedData, metadata);

            expect(decryptedData).toEqual(originalData);
        });

        it('should decrypt large data', () => {
            const originalData = Buffer.alloc(1024 * 1024, 'x'); // 1MB

            const { encryptedData, metadata } = service.encrypt(originalData);
            const decryptedData = service.decrypt(encryptedData, metadata);

            expect(decryptedData).toEqual(originalData);
        });

        it('should throw error for unsupported algorithm', () => {
            const originalData = Buffer.from('test');
            const { encryptedData, metadata } = service.encrypt(originalData);

            metadata.algorithm = 'unsupported-algo';

            expect(() => service.decrypt(encryptedData, metadata)).toThrow('Unsupported encryption algorithm');
        });

        it('should throw error for invalid auth tag', () => {
            const originalData = Buffer.from('test');
            const { encryptedData, metadata } = service.encrypt(originalData);

            // Modifier l'authTag pour le rendre invalide
            metadata.dataAuthTag = Buffer.from('invalid-auth-tag-16b').toString('base64');

            expect(() => service.decrypt(encryptedData, metadata)).toThrow();
        });

        it('should throw error for tampered encrypted data', () => {
            const originalData = Buffer.from('test data');
            const { encryptedData, metadata } = service.encrypt(originalData);

            // Modifier les données chiffrées
            encryptedData[0] = encryptedData[0] ^ 0xff;

            expect(() => service.decrypt(encryptedData, metadata)).toThrow();
        });

        it('should throw error for invalid DEK metadata', () => {
            const originalData = Buffer.from('test');
            const { encryptedData, metadata } = service.encrypt(originalData);

            // Modifier la DEK chiffrée
            metadata.dekEncrypted = 'invalid-base64';

            expect(() => service.decrypt(encryptedData, metadata)).toThrow();
        });
    });

    describe('encrypt/decrypt round trip', () => {
        it('should handle special characters', () => {
            const originalData = Buffer.from('Données avec accents: éàùô €£¥');

            const { encryptedData, metadata } = service.encrypt(originalData);
            const decryptedData = service.decrypt(encryptedData, metadata);

            expect(decryptedData.toString('utf-8')).toBe(originalData.toString('utf-8'));
        });

        it('should handle binary data', () => {
            const originalData = Buffer.from([0x00, 0xff, 0x01, 0xfe, 0x02]);

            const { encryptedData, metadata } = service.encrypt(originalData);
            const decryptedData = service.decrypt(encryptedData, metadata);

            expect(decryptedData).toEqual(originalData);
        });

        it('should handle multiple encryption/decryption cycles', () => {
            const originalData = Buffer.from('cycle test data');

            // Premier cycle
            const { encryptedData: enc1, metadata: meta1 } = service.encrypt(originalData);
            const dec1 = service.decrypt(enc1, meta1);
            expect(dec1).toEqual(originalData);

            // Deuxième cycle avec les données décryptées
            const { encryptedData: enc2, metadata: meta2 } = service.encrypt(dec1);
            const dec2 = service.decrypt(enc2, meta2);
            expect(dec2).toEqual(originalData);
        });
    });

    describe('isEncryptionEnabled', () => {
        it('should return true when encryption is enabled', () => {
            const enabled = service.isEncryptionEnabled();

            expect(enabled).toBe(true);
        });

        it('should return false when master key is not configured', async () => {
            const module = await Test.createTestingModule({
                providers: [
                    EncryptionService,
                    {
                        provide: ConfigService,
                        useValue: {
                            get: jest.fn().mockReturnValue(undefined),
                        },
                    },
                ],
            }).compile();

            const serviceWithoutKey = module.get<EncryptionService>(EncryptionService);
            const enabled = serviceWithoutKey.isEncryptionEnabled();

            expect(enabled).toBe(false);
        });
    });

    describe('rotateMasterKey', () => {
        it('should successfully rotate master key with valid base64 key', () => {
            const newKey = crypto.randomBytes(32).toString('base64');

            expect(() => service.rotateMasterKey(newKey)).not.toThrow();

            // Verify the new key works by encrypting and decrypting
            const testData = Buffer.from('test after rotation');
            const { encryptedData, metadata } = service.encrypt(testData);
            const decrypted = service.decrypt(encryptedData, metadata);

            expect(decrypted).toEqual(testData);
        });

        it('should throw error for invalid base64 format', () => {
            const invalidKey = 'not-valid-base64!!!';

            expect(() => service.rotateMasterKey(invalidKey)).toThrow(
                'Invalid new master key format (expected base64 43-44 chars)',
            );
        });

        it('should throw error for short base64 key', () => {
            const shortKey = Buffer.from('short').toString('base64');

            expect(() => service.rotateMasterKey(shortKey)).toThrow(
                'Invalid new master key format (expected base64 43-44 chars)',
            );
        });

        it('should throw error for long base64 key', () => {
            const longKey = Buffer.from('a'.repeat(64)).toString('base64');

            expect(() => service.rotateMasterKey(longKey)).toThrow(
                'Invalid new master key format (expected base64 43-44 chars)',
            );
        });

        it('should throw error for valid base64 but wrong byte length', () => {
            // Créer une clé de 33 bytes (pas 32) qui donne un base64 de 44 chars (format valide)
            // Mais qui decode en 33 bytes au lieu de 32
            const wrongLengthKey = Buffer.from('a'.repeat(33)).toString('base64'); // 33 bytes -> 44 chars base64

            expect(() => service.rotateMasterKey(wrongLengthKey)).toThrow('New master key must be 32 bytes');
        });
    });

    describe('encryptStream', () => {
        it('should encrypt buffer and return readable stream with metadata', async () => {
            const testData = Buffer.from('test data for streaming');

            const result = await service.encryptStream(testData);

            expect(result).toHaveProperty('stream');
            expect(result).toHaveProperty('metadata');
            expect(result.metadata).toHaveProperty('dekEncrypted');
            expect(result.metadata).toHaveProperty('dekIv');
            expect(result.metadata).toHaveProperty('dekAuthTag');
            expect(result.metadata).toHaveProperty('dataIv');
            expect(result.metadata).toHaveProperty('dataAuthTag');

            // Read stream and verify it contains encrypted data
            const chunks: Buffer[] = [];
            result.stream.on('data', (chunk) => chunks.push(chunk));

            await new Promise((resolve) => {
                result.stream.on('end', resolve);
            });

            const streamedData = Buffer.concat(chunks);
            expect(streamedData.length).toBeGreaterThan(0);
            expect(streamedData).not.toEqual(testData); // encrypted, not plain
        });

        it('should encrypt empty buffer as stream', async () => {
            const emptyData = Buffer.from('');

            const result = await service.encryptStream(emptyData);

            expect(result).toHaveProperty('stream');
            expect(result).toHaveProperty('metadata');
        });

        it('should encrypt large buffer as stream', async () => {
            const largeData = Buffer.alloc(1024 * 100); // 100KB

            const result = await service.encryptStream(largeData);

            expect(result).toHaveProperty('stream');
            expect(result).toHaveProperty('metadata');

            const chunks: Buffer[] = [];
            result.stream.on('data', (chunk) => chunks.push(chunk));

            await new Promise((resolve) => {
                result.stream.on('end', resolve);
            });

            const streamedData = Buffer.concat(chunks);
            expect(streamedData.length).toBeGreaterThan(0);
        });
    });

    describe('decryptStream', () => {
        it('should decrypt buffer with metadata and return readable stream', async () => {
            const testData = Buffer.from('test data for decryption stream');

            // First encrypt to get valid metadata
            const { encryptedData, metadata } = service.encrypt(testData);

            // Now decrypt as stream
            const stream = await service.decryptStream(encryptedData, metadata);

            // Read stream and verify decrypted data
            const chunks: Buffer[] = [];
            stream.on('data', (chunk) => chunks.push(chunk));

            await new Promise((resolve) => {
                stream.on('end', resolve);
            });

            const decryptedData = Buffer.concat(chunks);
            expect(decryptedData.toString()).toBe(testData.toString());
        });

        it('should decrypt empty buffer as stream', async () => {
            const emptyData = Buffer.from('');
            const { encryptedData, metadata } = service.encrypt(emptyData);

            const stream = await service.decryptStream(encryptedData, metadata);

            const chunks: Buffer[] = [];
            stream.on('data', (chunk) => chunks.push(chunk));

            await new Promise((resolve) => {
                stream.on('end', resolve);
            });

            const decryptedData = Buffer.concat(chunks);
            expect(decryptedData).toEqual(emptyData);
        });

        it('should decrypt large buffer as stream', async () => {
            const largeData = Buffer.alloc(1024 * 100, 'x'); // 100KB
            const { encryptedData, metadata } = service.encrypt(largeData);

            const stream = await service.decryptStream(encryptedData, metadata);

            const chunks: Buffer[] = [];
            stream.on('data', (chunk) => chunks.push(chunk));

            await new Promise((resolve) => {
                stream.on('end', resolve);
            });

            const decryptedData = Buffer.concat(chunks);
            expect(decryptedData).toEqual(largeData);
        });

        it('should handle stream encryption/decryption round trip', async () => {
            const originalData = Buffer.from('round trip test data');

            // Encrypt as stream
            const { stream: encStream, metadata } = await service.encryptStream(originalData);

            // Read encrypted stream
            const encChunks: Buffer[] = [];
            encStream.on('data', (chunk) => encChunks.push(chunk));
            await new Promise((resolve) => encStream.on('end', resolve));
            const encryptedData = Buffer.concat(encChunks);

            // Decrypt as stream
            const decStream = await service.decryptStream(encryptedData, metadata);

            // Read decrypted stream
            const decChunks: Buffer[] = [];
            decStream.on('data', (chunk) => decChunks.push(chunk));
            await new Promise((resolve) => decStream.on('end', resolve));
            const decryptedData = Buffer.concat(decChunks);

            expect(decryptedData.toString()).toBe(originalData.toString());
        });
    });
});
