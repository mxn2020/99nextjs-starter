
import { z } from 'zod';
import {
aiGeneratedContentsSchema,
aiPromptsSchema,
aiAgentsSchema,
aiAgentSessionsSchema,
aiAgentMessagesSchema,
aiUsageLogsSchema
} from './zod-schemas';

export type AIProvider = 'openai' | 'anthropic' | 'google' | 'custom'; // Add more as Vercel AI SDK supports

export interface BaseAIConfig {
modelId?: string; // e.g., 'gpt-4o', 'claude-3-opus-20240229'
// Add other common parameters like temperature, maxTokens etc.
// These will be passed to Vercel AI SDK functions.
}

// Text Generation
export interface GenerateTextParams extends BaseAIConfig {
prompt: string;
history?: { role: 'user' | 'assistant'; content: string }[];
accountId: string; // To link usage and content
}

export interface GenerateTextResult {
contentId?: string; // ID of the stored generated content
text?: string;
stream?: ReadableStream<Uint8Array>; // For streaming responses
error?: string;
usage?: {
promptTokens?: number;
completionTokens?: number;
totalTokens?: number;
};
}

// Image Generation
export interface GenerateImageParams extends BaseAIConfig {
prompt: string;
n?: number; // Number of images
size?: string; // e.g., '1024x1024'
accountId: string;
}

export interface GenerateImageResult {
contentId?: string;
imageUrls?: string[]; // URLs of the generated images
error?: string;
// Add other relevant image data if needed
}

// Object Generation
export interface GenerateObjectParams<T extends z.ZodSchema<any>> extends BaseAIConfig {
prompt: string;
schema: T;
accountId: string;
}

export interface GenerateObjectResult<TOutput> {
contentId?: string;
object?: TOutput;
stream?: ReadableStream<Uint8Array>; // For streaming objects
error?: string;
usage?: {
promptTokens?: number;
completionTokens?: number;
totalTokens?: number;
};
}

// Agent
export type AgentTool<Name extends string, ParametersSchema extends z.ZodTypeAny, Result> = {
name: Name;
description: string;
parameters: ParametersSchema;
execute: (args: z.infer<ParametersSchema>) => Promise<Result>;
};

export interface AgentRunParams<Tools extends Record<string, AgentTool<string, any, any>>> extends BaseAIConfig {
agentId: string;
initialMessage: string;
history?: { role: 'user' | 'assistant' | 'tool'; content: string; tool_call_id?: string; tool_name?: string }[];
tools?: Tools; // Tools available for this run
accountId: string;
sessionId?: string; // Optional: to continue an existing session
}

export interface AgentRunResult {
sessionId: string;
messages: { role: 'user' | 'assistant' | 'tool'; content: string; id?: string; tool_call_id?: string; tool_name?:string; tool_result?: any }[];
stream?: ReadableStream<Uint8Array>; // Vercel AI SDK `render` or `streamText` stream
error?: string;
}

// Database Types from Zod Schemas
export type AIPrompt = z.infer<typeof aiPromptsSchema>;
export type AIGeneratedContent = z.infer<typeof aiGeneratedContentsSchema>;
export type AIAgent = z.infer<typeof aiAgentsSchema>;
export type AIAgentSession = z.infer<typeof aiAgentSessionsSchema>;
export type AIAgentMessage = z.infer<typeof aiAgentMessagesSchema>;
export type AIUsageLog = z.infer<typeof aiUsageLogsSchema>;

// Generic Action Response
export interface ActionResponse<T = any> {
data?: T;
error?: string;
stream?: ReadableStream<Uint8Array>;
}
