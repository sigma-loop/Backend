/**
 * Supported programming languages for code challenges and execution.
 */

export const SUPPORTED_LANGUAGES = [
  'python',
  'cpp',
  'java',
  'javascript',
  'typescript',
  'go',
  'rust'
] as const

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

export const LANGUAGE_DISPLAY_NAMES: Record<SupportedLanguage, string> = {
  python: 'Python',
  cpp: 'C++',
  java: 'Java',
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  go: 'Go',
  rust: 'Rust'
}

export const LANGUAGE_FILE_EXTENSIONS: Record<SupportedLanguage, string> = {
  python: '.py',
  cpp: '.cpp',
  java: '.java',
  javascript: '.js',
  typescript: '.ts',
  go: '.go',
  rust: '.rs'
}

/**
 * Monaco Editor language identifiers (used by Frontend)
 */
export const LANGUAGE_MONACO_IDS: Record<SupportedLanguage, string> = {
  python: 'python',
  cpp: 'cpp',
  java: 'java',
  javascript: 'javascript',
  typescript: 'typescript',
  go: 'go',
  rust: 'rust'
}
