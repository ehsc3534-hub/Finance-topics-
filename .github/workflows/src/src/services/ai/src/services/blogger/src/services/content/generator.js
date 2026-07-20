const { generateArticle } = require('../ai/geminiText');
const { publishToBlogger } = require('../blogger/publisher');
const ContentHistory = require('../../models/ContentHistory');

const generateAndPublishContent = async (category) => {
    try {
        // Step 1: Generate Content using AI
        const rawHtmlContent = await generateArticle(category);
        
        // Extract Title from H1 tag (Basic extraction, we will refine this with structured JSON output later)
        const titleMatch = rawHtmlContent.match(/<h1>(.*?)<\/h1>/);
        const title = titleMatch ? titleMatch[1] : `New Article in ${category}`;

        // Step 2: Prepare Labels
        const labels = [category, 'Automated Finance'];

        // Step 3: Publish to Blogger
        const publishResult = await publishToBlogger(title, rawHtmlContent, labels);

        // Step 4: Save to Content History Database
        await ContentHistory.create({
            postId: publishResult.postId,
            title: title,
            topic: title, // Keeping it same as title for now
            category: category,
            url: publishResult.url,
            isTrendingPriority: false
        });

        console.log(`💾 [DATABASE] Content History saved for Post ID: ${publishResult.postId}`);

        return { success: true, postId: publishResult.postId };

    } catch (error) {
        console.error('❌ [PIPELINE ERROR]', error.message);
        return { success: false, error: error.message };
    }
};

module.exports = {
    generateAndPublishContent
};
          
