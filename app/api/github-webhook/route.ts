import { NextResponse } from "next/server";
import { generateWithGemini } from "@/lib/gemini";
import { GITHUB_SENTINEL_PROMPT } from "@/lib/github-reviewer";
import { getAgentState } from "@/lib/db"; // Helper to fetch the signature from Firestore

export async function POST(req: Request) {
  try {
    const { prDiff, prNumber, repoName } = await req.json();

    // 1. Fetch the LATEST strategic state from your database
    const state = await getAgentState("hackathon-demo-1");

    // 2. Ask Gemini to verify the PR against that specific Thought Signature
    const review = await generateWithGemini(
      `${GITHUB_SENTINEL_PROMPT}\n\nSTRATEGIC INTENT: ${state?.strategicIntent}\n\nPR DIFF: ${prDiff}`,
      { 
        thoughtSignature: state?.thoughtSignature, // The "Memory" bridge
        thinkingLevel: "HIGH" 
      }
    );

    const result = JSON.parse(review.text);

    // 3. (Optional) Use Octokit to post the comment back to GitHub
    console.log(`PR #${prNumber} is ${result.status}: ${result.comment}`);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}