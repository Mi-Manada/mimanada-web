import { Suspense } from "react";
import { LoginScreen } from "@/components/auth/LoginScreen";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <section className="flex min-h-full flex-1 items-center justify-center" />
      }
    >
      <LoginScreen />
    </Suspense>
  );
}
