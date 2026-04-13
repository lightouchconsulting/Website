"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

export default function SiteHeader() {
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const mobileNavRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const menuBtn = menuBtnRef.current;
    const mobileNav = mobileNavRef.current;

    const handleMenuToggle = () => {
      if (!mobileNav || !menuBtn) return;
      const open = mobileNav.classList.toggle("hidden") === false;
      menuBtn.setAttribute("aria-expanded", String(open));
      menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    };

    menuBtn?.addEventListener("click", handleMenuToggle);

    const mobileNavLinks = mobileNav ? mobileNav.querySelectorAll("a") : null;
    const closeNav = () => {
      if (!mobileNav || !menuBtn) return;
      mobileNav.classList.add("hidden");
      menuBtn.setAttribute("aria-expanded", "false");
    };
    mobileNavLinks?.forEach((link) => link.addEventListener("click", closeNav));

    const header = headerRef.current;
    const toggleShadow = () => {
      if (!header) return;
      if (window.scrollY > 4) header.classList.add("shadow-lg");
      else header.classList.remove("shadow-lg");
    };
    toggleShadow();
    window.addEventListener("scroll", toggleShadow, { passive: true });

    return () => {
      menuBtn?.removeEventListener("click", handleMenuToggle);
      mobileNavLinks?.forEach((link) =>
        link.removeEventListener("click", closeNav)
      );
      window.removeEventListener("scroll", toggleShadow);
    };
  }, []);

  const navLinks = [
    { href: "/#what", label: "What We Do" },
    { href: "/#methods", label: "Methods & Tools" },
    { href: "/#values", label: "Our Values" },
    { href: "/insights", label: "Insights" },
    { href: "/#contact", label: "Contact" },
  ];

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-40 bg-black/90 backdrop-blur transition-shadow"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2"
            aria-label="Lightouch Consulting home"
          >
            <span className="text-xl font-bold tracking-wide">
              Lightouch™ Consulting
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex space-x-6" aria-label="Primary">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="hover:text-yellow-400">
                {link.label}
              </a>
            ))}
          </nav>

          {/* Mobile menu button */}
          <button
            ref={menuBtnRef}
            className="md:hidden p-2 rounded-lg border border-slate-300"
            aria-expanded="false"
            aria-controls="mobileNav"
            aria-label="Open menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <nav
        id="mobileNav"
        ref={mobileNavRef}
        className="md:hidden hidden fixed top-16 left-0 w-full bg-black z-50 border-t border-slate-200"
        aria-label="Mobile"
      >
        <div className="px-4 py-3 flex flex-col gap-2">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="py-2 hover:text-yellow-400">
              {link.label}
            </a>
          ))}
        </div>
      </nav>
    </header>
  );
}
