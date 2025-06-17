'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {Card, CardContent, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import { Plus, Search, Layers, Mic, Send } from "lucide-react";
import React, {useEffect, useRef, useState} from "react";
import { getTokenOrRefresh} from '@/lib/token_util';
import {Badge} from "@/components/ui/badge";

const speechsdk = require('microsoft-cognitiveservices-speech-sdk');



interface TokenResponse {
    access_token: string;
    token_type: string;
    session_id: string;
}

interface TokenObject {
    authToken: string | null;
    region: string;
    error?: any;
}

export default function Chat() {
    const [token, setToken] = useState<string | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const [displayText, setDisplayText] = useState<string>('Ask me anything....');
    const [isProcessing, setIsProcessing] = useState<boolean>(false);


    const sttFromMic = async (): Promise<void> => {
        try {
            setIsProcessing(true);
            const tokenObj: TokenObject = await getTokenOrRefresh();

            if (!tokenObj.authToken) {
                setDisplayText(`ERROR: Unable to get authorization token. ${tokenObj.error || ''}`);
                setIsProcessing(false);
                return;
            }

            const speechConfig = speechsdk.SpeechConfig.fromAuthorizationToken(tokenObj.authToken, tokenObj.region);
            speechConfig.speechRecognitionLanguage = 'en-US';

            const audioConfig = speechsdk.AudioConfig.fromDefaultMicrophoneInput();
            const recognizer = new speechsdk.SpeechRecognizer(speechConfig, audioConfig);

            setDisplayText('Listening...');

            recognizer.recognizeOnceAsync((result: any) => {
                if (result.reason === speechsdk.ResultReason.RecognizedSpeech) {
                    setDisplayText(`${result.text}`);
                } else {
                    setDisplayText('ERROR: Speech was cancelled or could not be recognized. Ensure your microphone is working properly.');
                }
                setIsProcessing(false);
            });
        } catch (error) {
            setDisplayText(`ERROR: ${error}`);
            setIsProcessing(false);
        }
    };

    useEffect(() => {
        const fetchGuestToken = async () => {
            try {
                setIsLoading(true);
                const response = await fetch(
                    'https://hayleys-backend-api-v1-dmd4hra3ccaub7c2.canadacentral-01.azurewebsites.net/token/guest',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data: TokenResponse = await response.json();

                // Set the token and session ID in state
                setToken(data.access_token);
                setSessionId(data.session_id);

                // Print token to console as requested
                console.log('Guest Token:', data.access_token);
                console.log('Session ID:', data.session_id);
                console.log('Full Response:', data);

            } catch (error) {
                console.error('Error fetching guest token:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchGuestToken();
    }, []);

    return (
        <div className="flex flex-col h-full">
            {/* Chat Messages Area - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="w-full max-w-3xl mx-auto flex flex-col space-y-4">
                    {/* Loading indicator */}
                    {isLoading && (
                        <div className="flex justify-center">
                            <div className="text-gray-500">Loading...</div>
                        </div>
                    )}

                    {/* Example User Message */}
                    <div className="flex justify-end">
                        <div className="bg-muted/60 text-muted/60-foreground-foreground p-2 rounded-xl max-w-[80%]">
                            Hi how are you?
                        </div>
                    </div>

                    {/* Example Bot Message */}
                    <div className="flex justify-start">
                        <div className="p-3 rounded-lg max-w-[100%]">
                            I am ready to assist you! How can I help?
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-shrink-0 p-1">
                <Card className="w-full max-w-3xl mx-auto rounded-2xl p-2">
                    <CardContent className="p-0">
                        <div className="flex items-center gap-2">
                            {/*text input */}
                            <Input
                                placeholder={displayText}
                                className="flex-grow border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                            />
                            <Button variant="ghost" size="icon" >
                                <Send className="h-5 w-5" />
                            </Button>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                            <Button variant="ghost" size="icon" className="">
                                <Plus className="h-5 w-5" />
                            </Button>

                            <Button variant="ghost" className="">
                                <Search className="h-4 w-4" /> Deep Research
                            </Button>
                            <Button variant="ghost" className="">
                                <Layers className="h-4 w-4" /> Canvas
                            </Button>

                            <div className="flex-grow"></div>

                            <Button size="icon"
                                onClick={sttFromMic}
                                disabled={isProcessing}
                                className=""
                                variant="ghost"
                            >
                                <Mic className="h-4 w-4" />
                                {/*{isProcessing ? 'Listening...':''}*/}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}