// Structured Object Generation Example
// This example shows how to generate type-safe objects using Zod schemas

'use client';

import { useState } from 'react';
import { generateObjectAction } from '@99packages/ai-sdk-integration';
import { z } from 'zod';
import type { GenerateObjectParams } from '@99packages/ai-sdk-integration';

// Define Zod schemas for different object types
const BlogPostSchema = z.object({
  title: z.string().describe('A compelling blog post title'),
  excerpt: z.string().describe('A brief excerpt or summary'),
  content: z.array(z.object({
    type: z.enum(['heading', 'paragraph', 'list']),
    content: z.string(),
  })).describe('The main content sections'),
  tags: z.array(z.string()).describe('Relevant tags for the post'),
  metadata: z.object({
    readingTime: z.number().describe('Estimated reading time in minutes'),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  }),
});

const RecipeSchema = z.object({
  name: z.string().describe('Recipe name'),
  description: z.string().describe('Brief description'),
  prepTime: z.number().describe('Preparation time in minutes'),
  cookTime: z.number().describe('Cooking time in minutes'),
  servings: z.number().describe('Number of servings'),
  ingredients: z.array(z.object({
    name: z.string(),
    amount: z.string(),
    unit: z.string().optional(),
  })).describe('List of ingredients with amounts'),
  instructions: z.array(z.string()).describe('Step-by-step cooking instructions'),
  nutritionInfo: z.object({
    calories: z.number().optional(),
    protein: z.string().optional(),
    carbs: z.string().optional(),
    fat: z.string().optional(),
  }).optional().describe('Nutritional information'),
});

const ProductAnalysisSchema = z.object({
  productName: z.string(),
  pros: z.array(z.string()).describe('Positive aspects'),
  cons: z.array(z.string()).describe('Negative aspects'),
  rating: z.number().min(1).max(5).describe('Overall rating out of 5'),
  summary: z.string().describe('Overall assessment'),
  recommendations: z.array(z.string()).describe('Specific recommendations'),
  targetAudience: z.array(z.string()).describe('Who this product is best for'),
});

// Type inference from schemas
type BlogPost = z.infer<typeof BlogPostSchema>;
type Recipe = z.infer<typeof RecipeSchema>;
type ProductAnalysis = z.infer<typeof ProductAnalysisSchema>;

interface StructuredObjectDemoProps {
  accountId: string;
}

export function StructuredObjectDemo({ accountId }: StructuredObjectDemoProps) {
  const [prompt, setPrompt] = useState('');
  const [selectedSchema, setSelectedSchema] = useState<'blog' | 'recipe' | 'analysis'>('blog');
  const [result, setResult] = useState<BlogPost | Recipe | ProductAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const schemas = {
    blog: BlogPostSchema,
    recipe: RecipeSchema,
    analysis: ProductAnalysisSchema,
  };

  const schemaDescriptions = {
    blog: 'Generate a structured blog post with title, content sections, and metadata',
    recipe: 'Create a complete recipe with ingredients, instructions, and nutrition info',
    analysis: 'Analyze a product with pros, cons, rating, and recommendations',
  };

  const examplePrompts = {
    blog: 'Write a blog post about the benefits of TypeScript for web development',
    recipe: 'Create a recipe for chocolate chip cookies that are crispy on the outside and chewy inside',
    analysis: 'Analyze the iPhone 15 Pro focusing on its camera capabilities and performance',
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const schema = schemas[selectedSchema];
      
      const params: GenerateObjectParams<typeof schema> = {
        prompt: prompt.trim(),
        schema,
        accountId,
        modelId: 'gpt-4o', // Use a capable model for structured generation
      };

      const response = await generateObjectAction(params);

      if (response.error) {
        setError(response.error);
      } else {
        setResult(response.data?.object || null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const renderBlogPost = (blogPost: BlogPost) => (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900">{blogPost.title}</h2>
      <p className="text-gray-600 italic">{blogPost.excerpt}</p>
      
      <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded">
        <div>
          <span className="font-medium">Reading Time:</span> {blogPost.metadata.readingTime} min
        </div>
        <div>
          <span className="font-medium">Difficulty:</span> {blogPost.metadata.difficulty}
        </div>
      </div>

      <div className="space-y-3">
        {blogPost.content.map((section, index) => (
          <div key={index}>
            {section.type === 'heading' && (
              <h3 className="text-xl font-semibold text-gray-800">{section.content}</h3>
            )}
            {section.type === 'paragraph' && (
              <p className="text-gray-700">{section.content}</p>
            )}
            {section.type === 'list' && (
              <ul className="list-disc list-inside text-gray-700">
                {section.content.split('\n').map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {blogPost.tags.map((tag, index) => (
          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );

  const renderRecipe = (recipe: Recipe) => (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900">{recipe.name}</h2>
      <p className="text-gray-600">{recipe.description}</p>
      
      <div className="grid grid-cols-3 gap-4 p-3 bg-gray-50 rounded">
        <div><span className="font-medium">Prep:</span> {recipe.prepTime} min</div>
        <div><span className="font-medium">Cook:</span> {recipe.cookTime} min</div>
        <div><span className="font-medium">Serves:</span> {recipe.servings}</div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Ingredients</h3>
        <ul className="space-y-1">
          {recipe.ingredients.map((ingredient, index) => (
            <li key={index} className="flex justify-between">
              <span>{ingredient.name}</span>
              <span className="text-gray-600">
                {ingredient.amount} {ingredient.unit || ''}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Instructions</h3>
        <ol className="space-y-2">
          {recipe.instructions.map((step, index) => (
            <li key={index} className="flex">
              <span className="font-medium text-blue-600 mr-2">{index + 1}.</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {recipe.nutritionInfo && (
        <div className="p-3 bg-green-50 rounded">
          <h4 className="font-medium mb-2">Nutrition (per serving)</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {recipe.nutritionInfo.calories && (
              <div>Calories: {recipe.nutritionInfo.calories}</div>
            )}
            {recipe.nutritionInfo.protein && (
              <div>Protein: {recipe.nutritionInfo.protein}</div>
            )}
            {recipe.nutritionInfo.carbs && (
              <div>Carbs: {recipe.nutritionInfo.carbs}</div>
            )}
            {recipe.nutritionInfo.fat && (
              <div>Fat: {recipe.nutritionInfo.fat}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderProductAnalysis = (analysis: ProductAnalysis) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">{analysis.productName}</h2>
        <div className="flex items-center">
          <span className="text-lg font-medium mr-2">Rating:</span>
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={`text-2xl ${
                  star <= analysis.rating ? 'text-yellow-400' : 'text-gray-300'
                }`}
              >
                ★
              </span>
            ))}
          </div>
        </div>
      </div>

      <p className="text-gray-700">{analysis.summary}</p>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-4 bg-green-50 rounded">
          <h3 className="font-semibold text-green-800 mb-2">Pros</h3>
          <ul className="space-y-1">
            {analysis.pros.map((pro, index) => (
              <li key={index} className="text-green-700">• {pro}</li>
            ))}
          </ul>
        </div>

        <div className="p-4 bg-red-50 rounded">
          <h3 className="font-semibold text-red-800 mb-2">Cons</h3>
          <ul className="space-y-1">
            {analysis.cons.map((con, index) => (
              <li key={index} className="text-red-700">• {con}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="p-4 bg-blue-50 rounded">
        <h3 className="font-semibold text-blue-800 mb-2">Recommendations</h3>
        <ul className="space-y-1">
          {analysis.recommendations.map((rec, index) => (
            <li key={index} className="text-blue-700">• {rec}</li>
          ))}
        </ul>
      </div>

      <div className="p-4 bg-purple-50 rounded">
        <h3 className="font-semibold text-purple-800 mb-2">Best For</h3>
        <div className="flex flex-wrap gap-2">
          {analysis.targetAudience.map((audience, index) => (
            <span key={index} className="px-2 py-1 bg-purple-200 text-purple-800 text-sm rounded">
              {audience}
            </span>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Structured Object Generation</h1>
      
      {/* Schema Selection */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Choose Object Type:
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(schemaDescriptions).map(([key, description]) => (
              <button
                key={key}
                onClick={() => setSelectedSchema(key as any)}
                className={`p-4 text-left border rounded-lg transition-colors ${
                  selectedSchema === key
                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium capitalize mb-1">{key}</div>
                <div className="text-sm text-gray-600">{description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Prompt Input */}
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
            Enter your prompt:
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={examplePrompts[selectedSchema]}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            disabled={isLoading}
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={isLoading || !prompt.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Generating...' : `Generate ${selectedSchema.charAt(0).toUpperCase() + selectedSchema.slice(1)}`}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">
            <strong>Error:</strong> {error}
          </p>
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Generated {selectedSchema.charAt(0).toUpperCase() + selectedSchema.slice(1)}:</h3>
          {selectedSchema === 'blog' && renderBlogPost(result as BlogPost)}
          {selectedSchema === 'recipe' && renderRecipe(result as Recipe)}
          {selectedSchema === 'analysis' && renderProductAnalysis(result as ProductAnalysis)}
        </div>
      )}

      {/* Schema Display */}
      <details className="mt-8">
        <summary className="cursor-pointer font-medium text-gray-700">
          View {selectedSchema} Schema Definition
        </summary>
        <pre className="mt-2 p-4 bg-gray-100 rounded-lg text-sm overflow-x-auto">
          {JSON.stringify(schemas[selectedSchema]._def, null, 2)}
        </pre>
      </details>
    </div>
  );
}

// Advanced usage with custom validation:
//
// const customSchema = z.object({
//   title: z.string().min(5, 'Title must be at least 5 characters'),
//   content: z.string().max(1000, 'Content must not exceed 1000 characters'),
//   tags: z.array(z.string()).min(1, 'At least one tag is required'),
// }).refine(
//   (data) => data.title.toLowerCase() !== data.content.slice(0, 50).toLowerCase(),
//   'Title should not be the same as the beginning of content'
// );
