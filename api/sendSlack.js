// export default async function handler(req, res) {
//     if (req.method !== "POST") {
//         return res.status(405).json({ error: "Method Not Allowed" });
//     }

//     const { message } = req.body; // Get message from frontend
//     const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

//     if (!SLACK_WEBHOOK_URL) {
//         return res.status(500).json({ error: "Slack Webhook URL is missing" });
//     }

//     try {
//         const response = await fetch(SLACK_WEBHOOK_URL, {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({ text: message }),
//         });

//         if (!response.ok) throw new Error("Failed to send Slack notification");

//         return res.status(200).json({ success: true, message: "Notification sent!" });
//     } catch (error) {
//         return res.status(500).json({ error: error.message });
//     }
// }
