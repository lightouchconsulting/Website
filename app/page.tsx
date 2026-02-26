"use client";

import { useEffect, useRef } from "react";

export default function Home() {
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const mobileNavRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const formStatusRef = useRef<HTMLParagraphElement>(null);
  const contactFormRef = useRef<HTMLFormElement>(null);
  const contactSubmitBtnRef = useRef<HTMLButtonElement>(null);
  const yearRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    // Year auto-update
    if (yearRef.current) {
      yearRef.current.textContent = String(new Date().getFullYear());
    }

    // Mobile menu toggle
    const menuBtn = menuBtnRef.current;
    const mobileNav = mobileNavRef.current;

    const handleMenuToggle = () => {
      if (!mobileNav || !menuBtn) return;
      const open = mobileNav.classList.toggle("hidden") === false;
      menuBtn.setAttribute("aria-expanded", String(open));
      menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    };

    menuBtn?.addEventListener("click", handleMenuToggle);

    // Close mobile nav when a link is clicked
    const mobileNavLinks = mobileNav ? mobileNav.querySelectorAll('a') : null;
    const closeNav = () => {
      if (!mobileNav || !menuBtn) return;
      mobileNav.classList.add('hidden');
      menuBtn.setAttribute('aria-expanded', 'false');
    };
    mobileNavLinks?.forEach(link => link.addEventListener('click', closeNav));

    // Header shadow on scroll
    const header = headerRef.current;
    const toggleShadow = () => {
      if (!header) return;
      if (window.scrollY > 4) header.classList.add("shadow-lg");
      else header.classList.remove("shadow-lg");
    };
    toggleShadow();
    window.addEventListener("scroll", toggleShadow, { passive: true });

    // Animate cards on scroll
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    document.querySelectorAll(".fade-card").forEach((card) => observer.observe(card));

    // Formspree AJAX submit
    const contactForm = contactFormRef.current;
    const formStatus = formStatusRef.current;
    const contactSubmitBtn = contactSubmitBtnRef.current;

    const handleFormSubmit = async (e: Event) => {
      e.preventDefault();
      if (!contactForm || !formStatus) return;

      formStatus.classList.remove("hidden");
      formStatus.textContent = "Sending\u2026";

      if (contactSubmitBtn) {
        contactSubmitBtn.disabled = true;
        contactSubmitBtn.classList.add("opacity-70", "cursor-not-allowed");
      }

      try {
        const response = await fetch(contactForm.action, {
          method: "POST",
          body: new FormData(contactForm),
          headers: { Accept: "application/json" },
        });

        if (response.ok) {
          formStatus.textContent =
            "Thanks \u2014 we\u2019ll be in touch within one business day.";
          contactForm.reset();
        } else {
          formStatus.textContent =
            "Sorry \u2014 something went wrong. Please try again later.";
          console.error("Formspree error:", await response.text());
        }
      } catch (error) {
        formStatus.textContent = "Network error. Please try again.";
        console.error(error);
      } finally {
        if (contactSubmitBtn) {
          contactSubmitBtn.disabled = false;
          contactSubmitBtn.classList.remove("opacity-70", "cursor-not-allowed");
        }
      }
    };

    contactForm?.addEventListener("submit", handleFormSubmit);

    return () => {
      menuBtn?.removeEventListener("click", handleMenuToggle);
      mobileNavLinks?.forEach(link => link.removeEventListener('click', closeNav));
      window.removeEventListener("scroll", toggleShadow);
      observer.disconnect();
      contactForm?.removeEventListener("submit", handleFormSubmit);
    };
  }, []);

  return (
    <>
      {/* Header / Navigation */}
      <header
        id="site-header"
        ref={headerRef}
        className="sticky top-0 z-40 bg-black/90 backdrop-blur transition-shadow"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <a href="#" className="flex items-center gap-2 group" aria-label="Lightouch.com home">
              <span className="text-xl font-bold tracking-wide">Lightouch™ Consulting</span>
            </a>

            {/* Desktop nav */}
            <nav className="hidden md:flex space-x-6" aria-label="Primary">
              <a href="#who" className="hover:text-yellow-400">Who We Are</a>
              <a href="#what" className="hover:text-yellow-400">What We Do</a>
              <a href="#methods" className="hover:text-yellow-400">Methods &amp; Tools</a>
              <a href="#values" className="hover:text-yellow-400">Our Values</a>
              <a href="#contact" className="hover:text-yellow-400">Contact</a>
            </nav>

            {/* Mobile menu button */}
            <button
              id="menuBtn"
              ref={menuBtnRef}
              className="md:hidden p-2 rounded-lg border border-slate-300 focus-ring"
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

        <nav
          id="mobileNav"
          ref={mobileNavRef}
          className="md:hidden hidden fixed top-16 left-0 w-full bg-black z-50 border-t border-slate-200"
          aria-label="Mobile"
        >
          <div className="px-4 py-3 flex flex-col gap-2">
            <a href="#who" className="py-2">Who We Are</a>
            <a href="#what" className="py-2">What We Do</a>
            <a href="#methods" className="py-2">Methods &amp; Tools</a>
            <a href="#values" className="py-2">Our Values</a>
            <a href="#contact" className="py-2">Contact</a>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0 w-full h-full">
          <video
            autoPlay
            playsInline
            loop
            muted
            className="w-full h-full object-cover"
            id="video-bg"
          >
            <source
              src="https://assets.codepen.io/319606/tactus-waves-hero-sm.mp4"
              type="video/mp4"
            />
          </video>
        </div>

        {/* Hero text */}
        <div className="relative z-20 text-center">
          <h1 className="text-6xl md:text-7xl font-extrabold text-white">
            We are the last<br />consultants you will need.
          </h1>
          <p className="text-xl text-white mt-4">
            GenAI-native, challenger management consultancy for CIO&apos;s and technology leaders.
          </p>
          <a
            href="#contact"
            className="mt-6 inline-block px-6 py-3 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-500 transition"
          >
            Let&apos;s talk results
          </a>
        </div>
      </section>

      {/* Who We Are */}
      <section id="who" className="py-20 bg-gray-900">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold mb-6 text-center">Who We Are</h2>
          <div className="grid gap-8 md:grid-cols-3 mb-10">
            <div className="fade-card p-6 bg-black rounded-2xl shadow-lg">
              <i className="fa-solid fa-user-tie text-white-400 text-4xl mb-4"></i>
              <h3 className="text-xl font-semibold mb-2">Built for CIOs</h3>
              <p className="text-gray-400">A new kind of consultancy for technology leaders who expect more from their advisors.</p>
            </div>
            <div className="fade-card p-6 bg-black rounded-2xl shadow-lg">
              <i className="fa-solid fa-robot text-white-400 text-4xl mb-4"></i>
              <h3 className="text-xl font-semibold mb-2">GenAI + Expertise</h3>
              <p className="text-gray-400">Tier 1 Consultants + Generative AI to deliver rapid, high-quality results.</p>
            </div>
            <div className="fade-card p-6 bg-black rounded-2xl shadow-lg">
              <i className="fa-solid fa-hand-holding-heart text-white-400 text-4xl mb-4"></i>
              <h3 className="text-xl font-semibold mb-2">Enablement First</h3>
              <p className="text-gray-400">We leave you fully equipped to keep moving forward, independently.</p>
            </div>
          </div>
          <div className="text-center">
            <a href="#methods" className="btn-secondary">Discover our story</a>
          </div>
        </div>
      </section>

      {/* What We Do */}
      <section id="what" className="py-20 bg-black">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold mb-8 text-center">What We Do</h2>
          <p className="text-center text-gray-300 max-w-3xl mx-auto mb-10">
            Lightouch helps CIOs and technology leaders achieve rapid, high-quality results using GenerativeAI.
          </p>

          {/* Services */}
          <div className="grid gap-8 md:grid-cols-3">
            <div className="fade-card p-6 bg-gray-900 rounded-2xl shadow-lg">
              <i className="fa-solid fa-diagram-project text-white-400 text-4xl mb-4"></i>
              <h3 className="text-xl font-semibold mb-2">Technology &amp; Digital Transformation</h3>
              <p className="text-gray-400">Roadmaps, transformation programmes, new tech adoption, and project assurance.</p>
            </div>
            <div className="fade-card p-6 bg-gray-900 rounded-2xl shadow-lg">
              <i className="fa-solid fa-file-signature text-white-400 text-4xl mb-4"></i>
              <h3 className="text-xl font-semibold mb-2">GenAI-Enabled Delivery</h3>
              <p className="text-gray-400">Consultant-grade blueprints, strategies and plans — produced faster and to a higher standard.</p>
            </div>
            <div className="fade-card p-6 bg-gray-900 rounded-2xl shadow-lg">
              <i className="fa-solid fa-bolt text-white-400 text-4xl mb-4"></i>
              <h3 className="text-xl font-semibold mb-2">GenAI Adoption Support</h3>
              <p className="text-gray-400">Implementation and enablement for your teams, powered by <span className="font-semibold">Vivet.ai</span>.</p>
            </div>
          </div>

          {/* Method highlight */}
          <div className="fade-card mt-8 p-6 bg-gray-900 rounded-2xl shadow-lg">
            <div className="flex items-start gap-4">
              <i className="fa-solid fa-stopwatch text-white-400 text-3xl"></i>
              <div>
                <h4 className="text-lg font-semibold mb-1">The Lightouch Method</h4>
                <p className="text-gray-400">High-value GenAI use cases identified and deployed in just six weeks.</p>
              </div>
            </div>
          </div>

          {/* Key benefits */}
          <div className="mt-10">
            <h3 className="text-2xl font-bold mb-4 text-center">Key benefits</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div className="fade-card bg-gray-900 rounded-xl p-4 text-center">Faster results</div>
              <div className="fade-card bg-gray-900 rounded-xl p-4 text-center">Cost savings</div>
              <div className="fade-card bg-gray-900 rounded-xl p-4 text-center">Independence after delivery</div>
              <div className="fade-card bg-gray-900 rounded-xl p-4 text-center">Practical, actionable outcomes</div>
              <div className="fade-card bg-gray-900 rounded-xl p-4 text-center">Direct access to experienced consultants</div>
            </div>
          </div>

          <div className="text-center mt-10">
            <a href="#contact" className="btn-primary">Request a demo or consultation</a>
          </div>
        </div>
      </section>

      {/* Our Methods & Tools */}
      <section id="methods" className="py-20 bg-gray-900">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold mb-8 text-center">Our Methods &amp; Tools</h2>
          <p className="text-center text-gray-300 max-w-3xl mx-auto mb-10">
            How we deliver matters as much as what we deliver.
          </p>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Approach */}
            <div className="fade-card p-6 bg-black rounded-2xl shadow-lg">
              <div className="flex items-start gap-4 mb-4">
                <i className="fa-solid fa-compass-drafting text-white-400 text-3xl"></i>
                <h3 className="text-xl font-semibold">Our approach</h3>
              </div>
              <ul className="space-y-3 text-gray-300">
                <li><i className="fa-regular fa-circle-check text-white-400 mr-2"></i>Alignment with standards: ISO, ITIL, PMI where relevant.</li>
                <li><i className="fa-regular fa-circle-check text-white-400 mr-2"></i>Proprietary methods from Tier 1 experience for complex challenges.</li>
                <li><i className="fa-regular fa-circle-check text-white-400 mr-2"></i>User-centred, collaborative delivery with stakeholder engagement.</li>
                <li><i className="fa-regular fa-circle-check text-white-400 mr-2"></i>Adaptability: every method tailored to your context.</li>
              </ul>
            </div>

            {/* Tools */}
            <div className="fade-card p-6 bg-black rounded-2xl shadow-lg">
              <div className="flex items-start gap-4 mb-4">
                <i className="fa-solid fa-toolbox text-white-400 text-3xl"></i>
                <h3 className="text-xl font-semibold">Our tools</h3>
              </div>
              <ul className="space-y-3 text-gray-300">
                <li><i className="fa-regular fa-circle-check text-white-400 mr-2"></i><span className="font-semibold">Vivet.ai</span>: GenAI platform producing consultant-level outputs up to 10&times; faster.</li>
                <li><i className="fa-regular fa-circle-check text-white-400 mr-2"></i>Embedded methods: pre-configured frameworks your team can keep using.</li>
                <li><i className="fa-regular fa-circle-check text-white-400 mr-2"></i>Built-in collaboration for stakeholder feedback and engagement.</li>
                <li><i className="fa-regular fa-circle-check text-white-400 mr-2"></i>Ongoing access: continue using Vivet.ai and our methods independently.</li>
              </ul>
            </div>
          </div>

          <div className="text-center mt-10">
            <a href="#contact" className="btn-primary">Find out how we work</a>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section id="values" className="py-20 bg-gray-900">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold mb-8 text-center">Our Values</h2>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="fade-card p-6 bg-black rounded-2xl shadow-lg">
              <i className="fa-solid fa-eye text-white-400 text-4xl mb-4"></i>
              <h3 className="text-xl font-semibold mb-2">Transparency</h3>
              <p className="text-gray-400">We show you exactly how our methods work and leave you with the tools to use them yourself. <span className="italic">(e.g. every project includes a handover session.)</span></p>
            </div>
            <div className="fade-card p-6 bg-black rounded-2xl shadow-lg">
              <i className="fa-solid fa-lightbulb text-white-400 text-4xl mb-4"></i>
              <h3 className="text-xl font-semibold mb-2">Innovation</h3>
              <p className="text-gray-400">We harness Generative AI and build custom solutions like Vivet.ai into our work. <span className="italic">(e.g. each engagement leverages the latest AI tools.)</span></p>
            </div>
            <div className="fade-card p-6 bg-black rounded-2xl shadow-lg">
              <i className="fa-solid fa-user-graduate text-white-400 text-4xl mb-4"></i>
              <h3 className="text-xl font-semibold mb-2">Client Enablement</h3>
              <p className="text-gray-400">We ensure your teams can keep generating value long after we&apos;ve wrapped up. <span className="italic">(e.g. you retain access to our frameworks and platforms.)</span></p>
            </div>
            <div className="fade-card p-6 bg-black rounded-2xl shadow-lg">
              <i className="fa-solid fa-briefcase text-white-400 text-4xl mb-4"></i>
              <h3 className="text-xl font-semibold mb-2">Professionalism &amp; Experience</h3>
              <p className="text-gray-400">Led by seasoned Tier 1 consultants. <span className="italic">(e.g. every client gets senior attention.)</span></p>
            </div>
            <div className="fade-card p-6 bg-black rounded-2xl shadow-lg md:col-span-2">
              <i className="fa-solid fa-person-running text-white-400 text-4xl mb-4"></i>
              <h3 className="text-xl font-semibold mb-2">Adaptability</h3>
              <p className="text-gray-400">We flex to your needs and move quickly. <span className="italic">(e.g. our approach is tailored for each engagement.)</span></p>
            </div>
          </div>

          <div className="text-center mt-10">
            <a href="#contact" className="btn-secondary">Let&apos;s work the right way, together</a>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20 bg-black">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-4xl font-bold mb-8 text-center">Contact Us</h2>

          <div className="fade-card bg-gray-900 rounded-2xl p-6 mb-10">
            <p className="text-gray-300 mb-4">
              We make it easy to get in touch—whether you&apos;re ready to start or just want to know more.
            </p>
            <p className="text-gray-300 mb-4">
              Use the contact form below and we&apos;ll make sure your enquiry reaches the right person. We aim to respond within one business day.
            </p>
            <p className="text-gray-300 mb-4">
              We manage all client data in line with GDPR and only use your details to respond to your enquiry.
            </p>
            <p className="text-gray-300">
              If you need information in an alternative format or require assistance, let us know in your message.
            </p>
          </div>

          <form
            id="contactForm"
            ref={contactFormRef}
            action="https://formspree.io/f/mvzalpbp"
            method="POST"
            className="grid gap-6"
          >
            <div className="grid md:grid-cols-2 gap-6">
              <input
                name="name"
                type="text"
                required
                autoComplete="name"
                placeholder="Your Name"
                className="p-3 rounded-lg bg-gray-800 text-gray-200 focus:outline-none"
              />
              <input
                name="company"
                type="text"
                autoComplete="organization"
                placeholder="Company"
                className="p-3 rounded-lg bg-gray-800 text-gray-200 focus:outline-none"
              />
            </div>

            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="Your Email"
              className="p-3 rounded-lg bg-gray-800 text-gray-200 focus:outline-none"
            />

            <textarea
              name="message"
              required
              placeholder="Your Message"
              rows={6}
              className="p-3 rounded-lg bg-gray-800 text-gray-200 focus:outline-none"
            ></textarea>

            {/* Optional metadata */}
            <input type="hidden" name="_subject" value="New enquiry from LightouchConsulting.com" />
            <input type="text" name="_gotcha" style={{ display: "none" }} tabIndex={-1} aria-hidden="true" />

            <button
              id="contactSubmitBtn"
              ref={contactSubmitBtnRef}
              type="submit"
              className="justify-self-center px-6 py-3 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-500 transition"
            >
              Start the conversation today
            </button>

            <p
              id="formStatus"
              ref={formStatusRef}
              className="text-center text-gray-300 mt-2 hidden"
              aria-live="polite"
            ></p>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-6 text-center text-gray-500 text-sm">
        &copy; <span ref={yearRef} id="year"></span> Lightouch Consulting. All rights reserved.
      </footer>
    </>
  );
}
