import { NextResponse } from "next/server";
import { generateWithGemini } from "@/lib/gemini";
import { postGithubComment } from "@/lib/github";
import { getAgentState } from "@/lib/db";
export const maxDuration = 60; // Adds extra time for AI thinking
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Extract GitHub-specific fields from the payload you provided
    const prNumber = body.pull_request?.number || body.number;
    const repo = body.repository?.full_name;
    const diffUrl = body.pull_request?.diff_url;

    // 2. Fetch the actual code diff text from GitHub
    let prDiff = "";
    if (diffUrl) {
      const diffResponse = await fetch(diffUrl);
      prDiff = await diffResponse.text();
    }

    // 3. Fallback for manual dashboard testing
    if (!prDiff && body.prDiff) prDiff = body.prDiff;

    // 4. Validate before hitting Gemini
    if (!prDiff || !repo || !prNumber) {
      return NextResponse.json({ 
        error: "Missing data", 
        debug: { hasDiff: !!prDiff, repo, prNumber } 
      }, { status: 400 });
    }

    // 5. Fetch the Strategic Intent (Thought Signature) from your DB
    const state = await getAgentState("hackathon-demo-1");

    // 6. Gemini Strategic Audit
    const prompt = `
      ROLE: Shadow-PM Strategic Sentinel.
      INTENT: ${state?.strategicIntent || "Follow standard best practices."}
      
      TASK: Review this Diff. Does it violate the intent?
      - Intent: Red buttons, Green navbar.
      - If code uses Yellow/Blue, it's a VIOLATION.

      DIFF:
      ${prDiff.substring(0, 5000)}
    `;

    const brainResult = await generateWithGemini(prompt, {
      thinkingLevel: 'HIGH',
      thoughtSignature: state?.thoughtSignature 
    });

    // 7. Post the result back to GitHub
    const commentBody = `🤖 **Shadow-PM Audit Result**\n\n${brainResult.text}`;
    const githubResponse = await postGithubComment(repo, prNumber, commentBody);

    return NextResponse.json({ 
      success: true, 
      review: brainResult.text,
      githubStatus: "Comment Posted"
    });

  } catch (error: any) {
    console.error("Pipeline Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}