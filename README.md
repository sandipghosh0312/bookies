# 📚 Bookies

An AI-powered Next.js application that allows users to upload books (PDF), process them into structured segments, and interact with them through intelligent voice sessions.

Built with modern full-stack architecture using Next.js, Clerk authentication, MongoDB, and Vapi for real-time voice AI.

---

## 🚀 Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Authentication:** Clerk
- **Database:** MongoDB (Mongoose ODM)
- **Voice AI:** Vapi
- **Styling:** Tailwind CSS
- **Deployment:** Vercel (recommended)

---

## ✨ Features

- 🔐 Secure authentication via Clerk
- 📖 PDF book upload and content segmentation
- 🧠 AI-powered voice conversations with books (via Vapi)
- 📊 Subscription-based usage limits
- 🗓 Billing-period-based session tracking
- ☁️ Production-ready architecture

---

## 🏗 Project Structure

```
app/                → Next.js App Router
lib/                → Server utilities (subscriptions, helpers, etc.)
database/models/    → Mongoose models
components/         → UI components
```

---

## 🔒 Subscription Logic

Subscription limits are enforced securely on the server:

- Book creation limits
- Monthly voice session limits
- Maximum session duration per plan

All checks derive the authenticated user directly from Clerk server helpers to prevent impersonation or quota bypass.

---

## ⚙️ Environment Variables

Create a `.env.local` file in the root:

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key
CLERK_SECRET_KEY=your_secret_key

# MongoDB
MONGODB_URI=your_connection_string

# Vercel Blob
BLOB_READ_WRITE_TOKEN=your_blob_token

# Vapi
NEXT_PUBLIC_ASSISTANT_ID=your_assistant_id
NEXT_PUBLIC_VAPI_API_KEY=your_vapi_key
```

---

## 🛠 Installation

```bash
git clone https://github.com/sandipghosh0312/bookies.git
cd bookies
npm install
```

Run the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
npm start
```

---

## 🧠 How It Works

1. User authenticates with Clerk.
2. A PDF book is uploaded.
3. The server:
   - Stores book metadata in MongoDB.
   - Segments book content into structured chunks.
4. Users initiate AI-powered voice sessions via Vapi.
5. Subscription limits are enforced server-side.

---

## 🔐 Security Notes

- Clerk identity is always derived from server-side `auth()`.
- Client-provided `clerkId` is never trusted.
- Subscription limits are enforced using authenticated context only.
- Billing period tracking prevents session abuse.

---

## 📦 Deployment

Recommended platform: **Vercel**

1. Connect GitHub repository
2. Add environment variables
3. Deploy

Ensure MongoDB network access allows your deployment region.

---

## 🧑‍💻 Sandip Ghosh

Built for learning, full-stack development, and AI-powered applications.

---