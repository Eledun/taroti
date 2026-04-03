import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export interface GoogleUser {
  sub: string;
  email: string;
  name: string;
  picture?: string;
}

export async function verificarTokenGoogle(token: string): Promise<GoogleUser | null> {
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      return null;
    }

    return {
      sub: payload.sub,
      email: payload.email || '',
      name: payload.name || '',
      picture: payload.picture,
    };
  } catch (error) {
    console.error('Error verificando token de Google:', error);
    return null;
  }
}
