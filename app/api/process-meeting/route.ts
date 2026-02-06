import { NextResponse } from "next/server";
import {
  generateWithMedia,
  generateWithGemini,
  GeminiResponse,
} from "@/lib/gemini";
import { postToSlack } from "@/lib/slack";
import { saveAgentState } from "@/lib/db";
import { createJiraTicket } from "@/lib/jira";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const video = formData.get("video") as File;
    const text = formData.get("text") as string;
    const existingSignature = (formData.get("signature") as string) || undefined;

    let brainResult: GeminiResponse;

    // Use a more specific prompt to force the "•" format
    const systemPrompt = `
      Extract actionable technical requirements from this input.
      Format each task starting with a "•" bullet point.
      Be concise. Do not include intro/outro text.
      INPUT: ${text || "Analyze this meeting."}
    `;

    if (video && video.size > 0) {
      brainResult = await generateWithMedia(
        systemPrompt,
        video,
        { thinkingLevel: "HIGH", thoughtSignature: existingSignature },
      );
    } else {
      brainResult = await generateWithGemini(
        systemPrompt,
        { thinkingLevel: "HIGH", thoughtSignature: existingSignature },
      );
    }

    const outputText = brainResult.text || "";
    const projectId = "hackathon-demo-1";

    // 1. Save state immediately
    await saveAgentState(projectId, {
      strategicIntent: outputText,
      thoughtSignature: brainResult.thoughtSignature,
    });

    // 2. Advanced Extraction Logic
    const requirements = outputText
      .split("\n")
      .map(line => line.trim())
      // Filter: Must start with a bullet/number AND have actual text content
      .filter((line: string) => {
        const isBullet = /^[-•*\d.]+/.test(line);
        const hasContent = line.replace(/^[-•*\d.]+\s*/, "").length > 5;
        const isNotPlaceholder = !line.includes("[Insert") && !line.includes("Date:");
        return isBullet && hasContent && isNotPlaceholder;
      })
      .map((line: string) => 
        line
          .replace(/^[-•*\d.]+\s*/, "") // Strip bullet
          .replace(/\*\*/g, "")         // Strip bold
          .trim()
      )
      .slice(0, 5);

    console.log("Extracted for Jira:", requirements);

    // 3. Robust Jira Loop
    const jiraResults = [];
    for (const req of requirements) {
      try {
        // Validation: Ensure summary isn't empty or just whitespace
        if (req) {
          const result = await createJiraTicket({
            summary: req.length > 100 ? req.substring(0, 97) + "..." : req,
            description: `Source: Shadow-PM Strategic Sync\nThought Signature: ${brainResult.thoughtSignature}`,
            issueType: "Task", // Ensure your Jira project has "Task" type
          });
          jiraResults.push(result);
        }
      } catch (jiraErr) {
        console.error("Single Jira Ticket Failed:", jiraErr);
        // Continue to next requirement even if one fails
      }
    }

    // 4. Slack Update
    try {
      await postToSlack({
        title: "🚀 Shadow-PM Strategy Sync",
        requirements: requirements.length > 0 ? requirements : ["No specific technical tasks identified."],
        thoughtSignature: brainResult.thoughtSignature,
      });
    } catch (slackErr) {
      console.error("Slack Notification Failed:", slackErr);
    }

    return NextResponse.json({
      text: outputText,
      signature: brainResult.thoughtSignature,
      reasoning: brainResult.reasoning,
      ticketsCreated: jiraResults.length
    });

  } catch (error: any) {
    console.error("Pipeline Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}