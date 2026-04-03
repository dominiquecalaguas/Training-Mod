"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import posthog from "posthog-js";
import { useState } from "react";
import { LogIn, Menu, UserPlus, X } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";

function NavLinkLucide({
  href,
  icon: Icon,
  label,
  onClick,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const active =
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`group flex flex-col items-center gap-1.5 rounded-lg px-2 py-2.5 text-center text-xs font-medium transition ${
        active
          ? "bg-white/10 text-white"
          : "text-neutral-400 hover:bg-white/5 hover:text-neutral-100"
      }`}
    >
      <Icon
        className={`h-6 w-6 shrink-0 transition-opacity ${
          active
            ? "opacity-100"
            : "opacity-[0.55] group-hover:opacity-100"
        }`}
        aria-hidden
      />
      <span>{label}</span>
    </Link>
  );
}

/** Sidebar icons: static, hover, and selected (current route). */
export const SIDEBAR_ICONS = {
  home: "/images/sidebar/home.svg",
  homeHover: "/images/sidebar/home-hover.svg",
  homeSelected: "/images/sidebar/home-selected.svg",
  dashboard: "/images/sidebar/dashboard.svg",
  dashboardHover: "/images/sidebar/dashboard-hover.svg",
  dashboardSelected: "/images/sidebar/dashboard-selected.svg",
  admin: "/images/sidebar/admin.svg",
  adminHover: "/images/sidebar/admin-hover.svg",
  adminSelected: "/images/sidebar/admin-selected.svg",
  profile: "/images/sidebar/profile.svg",
  profileHover: "/images/sidebar/profile-hover.svg",
  profileSelected: "/images/sidebar/profile-selected.svg",
  signOut: "/images/sidebar/sign-out.svg",
  signOutHover: "/images/sidebar/sign-out-hover.svg",
  signOutSelected: "/images/sidebar/sign-out-selected.svg",
} as const;

export type AppShellUser = {
  role: string;
  displayName: string;
} | null;

function SidebarGlyph({
  src,
  hoverSrc,
  selectedSrc,
  active,
  sizePx = 28,
}: {
  src: string;
  hoverSrc?: string;
  selectedSrc?: string;
  active: boolean;
  /** Default 28; sign out uses 26. */
  sizePx?: number;
}) {
  const box = Math.max(32, sizePx + 4);
  if (active) {
    const chosen = selectedSrc ?? src;
    return (
      <span
        className="flex shrink-0 items-center justify-center"
        style={{ width: box, height: box }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={chosen}
          alt=""
          width={sizePx}
          height={sizePx}
          className="object-contain opacity-100"
          style={{ width: sizePx, height: sizePx }}
        />
      </span>
    );
  }
  if (!hoverSrc) {
    return (
      <span
        className="flex shrink-0 items-center justify-center"
        style={{ width: box, height: box }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          width={sizePx}
          height={sizePx}
          className="object-contain opacity-[0.55] transition-opacity group-hover:opacity-100"
          style={{ width: sizePx, height: sizePx }}
        />
      </span>
    );
  }
  return (
    <span
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: box, height: box }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        width={sizePx}
        height={sizePx}
        className="object-contain opacity-[0.55] transition-opacity group-hover:opacity-0"
        style={{ width: sizePx, height: sizePx }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={hoverSrc}
        alt=""
        width={sizePx}
        height={sizePx}
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 object-contain opacity-0 transition-opacity group-hover:opacity-100"
        style={{ width: sizePx, height: sizePx }}
      />
    </span>
  );
}

function NavLink({
  href,
  iconSrc,
  iconHoverSrc,
  iconSelectedSrc,
  label,
  onClick,
}: {
  href: string;
  iconSrc: string;
  iconHoverSrc?: string;
  iconSelectedSrc?: string;
  label: string;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const active =
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`group flex flex-col items-center gap-1.5 rounded-lg px-2 py-2.5 text-center text-xs font-medium transition ${
        active
          ? "bg-white/10 text-white"
          : "text-neutral-400 hover:bg-white/5 hover:text-neutral-100"
      }`}
    >
      <SidebarGlyph
        src={iconSrc}
        hoverSrc={iconHoverSrc}
        selectedSrc={iconSelectedSrc}
        active={active}
      />
      <span>{label}</span>
    </Link>
  );
}

function SidebarNav({
  user,
  onNavigate,
}: {
  user: AppShellUser;
  onNavigate?: () => void;
}) {
  const router = useRouter();

  async function handleLogout() {
    onNavigate?.();
    posthog.capture("user_signed_out");
    posthog.reset();
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const isAdmin = user?.role === "admin";

  return (
    <div className="flex flex-1 flex-col gap-1 px-2 py-4">
      <NavLink
        href="/"
        iconSrc={SIDEBAR_ICONS.home}
        iconHoverSrc={SIDEBAR_ICONS.homeHover}
        iconSelectedSrc={SIDEBAR_ICONS.homeSelected}
        label="Home"
        onClick={onNavigate}
      />
      {isAdmin && (
        <>
          <div className="my-2 border-t border-neutral-700/80" />
          <NavLink
            href="/dashboard"
            iconSrc={SIDEBAR_ICONS.dashboard}
            iconHoverSrc={SIDEBAR_ICONS.dashboardHover}
            iconSelectedSrc={SIDEBAR_ICONS.dashboardSelected}
            label="Dashboard"
            onClick={onNavigate}
          />
          <NavLink
            href="/admin/courses"
            iconSrc={SIDEBAR_ICONS.admin}
            iconHoverSrc={SIDEBAR_ICONS.adminHover}
            iconSelectedSrc={SIDEBAR_ICONS.adminSelected}
            label="Admin"
            onClick={onNavigate}
          />
        </>
      )}
      {user && (
        <>
          <div className="my-2 border-t border-neutral-700/80" />
          <NavLink
            href="/profile"
            iconSrc={SIDEBAR_ICONS.profile}
            iconHoverSrc={SIDEBAR_ICONS.profileHover}
            iconSelectedSrc={SIDEBAR_ICONS.profileSelected}
            label="Profile"
            onClick={onNavigate}
          />
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="group flex w-full flex-col items-center gap-1.5 rounded-lg px-2 py-2.5 text-center text-xs font-medium text-neutral-400 transition hover:bg-white/5 hover:text-neutral-100"
          >
            <SidebarGlyph
              src={SIDEBAR_ICONS.signOut}
              hoverSrc={SIDEBAR_ICONS.signOutHover}
              active={false}
              sizePx={26}
            />
            <span>Sign out</span>
          </button>
        </>
      )}
      {!user && (
        <>
          <div className="my-2 border-t border-neutral-700/80" />
          <NavLinkLucide
            href="/login"
            icon={LogIn}
            label="Log in"
            onClick={onNavigate}
          />
          <NavLinkLucide
            href="/register"
            icon={UserPlus}
            label="Sign up"
            onClick={onNavigate}
          />
        </>
      )}
    </div>
  );
}

export function AppShell({
  user,
  children,
}: {
  user: AppShellUser;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const close = () => setMobileOpen(false);

  const sidebar = (
    <>
      <div className="border-b border-neutral-700/80 px-4 py-5">
        <Link
          href="/"
          className="flex justify-center"
          onClick={close}
        >
          <BrandMark variant="onDark" className="mx-auto max-h-14 max-w-[9rem]" />
        </Link>
      </div>
      <SidebarNav user={user} onNavigate={close} />
    </>
  );

  return (
    <div className="flex min-h-screen bg-white text-neutral-900">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-neutral-800 bg-[#2a2a2e] md:flex">
        {sidebar}
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 md:hidden"
          aria-hidden
          onClick={close}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-56 flex-col border-r border-neutral-800 bg-[#2a2a2e] shadow-xl transition-transform duration-200 ease-out md:hidden ${
          mobileOpen ? "translate-x-0" : "pointer-events-none -translate-x-full"
        }`}
      >
        <div className="flex items-center justify-end border-b border-neutral-700/80 px-2 py-2">
          <button
            type="button"
            className="rounded-md p-2 text-neutral-400 hover:bg-white/10 hover:text-white"
            aria-label="Close menu"
            onClick={close}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {sidebar}
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-neutral-200 bg-white px-4 md:hidden">
          <button
            type="button"
            className="rounded-md p-2 text-neutral-700 hover:bg-neutral-100"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <BrandMark variant="onLight" className="max-h-8 max-w-[7rem]" />
        </header>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
