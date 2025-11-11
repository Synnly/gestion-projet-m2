import { Inject, Injectable, NotFoundException } from '@nestjs/common';
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
    /** Lifespan of refresh tokens in minutes */
    private readonly REFRESH_TOKEN_LIFESPAN: number;

    /**
     * Constructor for AuthService.
     * @param refreshTokenModel The Mongoose model for RefreshToken.
     * @param companyService The service for managing companies.
     * @param jwtService The JWT service for handling access tokens.
     * @param refreshJwtService The JWT service for handling refresh tokens.
     * @param configService The configuration service for accessing environment variables.
     * @throws {InvalidConfigurationException} If any required configuration is missing.
     */
    constructor(
        @InjectModel(RefreshToken.name) private readonly refreshTokenModel: Model<RefreshTokenDocument>,
        private readonly companyService: CompanyService,
        private readonly jwtService: JwtService, // For access tokens
        @Inject('REFRESH_JWT_SERVICE') private readonly refreshJwtService: JwtService, // For refresh tokens
        private readonly configService: ConfigService,
    ) {
        let lifespan: number | undefined;

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
    async login(email: string, password: string, role: Role): Promise<{ access: string; refresh: string }> {
        let userId: Types.ObjectId | null = null;

        // Finding user based on role
        switch (role) {
            case Role.COMPANY:
                const company = await this.companyService.findByEmail(email);
                if (!company) throw new NotFoundException(`Company with email ${email} not found`);
                if (!(await bcrypt.compare(password, company.password))) throw new InvalidCredentialsException();

                userId = company._id;
                break;

            default:
                throw new InvalidCredentialsException('Invalid refresh token');
        }
        if (!userId) throw new InvalidCredentialsException('Invalid role specified');

        // Generating tokens
        const { token, rti } = await this.generateRefreshToken(userId, role);
        const accessToken = await this.generateAccessToken(userId, email, role, rti);

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
     * @param email The email of the user.
     * @param role The role of the user.
     * @param rti The refresh token ID associated with this access token.
     * @returns A Promise that resolves to the generated JWT access token as a string.
     * @throws {InvalidCredentialsException} If the provided refresh token is invalid, expired or does not belong to the user.
     */
    private async generateAccessToken(
        userId: Types.ObjectId,
        email: string,
        role: Role,
        rti: Types.ObjectId,
    ): Promise<string> {
        // Validate the refresh token existence and validity
        const refreshToken = await this.refreshTokenModel.findById(rti);
        if (!refreshToken) throw new InvalidCredentialsException('Refresh token not found');
        if (!refreshToken.userId.equals(userId))
            throw new InvalidCredentialsException('Refresh token does not belong to the user');
        if (refreshToken.expiresAt < new Date()) {
            this.refreshTokenModel.deleteOne({ _id: rti });
            throw new InvalidCredentialsException('Refresh token has expired');
        }

        let accessTokenPayload: AccessTokenPayload = {
            sub: userId,
            role: role,
            email: email,
            rti: rti,
        };

        return this.jwtService.signAsync(accessTokenPayload);
    }

    /**
     * Generates a refresh token for the specified user and stores it in the database.
     * @param userId The ID of the user for whom the refresh token is generated.
     * @param role The role of the user.
     * @returns A Promise that resolves to an object containing the generated refresh token as a string and the refresh
     * token id.
     */
    private async generateRefreshToken(
        userId: Types.ObjectId,
        role: Role,
    ): Promise<{ token: string; rti: Types.ObjectId }> {
        const refreshTokenExpiryDate = await this.computeExpiryDate(this.REFRESH_TOKEN_LIFESPAN);

        const refreshToken = await this.refreshTokenModel.create({
            userId: userId,
            role: role,
            expiresAt: refreshTokenExpiryDate,
        });

        let refreshTokenPayload: RefreshTokenPayload = {
            _id: refreshToken._id,
            sub: userId,
            role: role,
        };

        return {
            token: await this.refreshJwtService.signAsync(refreshTokenPayload),
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
        if (!refreshTokenString) {
            throw new InvalidCredentialsException('Refresh token not provided');
        }

        try {
            if (!this.refreshJwtService.verify(refreshTokenString)) {
                throw new InvalidCredentialsException('Invalid refresh token');
            }
        } catch (error) {
            throw new InvalidCredentialsException('Invalid refresh token');
        }

        const decodesRefreshToken = this.refreshJwtService.decode(refreshTokenString) as RefreshTokenPayload;
        const refreshToken = await this.refreshTokenModel.findOne({ _id: decodesRefreshToken._id });

        if (!refreshToken) throw new InvalidCredentialsException('Refresh token not found');

        if (refreshToken.expiresAt < new Date()) {
            await this.refreshTokenModel.deleteOne({ _id: refreshToken._id });
            throw new InvalidCredentialsException('Refresh token has expired');
        }

        let userId: Types.ObjectId;
        let email: string;
        switch (refreshToken.role) {
            case Role.COMPANY:
                const company = await this.companyService.findOne(refreshToken.userId.toString());
                if (!company) throw new InvalidCredentialsException('Invalid refresh token');
                userId = company._id;
                email = company.email;
                break;

            default:
                throw new InvalidCredentialsException('Invalid refresh token');
        }

        return this.generateAccessToken(userId, email, refreshToken.role as Role, refreshToken._id);
    }

    /**
     * Logs out the user by invalidating the provided refresh token.
     * @param refreshTokenString The refresh token string to be invalidated.
     * @throws {InvalidCredentialsException} If the refresh token is invalid.
     */
    async logout(refreshTokenString: string): Promise<void> {
        if (!refreshTokenString) {
            throw new InvalidCredentialsException('Refresh token not provided');
        }

        try {
            if (!this.refreshJwtService.verify(refreshTokenString)) {
                throw new InvalidCredentialsException('Invalid refresh token');
            }
        } catch (error) {
            throw new InvalidCredentialsException('Invalid refresh token');
        }

        const refreshToken = this.refreshJwtService.decode(refreshTokenString) as RefreshTokenPayload;

        await this.refreshTokenModel.deleteOne({ _id: refreshToken._id });
    }
}
