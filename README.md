# Philosophia — A Philosophical Blog Platform

A production-ready, full-stack blog focused on philosophical content, built with **Next.js 15**, **PostgreSQL/Prisma**, **NextAuth v5**, **OpenAI GPT-4o**, and **Cloudinary**.

---

## Features

| Feature | Details |
|---|---|
| **Auth** | Google, Facebook, email/password via NextAuth v5 |
| **Rich Editor** | TipTap WYSIWYG with image upload |
| **AI Summary** | Per-post GPT-4o summaries, cached in DB |
| **AI Assistant** | Floating "Logos" chat widget, context-aware |
| **Reading Mode** | Distraction-free view, text highlighting (5 colors), paint canvas overlay |
| **Comments** | Threaded, anonymous + authenticated, upvotable |
| **Upvotes** | Posts & comments, IP fallback for anonymous |
| **Suggestions** | Edit proposals stored for admin review |
| **Search** | Full-text + filters: category, genre, humour, tag, date range, sort |
| **Hot Topics** | Dynamic daily trending section |
| **Newsletter** | Email subscription + Mailchimp sync |
| **Analytics** | Plausible.io + Google Analytics (env-toggled) |
| **Dark Mode** | System default + manual toggle via `next-themes` |
| **Image Upload** | Cloudinary auto-resize (covers, avatars, inline) |
| **Admin Panel** | Dashboard, stats, pending suggestions, post management |
| **Taxonomy** | Categories, Genre, Tags, Humours (custom philosophical taxonomy) |
| **SEO** | Dynamic metadata, OpenGraph, breadcrumbs, JSON-LD ready |
| **Accessibility** | ARIA labels, keyboard navigation, alt text |

---

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/your-repo/philosophia.git
cd philosophia
npm install
```

### 2. Environment variables

```bash
cp .env.example .env.local
```

Fill in every variable in `.env.local` (see the table below).

### 3. Set up the database

Make sure your PostgreSQL instance is running and `DATABASE_URL` is set, then:

```bash
npx prisma migrate dev --name init   # creates tables
npx prisma db seed                   # seeds categories, humours, and a demo admin
```

The seed creates:
- **Admin account**: `admin@philosophia.blog` / `admin123!` (change immediately in production)
- 5 categories, 4 humours, 15 tags, 1 sample post

### 4. Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | ✅ | Random 32-byte secret (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | ✅ | Full URL of your site (`http://localhost:3000` in dev) |
| `GOOGLE_CLIENT_ID` | OAuth | Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | OAuth | Google Cloud Console |
| `FACEBOOK_CLIENT_ID` | OAuth | Meta Developer Portal |
| `FACEBOOK_CLIENT_SECRET` | OAuth | Meta Developer Portal |
| `OPENAI_API_KEY` | AI | OpenAI platform — GPT-4o |
| `CLOUDINARY_CLOUD_NAME` | Images | Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | Images | Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | Images | Cloudinary dashboard |
| `PLAUSIBLE_DATA_DOMAIN` | Analytics | Your domain in Plausible |
| `GOOGLE_ANALYTICS_ID` | Analytics | GA4 Measurement ID (G-XXXXX) |
| `MAILCHIMP_API_KEY` | Newsletter | Mailchimp API key |
| `MAILCHIMP_LIST_ID` | Newsletter | Audience list ID |
| `SMTP_HOST` | Email | SMTP server host |
| `SMTP_PORT` | Email | SMTP port (587) |
| `SMTP_USER` | Email | SMTP username |
| `SMTP_PASS` | Email | SMTP password |
| `SMTP_FROM` | Email | Sender address |

---

## OAuth Setup

### Google

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project → APIs & Services → Credentials → OAuth 2.0 Client ID
3. Authorized redirect URI: `https://your-domain.com/api/auth/callback/google`
4. Copy Client ID and Secret to `.env.local`

### Facebook

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create an app → Facebook Login → Settings
3. Valid OAuth Redirect URI: `https://your-domain.com/api/auth/callback/facebook`
4. Copy App ID and App Secret to `.env.local`

---

## Project Structure

```
philosophia/
├── prisma/
│   ├── schema.prisma         # Full database schema
│   └── seed.ts               # Seed script
├── src/
│   ├── app/
│   │   ├── layout.tsx        # Root layout (themes, analytics, AI widget)
│   │   ├── page.tsx          # Homepage
│   │   ├── not-found.tsx     # Custom 404
│   │   ├── about/            # About page
│   │   ├── blog/
│   │   │   ├── page.tsx      # Blog index with filters
│   │   │   └── [slug]/       # Article page
│   │   ├── search/           # Full-text search
│   │   ├── profile/          # User profile
│   │   ├── auth/
│   │   │   ├── signin/       # Custom sign-in page
│   │   │   └── register/     # Registration page
│   │   ├── admin/
│   │   │   ├── dashboard/    # Admin overview
│   │   │   └── editor/       # TipTap rich-text editor
│   │   └── api/
│   │       ├── auth/         # NextAuth handler + registration
│   │       ├── posts/        # CRUD + summarize
│   │       ├── comments/     # Threaded comments
│   │       ├── upvotes/      # Post + comment upvotes
│   │       ├── highlights/   # Saved text highlights
│   │       ├── suggestions/  # Edit proposals
│   │       ├── newsletter/   # Subscription + Mailchimp
│   │       ├── upload/       # Cloudinary image upload
│   │       ├── categories/   # Category listing
│   │       ├── humours/      # Humour listing
│   │       └── ai/chat/      # AI assistant endpoint
│   ├── components/
│   │   ├── layout/           # Header, Footer, Breadcrumbs
│   │   ├── blog/             # PostCard, PostGrid, ArticleContent, etc.
│   │   ├── home/             # Hero, FeaturedPost, HotTopics, Newsletter, etc.
│   │   ├── comments/         # CommentSection
│   │   ├── reading/          # ReadingToolbar, PaintCanvas
│   │   ├── ai/               # AIChatWidget, AISummaryButton
│   │   ├── auth/             # SessionWrapper
│   │   └── ui/               # Clock, etc.
│   ├── hooks/
│   │   └── useReadingMode.tsx # Reading mode context
│   ├── lib/
│   │   ├── prisma.ts         # Singleton Prisma client
│   │   ├── auth.ts           # NextAuth config
│   │   ├── openai.ts         # AI utilities
│   │   └── cloudinary.ts     # Image upload utilities
│   └── types/
│       └── index.ts          # Shared TypeScript types
├── .env.example
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

---

## Deploying to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy (follow prompts)
vercel

# Set environment variables
vercel env add DATABASE_URL production
# ... repeat for all variables
```

**Recommended Vercel settings:**
- Build command: `prisma generate && next build`
- Output directory: `.next`
- Node.js version: 20.x

**Database:** Use [Supabase](https://supabase.com) or [Neon](https://neon.tech) for a managed PostgreSQL that works well with Vercel.

After deployment, run migrations:
```bash
npx prisma migrate deploy
```

---

## AI Assistant (Logos) — Prompt Engineering

The assistant system prompt is in `src/lib/openai.ts` (`chatWithAssistant`).

**Key design decisions:**
- Named "Logos" after the Greek concept of reason and discourse
- Socratic in tone — asks questions, doesn't preach
- Context-aware: receives the current post title and excerpt so it can discuss the article specifically
- Capped at 150–200 words per reply to stay conversational
- Conversation history is trimmed to the last 20 messages to control token costs

**To customise the persona**, edit the `systemPrompt` string inside `chatWithAssistant()`.

**AI Recommendations** (`getAIRecommendations()`) use GPT-4o to rank candidates by thematic similarity, with a tag-overlap fallback if the API call fails.

---

## Backup Strategy

### Database backup (automated)

```bash
# Add to cron — daily at 2 AM
0 2 * * * pg_dump "$DATABASE_URL" | gzip > /backups/philosophia_$(date +%Y%m%d).sql.gz

# Retention: keep last 30 days
find /backups -name "*.sql.gz" -mtime +30 -delete
```

For Supabase/Neon, enable their built-in PITR (Point-in-Time Recovery) in the dashboard.

### Media backup (Cloudinary)

Cloudinary provides its own backup. Additionally, sync to S3:

```bash
# Using Cloudinary CLI
cloudinary sync --push /backups/cloudinary s3://your-bucket/philosophia-media
```

Or set up Cloudinary's [automatic backup to S3](https://cloudinary.com/documentation/backup_and_restore) in the console.

---

## Development Commands

```bash
npm run dev              # Start dev server
npm run build            # Production build
npm run lint             # ESLint
npm run prisma:studio    # Visual DB browser
npm run prisma:migrate   # Run pending migrations
npm run prisma:seed      # Seed the database
```

---

## Humours Taxonomy

The four humours are a custom philosophical taxonomy:

| Humour | Character | DB slug | UI Color |
|---|---|---|---|
| **Melancholic** | Dark, introspective, drawn to the absurd | `melancholic` | `#2C3E50` |
| **Sanguine** | Life-affirming, optimistic, meaning-seeking | `sanguine` | `#C0392B` |
| **Choleric** | Passionate, polemical, fiery | `choleric` | `#E67E22` |
| **Phlegmatic** | Calm, systematic, rational | `phlegmatic` | `#27AE60` |

Each post can be assigned a humour. The homepage renders a section per humour, giving the platform its editorial identity.

---

## License

MIT. Use it, fork it, question it.
