// 'use client';
//
// import React, { useState, useRef } from 'react';
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Separator } from "@/components/ui/separator";
// import { Mic, FileAudio, Volume2, VolumeX} from 'lucide-react';
// import { getTokenOrRefresh} from '@/lib/token_util';
//
// // You'll need to install and import the speech SDK
// // npm install microsoft-cognitiveservices-speech-sdk
// const speechsdk = require('microsoft-cognitiveservices-speech-sdk');
//
// interface PlayerState {
//     p: any;
//     muted: boolean;
// }
//
// interface TokenObject {
//     authToken: string | null;
//     region: string;
//     error?: any;
// }
//
// export default function Speech() {
//     const [displayText, setDisplayText] = useState<string>('INITIALIZED: ready to test speech...');
//     const [player, updatePlayer] = useState<PlayerState>({ p: undefined, muted: false });
//     const [isProcessing, setIsProcessing] = useState<boolean>(false);
//     const fileInputRef = useRef<HTMLInputElement>(null);
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
//             setDisplayText('Speak into your microphone...');
//
//             recognizer.recognizeOnceAsync((result: any) => {
//                 if (result.reason === speechsdk.ResultReason.RecognizedSpeech) {
//                     setDisplayText(`RECOGNIZED: ${result.text}`);
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
//     const textToSpeech = async (): Promise<void> => {
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
//             const myPlayer = new speechsdk.SpeakerAudioDestination();
//
//             updatePlayer(p => ({ p: myPlayer, muted: p.muted }));
//             const audioConfig = speechsdk.AudioConfig.fromSpeakerOutput(myPlayer);
//
//             let synthesizer = new speechsdk.SpeechSynthesizer(speechConfig, audioConfig);
//
//             const textToSpeak = 'This is an example of speech synthesis for a long passage of text. Pressing the mute button should pause/resume the audio output.';
//             setDisplayText(`Speaking text: ${textToSpeak}...`);
//
//             synthesizer.speakTextAsync(
//                 textToSpeak,
//                 (result: any) => {
//                     let text: string;
//                     if (result.reason === speechsdk.ResultReason.SynthesizingAudioCompleted) {
//                         text = `Synthesis finished for "${textToSpeak}".`;
//                     } else if (result.reason === speechsdk.ResultReason.Canceled) {
//                         text = `Synthesis failed. Error detail: ${result.errorDetails}.`;
//                     } else {
//                         text = 'Synthesis completed.';
//                     }
//                     synthesizer.close();
//                     synthesizer = undefined;
//                     setDisplayText(text);
//                     setIsProcessing(false);
//                 },
//                 (err: string) => {
//                     setDisplayText(`Error: ${err}.`);
//                     synthesizer.close();
//                     synthesizer = undefined;
//                     setIsProcessing(false);
//                 }
//             );
//         } catch (error) {
//             setDisplayText(`ERROR: ${error}`);
//             setIsProcessing(false);
//         }
//     };
//
//     const handleMute = async (): Promise<void> => {
//         updatePlayer(p => {
//             if (!p.muted && p.p) {
//                 p.p.pause();
//                 return { p: p.p, muted: true };
//             } else if (p.p) {
//                 p.p.resume();
//                 return { p: p.p, muted: false };
//             }
//             return p;
//         });
//     };
//
//     const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
//         const file = event.target.files?.[0];
//         if (!file) return;
//
//         try {
//             setIsProcessing(true);
//             const fileInfo = `${file.name} size=${file.size} bytes `;
//             setDisplayText(fileInfo);
//
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
//             const audioConfig = speechsdk.AudioConfig.fromWavFileInput(file);
//             const recognizer = new speechsdk.SpeechRecognizer(speechConfig, audioConfig);
//
//             recognizer.recognizeOnceAsync((result: any) => {
//                 let text: string;
//                 if (result.reason === speechsdk.ResultReason.RecognizedSpeech) {
//                     text = `RECOGNIZED: ${result.text}`;
//                 } else {
//                     text = 'ERROR: Speech was cancelled or could not be recognized. Please ensure the audio file is valid.';
//                 }
//                 setDisplayText(fileInfo + text);
//                 setIsProcessing(false);
//             });
//         } catch (error) {
//             setDisplayText(`ERROR: ${error}`);
//             setIsProcessing(false);
//         }
//     };
//
//     const triggerFileInput = (): void => {
//         fileInputRef.current?.click();
//     };
//
//     return (
//         <div className="min-h-screen p-4">
//             <div className="max-w-6xl mx-auto">
//                 <div className="text-center mb-8">
//                     <h1 className="text-4xl font-bold text-gray-900 mb-2">
//                         Azure Speech Services
//                     </h1>
//                     <p className="text-gray-600">
//                         Convert speech to text and text to speech using Azure Cognitive Services
//                     </p>
//                 </div>
//
//                 <div className="grid md:grid-cols-2 gap-6">
//                     {/* Controls Card */}
//                     <Card className="shadow-lg">
//                         <CardHeader>
//                             <CardTitle className="flex items-center gap-2">
//                                 <Mic className="h-5 w-5" />
//                                 Speech Controls
//                             </CardTitle>
//                         </CardHeader>
//                         <CardContent className="space-y-4">
//                             <div className="space-y-3">
//                                 <Button
//                                     onClick={sttFromMic}
//                                     disabled={isProcessing}
//                                     className="w-full justify-start gap-2 h-12"
//                                     variant="outline"
//                                 >
//                                     <Mic className="h-4 w-4" />
//                                     {isProcessing ? 'Listening...' : 'Speech to Text (Microphone)'}
//                                 </Button>
//
//                                 <Button
//                                     onClick={triggerFileInput}
//                                     disabled={isProcessing}
//                                     className="w-full justify-start gap-2 h-12"
//                                     variant="outline"
//                                 >
//                                     <FileAudio className="h-4 w-4" />
//                                     Speech to Text (Audio File)
//                                 </Button>
//
//                                 <input
//                                     ref={fileInputRef}
//                                     type="file"
//                                     accept="audio/*"
//                                     onChange={handleFileChange}
//                                     className="hidden"
//                                 />
//
//                                 <Separator />
//
//                                 <Button
//                                     onClick={textToSpeech}
//                                     disabled={isProcessing}
//                                     className="w-full justify-start gap-2 h-12"
//                                     variant="default"
//                                 >
//                                     <Volume2 className="h-4 w-4" />
//                                     {isProcessing ? 'Speaking...' : 'Text to Speech'}
//                                 </Button>
//
//                                 <Button
//                                     onClick={handleMute}
//                                     disabled={!player.p}
//                                     className="w-full justify-start gap-2 h-12"
//                                     variant="secondary"
//                                 >
//                                     {player.muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
//                                     {player.muted ? 'Resume Audio' : 'Pause Audio'}
//                                 </Button>
//                             </div>
//                         </CardContent>
//                     </Card>
//
//                     {/* Output Card */}
//                     <Card className="shadow-lg">
//                         <CardHeader>
//                             <CardTitle className="flex items-center justify-between">
//                                 Output
//                                 {isProcessing && (
//                                     <Badge variant="secondary" className="animate-pulse">
//                                         Processing...
//                                     </Badge>
//                                 )}
//                             </CardTitle>
//                         </CardHeader>
//                         <CardContent>
//                             <div className="bg-gray-50 rounded-lg p-4 min-h-[200px] font-mono text-sm">
//                 <pre className="whitespace-pre-wrap break-words text-gray-800">
//                   {displayText}
//                 </pre>
//                             </div>
//                         </CardContent>
//                     </Card>
//                 </div>
//
//                 {/* Instructions */}
//                 <Card className="mt-6 shadow-lg">
//                     <CardHeader>
//                         <CardTitle>Instructions</CardTitle>
//                     </CardHeader>
//                     <CardContent>
//                         <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
//                             <div>
//                                 <h4 className="font-semibold mb-2">Speech to Text:</h4>
//                                 <ul className="space-y-1">
//                                     <li>• Click microphone button and speak clearly</li>
//                                     <li>• Upload audio files (WAV format recommended)</li>
//                                     <li>• Ensure microphone permissions are granted</li>
//                                 </ul>
//                             </div>
//                             <div>
//                                 <h4 className="font-semibold mb-2">Text to Speech:</h4>
//                                 <ul className="space-y-1">
//                                     <li>• Click the Text to Speech button to hear sample text</li>
//                                     <li>• Use pause/resume to control playback</li>
//                                     <li>• Audio output uses your default speakers</li>
//                                 </ul>
//                             </div>
//                         </div>
//                     </CardContent>
//                 </Card>
//             </div>
//         </div>
//     );
// }