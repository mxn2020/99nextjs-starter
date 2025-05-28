export enum AuthErrorCode {
    // Authentication errors
    INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
    USER_NOT_FOUND = 'USER_NOT_FOUND',
    USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS',
    EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
    ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
    // Authorization errors
    UNAUTHORIZED = 'UNAUTHORIZED',
    FORBIDDEN = 'FORBIDDEN',
    INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
    INVALID_ROLE = 'INVALID_ROLE',
    // Token errors
    INVALID_TOKEN = 'INVALID_TOKEN',
    EXPIRED_TOKEN = 'EXPIRED_TOKEN',
    TOKEN_NOT_FOUND = 'TOKEN_NOT_FOUND',
    REFRESH_TOKEN_EXPIRED = 'REFRESH_TOKEN_EXPIRED',
    // Session errors
    SESSION_EXPIRED = 'SESSION_EXPIRED',
    SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
    INVALID_SESSION = 'INVALID_SESSION',
    // Provider errors
    PROVIDER_ERROR = 'PROVIDER_ERROR',
    OAUTH_ERROR = 'OAUTH_ERROR',
    EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
    // Validation errors
    INVALID_EMAIL = 'INVALID_EMAIL',
    WEAK_PASSWORD = 'WEAK_PASSWORD',
    MISSING_REQUIRED_FIELDS = 'MISSING_REQUIRED_FIELDS',
    // Rate limiting
    TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
    // Configuration errors
    PROVIDER_NOT_CONFIGURED = 'PROVIDER_NOT_CONFIGURED',
    INVALID_CONFIGURATION = 'INVALID_CONFIGURATION',
    // Generic errors
    UNKNOWN_ERROR = 'UNKNOWN_ERROR',
    NETWORK_ERROR = 'NETWORK_ERROR',
}

export class AuthError extends Error {
    public readonly code: AuthErrorCode;
    public readonly details?: any;
    public readonly statusCode: number;
    constructor(
        code: AuthErrorCode,
        message: string,
        details?: any,
        statusCode: number = 400
    ) {
        super(message);
        this.name = 'AuthError';
        this.code = code;
        this.details = details;
        this.statusCode = statusCode;
        Error.captureStackTrace(this, AuthError);
    }
    static invalidCredentials(message = 'Invalid credentials') {
        return new AuthError(AuthErrorCode.INVALID_CREDENTIALS, message, undefined, 401);
    }
    static userNotFound(message = 'User not found') {
        return new AuthError(AuthErrorCode.USER_NOT_FOUND, message, undefined, 404);
    }
    static userAlreadyExists(message = 'User already exists') {
        return new AuthError(AuthErrorCode.USER_ALREADY_EXISTS, message, undefined, 409);
    }
    static emailNotVerified(message = 'Email not verified') {
        return new AuthError(AuthErrorCode.EMAIL_NOT_VERIFIED, message, undefined, 403);
    }
    static unauthorized(message = 'Unauthorized') {
        return new AuthError(AuthErrorCode.UNAUTHORIZED, message, undefined, 401);
    }
    static forbidden(message = 'Forbidden') {
        return new AuthError(AuthErrorCode.FORBIDDEN, message, undefined, 403);
    }
    static invalidToken(message = 'Invalid token') {
        return new AuthError(AuthErrorCode.INVALID_TOKEN, message, undefined, 401);
    }
    static expiredToken(message = 'Token expired') {
        return new AuthError(AuthErrorCode.EXPIRED_TOKEN, message, undefined, 401);
    }
    static sessionExpired(message = 'Session expired') {
        return new AuthError(AuthErrorCode.SESSION_EXPIRED, message, undefined, 401);
    }
    static providerError(message: string, details?: any) {
        return new AuthError(AuthErrorCode.PROVIDER_ERROR, message, details, 500);
    }
    static oauthError(message: string, details?: any) {
        return new AuthError(AuthErrorCode.OAUTH_ERROR, message, details, 400);
    }
    static validationError(message: string, details?: any) {
        return new AuthError(AuthErrorCode.MISSING_REQUIRED_FIELDS, message, details, 400);
    }
    static tooManyRequests(message = 'Too many requests') {
        return new AuthError(AuthErrorCode.TOO_MANY_REQUESTS, message, undefined, 429);
    }
    static providerNotConfigured(provider: string) {
        return new AuthError(
            AuthErrorCode.PROVIDER_NOT_CONFIGURED,
            `Provider ${ provider } is not configured`,
            { provider },
            500
        );
    }
    toJSON() {
        return {
            name: this.name,
            code: this.code,
            message: this.message,
            details: this.details,
            statusCode: this.statusCode,
        };
    }
}
export function isAuthError(error: any): error is AuthError {
    return error instanceof AuthError;
}
export function handleAuthError(error: unknown): AuthError {
    if (isAuthError(error)) {
        return error;
    }
    if (error instanceof Error) {
        return new AuthError(
            AuthErrorCode.UNKNOWN_ERROR,
            error.message,
            { originalError: error.name }
        );
    }
    return new AuthError(
        AuthErrorCode.UNKNOWN_ERROR,
        'An unknown error occurred',
        { error }
    );
}
