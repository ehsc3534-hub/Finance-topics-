
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { google } = require('googleapis');

const HISTORY_FILE = path.join(__dirname, 'published_history.json');

// এপিআই কি এবং ব্লগ আইডি চেক
if (!process.env.GEMINI_TEXT_API_KEY || !process.env.BLOG_ID) {
    console.error("❌ Error: Missing API Keys or Blog ID in environment variables.");
    process.exit(1);
}

// জেমিনি এআই ক্লায়েন্ট সেটআপ
const ai = new GoogleGenerativeAI(process.env.GEMINI_TEXT_API_KEY);

// ব্লগার এপিআই ক্লায়েন্ট সেটআপ
const oauth2Client = new google.auth.OAuth2(
    process.env.BLOGGER_CLIENT_ID,
    process.env.BLOGGER_CLIENT_SECRET
);
oauth2Client.setCredentials({ refresh_token: process.env.BLOGGER_REFRESH_TOKEN });
const blogger = google.blogger({ version: 'v3', auth: oauth2Client });

function loadHistory() {
    if (!fs.existsSync(HISTORY_FILE)) return [];
    try { return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8')); } 
    catch (e) { return []; }
}

function saveToHistory(title) {
    const history = loadHistory();
    history.push({ title, publishedAt: new Date().toISOString() });
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
}

function getRandomFinanceTopic() {
    const topics = [
        "Passive Income Strategies for Beginners in 2026",
        "How to Invest in Index Funds with Low Risk",
        "The Future of Digital Banking and Cryptocurrency Regulations",
        "Effective Budgeting Rules to Build Long-Term Wealth",
        "Understanding Smart Real Estate Investments",
        "Top High-Yield Savings Accounts to Beat Inflation"
    ];
    const history = loadHistory();
    const available = topics.filter(t => !history.some(h => h.title === t));
    return available.length > 0 ? available[0] : topics[Math.floor(Math.random() * topics.length)];
}

async function startAutomation() {
    console.log("🚀 Starting Pipeline...");
    
    try {
        const topic = getRandomFinanceTopic();
        console.log(`🎯 Target Topic: ${topic}`);

        // ফ্রি এপিআই কি-এর জন্য সঠিক মডেল কল
        const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const prompt = `Write an SEO-optimized financial blog post about "${topic}". 
        Use HTML tags (H2, H3, p, strong). Do not use markdown backticks.`;

        const result = await model.generateContent(prompt);
        const articleHtml = result.response.text();

        console.log("📝 Publishing to Blogger...");
        const response = await blogger.posts.insert({
            blogId: process.env.BLOG_ID,
            requestBody: {
                title: topic,
                content: articleHtml,
                labels: ['Finance', 'Investment']
            }
        });

        console.log(`✅ Success! Post ID: ${response.data.id}`);
        saveToHistory(topic);

    } catch (error) {
        console.error("❌ Error:", error.message);
        process.exit(1);
    }
}

startAutomation();
