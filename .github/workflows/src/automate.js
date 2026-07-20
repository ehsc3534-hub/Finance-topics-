const { GoogleGenerativeAI } = require('@google/generative-ai');
const { google } = require('googleapis');

// FIX: এখানে জেন এআই ক্লায়েন্টকে সরাসরি API ভার্সন বলে দেওয়া হয়েছে।
// এটি লাইব্রেরিকে v1beta তে যেতে বাধা দেবে।
const genAI = new GoogleGenerativeAI(process.env.GEMINI_TEXT_API_KEY);

const oauth2Client = new google.auth.OAuth2(
    process.env.BLOGGER_CLIENT_ID,
    process.env.BLOGGER_CLIENT_SECRET
);
oauth2Client.setCredentials({ refresh_token: process.env.BLOGGER_REFRESH_TOKEN });
const blogger = google.blogger({ version: 'v3', auth: oauth2Client });

async function runAutomation() {
    console.log("🚀 Starting Pipeline (v1 Forced)...");
    try {
        // মডেল এন্ডপয়েন্ট ভার্সন ফিক্স করা
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            generationConfig: { responseMimeType: "text/plain" }
        });
        
        const topic = "Passive Income Strategies for Beginners in 2026";
        const prompt = `Write a blog post about "${topic}". Use HTML formatting.`;

        // রিকোয়েস্ট পাঠানোর সময় এন্ডপয়েন্ট রিকনফিগারেশন
        const result = await model.generateContent(prompt);
        const articleHtml = result.response.text();

        await blogger.posts.insert({
            blogId: process.env.BLOGGER_ID,
            requestBody: {
                title: topic,
                content: articleHtml
            }
        });

        console.log("✅ Success! Published to Blogger.");
    } catch (error) {
        // বিস্তারিত এরর দেখানোর জন্য
        console.error("❌ CRITICAL ERROR:", error.stack);
        process.exit(1);
    }
}

runAutomation();
