// src/components/HomePage.tsx
"use client";

import { Separator } from "@/components/ui/separator";
import simplifyScramble from "@/utils/scramble/simplifyScramble";
import { useContext, useEffect, useMemo, useState } from "react";
import CubeSidebar from "./CubePreview/CubeSidebar";
import MemoResult from "./MemoResult/MemoResult";
import ScrambleButton from "./ScrambleGenerator/ScrambleButton";
import ScrambleInputField from "./ScrambleGenerator/ScrambleInputField";
import Settings from "./Settings/Settings";
import {
  invertRotation,
  makeWhiteTopGreenFront,
  orientationToRotation,
} from "@/utils/orientation";
import { SettingsContext } from "@/context/SettingsContext";
import { applyScramble } from "@/utils/scramble/applyScramble";
import TraceTimer from "./TraceTrainer/TraceTimer";
import { Button } from "./ui/button";

export default function HomePage() {
  const [scramble, setScramble] = useState(
    "F2 R' B' U R' L F' L F' B D' R B L2",
  );
  const [scrambleMode, setScrambleMode] = useState<"normal" | "edge-only" | "corner-only">("normal");
  const [timerStatus, setTimerStatus] = useState<"ready" | "running" | "paused" | "finished">("ready");
  const [hasRevealed, setHasRevealed] = useState(false);
  const [useTimer, setUseTimer] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);

  const context = useContext(SettingsContext);
  if (!context)
    throw new Error("SettingsPanel must be used within a SettingsProvider");

  const {
    settings: { orientation, scrambleOrientation },
  } = context;

  // ... (giữ nguyên logic useEffect và các handle function như cũ)
  useEffect(() => {
    const saved = localStorage.getItem("useTimer");
    if (saved !== null) {
      setUseTimer(saved !== "false");
    }

    const handleTimerToggle = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && typeof customEvent.detail.useTimer === "boolean") {
        setUseTimer(customEvent.detail.useTimer);
      }
    };

    const handleStatusChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.status) {
        setTimerStatus(customEvent.detail.status);
      }
    };

    const handleRequestGiveUp = () => {
      setShowConfirm(true);
    };

    window.addEventListener("trace-timer-toggle", handleTimerToggle);
    window.addEventListener("trace-status-change", handleStatusChange);
    window.addEventListener("trace-request-giveup", handleRequestGiveUp);
    return () => {
      window.removeEventListener("trace-timer-toggle", handleTimerToggle);
      window.removeEventListener("trace-status-change", handleStatusChange);
      window.removeEventListener("trace-request-giveup", handleRequestGiveUp);
    };
  }, []);

  useEffect(() => {
    setTimerStatus("ready");
    setHasRevealed(false);
    setShowConfirm(false);
  }, [scramble]);

  const handleRevealResult = () => {
    if (timerStatus === "running") {
      window.dispatchEvent(new CustomEvent("trace-pause"));
      return;
    }
    if (timerStatus === "paused") {
      setShowConfirm(true);
      return;
    }
    if (timerStatus === "finished") {
      setHasRevealed(true);
    }
  };

  const handleConfirmReveal = () => {
    window.dispatchEvent(new CustomEvent("trace-giveup"));
    setTimerStatus("finished");
    setHasRevealed(true);
    setShowConfirm(false);
  };

  const handleCancelReveal = () => {
    setShowConfirm(false);
  };

  const triggerNewScramble = () => {
    if (timerStatus === "running") return;
    const button = document.querySelector("[data-scramble-btn='true']") as HTMLButtonElement;
    if (button) {
      button.click();
    }
  };

  const [simplifiedScramble, setSimplifiedScramble] = useState(scramble);
  useEffect(() => {
    let cancelled = false;
    setSimplifiedScramble(scramble);
    simplifyScramble(scramble).then((result) => {
      if (!cancelled) setSimplifiedScramble(result);
    });
    return () => {
      cancelled = true;
    };
  }, [scramble]);

  const { scrambleForPreview, rotationForPreview, cube } = useMemo(() => {
    const rotation = orientationToRotation(orientation);
    const scrambleRotation = orientationToRotation(scrambleOrientation);

    const scrambleForPreview = `${scrambleRotation} ${simplifiedScramble}`;

    const rotationForPreview = makeWhiteTopGreenFront(
      applyScramble({ type: "3x3", scramble: scrambleForPreview }),
    );

    const realScramble = `${invertRotation(rotation)} ${scrambleRotation} ${scramble} ${rotation}`;
    const afterRotation = makeWhiteTopGreenFront(
      applyScramble({ type: "3x3", scramble: realScramble }),
    );
    const realScrambleWG = `${realScramble} ${afterRotation}`;
    const cube = applyScramble({
      type: "3x3",
      scramble: realScrambleWG,
    });

    return { scrambleForPreview, rotationForPreview, cube };
  }, [scramble, simplifiedScramble, orientation, scrambleOrientation]);

  const isTimerRunning = useTimer && timerStatus === "running";

  return (
    <div className="relative min-h-screen w-full">
      {/* Tăng max-w, tăng padding, thêm text-lg để nội dung to hơn */}
      <div className={`container mx-auto max-w-6xl p-8 lg:p-12 space-y-10 text-lg transition-all duration-300 ${showConfirm ? "blur-2xl pointer-events-none select-none" : ""}`}>
        
        {/* Header Section */}
        <div className="flex flex-wrap items-center gap-4">
          <Settings />
          <CubeSidebar
            scramble={scrambleForPreview}
            rotation={rotationForPreview}
          />
          <div className={isTimerRunning ? "pointer-events-none opacity-50" : ""}>
            <ScrambleButton setScramble={setScramble} onScrambleTypeChange={setScrambleMode} />
          </div>
        </div>
        
        <div className={isTimerRunning ? "pointer-events-none opacity-50" : ""}>
          <ScrambleInputField scramble={scramble} setScramble={setScramble} />
        </div>

        <Separator className="my-8" />
        
        <TraceTimer 
          key={scramble}
          newScramble={triggerNewScramble} 
          scrambleMode={scrambleMode} 
          useTimer={useTimer}
        />
        
        {useTimer ? (
          timerStatus !== "ready" && (
            <div className="space-y-6">
              {!hasRevealed ? (
                timerStatus !== "paused" && (
                  <Button 
                    variant="secondary"
                    className="w-full py-10 text-lg font-bold border border-dashed border-muted-foreground/30 hover:bg-secondary/80"
                    onClick={handleRevealResult}
                  >
                    {timerStatus === "running" ? "Pause" : "Show Results"}
                  </Button>
                )
              ) : (
                <div className="rounded-xl border p-6 bg-card text-card-foreground">
                  <MemoResult cube={cube} />
                </div>
              )}
            </div>
          )
        ) : (
          <MemoResult cube={cube} />
        )}
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/40 p-4">
          <div className="bg-card text-card-foreground p-8 rounded-2xl border shadow-2xl max-w-md w-full text-center space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-2xl font-bold text-destructive">Confirm DNF</h3>
            <p className="text-base text-muted-foreground leading-relaxed">
              This attempt will be marked as DNF and the solution will be revealed.
            </p>
            <div className="flex gap-4 pt-2">
              <Button variant="outline" className="flex-1 h-12 text-base" onClick={handleCancelReveal}>No</Button>
              <Button variant="destructive" className="flex-1 h-12 text-base" onClick={handleConfirmReveal}>Yes</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}