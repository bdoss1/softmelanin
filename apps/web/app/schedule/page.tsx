"use client";

import { useState, useEffect } from "react";
import { Calendar, ScheduleDialog, CalendarScheduledPost } from "@/components/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ScheduledPost {
  id: string;
  artifactId: string;
  socialAccountId: string;
  scheduledFor: string;
  timezone: string;
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

interface ContentArtifact {
  id: string;
  platform: string;
  segment: string;
  hook: string;
  createdAt: string;
}

interface SocialAccount {
  id: string;
  platform: string;
  accountType: string;
  accountName: string;
  isActive: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500",
  queued: "bg-blue-400",
  posting: "bg-purple-500",
  published: "bg-green-500",
  failed: "bg-red-500",
  cancelled: "bg-gray-500",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  queued: "Queued",
  posting: "Posting",
  published: "Published",
  failed: "Failed",
  cancelled: "Cancelled",
};

export default function SchedulePage() {
  const [activeTab, setActiveTab] = useState("calendar");
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [artifacts, setArtifacts] = useState<ContentArtifact[]>([]);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedArtifact, setSelectedArtifact] = useState<ContentArtifact | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [postDetailDialog, setPostDetailDialog] = useState<ScheduledPost | null>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [platformFilter, setPlatformFilter] = useState<string>("all");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [postsRes, artifactsRes, accountsRes] = await Promise.all([
        fetch("/api/social/scheduled?limit=100"),
        fetch("/api/artifacts?limit=50"),
        fetch("/api/social/accounts?active=true"),
      ]);

      const [postsData, artifactsData, accountsData] = await Promise.all([
        postsRes.json(),
        artifactsRes.json(),
        accountsRes.json(),
      ]);

      if (postsData.success) {
        setScheduledPosts(postsData.posts);
      }

      if (artifactsData.artifacts) {
        setArtifacts(artifactsData.artifacts);
      }

      if (accountsData.success) {
        setAccounts(accountsData.accounts);
      }
    } catch (err) {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async (data: {
    artifactId: string;
    socialAccountId: string;
    scheduledFor: string;
    timezone: string;
    notes?: string;
  }) => {
    const response = await fetch("/api/social/scheduled", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Failed to schedule post");
    }

    // Refresh data
    fetchData();
  };

  const handleCancelPost = async (postId: string) => {
    try {
      const response = await fetch(`/api/social/scheduled?id=${postId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        fetchData();
        setPostDetailDialog(null);
      } else {
        setError(result.error || "Failed to cancel post");
      }
    } catch (err) {
      setError("Failed to cancel post");
    }
  };

  const handlePostNow = async (postId: string) => {
    try {
      const response = await fetch("/api/social/scheduled/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledPostId: postId }),
      });

      const result = await response.json();

      if (result.success) {
        fetchData();
        setPostDetailDialog(null);
      } else {
        setError(result.result?.error || "Failed to post");
      }
    } catch (err) {
      setError("Failed to execute post");
    }
  };

  const handleDayClick = (date: Date, posts: CalendarScheduledPost[]) => {
    setSelectedDate(date);
    if (posts.length === 0) {
      // Open schedule dialog for this day
      setSelectedArtifact(null);
      setScheduleDialogOpen(true);
    }
  };

  const handlePostClick = (post: CalendarScheduledPost) => {
    // Convert to full ScheduledPost format for the detail dialog
    setPostDetailDialog(post as ScheduledPost);
  };

  const openScheduleDialog = (artifact?: ContentArtifact) => {
    setSelectedArtifact(artifact || null);
    setSelectedDate(undefined);
    setScheduleDialogOpen(true);
  };

  const filteredPosts = scheduledPosts.filter((post) => {
    if (statusFilter !== "all" && post.status !== statusFilter) return false;
    if (platformFilter !== "all" && post.socialAccount.platform !== platformFilter) return false;
    return true;
  });

  const upcomingPosts = filteredPosts
    .filter((p) => p.status === "pending")
    .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime());

  const pastPosts = filteredPosts
    .filter((p) => p.status !== "pending")
    .sort((a, b) => new Date(b.scheduledFor).getTime() - new Date(a.scheduledFor).getTime());

  if (loading) {
    return (
      <main className="container mx-auto p-6">
        <div className="animate-pulse text-center py-12">Loading...</div>
      </main>
    );
  }

  return (
    <main className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content Schedule</h1>
          <p className="text-muted-foreground mt-1">
            Plan and automate your social media posts
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.location.href = "/settings/social"}>
            Manage Accounts
          </Button>
          <Button onClick={() => openScheduleDialog()}>
            Schedule New Post
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Connected accounts status */}
      {accounts.length === 0 && (
        <Alert className="mb-6">
          <AlertTitle>No connected accounts</AlertTitle>
          <AlertDescription>
            Connect your LinkedIn or Substack accounts to start scheduling posts.{" "}
            <a href="/settings/social" className="underline">Go to settings</a>
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="queue">Queue</TabsTrigger>
        </TabsList>

        {/* Calendar View */}
        <TabsContent value="calendar">
          <Calendar
            onDayClick={handleDayClick}
            onPostClick={handlePostClick}
            platform={platformFilter !== "all" ? platformFilter : undefined}
          />
        </TabsContent>

        {/* List View */}
        <TabsContent value="list">
          {/* Filters */}
          <div className="flex gap-4 mb-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="substack">Substack</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Upcoming */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Upcoming Posts</CardTitle>
              <CardDescription>Posts scheduled to be published</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingPosts.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No upcoming posts scheduled
                </p>
              ) : (
                <div className="space-y-3">
                  {upcomingPosts.map((post) => (
                    <ScheduledPostCard
                      key={post.id}
                      post={post}
                      onClick={() => setPostDetailDialog(post)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Past Posts */}
          <Card>
            <CardHeader>
              <CardTitle>Past Posts</CardTitle>
              <CardDescription>Published and processed posts</CardDescription>
            </CardHeader>
            <CardContent>
              {pastPosts.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No past posts yet
                </p>
              ) : (
                <div className="space-y-3">
                  {pastPosts.slice(0, 20).map((post) => (
                    <ScheduledPostCard
                      key={post.id}
                      post={post}
                      onClick={() => setPostDetailDialog(post)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Queue View */}
        <TabsContent value="queue">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Available artifacts */}
            <Card>
              <CardHeader>
                <CardTitle>Available Content</CardTitle>
                <CardDescription>
                  Select content to schedule for posting
                </CardDescription>
              </CardHeader>
              <CardContent>
                {artifacts.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No content available. Generate some content first.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {artifacts.map((artifact) => (
                      <div
                        key={artifact.id}
                        className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                        onClick={() => openScheduleDialog(artifact)}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">
                            {artifact.platform.replace("_", " ")}
                          </Badge>
                          <Badge variant="secondary">
                            {artifact.segment.replace(/_/g, " ")}
                          </Badge>
                        </div>
                        <p className="text-sm line-clamp-2">{artifact.hook}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Connected accounts */}
            <Card>
              <CardHeader>
                <CardTitle>Connected Accounts</CardTitle>
                <CardDescription>
                  Your social media accounts
                </CardDescription>
              </CardHeader>
              <CardContent>
                {accounts.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      No accounts connected
                    </p>
                    <Button variant="outline" onClick={() => window.location.href = "/settings/social"}>
                      Connect Account
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {accounts.map((account) => (
                      <div
                        key={account.id}
                        className="p-3 border rounded-lg flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs ${
                              account.platform === "linkedin"
                                ? "bg-blue-500"
                                : "bg-orange-500"
                            }`}
                          >
                            {account.platform === "linkedin" ? "in" : "S"}
                          </div>
                          <div>
                            <p className="font-medium">{account.accountName}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {account.platform} • {account.accountType}
                            </p>
                          </div>
                        </div>
                        <Badge variant={account.isActive ? "default" : "secondary"}>
                          {account.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Schedule Dialog */}
      <ScheduleDialog
        open={scheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
        artifact={selectedArtifact}
        initialDate={selectedDate}
        onSchedule={handleSchedule}
      />

      {/* Post Detail Dialog */}
      {postDetailDialog && (
        <PostDetailDialog
          post={postDetailDialog}
          open={!!postDetailDialog}
          onOpenChange={(open) => !open && setPostDetailDialog(null)}
          onCancel={() => handleCancelPost(postDetailDialog.id)}
          onPostNow={() => handlePostNow(postDetailDialog.id)}
        />
      )}
    </main>
  );
}

function ScheduledPostCard({
  post,
  onClick,
}: {
  post: ScheduledPost;
  onClick: () => void;
}) {
  const scheduledDate = new Date(post.scheduledFor);

  return (
    <div
      className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Badge
              className={`${
                post.socialAccount.platform === "linkedin"
                  ? "bg-blue-500"
                  : "bg-orange-500"
              } text-white border-0`}
            >
              {post.socialAccount.platform}
            </Badge>
            <Badge variant="outline">
              {post.artifact.segment.replace(/_/g, " ")}
            </Badge>
            <span
              className={`px-2 py-0.5 rounded-full text-xs text-white ${STATUS_COLORS[post.status]}`}
            >
              {STATUS_LABELS[post.status]}
            </span>
          </div>
          <p className="font-medium line-clamp-1">{post.artifact.hook}</p>
          <p className="text-sm text-muted-foreground">
            {post.socialAccount.accountName}
          </p>
        </div>
        <div className="text-right text-sm">
          <p className="font-medium">
            {scheduledDate.toLocaleDateString()}
          </p>
          <p className="text-muted-foreground">
            {scheduledDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>
      {post.lastError && (
        <p className="text-xs text-red-500 mt-2 line-clamp-1">{post.lastError}</p>
      )}
    </div>
  );
}

function PostDetailDialog({
  post,
  open,
  onOpenChange,
  onCancel,
  onPostNow,
}: {
  post: ScheduledPost;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel: () => void;
  onPostNow: () => void;
}) {
  const scheduledDate = new Date(post.scheduledFor);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Scheduled Post Details</DialogTitle>
          <DialogDescription>
            View and manage this scheduled post
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status */}
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-sm text-white ${STATUS_COLORS[post.status]}`}
            >
              {STATUS_LABELS[post.status]}
            </span>
            {post.publishedAt && (
              <span className="text-sm text-muted-foreground">
                Published {new Date(post.publishedAt).toLocaleString()}
              </span>
            )}
          </div>

          {/* Content preview */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline">
                {post.artifact.platform.replace("_", " ")}
              </Badge>
              <Badge variant="secondary">
                {post.artifact.segment.replace(/_/g, " ")}
              </Badge>
            </div>
            <p className="font-medium mb-2">{post.artifact.hook}</p>
          </div>

          {/* Account */}
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                post.socialAccount.platform === "linkedin"
                  ? "bg-blue-500"
                  : "bg-orange-500"
              }`}
            >
              {post.socialAccount.platform === "linkedin" ? "in" : "S"}
            </div>
            <div>
              <p className="font-medium">{post.socialAccount.accountName}</p>
              <p className="text-sm text-muted-foreground capitalize">
                {post.socialAccount.platform} • {post.socialAccount.accountType}
              </p>
            </div>
          </div>

          {/* Schedule info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Scheduled for</p>
              <p className="font-medium">{scheduledDate.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Timezone</p>
              <p className="font-medium">{post.timezone}</p>
            </div>
          </div>

          {/* Notes */}
          {post.notes && (
            <div>
              <p className="text-sm text-muted-foreground">Notes</p>
              <p className="text-sm">{post.notes}</p>
            </div>
          )}

          {/* Error */}
          {post.lastError && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{post.lastError}</AlertDescription>
            </Alert>
          )}

          {/* External link */}
          {post.externalPostId && (
            <div>
              <p className="text-sm text-muted-foreground">External Post ID</p>
              <p className="text-sm font-mono">{post.externalPostId}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          {post.status === "pending" && (
            <>
              <Button variant="destructive" onClick={onCancel}>
                Cancel Post
              </Button>
              <Button onClick={onPostNow}>
                Post Now
              </Button>
            </>
          )}
          {post.status === "failed" && (
            <Button onClick={onPostNow}>
              Retry Post
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
