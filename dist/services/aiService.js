"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAIAnswer = void 0;
const axios_1 = __importDefault(require("axios"));
const getAIAnswer = async (question, subject) => {
    const subjectContext = subject ? `The question is about ${subject}. ` : '';
    const fullQuestion = `${subjectContext}Question: ${question}`;
    // Groq (FREE - Recommended)
    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey) {
        try {
            const response = await axios_1.default.post('https://api.groq.com/openai/v1/chat/completions', {
                model: 'llama-3.1-8b-instant',
                messages: [
                    { role: 'system', content: 'You are an expert tutor for Kolachi Tutors. Provide clear, helpful, educational answers. Be concise but thorough.' },
                    { role: 'user', content: fullQuestion }
                ],
                max_tokens: 800,
                temperature: 0.7
            }, {
                headers: { Authorization: `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
                timeout: 30000
            });
            if (response.data?.choices?.[0]?.message?.content) {
                return response.data.choices[0].message.content;
            }
        }
        catch (e) {
            console.log('Groq error:', e?.message);
        }
    }
    // Gemini (FREE)
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
        try {
            const response = await axios_1.default.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
                contents: [{ parts: [{ text: `You are an expert tutor. ${fullQuestion}` }] }],
                generationConfig: { maxOutputTokens: 800, temperature: 0.7 }
            }, { timeout: 30000 });
            if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
                return response.data.candidates[0].content.parts[0].text;
            }
        }
        catch (e) {
            console.log('Gemini error:', e?.message);
        }
    }
    // Ollama (FREE - Local)
    const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    try {
        const response = await axios_1.default.post(`${ollamaUrl}/api/generate`, {
            model: 'llama2',
            prompt: `Expert tutor: ${fullQuestion}`,
            stream: false,
            options: { temperature: 0.7, num_predict: 500 }
        }, { timeout: 30000 });
        if (response.data?.response) {
            return response.data.response;
        }
    }
    catch (e) {
        console.log('Ollama error:', e?.message);
    }
    // Fallback - Smart responses
    return generateFallbackAnswer(question, subject);
};
exports.getAIAnswer = getAIAnswer;
function generateFallbackAnswer(question, subject) {
    const q = question.toLowerCase();
    if (q.includes('math') || q.includes('equation') || q.includes('solve') || q.includes('calculate')) {
        return `Mathematics Help 📐\n\n1. Read problem carefully\n2. Identify what to find\n3. Use appropriate formula\n4. Show all steps\n5. Check your answer\n\nShare your specific problem for detailed help!`;
    }
    if (q.includes('physics') || q.includes('force') || q.includes('energy') || q.includes('motion')) {
        return `Physics Help ⚛️\n\n1. List known/unknown quantities\n2. Choose correct formula\n3. Check units consistency\n4. Solve algebraically first\n5. Include units in answer\n\nWhat specific topic do you need?`;
    }
    if (q.includes('chemistry') || q.includes('atom') || q.includes('reaction') || q.includes('element')) {
        return `Chemistry Help 🧪\n\n1. Identify reaction type\n2. Balance equation\n3. Use mole ratios\n4. Check conservation of mass\n\nShare the specific problem!`;
    }
    if (q.includes('biology') || q.includes('cell') || q.includes('DNA') || q.includes('organism')) {
        return `Biology Help 🧬\n\nKey concepts:\n• Cell theory\n• Genetics (DNA → RNA → Protein)\n• Ecosystems\n• Evolution\n\nWhat topic do you need?`;
    }
    if (q.includes('code') || q.includes('programming') || q.includes('python') || q.includes('javascript') || q.includes('function')) {
        return `Programming Help 💻\n\n1. Understand the problem\n2. Break into steps\n3. Write pseudocode first\n4. Code incrementally\n5. Test with different inputs\n\nShare your code for help!`;
    }
    if (q.includes('english') || q.includes('grammar') || q.includes('essay') || q.includes('writing')) {
        return `English Help 📚\n\nTips:\n• Clear thesis statement\n• Good paragraph structure\n• Vary sentence length\n• Proofread carefully\n\nWhat specifically?`;
    }
    if (q.includes('pakistan') || q.includes('history') || q.includes('independence') || q.includes('partition')) {
        return `Pakistan Studies 🇵🇰\n\nKey Events:\n• 1857 - War of Independence\n• 1940 - Lahore Resolution\n• 1947 - Independence\n• 1971 - Bangladesh Creation\n\nWhat topic?`;
    }
    if (q.includes('islam') || q.includes('quran') || q.includes('hadith') || q.includes('prayer')) {
        return `Islamic Studies 🕌\n\nFive Pillars:\n1. Shahada\n2. Prayer (5 times)\n3. Zakat\n4. Sawm (Ramadan)\n5. Hajj\n\nWhat topic?`;
    }
    if (q.includes('study') || q.includes('learn') || q.includes('exam') || q.includes('memory')) {
        return `Study Tips 📖\n\n1. Active recall - test yourself\n2. Spaced repetition\n3. Practice past papers\n4. Teach others\n5. Break into chunks\n\nStay consistent!`;
    }
    return `Thanks for your question! 🙏\n\nTips for better answers:\n• Be specific about what you need\n• Share examples\n• Mention your grade level\n\nSubjects: Math, Physics, Chemistry, Biology, Computer Science, English, Urdu, Pakistan Studies, Islamic Studies, Economics.`;
}
//# sourceMappingURL=aiService.js.map