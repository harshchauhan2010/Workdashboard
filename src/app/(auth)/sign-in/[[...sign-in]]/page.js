'use client';

import { SignIn, ClerkLoaded, ClerkLoading } from "@clerk/nextjs";
import Link from "next/link";

const clerkAppearance = {
  layout: {
    socialButtonsPlacement: "bottom",
    socialButtonsVariant: "blockButton",
    termsPageUrl: "https://clerk.com/terms",
    privacyPageUrl: "https://clerk.com/privacy",
  },
  variables: {
    colorPrimary: "#285691",
    colorText: "#201C17",
    colorTextSecondary: "#7B7265",
    colorBackground: "#ffffff",
    colorInputBackground: "#ffffff",
    colorInputText: "#201C17",
    colorDanger: "#8E3722",
    borderRadius: "0.875rem",
    fontFamily: "var(--font-inter), sans-serif",
    fontSize: "0.875rem",
  },
  elements: {
    card: "shadow-none border border-[#E7E2DA] rounded-2xl bg-white p-6 sm:p-8",
    headerTitle: "font-display text-2xl font-bold text-[#201C17] tracking-tight",
    headerSubtitle: "text-[#7B7265] text-sm mt-1",
    formButtonPrimary:
      "bg-[#285691] hover:bg-[#1F4373] text-white font-medium shadow-sm transition-all duration-150 active:scale-[0.99] py-2.5 rounded-xl",
    formFieldInput:
      "rounded-xl border-[#E7E2DA] focus:border-[#285691] focus:ring-4 focus:ring-[#285691]/10 text-sm transition-all duration-150 py-2.5",
    formFieldLabel: "text-xs font-semibold uppercase tracking-wider text-[#4A4239] mb-1.5",
    socialButtonsBlockButton:
      "border-[#E7E2DA] hover:bg-[#F8F7F4] hover:border-[#D0CABE] rounded-xl transition-all duration-150 text-[#201C17] font-medium text-sm py-2.5",
    dividerLine: "bg-[#E7E2DA]",
    dividerText: "text-xs uppercase tracking-wider text-[#A49A8B] font-semibold",
    footerActionText: "text-xs text-[#7B7265]",
    footerActionLink: "text-xs font-semibold text-[#285691] hover:text-[#1F4373] hover:underline",
  },
};

function AuthCardSkeleton({ isSignUp = false }) {
  return (
    <div className="w-[380px] sm:w-[420px] min-h-[460px] bg-white border border-[#E7E2DA] rounded-2xl p-6 sm:p-8 flex flex-col justify-between card-shadow animate-pulse">
      <div className="space-y-6">
        {/* Title & subtitle skeleton */}
        <div className="space-y-2">
          <div className="h-7 w-40 rounded-lg animate-shimmer" />
          <div className="h-4 w-60 rounded-md animate-shimmer" />
        </div>

        {/* Social buttons skeleton */}
        <div className="space-y-2.5 pt-2">
          <div className="h-10 w-full rounded-xl animate-shimmer" />
        </div>

        {/* Divider skeleton */}
        <div className="flex items-center gap-3 py-1">
          <div className="h-[1px] flex-1 bg-[#E7E2DA]" />
          <div className="h-3 w-8 rounded bg-[#E7E2DA]" />
          <div className="h-[1px] flex-1 bg-[#E7E2DA]" />
        </div>

        {/* Form fields skeleton */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="h-3 w-20 rounded bg-[#E7E2DA]" />
            <div className="h-10 w-full rounded-xl animate-shimmer" />
          </div>
          {isSignUp && (
            <div className="space-y-1.5">
              <div className="h-3 w-24 rounded bg-[#E7E2DA]" />
              <div className="h-10 w-full rounded-xl animate-shimmer" />
            </div>
          )}
        </div>

        {/* Primary button skeleton */}
        <div className="h-11 w-full rounded-xl bg-[#285691]/20 animate-shimmer mt-4" />
      </div>

      {/* Footer link skeleton */}
      <div className="h-4 w-44 mx-auto rounded bg-[#E7E2DA] mt-6" />
    </div>
  );
}

export default function SignInPage() {
  return (
    <div className="min-h-screen w-full flex bg-[#F7F6F5] relative overflow-hidden bg-grid-pattern">
      {/* Decorative ambient background glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#B6CFEC]/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#86BC98]/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-center min-h-screen p-4 sm:p-8 lg:p-12 gap-8 lg:gap-16 z-10">
        
        {/* Left Side: Brand Showcase & Features */}
        <div className="flex-1 max-w-xl flex flex-col justify-center space-y-8 py-6">
          
          {/* Brand Logo & Pill */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#285691] to-[#1F4373] flex items-center justify-center shadow-md shadow-[#285691]/20">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25A2.25 2.25 0 0113.5 8.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-extrabold text-xl text-[#201C17] tracking-tight">WorkDashboard</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#EEF3FB] text-[#285691] border border-[#B6CFEC]">
                  v4.0 Enterprise
                </span>
              </div>
              <p className="text-xs text-[#7B7265]">Engineering Capacity & Operations</p>
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-3">
            <h1 className="font-display text-3xl sm:text-4xl lg:text-[42px] font-bold text-[#201C17] leading-[1.15] tracking-tight">
              Engineering capacity, <br />
              <span className="bg-gradient-to-r from-[#285691] to-[#3F8258] bg-clip-text text-transparent">
                measured & balanced.
              </span>
            </h1>
            <p className="text-[#4A4239] text-base leading-relaxed max-w-lg">
              Manage squad workload, track real-time active sprint timers, and resolve engineering blockers before they impact delivery.
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            <div className="bg-white/80 backdrop-blur-sm border border-[#E7E2DA] rounded-xl p-3.5 card-shadow transition-all hover:border-[#B6CFEC]">
              <div className="w-7 h-7 rounded-lg bg-[#EEF3FB] text-[#285691] flex items-center justify-center text-sm mb-2 font-bold">
                ⚡
              </div>
              <h3 className="font-display text-xs font-bold text-[#201C17]">Capacity Intelligence</h3>
              <p className="text-[11px] text-[#7B7265] mt-0.5">Automated 40h/week baseline with overhead budgeting.</p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm border border-[#E7E2DA] rounded-xl p-3.5 card-shadow transition-all hover:border-[#B6CFEC]">
              <div className="w-7 h-7 rounded-lg bg-[#EEF6F0] text-[#326A47] flex items-center justify-center text-sm mb-2 font-bold">
                ⏱️
              </div>
              <h3 className="font-display text-xs font-bold text-[#201C17]">Real-Time Timers</h3>
              <p className="text-[11px] text-[#7B7265] mt-0.5">Stopwatch accuracy synced to sprint task work logs.</p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm border border-[#E7E2DA] rounded-xl p-3.5 card-shadow transition-all hover:border-[#B6CFEC]">
              <div className="w-7 h-7 rounded-lg bg-[#FBEEEC] text-[#8E3722] flex items-center justify-center text-sm mb-2 font-bold">
                🛡️
              </div>
              <h3 className="font-display text-xs font-bold text-[#201C17]">Blocker Registry</h3>
              <p className="text-[11px] text-[#7B7265] mt-0.5">Cross-squad dependency and vendor bottleneck alerts.</p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm border border-[#E7E2DA] rounded-xl p-3.5 card-shadow transition-all hover:border-[#B6CFEC]">
              <div className="w-7 h-7 rounded-lg bg-[#FBF3E7] text-[#97621C] flex items-center justify-center text-sm mb-2 font-bold">
                📊
              </div>
              <h3 className="font-display text-xs font-bold text-[#201C17]">Role-Based Views</h3>
              <p className="text-[11px] text-[#7B7265] mt-0.5">Dedicated Manager and Developer dashboards.</p>
            </div>
          </div>

          {/* Footer assurance badge */}
          <div className="flex items-center gap-2 text-xs text-[#7B7265] pt-1">
            <span className="w-2 h-2 rounded-full bg-[#326A47] animate-pulse" />
            <span>Secure Enterprise Single Sign-On (SSO) & RBAC Enabled</span>
          </div>

        </div>

        {/* Right Side: Smooth Clerk Auth Container */}
        <div className="w-full sm:w-auto flex justify-center min-h-[460px] min-w-[340px]">
          <ClerkLoading>
            <AuthCardSkeleton isSignUp={false} />
          </ClerkLoading>
          <ClerkLoaded>
            <div className="elevated-shadow rounded-2xl animate-fade-in">
              <SignIn appearance={clerkAppearance} />
            </div>
          </ClerkLoaded>
        </div>

      </div>
    </div>
  );
}
