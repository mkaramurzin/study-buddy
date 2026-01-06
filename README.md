# Commonplace Doc Study

A web app that helps you study and internalize your commonplace book entries. Upload PDF documents containing vocabulary, quotes, and phrases, and practice with an AI tutor that uses only your own collected material.

## Features

- **PDF Upload & Processing**: Upload commonplace book PDFs and automatically extract and classify entries
- **AI Classification**: Entries are classified into types: vocab, quote, phrase, thought_wrapper, reflection, etc.
- **Dashboard**: View and filter all your entries by type
- **Practice Chat**: Quiz yourself with an AI that uses only your own entries

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Auth**: Clerk
- **Database**: PostgreSQL via Prisma
- **Styling**: Tailwind CSS
- **AI**: OpenAI API (GPT-4o for classification, GPT-4o-mini for chat)
- **PDF Parsing**: pdf-parse

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env` file with the following:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/commonplace?schema=public"

# OpenAI
OPENAI_API_KEY=sk-...
```

### 3. Set up the database

```bash
# Run migrations
npx prisma migrate dev --name init

# Or push schema directly (for development)
npx prisma db push
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to use the app.

## Deployment

This app is configured for Vercel deployment:

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

For the database, you can use:
- [Neon](https://neon.tech) (serverless PostgreSQL - recommended)
- [Supabase](https://supabase.com)
- [Railway](https://railway.app)

## Usage

1. **Sign in** using Clerk authentication
2. **Upload** a PDF of your commonplace book
3. Wait for AI to **classify** your entries
4. **Browse** your entries in the dashboard
5. **Practice** with the AI chat to quiz yourself

## Entry Types

- `vocab`: Vocabulary words with definitions, examples, synonyms
- `quote`: Quotes with author and context
- `phrase`: Notable phrases with analysis
- `thought_wrapper`: Introductory phrases for ideas
- `reflection`: Personal reflections
- `template`: Structural content (filtered out by default)

## Project Structure

```
app/
├── layout.tsx              # Root layout with Clerk provider
├── page.tsx                # Landing page
├── dashboard/page.tsx      # Entries dashboard
├── upload/page.tsx         # PDF upload page
├── practice/page.tsx       # Chat practice interface
├── sign-in/                # Clerk sign-in
├── sign-up/                # Clerk sign-up
└── api/
    ├── upload/route.ts     # PDF upload processing
    ├── entries/route.ts    # CRUD for entries
    └── chat/route.ts       # AI chat endpoint

lib/
├── db.ts                   # Prisma client
├── pdf-parser.ts           # PDF text extraction
├── segmenter.ts            # Text chunking logic
├── classifier.ts           # OpenAI classification
└── prompts.ts              # LLM prompts

components/
└── entry-card.tsx          # Display entry by type

prisma/
└── schema.prisma           # Database schema
```
