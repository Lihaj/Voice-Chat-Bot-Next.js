'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {Mic, Send, Languages} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { getTokenOrRefresh } from '@/lib/token_util';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';



// eslint-disable-next-line @typescript-eslint/no-require-imports
const speechsdk = require('microsoft-cognitiveservices-speech-sdk');

interface TokenResponse {
    access_token: string;
    token_type: string;
    session_id: string;
}

interface TokenObject {
    authToken: string | null;
    region: string;
    //eslint-disable-next-line  @typescript-eslint/no-explicit-any
    error?: any;
}

interface ChatMessage {
    id: string;
    content: string;
    isUser: boolean;
    timestamp: Date;
}

interface ChatRequest {
    Message: string;
    IsVoice: boolean;
    Language: string;
}

interface ChatResponse {
    message?: string;
    response?: string;
    session_id?: string;
    is_voice?: boolean;
    language?: string;
    message_received?: string;
}

interface Language {
    code: string;
    name: string;
}

const languages: Language[] = [
    { code: 'en-US', name: 'English' },
    { code: 'si-LK', name: 'Sinhala' },
    { code: 'ta-IN', name: 'Tamil' },
    { code:'fr-FR',  name:'French'},
    { code:'hi-IN',  name:'Hindi'}
];

export default function Home() {

    const [token, setToken] = useState<string | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputMessage, setInputMessage] = useState<string>('');
    const [isSending, setIsSending] = useState<boolean>(false);
    const [isVoiceInput, setIsVoiceInput] = useState<boolean>(false);
    const [selectedLanguage, setSelectedLanguage] = useState<Language>(languages[0]);

    const [displayText, setDisplayText] = useState<string>('Ask me anything....');
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unused-vars
    const [player, updatePlayer] = useState<any>({ p: undefined, muted: false });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };



    // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unused-vars
    const containsPre = (children: any): boolean => {
        if (Array.isArray(children)) {
            return children.some(child =>
                child?.type === 'pre' ||
                (child?.props && containsPre(child.props.children))
            );
        }
        return false;
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = async (messageText: string) => {
        if (!messageText.trim() || isSending || !token) return;

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            content: messageText,
            isUser: true,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsSending(true);

        try {
            const chatRequest: ChatRequest = {
                Message: messageText,
                IsVoice: isVoiceInput,
                Language: selectedLanguage.code
            };

            console.log('Sending chat request:', chatRequest);

            const response = await axios.post<ChatResponse>(
                'http://127.0.0.1:8000/chat',
                chatRequest
            );

            console.log('Complete chat response:', response.data);
            console.log('Full response object:', response);

            const responseText = response.data.message || response.data.response || 'I received your message but couldn\'t generate a response.';

            const botMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                content: responseText,
                isUser: false,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, botMessage]);

            if (response.data.is_voice === true) {
                console.log('Voice response detected, starting TTS...');
                await textToSpeech(responseText);
            }

        } catch (error) {
            console.error('Error sending message:', error);

            const errorMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                content: 'Sorry, I encountered an error while processing your message. Please try again.',
                isUser: false,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, errorMessage]);

            if (axios.isAxiosError(error)) {
                console.error('Response status:', error.response?.status);
                console.error('Response data:', error.response?.data);
            }
        } finally {
            setIsSending(false);
            setIsVoiceInput(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(inputMessage);
    };

    const textToSpeech = async (textToSpeak: string): Promise<void> => {
        try {
            setIsProcessing(true);
            const tokenObj: TokenObject = await getTokenOrRefresh();

            if (!tokenObj.authToken) {
                console.error(`ERROR: Unable to get authorization token. ${tokenObj.error || ''}`);
                setIsProcessing(false);
                return;
            }

            const speechConfig = speechsdk.SpeechConfig.fromAuthorizationToken(tokenObj.authToken, tokenObj.region);

            switch (selectedLanguage.code) {
                case 'si-LK':
                    speechConfig.speechSynthesisVoiceName = "en-US-AvaMultilingualNeural";
                    break;
                case 'ta-IN':
                    speechConfig.speechSynthesisVoiceName = "ta-IN-PallaviNeural";
                    break;
                case 'fr-FR':
                    speechConfig.speechSynthesisVoiceName = "en-US-AvaMultilingualNeural";
                    break;
                case 'hi-IN':
                    speechConfig.speechSynthesisVoiceName = "en-US-AvaMultilingualNeural";
                    break;
                default:
                    speechConfig.speechSynthesisVoiceName = "en-US-AvaMultilingualNeural";
            }

            const myPlayer = new speechsdk.SpeakerAudioDestination();

            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            updatePlayer(p => ({ p: myPlayer, muted: p.muted }));
            const audioConfig = speechsdk.AudioConfig.fromSpeakerOutput(myPlayer);

            let synthesizer = new speechsdk.SpeechSynthesizer(speechConfig, audioConfig);

            console.log(`Speaking text: ${textToSpeak} in language: ${selectedLanguage.name}`);


            synthesizer.speakTextAsync(
                textToSpeak,

                //eslint-disable-next-line  @typescript-eslint/no-explicit-any
                (result: any) => {
                    let text: string;
                    if (result.reason === speechsdk.ResultReason.SynthesizingAudioCompleted) {
                        text = `Synthesis finished for "${textToSpeak}".`;
                        console.log(text);
                    } else if (result.reason === speechsdk.ResultReason.Canceled) {
                        text = `Synthesis failed. Error detail: ${result.errorDetails}.`;
                        console.error(text);
                    } else {
                        text = 'Synthesis completed.';
                        console.log(text);
                    }
                    synthesizer.close();
                    synthesizer = undefined;
                    setIsProcessing(false);
                },
                (err: string) => {
                    console.error(`TTS Error: ${err}`);
                    synthesizer.close();
                    synthesizer = undefined;
                    setIsProcessing(false);
                }
            );
        } catch (error) {
            console.error(`TTS ERROR: ${error}`);
            setIsProcessing(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(inputMessage);
        }
    };

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
            speechConfig.speechRecognitionLanguage = selectedLanguage.code;

            const audioConfig = speechsdk.AudioConfig.fromDefaultMicrophoneInput();
            const recognizer = new speechsdk.SpeechRecognizer(speechConfig, audioConfig);

            setDisplayText(`Listening in ${selectedLanguage.name}...`);


            //eslint-disable-next-line  @typescript-eslint/no-explicit-any
            recognizer.recognizeOnceAsync((result: any) => {
                if (result.reason === speechsdk.ResultReason.RecognizedSpeech) {
                    setInputMessage(result.text);
                    setIsVoiceInput(true);
                    setDisplayText('Ask me anything....');
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

    const handleLanguageSelect = (language: Language) => {
        setSelectedLanguage(language);
        console.log('Language changed to:', language);
    };

    useEffect(() => {
        const fetchGuestToken = async () => {
            try {
                setIsLoading(true);

                const response = await axios.post<TokenResponse>(
                    'http://127.0.0.1:8000/token/guest',
                    {},
                    {
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    }
                );

                const data = response.data;

                setToken(data.access_token);
                setSessionId(data.session_id);

                axios.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`;

                console.log('Guest Token:', data.access_token);
                console.log('Session ID:', data.session_id);
                console.log('Full Response:', data);

            } catch (error) {
                console.error('Error fetching guest token:', error);

                if (axios.isAxiosError(error)) {
                    console.error('Response status:', error.response?.status);
                    console.error('Response data:', error.response?.data);
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchGuestToken();
    }, []);


    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full p-4">
                    <div className="w-full max-w-3xl mx-auto flex flex-col space-y-4">

                        {isLoading && (
                            <div className="flex justify-center">
                                <div className="">Almost ready to chat!</div>
                            </div>
                        )}


                        {messages.map((message) => (
                            <div key={message.id} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
                                <div className={`p-3 rounded-lg ${
                                    message.isUser
                                        ? 'max-w-[80%] bg-muted/50 text-muted/50-foreground'
                                        : 'max-w-[100%]'
                                }`}>
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                            h1: ({ node, ...props }) => (
                                                <h1 className="text-2xl font-bold mb-2" {...props} />
                                            ),
                                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                            h2: ({ node, ...props }) => (
                                                <h2 className="text-xl font-semibold mb-2" {...props} />
                                            ),
                                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                            h3: ({ node, ...props }) => (
                                                <h3 className="text-lg font-medium mb-2" {...props} />
                                            ),
                                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                            a: ({ node, ...props }) => (
                                                <a className="text-blue-600 hover:text-blue-800 underline" {...props} />
                                            ),
                                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                            p: ({ node, ...props }) => <p className="mb-2" {...props} />,
                                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                            ol: ({ node, ...props }) => (
                                                <ol className="list-decimal pl-6 mb-2" {...props} />
                                            ),
                                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                            ul: ({ node, ...props }) => (
                                                <ul className="list-disc pl-6 mb-2" {...props} />
                                            ),
                                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                            li: ({ node, ...props }) => <li className="mb-1 " {...props} />,
                                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                            table: ({ node, ...props }) => (
                                                <table
                                                    className="table-auto border border-muted my-4 w-full text-left"
                                                    {...props}
                                                />
                                            ),
                                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                            thead: ({ node, ...props }) => (
                                                <thead className="bg-muted/80" {...props} />
                                            ),
                                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                            th: ({ node, ...props }) => (
                                                <th className="border border-muted px-4 py-2 font-semibold" {...props} />
                                            ),
                                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                            td: ({ node, ...props }) => (
                                                <td className="border border-muted px-4 py-2" {...props} />
                                            ),
                                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                            tr: ({ node, ...props }) => (
                                                <tr className="hover:bg-muted/80" {...props} />
                                            ),
                                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                            blockquote: ({ node, ...props }) => (
                                                <blockquote
                                                    className="rounded-xl pl-2 py-1 my-2 bg-muted/80 italic text-muted/80-foreground"
                                                    {...props}
                                                />
                                            ),
                                            // Highlighted code blocks
                                            code({ className, children, ...props }) {
                                                const match = /language-(\w+)/.exec(className || '');
                                                const isCodeBlock = match && React.isValidElement(children) === false;

                                                return isCodeBlock ? (
                                                    <SyntaxHighlighter
                                                        style={ vscDarkPlus }
                                                        language={match[1]}
                                                        PreTag="div"
                                                        {...props}
                                                     >
                                                        {String(children).replace(/\n$/, '')}
                                                    </SyntaxHighlighter>
                                                ) : (
                                                    <code className={className} {...props}>
                                                        {children}
                                                    </code>
                                                );
                                            },
                                        }}
                                    >
                                        {message.content}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        ))}

                        {/* Loading indicator when bot is thinking */}
                        {isSending && (
                            <div className="flex gap-3 justify-start">
                                <div className="flex items-center gap-2 rounded-lg px-4 py-2">
                                    <div className="thinking-animation">
                                        Thinking...
                                    </div>
                                </div>
                            </div>
                        )}

                        <style jsx>{`
                            .thinking-animation {
                                background: linear-gradient(90deg,
                                #0a0a0a 0%,
                                #5c5b5b 25%,
                                #919191 50%,
                                #b5b2b2 75%,
                                #0a0a0a 100%
                                );
                                background-size: 200% 100%;
                                background-clip: text;
                                -webkit-background-clip: text;
                                -webkit-text-fill-color: transparent;
                                animation: gradient-slide 2s ease-in-out infinite;
                                font-size: 0.875rem;
                            }

                            @keyframes gradient-slide {
                                0% {
                                    background-position: 200% 0;
                                }
                                100% {
                                    background-position: -200% 0;
                                }
                            }
                        `}</style>

                        <div ref={messagesEndRef} />
                    </div>
                </ScrollArea>
            </div>

            <div className="flex-shrink-0 p-4">
                <Card className="w-full max-w-3xl mx-auto rounded-2xl p-2">
                    <CardContent className="p-0">
                        <form onSubmit={handleSubmit}>
                            <div className="flex items-center gap-2">
                                <Input
                                    value={inputMessage}
                                    onChange={(e) => {
                                        setInputMessage(e.target.value);
                                        if (isVoiceInput) {
                                            setIsVoiceInput(false);
                                        }
                                    }}
                                    onKeyPress={handleKeyPress}
                                    placeholder={isProcessing ? displayText : "Ask me anything...."}
                                    className="flex-grow border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                                    disabled={isSending || isLoading || !token}
                                />
                                <Button
                                    type="submit"
                                    variant="ghost"
                                    size="icon"
                                    disabled={isSending || isLoading || !token || !inputMessage.trim()}
                                >
                                    <Send className="h-5 w-5" />
                                </Button>
                            </div>
                        </form>

                        <div className="flex items-center gap-2 mt-3">
                            <div className="flex-grow"></div>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        disabled={isProcessing || isSending || isLoading || !token}
                                    >
                                        <Languages className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                    {languages.map((language) => (
                                        <DropdownMenuItem
                                            key={language.code}
                                            onClick={() => handleLanguageSelect(language)}
                                            className={selectedLanguage.code === language.code ? 'bg-accent' : ''}
                                        >
                                            {language.name}
                                            {selectedLanguage.code === language.code && (
                                                <span className="ml-auto">✓</span>
                                            )}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <Button
                                size="icon"
                                onClick={sttFromMic}
                                disabled={isProcessing || isSending || isLoading || !token}
                                variant="ghost"
                            >
                                <Mic className={`h-4 w-4 ${isProcessing ? 'text-red-500' : ''}`} />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}