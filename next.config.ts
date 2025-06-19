import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    env: {
        SPEECH_KEY: process.env.SPEECH_KEY,
        SPEECH_REGION: process.env.SPEECH_REGION
    }
};

export default nextConfig;
