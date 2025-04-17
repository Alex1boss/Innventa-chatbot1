# Instagram Chatbot Integration Guide

This guide provides detailed instructions for connecting your Innventa AI chatbot to Instagram DMs.

## Prerequisites

- Meta Developer account with an app created
- Instagram Business or Creator account
- Facebook Page linked to your Instagram account
- Deployed webhook at https://innventachat-ai.onrender.com

## Setup Steps

### 1. Get Instagram Access Token

1. In Meta Developer Dashboard, select your app (Innventa chatbot)
2. Under "Products" > "Instagram" > "Basic Display"
3. Click "Generate Token" or "Create New Token"
4. Select your Instagram Business Account
5. Choose the permissions: `instagram_basic` and `instagram_manage_messages`
6. Copy the generated token (this is your `INSTAGRAM_ACCESS_TOKEN`)

### 2. Add Required Environment Variables to Render

In your Render dashboard:
1. Select your "innventachat-ai" service
2. Navigate to the "Environment" tab
3. Add these environment variables:
   ```
   INSTAGRAM_ACCESS_TOKEN=[your token from step 1]
   INSTAGRAM_APP_ID=65370229413876
   INSTAGRAM_APP_SECRET=[your app secret from Meta dashboard]
   ```
4. Click "Save Changes" and wait for service to redeploy

### 3. Test the Integration

#### Debug Your Instagram Token
1. After deploying and setting up your environment variables, visit:
   ```
   https://innventachat-ai.onrender.com/debug/instagram
   ```
2. This endpoint will verify if your Instagram access token is working correctly
3. You should see a JSON response with token information and permissions
4. If you see any errors, double-check your token in the Render environment variables

#### Webhook Verification Test
1. In Meta Dashboard, go to "Products" > "Webhooks"
2. Click the "Test" button next to your webhook subscription
3. This sends a verification request to your webhook endpoint
4. Check Render logs to see if verification was successful

#### Send Test Message
1. Open Instagram on your mobile device
2. Send a direct message to your business account
3. Check Render logs for:
   - "Received webhook event:" log entry
   - "Processing Instagram message event:" entry
   - "Sending message to [ID]:" message showing the response

## Webhook Payload Structure

When someone sends a message to your Instagram business account, the webhook receives a payload like this:

```json
{
  "object": "instagram",
  "entry": [
    {
      "id": "123456789",
      "time": 1603119068,
      "messaging": [
        {
          "sender": {
            "id": "USER_ID"
          },
          "recipient": {
            "id": "PAGE_ID"
          },
          "timestamp": 1603119068,
          "message": {
            "mid": "MESSAGE_ID",
            "text": "Hello, chatbot!"
          }
        }
      ]
    }
  ]
}
```

Our webhook handler extracts the sender ID and message text, generates a response, and sends it back to the user.

## Troubleshooting

### Common Issues:

#### 1. Webhook Verification Failing
- Verify the `VERIFY_TOKEN` matches exactly: `innventa_secure_token`
- Check if Render service is running
- Try manually testing the webhook URL with curl:
  ```
  curl "https://innventachat-ai.onrender.com/webhook?hub.mode=subscribe&hub.verify_token=innventa_secure_token&hub.challenge=test_challenge"
  ```

#### 2. Not Receiving Messages
- Confirm you subscribed to the `messages` field
- Verify that your business account has messaging enabled
- Check if you have the necessary permissions in your app

#### 3. Sending Messages Fails
- Verify your `INSTAGRAM_ACCESS_TOKEN` is correct and not expired
- Check that your app has the `instagram_manage_messages` permission
- Look for error responses in the Render logs

## Advanced Features

To enhance the chatbot with more capabilities:

### Add More Response Patterns
Edit the `simpleResponses` object in `render-free-tier.js` to add more predefined answers to common questions.

### Integrate AI Responses
The chatbot is designed to work with OpenAI and Gemini APIs. Set the API keys in Render environment variables to enable AI-generated responses.

### Add Quick Replies
For a better user experience, you can modify the code to include quick replies in responses. This requires adding a `quick_replies` property to the message payload.

## Reference Links

- [Instagram Messaging API Documentation](https://developers.facebook.com/docs/messenger-platform/instagram)
- [Meta Webhooks Documentation](https://developers.facebook.com/docs/graph-api/webhooks)
- [Render Documentation](https://render.com/docs)