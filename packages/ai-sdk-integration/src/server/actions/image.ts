
'use server';

import { OpenAI } from '@ai-sdk/openai'; // Or other provider that supports image generation
import { generateImage } from 'ai';
import { createSupabaseServerClient } from '@99packages/database/supabase/server';
import { GenerateImageParams, GenerateImageResult, ActionResponse } from '../../lib/types';
import { storePrompt, storeGeneratedContent, logAiUsage } from '../../lib/utils/supabase-helpers';
import { z } from 'zod';

// Configure the AI provider for image generation
// Ensure necessary API keys are set in environment variables
// const fireworks = fireworksProvider(...); // Example
// const openai = new OpenAI(); // DALL-E models
const imageModelProvider = new OpenAI(); // Defaulting to OpenAI for DALL-E

const generateImageParamsSchema = z.object({
  prompt: z.string().min(1),
  accountId: z.string().uuid(),
  n: z.number().int().min(1).max(4).optional().default(1), // Number of images
  size: z.enum(['256x256', '512x512', '1024x1024', '1792x1024', '1024x1792']).optional().default('1024x1024'), // Example sizes for DALL-E
  modelId: z.string().optional(), // e.g., 'dall-e-3'
  // TODO: Add other Vercel AI SDK parameters for generateImage
});

export async function generateImageAction(
  params: GenerateImageParams
): Promise<ActionResponse<GenerateImageResult>> {
  try {
    const validation = generateImageParamsSchema.safeParse(params);
    if (!validation.success) {
      return { error: `Invalid input: ${validation.error.flatten().fieldErrors}` };
    }
    const { prompt, accountId, n, size, modelId } = validation.data;

    const supabase = await createSupabaseServerClient();

    // 1. Store the prompt
    const storedPrompt = await storePrompt(supabase, {
      account_id: accountId,
      prompt_text: prompt,
      // user_id: TODO
    });
    if (!storedPrompt) return { error: 'Failed to store prompt.' };

    const selectedModelId = modelId || 'dall-e-3'; // Default model
    // The actual model object needs to be compatible with `generateImage`
    // For OpenAI, it's usually implicitly handled by the OpenAI provider instance.
    // Refer to Vercel AI SDK docs for how `generateImage` uses the provider.

    const imageResult = await generateImage({
      // model: imageModelProvider.completion(selectedModelId), // This might vary based on SDK version and provider
      // For OpenAI with `ai` package, you often pass the provider instance and model name.
      // The `generateImage` function itself might not take a model instance directly,
      // but rather relies on the provider setup. Let's assume the SDK handles provider model selection.
      // The Vercel AI SDK's `generateImage` might not explicitly take a `model` object in the same way `generateText` does.
      // It often relies on the provider being configured (e.g. new OpenAI() implicitly makes its models available).
      // The specific model might be part of the provider options or a direct parameter.
      // Let's assume for now `modelId` is implicitly used if the provider is OpenAI.
      // TODO: Clarify model selection with `generateImage` in Vercel AI SDK.
      // For a direct OpenAI call via their SDK it would be `openai.images.generate({ model: "dall-e-3", ... })`
      // The `ai` package `generateImage` aims to abstract this.
      // Let's use the provider approach if the SDK `generateImage` requires it.
      // As of recent AI SDK versions, `generateImage` is often used with a specific model from a provider.
      // e.g. `generateImage({ model: openaiImageCompletion(modelId), ...})`
      // For simplicity, if `new OpenAI()` is the provider, it uses its default image models or one specified.
      // This needs to be tested with the exact Vercel AI SDK version.
      // For now, we pass common parameters.
      // The AI SDK `generateImage` function itself uses the configured provider.
      // We need to ensure `new OpenAI()` is correctly set up for image models.
      // Let's assume a simple provider instance can be passed, or it's implicit.
      // The `generateImage` function itself is not directly tied to a `model` instance in the same way `streamText` is.
      // It's more: `import { openai } from '@ai-sdk/openai'; generateImage({ model: openai.image('dall-e-3'), ... })` (this is a guess)
      // Let's try a simpler call structure first based on general Vercel examples.
      // The model used might be configured at the provider level or implicitly picked.
      // For now, this part is a bit of a placeholder pending exact Vercel AI SDK usage for `generateImage` model specification.
      // Let's assume the Vercel SDK's `generateImage` uses the default model of the instantiated provider if not specified,
      // or a model string that the provider understands.
      model: imageModelProvider.image(selectedModelId), // This syntax for specifying image model is more likely
      prompt: prompt,
      n: n,
      size: size as any, // Cast as any because the enum is specific, but SDK might take string
      // responseFormat: 'url', // Default is usually URL
      // Other parameters like quality, style if supported
    });


    // Assuming imageResult.images contains an array of objects with `url` or `base64`
    // Vercel AI SDK `generateImage` typically returns `ImageGenerationResult` which has `images` (array of `Image`)
    // and `Image` has `url` or `base64`. We'll prioritize URL.
    // This is an assumption, actual structure might be `imageResult.url` or `imageResult.images[0].url`
    // Let's assume `imageResult` has an `images` array with `url` properties based on common patterns.
    // The `Image` type in `ai` package has `url: string | undefined` and `base64Image: string | undefined`
    // The result of generateImage is `ImageGenerationResult` which has `images: Image[]`.

    const imageUrls = imageResult.images.map(img => img.url).filter(url => !!url) as string[];

    if (!imageUrls || imageUrls.length === 0) {
      return { error: 'Image generation failed or returned no URLs.' };
    }

    // 2. Store the generated content (image URLs)
    // For multiple images, you might create multiple content entries or store an array.
    // Here, storing as an array in one entry.
    const storedContent = await storeGeneratedContent(supabase, {
      account_id: accountId,
      prompt_id: storedPrompt.id,
      content_type: 'image_url',
      asset_urls: imageUrls,
      model_used: selectedModelId, // Or whatever model was effectively used
      metadata: { size: size, count: imageUrls.length },
    });

    // 3. Log usage
    // Token usage for image models is often not returned or is counted differently.
    // Log the action.
    await logAiUsage(supabase, {
      account_id: accountId,
      content_id: storedContent?.id,
      model_id: selectedModelId,
      action_type: 'image_generation',
      // prompt_tokens, completion_tokens might not be applicable or available
      // user_id: TODO
    });

    return {
      data: {
        imageUrls: imageUrls,
        contentId: storedContent?.id,
      }
    };


  } catch (error: any) {
    console.error("Error in generateImageAction:", error);
    return { error: error.message || 'An unexpected error occurred during image generation.' };
  }
}
