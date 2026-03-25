import axios from 'axios'

export const languageToJudge0Id = {
  python: 71,
  cpp: 54,
  java: 62,
  javascript: 63
}
// Verify IDs against your Judge0 instance
export async function verifyJudge0Languages(apiUrl: string) {
  const response = await axios.get(`${apiUrl}/languages`)
  return response.data
}
