"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAIAnswer = void 0;
const openai_1 = __importDefault(require("openai"));
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY || 'dummy-key',
});
const getAIAnswer = async (question, subject) => {
    try {
        const subjectContext = subject ? `The question is about ${subject}. ` : '';
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert tutor for KOlachi Tutor. Provide clear, educational, and helpful answers to student questions. Be concise but thorough.'
                },
                {
                    role: 'user',
                    content: `${subjectContext}Question: ${question}\n\nPlease provide a helpful answer:`
                }
            ],
            max_tokens: 500,
            temperature: 0.7,
        });
        return response.choices[0]?.message?.content || 'I apologize, but I could not generate an answer at this time.';
    }
    catch (error) {
        console.error('AI Error:', error);
        return 'I apologize, but I could not generate an answer at this time. Please try again later.';
    }
};
exports.getAIAnswer = getAIAnswer;
//# sourceMappingURL=aiService.js.map