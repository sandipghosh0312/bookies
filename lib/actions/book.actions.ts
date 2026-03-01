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

        const slug = generateSlug(title);

        const existingBook = await Book.findOne({ slug }).lean();

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

        const slug = generateSlug(data.title);

        const existingBook = await Book.findOne({ slug }).lean();

        if (existingBook) {
            return {
                success: false,
                data: serializeData(existingBook),
                alreadyExists: true,
            }
        }

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

        await BookSegment.insertMany(segmentsToInsert);

        await Book.findByIdAndUpdate(bookId, { totalSegments: segments.length });

        return {
            success: true,
            data: { segmentsInserted: segments.length },
        }

        await BookSegment.insertMany(segmentsToInsert);

        const updatedBook = await Book.findByIdAndUpdate(bookId, { totalSegments: segments.length }, { new: true });

        return {
            success: true,
            data: serializeData(updatedBook),
        }
    } catch (error) {
        console.error("Error saving book segments", error);

        await BookSegment.deleteMany({ bookId });
        await Book.findByIdAndDelete(bookId);
        return {
            success: false,
            error: error,
        }
    }
}