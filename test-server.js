import express from "express";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

console.log("🚀 Starting test server...");
console.log("📡 Supabase URL:", process.env.VITE_SUPABASE_URL ? "✅ Set" : "❌ Missing");
console.log("🔑 Slack Bot Token:", process.env.VITE_SLACK_BOT_USER_OAUTH_TOKEN ? "✅ Set" : "❌ Missing");

// Test endpoint
app.get("/test", (req, res) => {
    res.json({ message: "Server is working!", timestamp: new Date().toISOString() });
});

// Slack test endpoint
app.post("/send-dailylog-slack", async (req, res) => {
    console.log("📝 Received request to /send-dailylog-slack");
    console.log("📦 Request body:", req.body);
    
    const { USERID, message, userName } = req.body;
    const SLACK_BOT_TOKEN = process.env.VITE_SLACK_BOT_USER_OAUTH_TOKEN;

    if (!SLACK_BOT_TOKEN) {
        console.log("❌ Slack Bot Token is missing!");
        return res.status(500).json({ error: "Slack Bot Token is missing!" });
    }

    if (!USERID || !message) {
        console.log("❌ USERID or message is missing!");
        return res.status(400).json({ error: "USERID and message are required!" });
    }

    try {
        console.log("🚀 Sending message to Slack...");
        const formattedMessage = `📝 *Daily Log from ${userName || 'Employee'}*\n\n${message}`;
        
        const response = await fetch("https://slack.com/api/chat.postMessage", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${SLACK_BOT_TOKEN}`,
            },
            body: JSON.stringify({
                channel: USERID,
                text: formattedMessage,
            }),
        });

        const data = await response.json();
        console.log("📡 Slack API Response:", data);

        if (!data.ok) {
            console.log("❌ Slack API Error:", data.error);
            throw new Error(data.error);
        }

        console.log("✅ Message sent to Slack successfully!");
        return res.status(200).json({ success: true, message: "Daily log sent to Slack successfully!" });
    } catch (error) {
        console.error("💥 Error sending daily log to Slack:", error);
        return res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Test server running on http://localhost:${PORT}`);
    console.log(`📝 Test endpoint: http://localhost:${PORT}/test`);
    console.log(`📝 Slack endpoint: http://localhost:${PORT}/send-dailylog-slack`);
    console.log(`📡 Server ready for testing!`);
});
