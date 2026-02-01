"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";

export default function CallbackClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [accountName, setAccountName] = useState<string>("");

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const errorParam = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");

      if (errorParam) {
        setStatus("error");
        setError(errorDescription || "LinkedIn authorization was denied");
        return;
      }

      if (!code) {
        setStatus("error");
        setError("No authorization code received from LinkedIn");
        return;
      }

      try {
        const response = await fetch("/api/social/oauth/linkedin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, state }),
        });

        const data = await response.json();

        if (data.success) {
          setStatus("success");
          setAccountName(data.account.accountName);
        } else {
          setStatus("error");
          setError(data.error || "Failed to complete LinkedIn authentication");
        }
      } catch (err) {
        setStatus("error");
        setError("An error occurred while processing the callback");
      }
    };

    handleCallback();
  }, [searchParams]);

  const goToSettings = () => {
    router.push("/settings/social");
  };

  const goToSchedule = () => {
    router.push("/schedule");
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold">
            in
          </div>
          <CardTitle>
            {status === "loading" && "Connecting LinkedIn..."}
            {status === "success" && "LinkedIn Connected!"}
            {status === "error" && "Connection Failed"}
          </CardTitle>
          <CardDescription>
            {status === "loading" && "Please wait while we complete the connection"}
            {status === "success" && `Successfully connected as ${accountName}`}
            {status === "error" && "There was a problem connecting your account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === "loading" && (
            <div className="flex justify-center py-8">
              <Spinner className="w-8 h-8" />
            </div>
          )}

          {status === "success" && (
            <div className="space-y-4">
              <Alert className="border-green-500 bg-green-50">
                <AlertTitle className="text-green-700">Success!</AlertTitle>
                <AlertDescription className="text-green-600">
                  Your LinkedIn account has been connected. You can now schedule posts
                  to publish to LinkedIn.
                </AlertDescription>
              </Alert>
              <div className="flex gap-2">
                <Button variant="outline" onClick={goToSettings} className="flex-1">
                  Back to Settings
                </Button>
                <Button onClick={goToSchedule} className="flex-1">
                  Schedule Posts
                </Button>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <div className="flex gap-2">
                <Button variant="outline" onClick={goToSettings} className="flex-1">
                  Back to Settings
                </Button>
                <Button
                  onClick={() => window.location.href = "/api/social/oauth/linkedin"}
                  className="flex-1"
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
