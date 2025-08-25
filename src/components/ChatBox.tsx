'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { User, Send, ArrowRight, LogOut } from 'lucide-react'
import { ChatService } from '@/lib/chat'
import { Message, ChatWithUsers, User as UserType } from '@/lib/types'

interface ChatBoxProps {
    chat: ChatWithUsers
    currentUser: UserType
    onNext: () => void
    onLeave: () => void
    onChatUpdate: (chat: ChatWithUsers) => void
}

export function ChatBox({ chat, currentUser, onNext, onLeave, onChatUpdate }: ChatBoxProps) {
    const [messages, setMessages] = useState<Message[]>(chat.messages || [])
    const [newMessage, setNewMessage] = useState('')
    const [isSending, setIsSending] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const partner = chat.users.find(user => user.id !== currentUser.id)

    useEffect(() => {
        const unsubscribe = ChatService.subscribeToChat(
            chat.id,
            (message) => {
                setMessages(prev => {
                    const messageExists = prev.some(m => m.id === message.id)
                    if (messageExists) return prev
                    return [...prev, message]
                })
            },
            onChatUpdate
        )

        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })

        return unsubscribe
    }, [chat.id, onChatUpdate])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSendMessage = async () => {
        if (!newMessage.trim() || isSending) return

        setIsSending(true)
        try {
            const message = await ChatService.sendMessage(
                chat.id,
                currentUser.id,
                newMessage.trim()
            )

            if (message) {
                setMessages(prev => [...prev, message])
                setNewMessage('')
            } else {
                alert('Message blocked due to inappropriate content.')
            }
        } catch (error) {
            console.error('Error sending message:', error)
            alert('Failed to send message. Please try again.')
        } finally {
            setIsSending(false)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    const formatTime = (timestamp: string) => {
        return new Date(timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (!partner) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
                <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                    <CardContent className="p-8 text-center">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">
                            Partner Disconnected
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Your chat partner has left the conversation.
                        </p>
                        <Button
                            onClick={onNext}
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                        >
                            Find New Partner
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex flex-col">
            <div className="bg-white shadow-sm border-b border-orange-100">
                <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-orange-600" />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-800">{currentUser.username}</p>
                            <p className="text-sm text-gray-500">Chatting with {partner.username}</p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            onClick={onNext}
                            variant="outline"
                            className="flex-1 border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300"
                        >
                            <ArrowRight className="w-4 h-4 mr-2" />
                            Next
                        </Button>

                        <Button
                            onClick={onLeave}
                            variant="destructive"
                            className="flex-1"
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Leave
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex-1 max-w-4xl mx-auto w-full p-4 overflow-hidden">
                <Card className="h-full flex flex-col">
                    <CardHeader className="pb-3 border-b border-orange-100">
                        <h3 className="text-lg font-semibold text-gray-800">
                            Chat with {partner.username}
                        </h3>
                    </CardHeader>

                    <CardContent className="flex-1 p-4 overflow-y-auto">
                        <div className="space-y-4 min-h-[400px]">
                            {messages.length === 0 ? (
                                <div className="text-center text-gray-500 py-8">
                                    <p>Start the conversation! Say hello to {partner.username}</p>
                                </div>
                            ) : (
                                messages.map((message, index) => {
                                    const isOwnMessage = message.sender_id === currentUser.id
                                    const uniqueKey = `${message.id}-${index}`
                                    return (
                                        <div
                                            key={uniqueKey}
                                            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${isOwnMessage
                                                    ? 'bg-orange-500 text-white'
                                                    : 'bg-gray-100 text-gray-800'
                                                    }`}
                                            >
                                                <p className="text-sm">{message.content}</p>
                                                <p className={`text-xs mt-1 ${isOwnMessage ? 'text-orange-100' : 'text-gray-500'
                                                    }`}>
                                                    {formatTime(message.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="bg-white border-t border-orange-100 p-4">
                <div className="max-w-4xl mx-auto flex space-x-3">
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your message..."
                        className="flex-1 border-orange-200 focus:border-orange-400"
                        disabled={isSending}
                    />
                    <Button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || isSending}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-6"
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
