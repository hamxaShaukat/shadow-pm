// lib/jira.ts

export async function createJiraTicket(content: {
  summary: string;
  description: string;
  issueType?: "Task" | "Bug" | "Story";
}) {
  const domain = process.env.JIRA_DOMAIN; // e.g., yourcompany.atlassian.net
  const email = process.env.JIRA_USER_EMAIL;
  const apiToken = process.env.JIRA_API_TOKEN;
  const projectKey = process.env.JIRA_PROJECT_KEY; // e.g., "PROJ"

  const auth = Buffer.from(`${email}:${apiToken}`).toString("base64");

  const bodyData = {
    fields: {
      project: { key: projectKey },
      summary: content.summary,
      description: {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [{ text: content.description, type: "text" }],
          },
        ],
      },
      issuetype: { name: content.issueType || "Task" },
    },
  };

  try {
    const response = await fetch(`https://${domain}/rest/api/3/issue`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bodyData),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Jira API Error:", errorData);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Jira Network Error:", error);
    return null;
  }
}