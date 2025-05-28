
'use server';

import { OpenAI } from '@ai-sdk/openai'; // Or any other provider
import { streamText, generateText, CoreMessage } from 'ai';
import { createSupabaseServerClient } from '@99packages/database/supabase/server';
import { GenerateTextParams, GenerateTextResult, ActionResponse } from '../../lib/types';
import { storePrompt, storeGeneratedContent, logAiUsage } from '../../lib/utils/supabase-helpers';
import { z } from 'zod';

// Example: Define a specific model instance.
// In a real app, you might get this from config or allow dynamic model selection.
// Ensure OPENAI_API_KEY (or other provider keys) are in your environment.
// If using Vercel AI Gateway, the model string might be like `gateway('openai/gpt-4o')`
const openai = new OpenAI({
  // apiKey: process.env.OPENAI_API_KEY, // Handled by Vercel AI SDK if env var is set
  // baseURL: process.env.OPENAI_BASE_URL // if using a proxy
});
// const model = openai.chat('gpt-4o-mini'); // Example model
// const model = openai('gpt-4o-mini'); // AI SDK v3 style

const generateTextParamsSchema = z.object({
  prompt: z.string().min(1),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional(),
  accountId: z.string().uuid(),
  modelId: z.string().optional(), // e.g. 'gpt-4o-mini'
  // TODO: Add other Vercel AI SDK parameters like temperature, maxTokens, etc.
});

export async function generateTextAction(
  params: GenerateTextParams
): Promise<ActionResponse<GenerateTextResult>> {
  try {
    const validation = generateTextParamsSchema.safeParse(params);
    if (!validation.success) {
      return { error: `Invalid input: ${validation.error.flatten().fieldErrors}` };
    }
    const { prompt, history, accountId, modelId } = validation.data;

    const supabase = createSupabaseServerClient(); // Get your Supabase server client

    // 1. Store the prompt
    const storedPrompt = await storePrompt(supabase, {
      account_id: accountId,
      prompt_text: prompt,
      // user_id: TODO: get current authenticated user ID if available
    });
    if (!storedPrompt) return { error: 'Failed to store prompt.' };

    const messages: CoreMessage[] = [];
    if (history) {
      messages.push(...history);
    }
    messages.push({ role: 'user', content: prompt });

    // Choose model, fallback to a default
    const selectedModelId = modelId || 'gpt-4o-mini'; // Make this configurable
    const model = openai.chat(selectedModelId); // or openai(selectedModelId) for SDK v3

    const result = await generateText({
      model: model,
      messages: messages,
      // TODO: Add other parameters like system prompt, temperature, maxTokens
    });

    // 2. Store the generated content
    const storedContent = await storeGeneratedContent(supabase, {
      account_id: accountId,
      prompt_id: storedPrompt.id,
      content_type: 'text',
      text_content: result.text,
      model_used: selectedModelId,
      // metadata: { some_metadata: 'value' } // Add if needed
    });

    // 3. Log usage
    await logAiUsage(supabase, {
      account_id: accountId,
      content_id: storedContent?.id,
      model_id: selectedModelId,
      action_type: 'text_generation',
      prompt_tokens: result.usage.promptTokens,
      completion_tokens: result.usage.completionTokens,
      total_tokens: result.usage.totalTokens,
      // user_id: TODO: get current authenticated user ID
    });

    return {
      data: {
        text: result.text,
        contentId: storedContent?.id,
        usage: {
          promptTokens: result.usage.promptTokens,
          completionTokens: result.usage.completionTokens,
          totalTokens: result.usage.totalTokens,
        },
      }
    };

} catch (error: any) {
console.error("Error in generateTextAction:", error);
return { error: error.message || 'An unexpected error occurred during text generation.' };
}
}

export async function streamTextAction(
params: GenerateTextParams
): Promise<ActionResponse<Pick<GenerateTextResult, 'stream' | 'contentId'>>> {
// Similar to generateTextAction, but uses streamText
// Storing content and logging usage would be more complex with streams.
// Typically, you'd collect the full text on the client or via a webhook after streaming, then store.
// Or, store an initial record and update it.
// For simplicity, this example will just stream and not handle DB persistence as robustly.
// A full implementation would require careful handling of stream completion.
try {
const validation = generateTextParamsSchema.safeParse(params);
if (!validation.success) {
// This error won't be streamed, it's an initial validation fail.
// The client calling this action needs to handle this non-streamed error.
throw new Error(`Invalid input: ${ JSON.stringify(validation.error.flatten().fieldErrors) } `);
}
const { prompt, history, accountId, modelId } = validation.data;

    // TODO: Optional - Store prompt before streaming.
    // const supabase = await createSupabaseServerClient();
    // await storePrompt(supabase, { account_id: accountId, prompt_text: prompt });

    const messages: CoreMessage[] = [];
    if (history) {
      messages.push(...history);
    }
    messages.push({ role: 'user', content: prompt });

    const selectedModelId = modelId || 'gpt-4o-mini';
    const model = openai.chat(selectedModelId);

    const stream = await streamText({
      model: model,
      messages: messages,
      // onFinish: async (event) => {
      //   // This callback could be used to store the final content and log usage.
      //   // Requires access to supabase client and relevant IDs.
      //   console.log("Streaming finished:", event);
      //   // TODO: Implement database operations here or via a separate mechanism.
      //   // This `onFinish` runs on the server where the stream is generated.
      //   // const supabase = await createSupabaseServerClient(); // careful with context
      //   // await storeGeneratedContent(supabase, {...});
      //   // await logAiUsage(supabase, {...});
      // },
    });

    // IMPORTANT: The `streamText` result is a readable stream.
    // The Vercel AI SDK provides `toAIStreamResponse` (for Route Handlers) or `toDataStream`
    // When using Server Actions, you directly return the stream.
    // The client then uses `readStreamableValue` from `ai/rsc`.

    // For now, we are not saving contentId here due to stream complexity.
    // This would require a more elaborate setup to capture the full streamed text.
    return { stream: stream.toAIStream() }; // .toAIStream() is for RSC

  } catch (error: any) {
    console.error("Error in streamTextAction:", error);
    // This error will be caught by the Server Action boundary.
    // If it's an error during stream setup, it will be thrown.
    // If it's an error *within* the stream, the stream itself might contain error information
    // or terminate abruptly. The Vercel AI SDK handles some of this.
    throw error; // Re-throw to be handled by Next.js Server Action error handling
  }
}
