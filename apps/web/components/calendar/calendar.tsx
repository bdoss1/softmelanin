"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface CalendarScheduledPost {
  id: string;
  artifactId: string;
  socialAccountId: string;
  scheduledFor: string;
  timezone?: string;
  status: string;
  publishedAt?: string;
  externalPostId?: string;
  lastError?: string;
  notes?: string;
  artifact: {
    id: string;
    platform: string;
    segment: string;
    hook: string;
  };
  socialAccount: {
    id: string;
    platform: string;
    accountType: string;
    accountName: string;
  };
}

interface CalendarDay {
  date: string;
  dayOfMonth: number;
  isToday: boolean;
  isCurrentMonth: boolean;
  isWeekend: boolean;
  scheduledPosts: CalendarScheduledPost[];
}

interface CalendarWeek {
  days: CalendarDay[];
}

interface CalendarData {
  year: number;
  month: number;
  weeks: CalendarWeek[];
}

interface CalendarProps {
  onDayClick?: (date: Date, posts: CalendarScheduledPost[]) => void;
  onPostClick?: (post: CalendarScheduledPost) => void;
  socialAccountId?: string;
  platform?: string;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const PLATFORM_COLORS: Record<string, string> = {
  linkedin: "bg-blue-500",
  substack: "bg-orange-500",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500",
  queued: "bg-blue-400",
  posting: "bg-purple-500",
  published: "bg-green-500",
  failed: "bg-red-500",
  cancelled: "bg-gray-500",
};

export function Calendar({
  onDayClick,
  onPostClick,
  socialAccountId,
  platform,
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [stats, setStats] = useState<{
    total: number;
    pending: number;
    published: number;
    failed: number;
    byPlatform: Record<string, number>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCalendarData = async (year: number, month: number) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        year: String(year),
        month: String(month),
      });

      if (socialAccountId) {
        params.set("socialAccountId", socialAccountId);
      }
      if (platform) {
        params.set("platform", platform);
      }

      const response = await fetch(`/api/social/calendar?${params}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch calendar data");
      }

      setCalendarData(data.calendar);
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load calendar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData(currentDate.getFullYear(), currentDate.getMonth() + 1);
  }, [currentDate, socialAccountId, platform]);

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleDayClick = (day: CalendarDay) => {
    if (onDayClick) {
      onDayClick(new Date(day.date), day.scheduledPosts);
    }
  };

  const handlePostClick = (e: React.MouseEvent, post: CalendarScheduledPost) => {
    e.stopPropagation();
    if (onPostClick) {
      onPostClick(post);
    }
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + "...";
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <div className="animate-pulse text-muted-foreground">Loading calendar...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center h-96 gap-4">
          <div className="text-red-500">{error}</div>
          <Button onClick={() => fetchCalendarData(currentDate.getFullYear(), currentDate.getMonth() + 1)}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-xl font-semibold">
          {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
            &lt;
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={goToNextMonth}>
            &gt;
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Stats bar */}
        {stats && (
          <div className="flex gap-4 mb-4 text-sm">
            <span className="text-muted-foreground">
              Total: <strong>{stats.total}</strong>
            </span>
            <span className="text-yellow-600">
              Pending: <strong>{stats.pending}</strong>
            </span>
            <span className="text-green-600">
              Published: <strong>{stats.published}</strong>
            </span>
            {stats.failed > 0 && (
              <span className="text-red-600">
                Failed: <strong>{stats.failed}</strong>
              </span>
            )}
          </div>
        )}

        {/* Calendar grid */}
        <div className="border rounded-lg overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 bg-muted/50">
            {DAY_NAMES.map((day) => (
              <div
                key={day}
                className="p-2 text-center text-sm font-medium text-muted-foreground border-b"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar weeks */}
          {calendarData?.weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7">
              {week.days.map((day, dayIndex) => (
                <div
                  key={dayIndex}
                  onClick={() => handleDayClick(day)}
                  className={cn(
                    "min-h-24 p-1 border-b border-r cursor-pointer transition-colors hover:bg-muted/50",
                    day.isWeekend && "bg-muted/20",
                    !day.isCurrentMonth && "opacity-40",
                    day.isToday && "ring-2 ring-primary ring-inset"
                  )}
                >
                  <div className={cn(
                    "text-sm mb-1",
                    day.isToday && "font-bold text-primary"
                  )}>
                    {day.dayOfMonth}
                  </div>

                  {/* Scheduled posts */}
                  <div className="space-y-1">
                    {day.scheduledPosts.slice(0, 3).map((post) => (
                      <div
                        key={post.id}
                        onClick={(e) => handlePostClick(e, post)}
                        className={cn(
                          "text-xs px-1 py-0.5 rounded truncate cursor-pointer text-white",
                          PLATFORM_COLORS[post.socialAccount.platform] || "bg-gray-500",
                          post.status === "published" && "opacity-60"
                        )}
                        title={`${post.artifact.hook} - ${post.socialAccount.accountName} (${post.status})`}
                      >
                        <span className={cn(
                          "inline-block w-1.5 h-1.5 rounded-full mr-1",
                          STATUS_COLORS[post.status]
                        )} />
                        {truncateText(post.artifact.hook, 20)}
                      </div>
                    ))}
                    {day.scheduledPosts.length > 3 && (
                      <div className="text-xs text-muted-foreground pl-1">
                        +{day.scheduledPosts.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-medium text-muted-foreground">Platforms:</span>
            <Badge variant="outline" className="bg-blue-500 text-white border-0">LinkedIn</Badge>
            <Badge variant="outline" className="bg-orange-500 text-white border-0">Substack</Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-muted-foreground">Status:</span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-yellow-500" /> Pending
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500" /> Published
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500" /> Failed
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
