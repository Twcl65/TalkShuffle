import { supabase } from './supabase'
import { User } from './types'

export class UserService {
  static async createUser(username: string): Promise<User | null> {
    if (!supabase) {
      throw new Error('Supabase client not initialized')
    }

    try {
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .single()

      if (existingUser) {
        throw new Error('Username already exists')
      }

      const { data: user, error } = await supabase
        .from('users')
        .insert({
          username,
          status: 'finding',
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating user:', error)
        return null
      }

      return user
    } catch (error) {
      if (error instanceof Error && error.message === 'Username already exists') {
        throw error
      }
      console.error('Error creating user:', error)
      return null
    }
  }

  static async getUserById(userId: string): Promise<User | null> {
    if (!supabase) {
      throw new Error('Supabase client not initialized')
    }

    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error getting user by ID:', error)
        return null
      }

      return user
    } catch (error) {
      console.error('Error getting user by ID:', error)
      return null
    }
  }

  static async updateUserStatus(userId: string, status: 'finding' | 'chatting'): Promise<boolean> {
    if (!supabase) {
      throw new Error('Supabase client not initialized')
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({ status })
        .eq('id', userId)

      if (error) {
        console.error('Error updating user status:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error updating user status:', error)
      return false
    }
  }

  static async updateUserChatId(userId: string, chatId: string | null): Promise<boolean> {
    if (!supabase) {
      throw new Error('Supabase client not initialized')
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({ chat_id: chatId })
        .eq('id', userId)

      if (error) {
        console.error('Error updating user chat ID:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error updating user chat ID:', error)
      return false
    }
  }

  static async deleteUser(userId: string): Promise<boolean> {
    if (!supabase) {
      throw new Error('Supabase client not initialized')
    }

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)

      if (error) {
        console.error('Error deleting user:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error deleting user:', error)
      return false
    }
  }

  static async isUsernameAvailable(username: string): Promise<boolean> {
    if (!supabase) {
      throw new Error('Supabase client not initialized')
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .single()

      if (error && error.code === 'PGRST116') {
        return true
      }

      if (error) {
        console.error('Error checking username availability:', error)
        return false
      }

      return false
    } catch (error) {
      console.error('Error checking username availability:', error)
      return false
    }
  }
}
