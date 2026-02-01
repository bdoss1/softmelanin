import { Suspense } from "react";
import CallbackClient from "./CallbackClient";

export default function LinkedInCallbackPage() {
  return (
    <Suspense fallback={null}>
      <CallbackClient />
    </Suspense>
  );
}
