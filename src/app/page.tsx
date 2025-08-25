'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { UserService } from '@/lib/user'
import { MatchmakingService } from '@/lib/matchmaking'
import { ChatBox } from '@/components/ChatBox'
import { FindingScreen } from '@/components/FindingScreen'
import { User, ChatWithUsers } from '@/lib/types'

export default function Home() {
  const [showUsernameModal, setShowUsernameModal] = useState(false)
  const [username, setUsername] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [matchmakingState, setMatchmakingState] = useState<'idle' | 'finding' | 'chatting'>('idle')
  const [currentChat, setCurrentChat] = useState<ChatWithUsers | null>(null)

  const handleStartChatting = () => {
    setShowUsernameModal(true)
  }

  const handleUsernameSubmit = async () => {
    if (!username.trim()) return

    setIsLoading(true)
    try {
      const user = await UserService.createUser(username.trim())
      if (user) {
        setCurrentUser(user)
        setMatchmakingState('finding')
        setShowUsernameModal(false)
        setUsername('')

        await findMatch(user.id)
      }
    } catch (error) {
      console.error('Error creating user:', error)
      alert('Failed to create user. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const findMatch = async (userId: string, retryCount: number = 0): Promise<ChatWithUsers | null> => {
    try {
      const chat = await MatchmakingService.findMatch(userId, retryCount)
      if (chat) {
        setCurrentChat(chat)
        setMatchmakingState('chatting')
        return chat
      }
      return null
    } catch (error) {
      console.error('Error finding match:', error)
      return null
    }
  }

  const handleNext = async () => {
    if (!currentUser) return

    try {
      setCurrentChat(null)
      setMatchmakingState('finding')

      await MatchmakingService.handleNext(currentUser.id)

      await new Promise(resolve => setTimeout(resolve, 500))

      const newMatch = await findMatch(currentUser.id, 0)

      if (newMatch) {
        setCurrentChat(newMatch)
        setMatchmakingState('chatting')
      } else {
        setMatchmakingState('finding')
      }
    } catch (error) {
      console.error('Error handling next:', error)
      setMatchmakingState('finding')
      if (currentUser) {
        findMatch(currentUser.id, 0)
      }
    }
  }

  const handleLeave = async () => {
    if (!currentUser) return

    try {
      await MatchmakingService.handleLeave(currentUser.id)
      setCurrentUser(null)
      setMatchmakingState('idle')
      setCurrentChat(null)
    } catch (error) {
      console.error('Error handling leave:', error)
    }
  }

  const handleChatUpdate = (chat: ChatWithUsers) => {
    if (Object.keys(chat).length === 0) {
      setMatchmakingState('finding')
      setCurrentChat(null)
      if (currentUser) {
        findMatch(currentUser.id, 0)
      }
    } else {
      setCurrentChat(chat)
    }
  }

  const handleUnload = () => {
    if (currentUser) {
      MatchmakingService.cleanupUser(currentUser.id)
    }
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', handleUnload)
  }

  if (matchmakingState === 'chatting' && currentChat && currentUser) {
    return (
      <ChatBox
        chat={currentChat}
        currentUser={currentUser}
        onNext={handleNext}
        onLeave={handleLeave}
        onChatUpdate={handleChatUpdate}
      />
    )
  }

  if (matchmakingState === 'finding' && currentUser) {
    return (
      <FindingScreen
        username={currentUser.username}
        onNext={handleNext}
        onLeave={handleLeave}
        currentUserId={currentUser.id}
        onStatusChange={async () => {
          try {
            const currentChat = await MatchmakingService.getCurrentChat(currentUser.id)
            if (currentChat && currentChat.users.length === 2) {
              setCurrentChat(currentChat)
              setMatchmakingState('chatting')
            }
          } catch (error) {
            console.error('Error checking status change:', error)
          }
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-orange-200/30 to-amber-300/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-red-200/30 to-orange-300/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-yellow-200/20 to-orange-300/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-2xl mx-auto text-center">
        <div className="mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl mb-6 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-orange-800 via-red-800 to-amber-800 bg-clip-text text-transparent mb-4">
            TalkShuffle
          </h1>

          <p className="text-xl md:text-2xl text-orange-700 mb-8 max-w-2xl mx-auto leading-relaxed">
            Connect with random people around the world through meaningful conversations
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              onClick={handleStartChatting}
              size="lg"
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border-0"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Start Chatting
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center mb-4 mx-auto">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-orange-800 mb-2">Random Matching</h3>
            <p className="text-orange-600 text-sm">Get paired with new people every time you chat</p>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center mb-4 mx-auto">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-orange-800 mb-2">Instant Connection</h3>
            <p className="text-orange-600 text-sm">Start chatting immediately with no waiting time</p>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center mb-4 mx-auto">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-orange-800 mb-2">Safe & Private</h3>
            <p className="text-orange-600 text-sm">Your conversations are private and secure</p>
          </div>
        </div>

        <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-orange-800 mb-1">∞</div>
              <div className="text-sm text-orange-600">Unlimited Chats</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-orange-800 mb-1">🌍</div>
              <div className="text-sm text-orange-600">Global Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-orange-800 mb-1">⚡</div>
              <div className="text-sm text-orange-600">Instant Match</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-orange-800 mb-1">🔒</div>
              <div className="text-sm text-orange-600">No Re-pairing</div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showUsernameModal} onOpenChange={setShowUsernameModal}>
        <DialogContent className="sm:max-w-md border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
          <DialogHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <DialogTitle className="text-2xl font-bold text-orange-800">
              Choose Your Username
            </DialogTitle>
            <p className="text-orange-600 mt-2">Enter a unique username to start chatting</p>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium text-orange-700">
                Username
              </label>
              <Input
                id="username"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleUsernameSubmit()}
                className="text-lg py-3 px-4 border-orange-200 focus:border-orange-500 focus:ring-orange-500 rounded-xl transition-colors"
                autoFocus
              />
            </div>

            <Button
              onClick={handleUsernameSubmit}
              disabled={isLoading || !username.trim()}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-3 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:opacity-50"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Account...
                </div>
              ) : (
                'Start Chatting'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
