import { NextResponse } from "next/server";
import { generateWithGemini } from "@/lib/gemini";
import { postGithubComment } from "@/lib/github";

export async function POST(req: Request) {
  try {
    const { prDiff, repo, prNumber, thoughtSignature } = await req.json();

    if (!prDiff || !repo || !prNumber) {
      return NextResponse.json({ error: "Missing required PR data" }, { status: 400 });
    }

    // Context-Aware Prompt for Shadow-PM
    const prompt = `
      ROLE: You are Shadow-PM, the strategic guardian of this project.
      CONTEXT: You have been provided with a Thought Signature representing our meeting decisions.
      
      TASK:
      1. Review the following Code Diff.
      2. Cross-reference it with the strategic intent stored in your signature.
      3. Identify "Strategic Drift" (e.g., using a library we explicitly rejected, or skipping a requirement we prioritized).
      
      FORMAT:
      - Start with a "Strategic Alignment" score (High/Med/Low).
      - List specific concerns as bullet points.
      - Keep it brief, professional, and firm.

      PR DIFF:
      ${prDiff.substring(0, 10000)} // Safety truncation to stay within token limits
    `;

    // 🧠 The "Magic" Turn: Resuming the train of thought
    let reviewText = "";
    try {
      const brainResult = await generateWithGemini(prompt, {
        thinkingLevel: 'HIGH',
        thoughtSignature: thoughtSignature 
      });
      reviewText = brainResult.text;
    } catch (sigError) {
      console.warn("Signature session expired, falling back to zero-shot review.");
      const fallbackResult = await generateWithGemini(prompt, { thinkingLevel: 'MEDIUM' });
      reviewText = `⚠️ *Note: Session memory expired, reviewing based on current diff:* \n\n${fallbackResult.text}`;
    }

    // 🚀 Action Era: Post the result as a comment on the GitHub PR
    const githubResponse = await postGithubComment(repo, prNumber, reviewText);

    return NextResponse.json({ 
      success: true, 
      review: reviewText,
      githubStatus: githubResponse.id ? "Comment Posted" : "Failed to Post"
    });

  } catch (error: any) {
    console.error("PR Review Pipeline Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}