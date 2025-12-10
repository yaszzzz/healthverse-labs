"use client";
import Image from "next/image";
import { useState, useRef } from "react";

type Item = { t: string; d: string };
type MenuKey = "about" | "ecosystem" | "build";

type MegaMenuProps = {
  title: string;
  itemsLeft: Item[];
  itemsMid: Item[];
  itemsRight: Item[];
  keepOpen: (menu: MenuKey) => void;
  close: () => void;
  menu: MenuKey;
};

export default function Navbar() {
  const [openMenu, setOpenMenu] = useState<MenuKey | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const open = (menu: MenuKey) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpenMenu(menu);
  };

  const close = () => {
    timeoutRef.current = setTimeout(() => setOpenMenu(null), 150);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 z-50 w-full flex justify-center pt-4 pb-4 md:pb-6">
        <div
          className="
               relative flex items-center bg-[#43334C]
          px-2 py-3 rounded-full gap-5 
          shadow-[0_6px_20px_rgba(0,0,0,0.25)]

          /* Desktop bubble width */
          md:min-w-[560px] md:max-w-[520px] md:h-[60px]

          /* Mobile */
          w-full max-w-[360px] justify-between
        "
        >
          {/* LOGO */}
          <div className="flex items-center gap-1">
            <Image
              src="/logo.png"
              alt="Logo"
              width={50}
              height={26}
              className="rounded-md pt-1"
            />
            <span className="font-[DreamingOutloudSans] tracking-[-0.04em] text-white text-xl mr-1">
              HealthVerse
            </span>
          </div>

          {/* DESKTOP MENU */}
          <div className="hidden md:flex gap-6">
            {(["about", "ecosystem", "build"] as MenuKey[]).map((m) => (
              <MenuButton
                key={m}
                name={m}
                label={m.toUpperCase()}
                open={open}
                close={close}
                active={openMenu === m}
              />
            ))}
          </div>

          {/* CTA DESKTOP */}
          <button
            className="bg-white text-black  rounded-full 
            text-[12px] hover:bg-[#8d7f96] transition hidden md:block lg:p-3"
          >
            Get Started
          </button>

          {/* MOBILE HAMBURGER */}
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden text-white text-2xl leading-none"
          >
            ☰
          </button>
        </div>

        {/* DESKTOP DROPDOWN */}
        <Dropdown openMenu={openMenu} open={open} close={close} />
      </nav>

      {/* ---------------- MOBILE SIDEBAR OVERLAY ---------------- */}
      <div
        className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-60 transition-opacity ${
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMobileOpen(false)}
      />

      {/* ---------------- MOBILE SIDEBAR PANEL ---------------- */}
      <div
        className={`
          fixed right-0 top-0 h-full w-[80%] max-w-[320px]
          bg-[#1b1b1b] text-white z-70
          p-6 shadow-xl border-l border-white/10
          transition-transform duration-300
          ${mobileOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <span className="text-lg font-semibold tracking-wide">Menu</span>
          <button
            className="text-3xl leading-none"
            onClick={() => setMobileOpen(false)}
          >
            ×
          </button>
        </div>

        {/* MENU LIST */}
        <div className="flex flex-col gap-5">
          <MobileMenuItem title="ABOUT" menuKey="about" />
          <MobileMenuItem title="ECOSYSTEM" menuKey="ecosystem" />
          <MobileMenuItem title="BUILD" menuKey="build" />

          <button className="bg-white text-[#43334C] py-2 rounded-lg mt-4 font-semibold">
            Get Started
          </button>
        </div>
      </div>
    </>
  );
}

/* ---------------- MENU BUTTON (DESKTOP) ---------------- */
function MenuButton({
  name,
  label,
  open,
  close,
  active,
}: {
  name: MenuKey;
  label: string;
  open: (m: MenuKey) => void;
  close: () => void;
  active: boolean;
}) {
  return (
    <div
      onMouseEnter={() => open(name)}
      onMouseLeave={close}
      className="relative cursor-pointer"
    >
      <span
        className={`text-white/80 text-[12px] font-medium pb-0.5 relative
        after:absolute after:left-0 after:-bottom-0.5
        after:h-0.5 after:bg-white after:transition-all after:duration-300
        ${
          active
            ? "text-white after:w-full"
            : "after:w-0 hover:text-white hover:after:w-full"
        }
        `}
      >
        {label}
      </span>
    </div>
  );
}

/* ---------------- MOBILE MENU ITEM (SLIDE RIGHT SUBMENU) ---------------- */
function MobileMenuItem({
  title,
  menuKey,
}: {
  title: string;
  menuKey: MenuKey;
}) {
  const [open, setOpen] = useState(false);

  const menus = {
    about: {
      items: [
        { t: "News", d: "Blogs & announcements" },
        { t: "Whitepaper", d: "Learn the protocol" },
      ],
    },
    ecosystem: {
      items: [
        { t: "Explore Projects", d: "Discover all apps" },
        { t: "Wallets", d: "Start your journey" },
      ],
    },
    build: {
      items: [
        { t: "Docs", d: "Developer documentation" },
        { t: "Move Language", d: "Smart contract language" },
      ],
    },
  };

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex justify-between items-center w-full text-left"
      >
        <span className="font-medium">{title}</span>
        <span className="text-lg">{open ? "−" : "+"}</span>
      </button>

      {/* SUBMENU */}
      <div
        className={`mt-2 ml-2 border-l border-white/10 pl-3 overflow-hidden transition-all ${
          open ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        {menus[menuKey].items.map((i, idx) => (
          <div key={idx} className="mb-3">
            <p className="font-medium text-sm">{i.t}</p>
            <p className="text-[11px] text-gray-400">{i.d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- DROPDOWN WRAPPER (DESKTOP) ---------------- */
function Dropdown({
  openMenu,
  open,
  close,
}: {
  openMenu: MenuKey | null;
  open: (m: MenuKey) => void;
  close: () => void;
}) {
  if (!openMenu) return null;

  const menus: Record<
    MenuKey,
    { title: string; itemsLeft: Item[]; itemsMid: Item[]; itemsRight: Item[] }
  > = {
    about: {
      title: "About Aptos Foundation",
      itemsLeft: [
        { t: "News", d: "Blogs, insights, and announcements" },
        { t: "Whitepaper", d: "Core concepts behind the protocol" },
      ],
      itemsMid: [
        { t: "Payments", d: "Instant global transactions" },
        { t: "Structured Finance", d: "Programmable markets" },
        { t: "DeFi", d: "Next-gen decentralized finance" },
        { t: "Media & Entertainment", d: "Creator ownership tools" },
      ],
      itemsRight: [
        { t: "Media Kit", d: "Logos & branding" },
        { t: "Careers", d: "Join the Aptos team" },
      ],
    },
    ecosystem: {
      title: "Aptos Ecosystem",
      itemsLeft: [
        { t: "Explore Projects", d: "All apps built on Aptos" },
        { t: "Wallets", d: "Start your Aptos journey" },
      ],
      itemsMid: [
        { t: "DeFi", d: "Trade, lend, borrow" },
        { t: "Gaming", d: "AAA-grade Web3 games" },
        { t: "NFTs", d: "Digital collectibles" },
      ],
      itemsRight: [
        { t: "Trending", d: "Hot this week" },
        { t: "Ecosystem Grants", d: "Builder funding" },
      ],
    },
    build: {
      title: "Build on Aptos",
      itemsLeft: [
        { t: "Docs", d: "Developer documentation" },
        { t: "Move Language", d: "Smart contract language" },
      ],
      itemsMid: [
        { t: "SDKs", d: "Developer tools" },
        { t: "API Reference", d: "API endpoints" },
        { t: "Tutorials", d: "Step-by-step guides" },
      ],
      itemsRight: [
        { t: "Github", d: "Source code" },
        { t: "Dev Grants", d: "Funding for builders" },
      ],
    },
  };

  return (
    <MegaMenu
      {...menus[openMenu]}
      menu={openMenu}
      keepOpen={open}
      close={close}
    />
  );
}

/* ---------------- MEGA MENU (DESKTOP) ---------------- */
function MegaMenu({
  title,
  itemsLeft,
  itemsMid,
  itemsRight,
  keepOpen,
  close,
  menu,
}: MegaMenuProps) {
  return (
    <div
      onMouseEnter={() => keepOpen(menu)}
      onMouseLeave={close}
      className="
        absolute top-[60px] left-1/2 -translate-x-1/2
        bg-[#1A151E] text-white p-5 rounded-2xl z-50
        border border-white/10 shadow-2xl animate-fadeIn pt-8
        w-[90vw] md:w-[650px]
      "
    >
      <h2 className="text-sm font-semibold opacity-90">{title} ➜</h2>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Column title="OVERVIEW" items={itemsLeft} />
        <Column title="USE CASES" items={itemsMid} />
        <Column title="RESOURCES" items={itemsRight} />
      </div>
    </div>
  );
}

/* ---------------- COLUMN ---------------- */
function Column({ title, items }: { title: string; items: Item[] }) {
  return (
    <div>
      <h3 className="text-[11px] text-gray-400 mb-2 tracking-wide">
        {title}
      </h3>

      <div className="flex flex-col gap-2.5">
        {items.map((item, i) => (
          <div key={i} className="group cursor-pointer">
            <p className="font-medium text-[13px] group-hover:underline">
              {item.t}
            </p>
            <p className="text-[11px] text-gray-400">{item.d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
