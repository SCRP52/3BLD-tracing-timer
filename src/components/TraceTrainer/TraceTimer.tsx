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
  const [isPaused, setIsPaused] = useState(false);
  const [isConfirmingGiveUp, setIsConfirmingGiveUp] = useState(false);
  const [isDNF, setIsDNF] = useState(false);

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
    setIsConfirmingGiveUp(false);
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
    }
  };

  const resumeTimer = () => {
    if (status === "running" && isPaused && pausedAt.current !== null) {
      const pauseDuration = performance.now() - pausedAt.current;
      setStartTime((prev) => prev + pauseDuration);
      setIsPaused(false);
      setIsConfirmingGiveUp(false);
      pausedAt.current = null;
      requestAnimationFrame(() => {
        focusActiveInput();
      });
    }
  };

  const giveUpTimer = () => {
    if (status === "running") {
      if (!isPaused) {
        pausedAt.current = performance.now();
        setIsPaused(true);
      }
      setIsConfirmingGiveUp(true);
    }
  };

  const confirmGiveUp = () => {
    setIsDNF(true);
    setStatus("finished");
    setIsPaused(false);
    setIsConfirmingGiveUp(false);
    pausedAt.current = null;
    window.dispatchEvent(new CustomEvent("trace-status-change", { detail: { status: "finished", isDNF: true } }));
  };

  const cancelGiveUp = () => {
    setIsConfirmingGiveUp(false);
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
          e.preventDefault();
          if (isConfirmingGiveUp) {
            cancelGiveUp();
          } else {
            giveUpTimer();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [status, startTime, isPaused, isConfirmingGiveUp, newScramble, scrambleMode, useTimer]);

  useEffect(() => {
    if (!useTimer) return;

    const handleVisibility = () => {
      if (status === "running" && document.hidden) {
        pauseTimer();
      }
    };

    const handleSettingsToggle = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.isOpen && status === "running") {
        pauseTimer();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("trace-settings-toggle", handleSettingsToggle);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("trace-settings-toggle", handleSettingsToggle);
    };
  }, [status, isPaused, useTimer]);

  useEffect(() => {
    if (!useTimer) return;

    const handleResumeEvent = () => resumeTimer();
    const handleGiveUpEvent = () => giveUpTimer();

    window.addEventListener("trace-resume", handleResumeEvent);
    window.addEventListener("trace-giveup", handleGiveUpEvent);

    return () => {
      window.removeEventListener("trace-resume", handleResumeEvent);
      window.removeEventListener("trace-giveup", handleGiveUpEvent);
    };
  }, [status, isPaused, startTime, scrambleMode, useTimer]);

  // ẨN HOÀN TOÀN COMPONENT KHI TẮT TIMER ĐỂ VỀ MẶC ĐỊNH
  if (!useTimer) {
    return null;
  }

  return (
    <div className="my-4 rounded-xl border p-4 space-y-4">
      {isConfirmingGiveUp ? (
        <div className="space-y-2 py-4">
          <div className="text-center text-red-500 font-bold mb-2 uppercase tracking-wider">
            Are you sure you want to Give Up?
          </div>
          <button
            className="w-full rounded-lg border p-2 bg-red-600 hover:bg-red-700 text-white font-medium"
            onClick={confirmGiveUp}
          >
            Yes, Give Up (DNF)
          </button>
          <button
            className="w-full rounded-lg border p-2 bg-secondary text-secondary-foreground font-medium"
            onClick={cancelGiveUp}
          >
            No, Go Back
          </button>
        </div>
      ) : isPaused ? (
        <div className="space-y-2 py-4">
          <div className="text-center text-amber-500 font-semibold mb-2">
            TRACE PAUSED
          </div>
          <button
            className="w-full rounded-lg border p-2 bg-primary text-primary-foreground font-medium"
            onClick={resumeTimer}
          >
            Continue
          </button>
          <button
            className="w-full rounded-lg border border-red-500 p-2 text-red-500 font-medium bg-background"
            onClick={giveUpTimer}
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

            <div className="text-sm text-muted-foreground uppercase tracking-wider">
              {status === "running" ? "Show Result(DNF)" : "Show Results"}
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
                  onChange={(e) => setCornerText(e.target.value.toUpperCase())}
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
                  onChange={(e) => setEdgeText(e.target.value.toUpperCase())}
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