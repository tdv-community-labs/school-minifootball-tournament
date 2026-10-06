"use client";

import React from "react";
import { Trophy, Shield, Flame, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface NavbarProps {
  division: string;
  onSelectDivision: (div: string) => void;
}

export function Navbar({ division, onSelectDivision }: NavbarProps) {
  const divisions = ["10-11", "7-9", "5-6"];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-zinc-950/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-green-800 text-white shadow-lg shadow-emerald-600/30">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-white sm:text-lg">
                TDV Minifutbol Liqası
              </span>
              <Badge variant="gold" className="text-[10px] font-mono tracking-wider">
                PRO 2.0
              </Badge>
            </div>
            <p className="text-[11px] text-zinc-400 hidden sm:block">
              Məktəb Kuboku • Pley-off & Canlı Statistika
            </p>
          </div>
        </div>

        {/* Division Selector Pills */}
        <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 p-1">
          {divisions.map((d) => (
            <button
              key={d}
              onClick={() => onSelectDivision(d)}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                division === d
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {d}-ci Siniflər
            </button>
          ))}
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
            <Activity className="h-4 w-4 animate-pulse text-emerald-400" />
            <span className="hidden sm:inline">Pley-off Mərhələsi</span>
          </div>
        </div>
      </div>
    </header>
  );
}
