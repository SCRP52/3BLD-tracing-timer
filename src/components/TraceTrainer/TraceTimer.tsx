// src/components/TraceTrainer/TraceTimer.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface TraceTimerProps {
  newScramble?: () => void;
  scrambleMode?: "normal" | "edge-only" | "corner-only";
  useTimer?: boolean;
}

export default function TraceTimer({
  newScramble = () => {},
  scrambleMode = "normal",
  useTimer = true,
}: TraceTimerProps) {
  const [hideTimerDuringSolve, setHideTimerDuringSolve] = useState(true);
  const [status, setStatus] = useState<"ready" | "running" | "finished">("ready");
  const [time, setTime] = useState(0);

  const [edgeText, setEdgeText] = useState("");
  const [cornerText, setCornerText] = useState("");
  const [parity, setParity] = useState(false);

  const edgeInputRef = useRef<HTMLInputElement>(null);
  const cornerInputRef = useRef<HTMLInputElement>(null);
  const parityRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(0);
  const pausedAt = useRef<number | null>(null);
  const isComposing = useRef(false);

  const [isPaused, setIsPaused] = useState(false);
  const [isDNF, setIsDNF] = useState(false);

  useEffect(() => {
    const savedHideTimer = localStorage.getItem("hideTimerDuringSolve");
    if (savedHideTimer !== null) {
      setHideTimerDuringSolve(savedHideTimer !== "false");
    }

    const handleHideToggle = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && typeof customEvent.detail.hideTimerDuringSolve === "boolean") {
        setHideTimerDuringSolve(customEvent.detail.hideTimerDuringSolve);
      }
    };

    window.addEventListener("trace-hide-timer-toggle", handleHideToggle);
    return () => window.removeEventListener("trace-hide-timer-toggle", handleHideToggle);
  }, []);

  const sanitizeText = (val: string) =>
    val.replace(/[^a-zA-Z\s]/g, "").toUpperCase();

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void
  ) => {
    if (isComposing.current) {
      setter(e.target.value);
    } else {
      setter(sanitizeText(e.target.value));
    }
  };

  const handleCompositionEnd = (
    e: React.CompositionEvent<HTMLInputElement>,
    setter: (val: string) => void
  ) => {
    isComposing.current = false;
    setter(sanitizeText(e.currentTarget.value));
  };

  const focusActiveInput = () => {
    if (scrambleMode === "edge-only") {
      edgeInputRef.current?.focus();
    } else {
      cornerInputRef.current?.focus();
    }
  };

  const startTrace = () => {
    if (!useTimer || status !== "ready") return;

    const now = performance.now();
    setEdgeText("");
    setCornerText("");
    setParity(false);
    setIsDNF(false);
    setTime(0);
    startTimeRef.current = now;
    setStatus("running");
    setIsPaused(false);
    pausedAt.current = null;

    window.dispatchEvent(
      new CustomEvent("trace-status-change", { detail: { status: "running" } })
    );

    requestAnimationFrame(() => {
      focusActiveInput();
    });
  };

  const submitTimer = () => {
    if (status === "running" && !isPaused) {
      setTime(performance.now() - startTimeRef.current);
      setStatus("finished");
      edgeInputRef.current?.blur();
      cornerInputRef.current?.blur();
      window.dispatchEvent(
        new CustomEvent("trace-status-change", {
          detail: { status: "finished", isDNF: false },
        })
      );
    }
  };

  const pauseTimer = () => {
    if (status === "running" && !isPaused) {
      pausedAt.current = performance.now();
      setIsPaused(true);
      window.dispatchEvent(
        new CustomEvent("trace-status-change", { detail: { status: "paused" } })
      );
    }
  };

  const resumeTimer = () => {
    if (status === "running" && isPaused && pausedAt.current !== null) {
      const pauseDuration = performance.now() - pausedAt.current;
      startTimeRef.current += pauseDuration;
      setIsPaused(false);
      pausedAt.current = null;
      window.dispatchEvent(
        new CustomEvent("trace-status-change", { detail: { status: "running" } })
      );
      requestAnimationFrame(() => {
        focusActiveInput();
      });
    }
  };

  const confirmGiveUp = () => {
    setIsDNF(true);
    setStatus("finished");
    setIsPaused(false);
    pausedAt.current = null;
    window.dispatchEvent(
      new CustomEvent("trace-status-change", {
        detail: { status: "finished", isDNF: true },
      })
    );
  };

  useEffect(() => {
    if (!useTimer || status !== "running" || isPaused) return;

    const id = setInterval(() => {
      setTime(performance.now() - startTimeRef.current);
    }, 10);

    return () => clearInterval(id);
  }, [status, isPaused, useTimer]);

  useEffect(() => {
    if (!useTimer) return;

    const preventSpace = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        if (
          document.activeElement !== edgeInputRef.current &&
          document.activeElement !== cornerInputRef.current &&
          document.activeElement !== parityRef.current
        ) {
          e.preventDefault();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      if (
        document.activeElement === edgeInputRef.current ||
        document.activeElement === cornerInputRef.current ||
        document.activeElement === parityRef.current
      ) {
        return;
      }

      e.preventDefault();
      if (status === "ready") {
        startTrace();
      }
    };

    window.addEventListener("keydown", preventSpace);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", preventSpace);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [status, scrambleMode, useTimer]);

  useEffect(() => {
    if (!useTimer) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        if (status === "running" && !isPaused) {
          e.preventDefault();
          submitTimer();
          return;
        }

        if (status === "finished") {
          e.preventDefault();
          pausedAt.current = null;
          setEdgeText("");
          setCornerText("");
          setParity(false);
          setIsDNF(false);
          setTime(0);
          startTimeRef.current = 0;
          setStatus("ready");
          edgeInputRef.current?.blur();
          cornerInputRef.current?.blur();
          window.dispatchEvent(
            new CustomEvent("trace-status-change", { detail: { status: "ready" } })
          );
          newScramble();
          return;
        }

        if (status === "ready") {
          e.preventDefault();
          pausedAt.current = null;
          setEdgeText("");
          setCornerText("");
          setParity(false);
          setIsDNF(false);
          setTime(0);
          startTimeRef.current = 0;
          newScramble();
          return;
        }
      }

      if (e.key === "Escape") {
        if (status === "running") {
          if (document.querySelector('[role="dialog"]')) {
            return;
          }
          e.preventDefault();
          if (isPaused) {
            resumeTimer();
          } else {
            pauseTimer();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [status, isPaused, newScramble, scrambleMode, useTimer]);

  useEffect(() => {
    if (!useTimer) return;

    const handleVisibility = () => {
      if (status === "running" && document.hidden) {
        pauseTimer();
      }
    };

    const handleSettingsToggle = (e: Event) => {
      const customEvent = e as CustomEvent;
      const isOpen = !!customEvent.detail?.isOpen;
      if (isOpen && status === "running") {
        pauseTimer();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("trace-settings-toggle", handleSettingsToggle);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("trace-settings-toggle", handleSettingsToggle);
    };
  }, [status, useTimer]);

  useEffect(() => {
    if (!useTimer) return;

    const handlePauseEvent = () => pauseTimer();
    const handleResumeEvent = () => resumeTimer();
    const handleGiveUpEvent = () => confirmGiveUp();

    window.addEventListener("trace-pause", handlePauseEvent);
    window.addEventListener("trace-resume", handleResumeEvent);
    window.addEventListener("trace-giveup", handleGiveUpEvent);

    return () => {
      window.removeEventListener("trace-pause", handlePauseEvent);
      window.removeEventListener("trace-resume", handleResumeEvent);
      window.removeEventListener("trace-giveup", handleGiveUpEvent);
    };
  }, [status, isPaused, useTimer]);

  if (!useTimer) {
    return null;
  }

  return (
    <div className="my-2 sm:my-4 rounded-none border-2 border-zinc-800 p-3 sm:p-4 space-y-4 bg-black text-zinc-100 max-w-full overflow-hidden mx-auto">
      {isPaused ? (
        <div className="space-y-2 py-4 border-2 border-zinc-800 p-3 sm:p-4 bg-black">
          <div className="text-center font-black mb-2 uppercase tracking-wider underline text-zinc-500 text-sm sm:text-base">
            Trace Paused
          </div>
          <button
            className="w-full rounded-none border-2 border-zinc-700 p-2.5 sm:p-2 bg-zinc-900 text-zinc-200 font-black hover:bg-zinc-800 active:bg-zinc-800"
            onClick={resumeTimer}
          >
            CONTINUE
          </button>
          <button
            className="w-full rounded-none border-2 border-zinc-700 p-2.5 sm:p-2 font-black bg-black text-zinc-500 hover:bg-zinc-900 active:bg-zinc-900"
            onClick={() =>
              window.dispatchEvent(new CustomEvent("trace-request-giveup"))
            }
          >
            GIVE UP
          </button>
        </div>
      ) : (
        <>
          <div className={`text-center border-2 border-zinc-800 p-3 sm:p-4 bg-black ${hideTimerDuringSolve && status === "running" ? "invisible" : ""}`}>
            <div
              className={`text-5xl xs:text-6xl sm:text-8xl font-black font-mono tracking-tighter ${
                isDNF ? "line-through text-zinc-700" : "text-zinc-200"
              }`}
            >
              {isDNF ? (
                "DNF"
              ) : time < 60000 ? (
                (time / 1000).toFixed(3)
              ) : (
                `${Math.floor(time / 60000)}:${((time % 60000) / 1000)
                  .toFixed(3)
                  .padStart(6, "0")}`
              )}
            </div>
          </div>

          {status === "ready" && (
            <Button
              className="w-full h-14 sm:h-16 text-xl sm:text-2xl font-black bg-zinc-900 text-zinc-400 border-2 border-zinc-800 rounded-none transition-colors hover:bg-zinc-600 hover:text-white active:bg-zinc-600 active:text-white"
              onClick={startTrace}
            >
              START TRACE
            </Button>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {scrambleMode !== "edge-only" && (
              <div className="p-3 sm:p-4 border-2 border-zinc-800 bg-black space-y-1.5">
                <span className="text-lg sm:text-xl font-black uppercase tracking-wide text-zinc-400">
                  Corners
                </span>
                <Input
                  className="rounded-none border-2 border-zinc-800 focus-visible:ring-0 focus-visible:border-zinc-600 bg-black text-zinc-100 placeholder:text-zinc-800 text-base sm:text-lg h-10 sm:h-12"
                  ref={cornerInputRef}
                  placeholder="Corner..."
                  value={cornerText}
                  onChange={(e) => handleInputChange(e, setCornerText)}
                  onCompositionStart={() => (isComposing.current = true)}
                  onCompositionEnd={(e) => handleCompositionEnd(e, setCornerText)}
                  disabled={status !== "running"}
                />
              </div>
            )}

            {scrambleMode !== "corner-only" && (
              <div className="p-3 sm:p-4 border-2 border-zinc-800 bg-black space-y-1.5">
                <span className="text-lg sm:text-xl font-black uppercase tracking-wide text-zinc-400">
                  Edges
                </span>
                <Input
                  className="rounded-none border-2 border-zinc-800 focus-visible:ring-0 focus-visible:border-zinc-600 bg-black text-zinc-100 placeholder:text-zinc-800 text-base sm:text-lg h-10 sm:h-12"
                  ref={edgeInputRef}
                  placeholder="Edge..."
                  value={edgeText}
                  onChange={(e) => handleInputChange(e, setEdgeText)}
                  onCompositionStart={() => (isComposing.current = true)}
                  onCompositionEnd={(e) => handleCompositionEnd(e, setEdgeText)}
                  disabled={status !== "running"}
                />
              </div>
            )}
          </div>

          <div className="flex justify-center">
            <div
              ref={parityRef}
              tabIndex={status === "running" ? 0 : -1}
              role="checkbox"
              aria-checked={parity}
              className={`flex items-center gap-2 select-none text-base sm:text-lg font-black p-2 sm:p-2.5 px-4 sm:px-6 border-2 border-zinc-800 bg-black text-zinc-400 focus:outline-none focus:bg-zinc-900 hover:bg-zinc-900 active:bg-zinc-900 touch-manipulation ${
                status === "running" ? "cursor-pointer" : "opacity-30 cursor-not-allowed"
              }`}
              onClick={() => status === "running" && setParity(!parity)}
              onKeyDown={(e) => {
                if (status !== "running") return;
                if (e.key === " " || e.key === "Enter") {
                  e.preventDefault();
                  setParity(!parity);
                }
              }}
            >
              <span>PARITY:</span>
              <span className={parity ? "text-emerald-500" : "text-rose-500"}>
                {parity ? "YES" : "NO"}
              </span>
            </div>
          </div>

          {status === "running" && (
            <Button
              className="w-full bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-800 text-zinc-300 font-black py-2.5 sm:py-2 border-2 border-zinc-800 rounded-none text-base h-11 sm:h-auto"
              onClick={submitTimer}
            >
              SUBMIT / STOP
            </Button>
          )}
        </>
      )}
    </div>
  );
}