# Social Platform Integrations

This guide covers how to set up and configure LinkedIn and Substack integrations for automated content posting.

## Overview

The Soft Melanin content engine supports posting to:
- **LinkedIn** — Personal profiles and company pages via OAuth 2.0
- **Substack** — Newsletter publications via API key authentication

## LinkedIn Integration

### Prerequisites

To use LinkedIn integration, you need:
1. A LinkedIn account
2. A LinkedIn Developer Application (for OAuth)
3. For company posting: Admin access to the company page

### Creating a LinkedIn Developer App

1. Go to [LinkedIn Developer Portal](https://www.linkedin.com/developers/)
2. Click **Create App**
3. Fill in the required information:
   - App name: "Soft Melanin Content Publisher" (or similar)
   - LinkedIn Page: Select or create a company page
   - App logo: Upload your logo
   - Legal agreement: Accept terms
4. Click **Create App**

### Configuring OAuth

After creating the app:

1. Go to the **Auth** tab
2. Add OAuth 2.0 redirect URLs:
   - Development: `http://localhost:3000/auth/callback/linkedin`
   - Production: `https://yourdomain.com/auth/callback/linkedin`
3. Note your **Client ID** and **Client Secret**

### Required Scopes

Request the following scopes in your app:
- `openid` — Basic authentication
- `profile` — Access to profile information
- `w_member_social` — Post to personal feed
- `r_organization_social` — Read company page access
- `w_organization_social` — Post to company pages

### Environment Configuration

Add these to your `.env` file:

```env
LINKEDIN_CLIENT_ID="LINKEDIN_CLIENT_ID_VALUE"
LINKEDIN_CLIENT_SECRET="LINKEDIN_CLIENT_SECRET_VALUE"
LINKEDIN_REDIRECT_URI="LINKEDIN_REDIRECT_URI_VALUE"
```

### Connecting Your Account

1. Navigate to `/settings/social`
2. In the LinkedIn section, click **Connect Account**
3. Choose account type:
   - **Personal Profile (Founder)** — Posts as yourself
   - **Company Page** — Posts to a company page you admin
4. Click **Continue to LinkedIn**
5. Log in to LinkedIn if prompted
6. Authorize the requested permissions
7. You'll be redirected back to the app

### Account Types

#### Founder Account
- Posts appear on your personal LinkedIn feed
- Shows as posted by you
- Best for thought leadership content

#### Company Account
- Posts appear on your company page feed
- Shows as posted by the company
- Best for company announcements and educational content

### Posting Limits

LinkedIn has rate limits:
- Personal accounts: ~100 posts per day
- Company pages: Varies by page size
- API calls: 100,000 per day per app

The scheduler respects these limits and will retry if rate limited.

### Token Refresh

LinkedIn tokens expire after 60 days. The system:
- Automatically refreshes tokens when possible
- Marks accounts as inactive if refresh fails
- Prompts you to reconnect expired accounts

### Troubleshooting LinkedIn

**"Authorization failed"**
- Verify Client ID and Secret are correct
- Check redirect URI matches exactly
- Ensure app is approved for required scopes

**"Posting failed - insufficient permissions"**
- Reconnect the account
- Ensure you have posting permissions
- For company pages, verify admin access

**"Token expired"**
- Go to Settings and reconnect the account
- Tokens refresh automatically but may fail

## Substack Integration

### Prerequisites

To use Substack integration, you need:
1. A Substack publication
2. API access enabled for your publication
3. An API key from Substack

### Getting Your API Key

1. Log in to your Substack dashboard
2. Go to **Settings** > **Publication settings**
3. Navigate to the **API** or **Developers** section
4. Generate a new API key
5. Copy and save the key securely

**Note:** Substack's API access may require contacting their support or being in a specific program. API availability varies.

### Connecting Your Publication

1. Navigate to `/settings/social`
2. In the Substack section, click **Connect Publication**
3. Enter your details:
   - **Subdomain**: Your publication's subdomain (e.g., `yourname` from `yourname.substack.com`)
   - **Email**: The email associated with your Substack account
   - **API Key**: Your Substack API key
4. Click **Connect Publication**

### Publication Settings

The integration supports:
- **Newsletter posts** — Standard Substack posts
- **Email sending** — Option to email subscribers on publish
- **Audience targeting** — Everyone, paid only, or founding members

### Content Formatting

When posting to Substack, content is automatically formatted:
- Body text converted to HTML paragraphs
- S.O.F.T. framework added as a formatted section
- Hashtags converted to tags
- SEO tags applied to the post

### Draft vs. Publish

When scheduling Substack content:
- **Publish Now** — Immediately publishes and optionally emails subscribers
- **Schedule** — Creates a draft, then publishes at scheduled time

### Troubleshooting Substack

**"Invalid credentials"**
- Verify email matches your Substack account
- Check API key is correct and not expired
- Ensure subdomain is correct (without `.substack.com`)

**"Failed to create post"**
- Check your publication settings
- Verify API key has write permissions
- Ensure content meets Substack requirements

**"Email not sent"**
- Check your Substack email settings
- Verify subscriber list is active
- Some plans may have email limits

## Managing Connected Accounts

### Viewing Accounts

Go to `/settings/social` to see all connected accounts with:
- Platform and account type
- Account name/identifier
- Active status
- Last sync timestamp

### Disconnecting Accounts

1. Go to `/settings/social`
2. Find the account to disconnect
3. Click **Disconnect**
4. Confirm the action

**Warning:** Disconnecting an account will:
- Remove stored credentials
- Prevent scheduled posts from publishing
- Require reconnection for future use

### Account Status

Accounts can be in these states:
- **Active** — Ready for posting
- **Inactive** — Needs reconnection (expired token, etc.)

## Security Considerations

### Token Storage

- OAuth tokens are stored encrypted in the database
- Tokens are never exposed in client-side code
- API keys are stored server-side only

### Best Practices

1. **Use environment variables** — Never commit credentials to code
2. **Rotate API keys** — Periodically generate new keys
3. **Monitor access** — Review connected apps in platform settings
4. **Limit permissions** — Request only necessary scopes
5. **Disconnect unused accounts** — Remove accounts no longer needed

### Data Handling

The system stores:
- OAuth access and refresh tokens
- Account identifiers and names
- Posting history and external post IDs

No password or sensitive personal data is stored beyond what's needed for posting.

## API Rate Limits

### LinkedIn
- 100 API calls per day per user for most endpoints
- 100,000 calls per day for the app overall
- Posting limits vary by account type

### Substack
- Rate limits vary by subscription tier
- Standard limits for API access apply
- Large email sends may have additional limits

The scheduler automatically handles rate limiting with retry logic.

## Platform-Specific Content

### LinkedIn Best Practices
- Keep posts under 3000 characters
- Include 3-5 relevant hashtags
- Use whitespace for readability on mobile
- Hook in first 2 lines (before "see more")

### Substack Best Practices
- Longer form content (1000-1500 words)
- Use proper heading hierarchy
- Include SEO-friendly title and description
- Consider email preview in first paragraph

## Webhook Support (Future)

Future versions may support:
- Real-time engagement notifications
- Automated analytics collection
- Comment monitoring and alerts

## Support

For integration issues:
1. Check the troubleshooting sections above
2. Review platform developer documentation
3. Check application logs for detailed errors
4. Verify environment configuration
