import axios from 'axios'

/**
 * Maps platform language names to Judge0 CE language IDs.
 * These are the standard IDs for Judge0 CE (judge0/judge0:latest).
 * Verify against your instance with GET /languages.
 */
export const JUDGE0_LANGUAGE_IDS: Record<string, number> = {
  python: 71, // Python (3.8.1)
  cpp: 54, // C++ (GCC 9.2.0)
  java: 62, // Java (OpenJDK 13.0.1)
  javascript: 63, // JavaScript (Node.js 12.14.0)
  typescript: 74, // TypeScript (3.7.4)
  go: 60, // Go (1.13.5)
  rust: 73 // Rust (1.40.0)
}

/**
 * Resolves a platform language name to a Judge0 language ID.
 * Returns the ID or undefined if the language is not supported.
 */
export function getJudge0LanguageId(language: string): number | undefined {
  return JUDGE0_LANGUAGE_IDS[language.toLowerCase()]
}

/**
 * Fetches all languages from a Judge0 instance for verification.
 */
export async function verifyJudge0Languages(apiUrl: string) {
  const response = await axios.get(`${apiUrl}/languages`)
  return response.data
}
