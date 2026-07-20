const Parser = require('rss-parser');
const TrendingTopic = require('../../models/TrendingTopic');
const { PRIORITY_LEVELS } = require('../../utils/constants');

const parser = new Parser();

// High-value financial news sources RSS Feeds
const FEEDS = [
    'https://search.cnbc.com/rs/search/view.xml?partnerId=2000&keywords=finance',
    'https://www.reutersagency.com/feed/?best-topics=business-finance',
    'https://www.yahoo.com/news/rss/finance'
];

const scanTrendingTopics = async () => {
    try {
        console.log('🕵️‍♂️ [TREND DETECTOR] Scanning international financial markets...');
        let detectedCount = 0;

        for (const url of FEEDS) {
            const feed = await parser.parseURL(url);
            
            for (const item of feed.items.slice(0, 5)) { // Check top 5 latest items per feed
                const titleLower = item.title.toLowerCase();
                
                // Keywords that signify a breaking macroeconomic or high-value finance event
                const isHighPriority = [
                    'fed', 'interest rate', 'inflation', 'cpi', 'market crash', 
                    'sec regulation', 'banking crisis', 'federal reserve'
                ].some(keyword => titleLower.includes(keyword));

                // Check if this topic already exists in our database
                const existing = await TrendingTopic.findOne({ topic: item.title });
                
                if (!existing) {
                    await TrendingTopic.create({
                        topic: item.title,
                        priority: isHighPriority ? PRIORITY_LEVELS.HIGH : PRIORITY_LEVELS.MEDIUM,
                        sourceInfo: item.link,
                        status: 'PENDING'
                    });
                    detectedCount++;
                }
            }
        }

        console.log(`✅ [TREND DETECTOR] Scan complete. Added ${detectedCount} new potential trend(s).`);
    } catch (error) {
        console.error('❌ [TREND DETECTOR ERROR] Failed to parse trends:', error.message);
    }
};

module.exports = {
    scanTrendingTopics
};
                  
