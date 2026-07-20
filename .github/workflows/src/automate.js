const connectDB = require('./config/db.config');
const RotationState = require('./models/RotationState');
const { generateAndPublishContent } = require('./services/content/generator');
const { CATEGORIES } = require('./utils/constants');

const runAutomation = async () => {
    try {
        console.log('🚀 [SYSTEM] Starting Automation Pipeline...');
        
        // 1. Connect to Database (MongoDB Atlas)
        await connectDB();

        // 2. Fetch Rotation State
        let state = await RotationState.findOne({ id: 'main_rotation' });
        
        if (!state) {
            state = await RotationState.create({
                id: 'main_rotation',
                currentIndex: 0,
                currentCategory: CATEGORIES[0]
            });
            console.log('[SYSTEM] Created new Rotation State.');
        }

        if (state.status === 'PAUSED') {
            console.log('⏸️ [SYSTEM] Automation is currently PAUSED. Exiting.');
            process.exit(0);
        }

        const targetCategory = state.currentCategory;
        console.log(`🎯 [TARGET] Current Category: ${targetCategory}`);

        // TODO: 3. Check Trending Queue here (Phase 3-এ যুক্ত করা হবে)
        
        // 4. Content Generation & Publishing Pipeline
        console.log(`⏳ [PIPELINE] Initiating Content Generation for: ${targetCategory}...`);
        
        // Call the Generator (We will build this in Step 4)
        const result = await generateAndPublishContent(targetCategory);

        if (result.success) {
            // 5. Update Rotation State for the next run
            const nextIndex = (state.currentIndex + 1) % CATEGORIES.length;
            const nextCategory = CATEGORIES[nextIndex];

            state.currentIndex = nextIndex;
            state.currentCategory = nextCategory;
            state.lastPublishedPostId = result.postId;
            state.lastPublishDate = new Date();
            await state.save();

            console.log(`✅ [SUCCESS] Published successfully. Next Category will be: ${nextCategory}`);
        } else {
            console.error(`❌ [FAILED] Pipeline failed: ${result.error}`);
            // No state update on failure. The next run will retry this category.
            process.exit(1); 
        }

        console.log('🛑 [SYSTEM] Automation Pipeline Finished. Exiting properly.');
        process.exit(0);

    } catch (error) {
        console.error('🔥 [CRITICAL ERROR] Automation Crashed:', error);
        process.exit(1);
    }
};

// Execute the script
runAutomation();
              
