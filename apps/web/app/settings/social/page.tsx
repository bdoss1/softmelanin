"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

interface SocialAccount {
  id: string;
  platform: string;
  accountType: string;
  accountName: string;
  accountId: string;
  isActive: boolean;
  lastSyncAt?: string;
  createdAt: string;
  updatedAt: string;
}

export default function SocialSettingsPage() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dialog states
  const [linkedInDialogOpen, setLinkedInDialogOpen] = useState(false);
  const [substackDialogOpen, setSubstackDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<SocialAccount | null>(null);

  // Form states
  const [linkedInAccountType, setLinkedInAccountType] = useState<string>("founder");
  const [substackEmail, setSubstackEmail] = useState("");
  const [substackApiKey, setSubstackApiKey] = useState("");
  const [substackSubdomain, setSubstackSubdomain] = useState("");
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/social/accounts");
      const data = await response.json();
      if (data.success) {
        setAccounts(data.accounts);
      }
    } catch (err) {
      setError("Failed to load accounts");
    } finally {
      setLoading(false);
    }
  };

  const connectLinkedIn = () => {
    // Redirect to LinkedIn OAuth
    window.location.href = `/api/social/oauth/linkedin?accountType=${linkedInAccountType}`;
  };

  const connectSubstack = async () => {
    if (!substackEmail || !substackApiKey || !substackSubdomain) {
      setError("Please fill in all fields");
      return;
    }

    setConnecting(true);
    setError(null);

    try {
      // Format: store email:apiKey as accessToken, subdomain as accountId
      const response = await fetch("/api/social/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: "substack",
          accountType: "publication",
          accountName: `${substackSubdomain}.substack.com`,
          accountId: substackSubdomain,
          accessToken: `${substackEmail}:${substackApiKey}`,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("Substack account connected successfully!");
        setSubstackDialogOpen(false);
        setSubstackEmail("");
        setSubstackApiKey("");
        setSubstackSubdomain("");
        fetchAccounts();
      } else {
        setError(data.error || "Failed to connect Substack account");
      }
    } catch (err) {
      setError("Failed to connect Substack account");
    } finally {
      setConnecting(false);
    }
  };

  const deleteAccount = async (account: SocialAccount) => {
    try {
      const response = await fetch(`/api/social/accounts?id=${account.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("Account disconnected successfully");
        setDeleteDialogOpen(null);
        fetchAccounts();
      } else {
        setError(data.error || "Failed to disconnect account");
      }
    } catch (err) {
      setError("Failed to disconnect account");
    }
  };

  const toggleAccountStatus = async (account: SocialAccount) => {
    try {
      // Note: This would need a PATCH endpoint for accounts
      // For now, just show a message
      setError("Account status toggle not yet implemented");
    } catch (err) {
      setError("Failed to update account status");
    }
  };

  const linkedInAccounts = accounts.filter((a) => a.platform === "linkedin");
  const substackAccounts = accounts.filter((a) => a.platform === "substack");

  if (loading) {
    return (
      <main className="container mx-auto p-6 max-w-4xl">
        <div className="animate-pulse text-center py-12">Loading...</div>
      </main>
    );
  }

  return (
    <main className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Social Accounts</h1>
          <p className="text-muted-foreground mt-1">
            Connect your social media accounts for automated posting
          </p>
        </div>
        <Button variant="outline" onClick={() => window.location.href = "/schedule"}>
          View Schedule
        </Button>
      </div>

      {/* Messages */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 border-green-500 bg-green-50">
          <AlertTitle className="text-green-700">Success</AlertTitle>
          <AlertDescription className="text-green-600">{success}</AlertDescription>
        </Alert>
      )}

      {/* LinkedIn Section */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold">
                in
              </div>
              <div>
                <CardTitle>LinkedIn</CardTitle>
                <CardDescription>
                  Connect your LinkedIn profile or company page
                </CardDescription>
              </div>
            </div>
            <Button onClick={() => setLinkedInDialogOpen(true)}>
              Connect Account
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {linkedInAccounts.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No LinkedIn accounts connected. Click &quot;Connect Account&quot; to get started.
            </p>
          ) : (
            <div className="space-y-3">
              {linkedInAccounts.map((account) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  onDelete={() => setDeleteDialogOpen(account)}
                  onToggle={() => toggleAccountStatus(account)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Substack Section */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center text-white font-bold">
                S
              </div>
              <div>
                <CardTitle>Substack</CardTitle>
                <CardDescription>
                  Connect your Substack publication for newsletter posting
                </CardDescription>
              </div>
            </div>
            <Button onClick={() => setSubstackDialogOpen(true)}>
              Connect Publication
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {substackAccounts.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No Substack publications connected. Click &quot;Connect Publication&quot; to get started.
            </p>
          ) : (
            <div className="space-y-3">
              {substackAccounts.map((account) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  onDelete={() => setDeleteDialogOpen(account)}
                  onToggle={() => toggleAccountStatus(account)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-medium mb-2">LinkedIn Setup</h4>
            <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
              <li>Click &quot;Connect Account&quot; to start the OAuth flow</li>
              <li>Log in to your LinkedIn account when prompted</li>
              <li>Authorize the app to post on your behalf</li>
              <li>Choose whether to connect as a personal profile (Founder) or company page</li>
            </ol>
            <Alert className="mt-3">
              <AlertDescription>
                <strong>Note:</strong> You&apos;ll need to set up LinkedIn OAuth credentials in your
                environment variables: <code>LINKEDIN_CLIENT_ID</code>, <code>LINKEDIN_CLIENT_SECRET</code>,
                and <code>LINKEDIN_REDIRECT_URI</code>
              </AlertDescription>
            </Alert>
          </div>

          <div>
            <h4 className="font-medium mb-2">Substack Setup</h4>
            <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
              <li>Go to your Substack publication settings</li>
              <li>Navigate to &quot;Developers&quot; or &quot;API&quot; section</li>
              <li>Generate a new API key</li>
              <li>Enter your email, API key, and subdomain in the connection form</li>
            </ol>
            <Alert className="mt-3">
              <AlertDescription>
                <strong>Note:</strong> Substack&apos;s API may have limitations. For best results,
                ensure your publication is set up correctly and your API key has write permissions.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* LinkedIn Connect Dialog */}
      <Dialog open={linkedInDialogOpen} onOpenChange={setLinkedInDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Connect LinkedIn</DialogTitle>
            <DialogDescription>
              Choose the type of account you want to connect
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Account Type</Label>
              <Select value={linkedInAccountType} onValueChange={setLinkedInAccountType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="founder">
                    <div>
                      <p className="font-medium">Personal Profile (Founder)</p>
                      <p className="text-xs text-muted-foreground">
                        Post as yourself to your personal feed
                      </p>
                    </div>
                  </SelectItem>
                  <SelectItem value="company">
                    <div>
                      <p className="font-medium">Company Page</p>
                      <p className="text-xs text-muted-foreground">
                        Post to a company page you admin
                      </p>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkedInDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={connectLinkedIn}>
              Continue to LinkedIn
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Substack Connect Dialog */}
      <Dialog open={substackDialogOpen} onOpenChange={setSubstackDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Connect Substack</DialogTitle>
            <DialogDescription>
              Enter your Substack publication credentials
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subdomain">Publication Subdomain</Label>
              <input
                id="subdomain"
                placeholder="yourpublication"
                value={substackSubdomain}
                onChange={(e) => setSubstackSubdomain(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <p className="text-xs text-muted-foreground">
                The subdomain part of yourpublication.substack.com
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Account Email</Label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={substackEmail}
                onChange={(e) => setSubstackEmail(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Textarea
                id="apiKey"
                placeholder="Your Substack API key"
                value={substackApiKey}
                onChange={(e) => setSubstackApiKey(e.target.value)}
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                Found in your Substack publication settings under API
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSubstackDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={connectSubstack} disabled={connecting}>
              {connecting ? "Connecting..." : "Connect Publication"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      {deleteDialogOpen && (
        <Dialog open={!!deleteDialogOpen} onOpenChange={(open) => !open && setDeleteDialogOpen(null)}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Disconnect Account</DialogTitle>
              <DialogDescription>
                Are you sure you want to disconnect this account? Any pending scheduled
                posts for this account will need to be reassigned or cancelled.
              </DialogDescription>
            </DialogHeader>

            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${
                    deleteDialogOpen.platform === "linkedin"
                      ? "bg-blue-500"
                      : "bg-orange-500"
                  }`}
                >
                  {deleteDialogOpen.platform === "linkedin" ? "in" : "S"}
                </div>
                <div>
                  <p className="font-medium">{deleteDialogOpen.accountName}</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {deleteDialogOpen.platform} • {deleteDialogOpen.accountType}
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteAccount(deleteDialogOpen)}
              >
                Disconnect
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </main>
  );
}

function AccountCard({
  account,
  onDelete,
  onToggle,
}: {
  account: SocialAccount;
  onDelete: () => void;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center gap-4">
        <div
          className={`w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold ${
            account.platform === "linkedin" ? "bg-blue-500" : "bg-orange-500"
          }`}
        >
          {account.platform === "linkedin" ? "in" : "S"}
        </div>
        <div>
          <p className="font-medium">{account.accountName}</p>
          <p className="text-sm text-muted-foreground capitalize">
            {account.accountType}
          </p>
          {account.lastSyncAt && (
            <p className="text-xs text-muted-foreground">
              Last synced: {new Date(account.lastSyncAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={account.isActive ? "default" : "secondary"}>
          {account.isActive ? "Active" : "Inactive"}
        </Badge>
        <Button variant="ghost" size="sm" onClick={onDelete}>
          Disconnect
        </Button>
      </div>
    </div>
  );
}
