import BookCard from "@/components/BookCard"
import HeroSection from "@/components/HeroSection"
import { getAllBooks } from "@/lib/actions/book.actions"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export const dynamic = 'force-dynamic';

type PageProps = {
  searchParams ?: Promise <{
    q?: string | string[]
  }>
}

const page = async ({ searchParams }: PageProps) => {
  const params = await searchParams;
  const rawQ = params?.q;
  const searchQuery = Array.isArray(rawQ) ? (rawQ[0] ?? "") : (rawQ ?? "");

  const bookResults = await getAllBooks(searchQuery);
  const books = bookResults.success ? bookResults.data ?? [] : [];

  return (
    <main className="wrapper container">
      <HeroSection />

      <section className="mt-8 space-y-4">
        <div className="flex flex-col gap-3 justify-between md:flex-row md:items-center">
          <h2 className="text-lg font-semibold md:text-xl">
            Recent books
          </h2>

          <form
            action="/"
            method="GET"
            className="flex w-full max-w-sm items-center gap-2 md:justify-end"
          >
            <Input
              name="q"
              placeholder="Search by title or author (Press enter to search)"
              defaultValue={searchQuery}
              className="w-full bg-white"
            />
              <button type="submit" className="outline-1 p-1 px-5 rounded bg-white font-medium cursor-pointer">
                  Search
              </button>
          </form>
        </div>

        <div className="library-books-grid">
          {books.map((book) => (
            <BookCard
              key={book._id}
              title={book.title}
              author={book.author}
              coverURL={book.coverURL}
              slug={book.slug}
            />
          ))}
        </div>
      </section>
    </main>
  )
}

export default page