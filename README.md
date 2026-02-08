# Shadow-PM

Shadow-PM is a Next.js 16 app that automates extracting technical requirements from meeting audio/video (via Google Gemini), saves strategic intent to Firestore, creates Jira tickets, posts updates to Slack, and performs automated strategic PR reviews by posting results to GitHub.

**Quick overview**
- **AI**: Google Gemini (via @google/genai) for text and media understanding.
- **Persistence**: Firebase Firestore (see `lib/firebase.ts`).
- **Integrations**: Jira, Slack, GitHub (helper modules in `lib/`).
- **API**: Server routes under `app/api/` implement the ingestion and review pipelines.

**Prerequisites**
- Node.js 18+ (recommended)
- npm or yarn
- Google Gemini API access (API key)
- Firebase project and Firestore
- Jira account with API token (if using Jira integration)
- Slack incoming webhook URL (if using notifications)
- GitHub personal access token with repo permissions (if using PR comments)

**Install**

```bash
npm install
# or
yarn install
```

**Local development**

Create a `.env.local` file in the project root (this file must NOT be committed).

### Step 1: Get Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or select an existing one
3. Click the **Settings icon** (gear) in the top-left
4. Go to **Project settings** tab
5. Under **Your apps** section, select your web app or create a new one
6. Copy the following values from the Firebase config:
   - `FIREBASE_API_KEY`
   - `FIREBASE_AUTH_DOMAIN`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_STORAGE_BUCKET`
   - `FIREBASE_MESSAGING_SENDER_ID`
   - `FIREBASE_APP_ID`
7. (Optional) Copy `MEASUREMENT_ID` from Google Analytics (if enabled)

### Step 2: Get Google Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click **Create API key**
3. Copy the API key and save it as `GOOGLE_GEMINI_API_KEY`
4. Make sure the Gemini API is enabled in [Google Cloud Console](https://console.cloud.google.com)

### Step 3: Get GitHub Personal Access Token

1. Go to [GitHub Settings → Personal access tokens](https://github.com/settings/tokens)
2. Click **Generate new token** (classic)
3. Give it a name like "shadow-pm"
4. Select these scopes:
   - `repo` (full control of private repositories)
   - `workflow` (update GitHub Actions and workflows)
5. Click **Generate token** and copy the token as `GITHUB_TOKEN`
6. ⚠️ **Important**: Save this token securely—you'll only see it once!

### Step 4: Get Slack Webhook URL

1. Go to [Slack API Console](https://api.slack.com/apps)
2. Create a new app or select an existing one
3. Go to **Incoming Webhooks** (in the left sidebar)
4. Click **Add New Webhook to Workspace**
5. Select the channel where Shadow-PM notifications should appear
6. Copy the Webhook URL and save it as `SLACK_WEBHOOK_URL`

### Step 5: Get Jira Credentials

1. Go to [Atlassian API Tokens](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Click **Create API token**
3. Give it a name and click **Create**
4. Copy the token and save it as `JIRA_API_TOKEN`
5. Your `JIRA_DOMAIN` is your company's Jira URL (e.g., `yourcompany.atlassian.net`)
6. Your `JIRA_USER_EMAIL` is your Atlassian account email
7. Your `JIRA_PROJECT_KEY` is the key of your project (e.g., `SCRUM`, `PROJ`)
   - Find it in your Jira project settings or on the project page

### Step 6: Create `.env.local` File

Create a `.env.local` file in the project root with all the variables:

```
# Firebase
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=1234567890
FIREBASE_APP_ID=1:123:web:abcdef
MEASUREMENT_ID=G-XXXXXXXXXX

# Google Gemini
GOOGLE_GEMINI_API_KEY=sk-xxx

# GitHub (used for posting PR reviews/comments)
GITHUB_TOKEN=ghp_xxx

# Jira
JIRA_DOMAIN=yourcompany.atlassian.net
JIRA_USER_EMAIL=you@company.com
JIRA_API_TOKEN=jira_api_token
JIRA_PROJECT_KEY=PROJ

# Slack
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/XXX/YYY/ZZZ
```

### Step 7: Configure GitHub Webhooks (IMPORTANT - Do This Before Running Dev Server)

For each repository you want Shadow-PM to manage, follow these steps:

1. Go to your **GitHub repository**
2. Click **Settings** tab
3. In the left sidebar, click **Webhooks**
4. Click **Add webhook** button
5. In the **Payload URL** field, enter:
   ```
   https://your-domain.com/api/github-webhook
   ```
   - Replace `your-domain.com` with your actual deployed URL
   - For **local development**, use a tunneling service like [ngrok](https://ngrok.com) to expose your local server:
     ```bash
     ngrok http 3000
     ```
     Then use the ngrok URL: `https://xxxxx.ngrok.io/api/github-webhook`

6. Set **Content type** to: `application/json`
7. Leave **Secret** empty (or add one if you modify the webhook handler)
8. Under **Which events would you like to trigger this webhook?**:
   - Select **Let me select individual events**
   - ✅ Check **Pull requests**
   - ✅ Check **Issues**
   - Uncheck everything else
9. Make sure the **Active** checkbox is checked
10. Click **Add webhook**

Shadow-PM will now automatically receive PR and issue events from this repository!

**Notes:**
- The project reads environment variables from `process.env` in server code (`lib/` modules). Put them in `.env.local` when developing locally.
- Do NOT commit `.env.local` or any secret to source control.
- All secrets should be added to `.gitignore` (Next.js default ignores `.env.local` automatically).

Setting environment variables on Windows (example):

```powershell
# For current shell (temporary):
$env:GOOGLE_GEMINI_API_KEY = "sk-..."
# For persistent user variable (PowerShell):
setx GOOGLE_GEMINI_API_KEY "sk-..."
```

**Available scripts** (from `package.json`)
- `npm run dev` — start Next.js in development mode
- `npm run build` — build for production
- `npm start` — start the production server (after build)
- `npm run lint` — run ESLint

**How it works (high-level)**
- Ingest: `app/api/process-meeting/route.ts` accepts either a video upload or plain text and sends it to Gemini (`lib/gemini.ts`). It extracts up to the top 5 technical requirements, saves the strategic intent and `thoughtSignature` to Firestore via `lib/db.ts`, creates Jira tickets via `lib/jira.ts`, and posts a Slack summary via `lib/slack.ts`.
- PR Review: `app/api/review-pr/route.ts` and `app/api/github-webhook/route.ts` use the saved strategic intent to ask Gemini to audit a PR diff and (optionally) post a comment to GitHub via `lib/github.ts`.
- Firestore schema: documents live in the `projects` collection; the code uses a `projectId` (example: `hackathon-demo-1`) to store `strategicIntent`, `thoughtSignature`, and `updatedAt`.

**Key files**
- [lib/gemini.ts](lib/gemini.ts) — Google Gemini helpers, retry logic, media upload flow
- [lib/firebase.ts](lib/firebase.ts) — Firebase initialization
- [lib/db.ts](lib/db.ts) — Firestore helpers to save/get agent state
- [lib/jira.ts](lib/jira.ts) — Jira ticket creation helper
- [lib/slack.ts](lib/slack.ts) — Slack webhook poster
- [lib/github.ts](lib/github.ts) — GitHub PR comment poster
- [lib/github-reviewer.ts](lib/github-reviewer.ts) — Sentinel prompt used for PR strategic review
- [app/api/process-meeting/route.ts](app/api/process-meeting/route.ts) — main ingestion endpoint
- [app/api/review-pr/route.ts](app/api/review-pr/route.ts) — manual PR review endpoint
- [app/api/github-webhook/route.ts](app/api/github-webhook/route.ts) — GitHub webhook handler

**Environment variables (full list)**
- `FIREBASE_API_KEY` — Firebase API key
- `FIREBASE_AUTH_DOMAIN` — Firebase auth domain
- `FIREBASE_PROJECT_ID` — Firebase project id
- `FIREBASE_STORAGE_BUCKET` — Firebase storage bucket
- `FIREBASE_MESSAGING_SENDER_ID` — Firebase messaging id
- `FIREBASE_APP_ID` — Firebase app id
- `GOOGLE_GEMINI_API_KEY` — Google Gemini API key used by `lib/gemini.ts`
- `GITHUB_TOKEN` — GitHub personal access token (used to post PR reviews/comments)
- `JIRA_DOMAIN` — Jira domain (example: yourcompany.atlassian.net)
- `JIRA_USER_EMAIL` — Jira account email for API authentication
- `JIRA_API_TOKEN` — Jira API token
- `JIRA_PROJECT_KEY` — Jira project key where tickets will be created
- `SLACK_WEBHOOK_URL` — Slack incoming webhook URL for notifications

If you change variable names in code, update this list accordingly.

**Security and best practices**
- Never commit secrets. Add `.env.local` to `.gitignore` (Next.js default ignores it).
- Limit scopes of `GITHUB_TOKEN` to only what's necessary (repo:discussion, repo:status, or repo depending on needs).
- Rotate API keys/tokens if they are compromised.

**Deployment**
- Vercel: Add all environment variables under Project Settings -> Environment Variables. Set appropriate values for `Preview` and `Production`.
- Other hosts: set environment variables in the host's dashboard or use a secrets manager.

**Troubleshooting**
- If Firestore connection fails, verify all `FIREBASE_*` values and that Firestore is enabled in the Firebase console.
- If Gemini calls fail, confirm `GOOGLE_GEMINI_API_KEY` is valid and you have quota.
- If Slack notifications do not appear, test the webhook separately (e.g., `curl -X POST -H "Content-type: application/json" --data '{"text":"test"}' $SLACK_WEBHOOK_URL`).

**Extending the project**
- Add more robust validation and error reporting around external API calls.
- Add authentication on API routes if exposing to users.
- Add unit/integration tests for each `lib/` module.

**Contact / Contributing**
If you want help extending this project or integrating it with your org, open an issue or reach out to the maintainer.

---
Generated README based on current repository structure and code (Feb 2026).
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
