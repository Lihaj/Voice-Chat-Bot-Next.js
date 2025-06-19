// src/lib/token_util.ts
import axios, { AxiosResponse } from 'axios';
import Cookie from 'universal-cookie';

export interface TokenObject {
    authToken: string | null;
    region: string;
    //eslint-disable-next-line  @typescript-eslint/no-explicit-any
    error?: any;
}

interface TokenResponse {
    token: string;
    region: string;
}

export async function getTokenOrRefresh(): Promise<TokenObject> {
    const cookie = new Cookie();
    const speechToken: string | undefined = cookie.get('speech-token');

    if (speechToken === undefined) {
        try {
            const res: AxiosResponse<TokenResponse> = await axios.get('/api/get-speech-token');
            const token: string = res.data.token;
            const region: string = res.data.region;

            // Set cookie with 9 minutes expiry (540 seconds)
            cookie.set('speech-token', `${region}:${token}`, {
                maxAge: 540,
                path: '/'
            });

            console.log('Token fetched from back-end: ' + token);
            return {
                authToken: token,
                region: region
            };
            //eslint-disable-next-line  @typescript-eslint/no-explicit-any
        } catch (err: any) {
            console.error('Error fetching token:', err.response?.data || err.message);
            return {
                authToken: null,
                region: '',
                error: err.response?.data || err.message
            };
        }
    } else {
        // console.log('Token fetched from cookie: ' + speechToken);
        const idx: number = speechToken.indexOf(':');

        if (idx === -1) {
            console.error('Invalid token format in cookie');
            return {
                authToken: null,
                region: '',
                error: 'Invalid token format'
            };
        }

        return {
            authToken: speechToken.slice(idx + 1),
            region: speechToken.slice(0, idx)
        };
    }
}