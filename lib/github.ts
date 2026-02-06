// lib/github.ts

export async function postGithubComment(repo: string, prNumber: number, comment: string) {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

  const response = await fetch(
    `https://api.github.com/repos/${repo}/pulls/${prNumber}/reviews`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "User-Agent": "Shadow-PM-Agent"
      },
      body: JSON.stringify({
        body: comment,
        event: "COMMENT", // Or "REQUEST_CHANGES" if it's a strategic violation
      }),
    }
  );

  return response.json();
}