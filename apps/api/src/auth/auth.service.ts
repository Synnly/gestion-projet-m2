import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { AccessTokenPayload, RefreshToken, RefreshTokenDocument, RefreshTokenPayload } from './refreshToken.schema';
import { Role } from '../common/roles/roles.enum';
import { CompanyService } from '../company/company.service';
import { InvalidCredentialsException } from '../common/exceptions/invalidCredentials.exception';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InvalidConfigurationException } from '../common/exceptions/invalidConfiguration.exception';

/**
 * Service handling authentication logic
 * Responsible for login, token generation, refresh, and logout.
 */
@Injectable()
export class AuthService {
    /** JWT secret for signing access tokens */
    private readonly ACCESS_TOKEN_SECRET: string;
    /** JWT secret for signing refresh tokens */
    private readonly REFRESH_TOKEN_SECRET: string;
    /** Lifespan of access tokens in minutes */
    private readonly ACCESS_TOKEN_LIFESPAN: number;
    /** Lifespan of refresh tokens in minutes */
    private readonly REFRESH_TOKEN_LIFESPAN: number;

    /**
     * Constructor for AuthService.
     * @param refreshTokenModel The Mongoose model for RefreshToken.
     * @param companyService The service for managing companies.
     * @param jwtService The JWT service for token operations.
     * @param configService The configuration service for accessing environment variables.
     * @throws {InvalidConfigurationException} If any required configuration is missing.
     */
    constructor(
        @InjectModel(RefreshToken.name) private readonly refreshTokenModel: Model<RefreshTokenDocument>,
        private readonly companyService: CompanyService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) {
        let secret: string | undefined;
        let lifespan: number | undefined;

        // Load access token secret
        secret = this.configService.get<string>('ACCESS_TOKEN_SECRET');
        if (!secret) throw new InvalidConfigurationException('Access token secret is not configured');
        this.ACCESS_TOKEN_SECRET = secret;

        // Load refresh token secret
        secret = this.configService.get<string>('REFRESH_TOKEN_SECRET');
        if (!secret) throw new InvalidConfigurationException('Refresh token secret is not configured');
        this.REFRESH_TOKEN_SECRET = secret;

        // Load access token lifespan
        lifespan = this.configService.get<number>('ACCESS_TOKEN_LIFESPAN_MINUTES');
        if (!lifespan) throw new InvalidConfigurationException('Access token lifespan is not configured');
        this.REFRESH_TOKEN_LIFESPAN = lifespan;

        // Load refresh token lifespan
        lifespan = this.configService.get<number>('REFRESH_TOKEN_LIFESPAN_MINUTES');
        if (!lifespan) throw new InvalidConfigurationException('Refresh token lifespan is not configured');
        this.REFRESH_TOKEN_LIFESPAN = lifespan;
    }

    /**
     * Generates access and refresh tokens for the user based on their role.
     * @param email The email of the user attempting to log in.
     * @param password The password of the user attempting to log in.
     * @param role The role of the user.
     * @returns A Promise that resolves to an object containing the access and refresh tokens.
     * @throws {NotFoundException} If the user with the specified email is not found.
     * @throws {InvalidCredentialsException} If the provided credentials are invalid.
     */
    async login(email: string, password: string, role: string): Promise<{ access: string; refresh: string }> {
        let userId: Types.ObjectId | null = null;

        // Finding user based on role
        switch (role) {
            case Role.COMPANY:
                const company = await this.companyService.findByEmail(email);
                if (!company) throw new NotFoundException(`Company with email ${email} not found`);

                if (!(await bcrypt.compare(password, company.password))) {
                    throw new InvalidCredentialsException();
                }

                userId = company._id;
        }
        if (!userId) throw new InvalidCredentialsException('Invalid role specified');

        // Generating tokens
        const { token, rti } = await this.generateRefreshToken(userId);
        const accessToken = await this.generateAccessToken(userId, role as Role, rti);

        return { access: accessToken, refresh: token };
    }

    /**
     * Computes the expiry date by adding the specified minutes to the current time.
     * @param minutes The number of minutes to add to the current time.
     * @returns A Promise that resolves to the computed expiry Date.
     */
    private async computeExpiryDate(minutes: number): Promise<Date> {
        const expiryDate = new Date();
        expiryDate.setMinutes(expiryDate.getMinutes() + minutes);
        return expiryDate;
    }

    /**
     * Generates a JWT access token for the specified user. Deletes the associated refresh token if it is expired.
     * @param userId The ID of the user for whom the token is generated.
     * @param role The role of the user.
     * @param rti The refresh token ID associated with this access token.
     * @returns A Promise that resolves to the generated JWT access token as a string.
     * @throws {InvalidCredentialsException} If the provided refresh token is invalid, expired or does not belong to the user.
     */
    private async generateAccessToken(userId: Types.ObjectId, role: Role, rti: Types.ObjectId): Promise<string> {
        // Validate the refresh token existence and validity
        const refreshToken = await this.refreshTokenModel.findById(rti);
        if (!refreshToken) throw new InvalidCredentialsException('Refresh token not found');
        if (refreshToken.userId !== userId)
            throw new InvalidCredentialsException('Refresh token does not belong to the user');
        if (refreshToken.expiresAt < new Date()) {
            this.refreshTokenModel.deleteOne({ _id: rti });
            throw new InvalidCredentialsException('Refresh token has expired');
        }

        let accessTokenPayload: AccessTokenPayload = {
            sub: userId,
            exp: await this.computeExpiryDate(this.ACCESS_TOKEN_LIFESPAN),
            iat: new Date(),
            role: role,
            rti: rti,
        };

        return this.jwtService.signAsync(accessTokenPayload, { secret: this.ACCESS_TOKEN_SECRET });
    }

    /**
     * Generates a refresh token for the specified user and stores it in the database.
     * @param userId The ID of the user for whom the refresh token is generated.
     * @returns A Promise that resolves to an object containing the generated refresh token as a string and the refresh
     * token id.
     */
    private async generateRefreshToken(userId: Types.ObjectId): Promise<{ token: string; rti: Types.ObjectId }> {
        const refreshTokenExpiryDate = await this.computeExpiryDate(this.REFRESH_TOKEN_LIFESPAN);

        const refreshToken = await new this.refreshTokenModel({
            userId: userId,
            expiresAt: refreshTokenExpiryDate,
        }).save();

        let refreshTokenPayload: RefreshTokenPayload = {
            _id: refreshToken._id,
            sub: userId,
            exp: refreshTokenExpiryDate,
            iat: new Date(),
        };

        return {
            token: await this.jwtService.signAsync(refreshTokenPayload, { secret: this.REFRESH_TOKEN_SECRET }),
            rti: refreshToken._id,
        };
    }

    /**
     * Refreshes the access token using the provided refresh token.
     * @param refreshTokenString The refresh token string provided by the client.
     * @returns A Promise that resolves to the new access token as a string.
     * @throws {InvalidCredentialsException} If the refresh token is invalid or has expired.
     */
    async refreshAccessToken(refreshTokenString: string): Promise<string> {
        if (!this.jwtService.verify(refreshTokenString, { secret: this.REFRESH_TOKEN_SECRET })) {
            throw new InvalidCredentialsException('Invalid refresh token');
        }

        const refreshToken = this.jwtService.decode(refreshTokenString) as RefreshTokenPayload;

        if (refreshToken.exp < new Date()) {
            await this.refreshTokenModel.deleteOne({ _id: refreshToken._id });
            throw new InvalidCredentialsException('Refresh token has expired');
        }

        const company = await this.companyService.findOne(refreshToken.sub.toString());
        if (!company) throw new InvalidCredentialsException('Invalid refresh token');

        return this.generateAccessToken(company._id, Role.COMPANY, refreshToken._id);
    }

    /**
     * Logs out the user by invalidating the provided refresh token.
     * @param refreshTokenString The refresh token string to be invalidated.
     * @throws {InvalidCredentialsException} If the refresh token is invalid.
     */
    async logout(refreshTokenString: string): Promise<void> {
        if (!this.jwtService.verify(refreshTokenString, { secret: this.REFRESH_TOKEN_SECRET })) {
            throw new InvalidCredentialsException('Invalid refresh token');
        }

        const refreshToken = this.jwtService.decode(refreshTokenString) as RefreshTokenPayload;

        await this.refreshTokenModel.deleteOne({ _id: refreshToken._id });
    }
}
