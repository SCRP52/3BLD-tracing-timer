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
  useTimer = true 
}: TraceTimerProps) {
  const [status, setStatus] = useState<"ready" | "running" | "finished">(
    "ready",
  );

  const [time, setTime] = useState(0);
  const [startTime, setStartTime] = useState(0);

  const [edgeText, setEdgeText] = useState("");
  const [cornerText, setCornerText] = useState("");
  const [parity, setParity] = useState(false);

  const edgeInputRef = useRef<HTMLInputElement>(null);
  const cornerInputRef = useRef<HTMLInputElement>(null);
  const parityRef = useRef<HTMLInputElement>(null);
  const pausedAt = useRef<number | null>(null);
  
  // Dùng ref để theo dõi trạng thái gõ tiếng Việt (Unikey)
  const isComposing = useRef(false);

  const [isPaused, setIsPaused] = useState(false);
  const [isDNF, setIsDNF] = useState(false);

  // Helper để lọc text: chỉ giữ chữ cái và khoảng trắng (bỏ số, ký tự đặc biệt, dấu)
  const sanitizeText = (val: string) => val.replace(/[^a-zA-Z\s]/g, "").toUpperCase();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    if (isComposing.current) {
      // Nếu đang gõ tiếng Việt, cho phép gõ tự do
      setter(e.target.value);
    } else {
      // Nếu gõ bình thường, lọc ngay lập tức
      setter(sanitizeText(e.target.value));
    }
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>, setter: (val: string) => void) => {
    isComposing.current = false;
    // Lọc lần cuối khi hoàn tất từ có dấu
    setter(sanitizeText(e.currentTarget.value));
  };

  const focusActiveInput = () => {
    if (scrambleMode === "corner-only") {
      cornerInputRef.current?.focus();
    } else {
      edgeInputRef.current?.focus();
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
    setStartTime(now);
    setStatus("running");
    setIsPaused(false);
    pausedAt.current = null;

    window.dispatchEvent(new CustomEvent("trace-status-change", { detail: { status: "running" } }));

    requestAnimationFrame(() => {
      focusActiveInput();
    });
  };

  const submitTimer = () => {
    if (status === "running" && !isPaused) {
      setTime(performance.now() - startTime);
      setStatus("finished");
      edgeInputRef.current?.blur();
      cornerInputRef.current?.blur();
      window.dispatchEvent(new CustomEvent("trace-status-change", { detail: { status: "finished", isDNF: false } }));
    }
  };

  const pauseTimer = () => {
    if (status === "running" && !isPaused) {
      pausedAt.current = performance.now();
      setIsPaused(true);
      window.dispatchEvent(new CustomEvent("trace-status-change", { detail: { status: "paused" } }));
    }
  };

  const resumeTimer = () => {
    if (status === "running" && isPaused && pausedAt.current !== null) {
      const pauseDuration = performance.now() - pausedAt.current;
      setStartTime((prev) => prev + pauseDuration);
      setIsPaused(false);
      pausedAt.current = null;
      window.dispatchEvent(new CustomEvent("trace-status-change", { detail: { status: "running" } }));
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
    window.dispatchEvent(new CustomEvent("trace-status-change", { detail: { status: "finished", isDNF: true } }));
  };

  useEffect(() => {
    if (!useTimer || status !== "running" || isPaused) return;

    const id = setInterval(() => {
      setTime(performance.now() - startTime);
    }, 10);

    return () => clearInterval(id);
  }, [status, startTime, isPaused, useTimer]);

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
          setStartTime(0);
          setStatus("ready");
          edgeInputRef.current?.blur();
          cornerInputRef.current?.blur();
          window.dispatchEvent(new CustomEvent("trace-status-change", { detail: { status: "ready" } }));
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
          setStartTime(0);
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
  }, [status, startTime, isPaused, newScramble, scrambleMode, useTimer]);

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
  }, [status, isPaused, startTime, useTimer]);

  if (!useTimer) {
    return null;
  }

  return (
    <div className="my-4 rounded-xl border p-4 space-y-4">
      {isPaused ? (
        <div className="space-y-2 py-4">
          <div className="text-center text-amber-500 font-semibold mb-2 uppercase tracking-wider">
            Trace Paused
          </div>
          <button
            className="w-full rounded-lg border p-2 bg-primary text-primary-foreground font-medium"
            onClick={resumeTimer}
          >
            Continue
          </button>
          <button
            className="w-full rounded-lg border border-red-500 p-2 text-red-500 font-medium bg-background hover:bg-red-500/10 transition-colors"
            onClick={() => window.dispatchEvent(new CustomEvent("trace-request-giveup"))}
          >
            Give Up
          </button>
        </div>
      ) : (
        <>
          <div className="text-center">
            <div className={`text-3xl font-bold font-mono ${isDNF ? "text-red-500" : ""}`}>
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
            <Button className="w-full" onClick={startTrace}>
              Start Trace
            </Button>
          )}

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {scrambleMode !== "edge-only" && (
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground">Corners</span>
                <Input
                  ref={cornerInputRef}
                  placeholder="Corner memo..."
                  value={cornerText}
                  onChange={(e) => handleInputChange(e, setCornerText)}
                  onCompositionStart={() => (isComposing.current = true)}
                  onCompositionEnd={(e) => handleCompositionEnd(e, setCornerText)}
                  disabled={status !== "running"}
                />
              </div>
            )}

            {scrambleMode !== "corner-only" && (
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground">Edges</span>
                <Input
                  ref={edgeInputRef}
                  placeholder="Edge memo..."
                  value={edgeText}
                  onChange={(e) => handleInputChange(e, setEdgeText)}
                  onCompositionStart={() => (isComposing.current = true)}
                  onCompositionEnd={(e) => handleCompositionEnd(e, setEdgeText)}
                  disabled={status !== "running"}
                />
              </div>
            )}
          </div>

          <label className="flex items-center gap-3 select-none text-lg font-bold p-2.5 border rounded-lg bg-secondary/30 cursor-pointer focus-within:ring-2 focus-within:ring-primary">
            <input
              ref={parityRef}
              type="checkbox"
              className="w-5 h-5 accent-primary cursor-pointer rounded"
              checked={parity}
              onChange={(e) => setParity(e.target.checked)}
              disabled={status !== "running"}
            />
            <span className={status !== "running" ? "text-muted-foreground cursor-not-allowed" : ""}>
              Parity
            </span>
          </label>

          {status === "running" && (
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 mt-2" onClick={submitTimer}>
              Submit / Stop
            </Button>
          )}
        </>
      )}
    </div>
  );
}