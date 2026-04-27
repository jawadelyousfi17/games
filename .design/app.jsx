/* global React, ReactDOM, TweaksPanel, useTweaks, TweakSection, TweakRadio */
const { useState, useEffect, useRef } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "lime",
  "bg": "navy"
}/*EDITMODE-END*/;

const ACCENTS = {
  lime:   { c: "#c6f24e", h: "#b9e83a", d: "#9bc92a", glow: "rgba(198,242,78,0.55)" },
  amber:  { c: "#ffc857", h: "#ffb738", d: "#e69b1f", glow: "rgba(255,200,87,0.55)" },
  coral:  { c: "#ff6f91", h: "#ff5275", d: "#e23864", glow: "rgba(255,111,145,0.55)" },
  sky:    { c: "#5ec6ff", h: "#3db4f5", d: "#1e95d6", glow: "rgba(94,198,255,0.55)" },
};

const BG_PRESETS = {
  navy:   { bg: "#0a0d20", panel: "#13172a", card: "#171b30", line: "rgba(255,255,255,0.06)" },
  ink:    { bg: "#0c0c0b", panel: "#161614", card: "#1a1a18", line: "rgba(255,255,255,0.06)" },
  plum:   { bg: "#160c20", panel: "#221531", card: "#291a3b", line: "rgba(255,255,255,0.06)" },
};

// ---------------- ICONS ----------------
const I = {
  search: (p) => <svg viewBox="0 0 20 20" fill="none" {...p}><circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6"/><path d="m17 17-3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>,
  play: (p) => <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M7 5.5v13a1 1 0 0 0 1.55.83l9.5-6.5a1 1 0 0 0 0-1.66l-9.5-6.5A1 1 0 0 0 7 5.5z"/></svg>,
  arrow: (p) => <svg viewBox="0 0 14 14" fill="none" {...p}><path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  trophy: (p) => <svg viewBox="0 0 20 20" fill="none" {...p}><path d="M5 3h10v3a5 5 0 0 1-10 0V3zM3 4v2a3 3 0 0 0 2 2.83M17 4v2a3 3 0 0 1-2 2.83M7 17h6M10 13v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  bolt: (p) => <svg viewBox="0 0 20 20" fill="currentColor" {...p}><path d="M11 2 4 11h5l-1 7 7-9h-5l1-7z"/></svg>,
  bell: (p) => <svg viewBox="0 0 20 20" fill="none" {...p}><path d="M10 3a4 4 0 0 0-4 4v3l-1.5 3h11L14 10V7a4 4 0 0 0-4-4zM8 17a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  crown: (p) => <svg viewBox="0 0 20 20" fill="currentColor" {...p}><path d="M2 6l3 3 5-6 5 6 3-3v9H2V6zM2 17h16v1H2z"/></svg>,
  controller: (p) => <svg viewBox="0 0 24 24" fill="none" {...p}><rect x="2" y="7" width="20" height="11" rx="5" stroke="currentColor" strokeWidth="1.6"/><path d="M7 11v3M5.5 12.5h3M15 12h.01M18 14h.01M16.5 13h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>,
};

// ---------------- TOP NAV ----------------
function Nav({ online }) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-[var(--bg)]/80 backdrop-blur-xl">
      <div className="max-w-[1320px] mx-auto px-6 h-16 flex items-center gap-6">
        <a href="#" className="flex items-center gap-2.5 group">
          <div className="relative w-9 h-9 rounded-xl flex items-center justify-center font-bold text-[13px]"
            style={{background: "var(--accent)", color: "#0a0d20", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -2px 0 rgba(0,0,0,0.18)"}}>
            42
          </div>
          <span className="font-bold text-[17px] tracking-tight">1337<span className="text-navy-300 font-medium">.games</span></span>
        </a>
        <div className="hidden md:flex items-center gap-1 ml-6">
          {["Games", "Tournaments", "Leaderboard", "Friends"].map((t, i) => (
            <a key={t} href="#" className={`px-3 h-9 rounded-lg text-[13px] inline-flex items-center transition-colors ${i===0 ? 'bg-white/5 text-white' : 'text-navy-200 hover:text-white hover:bg-white/[0.03]'}`}>{t}</a>
          ))}
        </div>
        <div className="hidden lg:flex flex-1 max-w-[300px]">
          <div className="relative w-full">
            <I.search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-300"/>
            <input placeholder="Search games, players…" className="w-full h-10 pl-9 pr-4 rounded-xl bg-white/[0.04] ring-1 ring-white/5 text-[13px] placeholder:text-navy-300 focus:outline-none focus:ring-white/10 transition"/>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden sm:flex items-center gap-2 text-[12px] text-navy-200 font-mono px-3 h-9 rounded-lg bg-white/[0.03] ring-1 ring-white/5">
            <span className="w-1.5 h-1.5 rounded-full pulse-soft" style={{background: "var(--accent)"}}></span>
            {online} online
          </span>
          <button className="w-9 h-9 rounded-lg bg-white/[0.03] ring-1 ring-white/5 flex items-center justify-center text-navy-200 hover:text-white transition">
            <I.bell className="w-[18px] h-[18px]"/>
          </button>
        </div>
      </div>
    </header>
  );
}

// ---------------- INTRA BUTTON ----------------
function IntraButton({ onClick, size = "lg", label = "Sign in with intra" }) {
  const sizes = {
    lg: "h-14 px-7 text-[15px] rounded-2xl",
    md: "h-12 px-5 text-[14px] rounded-xl",
  };
  return (
    <button
      onClick={onClick}
      className={`group relative inline-flex items-center gap-3 ${sizes[size]} font-semibold tracking-tight
        text-navy-950 transition-all duration-150
        hover:-translate-y-0.5 active:translate-y-0
        shadow-btn-lime hover:shadow-btn-lime-hover active:shadow-btn-lime-active
      `}
      style={{
        background: "linear-gradient(180deg, var(--accent-light) 0%, var(--accent) 50%, var(--accent-deep) 100%)",
      }}
    >
      <span className="relative inline-flex w-7 h-7 items-center justify-center rounded-lg bg-navy-950/85 font-mono font-bold text-[11px]" style={{color: "var(--accent)"}}>42</span>
      <span>{label}</span>
      <I.arrow className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5"/>
    </button>
  );
}

// ---------------- CHESS HERO ART ----------------
function ChessHero() {
  // Render an evocative 3D-ish chess scene with css/svg
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* gradient sky/fog */}
      <div className="absolute inset-0" style={{background: "radial-gradient(ellipse at 30% 20%, rgba(94,198,255,0.25), transparent 55%), radial-gradient(ellipse at 80% 90%, rgba(198,242,78,0.18), transparent 50%), linear-gradient(160deg, #1a2247 0%, #0d1130 60%, #0a0d20 100%)"}}/>
      {/* perspective board */}
      <div className="absolute inset-0 flex items-end justify-center pb-4" style={{perspective: "900px"}}>
        <div className="relative" style={{transform: "rotateX(54deg) rotateZ(0deg)", transformStyle: "preserve-3d"}}>
          <div className="grid grid-cols-8 grid-rows-8 w-[420px] h-[420px] rounded-md shadow-2xl ring-1 ring-white/5">
            {Array.from({length: 64}).map((_, i) => {
              const r = Math.floor(i/8), f = i%8;
              const dark = (r+f)%2===1;
              return <div key={i} className={dark ? 'bg-navy-700' : 'bg-navy-500/70'}/>;
            })}
          </div>
          {/* pieces as floating chips above board */}
          {[
            { x: 60,  y: -42, sym: "♟", color: "#ff6f91" },
            { x: 110, y: -64, sym: "♞", color: "#c6f24e" },
            { x: 170, y: -52, sym: "♛", color: "#5ec6ff" },
            { x: 240, y: -46, sym: "♚", color: "#fff" },
            { x: 300, y: -58, sym: "♝", color: "#ffc857" },
            { x: 350, y: -42, sym: "♟", color: "#fff" },
          ].map((p, i) => (
            <div key={i} className={`absolute text-[44px] leading-none ${i%2===0 ? 'float-y' : ''}`}
              style={{left: p.x, top: p.y, color: p.color, transform: "translateZ(40px) rotateX(-54deg)", textShadow: `0 6px 16px ${p.color}55, 0 2px 0 rgba(0,0,0,0.4)`, animationDelay: `${i*0.4}s`}}>
              {p.sym}
            </div>
          ))}
        </div>
      </div>
      {/* tag */}
      <div className="absolute top-4 left-4 inline-flex items-center gap-2 px-3 h-8 rounded-full bg-black/40 backdrop-blur-md ring-1 ring-white/10 text-[11px] font-mono text-white">
        <span className="w-1.5 h-1.5 rounded-full pulse-soft" style={{background: "var(--accent)"}}></span>
        LIVE · 23 in queue
      </div>
      {/* avatar */}
      <div className="absolute top-4 right-4 flex -space-x-2">
        {["#ff6f91","#5ec6ff","#c6f24e"].map((c, i) => (
          <div key={i} className="w-8 h-8 rounded-full ring-2 ring-navy-900 flex items-center justify-center text-[10px] font-bold text-navy-950"
            style={{background: c}}>{["E","M","R"][i]}</div>
        ))}
        <div className="w-8 h-8 rounded-full ring-2 ring-navy-900 bg-white/10 backdrop-blur flex items-center justify-center text-[10px] font-mono text-white">+20</div>
      </div>
    </div>
  );
}

// ---------------- HERO ----------------
function Hero({ onLogin, online }) {
  return (
    <section className="relative">
      <div className="max-w-[1320px] mx-auto px-6 pt-10 pb-14">
        {/* eyebrow row */}
        <div className="flex items-center gap-3 text-[12px] font-mono text-navy-200 mb-6">
          <span className="inline-flex items-center gap-1.5 px-2.5 h-7 rounded-full ring-1 ring-white/10 bg-white/[0.03]">
            <span className="w-1.5 h-1.5 rounded-full pulse-soft" style={{background: "var(--accent)"}}></span>
            Season 03 · open
          </span>
          <span className="text-navy-400">/</span>
          <span>For 1337 students only</span>
        </div>

        <div className="grid lg:grid-cols-[1.45fr_1fr] gap-6">
          {/* LEFT — hero feature card */}
          <div className="relative rounded-3xl bg-navy-850 ring-1 ring-white/5 overflow-hidden shadow-card">
            {/* search + filters bar (cosmetic) */}
            <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-white/5">
              <div className="text-[13px] text-white font-semibold">Today's matches <span className="text-navy-300 font-normal">(3)</span></div>
              <div className="text-[13px] text-navy-300">Tournaments <span className="text-navy-400">(4)</span></div>
              <div className="ml-auto flex items-center gap-2">
                {["All games","Ranked"].map((g, i) => (
                  <span key={g} className={`text-[12px] px-3 h-7 rounded-full inline-flex items-center ring-1 ${i===0 ? 'ring-[var(--accent-deep)] text-[var(--accent)]' : 'ring-white/10 text-navy-200'}`}>{g}</span>
                ))}
              </div>
            </div>

            {/* feature media + side list */}
            <div className="grid md:grid-cols-[1.7fr_1fr] gap-0">
              <div className="relative aspect-[16/10] md:aspect-auto md:h-[360px] m-4 rounded-2xl overflow-hidden ring-1 ring-white/5">
                <ChessHero />
                {/* play & timeline */}
                <div className="absolute inset-x-0 bottom-0 px-5 pb-4 flex items-center gap-4">
                  <button className="w-14 h-14 rounded-full flex items-center justify-center transition hover:scale-105"
                    style={{background: "var(--accent)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.55), inset 0 -3px 0 rgba(0,0,0,0.18), 0 10px 30px -8px var(--accent-glow)"}}>
                    <I.play className="w-5 h-5 text-navy-950 translate-x-0.5"/>
                  </button>
                  <div className="flex-1 flex items-center gap-3 text-[12px] text-white/90">
                    <span className="font-mono">02:05:87</span>
                    <div className="flex-1 h-1 rounded-full bg-white/15 overflow-hidden">
                      <div className="h-full rounded-full" style={{width: "62%", background: "var(--accent)"}}></div>
                    </div>
                    <span className="font-mono text-white/60">03:24:00</span>
                  </div>
                </div>
              </div>

              <div className="px-2 md:pr-4 md:pl-0 pb-4 md:py-4 space-y-2">
                <MatchRow color="#5ec6ff" name="Chess · Blitz" sub="cadet-3f vs lvl-22 · 18:00" tag="ranked"/>
                <MatchRow color="#ff6f91" name="Uno · Standard" sub="4-player room · 20:30" tag="casual" tagColor="coral"/>
                <MatchRow color="#c6f24e" name="Chess · Bullet" sub="Tournament Rd. 2 · 22:00" tag="tourney" tagColor="lime"/>
                <MatchRow color="#ffc857" name="Uno · Speed" sub="Quick room · 00:15" tag="casual" tagColor="coral"/>
              </div>
            </div>

            {/* big copy block */}
            <div className="px-6 py-7 border-t border-white/5">
              <div className="flex items-end justify-between gap-6 flex-wrap">
                <h1 className="font-extrabold tracking-[-0.03em] leading-[0.95] text-[clamp(40px,5.4vw,68px)] text-white">
                  Play between<br/>
                  <span className="italic font-medium text-navy-100">two</span> <span style={{color: "var(--accent)"}}>pushes.</span>
                </h1>
                <p className="text-[15px] text-navy-200 max-w-[340px]">
                  A small, well-made games club for the 42 / 1337 network. Sign in with your intra and queue up.
                </p>
              </div>
              <div className="mt-7 flex flex-wrap items-center gap-4">
                <IntraButton onClick={onLogin} />
                <span className="text-[12px] text-navy-300 font-mono">OAuth via api.intra.42.fr</span>
              </div>
            </div>
          </div>

          {/* RIGHT — stat panels */}
          <div className="space-y-4">
            <ActivityCard online={online} />
            <NotificationCard onLogin={onLogin}/>
          </div>
        </div>
      </div>
    </section>
  );
}

function MatchRow({ color, name, sub, tag, tagColor = "sky" }) {
  const tagBg = { sky: "bg-sky/15 text-sky", coral: "bg-coral/15 text-coral", lime: "bg-lime/15 text-lime" }[tagColor];
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.03] transition cursor-pointer">
      <div className="w-12 h-12 rounded-lg flex items-center justify-center text-navy-950 font-bold flex-shrink-0"
        style={{background: color, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -2px 0 rgba(0,0,0,0.15)"}}>
        <I.controller className="w-5 h-5"/>
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] text-white font-semibold truncate">{name}</div>
        <div className="text-[11px] text-navy-300 truncate font-mono">{sub}</div>
      </div>
      <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded-full ${tagBg}`}>{tag}</span>
    </div>
  );
}

// ---------------- ACTIVITY (donut) ----------------
function ActivityCard({ online }) {
  // Faux donut — players by game
  const segs = [
    { c: "var(--accent)", v: 44, label: "Chess" },
    { c: "#ff6f91", v: 31, label: "Uno" },
    { c: "#5ec6ff", v: 18, label: "Spectating" },
    { c: "#ffc857", v: 7,  label: "Idle" },
  ];
  const total = segs.reduce((a,b) => a+b.v, 0);
  const r = 64;
  const C = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div className="rounded-3xl bg-navy-850 ring-1 ring-white/5 p-5 shadow-card">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[15px] font-semibold text-white">Live activity</div>
          <div className="text-[12px] text-navy-300 font-mono">Right now</div>
        </div>
        <button className="w-8 h-8 rounded-lg bg-white/[0.04] ring-1 ring-white/5 flex items-center justify-center text-navy-200 hover:text-white">
          <I.arrow className="w-3.5 h-3.5 -rotate-45"/>
        </button>
      </div>
      <div className="mt-3 flex items-center gap-5">
        <div className="relative w-[160px] h-[160px] flex-shrink-0">
          <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90 spin-slow" style={{animationDuration: "60s"}}>
            {segs.map((s, i) => {
              const len = (s.v / total) * C;
              const dash = `${len} ${C - len}`;
              const off = -acc;
              acc += len;
              return (
                <circle key={i} cx="80" cy="80" r={r}
                  fill="none" stroke={s.c} strokeWidth="14"
                  strokeDasharray={dash} strokeDashoffset={off}
                  strokeLinecap="butt"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-[11px] text-navy-300 font-mono">Online</div>
            <div className="text-[36px] font-extrabold text-white leading-none">{online}</div>
            <div className="text-[10px] text-navy-300 font-mono mt-1">+12 today</div>
          </div>
        </div>
        <div className="flex-1 space-y-2.5 text-[12px]">
          {segs.map((s) => (
            <div key={s.label} className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full" style={{background: s.c}}></span>
              <span className="text-navy-200 flex-1">{s.label}</span>
              <span className="font-mono text-white">{Math.round((s.v/total)*100)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------- NOTIFICATION CARD ----------------
function NotificationCard({ onLogin }) {
  return (
    <div className="relative rounded-3xl p-5 overflow-hidden shadow-card-pop"
      style={{background: "linear-gradient(160deg, var(--accent-light) 0%, var(--accent) 60%, var(--accent-deep) 100%)", color: "#0a0d20"}}>
      <div className="absolute -top-2 -right-2 w-32 h-32 opacity-25 rounded-full blur-2xl bg-white"/>
      <div className="relative">
        <div className="flex items-start justify-between">
          <div className="text-[12px] font-bold uppercase tracking-wider opacity-70">Notification · 03</div>
          <div className="w-8 h-8 rounded-full bg-navy-950/15 flex items-center justify-center">
            <I.bell className="w-4 h-4"/>
          </div>
        </div>
        <div className="mt-7 flex items-end gap-4">
          <div className="relative">
            {/* mascot placeholder — chess king with crown */}
            <div className="w-[90px] h-[90px] rounded-2xl bg-navy-950/15 flex items-center justify-center text-[60px] drift">
              <span style={{filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.2))"}}>♚</span>
            </div>
            <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-coral flex items-center justify-center text-white text-[12px] font-bold ring-2 ring-[var(--accent)]">!</div>
          </div>
          <div className="flex-1 text-[13px] leading-snug">
            <div className="font-bold text-[15px]">New season unlocked</div>
            <div className="opacity-75 mt-1">Sign in with intra to claim your starting Elo and join Season 03.</div>
          </div>
        </div>
        <button onClick={onLogin}
          className="mt-5 w-full h-11 rounded-xl bg-navy-950 text-[var(--accent)] font-semibold text-[14px] inline-flex items-center justify-center gap-2 transition hover:bg-navy-900"
          style={{boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -2px 0 rgba(0,0,0,0.4)"}}>
          Claim & continue
          <I.arrow className="w-3.5 h-3.5"/>
        </button>
      </div>
    </div>
  );
}

// ---------------- TOURNAMENT POSTERS ----------------
function Tournaments({ onLogin }) {
  const items = [
    {
      name: "Chess",
      sub: "Classical · Blitz · Bullet",
      players: "23 in queue",
      progress: 62,
      bg: "linear-gradient(160deg, #1d2a5e 0%, #0a0d20 100%)",
      accent: "#5ec6ff",
      art: <ChessPoster />,
      tag: "FEATURED",
      live: true,
    },
    {
      name: "Uno",
      sub: "2–4 players · Standard rules",
      players: "11 playing",
      progress: 40,
      bg: "linear-gradient(160deg, #4a1530 0%, #2a0e22 100%)",
      accent: "#ff6f91",
      art: <UnoPoster />,
      tag: "FEATURED",
      live: true,
    },
    {
      name: "Poker",
      sub: "Texas Hold'em · 6-max",
      players: "Coming Q2",
      progress: 0,
      bg: "linear-gradient(160deg, #2a1a4d 0%, #150c2a 100%)",
      accent: "#b794ff",
      art: <PokerPoster />,
      tag: "Q2 · 2026",
      live: false,
    },
  ];
  return (
    <section id="play" className="relative">
      <div className="max-w-[1320px] mx-auto px-6 pb-16">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="text-[12px] font-mono text-navy-300 mb-1.5">/ tournaments</div>
            <h2 className="text-[34px] font-extrabold tracking-tight text-white">Pick a battlefield.</h2>
          </div>
          <a href="#" className="text-[13px] text-navy-200 hover:text-white inline-flex items-center gap-1.5">
            See all <I.arrow className="w-3 h-3"/>
          </a>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {items.map((it) => (
            <GamePoster key={it.name} {...it} onClick={onLogin}/>
          ))}
        </div>

        {/* secondary lineup */}
        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { n: "Connect 4", t: "Q3 · 2026", c: "#5ec6ff", g: "●●●○" },
            { n: "Battleship", t: "Q4 · 2026", c: "#c6f24e", g: "▣▣▣" },
            { n: "Tic-Tac-Toe", t: "Soon", c: "#ffc857", g: "X O X" },
            { n: "Checkers", t: "Soon", c: "#ff6f91", g: "● ○ ●" },
          ].map((g) => (
            <div key={g.n} className="rounded-2xl bg-navy-850 ring-1 ring-white/5 p-4 flex items-center gap-3 hover:bg-navy-800 transition">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-[18px] font-bold text-navy-950 flex-shrink-0"
                style={{background: g.c, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -2px 0 rgba(0,0,0,0.18)"}}>
                {g.g[0]}
              </div>
              <div className="min-w-0">
                <div className="text-[13px] text-white font-semibold truncate">{g.n}</div>
                <div className="text-[11px] text-navy-300 font-mono truncate">{g.t}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function GamePoster({ name, sub, players, progress, bg, accent, art, tag, live, onClick }) {
  return (
    <div onClick={onClick}
      className="group relative rounded-3xl overflow-hidden ring-1 ring-white/5 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:ring-white/10 shadow-card hover:shadow-card-pop"
      style={{background: bg}}>
      {/* top tag */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        <span className="px-2.5 h-7 inline-flex items-center rounded-full bg-black/35 backdrop-blur ring-1 ring-white/10 text-[10px] font-mono uppercase tracking-wider text-white">
          {tag}
        </span>
        {live && (
          <span className="px-2.5 h-7 inline-flex items-center gap-1.5 rounded-full ring-1 ring-white/10 text-[10px] font-mono text-white"
            style={{background: "rgba(0,0,0,0.35)", backdropFilter: "blur(8px)"}}>
            <span className="w-1.5 h-1.5 rounded-full pulse-soft" style={{background: accent}}></span>
            LIVE
          </span>
        )}
      </div>
      {/* art */}
      <div className="relative h-[230px] overflow-hidden">
        {art}
      </div>
      {/* footer */}
      <div className="relative p-5 pt-4 bg-gradient-to-b from-transparent to-black/30">
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-[24px] font-extrabold tracking-tight text-white">{name}</h3>
            <div className="text-[12px] text-white/60 mt-0.5">{sub}</div>
          </div>
          <div className="text-[11px] font-mono text-white/70">{players}</div>
        </div>
        {/* progress (queue / fill) */}
        <div className="mt-4 h-1 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700"
            style={{width: `${progress}%`, background: accent}}></div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="text-[10px] font-mono uppercase tracking-wider text-white/50">{progress}% queue</div>
          <button className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-navy-950 px-3.5 h-9 rounded-xl transition hover:scale-[1.02]"
            style={{background: accent, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -2px 0 rgba(0,0,0,0.18)"}}>
            {progress > 0 ? "Join" : "Notify"} <I.arrow className="w-3 h-3"/>
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------- POSTERS ----------------
function ChessPoster() {
  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0 chess-grid opacity-30"/>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          <div className="text-[140px] leading-none drift" style={{color: "#5ec6ff", textShadow: "0 8px 30px rgba(94,198,255,0.55), 0 4px 0 rgba(0,0,0,0.4)"}}>♞</div>
          <div className="absolute -left-12 top-6 text-[60px] float-y" style={{color: "#fff", textShadow: "0 4px 18px rgba(255,255,255,0.3)", animationDelay: "0.6s"}}>♟</div>
          <div className="absolute -right-10 -top-2 text-[80px] float-y" style={{color: "#c6f24e", textShadow: "0 4px 18px rgba(198,242,78,0.55)", animationDelay: "1.2s"}}>♛</div>
        </div>
      </div>
      <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-black/40 to-transparent"/>
    </div>
  );
}

function UnoPoster() {
  const cards = [
    { v: "7", c: "#ef4444", x: -54, r: -22 },
    { v: "+2", c: "#ffc857", x: -22, r: -8, ink: true },
    { v: "↺", c: "#0a0d20", x: 12, r: 5 },
    { v: "4", c: "#22c55e", x: 46, r: 18, ink: true },
  ];
  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0" style={{background: "radial-gradient(ellipse at 50% 70%, rgba(255,111,145,0.35), transparent 60%)"}}/>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-0 h-0">
          {cards.map((c, i) => (
            <div key={i} className="absolute w-[80px] h-[120px] rounded-xl flex items-center justify-center font-extrabold text-[34px] ring-1 ring-black/40 drift"
              style={{
                background: c.c,
                color: c.ink ? "#0a0d20" : "#fff",
                left: c.x*1.6, top: -60,
                transform: `translate(-50%, 0) rotate(${c.r}deg)`,
                boxShadow: "0 12px 24px -6px rgba(0,0,0,0.5), inset 0 2px 0 rgba(255,255,255,0.18)",
                animationDelay: `${i*0.3}s`,
              }}>
              <span className="absolute inset-2 ring-2 ring-white/25 rounded-md"/>
              <span className="relative">{c.v}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-black/40 to-transparent"/>
    </div>
  );
}

function PokerPoster() {
  const suits = [
    { s: "♠", c: "#fff",     x: -50, r: -12 },
    { s: "♥", c: "#ff6f91", x: -16, r: -4 },
    { s: "♦", c: "#ffc857", x: 18,  r: 4 },
    { s: "♣", c: "#5ec6ff", x: 52,  r: 12 },
  ];
  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0" style={{background: "radial-gradient(ellipse at 50% 60%, rgba(183,148,255,0.4), transparent 60%)"}}/>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-0 h-0">
          {suits.map((s, i) => (
            <div key={i} className="absolute w-[68px] h-[100px] rounded-lg bg-white flex items-center justify-center text-[34px] drift"
              style={{
                color: s.c === "#fff" ? "#0a0d20" : s.c,
                left: s.x*1.6, top: -50,
                transform: `translate(-50%, 0) rotate(${s.r}deg)`,
                boxShadow: "0 10px 22px -6px rgba(0,0,0,0.6), inset 0 1px 0 rgba(0,0,0,0.05)",
                animationDelay: `${i*0.25}s`,
              }}>
              {s.s}
            </div>
          ))}
        </div>
      </div>
      <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-black/40 to-transparent"/>
    </div>
  );
}

// ---------------- HOW IT WORKS ----------------
function How() {
  const steps = [
    { n: "01", t: "Sign in with intra", d: "One click. Your 1337 identity is your only account.", icon: I.bolt, color: "var(--accent)" },
    { n: "02", t: "Pick a game", d: "Chess and Uno today. Poker, Connect 4, Battleship coming.", icon: I.controller, color: "#5ec6ff" },
    { n: "03", t: "Climb the ladder", d: "Elo-ranked queueing. Earn medals every season.", icon: I.trophy, color: "#ff6f91" },
  ];
  return (
    <section id="how" className="border-t border-white/5">
      <div className="max-w-[1320px] mx-auto px-6 py-16">
        <div className="text-[12px] font-mono text-navy-300 mb-1.5">/ how it works</div>
        <h2 className="text-[34px] font-extrabold tracking-tight text-white mb-8">Three steps. No setup.</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {steps.map((s) => (
            <div key={s.n} className="relative rounded-3xl bg-navy-850 ring-1 ring-white/5 p-6 hover:bg-navy-800/80 transition">
              <div className="flex items-start justify-between mb-8">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-navy-950"
                  style={{background: s.color, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -2px 0 rgba(0,0,0,0.18)"}}>
                  <s.icon className="w-5 h-5"/>
                </div>
                <span className="text-[11px] font-mono text-navy-400">{s.n}</span>
              </div>
              <div className="text-[20px] font-bold text-white mb-1.5">{s.t}</div>
              <div className="text-[14px] text-navy-200 leading-snug">{s.d}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------- CTA ----------------
function CTA({ onLogin }) {
  return (
    <section className="relative">
      <div className="max-w-[1320px] mx-auto px-6 py-16">
        <div className="relative rounded-3xl overflow-hidden ring-1 ring-white/5 px-10 py-14 md:px-16 md:py-20"
          style={{background: "linear-gradient(135deg, #1a2247 0%, #0a0d20 70%)"}}>
          <div className="absolute -top-20 -right-20 w-[420px] h-[420px] rounded-full blur-3xl opacity-30" style={{background: "var(--accent)"}}/>
          <div className="absolute -bottom-32 -left-20 w-[420px] h-[420px] rounded-full blur-3xl opacity-25" style={{background: "#ff6f91"}}/>
          <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-8">
            <div className="max-w-[640px]">
              <div className="text-[12px] font-mono text-navy-300 mb-3">/ ready when you are</div>
              <h2 className="text-[clamp(40px,5vw,68px)] font-extrabold tracking-[-0.03em] leading-[1] text-white">
                Bring your <span className="italic font-medium" style={{color: "var(--accent)"}}>intra</span>.<br/>
                Leave with a few wins.
              </h2>
            </div>
            <IntraButton onClick={onLogin}/>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------- FOOTER ----------------
function Footer() {
  return (
    <footer className="border-t border-white/5">
      <div className="max-w-[1320px] mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-[12px] font-mono text-navy-300">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md flex items-center justify-center font-bold text-[10px]"
            style={{background: "var(--accent)", color: "#0a0d20"}}>42</div>
          <span>Built by 1337 students.</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#" className="hover:text-white transition">GitHub</a>
          <a href="#" className="hover:text-white transition">Discord</a>
          <a href="#" className="hover:text-white transition">Report a bug</a>
        </div>
      </div>
    </footer>
  );
}

// ---------------- AUTH MODAL ----------------
function AuthModal({ onClose }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const ts = [600, 1200, 1800, 2500];
    const ids = ts.map((t, i) => setTimeout(() => setStep(i + 1), t));
    return () => ids.forEach(clearTimeout);
  }, []);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/85 backdrop-blur-md p-6" onClick={onClose}>
      <div className="w-full max-w-[440px] rounded-3xl bg-navy-850 ring-1 ring-white/10 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 pt-7 pb-6 text-center">
          <div className="inline-flex w-14 h-14 items-center justify-center rounded-2xl mb-5 font-bold text-[16px]"
            style={{background: "var(--accent)", color: "#0a0d20", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.55), inset 0 -2px 0 rgba(0,0,0,0.18)"}}>
            42
          </div>
          <h3 className="text-[24px] font-bold text-white">Continue with intra</h3>
          <p className="text-[13px] text-navy-300 mt-2">You'll be redirected to api.intra.42.fr</p>
        </div>
        <div className="px-6 pb-6">
          <div className="space-y-2">
            {["Opening OAuth window","Verifying your 1337 identity","Syncing your profile","Ready"].map((label, i) => (
              <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${step > i ? 'bg-white/[0.06] text-white' : 'bg-white/[0.02] text-navy-300'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center ring-1 ${step > i ? 'ring-transparent' : 'ring-white/10'}`}
                  style={step > i ? {background: "var(--accent)"} : {}}>
                  {step > i && (
                    <svg width="11" height="11" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2 2 4-4" stroke="#0a0d20" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </span>
                <span className="text-[14px]">{label}</span>
                {step === i && <span className="ml-auto text-[11px] font-mono text-navy-400">…</span>}
              </div>
            ))}
          </div>
          <button
            onClick={onClose}
            className="mt-6 w-full h-12 rounded-xl text-[14px] font-semibold transition"
            style={step >= 4
              ? {background: "var(--accent)", color: "#0a0d20", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -2px 0 rgba(0,0,0,0.18)"}
              : {background: "rgba(255,255,255,0.04)", color: "#fff"}
            }
          >
            {step >= 4 ? "Enter lobby →" : "Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------- APP ----------------
function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [authOpen, setAuthOpen] = useState(false);
  const [online, setOnline] = useState(56);

  useEffect(() => {
    const id = setInterval(() => {
      setOnline((n) => Math.max(34, Math.min(98, n + (Math.floor(Math.random() * 5) - 2))));
    }, 3000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const a = ACCENTS[tweaks.accent] || ACCENTS.lime;
    const r = document.documentElement.style;
    r.setProperty("--accent", a.c);
    r.setProperty("--accent-light", lighten(a.c, 0.15));
    r.setProperty("--accent-deep", a.d);
    r.setProperty("--accent-glow", a.glow);

    const b = BG_PRESETS[tweaks.bg] || BG_PRESETS.navy;
    r.setProperty("--bg", b.bg);
    document.body.style.background = b.bg;
  }, [tweaks.accent, tweaks.bg]);

  return (
    <div className="min-h-screen relative" style={{background: "var(--bg)"}}>
      <div className="absolute inset-0 grain opacity-[0.35] pointer-events-none"/>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full pointer-events-none opacity-15 blur-3xl"
        style={{background: "radial-gradient(circle, var(--accent) 0%, transparent 60%)"}}/>
      <div className="relative">
        <Nav online={online} />
        <Hero onLogin={() => setAuthOpen(true)} online={online} />
        <Tournaments onLogin={() => setAuthOpen(true)} />
        <How />
        <CTA onLogin={() => setAuthOpen(true)} />
        <Footer />
      </div>

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}

      <TweaksPanel title="Tweaks">
        <TweakSection title="Accent">
          <TweakRadio
            label="Color"
            value={tweaks.accent}
            onChange={(v) => setTweak("accent", v)}
            options={[
              { value: "lime", label: "Lime" },
              { value: "amber", label: "Amber" },
              { value: "coral", label: "Coral" },
              { value: "sky", label: "Sky" },
            ]}
          />
        </TweakSection>
        <TweakSection title="Background">
          <TweakRadio
            label="Tone"
            value={tweaks.bg}
            onChange={(v) => setTweak("bg", v)}
            options={[
              { value: "navy", label: "Navy" },
              { value: "ink", label: "Ink" },
              { value: "plum", label: "Plum" },
            ]}
          />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

function lighten(hex, amt) {
  const h = hex.replace('#','');
  const n = parseInt(h, 16);
  let r = (n >> 16) + Math.round(255 * amt);
  let g = ((n >> 8) & 0xff) + Math.round(255 * amt);
  let b = (n & 0xff) + Math.round(255 * amt);
  r = Math.min(255, r); g = Math.min(255, g); b = Math.min(255, b);
  return `#${((r<<16)|(g<<8)|b).toString(16).padStart(6,'0')}`;
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
