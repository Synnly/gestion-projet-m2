import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

/**
 * EncryptionService
 * 
 * Implémente l'envelope encryption avec AES-256-GCM.
 * - La clé maître (STORAGE_MASTER_KEY) chiffre les clés de données (DEK)
 * - Chaque fichier est chiffré avec une DEK unique
 * - La DEK chiffrée est stockée dans les metadata de l'objet S3
 */
@Injectable()
export class EncryptionService {
  private masterKey: Buffer;
  // frozen constants to avoid accidental mutation
  private readonly CONSTANTS = Object.freeze({
    algorithm: 'aes-256-gcm',
    ivLength: 16, // 128 bits
    authTagLength: 16, // 128 bits
    dekLength: 32, // 256 bits
    metadataVersion: 1,
  });

  constructor(private readonly configService: ConfigService) {
    const masterKeyBase64 = this.configService.get<string>('STORAGE_MASTER_KEY');

    // Validate base64 length (32 bytes -> 44 chars with padding). Accept 43-44 as allowed.
    const base64Regex = /^[A-Za-z0-9+/]{43,44}={0,2}$/;

    if (!masterKeyBase64) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Missing STORAGE_MASTER_KEY in production');
      }

      this.masterKey = crypto.randomBytes(this.CONSTANTS.dekLength);
    } else {
      if (!base64Regex.test(masterKeyBase64)) {
        throw new Error('Invalid STORAGE_MASTER_KEY format (expected base64 43-44 chars)');
      }

      try {
        this.masterKey = Buffer.from(masterKeyBase64, 'base64');
        if (this.masterKey.length !== this.CONSTANTS.dekLength) {
          throw new Error(`Master key must be 256 bits (32 bytes), got ${this.masterKey.length} bytes`);
        }
      } catch (error) {
        throw new Error(`Invalid STORAGE_MASTER_KEY format: ${error.message}. Expected base64-encoded 256-bit key`);
      }
    }
  }

  /**
   * Generates a new data encryption key (DEK) for encrypting a file
   * Each file gets a unique DEK for enhanced security
   * @returns A new random 256-bit buffer to use as DEK
   */
  private generateDataKey(): Buffer {
    return crypto.randomBytes(this.CONSTANTS.dekLength);
  }

  /**
   * Encrypts a DEK (Data Encryption Key) with the master key using AES-256-GCM
   * @param dataKey The data encryption key to encrypt
   * @returns Object containing the encrypted key, initialization vector and authentication tag
   */
  private encryptDataKey(dataKey: Buffer): {
    encryptedKey: Buffer;
    iv: Buffer;
    authTag: Buffer;
  } {
  const iv = crypto.randomBytes(this.CONSTANTS.ivLength);
  const cipher = crypto.createCipheriv(this.CONSTANTS.algorithm, this.masterKey, iv);
    
    const encryptedKey = Buffer.concat([
      cipher.update(dataKey),
      cipher.final()
    ]);
    
  const authTag = cipher.getAuthTag();
    
    return { encryptedKey, iv, authTag };
  }

  /**
   * Decrypts a DEK (Data Encryption Key) with the master key using AES-256-GCM
   * @param encryptedKey The encrypted data encryption key
   * @param iv The initialization vector used for encryption
   * @param authTag The authentication tag for integrity verification
   * @returns The decrypted data encryption key
   * @throws {Error} if decryption or authentication fails
   */
  private decryptDataKey(
    encryptedKey: Buffer,
    iv: Buffer,
    authTag: Buffer
  ): Buffer {
    const decipher = crypto.createDecipheriv(this.CONSTANTS.algorithm, this.masterKey, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([
      decipher.update(encryptedKey),
      decipher.final()
    ]);
  }

  /**
   * Encrypts file content using envelope encryption with AES-256-GCM
   * Generates a unique DEK for this file, encrypts the data with the DEK,
   * then encrypts the DEK with the master key
   * @param data The file data buffer to encrypt
   * @returns Object containing encrypted data and metadata (encrypted DEK, IVs, auth tags)
   * @throws {Error} if encryption fails
   */
  encrypt(data: Buffer): {
    encryptedData: Buffer;
    metadata: {
      algorithm: string;
      dekEncrypted: string;
      dekIv: string;
      dekAuthTag: string;
      dataIv: string;
      dataAuthTag: string;
      metadataVersion: number;
    };
  } {
      // Générer une DEK unique pour ce fichier
  const dataKey = this.generateDataKey();
      
      // Chiffrer la DEK avec la clé maître
      const {
        encryptedKey: dekEncrypted,
        iv: dekIv,
        authTag: dekAuthTag
      } = this.encryptDataKey(dataKey);
      
      // Chiffrer les données avec la DEK
  const dataIv = crypto.randomBytes(this.CONSTANTS.ivLength);
  const cipher = crypto.createCipheriv(this.CONSTANTS.algorithm, dataKey, dataIv);
      
      const encryptedData = Buffer.concat([
        cipher.update(data),
        cipher.final()
      ]);
      
  const dataAuthTag = cipher.getAuthTag();
      
      // Nettoyer la DEK de la mémoire
      dataKey.fill(0);
      
      return {
        encryptedData,
        metadata: {
          algorithm: this.CONSTANTS.algorithm,
          dekEncrypted: dekEncrypted.toString('base64'),
          dekIv: dekIv.toString('base64'),
          dekAuthTag: dekAuthTag.toString('base64'),
          dataIv: dataIv.toString('base64'),
          dataAuthTag: dataAuthTag.toString('base64'),
          metadataVersion: this.CONSTANTS.metadataVersion,
        }
      };
  }

  /**
   * Decrypts file content using envelope encryption with AES-256-GCM
   * Decrypts the DEK with the master key, then decrypts the data with the DEK
   * @param encryptedData The encrypted file data buffer
   * @param metadata The encryption metadata containing encrypted DEK, IVs and auth tags
   * @returns The decrypted file data buffer
   * @throws {Error} if decryption, authentication fails or algorithm is unsupported
   */
  decrypt(
    encryptedData: Buffer,
    metadata: {
      algorithm: string;
      dekEncrypted: string;
      dekIv: string;
      dekAuthTag: string;
      dataIv: string;
      dataAuthTag: string;
      metadataVersion?: number;
    }
  ): Buffer {
    if (metadata.algorithm !== this.CONSTANTS.algorithm) {
      throw new Error(
        `Unsupported encryption algorithm: ${metadata.algorithm}`
      );
    }

    // Déchiffrer la DEK
    const dekEncrypted = Buffer.from(metadata.dekEncrypted, 'base64');
    const dekIv = Buffer.from(metadata.dekIv, 'base64');
    const dekAuthTag = Buffer.from(metadata.dekAuthTag, 'base64');

    const dataKey = this.decryptDataKey(dekEncrypted, dekIv, dekAuthTag);

    try {
      try {
        // Déchiffrer les données
        const dataIv = Buffer.from(metadata.dataIv, 'base64');
        const dataAuthTag = Buffer.from(metadata.dataAuthTag, 'base64');

        const decipher = crypto.createDecipheriv(
          this.CONSTANTS.algorithm,
          dataKey,
          dataIv
        );
        decipher.setAuthTag(dataAuthTag);

        const decryptedData = Buffer.concat([
          decipher.update(encryptedData),
          decipher.final()
        ]);

        return decryptedData;
      } catch (err) {
        // Capture GCM authentication failures and provide a clearer log
        throw new Error('Failed to decrypt data: authentication failed or corrupted payload');
      }
    } finally {
      // Nettoyer la DEK de la mémoire
      try {
        dataKey.fill(0);
      } catch {}
    }
  }

  /**
   * Rotate the master key for future operations.
   * Note: Existing stored objects encrypted with the old master key must be re-wrapped
   * separately using a migration procedure. This method only replaces the active master key.
   */
  rotateMasterKey(newKeyBase64: string): void {
    const base64Regex = /^[A-Za-z0-9+/]{43,44}={0,2}$/;
    if (!base64Regex.test(newKeyBase64)) {
      throw new Error('Invalid new master key format (expected base64 43-44 chars)');
    }

    const newKey = Buffer.from(newKeyBase64, 'base64');
    if (newKey.length !== this.CONSTANTS.dekLength) {
      throw new Error(`New master key must be ${this.CONSTANTS.dekLength} bytes`);
    }

    // Replace master key in-memory
    this.masterKey = newKey;
  }

  /**
   * Experimental: encrypt a Buffer-returning stream-like wrapper.
   * For now this implementation buffers the input (not streaming) but exposes a Readable.
   * A true streaming envelope implementation would be more involved.
   */
  async encryptStream(buffer: Buffer): Promise<{ stream: NodeJS.ReadableStream; metadata: any }> {
    const { encryptedData, metadata } = this.encrypt(buffer);
    // create a simple readable stream from the encrypted buffer
    const { Readable } = await import('stream');
    const s = new Readable();
    s.push(encryptedData);
    s.push(null);
    return { stream: s, metadata };
  }

  async decryptStream(buffer: Buffer, metadata: any): Promise<NodeJS.ReadableStream> {
    const decrypted = this.decrypt(buffer, metadata);
    const { Readable } = await import('stream');
    const s = new Readable();
    s.push(decrypted);
    s.push(null);
    return s;
  }

  /**
   * Checks if encryption is enabled by verifying if STORAGE_MASTER_KEY is configured
   * @returns True if encryption is enabled, false otherwise
   */
  isEncryptionEnabled(): boolean {
    return !!this.configService.get<string>('STORAGE_MASTER_KEY');
  }
}
