"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

export type Section = { id: string; label: string };

export function SectionNav({ sections }: { sections: Section[] }) {
  const [active, setActive] = useState(sections[0]?.id);

  useEffect(() => {
    const elements = sections
      .map((section) => document.getElementById(section.id))
      .filter((el): el is HTMLElement => el !== null);

    const observer = new IntersectionObserver(
      (entries) => {
        const topmost = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
          )[0];
        if (topmost) setActive(topmost.target.id);
      },
      { rootMargin: "-15% 0px -75% 0px" },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  if (sections.length < 2) return null;

  return (
    <nav
      aria-label="On this page"
      className="sticky top-0 z-10 -mx-4 border-b border-hairline bg-canvas-lavender/80 px-4 py-2 backdrop-blur sm:-mx-8 sm:px-8"
    >
      <ul className="flex gap-1 overflow-x-auto">
        {sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              aria-current={active === section.id ? "true" : undefined}
              className={cn(
                "inline-block whitespace-nowrap rounded-pill px-3 py-1.5 font-sans text-caption font-bold transition-colors",
                active === section.id
                  ? "bg-primary text-on-primary"
                  : "text-ink-mute hover:bg-canvas hover:text-ink",
              )}
            >
              {section.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
