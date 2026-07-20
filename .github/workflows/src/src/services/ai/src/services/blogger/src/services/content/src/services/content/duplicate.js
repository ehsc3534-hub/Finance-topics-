const ContentHistory = require('../../models/ContentHistory');

const checkDuplicateTopic = async (category, topicTitle) => {
    try {
        console.log(`🔍 [DUPLICATE CHECK] Checking history for topic: "${topicTitle}" in ${category}`);
        
        // Find existing articles with the same category and similar text
        const existingArticles = await ContentHistory.find({
            category: category,
            $text: { $search: topicTitle } // Text index used here
        }).limit(3);

        if (existingArticles.length > 0) {
            console.log(`⚠️ [DUPLICATE FOUND] Found ${existingArticles.length} similar articles.`);
            return true; // Duplicate found
        }
        
        console.log(`✅ [NO DUPLICATE] Topic is unique and safe to process.`);
        return false; // No duplicate, safe to proceed
    } catch (error) {
        console.error('❌ [DUPLICATE CHECK ERROR]', error.message);
        // Fallback to false so the automation doesn't get completely blocked by a DB read error
        return false; 
    }
};

module.exports = {
    checkDuplicateTopic
};

