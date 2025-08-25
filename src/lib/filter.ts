const bannedWords = [
  'racist',
  'hate',
  'harass',
  'abuse',
  'threat',
  'kill',
  'die',
  'suicide',
  'self-harm'
]

export function filterMessage(message: string): boolean {
  const lowerMessage = message.toLowerCase()
  
  for (const word of bannedWords) {
    if (lowerMessage.includes(word)) {
      return false
    }
  }
  
  return true
}
