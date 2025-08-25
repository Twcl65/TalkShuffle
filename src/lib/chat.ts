import { supabase } from './supabase'
import { filterMessage } from './filter'
import { Message } from './types'

export class ChatService {
  static async sendMessage(chatId: string, senderId: string, content: string): Promise<Message | null> {
    if (!supabase) {
      throw new Error('Supabase client not initialized')
    }

    if (!filterMessage(content)) {
      return null
    }

    try {
      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: senderId,
          content,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Error sending message:', error)
        return null
      }

      return message
    } catch (error) {
      console.error('Error sending message:', error)
      return null
    }
  }

  static subscribeToChat(
    chatId: string,
    onMessage: (message: Message) => void,
    onChatUpdate: (chat: any) => void
  ) {
    if (!supabase) {
      return () => {}
    }

    const messageSubscription = supabase
      .channel(`chat:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`
        },
        (payload) => {
          onMessage(payload.new as Message)
        }
      )
      .subscribe()

    const chatSubscription = supabase
      .channel(`chat-updates:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'chats',
          filter: `id=eq.${chatId}`
        },
        () => {
          onChatUpdate({})
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `chat_id=eq.${chatId}`
        },
        async () => {
          try {
            const { data: chat } = await supabase
              .from('chats')
              .select('*')
              .eq('id', chatId)
              .single()

            if (chat) {
              const { data: users } = await supabase
                .from('users')
                .select('*')
                .eq('chat_id', chatId)

              const { data: messages } = await supabase
                .from('messages')
                .select('*')
                .eq('chat_id', chatId)
                .order('created_at', { ascending: true })

              onChatUpdate({
                ...chat,
                users: users || [],
                messages: messages || []
              })
            }
          } catch (error) {
            console.error('Error handling chat update:', error)
          }
        }
      )
      .subscribe()

    return () => {
      messageSubscription.unsubscribe()
      chatSubscription.unsubscribe()
    }
  }

  static async getMessages(chatId: string): Promise<Message[]> {
    if (!supabase) {
      throw new Error('Supabase client not initialized')
    }

    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error getting messages:', error)
        return []
      }

      return messages || []
    } catch (error) {
      console.error('Error getting messages:', error)
      return []
    }
  }
}
