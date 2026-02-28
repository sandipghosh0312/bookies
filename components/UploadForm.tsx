'use client'

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Upload, Image as ImageIcon, X } from 'lucide-react'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import VoiceSelector from './VoiceSelector'

// Zod validation schema
const formSchema = z.object({
  pdfFile: z.instanceof(File, { message: 'PDF file is required' }).refine(
    (file) => file.size <= 50 * 1024 * 1024,
    'File size must be less than 50MB'
  ).refine(
    (file) => file.type === 'application/pdf',
    'File must be a PDF'
  ),
  coverImage: z.instanceof(File).optional().nullable(),
  title: z.string().min(1, 'Title is required').min(3, 'Title must be at least 3 characters'),
  author: z.string().min(1, 'Author is required').min(3, 'Author must be at least 3 characters'),
  voiceId: z.string().min(1, 'Voice selection is required'),
})

type FormData = z.infer<typeof formSchema>

const UploadForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pdfFileName, setPdfFileName] = useState<string>('')
  const [coverImagePreview, setCoverImagePreview] = useState<string>('')
  const pdfInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: 'onBlur',
  })

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      form.setValue('pdfFile', file)
      setPdfFileName(file.name)
    }
  }

  const handleCoverImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      form.setValue('coverImage', file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setCoverImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removePdfFile = () => {
    form.setValue('pdfFile', undefined as any)
    setPdfFileName('')
    if (pdfInputRef.current) {
      pdfInputRef.current.value = ''
    }
  }

  const removeCoverImage = () => {
    form.setValue('coverImage', null)
    setCoverImagePreview('')
    if (coverInputRef.current) {
      coverInputRef.current.value = ''
    }
  }

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true)
      // Handle form submission here
      console.log('Form data:', data)
      // API call would go here
      await new Promise((resolve) => setTimeout(resolve, 2000)) // Simulate API call
    } catch (error) {
      console.error('Error submitting form:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {isSubmitting && (
        <div className="loading-wrapper">
          <div className="loading-shadow-wrapper">
            <div className="loading-shadow bg-white">
              <div className="loading-animation">
                <svg
                  className="w-12 h-12 text-[#663820]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div className="loading-title">Synthesizing your book...</div>
              <div className="loading-progress">
                <div className="loading-progress-item">
                  <div className="loading-progress-status" />
                  <span>Processing audio</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="new-book-wrapper space-y-8">
          {/* PDF Upload */}
          <FormField
            control={form.control}
            name="pdfFile"
            render={() => (
              <FormItem>
                <FormLabel className="form-label">Book PDF File</FormLabel>
                <FormControl>
                  <label className="upload-dropzone border border-dashed border-[#ccc] block cursor-pointer">
                    {!pdfFileName ? (
                      <>
                        <Upload className="upload-dropzone-icon" />
                        <p className="upload-dropzone-text">Click to upload PDF</p>
                        <p className="upload-dropzone-hint">PDF file (max 50MB)</p>
                      </>
                    ) : (
                      <div className="flex items-center justify-between w-full px-4">
                        <div className="flex items-center gap-3">
                          <Upload className="upload-dropzone-icon" />
                          <span className="text-lg font-medium text-[#333]">{pdfFileName}</span>
                        </div>
                        <button
                          type="button"
                          onClick={removePdfFile}
                          className="upload-dropzone-remove"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                    <input
                      ref={pdfInputRef}
                      type="file"
                      accept=".pdf"
                      onChange={handlePdfUpload}
                      className="hidden"
                    />
                  </label>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Cover Image Upload */}
          <FormField
            control={form.control}
            name="coverImage"
            render={() => (
              <FormItem>
                <FormLabel className="form-label">Cover Image (Optional)</FormLabel>
                <FormControl>
                  <label className="upload-dropzone border border-dashed border-[#ccc] block cursor-pointer">
                    {!coverImagePreview ? (
                      <>
                        <ImageIcon className="upload-dropzone-icon" />
                        <p className="upload-dropzone-text">Click to upload cover image</p>
                        <p className="upload-dropzone-hint">Leave empty to auto-generate from PDF</p>
                      </>
                    ) : (
                      <div className="flex items-center justify-between w-full px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={coverImagePreview}
                            alt="Cover preview"
                            className="w-10 h-14 object-cover rounded"
                          />
                          <span className="text-lg font-medium text-[#333]">Cover image uploaded</span>
                        </div>
                        <button
                          type="button"
                          onClick={removeCoverImage}
                          className="upload-dropzone-remove"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleCoverImageUpload}
                      className="hidden"
                    />
                  </label>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Title Input */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="form-label">Title</FormLabel>
                <FormControl>
                  <Input
                    placeholder="ex: Rich Dad Poor Dad"
                    className="form-input"
                    {...field}
                    value={field.value ?? ''}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Author Input */}
          <FormField
            control={form.control}
            name="author"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="form-label">Author Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="ex: Robert Kiyosaki"
                    className="form-input"
                    {...field}
                    value={field.value ?? ''}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Voice Selector */}
                  <FormField
                      control={form.control}
                      name="voiceId"
                      render={({ field }) => (
                          <FormItem>
                              <FormLabel className="form-label">Choose Assistant Voice</FormLabel>
                              <FormControl>
                                  <VoiceSelector
                                      value={field.value}
                                      onChange={field.onChange}
                                      disabled={isSubmitting}
                                  />
                              </FormControl>
                              <FormMessage />
                          </FormItem>
                      )}
                  />

          {/* Submit Button */}
          <Button
            type="submit"
            className="form-btn mt-8"
            disabled={isSubmitting}
          >
            Begin Synthesis
          </Button>
        </form>
      </Form>
    </>
  )
}

export default UploadForm