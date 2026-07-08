// src/components/TraceTrainer/Settings.tsx
"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import BufferSelection from "./BufferSelection";
import CustomLetterScheme from "./CustomLetterScheme";
import CycleBreakPriority from "./CycleBreakPriority";
import ImportExport from "./ImportExport";
import LetterPair from "./LetterPair";
import PreviewStyle from "./PreviewStyle";
import PseudoSwap from "./PseudoSwapParity";
import ResultStyle from "./ResultStyle";
import Scramble from "./Scramble";

function TracingTimerSetting() {
  const [enabled, setEnabled] = useState(true);
  const [hideTimer, setHideTimer] = useState(true);

  useEffect(() => {
    const savedUseTimer = localStorage.getItem("useTimer");
    if (savedUseTimer !== null) {
      setEnabled(savedUseTimer !== "false");
    }
    const savedHideTimer = localStorage.getItem("hideTimerDuringSolve");
    if (savedHideTimer !== null) {
      setHideTimer(savedHideTimer !== "false");
    }
  }, []);

  const handleToggle = (val: boolean) => {
    setEnabled(val);
    localStorage.setItem("useTimer", String(val));
    window.dispatchEvent(
      new CustomEvent("trace-timer-toggle", {
        detail: { useTimer: val },
      })
    );
  };

  const handleHideToggle = (val: boolean) => {
    setHideTimer(val);
    localStorage.setItem("hideTimerDuringSolve", String(val));
    window.dispatchEvent(
      new CustomEvent("trace-hide-timer-toggle", {
        detail: { hideTimerDuringSolve: val },
      })
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/20">
        <div>
          <h4 className="text-sm font-semibold">Enable Tracing write down</h4>
          <p className="text-xs text-muted-foreground">
            Sử dụng bộ đếm thời gian và ẩn kết quả khi trace.
          </p>
        </div>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => handleToggle(e.target.checked)}
          className="w-5 h-5 rounded accent-primary cursor-pointer"
        />
      </div>

      <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/20">
        <div>
          <h4 className="text-sm font-semibold">Hide timer during solve</h4>
          <p className="text-xs text-muted-foreground">
            Ẩn số giây chạy khi đang trong quá trình giải.
          </p>
        </div>
        <input
          type="checkbox"
          checked={hideTimer}
          onChange={(e) => handleHideToggle(e.target.checked)}
          className="w-5 h-5 rounded accent-primary cursor-pointer"
        />
      </div>
    </div>
  );
}

const settingsSections = [
  {
    value: "item-1",
    title: "Buffer Selection",
    Component: BufferSelection,
  },
  {
    value: "item-2",
    title: "Cycle Break Priority",
    Component: CycleBreakPriority,
  },
  {
    value: "item-3",
    title: "Result Style",
    Component: ResultStyle,
  },
  {
    value: "item-4",
    title: "Pseudo Swap for Parity",
    Component: PseudoSwap,
  },
  {
    value: "item-4.5",
    title: "Scramble",
    Component: Scramble,
  },
  {
    value: "item-4.6",
    title: "Tracing Timer",
    Component: TracingTimerSetting,
  },
  {
    value: "item-5",
    title: "Cube Preview",
    Component: PreviewStyle,
  },
  {
    value: "item-6",
    title: "Letter Scheme",
    Component: CustomLetterScheme,
  },
  { value: "item-7", title: "Custom Letter Pairs", Component: LetterPair },
  { value: "item-8", title: "Import / Export", Component: ImportExport },
];

export default function Settings() {
  const [activeSection, setActiveSection] = useState(settingsSections[0].value);

  const ActiveComponent =
    settingsSections.find((s) => s.value === activeSection)?.Component ||
    settingsSections[0].Component;

  return (
    <Sheet
      onOpenChange={(open) => {
        window.dispatchEvent(
          new CustomEvent("trace-settings-toggle", {
            detail: { isOpen: open },
          })
        );
      }}
    >
      <SheetTrigger asChild>
        <Button variant={"outline"} size={"icon"}>
          ☰
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-full sm:max-w-3xl flex flex-col p-0"
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle>Settings</SheetTitle>
        </SheetHeader>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-[200px_1fr] overflow-hidden">
          <aside className="hidden md:block border-r overflow-y-auto">
            <nav className="flex flex-col gap-1 p-2">
              {settingsSections.map(({ value, title }) => (
                <Button
                  key={value}
                  variant="ghost"
                  className={cn(
                    "justify-start",
                    activeSection === value && "bg-muted"
                  )}
                  onClick={() => setActiveSection(value)}
                >
                  {title}
                </Button>
              ))}
            </nav>
          </aside>
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="md:hidden pb-4">
              <Select value={activeSection} onValueChange={setActiveSection}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a section" />
                </SelectTrigger>
                <SelectContent>
                  {settingsSections.map(({ value, title }) => (
                    <SelectItem key={value} value={value}>
                      {title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <ActiveComponent />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}