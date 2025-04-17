# Instagram Webhook Troubleshooting Guide

## Common Issues and Solutions

### 1. "The callback URL or verify token couldn't be validated" Error

#### Verify Your URL
- Make sure your Render service is up and running
- Check that the URL is correctly formatted: `https://innventachat-ai.onrender.com/webhook`
- Try opening the webhook URL directly in your browser - you should receive a response

#### Verify Token Issues
- Ensure the token is exactly `innventa_secure_token` - it's case-sensitive
- Check that the token in your Render environment variables matches exactly
- Verify there are no extra spaces or special characters

#### Debug Response Issues
- Check Render logs for incoming verification requests
- Look for log lines that show `Received webhook verification request`
- If you see `WEBHOOK_VERIFIED - Success!` but still get errors, Meta might have connectivity issues

### 2. Webhook Not Receiving Events

#### Subscription Issues
- Ensure you've subscribed to the correct fields: `messages`, `messaging_postbacks`
- Verify your subscriptions in the Meta Developer Portal

#### Permission Issues
- Check if your app has the necessary permissions
- You might need to complete the App Review process

### 3. Render Deployment Issues

#### Build Failures
If you're seeing build failures:
1. Check if the error is related to missing dependencies
2. Review the logs for specific error messages
3. Try using the alternative server file: `node render-free-tier.js`

#### Connection Timeouts
If Meta can't reach your webhook:
1. Verify your service is not in "Sleep Mode" (on free tier)
2. Enable the keepalive functionality (already implemented in render-free-tier.js)
3. Use an external monitoring service like UptimeRobot to ping your app

## Diagnostic Steps

### 1. Check Service Status
```
curl https://innventachat-ai.onrender.com/health
```
Expected response: JSON with status information including webhook configuration

### 2. Test Webhook Manually
```
curl "https://innventachat-ai.onrender.com/webhook?hub.mode=subscribe&hub.verify_token=innventa_secure_token&hub.challenge=test_challenge"
```
Expected response: The text "test_challenge" 

### 3. View Logs in Render Dashboard
- Go to your service in the Render dashboard
- Click on "Logs" to see real-time logs
- Look for webhook verification attempts

## Additional Resources

- [Meta Webhooks Documentation](https://developers.facebook.com/docs/graph-api/webhooks/getting-started)
- [Render Environment Documentation](https://render.com/docs/environment-variables)
- [Instagram Messaging API](https://developers.facebook.com/docs/messenger-platform/instagram)