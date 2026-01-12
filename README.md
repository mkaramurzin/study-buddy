# Studybase

A web app that helps you study and internalize knowledge from any field. Upload PDF documents, let AI classify the content, and practice with an AI tutor that uses only your own collected material.

## Features

- **PDF Upload & Processing**: Upload any PDF and automatically extract and classify knowledge entries
- **AI Classification**: Entries are classified into universal types: concept, principle, quote, example, procedure, question, connection, note, reference
- **Dashboard**: View and filter all your entries by type
- **Practice Chat**: Quiz yourself with an AI that uses only your own entries

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Auth & Database**: Supabase
- **ORM**: Prisma (connects to Supabase PostgreSQL)
- **Styling**: Tailwind CSS
- **AI**: OpenAI API (GPT-4o for classification, GPT-4o-mini for chat)
- **PDF Parsing**: unpdf

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env` file with the following:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Database (Supabase PostgreSQL connection string)
DATABASE_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"

# OpenAI
OPENAI_API_KEY=sk-...
```

### 3. Set up the database

```bash
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

## Usage

1. **Sign up or sign in** using email/password
2. **Upload** any PDF document
3. Wait for AI to **classify** your entries
4. **Browse** your entries in the dashboard
5. **Practice** with the AI chat to quiz yourself

## Entry Types

- `concept`: Definitions, terms, ideas from any field
- `principle`: Laws, rules, heuristics, patterns
- `quote`: Memorable statements with attribution
- `example`: Concrete instances, case studies, worked problems
- `procedure`: Step-by-step methods, algorithms, processes
- `question`: Problems to solve, research questions
- `connection`: Analogies, links between ideas
- `note`: Freeform observations, reflections
- `reference`: Pointers to external sources
- `template`: Structural content (filtered out by default)

## Project Structure

```
app/
├── layout.tsx              # Root layout
├── page.tsx                # Landing page
├── dashboard/page.tsx      # Entries dashboard
├── upload/page.tsx         # PDF upload page
├── practice/page.tsx       # Chat practice interface
├── sign-in/page.tsx        # Sign-in form
├── sign-up/page.tsx        # Sign-up form
├── auth/callback/route.ts  # OAuth callback handler
└── api/
    ├── upload/route.ts     # PDF upload processing
    ├── entries/route.ts    # CRUD for entries
    ├── quiz/route.ts       # Quiz entries endpoint
    └── chat/route.ts       # AI chat endpoint

lib/
├── db.ts                   # Prisma client
├── supabase/
│   ├── client.ts           # Browser Supabase client
│   └── server.ts           # Server Supabase client
├── pdf-parser.ts           # PDF text extraction
├── segmenter.ts            # Text chunking logic
├── classifier.ts           # OpenAI classification
└── prompts.ts              # LLM prompts

components/
├── entry-card.tsx          # Display entry by type
├── user-menu.tsx           # User dropdown menu
├── quiz-setup.tsx          # Quiz configuration
├── quiz-session.tsx        # Active quiz component
└── quiz-results.tsx        # Quiz results display

prisma/
└── schema.prisma           # Database schema
```
