// ১. প্রয়োজনীয় লাইব্রেরি
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { google } = require('googleapis');

// ২. এপিআই কী কনফিগারেশন (আপনার সিক্রেট কি'টি এখানে সরাসরি বসানোর চেয়ে env থেকে লোড করাই ভালো)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_TEXT_API_KEY);

// ৩. ব্লগার অথেন্টিকেশন
const oauth2Client = new google.auth.OAuth2(
    process.env.BLOGGER_CLIENT_ID,
    process.env.BLOGGER_CLIENT_SECRET
);
oauth2Client.setCredentials({ refresh_token: process.env.BLOGGER_REFRESH_TOKEN });
const blogger = google.blogger({ version: 'v3', auth: oauth2Client });

async function runAutomation() {
    try {
        console.log("🚀 Pipeline started...");

        // ৪. মডেল ইনিশিয়ালাইজেশন (সরাসরি v1 এ কল করবে)
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const topic = "Passive Income Strategies for Beginners in 2026";
        const prompt = `Write an SEO-friendly blog post about "${topic}". Use H2, H3 tags. Do not use Markdown.`;

        // ৫. জেনারেশন
        const result = await model.generateContent(prompt);
        const content = result.response.text();

        // ৬. পাবলিশিং
        await blogger.posts.insert({
            blogId: process.env.BLOG_ID,
            requestBody: {
                title: topic,
                content: content
            }
        });

        console.log("✅ Success: Content published to Blogger.");
    } catch (error) {
        // এরর হলে পরিষ্কারভাবে দেখাবে
        console.error("❌ CRITICAL ERROR:", error.message);
        process.exit(1);
    }
}

runAutomation();
