'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, User } from 'lucide-react'
import { MatchmakingService } from '@/lib/matchmaking'
import { supabase } from '@/lib/supabase'

interface FindingScreenProps {
  username: string
  onNext: () => void
  onLeave: () => void
  currentUserId: string
  onStatusChange: () => void
}

export function FindingScreen({ username, onNext, onLeave, currentUserId, onStatusChange }: FindingScreenProps) {
  const [elapsedTime, setElapsedTime] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1)
    }, 1000)

    let userSubscription: any = null
    if (supabase) {
      userSubscription = supabase
        .channel(`user:${currentUserId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'users',
            filter: `id=eq.${currentUserId}`
          },
          (payload) => {
            const updatedUser = payload.new
            if (updatedUser.status === 'chatting' && updatedUser.chat_id) {
              onStatusChange()
            }
          }
        )
        .subscribe()
    }

    const statusCheck = setInterval(async () => {
      try {
        const currentChat = await MatchmakingService.getCurrentChat(currentUserId)
        if (currentChat && currentChat.users.length === 2) {
          onStatusChange()
        } else {
          const match = await MatchmakingService.findMatch(currentUserId)
          if (match) {
            onStatusChange()
          }
        }
      } catch (error) {
        console.error('Status check error:', error)
      }
    }, 3000)

    return () => {
      clearInterval(timer)
      clearInterval(statusCheck)
      if (userSubscription) {
        userSubscription.unsubscribe()
      }
    }
  }, [currentUserId, onStatusChange])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardContent className="p-8 text-center">
          <div className="mb-8">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center">
                  <User className="w-10 h-10 text-orange-600" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Finding someone to chat with...
            </h2>
            <p className="text-gray-600">
              Hello <span className="font-semibold text-orange-600">{username}</span>!
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Please wait while we find you a chat partner
            </p>
            <p className="text-xs text-orange-500 mt-2">
              Searching for {formatTime(elapsedTime)}
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={onNext}
              variant="outline"
              className="w-full border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300"
            >
              Cancel
            </Button>

            <Button
              onClick={onLeave}
              variant="destructive"
              className="w-full"
            >
              Leave
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
