const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../../config/env.config');

const genAI = new GoogleGenerativeAI(config.geminiTextKey);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' }); // Using the Pro model for high-quality writing

const generateArticle = async (category) => {
    try {
        console.log(`🧠 [AI] Generating topic and article for ${category}...`);
        
        const prompt = `
        Act as a Professional Financial Editor for a top-tier USA Finance Media Website.
        Your task is to write a highly engaging, original, and SEO-optimized article.
        
        Category: ${category}
        
        Requirements:
        1. Target Audience: English-speaking high-value markets (USA).
        2. Tone: Professional, analytical, helpful, and natural (Human-like). No robotic phrasing.
        3. Formatting: Return ONLY valid HTML format (no markdown code blocks, no ```html wrappers).
        4. Include structural tags: <h1> for Title, <h2> for Subheadings, <p>, <ul>, <li>.
        5. Ensure there is an Introduction, Body, Key Takeaways, Conclusion, and FAQ section.
        6. Do not include introductory conversational text like "Here is your article...".
        7. The content must be unique, factually grounded, and avoid keyword stuffing.
        
        Generate the complete HTML article now.
        `;

        const result = await model.generateContent(prompt);
        let text = result.response.text();
        
        // Clean up markdown wrappers if the AI accidentally adds them
        text = text.replace(/```html/g, '').replace(/```/g, '').trim();

        return text;
    } catch (error) {
        console.error('❌ [AI ERROR] Failed to generate article:', error.message);
        throw error;
    }
};

module.exports = {
    generateArticle
};
          
