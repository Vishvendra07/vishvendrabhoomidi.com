"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Icon } from "./icons";
import { MotionToggle } from "./motion-control";
import type {ReactNode} from "react";

export type SearchEntry = { href: string; title: string; description: string; type: string };
export function ThemeToggle() {
  const [theme, setTheme] = useState("system");
  useEffect(() => { const frame = requestAnimationFrame(() => setTheme(localStorage.getItem("theme") || "system")); return () => cancelAnimationFrame(frame); }, []);
  function toggle() {
    const currentlyDark = document.documentElement.dataset.theme === "dark";
    const next = currentlyDark ? "light" : "dark";
    localStorage.setItem("theme", next); document.documentElement.dataset.theme = next; setTheme(next);
  }
  return <button className="icon-button theme-button" onClick={toggle} aria-label="Toggle color theme" title={`Theme: ${theme}`}><Icon name="sun" className="sun-icon" /><Icon name="moon" className="moon-icon" /></button>;
}
export function Header({ entries }: { entries: SearchEntry[] }) {
  const pathname = usePathname();
  const [searchOpen,setSearchOpen] = useState(false), [menuOpen,setMenuOpen] = useState(false), [query,setQuery] = useState("");
  const list = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setSearchOpen(v => !v); } };
    document.addEventListener("keydown", handler); return () => document.removeEventListener("keydown", handler);
  }, []);
  const filtered = entries.filter(e => `${e.title} ${e.description} ${e.type}`.toLowerCase().includes(query.toLowerCase()));
  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="site-header"><div className="header-inner">
      <Link href="/" className="wordmark" aria-label="VB. — Vishvendra, home">VB<span>.</span></Link>
      <nav className="primary-nav" aria-label="Primary">{["Work", "Writing", "About"].map(name => <Link key={name} href={`/${name.toLowerCase()}`} aria-current={pathname.startsWith(`/${name.toLowerCase()}`) ? "page" : undefined}>{name}</Link>)}</nav>
      <div className="header-tools">
        <Dialog.Root open={searchOpen} onOpenChange={setSearchOpen}>
          <Dialog.Trigger asChild><button className="search-trigger" aria-label="Search website"><Icon name="search" /><kbd>⌘ K</kbd></button></Dialog.Trigger>
          <Dialog.Portal><Dialog.Overlay className="dialog-overlay" /><Dialog.Content className="search-dialog" onKeyDown={e => { if (e.key === "ArrowDown" || e.key === "ArrowUp") { const links = Array.from(list.current?.querySelectorAll("a") || []); const index = links.indexOf(document.activeElement as HTMLAnchorElement); const next = e.key === "ArrowDown" ? (index + 1) % links.length : (index - 1 + links.length) % links.length; if (links.length) { e.preventDefault(); links[next].focus(); } } }}>
            <Dialog.Title className="sr-only">Search website</Dialog.Title><Dialog.Description className="sr-only">Find pages, published writing, projects, and experiments. Use arrow keys to move through results.</Dialog.Description>
            <div className="search-input-row"><Icon name="search" /><input aria-label="Search pages and writing" placeholder="Where would you like to go?" value={query} onChange={e => setQuery(e.target.value)} /><Dialog.Close className="icon-button" aria-label="Close search"><Icon name="close" /></Dialog.Close></div>
            <div ref={list} className="search-results">{filtered.length ? filtered.map(e => <Link href={e.href} key={e.href} onClick={() => setSearchOpen(false)}><div><span>{e.title}</span><small>{e.description}</small></div><span className="mono muted">{e.type}</span></Link>) : <p className="search-empty">No results for “{query}”. Try “Lab” or “Kaarya”.</p>}</div>
            <div className="search-hint mono">↑ ↓ to navigate <span>esc to close</span></div>
          </Dialog.Content></Dialog.Portal>
        </Dialog.Root>
        <span className="tool-divider" /><MotionToggle/><ThemeToggle />
        <Dialog.Root open={menuOpen} onOpenChange={setMenuOpen}>
          <Dialog.Trigger asChild><button className="icon-button menu-trigger" aria-label="Open navigation menu"><Icon name="menu" /></button></Dialog.Trigger>
          <Dialog.Portal><Dialog.Overlay className="dialog-overlay" /><Dialog.Content className="menu-dialog"><div className="menu-top"><Dialog.Title>Explore</Dialog.Title><Dialog.Close className="icon-button" aria-label="Close navigation menu"><Icon name="close" /></Dialog.Close></div><Dialog.Description className="sr-only">All pages on this website.</Dialog.Description><nav aria-label="All pages">{["Work", "Writing", "About", "Lab", "Now", "Stack", "Credits", "Contact", "Resume"].map((name, i) => <Link key={name} href={`/${name.toLowerCase()}`} onClick={() => setMenuOpen(false)}><span className="mono muted">0{i+1}</span>{name === "Resume" ? "Résumé" : name}<Icon name="arrow" /></Link>)}</nav></Dialog.Content></Dialog.Portal>
        </Dialog.Root>
      </div>
    </div></header>
  </>;
}
export function Footer({socials}:{socials?:ReactNode}) {
  return <footer className="site-footer"><div className="footer-top"><Link href="/" className="wordmark" aria-label="VB. — Vishvendra, home">VB<span>.</span></Link><p>Thoughtfully built.<br />Always a work in progress.</p><div className="footer-links"><Link href="/work">Work</Link><Link href="/writing">Writing</Link><Link href="/lab">Lab</Link><Link href="/contact">Contact</Link><Link href="/credits">Credits</Link><Link href="/resume">Résumé</Link><a href="/rss.xml">RSS <Icon name="feed" width="13" height="13" /></a></div></div>{socials}<div className="footer-bottom"><span>© {new Date().getFullYear()} Vishvendra Reddy Bhoomidi</span><span>Built with intention. <ThemeToggle /></span></div></footer>;
}
