const connectDB = require('./config/db.config');
const RotationState = require('./models/RotationState');
const TrendingTopic = require('./models/TrendingTopic');
const { scanTrendingTopics } = require('./services/trend/detector');
const { generateAndPublishContent } = require('./services/content/generator');
const { CATEGORIES } = require('./utils/constants');

const runAutomationPipeline = async () => {
    try {
        console.log('🚀 [PIPELINE START] Init Serverless Cloud Automation Engine...');
        
        // 1. Database Connection
        await connectDB();

        // 2. Scan for Trends first to always keep the pipeline data-fresh
        await scanTrendingTopics();

        // 3. Evaluate Priority Queue (Check for High/Medium Pending Trends)
        const activeTrend = await TrendingTopic.findOne({ status: 'PENDING' })
            .sort({ priority: 1, detectedAt: -1 }); // High priority, then latest

        let targetCategory;
        let isTrendExecution = false;

        if (activeTrend) {
            console.log(`🔥 [PRIORITY HIT] Intercepting Normal Rotation for Trending Topic: "${activeTrend.topic}"`);
            targetCategory = `Finance News (Trending: ${activeTrend.priority})`;
            activeTrend.status = 'PROCESSING';
            await activeTrend.save();
            isTrendExecution = true;
        } else {
            // No trend, fall back to normal category rotation
            let state = await RotationState.findOne({ id: 'main_rotation' });
            if (!state) {
                state = await RotationState.create({ id: 'main_rotation', currentIndex: 0, currentCategory: CATEGORIES[0] });
            }

            if (state.status === 'PAUSED') {
                console.log('⏸️ [SYSTEM] Normal rotation is PAUSED. Exiting cleanly.');
                process.exit(0);
            }

            targetCategory = state.currentCategory;
            console.log(`🔄 [NORMAL ROTATION] Target Selected Category: ${targetCategory}`);
        }

        // 4. Fire Content Engine Execution Block
        const result = await generateAndPublishContent(targetCategory);

        if (result.success) {
            if (isTrendExecution) {
                // Mark trend as published
                activeTrend.status = 'PUBLISHED';
                activeTrend.publishedPostId = result.postId;
                await activeTrend.save();
                console.log('✅ [PRIORITY SUCCESS] Trending content executed. Normal rotation untouched.');
            } else {
                // If normal rotation succeeded, update state pointers to the next sequential index
                let state = await RotationState.findOne({ id: 'main_rotation' });
                const nextIndex = (state.currentIndex + 1) % CATEGORIES.length;
                
                state.currentIndex = nextIndex;
                state.currentCategory = CATEGORIES[nextIndex];
                state.lastPublishedPostId = result.postId;
                state.lastPublishDate = new Date();
                await state.save();
                
                console.log(`✅ [ROTATION SUCCESS] Pointer moved forward to index: ${nextIndex} (${CATEGORIES[nextIndex]})`);
            }
        } else {
            console.error(`❌ [PIPELINE ERROR-GATE] Execution failed: ${result.error}`);
            
            // Revert trend status if it failed during execution
            if (isTrendExecution) {
                activeTrend.status = 'PENDING';
                await activeTrend.save();
            }
            process.exit(1); // Signalling Github Actions that this job failed for tracking logs
        }

        console.log('🛑 [PIPELINE END] System execution completed successfully. Thread closed.');
        process.exit(0);

    } catch (error) {
        console.error('🔥 [CRITICAL PIPELINE FATAL ERROR]', error);
        process.exit(1);
    }
};

runAutomationPipeline();
          
