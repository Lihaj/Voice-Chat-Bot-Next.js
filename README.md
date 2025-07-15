# Next.js Chatbot with Azure Speech Services (STT & TTS)

This sample demonstrates a Next.js application integrating Azure Speech Services for both Speech-to-Text (STT) and Text-to-Speech (TTS) within a chatbot interface. It extends the original React sample by implementing token management via Next.js API Routes and providing a comprehensive chat experience.

---

## Prerequisites

- **Azure Account and Speech Service Subscription:** [Try the Speech service for free](https://docs.microsoft.com/azure/cognitive-services/speech-service/overview#try-the-speech-service-for-free).
- **Node.js:** Ensure you have Node.js installed (LTS version recommended).

---

## How to Run the App

1. **Clone the Repository:**
    ```bash
    git clone <your-repo-url>
    cd <your-repo-name>
    ```

2. **Install Dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3. **Configure Environment Variables:**
    - Create `.env.local` in the project root:
        ```
        SPEECH_KEY=your-azure-speech-service-key
        SPEECH_REGION=your-azure-speech-service-region
        ```
    - Replace placeholders with your actual Azure Speech service credentials.

4. **Run the Development Server:**
    ```bash
    npm run dev
    # or
    yarn dev
    ```
    - The app will be accessible at [http://localhost:3000](http://localhost:3000).

---

## Chatbot Features

### Message Sending

- Users send messages by typing or clicking **Send**.
- The `sendMessage` function sends the user's message to your backend API.

    ```typescript
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
                ' http://127.0.0.1:8000/chat',
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
    ```

---

### Change Recognition and Synthesis Language

- Use the language dropdown menu (globe icon) to change STT and TTS language.
- Supported languages:

    ```typescript
    const languages: Language[] = [
        { code: 'en-US', name: 'English' },
        { code: 'si-LK', name: 'Sinhala' },
        { code: 'ta-IN', name: 'Tamil' },
        { code:'fr-FR',  name:'French'},
        { code:'hi-IN',  name:'Hindi'}
    ];
    ```

---

### Speech-to-Text (STT) from Microphone

- Select language, click microphone, allow access, speak, and see text in input.
- `sttFromMic` function:

    ```typescript
    const sttFromMic = async (): Promise<void> =>
    {
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
    ```

---

### Text-to-Speech (TTS) for Chatbot Responses

- If your chatbot backend indicates (is_voice: true in its response), the application will automatically convert the chatbot's text response into speech and play it back to the user

    ```typescript
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
    ```

---

## Token Exchange Process (Next.js API Route)

- This sample uses a Next.js API Route (src/app/api/get-speech-token/route.ts) to securely retrieve and manage Azure Speech service authentication tokens. This prevents your Speech subscription key from being exposed on the client-side.
### Backend Token Endpoint (`src/app/api/get-speech-token/route.ts`)

```typescript
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
```
**This API route:**

- Reads your SPEECH_KEY and SPEECH_REGION from .env.local securely on the server-side.

- Makes a POST request to the Azure Speech Service issueToken endpoint to obtain a new authorization token.

- Returns the token and region to the client-side.

---
## Client-Side Token Utility (src/lib/token_util.ts)

- The getTokenOrRefresh utility function manages token retrieval and caching on the client-side using universal-cookie.


```typescript
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
```

**This function performs the following:**

- Checks for existing token: It first checks if a speech-token cookie already exists.

- Fetches new token: If no token is found (or it's expired), it makes an axios.get request to the Next.js API route /api/get-speech-token.

- Caches token: The retrieved token and region are stored in a cookie with a maxAge of 540 seconds (9 minutes) to ensure it's refreshed before it expires (tokens expire after 10 minutes).

- Returns token: Provides the authToken and region for use with the Speech SDK.

By using SpeechConfig.fromAuthorizationToken with the retrieved ephemeral token, this setup prevents your raw Speech service subscription key from being exposed in the browser, enhancing security.