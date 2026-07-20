const config = require('../../config/env.config');

const generateFeaturedImage = async (title, category) => {
    try {
        console.log(`🎨 [IMAGE AI] Generating original image for: "${title}"...`);
        
        const imagePrompt = `A professional, high-quality, editorial-style minimalist flat-lay illustration representing ${category}: ${title}. Corporate finance style, vibrant colors, vector style, no readable text, no copyrighted book covers, 16:9 aspect ratio.`;

        // Note: As of current standards, Gemini's standard REST API can access the Imagen model.
        // We use a direct standard fetch request to Google's Image API endpoint.
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${config.geminiImageKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                instances: [{ prompt: imagePrompt }],
                parameters: { sampleCount: 1 }
            })
        });

        if (!response.ok) {
            throw new Error(`Image API returned status ${response.status}`);
        }

        const data = await response.json();
        const base64Image = data.predictions[0].bytesBase64Encoded;
        
        console.log(`✅ [IMAGE AI] Image generated successfully.`);
        
        // Uploading this base64 image to Blogger is complex directly. 
        // Best approach for Blogger HTML is to embed it as base64 or upload it to an image hosting service (like Imgur/Google Drive) and get the URL.
        // For this automated pipeline, we will return the base64 string to be embedded in an <img> tag.
        
        return `data:image/jpeg;base64,${base64Image}`;

    } catch (error) {
        console.error('❌ [IMAGE AI ERROR] Failed to generate image:', error.message);
        // Return a default professional placeholder image URL in case of failure so automation doesn't stop
        return 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1000&auto=format&fit=crop';
    }
};

module.exports = {
    generateFeaturedImage
};
  
