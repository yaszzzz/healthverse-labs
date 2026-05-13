import { SignJWT, jwtVerify, JWTPayload } from 'jose';
import { cookies } from 'next/headers';

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export interface SessionPayload extends JWTPayload {
    userId: string;
    email?: string;
    role?: string;
    walletAddress?: string;
}

export interface OAuthSession {
    accessToken: string;
    refreshToken?: string;
    expiryDate?: number;
    scope?: string;
}

/**
 * Create a new session for the user
 */
export async function createSession(userId: string, userData: Partial<SessionPayload>) {
    const token = await new SignJWT({ userId, ...userData })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(secret);

    const cookieStore = await cookies();
    cookieStore.set('session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/',
    });

    return token;
}

/**
 * Get the current session
 */
export async function getSession(): Promise<SessionPayload | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;

    if (!token) return null;

    try {
        const { payload } = await jwtVerify(token, secret);
        return payload as SessionPayload;
    } catch {
        return null;
    }
}

/**
 * Delete the current session (logout)
 */
export async function deleteSession() {
    const cookieStore = await cookies();
    cookieStore.delete('session');
}

/**
 * Store OAuth tokens in a separate cookie
 */
export async function storeOAuthTokens(tokens: OAuthSession) {
    const token = await new SignJWT({ ...tokens })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(secret);

    const cookieStore = await cookies();
    cookieStore.set('oauth_tokens', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
    });
}

/**
 * Get stored OAuth tokens
 */
export async function getOAuthTokens(): Promise<OAuthSession | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get('oauth_tokens')?.value;

    if (!token) return null;

    try {
        const { payload } = await jwtVerify(token, secret);
        return payload as unknown as OAuthSession;
    } catch {
        return null;
    }
}

/**
 * Delete OAuth tokens
 */
export async function deleteOAuthTokens() {
    const cookieStore = await cookies();
    cookieStore.delete('oauth_tokens');
}

/**
 * Store OAuth state for CSRF protection
 */
export async function storeOAuthState(state: string) {
    const cookieStore = await cookies();
    cookieStore.set('oauth_state', state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 10, // 10 minutes
        path: '/',
    });
}

/**
 * Get and verify OAuth state
 */
export async function getOAuthState(): Promise<string | null> {
    const cookieStore = await cookies();
    return cookieStore.get('oauth_state')?.value || null;
}

/**
 * Delete OAuth state
 */
export async function deleteOAuthState() {
    const cookieStore = await cookies();
    cookieStore.delete('oauth_state');
}
