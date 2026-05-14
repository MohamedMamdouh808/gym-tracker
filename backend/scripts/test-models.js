require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        console.error('No API key found in .env');
        return;
    }
    try {
        const genAI = new GoogleGenerativeAI(key);
        const models = await genAI.listModels();
        console.log('Available models:');
        models.models.forEach(m => {
            console.log(`- ${m.name} (${m.displayName}) - Supported methods: ${m.supportedGenerationMethods.join(', ')}`);
        });
    } catch (error) {
        console.error('Error listing models:', error.message);
    }
}

listModels();
