"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import Image from "next/image";
import ButtonCircle from "./UI/ButtonCircle";

export default function Footer() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // or a generic footer placeholder to avoid hydration mismatch
  }

  return (
    <footer className="w-full bg-[#241F29] text-white px-6 md:px-20 py-16">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* TOP */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-8">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Aptos Foundation Logo" width={32} height={32} className="w-8 h-8" />
            <span className="text-xl font-light">Aptos Foundation</span>
          </div>

          <div className="flex items-center gap-3 border border-white/20 rounded-full px-4 py-2 text-sm">
            <button
              onClick={() => setTheme('light')}
              className={`transition-opacity ${theme === 'light' ? 'opacity-100 font-medium' : 'opacity-60 hover:opacity-100'}`}
            >
              Light
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`transition-opacity ${theme === 'dark' ? 'opacity-100 font-medium' : 'opacity-60 hover:opacity-100'}`}
            >
              Dark
            </button>
            <button
              onClick={() => setTheme('system')}
              className={`transition-opacity ${theme === 'system' ? 'opacity-100 font-medium' : 'opacity-60 hover:opacity-100'}`}
            >
              System
            </button>
          </div>
        </div>

        <div className="border-t border-white/10 pt-14 grid grid-cols-1 md:grid-cols-4 gap-12 text-sm">
          {/* NEWSLETTER */}
          <div>
            <p className="uppercase tracking-wider text-xs opacity-60 mb-4">Newsletter</p>
            <p className="leading-relaxed mb-6 max-w-xs">
              Subscribe to our mailing list to receive the latest updates.
            </p>
            <ButtonCircle />
          </div>

          {/* BUILD ON APTOS */}
          <div>
            <p className="uppercase tracking-wider text-xs opacity-60 mb-4">Build on Aptos</p>
            <ul className="space-y-2">
              <li>Dev Docs ↗</li>
              <li>Github ↗</li>
              <li>Grants</li>
              <li>LFM</li>
              <li>Assembly</li>
              <li>Bug Bounty ↗</li>
            </ul>
          </div>

          {/* ECOSYSTEM */}
          <div>
            <p className="uppercase tracking-wider text-xs opacity-60 mb-4">Ecosystem & Community</p>
            <ul className="space-y-2">
              <li>Ecosystem Directory</li>
              <li>Events</li>
              <li>Local Communities ↗</li>
              <li>Aptos Collective</li>
              <li>Node Operations ↗</li>
              <li>Explorers</li>
              <li>Ecosystem Jobs</li>
            </ul>
          </div>

          {/* ABOUT */}
          <div>
            <p className="uppercase tracking-wider text-xs opacity-60 mb-4">About & Resources</p>
            <ul className="space-y-2">
              <li>Foundation</li>
              <li>Whitepaper</li>
              <li>Use Cases</li>
              <li>Blog</li>
              <li>Media Kit</li>
              <li>Careers</li>
              <li>Climate</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center pt-10 border-t border-white/10 gap-6">
          <p className="text-xs opacity-60">© 2025 Aptos Network</p>

          <div className="flex items-center gap-4 text-xl opacity-80">
            <span>◎</span>
            <span>●</span>
            <span>✈</span>
            <span>in</span>
            <span>▶</span>
            <span>☻</span>
            <span>⧉</span>
            <span>✕</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
