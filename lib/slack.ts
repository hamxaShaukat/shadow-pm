// lib/slack.ts

export async function postToSlack(content: {
  title: string;
  requirements: string[];
  thoughtSignature?: string;
}) {
  const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

  if (!SLACK_WEBHOOK_URL) {
    console.error("Missing NEXT_PUBLIC_SLACK_WEBHOOK_URL");
    return;
  }

  // Formatting using Slack Block Kit for that "2026 Agent" aesthetic
  const blocks = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `🚀 Shadow-PM: ${content.title}`,
        emoji: true,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*Requirements Extracted from Video:*",
      },
    },
    {
      type: "section",
      fields: content.requirements.map((req) => ({
        type: "mrkdwn",
        text: `• ${req}`,
      })),
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `🧠 *Thought Signature:* \`${content.thoughtSignature || "NEW_SESSION"}\``,
        },
      ],
    },
  ];

  try {
    await fetch(SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blocks }),
    });
  } catch (error) {
    console.error("Slack Notification Error:", error);
  }
}