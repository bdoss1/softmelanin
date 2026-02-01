# Content Scheduling Guide

This guide covers how to schedule and automate content publishing to LinkedIn and Substack using the Soft Melanin content scheduler.

## Overview

The scheduling system allows you to:
- Schedule generated content for future publishing
- View all scheduled posts in a calendar view
- Manage pending, published, and failed posts
- Automatically publish content at scheduled times
- Retry failed posts with configurable retry logic

## Getting Started

### Prerequisites

Before scheduling content, you need to:

1. **Generate content** — Create content artifacts using the main generator
2. **Connect social accounts** — Link your LinkedIn and/or Substack accounts in Settings

### Accessing the Scheduler

Navigate to `/schedule` from the main navigation or click the "Schedule" link in the header.

## Calendar View

The calendar provides a monthly overview of all scheduled content.

### Navigation

- Use the **<** and **>** buttons to move between months
- Click **Today** to return to the current month
- Click on any day to see posts scheduled for that day

### Visual Indicators

- **Blue chips** — LinkedIn posts
- **Orange chips** — Substack posts
- **Yellow dot** — Pending (not yet published)
- **Green dot** — Published successfully
- **Red dot** — Failed (check error details)

### Stats Bar

The top of the calendar shows:
- Total posts for the month
- Pending posts count
- Published posts count
- Failed posts count (if any)

## Scheduling a Post

### From the Queue Tab

1. Go to `/schedule` and select the **Queue** tab
2. Browse available content in the left panel
3. Click on any content artifact
4. In the scheduling dialog:
   - Select the target social account
   - Choose a date (defaults to tomorrow)
   - Select a time (optimal times are suggested)
   - Choose your timezone
   - Add optional notes
5. Click **Schedule Post**

### From the Calendar

1. Click on any future date in the calendar
2. If no posts exist for that day, the scheduling dialog opens
3. Select an artifact from your library
4. Complete the scheduling form

### From the Content Library

1. Navigate to `/library`
2. Find the content you want to schedule
3. Click the schedule icon/button
4. Complete the scheduling dialog

## Managing Scheduled Posts

### Viewing Post Details

Click on any scheduled post (in calendar or list view) to see:
- Full content preview
- Target social account
- Scheduled date and time
- Current status
- Error details (if failed)
- External post link (if published)

### Rescheduling

For pending posts:
1. Click on the post to open details
2. The reschedule option allows changing date/time
3. Save changes

### Canceling Posts

1. Click on the pending post
2. Click **Cancel Post**
3. The post is removed from the schedule

### Retrying Failed Posts

When a post fails:
1. Click on the failed post
2. Review the error message
3. Click **Retry Post** to attempt again
4. Or click **Post Now** to publish immediately

## Automated Publishing

### How It Works

The scheduler service runs in the background and:
1. Checks for due posts every minute
2. Processes up to 3 posts concurrently
3. Updates status to "posting" during publication
4. Marks as "published" on success
5. Handles failures with retry logic

### Retry Logic

Failed posts are automatically retried:
- Up to 3 retry attempts
- 5-minute delay between retries
- After max retries, status changes to "failed"
- Manual intervention required for permanently failed posts

### Starting the Scheduler

The scheduler starts automatically when the application runs. For manual control:

```typescript
import { getSchedulerService } from "@/lib/social/scheduler";

const scheduler = getSchedulerService();

// Start the scheduler
scheduler.start();

// Check if running
scheduler.isActive();

// Stop the scheduler
scheduler.stop();
```

## List View

The List tab provides a detailed view of all posts:

### Upcoming Posts

Shows pending posts sorted by scheduled time:
- Content preview
- Target account
- Scheduled date/time
- Status indicator

### Past Posts

Shows published and processed posts:
- Publication status
- Published timestamp
- External post link (if available)
- Error details (if failed)

### Filtering

Use the dropdown filters to:
- Filter by status (pending, published, failed, cancelled)
- Filter by platform (LinkedIn, Substack)

## Optimal Posting Times

The scheduler suggests optimal posting times based on platform best practices:

### LinkedIn
- **Weekdays:** 7:00 AM, 8:00 AM, 12:00 PM, 5:00 PM, 6:00 PM
- **Weekends:** 9:00 AM, 10:00 AM, 11:00 AM

### Substack
- **Weekdays:** 6:00 AM, 8:00 AM, 10:00 AM
- **Weekends:** 8:00 AM, 9:00 AM, 10:00 AM

Times are shown in your selected timezone (default: Eastern Time).

## Timezone Handling

All scheduled times are stored with timezone information:

- Select your timezone when scheduling
- Calendar displays times in your local timezone
- The scheduler uses UTC internally for accuracy

Supported timezones:
- Eastern Time (ET)
- Central Time (CT)
- Mountain Time (MT)
- Pacific Time (PT)
- UTC

## Platform Compatibility

The system ensures content matches the target platform:

| Content Type | Compatible Accounts |
|--------------|---------------------|
| `linkedin_founder` | LinkedIn (founder) |
| `linkedin_company` | LinkedIn (company) |
| `substack` | Substack (publication) |

Attempting to schedule incompatible content shows an error.

## Troubleshooting

### Post Not Publishing

1. Check the social account is still active
2. Verify token hasn't expired (reconnect if needed)
3. Check error message in post details
4. Ensure content doesn't exceed platform limits

### Calendar Not Loading

1. Check browser console for errors
2. Verify API is responding
3. Try refreshing the page

### Account Disconnected

If an account becomes inactive:
1. Go to `/settings/social`
2. Reconnect the account
3. Reschedule any affected posts

## Best Practices

1. **Schedule ahead** — Plan content at least a week in advance
2. **Use optimal times** — Leverage the suggested posting times
3. **Monitor failures** — Check daily for any failed posts
4. **Vary content** — Don't schedule the same content to multiple times
5. **Review before publishing** — Use the detail view to verify content
6. **Add notes** — Use the notes field for context or reminders
