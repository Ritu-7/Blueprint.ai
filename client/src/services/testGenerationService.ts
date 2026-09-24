import { env } from '@/config/env';
import { logger } from '@/lib/logger/logger';
import {
  generatedTestSuiteSchema,
  type GenerateTestsInput,
  type GeneratedTestSuite,
} from '@/validators/testGeneration';

async function callGemini(prompt: string): Promise<string> {
  const apiKey = env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_GENERATIVE_AI_API_KEY is not configured');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  if (!text) throw new Error('Gemini returned empty response for test generation');
  return text;
}

export class TestGenerationService {
  /**
   * Generates structured unit, API, or integration test suites consuming project requirements, API specs, and source code.
   */
  static async generateTestSuite(
    input: GenerateTestsInput,
    context?: { requirements?: string; apiSpecs?: string; schemaCode?: string; sourceFiles?: string }
  ): Promise<GeneratedTestSuite> {
    const { testType, coverageCategories, targetModule, customInstructions } = input;
    logger.info(`Generating ${testType} test suite for module "${targetModule || 'Core'}"`, 'testGeneration');

    const prompt = `You are a Lead QA Engineer and Test Automation Specialist.

Generate a comprehensive ${testType.toUpperCase()} test suite for the target module "${targetModule || 'Application Workspace'}".

Coverage Categories Required:
${coverageCategories.map((c) => `- ${c}`).join('\n')}

Project Context Provided:
Requirements: ${context?.requirements ? context.requirements.slice(0, 1500) : 'Standard CRUD, Auth, Database RLS, and API Endpoints'}
API Specifications: ${context?.apiSpecs ? context.apiSpecs.slice(0, 1500) : 'REST API endpoints with JWT authentication'}
Database Schema: ${context?.schemaCode ? context.schemaCode.slice(0, 1000) : 'PostgreSQL schema with Row Level Security'}
Source Code Context: ${context?.sourceFiles ? context.sourceFiles.slice(0, 2500) : 'Next.js App Router, TypeScript, Supabase, Clerk Auth'}

Custom Instructions:
${customInstructions || 'Cover happy paths, validation errors, auth failures, rate limiting, and edge cases.'}

Return ONLY a valid JSON object matching this schema:
{
  "summary": "2-3 sentence overview of generated test suite coverage",
  "testType": "${testType}",
  "totalCases": 7,
  "estimatedCoverage": 95,
  "testFramework": "${testType === 'api' ? 'Jest + Supertest' : testType === 'integration' ? 'Vitest + Playwright' : 'Jest + React Testing Library'}",
  "testCases": [
    {
      "id": "tc-1",
      "title": "Descriptive test case title",
      "testType": "${testType}",
      "category": "Happy Path|Validation|Authentication|Authorization|Edge Cases|Failures|Security",
      "scenario": "Detailed test scenario description",
      "expectedResult": "Expected assertion summary",
      "targetFile": "src/services/example.ts",
      "testCode": "describe('...', () => { it('...', async () => { ... }); });",
      "status": "pending",
      "duration": "0.4s"
    }
  ],
  "suiteCode": "// Full runnable test suite code file containing all test cases combined"
}

Rules:
- Generate at least 6 distinct test cases covering all 7 requested categories (Happy Path, Validation, Authentication, Authorization, Edge Cases, Failures, Security)
- Return valid executable TypeScript test code in testCode and suiteCode
- Do NOT output markdown fences around the JSON`;

    const text = await callGemini(prompt);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Failed to parse test generation JSON output');

    const parsed = JSON.parse(jsonMatch[0]);
    const validated = generatedTestSuiteSchema.parse(parsed);

    return validated;
  }
}
