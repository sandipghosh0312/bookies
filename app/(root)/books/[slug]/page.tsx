import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { getBookBySlug } from '@/lib/actions/book.actions';
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner';
import VapiControls from '@/components/VapiControls';

interface BookPageProps {
    params: Promise<{
        slug: string;
    }>;
}

export default async function BookPage({ params }: BookPageProps) {
    // Require authentication
    const { userId } = await auth();

    if (!userId) {
        redirect('/');
        toast.error('You must be signed in to talk to the book');
    }

    const { slug } = await params;
    const result = await getBookBySlug(slug);

    // Redirect if book not found
    if (!result.success || !result.data) {
        redirect('/');
    }

    const book = result.data;

    return (
        <div className="book-page-container wrapper containe">
            {/* Floating back button */}
            <a
                href="/"
                className="back-btn-floating"
                aria-label="Go back"
            >
                <ArrowLeft size={20} className="text-[#212a3b]" />
            </a>

            <VapiControls book={book} />
        </div>
    );
}
