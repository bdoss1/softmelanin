"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SocialAccount {
  id: string;
  platform: string;
  accountType: string;
  accountName: string;
  isActive: boolean;
}

interface ContentArtifact {
  id: string;
  platform: string;
  segment: string;
  hook: string;
  createdAt: string;
}

interface ScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artifact?: ContentArtifact | null;
  initialDate?: Date;
  onSchedule: (data: {
    artifactId: string;
    socialAccountId: string;
    scheduledFor: string;
    timezone: string;
    notes?: string;
  }) => Promise<void>;
}

const TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "UTC", label: "UTC" },
];

const OPTIMAL_TIMES = [
  { value: "07:00", label: "7:00 AM - Early morning engagement" },
  { value: "08:00", label: "8:00 AM - Morning commute peak" },
  { value: "12:00", label: "12:00 PM - Lunch break peak" },
  { value: "17:00", label: "5:00 PM - End of workday" },
  { value: "18:00", label: "6:00 PM - Evening engagement" },
];

export function ScheduleDialog({
  open,
  onOpenChange,
  artifact,
  initialDate,
  onSchedule,
}: ScheduleDialogProps) {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("08:00");
  const [timezone, setTimezone] = useState<string>("America/New_York");
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchingAccounts, setFetchingAccounts] = useState(true);

  useEffect(() => {
    if (open) {
      fetchAccounts();
      if (initialDate) {
        setSelectedDate(formatDateForInput(initialDate));
      } else {
        // Default to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setSelectedDate(formatDateForInput(tomorrow));
      }
    }
  }, [open, initialDate]);

  const fetchAccounts = async () => {
    setFetchingAccounts(true);
    try {
      const response = await fetch("/api/social/accounts?active=true");
      const data = await response.json();
      if (data.success) {
        setAccounts(data.accounts);
        // Auto-select first compatible account
        if (artifact && data.accounts.length > 0) {
          const compatible = data.accounts.find((a: SocialAccount) =>
            isAccountCompatible(a, artifact.platform)
          );
          if (compatible) {
            setSelectedAccountId(compatible.id);
          }
        }
      }
    } catch (err) {
      setError("Failed to fetch social accounts");
    } finally {
      setFetchingAccounts(false);
    }
  };

  const isAccountCompatible = (account: SocialAccount, artifactPlatform: string) => {
    const platformMap: Record<string, string[]> = {
      linkedin: ["linkedin_founder", "linkedin_company"],
      substack: ["substack"],
    };
    return platformMap[account.platform]?.includes(artifactPlatform) || false;
  };

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const handleSubmit = async () => {
    if (!artifact || !selectedAccountId || !selectedDate || !selectedTime) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const scheduledFor = new Date(`${selectedDate}T${selectedTime}:00`);

      await onSchedule({
        artifactId: artifact.id,
        socialAccountId: selectedAccountId,
        scheduledFor: scheduledFor.toISOString(),
        timezone,
        notes: notes || undefined,
      });

      // Reset form and close
      setSelectedAccountId("");
      setNotes("");
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to schedule post");
    } finally {
      setLoading(false);
    }
  };

  const compatibleAccounts = accounts.filter((a) =>
    artifact ? isAccountCompatible(a, artifact.platform) : true
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Schedule Post</DialogTitle>
          <DialogDescription>
            Choose when and where to publish this content.
          </DialogDescription>
        </DialogHeader>

        {artifact && (
          <div className="bg-muted/50 p-3 rounded-lg mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline">
                {artifact.platform.replace("_", " ")}
              </Badge>
              <Badge variant="secondary">
                {artifact.segment.replace(/_/g, " ")}
              </Badge>
            </div>
            <p className="text-sm line-clamp-2">{artifact.hook}</p>
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {/* Social Account */}
          <div className="space-y-2">
            <Label htmlFor="account">Social Account</Label>
            {fetchingAccounts ? (
              <div className="text-sm text-muted-foreground">Loading accounts...</div>
            ) : compatibleAccounts.length === 0 ? (
              <Alert>
                <AlertDescription>
                  No compatible social accounts found. Please connect a{" "}
                  {artifact?.platform.includes("linkedin") ? "LinkedIn" : "Substack"}{" "}
                  account first.
                </AlertDescription>
              </Alert>
            ) : (
              <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an account" />
                </SelectTrigger>
                <SelectContent>
                  {compatibleAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      <div className="flex items-center gap-2">
                        <span className="capitalize">{account.platform}</span>
                        <span className="text-muted-foreground">-</span>
                        <span>{account.accountName}</span>
                        {account.accountType && (
                          <Badge variant="outline" className="text-xs">
                            {account.accountType}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <input
              type="date"
              id="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={formatDateForInput(new Date())}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {/* Time */}
          <div className="space-y-2">
            <Label htmlFor="time">Time</Label>
            <Select value={selectedTime} onValueChange={setSelectedTime}>
              <SelectTrigger>
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent>
                {OPTIMAL_TIMES.map((time) => (
                  <SelectItem key={time.value} value={time.value}>
                    {time.label}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Custom time...</SelectItem>
              </SelectContent>
            </Select>
            {selectedTime === "custom" && (
              <input
                type="time"
                onChange={(e) => setSelectedTime(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            )}
          </div>

          {/* Timezone */}
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger>
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this scheduled post..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !selectedAccountId || !selectedDate}
          >
            {loading ? "Scheduling..." : "Schedule Post"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
