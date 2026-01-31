import { google, Auth } from 'googleapis';

const SCOPES = [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/fitness.activity.read',
    'https://www.googleapis.com/auth/fitness.heart_rate.read',
    'https://www.googleapis.com/auth/fitness.body.read',
];

/**
 * Create a new OAuth2 client
 */
export function createOAuth2Client(tokens?: {
    accessToken: string;
    refreshToken?: string;
}): Auth.OAuth2Client {
    const client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );

    if (tokens) {
        client.setCredentials({
            access_token: tokens.accessToken,
            refresh_token: tokens.refreshToken,
        });
    }

    return client;
}

/**
 * Generate authentication URL
 */
export function generateAuthUrl(state: string): string {
    const client = createOAuth2Client();

    return client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        state,
        prompt: 'consent',
        include_granted_scopes: true,
    });
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string) {
    const client = createOAuth2Client();
    const { tokens } = await client.getToken(code);
    return tokens;
}

/**
 * Get user profile from Google
 */
export async function getUserProfile(accessToken: string) {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch user profile: ${response.statusText}`);
    }

    return response.json();
}

export { SCOPES };
