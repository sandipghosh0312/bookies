"use server"
import { connectToDatabase } from "@/database/mongoose";
import { CreateBook, TextSegment } from "@/types";
import { generateSlug, serializeData } from "../utils";
import Book from "@/database/models/book.model";
import BookSegment from "@/database/models/book-segment.model";

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

        return {
            success: true,
            data: serializeData(book),
        }
    } catch (e) {
        console.error("Error creating book", e);
        return  {
            success: false,
            error: e
        }
    }
}

export const saveBookSegments = async (bookId: string, clerkId: string, segments: TextSegment[]) => {
    try {
        await connectToDatabase();
        const segmentsToInsert = segments.map(({text, segmentIndex, pageNumber, wordCount}) => ({
            bookId,
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
            error: error,
        }
    }
}