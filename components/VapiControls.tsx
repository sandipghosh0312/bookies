"use client"
import useVapi from '@/hooks/useVapi'
import { Disc3, Mic, MicOff } from 'lucide-react'
import { IBook } from '@/types'
import Image from 'next/image'
import Transcript from './Transcript'
import { useState } from 'react'
import { voiceCategories, voiceOptions, DEFAULT_VOICE } from '@/constants'

const formatTimer = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const VapiControls = ({ book }: { book: IBook }) => {
  const {
    status,
    isActive,
    messages,
    currentMessage,
    currentUserMessage,
    duration,
    start,
    stop,
    limitError,
    clearError,
    maxDurationSeconds,
  } = useVapi(book)

  const maxMinutes = Math.floor(maxDurationSeconds / 60) || 0
  const [selectedVoice, setSelectedVoice] = useState<string>(DEFAULT_VOICE)

  const getStatusDotClass = () => {
    switch (status) {
      case 'connecting':
        return 'vapi-status-dot-connecting'
      case 'starting':
        return 'vapi-status-dot-starting'
      case 'listening':
        return 'vapi-status-dot-listening'
      case 'thinking':
        return 'vapi-status-dot-thinking'
      case 'speaking':
        return 'vapi-status-dot-speaking'
      default:
        return 'vapi-status-dot-ready'
    }
  }

  const getStatusLabel = () => {
    switch (status) {
      case 'connecting':
        return 'Connecting...'
      case 'starting':
        return 'Getting ready...'
      case 'listening':
        return 'Listening'
      case 'thinking':
        return 'Thinking'
      case 'speaking':
        return 'Speaking'
      default:
        return 'Ready'
    }
  }

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
                  onClick={isActive ? stop : () => start(selectedVoice)}
                  disabled={status === 'connecting'}
                  className={`vapi-mic-btn ${isActive ? 'vapi-mic-btn-active' : 'vapi-mic-btn-inactive'
                    } shadow-md w-15 h-15 z-10`}
                  aria-label={isActive ? 'Stop talking' : 'Start the conversation'}
                  type="button"
                >
                  {isActive ? (
                    <Mic size={24} className="text-[#666]" />
                  ) : (
                    <MicOff size={24} className="text-[#666]" />
                  )}
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
                <div className={`vapi-status-dot ${getStatusDotClass()}`}></div>
                <span className="vapi-status-text">{getStatusLabel()}</span>
              </div>

              {/* Timer */}
              <div className="vapi-status-indicator">
                <span className="vapi-status-text">
                  {formatTimer(duration)}/{formatTimer(maxDurationSeconds)}
                </span>
              </div>
            </div>

            {/* Voice Selector for this conversation */}
            <div className="mt-2 space-y-3">
              <label htmlFor="voice-select" className="text-sm font-medium text-[`#777`]">
                Choose voice for this conversation
              </label>
              <div className="w-full max-w-xs">
                <select
                  id="voice-select"
                  className="w-full rounded-lg border border-(--border-subtle) bg-white px-3 py-2 text-sm text-[#212a3b] shadow-soft-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-warm)]"
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                >
                  <optgroup label="Male voices">
                    {voiceCategories.male.map((voiceId) => {
                      const voice = voiceOptions[voiceId as keyof typeof voiceOptions]
                      return (
                        <option key={voiceId} value={voiceId}>
                          {voice.name} — {voice.description}
                        </option>
                      )
                    })}
                  </optgroup>
                  <optgroup label="Female voices">
                    {voiceCategories.female.map((voiceId) => {
                      const voice = voiceOptions[voiceId as keyof typeof voiceOptions]
                      return (
                        <option key={voiceId} value={voiceId}>
                          {voice.name} — {voice.description}
                        </option>
                      )
                    })}
                  </optgroup>
                </select>
              </div>
            </div>

            {/* Limit error banner */}
            {limitError && (
              <div className="warning-banner" role="alert">
                <div className="warning-banner-content">
                  <span className="warning-banner-text">{limitError}</span>
                  <button type="button" onClick={clearError} className="ml-3 underline">
                    Dismiss
                  </button>
                </div>
              </div>
            )}
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