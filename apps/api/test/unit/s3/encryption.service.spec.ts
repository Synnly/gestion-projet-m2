import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EncryptionService } from '../../../src/s3/encryption.service';

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
        }).compile()
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
        }).compile()
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

      expect(() => service.decrypt(encryptedData, metadata)).toThrow(
        'Unsupported encryption algorithm'
      );
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
      encryptedData[0] = encryptedData[0] ^ 0xFF;

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
      const originalData = Buffer.from([0x00, 0xFF, 0x01, 0xFE, 0x02]);

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
});
