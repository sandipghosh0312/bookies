"use client"
import { Messages } from '@/types'
import { Mic } from 'lucide-react'
import { useEffect, useRef } from 'react'

interface TranscriptProps {
    messages: Messages[]
    currentMessage: string
    currentUserMessage: string
}

const Transcript = ({ messages, currentMessage, currentUserMessage }: TranscriptProps) => {
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, currentMessage, currentUserMessage])

    const isEmpty = messages.length === 0 && !currentMessage && !currentUserMessage

    return (
        <div className="vapi-transcript-wrapper">
            {isEmpty ? (
                <div className="transcript-container">
                    <div className="transcript-empty">
                        <Mic size={48} className="text-[#ccc] mb-4 sm:mb-6" />
                        <h2 className="transcript-empty-text">
                            No conversation yet
                        </h2>
                        <p className="transcript-empty-hint">
                            Click the mic button above to start talking
                        </p>
                    </div>
                </div>
            ) : (
                <div className="transcript-container">
                    <div className="transcript-messages">
                        {/* Render previous messages */}
                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={`transcript-message ${
                                    message.role === 'user'
                                        ? 'transcript-message-user'
                                        : 'transcript-message-assistant'
                                }`}
                            >
                                <div
                                    className={`transcript-bubble ${
                                        message.role === 'user'
                                            ? 'transcript-bubble-user'
                                            : 'transcript-bubble-assistant'
                                    }`}
                                >
                                    {message.content}
                                </div>
                            </div>
                        ))}

                        {/* Render current user message if streaming */}
                        {currentUserMessage && (
                            <div className="transcript-message transcript-message-user">
                                <div className="transcript-bubble transcript-bubble-user">
                                    {currentUserMessage}
                                    <span className="transcript-cursor" />
                                </div>
                            </div>
                        )}

                        {/* Render current assistant message if streaming */}
                        {currentMessage && (
                            <div className="transcript-message transcript-message-assistant">
                                <div className="transcript-bubble transcript-bubble-assistant">
                                    {currentMessage}
                                    <span className="transcript-cursor" />
                                </div>
                            </div>
                        )}

                        {/* Scroll anchor */}
                        <div ref={messagesEndRef} />
                    </div>
                </div>
            )}
        </div>
    )
}

export default Transcript
