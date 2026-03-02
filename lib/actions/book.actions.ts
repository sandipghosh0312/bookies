"use server"
import { connectToDatabase } from "@/database/mongoose";
import { CreateBook, TextSegment } from "@/types";
import { escapeRegex, generateSlug, serializeData } from "../utils";
import Book from "@/database/models/book.model";
import BookSegment from "@/database/models/book-segment.model";
import mongoose from "mongoose";
import { revalidatePath } from "next/cache";

export const getBookBySlug = async (slug: string) => {
    try {
        await connectToDatabase();

        const book = await Book.findOne({ slug }).lean();

        if (!book) {
            return {
                success: false,
                data: null,
            }
        }

        return {
            success: true,
            data: serializeData(book),
        }
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to fetch book",
            data: null,
        }
    }
}

export const getAllBooks = async () => {
    try {
        await connectToDatabase();

        const books = await Book.find().sort({ createdAt: -1 }).lean();

        return {
            success: true,
            data: serializeData(books),
        }
    } catch (error) {
        return {
            success: false,
            error: error,
        }
    }
}

export const checkBookExists = async (title: string) => {
    try {
        await connectToDatabase();

        // Normalize title for consistent comparison (case-insensitive, trimmed)
        const normalizedTitle = title.trim().toLowerCase();

        const existingBook = await Book.findOne({
            title: { $regex: `^${normalizedTitle}$`, $options: 'i' }
        }).lean();

        if (existingBook) {
            return {
                exists: true, 
                book: serializeData(existingBook)
            }
        }

    } catch (error) {
        return {
            exists: false, 
            error: error
        }
    }

    return { exists: false };
}

export const createBook = async (data: CreateBook) => {
    try {
        await connectToDatabase();

        // Check for existing book by title (case-insensitive, trimmed)
        const normalizedTitle = data.title.trim().toLowerCase();
        const existingBook = await Book.findOne({
            title: { $regex: `^${normalizedTitle}$`, $options: 'i' }
        }).lean();

        if (existingBook) {
            return {
                success: false,
                data: serializeData(existingBook),
                alreadyExists: true,
            }
        }

        // Generate slug for URL usage
        const slug = generateSlug(data.title);

        // Check subscription limits before creating a book

        const book = await Book.create({
            ...data,
            slug,
            totalSegments: 0,
        })


        revalidatePath("/")

        return {
            success: true,
            data: serializeData(book),
        }
    } catch (e) {
        console.error("Error creating book", e);
        return  {
            success: false,
            error: e instanceof Error ? e.message : "Failed to create book"
        }
    }
}

export const saveBookSegments = async (bookId: string, clerkId: string, segments: TextSegment[]) => {
    try {
        await connectToDatabase();
        const segmentsToInsert = segments.map(({text, segmentIndex, pageNumber, wordCount}) => ({
            bookId,
            clerkId,
            content: text,
            segmentIndex,
            pageNumber,
            wordCount
        }));

        // Track if segments were actually inserted so we know what to clean up
        let segmentsInserted = false;

        try {
            await BookSegment.insertMany(segmentsToInsert);
            segmentsInserted = true;
        } catch (insertError) {
            // Segment insertion failed - don't delete the book, just fail
            console.error("Error inserting book segments", insertError);
            throw insertError;
        }

        try {
            const updatedBook = await Book.findByIdAndUpdate(
                bookId, 
                { totalSegments: segments.length }, 
                { new: true }
            );

            return {
                success: true,
                data: serializeData(updatedBook),
            }
        } catch (updateError) {
            // Book update failed - clean up segments we inserted in this operation
            console.error("Error updating book segment count", updateError);
            if (segmentsInserted) {
                try {
                    await BookSegment.deleteMany({ bookId });
                } catch (cleanupError) {
                    console.error("Error cleaning up segments after update failure", cleanupError);
                    // Log but don't mask the original error
                }
            }
            throw updateError;
        }
    } catch (error) {
        console.error("Error saving book segments", error);

        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to save book segments",
        }
    }
}

export const searchBookSegments = async (bookId: string, query: string, limit: number = 5) => {
    try {
        await connectToDatabase();

        console.log(`Searching for: "${query}" in book ${bookId}`);

        const bookObjectId = new mongoose.Types.ObjectId(bookId);

        // Try MongoDB text search first (requires text index)
        let segments: Record<string, unknown>[] = [];
        try {
            segments = await BookSegment.find({
                bookId: bookObjectId,
                $text: { $search: query },
            })
                .select('_id bookId content segmentIndex pageNumber wordCount')
                .sort({ score: { $meta: 'textScore' } })
                .limit(limit)
                .lean();
        } catch {
            // Text index may not exist — fall through to regex fallback
            segments = [];
        }

        // Fallback: regex search matching ANY keyword
        if (segments.length === 0) {
            const keywords = query.split(/\s+/).filter((k) => k.length > 2);
            const pattern = keywords.map(escapeRegex).join('|');

            if (segments.length === 0) {
                const keywords = query.split(/\s+/).filter((k) => k.length > 2);
                const pattern = keywords.map(escapeRegex).join('|');

                if (keywords.length === 0) {
                    return {
                        success: true,
                        data: [],
                    }
                }
            }

            segments = await BookSegment.find({
                bookId: bookObjectId,
                content: { $regex: pattern, $options: 'i' },
            })
                .select('_id bookId content segmentIndex pageNumber wordCount')
                .sort({ segmentIndex: 1 })
                .limit(limit)
                .lean();
        }

        console.log(`Search complete. Found ${segments.length} results`);

        return {
            success: true,
            data: serializeData(segments),
        };
    } catch (error) {
        console.error('Error searching segments:', error);
        return {
            success: false,
            error: (error as Error).message,
            data: [],
        };
    }
};