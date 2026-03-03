import UploadForm from "@/components/UploadForm"
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Add a new book | Bookies",
  description: "Transform your reading into a conversation with Bookies, the AI-powered book companion. Ask questions, get insights, and explore your books like never before.",
};

const page = () => {
  return (
    <main className="wrapper container">
        <div className="mx-auto max-w-180 space-y-10">
            <section className="flex flex-col gap-5">
                <h1 className="page-title-xl">Add a new book</h1>
                <p className="subtitle">Upload a PDF to generate a new interactive reading session</p>
            </section>
            <UploadForm />
        </div>
    </main>
  )
}

export default page