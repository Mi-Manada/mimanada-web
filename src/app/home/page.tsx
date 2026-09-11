"use client";

import { AppChrome } from "@/components/app/AppChrome";
import { HomeScreen } from "@/components/home/HomeScreen";
import { ProfileActivationBanner } from "@/components/profile/ProfileActivationBanner";

export default function HomePage() {
  return (
    <AppChrome hideHeader>
      <HomeScreen />
      <div className="mx-auto w-full max-w-[80rem] px-4 pb-6 sm:px-6 lg:px-8">
        <ProfileActivationBanner />
      </div>
    </AppChrome>
  );
}
