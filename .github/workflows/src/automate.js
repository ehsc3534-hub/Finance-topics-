const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/generative-ai');
const { google } = require('googleapis');

const HISTORY_FILE = path.join(__dirname, 'published_history.json');

// এনভায়রনমেন্ট ভেরিয়েবল চেক
if (!process.env.GEMINI_TEXT_API_KEY || !process.env.BLOG_ID) {
    console.error("❌ Missing required Environment Variables (API Keys / Blog ID).");
    process.exit(1);
}

// জেমিনি এআই ক্লায়েন্ট সেটআপ
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_TEXT_API_KEY });

// ব্লগার এপিআই ক্লায়েন্ট সেটআপ
const oauth2Client = new google.auth.OAuth2(
    process.env.BLOGGER_CLIENT_ID,
    process.env.BLOGGER_CLIENT_SECRET
);
oauth2Client.setCredentials({
    refresh_token: process.env.BLOGGER_REFRESH_TOKEN
});
const blogger = google.blogger({ version: 'v3', auth: oauth2Client });

// লোকাল হিস্ট্রি লোড করার ফাংশন
function loadHistory() {
    if (!fs.existsSync(HISTORY_FILE)) {
        fs.writeFileSync(HISTORY_FILE, JSON.stringify([]));
        return [];
    }
    try {
        return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    } catch (e) {
        return [];
    }
}

// হিস্ট্রিতে সেভ করার ফাংশন
function saveToHistory(title) {
    const history = loadHistory();
    history.push({ title, publishedAt: new Date().toISOString() });
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
}

// আজকের ফাইন্যান্স টপিক নির্ধারণ (টপিক রোটেশন)
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
    // এমন একটি টপিক বেছে নেওয়া যা আগে পোস্ট হয়নি
    const availableTopics = topics.filter(t => !history.some(h => h.title === t));
    return availableTopics.length > 0 ? availableTopics[0] : topics[Math.floor(Math.random() * topics.length)];
}

async function startAutomation() {
    console.log("🚀 Starting Content Automation Pipeline...");
    
    try {
        const topic = getRandomFinanceTopic();
        console.log(`🎯 Target Topic Selected: ${topic}`);

        // ১. জেমিনি এআই দিয়ে এসইও ফ্রেন্ডলি কন্টেন্ট তৈরি
        console.log("🤖 Generating High-Quality Article using Gemini API...");
        const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const prompt = `Write a professional, SEO-optimized, engaging financial blog post about "${topic}". 
        Include an eye-catching title, structured headings (H2, H3), and clear paragraphs. 
        Format the entire output directly in clean HTML format (do not include markdown code blocks like \`\`\`html).`;

        const result = await model.generateContent(prompt);
        const articleHtml = result.response.text();

        if (!articleHtml) {
            throw new Error("Gemini API returned empty content.");
        }

        // ২. ব্লগার এপিআই দিয়ে ব্লগে পোস্ট পাবলিশ করা
        console.log("📝 Publishing article to Blogger...");
        const response = await blogger.posts.insert({
            blogId: process.env.BLOG_ID,
            requestBody: {
                title: topic,
                content: articleHtml,
                labels: ['Finance', 'Investment', 'Wealth Building']
            }
        });

        if (response.data && response.data.id) {
            console.log(`✅ Success! Post published live. Post ID: ${response.data.id}`);
            saveToHistory(topic);
        } else {
            throw new Error("Failed to get post ID from Blogger response.");
        }

    } catch (error) {
        console.error("❌ Automation Stopped Due to Error:", error.message);
        process.exit(1);
    }
}

startAutomation();
        
