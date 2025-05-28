
'use server';

import { OpenAI } from '@ai-sdk/openai';
import { streamText, CoreMessage, ToolInvocation, ToolResultPart, streamToResponse, LanguageModel } from 'ai';
import { createSupabaseServerClient } from '@99packages/database/supabase/server';
import { AgentRunParams, AgentRunResult, AgentTool, ActionResponse } from '../../lib/types';
import { aiAgentsSchema } from '../../lib/zod-schemas';
import {
createOrUpdateAgentSession,
storeAgentMessage,
logAiUsage
} from '../../lib/utils/supabase-helpers';
import { z } from 'zod';

const openaiProvider = new OpenAI({});

// --- Agent Management Actions ---

export async function createAgentAction(params: {
accountId: string,
name: string,
description?: string,
systemPrompt?: string,
config?: Record<string, any>
}): Promise<ActionResponse<z.infer<typeof aiAgentsSchema>>> {
const supabase = await createSupabaseServerClient();
const validation = aiAgentsSchema.pick({ account_id: true, name: true, description: true, system_prompt: true, config: true }).safeParse({
account_id: params.accountId,
name: params.name,
description: params.description,
system_prompt: params.systemPrompt,
config: params.config,
});

if (!validation.success) {
return { error: `Invalid input: ${validation.error.flatten().fieldErrors}` };
}

const { data: agent, error } = await supabase
.from('ai_agents')
.insert(validation.data)
.select()
.single();

if (error) return { error: error.message };
return { data: agent };
}

// TODO: Add getAgentAction, updateAgentAction, deleteAgentAction

// --- Agent Runtime Action ---

// Define a more specific type for the tools passed to runAgentAction
type ToolsDefinition = Record<string, AgentTool<string, z.ZodTypeAny, any>>;

const agentRunParamsSchema = z.object({
agentId: z.string().uuid(),
initialMessage: z.string().min(1),
history: z.array(z.object({ // Simplified history for validation
role: z.enum(['user', 'assistant', 'tool', 'system']),
content: z.string(),
tool_call_id: z.string().optional(),
name: z.string().optional(), // for tool role
})).optional(),
accountId: z.string().uuid(),
sessionId: z.string().uuid().optional(),
modelId: z.string().optional(), // Model for the agent
// Tools cannot be easily validated with Zod here as they include functions.
// They will be passed directly.
});

export async function runAgentAction<T extends ToolsDefinition>(
params: AgentRunParams<T>
): Promise<ActionResponse<Pick<AgentRunResult, 'stream' | 'sessionId'>>> {
const validation = agentRunParamsSchema.safeParse(params);
if (!validation.success) {
// This error won't be streamed.
throw new Error(`Invalid input for agent run: ${JSON.stringify(validation.error.flatten().fieldErrors)}`);
}

const { agentId, initialMessage, history = [], accountId, sessionId: inputSessionId, modelId, tools } = params;

const supabase = await createSupabaseServerClient();

// 1. Get Agent Configuration
const { data: agentConfig, error: agentError } = await supabase
.from('ai_agents')
.select('*')
.eq('id', agentId)
.eq('account_id', accountId)
.single();

if (agentError || !agentConfig) {
throw new Error(agentError?.message || 'Agent not found or access denied.');
}

// 2. Ensure Session (Create or Continue)
let currentSessionId = inputSessionId;
if (!currentSessionId) {
const newSession = await createOrUpdateAgentSession(supabase, {
account_id: accountId,
agent_id: agentId,
// user_id: TODO - get current user
});
if (!newSession) throw new Error('Failed to create agent session.');
currentSessionId = newSession.id;
} else {
// Verify existing session belongs to account and agent (optional, RLS should handle)
await createOrUpdateAgentSession(supabase, { id: currentSessionId, account_id: accountId, agent_id: agentId });
}

// 3. Store User's Initial Message
await storeAgentMessage(supabase, {
session_id: currentSessionId,
account_id: accountId,
role: 'user',
content: initialMessage,
});

// 4. Prepare messages for AI
const messages: CoreMessage[] = [];
if (agentConfig.system_prompt) {
messages.push({ role: 'system', content: agentConfig.system_prompt });
}
history.forEach(msg => messages.push(msg as CoreMessage)); // Cast, ensure compatibility
messages.push({ role: 'user', content: initialMessage });

const selectedModelId = modelId || agentConfig.config?.modelId || 'gpt-4o-mini'; // Prioritize params, then agent config, then default
const modelInstance: LanguageModel = openaiProvider.chat(selectedModelId);

try {
const result = await streamText({
model: modelInstance,
messages,
tools: tools as any, // Cast tools to `any` because Vercel AI SDK expects a specific structure.
// Our `AgentTool` should align with this.
onFinish: async ({ text, toolCalls, toolResults, finishReason, usage }) => {
// This callback runs on the server after the stream has finished.
// Here, we store the assistant's final response and tool interactions.
const assistantResponseContent = text || (toolCalls && toolCalls.length > 0 ? "Calling tools..." : "No text response");

```
    await storeAgentMessage(supabase, {
      session_id: currentSessionId!,
      account_id: accountId,
      role: 'assistant',
      content: assistantResponseContent,
      tool_calls: toolCalls?.map(tc => ({
        id: tc.toolCallId,
        type: 'function', // Assuming 'function' type
        function: { name: tc.toolName, arguments: JSON.stringify(tc.args) }
      })) || null,
    });

    if (toolResults && toolResults.length > 0) {
      for (const tr of toolResults) {
        await storeAgentMessage(supabase, {
          session_id: currentSessionId!,
          account_id: accountId,
          role: 'tool',
          content: JSON.stringify(tr.result), // Convert result to string
          tool_call_id: tr.toolCallId,
          name: tr.toolName,
        });
      }
    }
    
    await logAiUsage(supabase, {
      account_id: accountId,
      agent_session_id: currentSessionId,
      model_id: selectedModelId,
      action_type: 'agent_run',
      prompt_tokens: usage.promptTokens,
      completion_tokens: usage.completionTokens,
      total_tokens: usage.totalTokens,
    });
  },
});

return {
  stream: result.toAIStream(), // This is what `readStreamableValue` on the client expects
  data: { // Not typically used when streaming, but to match ActionResponse.
    sessionId: currentSessionId
  }
};
```

} catch (error: any) {
console.error("Error in runAgentAction:", error);
// Log error to session?
await storeAgentMessage(supabase, {
session_id: currentSessionId!,
account_id: accountId,
role: 'system', // Or a special error role
content: `Agent run failed: ${error.message}`,
});
throw error; // Re-throw for Server Action boundary
}
}

// --- Example Tool Definition (would be in app code using this package) ---
// const exampleTools = {
//   getCurrentWeather: {
//     name: 'getCurrentWeather',
//     description: 'Get the current weather for a location',
//     parameters: z.object({
//       location: z.string().describe('The city and state, e.g. San Francisco, CA'),
//     }),
//     execute: async ({ location }: { location: string }) => {
//       // In a real scenario, call a weather API
//       return { temperature: Math.floor(Math.random() * 30 + 5), unit: 'C', location };
//     },
//   },
//   // Add more tools
// };

// To call:
// const result = await runAgentAction({
//   agentId: 'some-agent-uuid',
//   initialMessage: 'What is the weather in Berlin?',
//   accountId: 'some-account-uuid',
//   tools: exampleTools,
// });
