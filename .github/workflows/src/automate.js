const { google } = require('googleapis');

// 1. আপনার API Key সরাসরি বসান (অথবা env থেকে নিন)
const API_KEY = process.env.GEMINI_TEXT_API_KEY; 
const BLOG_ID = process.env.BLOG_ID;

// 2. ব্লগার কানেকশন
const oauth2Client = new google.auth.OAuth2(
    process.env.BLOGGER_CLIENT_ID,
    process.env.BLOGGER_CLIENT_SECRET
);
oauth2Client.setCredentials({ refresh_token: process.env.BLOGGER_REFRESH_TOKEN });
const blogger = google.blogger({ version: 'v3', auth: oauth2Client });

async function writeAndPublish() {
    try {
        console.log("🚀 কাজ শুরু হচ্ছে...");

        // 3. জেমিনি থেকে লেখা আনা (REST API ব্যবহার করে, কোনো লাইব্রেরি ছাড়া)
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Write an SEO-friendly blog post about 'Passive Income Strategies for Beginners in 2026'. Use HTML formatting." }] }]
            })
        });

        const data = await response.json();
        
        if (!data.candidates) {
            console.error("❌ জেমিনি থেকে লেখা আসেনি। এরর:", data);
            return;
        }

        const articleContent = data.candidates[0].content.parts[0].text;
        console.log("✅ লেখা তৈরি হয়েছে। এখন ব্লগারে পোস্ট করা হচ্ছে...");

        // 4. ব্লগারে পোস্ট করা
        const blogResponse = await blogger.posts.insert({
            blogId: BLOG_ID,
            requestBody: {
                title: "Passive Income Strategies for Beginners in 2026",
                content: articleContent
            }
        });

        console.log("✅ সফলভাবে পোস্ট হয়েছে! Post ID:", blogResponse.data.id);

    } catch (error) {
        console.error("❌ কোথায় একটা ভুল হয়েছে:", error.message);
    }
}

writeAndPublish();
