// 'use client';
//
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Card, CardContent } from "@/components/ui/card";
// import { ScrollArea } from "@/components/ui/scroll-area";
// import { Plus, Search, Layers, Mic, Send } from "lucide-react";
// import React, { useEffect, useRef, useState } from "react";
// import { getTokenOrRefresh } from '@/lib/token_util';
// import axios from 'axios';
//
// const speechsdk = require('microsoft-cognitiveservices-speech-sdk');
//
// interface TokenResponse {
//     access_token: string;
//     token_type: string;
//     session_id: string;
// }
//
// interface TokenObject {
//     authToken: string | null;
//     region: string;
//     error?: any;
// }
//
// interface ChatMessage {
//     id: string;
//     content: string;
//     isUser: boolean;
//     timestamp: Date;
// }
//
// interface ChatRequest {
//     Message: string;
//     IsVoice: boolean;
//     Language: string;
// }
//
// interface ChatResponse {
//     message?: string;
//     response?: string;
//     session_id?: string;
//     is_voice?: boolean;
//     language?: string;
//     message_received?: string;
// }
//
// export default function Chat() {
//     const [token, setToken] = useState<string | null>(null);
//     const [sessionId, setSessionId] = useState<string | null>(null);
//     const [isLoading, setIsLoading] = useState<boolean>(true);
//
//     const [messages, setMessages] = useState<ChatMessage[]>([]);
//     const [inputMessage, setInputMessage] = useState<string>('');
//     const [isSending, setIsSending] = useState<boolean>(false);
//     const [isVoiceInput, setIsVoiceInput] = useState<boolean>(false);
//
//     const [displayText, setDisplayText] = useState<string>('Ask me anything....');
//     const [isProcessing, setIsProcessing] = useState<boolean>(false);
//     const [player, updatePlayer] = useState<any>({ p: undefined, muted: false });
//
//     const messagesEndRef = useRef<HTMLDivElement>(null);
//
//     const scrollToBottom = () => {
//         messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//     };
//
//     useEffect(() => {
//         scrollToBottom();
//     }, [messages]);
//
//     const sendMessage = async (messageText: string) => {
//         if (!messageText.trim() || isSending || !token) return;
//
//         const userMessage: ChatMessage = {
//             id: Date.now().toString(),
//             content: messageText,
//             isUser: true,
//             timestamp: new Date()
//         };
//
//         setMessages(prev => [...prev, userMessage]);
//         setInputMessage('');
//         setIsSending(true);
//
//         try {
//             const chatRequest: ChatRequest = {
//                 Message: messageText,
//                 IsVoice: isVoiceInput,
//                 Language: "en"
//             };
//
//             console.log('Sending chat request:', chatRequest);
//
//             const response = await axios.post<ChatResponse>(
//                 'https://hayleys-backend-api-v1-dmd4hra3ccaub7c2.canadacentral-01.azurewebsites.net/chat',
//                 chatRequest
//             );
//
//             console.log('Complete chat response:', response.data);
//             console.log('Full response object:', response);
//
//             const responseText = response.data.message || response.data.response || 'I received your message but couldn\'t generate a response.';
//
//             const botMessage: ChatMessage = {
//                 id: (Date.now() + 1).toString(),
//                 content: responseText,
//                 isUser: false,
//                 timestamp: new Date()
//             };
//
//             setMessages(prev => [...prev, botMessage]);
//
//             // Check if response indicates voice output should be played
//             if (response.data.is_voice === true) {
//                 console.log('Voice response detected, starting TTS...');
//                 await textToSpeech(responseText);
//             }
//
//         } catch (error) {
//             console.error('Error sending message:', error);
//
//             const errorMessage: ChatMessage = {
//                 id: (Date.now() + 1).toString(),
//                 content: 'Sorry, I encountered an error while processing your message. Please try again.',
//                 isUser: false,
//                 timestamp: new Date()
//             };
//
//             setMessages(prev => [...prev, errorMessage]);
//
//             if (axios.isAxiosError(error)) {
//                 console.error('Response status:', error.response?.status);
//                 console.error('Response data:', error.response?.data);
//             }
//         } finally {
//             setIsSending(false);
//             // Reset voice input flag after sending
//             setIsVoiceInput(false);
//         }
//     };
//
//     const handleSubmit = (e: React.FormEvent) => {
//         e.preventDefault();
//         sendMessage(inputMessage);
//     };
//
//     const textToSpeech = async (textToSpeak: string): Promise<void> => {
//         try {
//             setIsProcessing(true);
//             const tokenObj: TokenObject = await getTokenOrRefresh();
//
//             if (!tokenObj.authToken) {
//                 console.error(`ERROR: Unable to get authorization token. ${tokenObj.error || ''}`);
//                 setIsProcessing(false);
//                 return;
//             }
//
//             const speechConfig = speechsdk.SpeechConfig.fromAuthorizationToken(tokenObj.authToken, tokenObj.region);
//             const myPlayer = new speechsdk.SpeakerAudioDestination();
//
//             updatePlayer(p => ({ p: myPlayer, muted: p.muted }));
//             const audioConfig = speechsdk.AudioConfig.fromSpeakerOutput(myPlayer);
//
//             let synthesizer = new speechsdk.SpeechSynthesizer(speechConfig, audioConfig);
//
//             console.log(`Speaking text: ${textToSpeak}`);
//
//             synthesizer.speakTextAsync(
//                 textToSpeak,
//                 (result: any) => {
//                     let text: string;
//                     if (result.reason === speechsdk.ResultReason.SynthesizingAudioCompleted) {
//                         text = `Synthesis finished for "${textToSpeak}".`;
//                         console.log(text);
//                     } else if (result.reason === speechsdk.ResultReason.Canceled) {
//                         text = `Synthesis failed. Error detail: ${result.errorDetails}.`;
//                         console.error(text);
//                     } else {
//                         text = 'Synthesis completed.';
//                         console.log(text);
//                     }
//                     synthesizer.close();
//                     synthesizer = undefined;
//                     setIsProcessing(false);
//                 },
//                 (err: string) => {
//                     console.error(`TTS Error: ${err}`);
//                     synthesizer.close();
//                     synthesizer = undefined;
//                     setIsProcessing(false);
//                 }
//             );
//         } catch (error) {
//             console.error(`TTS ERROR: ${error}`);
//             setIsProcessing(false);
//         }
//     };
//
//     const handleKeyPress = (e: React.KeyboardEvent) => {
//         if (e.key === 'Enter' && !e.shiftKey) {
//             e.preventDefault();
//             sendMessage(inputMessage);
//         }
//     };
//
//     const sttFromMic = async (): Promise<void> => {
//         try {
//             setIsProcessing(true);
//             const tokenObj: TokenObject = await getTokenOrRefresh();
//
//             if (!tokenObj.authToken) {
//                 setDisplayText(`ERROR: Unable to get authorization token. ${tokenObj.error || ''}`);
//                 setIsProcessing(false);
//                 return;
//             }
//
//             const speechConfig = speechsdk.SpeechConfig.fromAuthorizationToken(tokenObj.authToken, tokenObj.region);
//             speechConfig.speechRecognitionLanguage = 'en-US';
//
//             const audioConfig = speechsdk.AudioConfig.fromDefaultMicrophoneInput();
//             const recognizer = new speechsdk.SpeechRecognizer(speechConfig, audioConfig);
//
//             setDisplayText('Listening...');
//
//             recognizer.recognizeOnceAsync((result: any) => {
//                 if (result.reason === speechsdk.ResultReason.RecognizedSpeech) {
//                     setInputMessage(result.text);
//                     setIsVoiceInput(true); // Set voice input flag
//                     setDisplayText('Ask me anything....');
//                 } else {
//                     setDisplayText('ERROR: Speech was cancelled or could not be recognized. Ensure your microphone is working properly.');
//                 }
//                 setIsProcessing(false);
//             });
//         } catch (error) {
//             setDisplayText(`ERROR: ${error}`);
//             setIsProcessing(false);
//         }
//     };
//
//     useEffect(() => {
//         const fetchGuestToken = async () => {
//             try {
//                 setIsLoading(true);
//
//                 const response = await axios.post<TokenResponse>(
//                     'https://hayleys-backend-api-v1-dmd4hra3ccaub7c2.canadacentral-01.azurewebsites.net/token/guest',
//                     {},
//                     {
//                         headers: {
//                             'Content-Type': 'application/json',
//                         },
//                     }
//                 );
//
//                 const data = response.data;
//
//                 // Set the token and session ID in state
//                 setToken(data.access_token);
//                 setSessionId(data.session_id);
//
//                 // Set axios default headers with the token
//                 axios.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`;
//
//                 // Print token to console as requested
//                 console.log('Guest Token:', data.access_token);
//                 console.log('Session ID:', data.session_id);
//                 console.log('Full Response:', data);
//
//             } catch (error) {
//                 console.error('Error fetching guest token:', error);
//
//                 if (axios.isAxiosError(error)) {
//                     console.error('Response status:', error.response?.status);
//                     console.error('Response data:', error.response?.data);
//                 }
//             } finally {
//                 setIsLoading(false);
//             }
//         };
//
//         fetchGuestToken();
//     }, []);
//
//     return (
//         <div className="flex flex-col h-full">
//             {/* Chat Messages Area - Scrollable */}
//             <div className="flex-1 overflow-hidden">
//                 <ScrollArea className="h-full p-4">
//                     <div className="w-full max-w-3xl mx-auto flex flex-col space-y-4">
//                         {/* Loading indicator */}
//                         {isLoading && (
//                             <div className="flex justify-center">
//                                 <div className="">Loading...</div>
//                             </div>
//                         )}
//
//                         {/* Chat Messages */}
//                         {messages.map((message) => (
//                             <div key={message.id} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
//                                 <div className={`p-3 rounded-lg max-w-[80%] ${
//                                     message.isUser
//                                         ? 'bg-muted/70 text-muted/70-foreground'
//                                         : ''
//                                 }`}>
//                                     {message.content}
//                                 </div>
//                             </div>
//                         ))}
//
//
//
//                         <div ref={messagesEndRef} />
//                     </div>
//                 </ScrollArea>
//             </div>
//
//             {/* Input Area */}
//             <div className="flex-shrink-0 p-4">
//                 <Card className="w-full max-w-3xl mx-auto rounded-2xl p-2">
//                     <CardContent className="p-0">
//                         <form onSubmit={handleSubmit}>
//                             <div className="flex items-center gap-2">
//                                 <Input
//                                     value={inputMessage}
//                                     onChange={(e) => {
//                                         setInputMessage(e.target.value);
//                                         // Reset voice input flag when user types manually
//                                         if (isVoiceInput) {
//                                             setIsVoiceInput(false);
//                                         }
//                                     }}
//                                     onKeyPress={handleKeyPress}
//                                     placeholder={isProcessing ? displayText : "Ask me anything...."}
//                                     className="flex-grow border-none focus-visible:ring-0 focus-visible:ring-offset-0"
//                                     disabled={isSending || isLoading || !token}
//                                 />
//                                 <Button
//                                     type="submit"
//                                     variant="ghost"
//                                     size="icon"
//                                     disabled={isSending || isLoading || !token || !inputMessage.trim()}
//                                 >
//                                     <Send className="h-5 w-5" />
//                                 </Button>
//                             </div>
//                         </form>
//
//                         <div className="flex items-center gap-2 mt-3">
//                             <Button variant="ghost" size="icon">
//                                 <Plus className="h-5 w-5" />
//                             </Button>
//
//                             <div className="flex-grow"></div>
//
//                             <Button
//                                 size="icon"
//                                 onClick={sttFromMic}
//                                 disabled={isProcessing || isSending || isLoading || !token}
//                                 variant="ghost"
//                             >
//                                 <Mic className={`h-4 w-4 ${isProcessing ? 'text-red-500' : ''}`} />
//                             </Button>
//                         </div>
//                     </CardContent>
//                 </Card>
//             </div>
//         </div>
//     );
// }