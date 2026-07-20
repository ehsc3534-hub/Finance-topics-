const https = require('https');

async function runAutomation() {
    console.log("🚀 Starting Pipeline (REST API Mode)...");

    const apiKey = process.env.GEMINI_TEXT_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const postData = JSON.stringify({
        contents: [{ role: "user", parts: [{ text: "Write a blog post about Passive Income Strategies for Beginners in 2026. Use HTML tags." }] }]
    });

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': postData.length
        }
    };

    const req = https.request(url, options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
            const response = JSON.parse(data);
            if (response.candidates) {
                console.log("✅ Success! Content generated via REST API.");
                // এখানে blogger.posts.insert কোডটি বসিয়ে পাবলিশ করতে পারেন
            } else {
                console.error("❌ API Response Error:", data);
            }
        });
    });

    req.on('error', (e) => { console.error("❌ Request Error:", e); });
    req.write(postData);
    req.end();
}

runAutomation();
                            
