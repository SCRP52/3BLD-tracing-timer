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
  const [timerStatus, setTimerStatus] = useState<"ready" | "running" | "finished">("ready");
  const [hasRevealed, setHasRevealed] = useState(false);
  const [useTimer, setUseTimer] = useState(true);

  const context = useContext(SettingsContext);
  if (!context)
    throw new Error("SettingsPanel must be used within a SettingsProvider");

  const {
    settings: { orientation, scrambleOrientation },
  } = context;

  // Lắng nghe cấu hình bật/tắt Timer từ Settings và trạng thái Timer
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

    window.addEventListener("trace-timer-toggle", handleTimerToggle);
    window.addEventListener("trace-status-change", handleStatusChange);
    return () => {
      window.removeEventListener("trace-timer-toggle", handleTimerToggle);
      window.removeEventListener("trace-status-change", handleStatusChange);
    };
  }, []);

  useEffect(() => {
    setTimerStatus("ready");
    setHasRevealed(false);
  }, [scramble]);

  const handleRevealResult = () => {
    if (timerStatus === "running") {
      setTimerStatus("finished");
      setHasRevealed(true);
      window.dispatchEvent(new CustomEvent("trace-giveup"));
      return;
    }
    if (timerStatus === "finished") {
      setHasRevealed(true);
    }
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
    <div className="container mx-auto max-w-3xl p-4 sm:p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-2">
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

      <Separator className="my-6" />
      
      <TraceTimer 
        key={scramble}
        newScramble={triggerNewScramble} 
        scrambleMode={scrambleMode} 
        useTimer={useTimer}
      />
      
      {useTimer ? (
        timerStatus !== "ready" && (
          <div className="space-y-4">
            {!hasRevealed ? (
              <Button 
                variant="secondary"
                className="w-full py-8 text-base font-semibold border border-dashed border-muted-foreground/30"
                onClick={handleRevealResult}
              >
                {timerStatus === "running" ? "Show Result(DNF)" : "Show Results"}
              </Button>
            ) : (
              <div className="rounded-xl border p-4 bg-card text-card-foreground">
                <MemoResult cube={cube} />
              </div>
            )}
          </div>
        )
      ) : (
        <MemoResult cube={cube} />
      )}
    </div>
  );
}