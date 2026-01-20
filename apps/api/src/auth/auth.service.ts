import { ForbiddenException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { AccessTokenPayload, RefreshToken, RefreshTokenDocument, RefreshTokenPayload } from './refreshToken.schema';
import { Role } from '../common/roles/roles.enum';
import { InvalidCredentialsException } from '../common/exceptions/invalidCredentials.exception';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InvalidConfigurationException } from '../common/exceptions/invalidConfiguration.exception';
import { User, UserDocument } from '../user/user.schema';
import { MailerService } from 'src/mailer/mailer.service';

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
     * @param userModel The Mongoose model for User.
     * @param jwtService The JWT service for handling access tokens.
     * @param refreshJwtService The JWT service for handling refresh tokens.
     * @param configService The configuration service for accessing environment variables.
     * @throws {InvalidConfigurationException} If any required configuration is missing.
     */
    constructor(
        @InjectModel(RefreshToken.name) private readonly refreshTokenModel: Model<RefreshTokenDocument>,
        @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
        private readonly jwtService: JwtService, // For access tokens
        @Inject('REFRESH_JWT_SERVICE') private readonly refreshJwtService: JwtService, // For refresh tokens
        private readonly configService: ConfigService,
        private readonly mailerService: MailerService,
    ) {
        let lifespan: number | undefined;

        // Load refresh token lifespan
        lifespan = this.configService.get<number>('REFRESH_TOKEN_LIFESPAN_MINUTES');
        if (!lifespan) throw new InvalidConfigurationException('Refresh token lifespan is not configured');
        this.REFRESH_TOKEN_LIFESPAN = lifespan;
    }

    /**
     * Generates access and refresh tokens for the user
     * @param email The email of the user attempting to log in.
     * @param password The password of the user.
     * @returns A Promise that resolves to an object containing the access and refresh tokens.
     * @throws {NotFoundException} If the user with the specified email is not found.
     * @throws {InvalidCredentialsException} If the provided credentials are invalid.
     * @throws {ForbiddenException} If the user with the specified email is banned.
     */
    async login(email: string, password: string): Promise<{ access: string; refresh: string }> {
        const user = await this.userModel.findOne({ email: email });
        if (!user) throw new NotFoundException(`User with email ${email} not found`);

        if (!(await bcrypt.compare(password, user.password))) {
            throw new InvalidCredentialsException('Invalid email or password');
        }

        if (user.ban) throw new ForbiddenException(`User with email ${email} is banned for '${user.ban.reason}'`);

        // Generating tokens
        const { token, rti } = await this.generateRefreshToken(user._id, user.role);
        const accessToken = await this.generateAccessToken(user._id, user.email, rti);
        if (!user.isVerified) {
            await this.mailerService.sendVerificationEmail(email);
        }
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
    private async generateAccessToken(userId: Types.ObjectId, email: string, rti: Types.ObjectId): Promise<string> {
        // Validate the refresh token existence and validity
        const refreshToken = await this.refreshTokenModel.findById(rti);
        if (!refreshToken) throw new InvalidCredentialsException('Refresh token not found');
        if (!refreshToken.userId.equals(userId)) {
            throw new InvalidCredentialsException('Refresh token does not belong to the user');
        }
        if (refreshToken.expiresAt < new Date()) {
            await this.refreshTokenModel.deleteOne({ _id: rti });
            throw new InvalidCredentialsException('Refresh token has expired');
        }

        // Fetch the current user document to get the latest role
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new InvalidCredentialsException('User not found');
        }
        const accessTokenPayload: AccessTokenPayload = {
            sub: userId,
            role: user.role,
            email: email,
            rti: rti,
            isVerified: user.isVerified,
            isValid: user.isValid,
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

        const refreshTokenPayload: RefreshTokenPayload = {
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
        if (!refreshTokenString) throw new InvalidCredentialsException('Refresh token not provided');

        try {
            if (!this.refreshJwtService.verify(refreshTokenString)) {
                throw new Error();
            }
        } catch (error) {
            throw new InvalidCredentialsException('Invalid refresh token');
        }

        const decodesRefreshToken = this.refreshJwtService.decode(refreshTokenString);
        const refreshToken = await this.refreshTokenModel.findOne({ _id: decodesRefreshToken._id });

        if (!refreshToken) throw new InvalidCredentialsException('Refresh token not found');

        if (refreshToken.expiresAt < new Date()) {
            await this.refreshTokenModel.deleteOne({ _id: refreshToken._id });
            throw new InvalidCredentialsException('Refresh token has expired');
        }

        const user = await this.userModel.findById(refreshToken.userId);
        if (!user) throw new InvalidCredentialsException('User not found for the provided refresh token');

        // Validate that the role in the refresh token matches the user's current role
        if (refreshToken.role !== user.role) {
            throw new InvalidCredentialsException('User role has changed since refresh token was issued');
        }

        return this.generateAccessToken(user._id, user.email, refreshToken._id);
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
                throw new Error();
            }
        } catch (error) {
            throw new InvalidCredentialsException('Invalid refresh token');
        }

        const refreshToken = this.refreshJwtService.decode(refreshTokenString);

        await this.refreshTokenModel.deleteOne({ _id: refreshToken._id });
    }
}
