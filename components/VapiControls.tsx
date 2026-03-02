"use client"
import useVapi from '@/hooks/useVapi'
import { Disc3, Mic, MicOff } from 'lucide-react'
import { IBook } from '@/types'
import Image from 'next/image'
import Transcript from './Transcript'

const VapiControls = ({ book }: { book: IBook }) => {
    const { status, isActive, messages, currentMessage, currentUserMessage, duration, start, stop, clearError } = useVapi(book)

    return (
        <>
            <div className="w-full max-w-4xl mx-auto px-4 sm:py-12">
                {/* Header Card */}
                <div className="vapi-header-card mb-6 sm:mb-8">
                    {/* Book Cover */}
                    <div className="vapi-cover-wrapper">
                        <div className="relative">
                            {book.coverURL ? (
                                <Image
                                    src={book.coverURL}
                                    alt={book.title}
                                    className="vapi-cover-image"
                                    width={130}
                                    height={195}
                                    priority
                                />
                            ) : (
                                <div className="vapi-cover-image bg-linear-to-br from-[#f3e4c7] to-[#e8d5b3] flex items-center justify-center">
                                    <Disc3 size={48} className="text-[#999]" />
                                </div>
                            )}

                            {/* Mic Button - Overlapping bottom-right */}
                            <div className="vapi-mic-wrapper">
                                <button
                                    onClick={isActive ? stop : start}
                                    disabled={status === "connecting"}
                                    className={`vapi-mic-btn ${isActive ? 'vapi-mic-btn-active' : 'vapi-mic-btn-inactive'} shadow-md w-15 h-15 z-10`}
                                    aria-label={isActive ? 'Stop talking' : 'Start the conversation'}
                                    type="button"
                                >
                                    {
                                        isActive ? (
                                            <Mic size={24} className="text-[#666]" />
                                        ) : (
                                            <MicOff size={24} className="text-[#666]" />
                                        )
                                    }
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Book Info Section */}
                    <div className="flex-1 flex flex-col justify-start gap-4">
                        {/* Title and Author */}
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-[#212a3b] font-serif leading-tight">
                                {book.title}
                            </h1>
                            <p className="text-base sm:text-lg text-[#3d485e] mt-1 font-serif">
                                by {book.author}
                            </p>
                        </div>

                        {/* Status Badges */}
                        <div className="flex flex-wrap gap-2 sm:gap-3">
                            {/* Status Indicator */}
                            <div className="vapi-status-indicator">
                                <div className="vapi-status-dot vapi-status-dot-ready"></div>
                                <span className="vapi-status-text">Ready</span>
                            </div>

                            {/* Voice Label */}
                            <div className="vapi-status-indicator">
                                <span className="vapi-status-text">
                                    Voice: {book.persona || 'Default'}
                                </span>
                            </div>

                            {/* Timer */}
                            <div className="vapi-status-indicator">
                                <span className="vapi-status-text">0:00/15:00</span>
                            </div>
                        </div>
                    </div>
                </div>
                <Transcript
                    messages={messages}
                    currentMessage={currentMessage}
                    currentUserMessage={currentUserMessage}
                />
            </div>
        </>
    )
}

export default VapiControls