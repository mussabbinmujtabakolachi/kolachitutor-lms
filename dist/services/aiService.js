"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAIAnswer = void 0;
const axios_1 = __importDefault(require("axios"));
const getAIAnswer = async (question, subject) => {
    try {
        const subjectContext = subject ? `The question is about ${subject}. ` : '';
        const fullQuestion = `${subjectContext}Question: ${question}`;
        // Try Groq (FREE - fastest)
        const groqKey = process.env.GROQ_API_KEY;
        if (groqKey) {
            try {
                const groqResponse = await axios_1.default.post('https://api.groq.com/openai/v1/chat/completions', {
                    model: 'llama-3.1-8b-instant',
                    messages: [
                        { role: 'system', content: 'You are an expert tutor for Kolachi Tutors. Provide clear, helpful, educational answers. Be concise but thorough.' },
                        { role: 'user', content: fullQuestion }
                    ],
                    max_tokens: 600,
                    temperature: 0.7
                }, {
                    headers: { Authorization: `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
                    timeout: 30000
                });
                if (groqResponse.data?.choices?.[0]?.message?.content) {
                    return groqResponse.data.choices[0].message.content;
                }
            }
            catch (e) {
                console.log('Groq not available');
            }
        }
        // Try Gemini (FREE - Google AI)
        const geminiKey = process.env.GEMINI_API_KEY;
        if (geminiKey) {
            try {
                const geminiResponse = await axios_1.default.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
                    contents: [{ parts: [{ text: `You are an expert tutor for Kolachi Tutors. ${fullQuestion}` }] }],
                    generationConfig: { maxOutputTokens: 600, temperature: 0.7 }
                }, { timeout: 30000 });
                if (geminiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
                    return geminiResponse.data.candidates[0].content.parts[0].text;
                }
            }
            catch (e) {
                console.log('Gemini not available');
            }
        }
        // Try Ollama (FREE - local)
        const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
        try {
            const ollamaResponse = await axios_1.default.post(`${ollamaUrl}/api/generate`, {
                model: 'llama2',
                prompt: `You are an expert tutor for Kolachi Tutors. ${fullQuestion}`,
                stream: false,
                options: { temperature: 0.7, num_predict: 500 }
            }, { timeout: 30000 });
            if (ollamaResponse.data.response) {
                return ollamaResponse.data.response;
            }
        }
        catch (e) {
            console.log('Ollama not available');
        }
        // Try Hugging Face (FREE tier)
        const hfToken = process.env.HF_TOKEN;
        if (hfToken) {
            try {
                const hfResponse = await axios_1.default.post('https://api-inference.huggingface.co/models/facebook/bart-large-cnn', { inputs: `Answer: ${fullQuestion}` }, { headers: { Authorization: `Bearer ${hfToken}` }, timeout: 30000 });
                if (Array.isArray(hfResponse.data) && hfResponse.data[0]?.summary_text) {
                    return hfResponse.data[0].summary_text;
                }
            }
            catch (e) {
                console.log('HuggingFace not available');
            }
        }
        // Fallback: Smart rule-based responses
        return generateFallbackAnswer(question, subject);
    }
    catch (error) {
        console.error('AI Error:', error);
        return generateFallbackAnswer(question, subject);
    }
};
exports.getAIAnswer = getAIAnswer;
function generateFallbackAnswer(question, subject) {
    const q = question.toLowerCase();
    if (q.includes('math') || q.includes('calculate') || q.includes('equation') || q.includes('solve') || q.includes('algebra')) {
        return `Great question about Mathematics! 📐\n\nTo solve math problems:\n\n1. **Read carefully** - Understand what the problem asks\n2. **Identify knowns** - Note all given information\n3. **Choose formula** - Select the right equation\n4. **Substitute** - Put numbers in place of variables\n5. **Solve** - Calculate step by step\n6. **Check** - Verify your answer\n\nShare your specific problem!`;
    }
    if (q.includes('physics') || q.includes('force') || q.includes('energy') || q.includes('motion') || q.includes('velocity')) {
        return `Excellent Physics question! ⚛️\n\nApproach physics problems:\n\n1. **List variables** - What do you know? Need?\n2. **Choose formula** - F=ma, E=mc², etc.\n3. **Check units** - Make everything consistent\n4. **Calculate** - Solve algebraically first\n5. **Include units** - Always state answer with units\n\nWhat specific topic - mechanics, thermodynamics, waves?`;
    }
    if (q.includes('chemistry') || q.includes('atom') || q.includes('molecule') || q.includes('reaction') || q.includes('element')) {
        return `Good Chemistry question! 🧪\n\nSteps for chemistry:\n\n1. **Identify reaction type** - Synthesis, decomposition, etc.\n2. **Balance equation** - Count atoms on both sides\n3. **Mole ratio** - Use stoichiometry\n4. **Check** - Verify conservation of mass\n\nShare the specific problem!`;
    }
    if (q.includes('biology') || q.includes('cell') || q.includes('DNA') || q.includes('organism')) {
        return `Biology question! 🧬\n\nKey concepts:\n\n1. **Cell theory** - All living things are cells\n2. **Genetics** - DNA → RNA → Protein\n3. **Ecosystems** - Energy flows, matter cycles\n4. **Evolution** - Change through natural selection\n\nWhat specific topic?`;
    }
    if (q.includes('code') || q.includes('programming') || q.includes('python') || q.includes('javascript') || q.includes('algorithm')) {
        return `Programming question! 💻\n\nCoding approach:\n\n1. **Understand** - What should code do?\n2. **Plan** - Break into smaller steps\n3. **Pseudocode** - Write logic first\n4. **Code** - Write actual code\n5. **Test** - Try different inputs\n6. **Debug** - Fix any errors\n\nShare your code!`;
    }
    if (q.includes('english') || q.includes('grammar') || q.includes('writing') || q.includes('essay')) {
        return `Language & Writing tips! 📚\n\nBetter writing:\n\n1. **Clear thesis** - One main idea per paragraph\n2. **Structure** - Intro, body, conclusion\n3. **Vary sentences** - Mix short and long\n4. **Proofread** - Check grammar/spelling\n5. **Read aloud** - Catches errors\n\nWhat specifically?`;
    }
    if (q.includes('pakistan') || q.includes('history') || q.includes('independence') || q.includes('partition')) {
        return `Pakistan Studies! 🇵🇰\n\nKey events:\n\n1. **1857** - War of Independence\n2. **1940** - Lahore Resolution\n3. **1947** - Independence & Partition\n4. **1956** - First Constitution\n5. **1971** - Bangladesh Creation\n\nWhat topic?`;
    }
    if (q.includes('islam') || q.includes('quran') || q.includes('hadith') || q.includes('prayer')) {
        return `Islamic Studies! 🕌\n\nKey concepts:\n\n1. **Five Pillars** - Shahada, Prayer, Zakat, Sawm, Hajj\n2. **Quran** - Holy book, guidance\n3. **Hadith** - Sayings of Prophet (PBUH)\n4. **Prayer times** - Fajr, Dhuhr, Asr, Maghrib, Isha\n\nWhat topic?`;
    }
    if (q.includes('study') || q.includes('learn') || q.includes('memory') || q.includes('exam')) {
        return `Study strategies! 📖\n\n1. **Active recall** - Test yourself\n2. **Spaced repetition** - Review at intervals\n3. **Practice** - Do past papers\n4. **Teach** - Explain to others\n5. **Break it down** - Small chunks\n\nConsistency beats cramming!`;
    }
    return `Thanks for your question! 🙏\n\nTo help better:\n\n• Be specific about what you don't understand\n• Share examples you have\n• Tell me what you've tried\n• Mention your grade level\n\nThe more details, the better I can help!\n\nSubjects: Math, Physics, Chemistry, Biology, Computer Science, English, Urdu, Pakistan Studies, Islamic Studies, Economics.`;
}
//# sourceMappingURL=aiService.js.map