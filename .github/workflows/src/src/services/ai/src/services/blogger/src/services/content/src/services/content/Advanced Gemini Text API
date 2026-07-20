const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../../config/env.config');

const genAI = new GoogleGenerativeAI(config.geminiTextKey);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

const generateArticleAndSEO = async (category) => {
    try {
        console.log(`🧠 [AI] Generating Advanced SEO Content for ${category}...`);
        
        const prompt = `
        Act as a Professional Financial Editor for a top-tier USA Finance Media Website.
        Create an original, engaging, and highly informative article for the category: "${category}".
        
        Guidelines:
        1. Target Audience: USA English-speaking high-value market.
        2. Format: Return ONLY a valid JSON object. Do NOT include markdown blocks like \`\`\`json.
        3. HTML formatting inside the JSON must be clean (H2, H3, P, UL, LI, FAQ section).
        4. E-E-A-T: Include a short financial disclaimer at the end of the HTML.
        
        You must return the data strictly in this JSON format:
        {
            "title": "SEO optimized Catchy Title (Max 60 chars)",
            "metaDescription": "SEO meta description (Max 160 chars)",
            "slug": "seo-friendly-url-slug",
            "keywords": ["keyword1", "keyword2", "keyword3"],
            "labels": ["${category}", "Finance", "Label3"],
            "htmlContent": "<div>Complete HTML article here starting with introduction...</div>"
        }
        `;

        const result = await model.generateContent(prompt);
        let rawResponse = result.response.text();
        
        // Clean up possible markdown code wrappers before parsing JSON
        rawResponse = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        
        const contentData = JSON.parse(rawResponse);
        return contentData;

    } catch (error) {
        console.error('❌ [AI ERROR] Failed to generate structured article:', error.message);
        throw error;
    }
};

module.exports = {
    generateArticleAndSEO
};
