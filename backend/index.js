import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const GITHUB_USERNAME = process.env.GITHUB_USERNAME;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// Ensure environment variables are set
if (!GITHUB_USERNAME || !GITHUB_TOKEN) {
  console.error("❌ Missing GITHUB_USERNAME or GITHUB_TOKEN in .env file");
  process.exit(1); // Exit if required env vars are missing
}

// Fetch GitHub Deployments
app.get("/deployments", async (req, res) => {
  try {
    console.log("Fetching GitHub deployments...");

    const response = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/events`, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json"
      }
    });

    console.log("GitHub API Status:", response.status);
    console.log("GitHub Rate Limit Remaining:", response.headers.get("X-RateLimit-Remaining"));

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ GitHub API Error:", errorText);
      throw new Error(`GitHub API request failed with status ${response.status}`);
    }

    const events = await response.json();

    // Filter deployment-related events
    const deployments = events
      .filter(event => event.type === "DeploymentEvent")
      .map(event => ({
        id: event.id,
        repo: event.repo.name,
        status: event.payload?.deployment_status?.state || "unknown",
        created_at: event.created_at
      }));

    if (deployments.length === 0) {
      console.warn("⚠️ No deployments found in GitHub events.");
    }

    res.json(deployments);
  } catch (error) {
    console.error("❌ Error fetching deployments:", error.message);
    res.status(500).json({ error: "Failed to fetch GitHub deployments" });
  }
});

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
