"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { EngineEval } from "@/lib/chess/move-quality";

/**
 * Cross-origin Stockfish Web Worker.
 *
 * Browsers block `new Worker(crossOriginUrl)` directly, so we fetch the engine
 * source from a CDN, wrap it in a Blob, and instantiate the Worker from a
 * blob: URL. We use the legacy pure-asm.js build (`stockfish.js@10`) on
 * purpose — newer WASM builds resolve their `.wasm` companion via relative
 * paths, which breaks once the script lives on a blob: URL.
 */
const ENGINE_CDN_URL =
  "https://cdn.jsdelivr.net/npm/stockfish.js@10.0.2/stockfish.js";

type AnalyzeOpts = {
  /** Search depth in plies. Higher = stronger but slower. */
  depth?: number;
  /** UCI Skill Level (0–20). Lower = weaker, more random play. */
  skillLevel?: number;
  /** Hard time cap per search (ms). Combined with depth — engine stops on
   *  whichever fires first. Useful for bot moves where wall-clock matters. */
  movetimeMs?: number;
};

type AnalyzeRequest = {
  fen: string;
  opts: AnalyzeOpts;
  resolve: (e: EngineEval) => void;
};

export type EngineStatus = "loading" | "ready" | "error";

export function useStockfish(): {
  status: EngineStatus;
  analyze: (fen: string, opts?: AnalyzeOpts) => Promise<EngineEval | null>;
} {
  const workerRef = useRef<Worker | null>(null);
  const queueRef = useRef<AnalyzeRequest[]>([]);
  const busyRef = useRef(false);
  const pendingRef = useRef<{
    cp: number | null;
    mate: number | null;
    bestMove: string | null;
  }>({ cp: null, mate: null, bestMove: null });
  const [status, setStatus] = useState<EngineStatus>("loading");

  useEffect(() => {
    let cancelled = false;
    let worker: Worker | null = null;
    let blobUrl: string | null = null;

    (async () => {
      try {
        console.info("[chess] fetching stockfish from", ENGINE_CDN_URL);
        const res = await fetch(ENGINE_CDN_URL, { cache: "force-cache" });
        if (!res.ok) throw new Error(`Stockfish CDN ${res.status}`);
        const text = await res.text();
        if (cancelled) return;

        const blob = new Blob([text], { type: "application/javascript" });
        blobUrl = URL.createObjectURL(blob);
        worker = new Worker(blobUrl);
        workerRef.current = worker;

        worker.onerror = (e) =>
          console.warn("[chess] stockfish worker error", e);
        worker.onmessage = (event: MessageEvent<string>) =>
          handleMessage(event.data);
        worker.postMessage("uci");
        worker.postMessage("isready");
      } catch (err) {
        console.warn("[chess] stockfish failed to load", err);
        if (!cancelled) setStatus("error");
      }
    })();

    function handleMessage(line: string) {
      if (typeof line !== "string") return;
      if (line === "readyok") {
        setStatus("ready");
        flush();
        return;
      }
      if (line.startsWith("info ")) {
        const cp = line.match(/score cp (-?\d+)/);
        const mate = line.match(/score mate (-?\d+)/);
        if (cp) pendingRef.current.cp = parseInt(cp[1], 10);
        if (mate) pendingRef.current.mate = parseInt(mate[1], 10);
        return;
      }
      if (line.startsWith("bestmove")) {
        // Format: "bestmove e2e4 ponder e7e5" or "bestmove (none)" on mate.
        const m = line.match(/^bestmove\s+(\S+)/);
        const best = m ? m[1] : null;
        pendingRef.current.bestMove =
          best && best !== "(none)" ? best : null;

        const item = queueRef.current.shift();
        if (item) item.resolve({ ...pendingRef.current });
        pendingRef.current = { cp: null, mate: null, bestMove: null };
        busyRef.current = false;
        flush();
      }
    }

    function flush() {
      if (busyRef.current) return;
      const w = workerRef.current;
      const next = queueRef.current[0];
      if (!w || !next) return;
      busyRef.current = true;
      pendingRef.current = { cp: null, mate: null, bestMove: null };
      const depth = next.opts.depth ?? 12;
      if (next.opts.skillLevel !== undefined) {
        const clamped = Math.max(0, Math.min(20, Math.round(next.opts.skillLevel)));
        w.postMessage(`setoption name Skill Level value ${clamped}`);
      }
      w.postMessage("ucinewgame");
      w.postMessage(`position fen ${next.fen}`);
      const goCmd =
        next.opts.movetimeMs !== undefined
          ? `go depth ${depth} movetime ${next.opts.movetimeMs}`
          : `go depth ${depth}`;
      w.postMessage(goCmd);
    }

    flushRef.current = flush;

    return () => {
      cancelled = true;
      try {
        worker?.terminate();
      } catch {
        /* ignore */
      }
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      workerRef.current = null;
    };
  }, []);

  const flushRef = useRef<() => void>(() => {});

  const analyze = useCallback(
    (fen: string, opts: AnalyzeOpts = {}): Promise<EngineEval | null> => {
      if (!workerRef.current) return Promise.resolve(null);
      return new Promise((resolve) => {
        queueRef.current.push({ fen, opts, resolve });
        flushRef.current();
      });
    },
    [],
  );

  return { status, analyze };
}
