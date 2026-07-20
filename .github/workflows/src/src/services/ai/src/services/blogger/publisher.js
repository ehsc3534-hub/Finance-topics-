const { google } = require('googleapis');
const config = require('../../config/env.config');

const oauth2Client = new google.auth.OAuth2(
    config.bloggerClientId,
    config.bloggerClientSecret
);

// Set offline refresh token
oauth2Client.setCredentials({
    refresh_token: config.bloggerRefreshToken
});

const blogger = google.blogger({
    version: 'v3',
    auth: oauth2Client
});

const publishToBlogger = async (title, htmlContent, labels) => {
    try {
        console.log('🌐 [BLOGGER] Attempting to publish post...');
        
        const response = await blogger.posts.insert({
            blogId: config.blogId,
            isDraft: false, // Set to true if you want to review before going live
            requestBody: {
                title: title,
                content: htmlContent,
                labels: labels // Array of strings e.g., ["Finance News", "Investing"]
            }
        });

        console.log(`✅ [BLOGGER] Post published! URL: ${response.data.url}`);
        return {
            success: true,
            postId: response.data.id,
            url: response.data.url
        };
    } catch (error) {
        console.error('❌ [BLOGGER ERROR] Failed to publish post:', error.message);
        throw error;
    }
};

module.exports = {
    publishToBlogger
};
