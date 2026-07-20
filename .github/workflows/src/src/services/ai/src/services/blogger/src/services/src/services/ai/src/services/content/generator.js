const { generateArticleAndSEO } = require('../ai/geminiText');
const { generateFeaturedImage } = require('../ai/geminiImage');
const { publishToBlogger } = require('../blogger/publisher');
const { checkDuplicateTopic } = require('./duplicate');
const ContentHistory = require('../../models/ContentHistory');

const generateAndPublishContent = async (category) => {
    try {
        console.log(`🚀 [PIPELINE] Starting advanced generation pipeline for: ${category}`);

        // Step 1: Generate Structured Content & SEO
        const articleData = await generateArticleAndSEO(category);
        
        // Step 2: Check Duplicate
        const isDuplicate = await checkDuplicateTopic(category, articleData.title);
        if (isDuplicate) {
            console.log(`🔄 [PIPELINE] Duplicate detected. Aborting this run to maintain quality.`);
            return { success: false, error: 'Duplicate content detected' };
        }

        // Step 3: Generate Featured Image
        const imageUrl = await generateFeaturedImage(articleData.title, category);

        // Step 4: Finalize HTML with Image, Meta Data, and Schema
        const finalHtml = `
            <!-- SEO Metadata -->
            <meta name="description" content="${articleData.metaDescription}">
            <meta name="keywords" content="${articleData.keywords.join(', ')}">
            
            <!-- Featured Image -->
            <div class="featured-image-container" style="text-align: center; margin-bottom: 20px;">
                <img src="${imageUrl}" alt="${articleData.title}" title="${articleData.title}" style="max-width: 100%; height: auto; border-radius: 8px;">
            </div>
            
            <!-- Article Body -->
            <div class="article-body">
                ${articleData.htmlContent}
            </div>
            
            <!-- Structured Data (JSON-LD) for Google Search Readiness -->
            <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Article",
              "headline": "${articleData.title}",
              "description": "${articleData.metaDescription}",
              "image": "${imageUrl}",
              "author": {
                "@type": "Organization",
                "name": "Finance Media Editorial Team"
              },
              "publisher": {
                "@type": "Organization",
                "name": "Automated Finance Media"
              }
            }
            </script>
        `;

        // Step 5: Publish to Blogger
        const publishResult = await publishToBlogger(articleData.title, finalHtml, articleData.labels);

        // Step 6: Save to Content History
        await ContentHistory.create({
            postId: publishResult.postId,
            title: articleData.title,
            topic: articleData.title, 
            category: category,
            primaryKeyword: articleData.keywords[0] || category,
            url: publishResult.url,
            isTrendingPriority: false
        });

        console.log(`💾 [DATABASE] Pipeline completed successfully for Post ID: ${publishResult.postId}`);

        return { success: true, postId: publishResult.postId };

    } catch (error) {
        console.error('❌ [PIPELINE ERROR]', error.message);
        return { success: false, error: error.message };
    }
};

module.exports = {
    generateAndPublishContent
};
          
