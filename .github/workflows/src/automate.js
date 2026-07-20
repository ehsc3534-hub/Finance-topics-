const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { google } = require('googleapis');

const HISTORY_FILE = path.join(__dirname, 'published_history.json');

const ai = new GoogleGenerativeAI(process.env.GEMINI_TEXT_API_KEY);

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

async function startAutomation() {
    console.log("🚀 Starting Pipeline...");
    
    try {
        // মডেলের নাম সরাসরি 'gemini-1.5-flash' ব্যবহার করছি (কোনো প্রিফিক্স ছাড়া)
        const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const topic = "Passive Income Strategies for Beginners in 2026";
        const prompt = `Write an SEO-optimized financial blog post about "${topic}". Use HTML tags (H2, H3, p, strong). No markdown.`;

        const result = await model.generateContent(prompt);
        const articleHtml = result.response.text();

        const response = await blogger.posts.insert({
            blogId: process.env.BLOG_ID,
            requestBody: {
                title: topic,
                content: articleHtml,
                labels: ['Finance']
            }
        });

        console.log(`✅ Success! Published. Post ID: ${response.data.id}`);
        saveToHistory(topic);

    } catch (error) {
        console.error("❌ CRITICAL ERROR:", error.message);
        process.exit(1);
    }
}

startAutomation();
    
