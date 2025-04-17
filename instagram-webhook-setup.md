# Instagram Webhook Setup Guide

## Basic Setup

1. In Meta Developers Console:
   - Callback URL: `https://innventa-chatbot1.replit.app/webhook`
   - Verify Token: `innventa_secure_token`
   - Fields to subscribe to: `messages`, `messaging_postbacks`

## Error Troubleshooting

If you encounter "The callback URL or verify token couldn't be validated" error:

1. **Check URL accessibility**: 
   - Ensure your Replit app is running and accessible
   - Try accessing `https://innventa-chatbot1.replit.app/webhook` directly in browser

2. **Verify token match**: 
   - Confirm you're using `innventa_secure_token` exactly as written
   - This is case-sensitive, no spaces

3. **Webhook endpoint issues**:
   - Our endpoint might be missing in the currently running server
   - Try running: `node instagram-webhook.cjs` in a separate terminal
   - This starts the dedicated webhook handler on port 3000

4. **Network/Firewall issues**:
   - Meta's servers need to reach your webhook URL
   - Replit URLs should work, but sometimes have connectivity issues

## Additional Information

- **Test with Meta's Test Button**:
  - After configuring the webhook, use Meta's "Test" button
  - This will send a test request to your webhook

- **Certificate Issues**:
  - Meta requires HTTPS URLs with valid certificates
  - Replit provides this automatically

- **Log Webhook Events**:
  - Set `DEBUG=true` environment variable for more verbose logging
  - Check console logs when Meta tries to verify your webhook

## Callback URL Format Options

- Root URL: `https://innventa-chatbot1.replit.app/`
- Webhook path: `https://innventa-chatbot1.replit.app/webhook`
- Instagram specific: `https://innventa-chatbot1.replit.app/instagram`

Try each of these formats if one doesn't work.