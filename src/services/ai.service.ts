import { GoogleGenerativeAI, Content } from '@google/generative-ai'
import config from '../config'

// ──────────────────────────────────────────
// Types
// ──────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'model'
  content: string
}

export interface GeneratedChallengeData {
  title: string
  starterCodes: Record<string, string>
  solutionCodes: Record<string, string>
  testCases: Array<{ input: string; expectedOutput: string; isHidden: boolean }>
}

export interface GeneratedLessonData {
  title: string
  contentMarkdown: string
  challenges: GeneratedChallengeData[]
}

export interface GeneratedCourseData {
  title: string
  description: string
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  tags: string[]
  lessons: GeneratedLessonData[]
}

// ──────────────────────────────────────────
// Gemini Client (lazy-initialized)
// ──────────────────────────────────────────

let genAI: GoogleGenerativeAI | null = null

function getClient(): GoogleGenerativeAI {
  if (!genAI) {
    if (!config.ai.geminiApiKey) {
      throw new Error('GEMINI_API_KEY is not configured')
    }
    genAI = new GoogleGenerativeAI(config.ai.geminiApiKey)
  }
  return genAI
}

function isConfigured(): boolean {
  return !!config.ai.geminiApiKey
}

function parseJSON<T>(text: string): T {
  try {
    return JSON.parse(text) as T
  } catch (firstErr) {
    console.error(
      '[AI Service] JSON parse failed, raw response (first 2000 chars):',
      text.substring(0, 2000)
    )
    console.error('[AI Service] JSON parse error:', (firstErr as Error).message)

    // Try to extract JSON from markdown fences
    const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)```/)
    if (fenceMatch) {
      try {
        return JSON.parse(fenceMatch[1].trim()) as T
      } catch {
        // fall through
      }
    }

    throw new Error(`AI returned invalid JSON: ${(firstErr as Error).message}`)
  }
}

function wrapError(err: unknown): never {
  const message = err instanceof Error ? err.message : String(err)
  const stack = err instanceof Error ? err.stack : undefined
  console.error('[AI Service Error]', message)
  if (stack) console.error('[AI Service Stack]', stack)
  if ((err as any)?.errorDetails) {
    console.error('[AI Service Details]', JSON.stringify((err as any).errorDetails, null, 2))
  }
  if (message.includes('429') || message.includes('quota')) {
    throw new Error('AI rate limit exceeded. Please wait a moment and try again.')
  }
  if (message.includes('403') || message.includes('API_KEY_INVALID')) {
    throw new Error('AI API key is invalid. Please check your GEMINI_API_KEY configuration.')
  }
  throw new Error(`AI service error: ${message}`)
}

// ──────────────────────────────────────────
// Shared prompt fragments
// ──────────────────────────────────────────

const PLATFORM_CONTEXT = `You are generating content for SigmaLoop, an educational coding platform. Your output is parsed directly into the database and rendered in the UI. Follow every formatting rule exactly — malformed output breaks the platform.

CRITICAL: Every lesson MUST include at least one challenge. Challenges are separate coding exercises that students write, run, and submit code for. They are NOT inline code examples in the markdown — they are stored separately and rendered in a code editor with stdin/stdout testing. The lesson markdown teaches the concept; the challenge tests it.`

const MARKDOWN_RULES = `## Markdown (contentMarkdown) rules
- Use GitHub-flavored Markdown (GFM).
- The renderer supports: headings (#-######), bold, italic, lists, tables, links, blockquotes, horizontal rules.
- Math: inline $x^2$ and display $$\\sum_{i=1}^{n} i$$ (KaTeX).
- Code blocks: ALWAYS use triple-backtick fences with a language identifier. Supported identifiers: python, cpp, java, javascript, typescript, go, rust, sql, bash, json, html, css.
  Example:
  \`\`\`python
  def hello():
      print("hi")
  \`\`\`
- Inline code: \`variableName\` with single backticks.
- Structure every lesson as: a short intro paragraph → concept explanation with examples → summary/key takeaways.
- Use ## for main sections and ### for subsections. Do NOT use # (h1) — the lesson title is already shown as h1 in the UI.
- Minimum 500 words per lesson. Be comprehensive and educational.`

const CHALLENGE_RULES = `## Challenge rules
- Each challenge tests ONE concept from the lesson.
- starterCodes / solutionCodes keys MUST be from this exact set: "python", "cpp", "java", "javascript", "typescript", "go", "rust". No other keys. Provide at LEAST "python" and "javascript".
- Starter code: provide a function signature with a docstring/comment explaining what to implement and a TODO. The function MUST read from stdin and print to stdout. Example pattern:

  For Python:
    # Read input
    n = int(input())
    # TODO: implement logic
    # Print result
    print(result)

  For JavaScript:
    const readline = require('readline');
    const rl = readline.createInterface({ input: process.stdin });
    const lines = [];
    rl.on('line', l => lines.push(l));
    rl.on('close', () => {
      // TODO: implement logic
      console.log(result);
    });

- Solution code: the complete working version of the starter code. It MUST produce the exact expectedOutput when given the input via stdin.
- The solution code must be self-contained — no imports beyond standard library.

## Test case rules
- "input" is fed as stdin to the program. "expectedOutput" is compared against stdout. Both MUST be strings.
- Newline-sensitive: if the program prints "5\\n", expectedOutput must be "5\\n" (with trailing newline). Always end expectedOutput with \\n.
- 3-5 test cases per challenge. At least 1 must have "isHidden": true (used for grading only — students can't see it).
- Test cases must cover: a simple/base case, a normal case, and an edge case.
- Input and output must be plain text — no JSON objects, no formatted structures. One value per line if multiple values.`

const JSON_STRICTNESS = `## JSON output rules
- Return ONLY a valid JSON object. No markdown fences, no commentary, no text before/after.
- All string values must be properly escaped (newlines as \\n, quotes as \\", backslashes as \\\\).
- Do NOT use trailing commas.
- Do NOT use single quotes — JSON requires double quotes only.`

// ──────────────────────────────────────────
// Chat Response
// ──────────────────────────────────────────

async function generateChatResponse(
  systemPrompt: string,
  history: ChatMessage[],
  userMessage: string
): Promise<string> {
  const client = getClient()
  const model = client.getGenerativeModel({
    model: config.ai.model,
    systemInstruction: systemPrompt
  })

  const geminiHistory: Content[] = history.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.content }]
  }))

  try {
    const chat = model.startChat({ history: geminiHistory })
    const result = await chat.sendMessage(userMessage)
    return result.response.text()
  } catch (err) {
    wrapError(err)
  }
}

// ──────────────────────────────────────────
// Lesson Generation
// ──────────────────────────────────────────

async function generateLessonContent(
  courseTitle: string,
  courseDescription: string,
  existingLessonTitles: string[],
  difficulty: string,
  userPrompt?: string
): Promise<GeneratedLessonData> {
  const client = getClient()
  const model = client.getGenerativeModel({
    model: config.ai.model,
    generationConfig: {
      maxOutputTokens: config.ai.maxTokens,
      responseMimeType: 'application/json'
    }
  })

  const userRequest = userPrompt
    ? `\n**The student specifically wants to learn about:** ${userPrompt}\nFocus the lesson on their request while keeping it relevant to the course.`
    : 'The lesson should logically continue from the existing lessons.'

  const prompt = `${PLATFORM_CONTEXT}

Generate ONE lesson for an existing course.

**Course:** ${courseTitle}
**Description:** ${courseDescription}
**Difficulty:** ${difficulty}
**Existing lessons (in order):**
${existingLessonTitles.length > 0 ? existingLessonTitles.map((t, i) => `${i + 1}. ${t}`).join('\n') : '(none yet)'}

${userRequest}

${MARKDOWN_RULES}

${CHALLENGE_RULES}

${JSON_STRICTNESS}

Return a JSON object with this exact schema:
{
  "title": "string — concise lesson title, no numbering prefix",
  "contentMarkdown": "string — full lesson in Markdown (see rules above)",
  "challenges": [
    {
      "title": "string — short challenge name",
      "starterCodes": { "python": "string", "javascript": "string" },
      "solutionCodes": { "python": "string", "javascript": "string" },
      "testCases": [
        { "input": "string (stdin)", "expectedOutput": "string (stdout, must end with \\n)", "isHidden": false }
      ]
    }
  ]
}

Generate 1-2 challenges. Go.`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    return parseJSON<GeneratedLessonData>(text)
  } catch (err) {
    wrapError(err)
  }
}

// ──────────────────────────────────────────
// Course Generation
// ──────────────────────────────────────────

async function generateCourseContent(
  userPrompt: string,
  preferredDifficulty?: string
): Promise<GeneratedCourseData> {
  const client = getClient()
  const model = client.getGenerativeModel({
    model: config.ai.model,
    generationConfig: {
      maxOutputTokens: config.ai.maxTokens,
      responseMimeType: 'application/json'
    }
  })

  const prompt = `${PLATFORM_CONTEXT}

Create a complete programming course based on the student's request.

**Student's request:** ${userPrompt}
${preferredDifficulty ? `**Preferred difficulty:** ${preferredDifficulty}` : 'Choose the appropriate difficulty based on the topic.'}

${MARKDOWN_RULES}

${CHALLENGE_RULES}

${JSON_STRICTNESS}

Return a JSON object with this exact schema:
{
  "title": "string — course title, concise and descriptive",
  "description": "string — 2-3 sentence course description",
  "difficulty": "BEGINNER" or "INTERMEDIATE" or "ADVANCED" (must be one of these exact strings),
  "tags": ["string", "string", "string"] (3-5 lowercase tags, e.g. "python", "algorithms", "web-dev"),
  "lessons": [
    {
      "title": "string — lesson title, no numbering prefix",
      "contentMarkdown": "string — full lesson content in Markdown (see rules above)",
      "challenges": [
        {
          "title": "string — short challenge name",
          "starterCodes": { "python": "string", "javascript": "string" },
          "solutionCodes": { "python": "string", "javascript": "string" },
          "testCases": [
            { "input": "string (stdin)", "expectedOutput": "string (stdout, must end with \\n)", "isHidden": false }
          ]
        }
      ]
    }
  ]
}

Generate 3-5 lessons that build progressively. Each lesson has 1-2 challenges. Go.`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    return parseJSON<GeneratedCourseData>(text)
  } catch (err) {
    wrapError(err)
  }
}

// ──────────────────────────────────────────
// Exports
// ──────────────────────────────────────────

export const aiService = {
  isConfigured,
  generateChatResponse,
  generateLessonContent,
  generateCourseContent
}
