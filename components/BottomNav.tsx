"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { haptics } from "@/lib/haptics";

const tabs = [
  { href: "/", label: "Home", icon: "\uD83D\uDD25" },
  { href: "/roast", label: "Roast", icon: "\uD83C\uDFA4" },
  { href: "/challenge", label: "Daily", icon: "\uD83C\uDFC6" },
  { href: "/leaderboard", label: "Ranks", icon: "\uD83D\uDCCA" },
  { href: "/profile", label: "Me", icon: "\uD83D\uDC64" },
];

export function BottomNav() {
  const pathname = usePathname();

  const handleTabClick = () => {
    haptics.tap();
  };

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-30 border-t border-[var(--border-subtle)] bg-[var(--nav-bg)] backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Main navigation"
    >
      <div className="max-w-lg mx-auto flex">
        {tabs.map((tab) => {
          const active =
            tab.href === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              onClick={handleTabClick}
              aria-label={tab.label}
              aria-current={active ? "page" : undefined}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs transition-all ${
                active
                  ? "text-orange-400"
                  : "text-orange-200/60 hover:text-orange-200/70"
              }`}
            >
              <span className={`text-lg transition-transform ${active ? "scale-110" : ""}`}>
                {tab.icon}
              </span>
              <span>{tab.label}</span>
              {/* Active indicator pill */}
              {active && (
                <span className="w-1 h-1 rounded-full bg-orange-400 mt-0.5" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
