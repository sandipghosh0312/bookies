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
import { useAuth } from '@clerk/nextjs'
import { toast } from 'sonner'
import { checkBookExists, createBook, saveBookSegments } from '@/lib/actions/book.actions'
import { useRouter } from 'next/navigation'
import { parsePDFFile } from '@/lib/utils'
import { upload } from '@vercel/blob/client'

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
  persona: z.string().min(1, 'Voice selection is required'),

  length: z.int64().optional().nullable(),
})

type FormData = z.infer<typeof formSchema>

const UploadForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pdfFileName, setPdfFileName] = useState<string>('')
  const [coverImagePreview, setCoverImagePreview] = useState<string>('')
  const pdfInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const { userId } = useAuth();
  const router = useRouter();

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
      if (!userId) {
        return toast.error("You need to login (authenticate) before being able to upload a book")
      }

      setIsSubmitting(true);

      try {
        const bookExists = await checkBookExists(data.title);
        if (bookExists.exists && bookExists.book) {
          toast.info("A book with this title already exists..");
          form.reset();
          router.push(`/books/${bookExists.book.slug}`);
          return;
        }

        const FileTitle = data.title.replace(/\s+/g, '-').toLowerCase();
        const pdfFile = data.pdfFile;

        const parsePDF = await parsePDFFile(pdfFile);

        if (parsePDF.content.length === 0){
          toast.error("Could not extract any text content from the PDF. Please make sure the PDF is not scanned as an image and try again.");
          return;
        }

        const uploadPDFBlob = await upload(FileTitle, pdfFile, {
          access: 'public',
          handleUploadUrl: '/api/upload',
          contentType: 'application/pdf',
        })

        let coverUrl: string;
        if (data.coverImage) {
          const coverFile = data.coverImage;
          const uploadCoverBlob = await upload(`${FileTitle}-cover.png`, coverFile, {
            access: 'public',
            handleUploadUrl: '/api/upload',
            contentType: coverFile.type,
          })
          coverUrl = uploadCoverBlob.url;
        } else {
          const response = await fetch(parsePDF.cover);
          const blob = await response.blob();
          const uploadCoverBlob = await upload(`${FileTitle}-cover.png`, blob, {
            access: 'public',
            handleUploadUrl: '/api/upload',
            contentType: 'image/png',
          })
          coverUrl = uploadCoverBlob.url;
        }

        const book = await createBook({
          clerkId: userId,
          title: data.title,
          author: data.author,
          persona: data.persona,
          fileURL: uploadPDFBlob.url,
          fileBlobKey: uploadPDFBlob.pathname,
          coverURL: coverUrl,
          fileSize: pdfFile.size,
        })

        if (!book.success) throw new Error("Could not create book");

        if (book.alreadyExists) {
          toast.info("A book with this title already exists.");
          form.reset();
          router.push(`/books/${book.data.slug}`);
          return;
        }

        const segments = await saveBookSegments(book.data._id, userId, parsePDF.content);

        if (!segments.success) {
          toast.error("Could not save your book segments");
          throw new Error("Could not save book segments");
        }

        form.reset();
        router.push("/");
      } catch (error) {
        toast.error("Could not process your book")
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
                      name="persona"
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