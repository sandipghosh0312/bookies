'use server'
import { connectToDatabase } from "@/database/mongoose";
import { CreateBook, TextSegment } from "@/types";
import { escapeRegex, generateSlug, serializeData } from "../utils";
import Book from "@/database/models/book.model";
import BookSegment from "@/database/models/book-segment.model";
import mongoose from "mongoose";
import { revalidatePath } from "next/cache";
import { canCreateMoreBooks } from "../subscriptions.server";

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

export const getAllBooks = async (query?: string | null) => {
    try {
        await connectToDatabase();

        const filter: Record<string, unknown> = {};

        if (query && query.trim()) {
            const pattern = escapeRegex(query.trim());

            filter.$or = [
                { title: { $regex: pattern, $options: "i" } },
                { author: { $regex: pattern, $options: "i" } },
            ];
        }

        const books = await Book.find(filter).sort({ createdAt: -1 }).lean();

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

        // Enforce subscription limits before creating a new book
        const limitsCheck = await canCreateMoreBooks(data.clerkId);

        if (!limitsCheck.allowed) {
            return {
                success: false,
                data: null,
                error:
                    limitsCheck.plan === 'FREE'
                        ? 'Free plan limit reached. You can only upload 1 book. Upgrade your plan to add more books.'
                        : `Plan limit reached. You can upload up to ${limitsCheck.limit} books on your current plan.`,
            };
        }

        // Generate slug for URL usage
        const slug = generateSlug(data.title);

        const book = await Book.create({
            ...data,
            slug,
            totalSegments: 0,
        })

        console.log(`[createBook] Book created successfully with _id: ${book._id}`);

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
        console.log(`\n========== [saveBookSegments START] ==========`);
        console.log(`bookId: ${bookId}`);
        console.log(`clerkId: ${clerkId}`);
        console.log(`segments.length: ${segments.length}`);
        
        if (segments.length === 0) {
            console.log(`ERROR: No segments provided!`);
            return {
                success: false,
                error: "No segments provided",
            }
        }
        
        console.log(`Segment 0 keys:`, Object.keys(segments[0]));
        console.log(`Segment 0 text length:`, segments[0].text?.length);
        console.log(`Segment 0 segmentIndex:`, segments[0].segmentIndex);
        
        await connectToDatabase();
        console.log(`Database connected`);
        
        const bookObjectId = new mongoose.Types.ObjectId(bookId);
        console.log(`ObjectId created: ${bookObjectId}`);
        
        const segmentsToInsert = segments.map(({text, segmentIndex, pageNumber, wordCount}) => ({
            bookId: bookObjectId,
            clerkId,
            content: text,
            segmentIndex,
            pageNumber,
            wordCount
        }));

        console.log(`Prepared ${segmentsToInsert.length} segments for insertion`);

        let segmentsInserted = false;

        try {
            console.log(`Calling BookSegment.insertMany...`);
            const result = await BookSegment.insertMany(segmentsToInsert);
            console.log(`✓ Successfully inserted ${result.length} segments`);
            segmentsInserted = true;
        } catch (insertError) {
            console.error(`✗ BookSegment.insertMany failed:`, insertError);
            throw insertError;
        }

        try {
            console.log(`Updating book totalSegments...`);
            const updatedBook = await Book.findByIdAndUpdate(
                bookId, 
                { $inc: { totalSegments: segments.length } }, 
                { new: true }
            );

            console.log(`✓ Book updated. Total segments: ${updatedBook?.totalSegments}`);
            console.log(`========== [saveBookSegments SUCCESS] ==========\n`);
            
            return {
                success: true,
                data: serializeData(updatedBook),
            }
        } catch (updateError) {
            console.error(`✗ Book update failed:`, updateError);
            if (segmentsInserted) {
                try {
                    await BookSegment.deleteMany({ bookId: bookObjectId });
                    console.log(`Cleaned up inserted segments`);
                } catch (cleanupError) {
                    console.error("Error cleaning up segments", cleanupError);
                }
            }
            throw updateError;
        }
    } catch (error) {
        console.error(`✗ [saveBookSegments FAILED]`, error);

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