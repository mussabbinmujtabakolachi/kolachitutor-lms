"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAIAnswer = void 0;
const axios_1 = __importDefault(require("axios"));
const getAIAnswer = async (question, subject) => {
    try {
        // Try Ollama (free local AI) first
        const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
        try {
            const response = await axios_1.default.post(`${ollamaUrl}/api/generate`, {
                model: 'llama2',
                prompt: `You are an expert tutor for Kolachi Tutors. ${subject ? `The question is about ${subject}. ` : ''}Question: ${question}\n\nProvide a helpful, educational answer:`,
                stream: false,
                options: {
                    temperature: 0.7,
                    num_predict: 500
                }
            }, { timeout: 30000 });
            return response.data.response || 'I apologize, but I could not generate an answer at this time.';
        }
        catch (ollamaError) {
            console.log('Ollama not available, trying free API...');
            // Try Hugging Face Inference API (free tier)
            const hfToken = process.env.HF_TOKEN;
            if (hfToken) {
                try {
                    const hfResponse = await axios_1.default.post('https://api-inference.huggingface.co/models/facebook/bart-large-cnn', {
                        inputs: `Answer this educational question about ${subject || 'various topics'}: ${question}`,
                    }, {
                        headers: { Authorization: `Bearer ${hfToken}` },
                        timeout: 30000
                    });
                    if (Array.isArray(hfResponse.data) && hfResponse.data[0]?.summary_text) {
                        return hfResponse.data[0].summary_text;
                    }
                }
                catch (hfError) {
                    console.log('Hugging Face not available');
                }
            }
            // Fallback: Smart rule-based responses (works without API)
            return generateFallbackAnswer(question, subject);
        }
    }
    catch (error) {
        console.error('AI Error:', error);
        return generateFallbackAnswer(question, subject);
    }
};
exports.getAIAnswer = getAIAnswer;
function generateFallbackAnswer(question, subject) {
    const q = question.toLowerCase();
    // Math-related
    if (q.includes('math') || q.includes('calculate') || q.includes('equation') || q.includes('solve') || q.includes('algebra')) {
        return `Great question about Mathematics! 📐\n\nTo solve math problems effectively:\n\n1. **Read carefully** - Understand what the problem is asking\n2. **Identify knowns** - Note down all given information\n3. **Choose formula** - Select the right equation\n4. **Substitute** - Put numbers in place of variables\n5. **Solve** - Calculate step by step\n6. **Check** - Verify your answer\n\nShare your specific problem and I'll help you solve it!`;
    }
    // Physics
    if (q.includes('physics') || q.includes('force') || q.includes('energy') || q.includes('motion') || q.includes('velocity')) {
        return `Excellent Physics question! ⚛️\n\nHere's how to approach physics problems:\n\n1. **List variables** - What do you know? What do you need?\n2. **Choose formula** - F=ma, E=mc², v=u+at, etc.\n3. **Check units** - Make sure everything matches\n4. **Calculate** - Solve algebraically first\n5. **Include units** - Always state your answer with units\n\nWhat specific topic - mechanics, thermodynamics, waves?`;
    }
    // Chemistry
    if (q.includes('chemistry') || q.includes('atom') || q.includes('molecule') || q.includes('reaction') || q.includes('element')) {
        return `Good Chemistry question! 🧪\n\nSteps for chemistry problems:\n\n1. **Identify reaction type** - Synthesis, decomposition, etc.\n2. **Balance equation** - Count atoms on both sides\n3. **Mole ratio** - Use stoichiometry\n4. **Check** - Verify conservation of mass\n\nShare the specific problem!`;
    }
    // Biology
    if (q.includes('biology') || q.includes('cell') || q.includes('DNA') || q.includes('organism') || q.includes('ecosystem')) {
        return `Biology question! 🧬\n\nKey biology concepts:\n\n1. **Cell theory** - All living things are made of cells\n2. **Genetics** - DNA → RNA → Protein\n3. **Ecosystems** - Energy flows, matter cycles\n4. **Evolution** - Change over time through natural selection\n\nWhat specific topic do you need help with?`;
    }
    // Computer Science
    if (q.includes('code') || q.includes('programming') || q.includes('python') || q.includes('javascript') || q.includes('algorithm') || q.includes('function')) {
        return `Programming question! 💻\n\nGeneral coding approach:\n\n1. **Understand** - What should the code do?\n2. **Plan** - Break into smaller steps\n3. **Pseudocode** - Write the logic first\n4. **Code** - Write actual code\n5. **Test** - Try different inputs\n6. **Debug** - Fix any errors\n\nShare your code and I'll help!`;
    }
    // English/Language
    if (q.includes('grammar') || q.includes('english') || q.includes('writing') || q.includes('essay') || q.includes('paragraph')) {
        return `Language & Writing tips! 📚\n\nFor better writing:\n\n1. **Clear thesis** - One main idea per paragraph\n2. **Structure** - Introduction, body, conclusion\n3. **Vary sentences** - Mix short and long\n4. **Proofread** - Check grammar and spelling\n5. **Read aloud** - Helps catch errors\n\nWhat specifically would you like to improve?`;
    }
    // Pakistan Studies
    if (q.includes('pakistan') || q.includes('history') || q.includes('independence') || q.includes('partition')) {
        return `Pakistan Studies question! 🇵🇰\n\nKey historical events:\n\n1. **1857** - War of Independence\n2. **1940** - Lahore Resolution\n3. **1947** - Independence & Partition\n4. **1956** - First Constitution\n5. **1971** - Bangladesh Creation\n\nWhat specific event or period do you need to know about?`;
    }
    // Islamic Studies
    if (q.includes('islam') || q.includes('quran') || q.includes('hadith') || q.includes('islamic') || q.includes('prayer')) {
        return `Islamic Studies question! 🕌\n\nKey concepts:\n\n1. **Five Pillars** - Shahada, Prayer, Zakat, Sawm, Hajj\n2. **Quran** - Holy book, guidance for life\n3. **Hadith** - sayings of Prophet (PBUH)\n4. **Prayer times** - Fajr, Dhuhr, Asr, Maghrib, Isha\n\nWhat topic would you like to explore?`;
    }
    // Study tips
    if (q.includes('study') || q.includes('learn') || q.includes('memory') || q.includes('exam') || q.includes('test')) {
        return `Study strategies that work! 📖\n\n1. **Active recall** - Test yourself, don't just read\n2. **Spaced repetition** - Review at increasing intervals\n3. **Practice** - Do past papers and exercises\n4. **Teach** - Explain to others = better understanding\n5. **Break it down** - Small chunks are easier\n\nConsistency beats cramming! Study a little every day.`;
    }
    // How questions
    if (q.includes('how') && (q.includes('to') || q.includes('do'))) {
        return `Great "how to" question! 🎯\n\nTo answer this effectively:\n\n1. **Identify the goal** - What do you want to achieve?\n2. **List steps** - Break it into actions\n3. **Resources needed** - What tools or knowledge?\n4. **Practice** - Apply what you learn\n\nTell me more about your specific situation and I'll give better guidance!`;
    }
    // What questions
    if (q.startsWith('what') || q.includes('what is') || q.includes('what are')) {
        return `Good question! 🤔\n\nTo understand concepts better:\n\n1. **Definition** - What is the basic meaning?\n2. **Examples** - Real-world applications\n3. **Why it matters** - Practical importance\n4. **Related concepts** - How it connects to other topics\n\nShare more context and I'll give a detailed explanation!`;
    }
    // Default
    return `Thanks for your question! 🙏\n\nTo help you better:\n\n• Be specific about what you don't understand\n• Share any examples you have\n• Tell me what you've tried\n• Mention your grade level\n\nThe more details you give, the better I can help!\n\nYou can also ask about any subject: Math, Physics, Chemistry, Biology, Computer Science, English, Urdu, Pakistan Studies, Islamic Studies, Economics, and more.`;
}
//# sourceMappingURL=aiService.js.map