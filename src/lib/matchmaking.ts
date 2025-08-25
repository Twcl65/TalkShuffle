import { supabase } from './supabase'
import { ChatWithUsers } from './types'
import { User } from './types'

export class MatchmakingService {
  static async testPairHistoryTable(): Promise<boolean> {
    if (!supabase) {
      console.error('Supabase client not initialized')
      return false
    }

    try {
      const { data, error } = await supabase
        .from('pair_history')
        .select('id')
        .limit(1)

      if (error) {
        console.error('Error accessing pair_history table:', error)
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        return false
      }

      return true
    } catch (error) {
      console.error('Exception testing pair_history table:', error)
      return false
    }
  }

  private static async hasBeenPairedBefore(userId1: string, userId2: string): Promise<boolean> {
    if (!supabase) {
      throw new Error('Supabase client not initialized')
    }

    try {
      const { data, error } = await supabase
        .from('pair_history')
        .select('user1_id, user2_id')
        .or(`user1_id.eq.${userId1},user1_id.eq.${userId2},user2_id.eq.${userId1},user2_id.eq.${userId2}`)

      if (error) {
        console.error('Error checking pair history:', error)
        return false
      }

      const hasPair = data?.some(record =>
        (record.user1_id === userId1 && record.user2_id === userId2) ||
        (record.user1_id === userId2 && record.user2_id === userId1)
      )

      return hasPair || false
    } catch (error) {
      console.error('Error checking pair history:', error)
      return false
    }
  }

  static async checkIfPairedBefore(userId1: string, userId2: string): Promise<{
    hasBeenPaired: boolean
    pairRecord: any | null
    error: any | null
  }> {
    if (!supabase) {
      throw new Error('Supabase client not initialized')
    }

    try {
      const { data, error } = await supabase
        .from('pair_history')
        .select('user1_id, user2_id, created_at')
        .or(`user1_id.eq.${userId1},user1_id.eq.${userId2},user2_id.eq.${userId1},user2_id.eq.${userId2}`)

      if (error) {
        console.error('Error checking pair history:', error)
        return { hasBeenPaired: false, pairRecord: null, error }
      }

      const pairRecord = data?.find(record =>
        (record.user1_id === userId1 && record.user2_id === userId2) ||
        (record.user1_id === userId2 && record.user2_id === userId1)
      )

      const hasBeenPaired = !!pairRecord

      return { hasBeenPaired, pairRecord, error: null }
    } catch (error) {
      console.error('Error checking pair history:', error)
      return { hasBeenPaired: false, pairRecord: null, error }
    }
  }

  private static async recordPairing(userId1: string, userId2: string): Promise<boolean> {
    if (!supabase) {
      throw new Error('Supabase client not initialized')
    }

    try {
      const { error } = await supabase
        .from('pair_history')
        .insert({
          user1_id: userId1,
          user2_id: userId2
        })

      if (error) {
        if (error.code === '23505') {
          return true
        } else if (error.code === '23514') {
          return true
        } else {
          console.error('Error recording pairing:', error)
          return false
        }
      }

      return true
    } catch (error) {
      console.error('Exception recording pairing:', error)
      return false
    }
  }

  static async getPreviousPartners(userId: string): Promise<string[]> {
    if (!supabase) {
      throw new Error('Supabase client not initialized')
    }

    try {
      const { data, error } = await supabase
        .from('pair_history')
        .select('user1_id, user2_id')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)

      if (error) {
        console.error('Error getting previous partners:', error)
        return []
      }

      const previousPartners = data?.map(record => {
        if (record.user1_id === userId) {
          return record.user2_id
        } else {
          return record.user1_id
        }
      }) || []

      return previousPartners
    } catch (error) {
      console.error('Error getting previous partners:', error)
      return []
    }
  }

  static async getAllPairHistory(): Promise<any[]> {
    if (!supabase) {
      throw new Error('Supabase client not initialized')
    }

    try {
      const { data, error } = await supabase
        .from('pair_history')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error getting pair history:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error getting pair history:', error)
      return []
    }
  }

  static async getPairingSummary(): Promise<any> {
    if (!supabase) {
      throw new Error('Supabase client not initialized')
    }

    try {
      const allUsers = await this.getAllUsers()
      const allPairs = await this.getAllPairHistory()

      const userPairingDetails = allUsers.map(user => {
        const previousPartners = allPairs
          .filter(pair => pair.user1_id === user.id || pair.user2_id === user.id)
          .map(pair => {
            if (pair.user1_id === user.id) {
              return pair.user2_id
            } else {
              return pair.user1_id
            }
          })

        return {
          userId: user.id,
          username: user.username,
          status: user.status,
          chatId: user.chat_id,
          previousPartners,
          partnerCount: previousPartners.length
        }
      })

      return {
        totalUsers: allUsers.length,
        totalPairs: allPairs.length,
        userPairingDetails
      }
    } catch (error) {
      console.error('Error getting pairing summary:', error)
      return null
    }
  }

  private static async getAllUsers(): Promise<User[]> {
    if (!supabase) {
      throw new Error('Supabase client not initialized')
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error getting users:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error getting users:', error)
      return []
    }
  }

  static async debugMatchmakingState(userId?: string): Promise<void> {
    try {
      const allUsers = await this.getAllUsers()
      const allPairHistory = await this.getAllPairHistory()

      const findingUsers = allUsers.filter(u => u.status === 'finding')
      const chattingUsers = allUsers.filter(u => u.status === 'chatting')

      const pairHistory = allPairHistory

      if (userId) {
        const user = allUsers.find(u => u.id === userId)
        if (user) {
          const previousPartners = await this.getPreviousPartners(userId)
        } else {
        }
      }
    } catch (error) {
      console.error('Error debugging matchmaking state:', error)
    }
  }

  static async debugPairHistoryTable(): Promise<void> {
    try {
      const tableAccessible = await this.testPairHistoryTable()

      const allPairs = await this.getAllPairHistory()

      const uniquePairs = new Set()
      allPairs.forEach(pair => {
        const pairKey = pair.user1_id < pair.user2_id
          ? `${pair.user1_id}-${pair.user2_id}`
          : `${pair.user2_id}-${pair.user1_id}`
        uniquePairs.add(pairKey)
      })

      if (allPairs.length !== uniquePairs.size) {
      }
    } catch (error) {
      console.error('Error debugging pair history table:', error)
    }
  }

  static async findMatch(currentUserId: string, retryCount: number = 0): Promise<ChatWithUsers | null> {
    if (retryCount >= 10) {
      return null
    }

    try {
      const currentUser = await this.getUserById(currentUserId)
      if (!currentUser || currentUser.status !== 'finding' || currentUser.chat_id) {
        return null
      }

      const availableUsers = await supabase!
        .from('users')
        .select('id, username, created_at')
        .eq('status', 'finding')
        .is('chat_id', null)
        .neq('id', currentUserId)
        .order('created_at', { ascending: true })

      if (!availableUsers.data || availableUsers.data.length === 0) {
        return null
      }

      const previousPartners = await this.getPreviousPartners(currentUserId)

      const newPotentialPartners = availableUsers.data.filter(user =>
        !previousPartners.includes(user.id)
      )

      let bestMatch: any = null

      if (newPotentialPartners.length > 0) {
        bestMatch = newPotentialPartners[0]
      } else {
        const pairingCounts = await Promise.all(
          availableUsers.data.map(async (user) => {
            const userPartners = await this.getPreviousPartners(user.id)
            const hasPairedWithCurrentUser = userPartners.includes(currentUserId)
            return {
              user,
              pairingCount: userPartners.length,
              hasPairedWithCurrentUser
            }
          })
        )

        pairingCounts.sort((a, b) => {
          if (a.pairingCount !== b.pairingCount) {
            return a.pairingCount - b.pairingCount
          }
          if (a.hasPairedWithCurrentUser !== b.hasPairedWithCurrentUser) {
            return a.hasPairedWithCurrentUser ? 1 : -1
          }
          return new Date(a.user.created_at).getTime() - new Date(b.user.created_at).getTime()
        })

        bestMatch = pairingCounts[0].user
      }

      if (!bestMatch) {
        return null
      }

      const partner = bestMatch

      try {
        const partnerCheck = await supabase!
          .from('users')
          .select('id, status, chat_id')
          .eq('id', partner.id)
          .eq('status', 'finding')
          .is('chat_id', null)
          .single()

        if (!partnerCheck.data) {
          return await this.findMatch(currentUserId, retryCount + 1)
        }
      } catch (error: any) {
        if (error.code === 'PGRST116') {
          return await this.findMatch(currentUserId, retryCount + 1)
        } else {
          return await this.findMatch(currentUserId, retryCount + 1)
        }
      }

      try {
        const currentUserCheck = await supabase!
          .from('users')
          .select('id, status, chat_id')
          .eq('id', currentUserId)
          .eq('status', 'finding')
          .is('chat_id', null)
          .single()

        if (!currentUserCheck.data) {
          return null
        }
      } catch (error: any) {
        if (error.code === 'PGRST116') {
          return null
        } else {
          return await this.findMatch(currentUserId, retryCount + 1)
        }
      }

      try {
        const currentUserCheck = await supabase!
          .from('users')
          .select('id, status, chat_id')
          .eq('id', currentUserId)
          .eq('status', 'finding')
          .is('chat_id', null)
          .single()

        if (!currentUserCheck.data) {
          return null
        }
      } catch (error: any) {
        if (error.code === 'PGRST116') {
          return null
        } else {
          return await this.findMatch(currentUserId, retryCount + 1)
        }
      }

      try {
        const partnerCheck = await supabase!
          .from('users')
          .select('id, status, chat_id')
          .eq('id', partner.id)
          .eq('status', 'finding')
          .is('chat_id', null)
          .single()

        if (!partnerCheck.data) {
          return await this.findMatch(currentUserId, retryCount + 1)
        }
      } catch (error: any) {
        if (error.code === 'PGRST116') {
          return await this.findMatch(currentUserId, retryCount + 1)
        } else {
          return await this.findMatch(currentUserId, retryCount + 1)
        }
      }

      const chat = await this.createChat([currentUserId, partner.id])
      if (!chat) {
        return null
      }

      await this.recordPairing(currentUserId, partner.id)

      return chat
    } catch (error) {
      console.error('Error finding match:', error)
      return null
    }
  }

  private static async getUserById(userId: string): Promise<User | null> {
    if (!supabase) {
      throw new Error('Supabase client not initialized')
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error getting user by ID:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error getting user by ID:', error)
      return null
    }
  }

  private static async createChat(userIds: string[]): Promise<ChatWithUsers | null> {
    if (!supabase) {
      throw new Error('Supabase client not initialized')
    }

    try {
      const { data: chat, error: chatError } = await supabase
        .from('chats')
        .insert({
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (chatError) {
        console.error('Error creating chat:', chatError)
        return null
      }

      const { error: userUpdateError } = await supabase
        .from('users')
        .update({
          status: 'chatting',
          chat_id: chat.id
        })
        .in('id', userIds)

      if (userUpdateError) {
        await supabase.from('chats').delete().eq('id', chat.id)
        return null
      }

      const { data: updatedUsers, error: userFetchError } = await supabase
        .from('users')
        .select('*')
        .in('id', userIds)

      if (userFetchError || !updatedUsers || updatedUsers.length !== 2) {
        await supabase.from('chats').delete().eq('id', chat.id)
        return null
      }

      return {
        id: chat.id,
        created_at: chat.created_at,
        users: updatedUsers,
        messages: []
      }
    } catch (error) {
      console.error('Error creating chat:', error)
      return null
    }
  }

  static async getCurrentChat(userId: string): Promise<ChatWithUsers | null> {
    if (!supabase) {
      throw new Error('Supabase client not initialized')
    }

    try {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('chat_id')
        .eq('id', userId)
        .single()

      if (userError || !user.chat_id) {
        return null
      }

      const { data: chat, error: chatError } = await supabase
        .from('chats')
        .select('*')
        .eq('id', user.chat_id)
        .single()

      if (chatError) {
        return null
      }

      const { data: chatUsers, error: usersError } = await supabase
        .from('users')
        .select('*')
        .eq('chat_id', user.chat_id)

      if (usersError || !chatUsers) {
        return null
      }

      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', user.chat_id)
        .order('created_at', { ascending: true })

      if (messagesError) {
        console.error('Error getting messages:', messagesError)
      }

      return {
        id: chat.id,
        created_at: chat.created_at,
        users: chatUsers,
        messages: messages || []
      }
    } catch (error) {
      console.error('Error getting current chat:', error)
      return null
    }
  }

  static async handleNext(userId: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase client not initialized')
    }

    try {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('chat_id')
        .eq('id', userId)
        .single()

      if (userError || !user.chat_id) {
        return
      }

      const chatId = user.chat_id

      const { data: chatUsers, error: usersError } = await supabase
        .from('users')
        .select('id')
        .eq('chat_id', chatId)

      if (usersError || !chatUsers) {
        return
      }

      const { error: chatDeleteError } = await supabase
        .from('chats')
        .delete()
        .eq('id', chatId)

      if (chatDeleteError) {
        console.error('Error deleting chat:', chatDeleteError)
        return
      }

      const { error: userUpdateError } = await supabase
        .from('users')
        .update({
          status: 'finding',
          chat_id: null
        })
        .in('id', chatUsers.map(u => u.id))

      if (userUpdateError) {
        console.error('Error updating users:', userUpdateError)
        return
      }

      const { error: messagesDeleteError } = await supabase
        .from('messages')
        .delete()
        .eq('chat_id', chatId)

      if (messagesDeleteError) {
        console.error('Error deleting messages:', messagesDeleteError)
      }
    } catch (error) {
      console.error('Error handling next:', error)
    }
  }

  static async handleLeave(userId: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase client not initialized')
    }

    try {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('chat_id')
        .eq('id', userId)
        .single()

      if (userError) {
        return
      }

      if (user.chat_id) {
        await this.handleNext(userId)
      }

      const { error: pairHistoryError } = await supabase
        .from('pair_history')
        .delete()
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)

      if (pairHistoryError) {
        console.error('Error deleting pair history:', pairHistoryError)
      }

      const { error: userDeleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)

      if (userDeleteError) {
        console.error('Error deleting user:', userDeleteError)
      }
    } catch (error) {
      console.error('Error handling leave:', error)
    }
  }

  static async cleanupUser(userId: string): Promise<void> {
    try {
      await this.handleLeave(userId)
    } catch (error) {
      console.error('Error cleaning up user:', error)
    }
  }
}
