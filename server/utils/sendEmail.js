const axios = require("axios");

const sendEmail = async (to, subject, html) => {
const apiKey = process.env.BREVO_API_KEY;
const fromEmail =
process.env.BREVO_FROM_EMAIL || "[divyasri.kondetis@gmail.com](mailto:divyasri.kondetis@gmail.com)";
const fromName =
process.env.BREVO_FROM_NAME || "NexStack";

if (!apiKey) {
console.error("❌ BREVO_API_KEY is not configured.");

```
return {
  skipped: true,
  reason: "BREVO_API_KEY is not configured on the server.",
};
```

}

try {
const response = await axios.post(
"https://api.brevo.com/v3/smtp/email",
{
sender: {
name: fromName,
email: fromEmail,
},
to: [
{
email: to,
},
],
subject,
htmlContent: html,
},
{
headers: {
accept: "application/json",
"api-key": apiKey,
"content-type": "application/json",
},
timeout: 10000,
}
);

```
const messageId = response.data?.messageId;

if (!messageId) {
  throw new Error("Brevo did not return a message ID.");
}

console.log("✅ Email accepted by Brevo:", messageId);
console.log("📧 To:", to);
console.log("📧 Subject:", subject);

return {
  success: true,
  messageId,
};
```

} catch (error) {
const providerMessage =
error.response?.data?.message ||
error.response?.data?.code ||
error.message;

```
console.error("❌ Brevo email error:", providerMessage);

throw new Error(providerMessage);
```

}
};

module.exports = sendEmail;
