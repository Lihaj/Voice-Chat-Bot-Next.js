// src/app/api/get-speech-token/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios, { AxiosResponse } from 'axios';

interface TokenResponse {
    token: string;
    region: string;
}

interface ErrorResponse {
    error: string;
    message: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(request: NextRequest): Promise<NextResponse<TokenResponse | ErrorResponse>> {
    try {
        const speechKey: string | undefined = process.env.SPEECH_KEY;
        const speechRegion: string | undefined = process.env.SPEECH_REGION;

        // Validate environment variables
        if (!speechKey || !speechRegion) {
            console.error('Missing SPEECH_KEY or SPEECH_REGION environment variables');
            return NextResponse.json(
                {
                    error: 'Configuration Error',
                    message: 'Speech key or region not configured. Please check your environment variables.'
                },
                { status: 500 }
            );
        }

        if (speechKey === 'paste-your-speech-key-here' || speechRegion === 'paste-your-speech-region-here') {
            return NextResponse.json(
                {
                    error: 'Configuration Error',
                    message: 'You forgot to add your speech key or region to the .env.local file.'
                },
                { status: 400 }
            );
        }

        // Configure headers for Azure request
        const headers = {
            'Ocp-Apim-Subscription-Key': speechKey,
            'Content-Type': 'application/x-www-form-urlencoded'
        };

        // Request token from Azure
        const tokenResponse: AxiosResponse<string> = await axios.post(
            `https://${speechRegion}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
            null,
            { headers }
        );

        console.log('Successfully obtained speech token');

        return NextResponse.json({
            token: tokenResponse.data,
            region: speechRegion
        });
        //eslint-disable-next-line  @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error('Error authorizing speech key:', error.response?.data || error.message);

        // Handle different types of errors
        if (error.response?.status === 401) {
            return NextResponse.json(
                {
                    error: 'Authentication Error',
                    message: 'There was an error authorizing your speech key. Please check your credentials.'
                },
                { status: 401 }
            );
        }

        if (error.response?.status === 403) {
            return NextResponse.json(
                {
                    error: 'Authorization Error',
                    message: 'Access denied. Please check your speech service subscription.'
                },
                { status: 403 }
            );
        }

        return NextResponse.json(
            {
                error: 'Server Error',
                message: 'An unexpected error occurred while fetching the speech token.'
            },
            { status: 500 }
        );
    }
}