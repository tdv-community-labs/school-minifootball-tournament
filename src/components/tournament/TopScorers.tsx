"use client";

import React from "react";
import { Flame, Award, Zap, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Player {
  id: string;
  name: string;
  class_name: string;
  position: string;
  goals: number;
  assists: number;
  rating: number;
}

interface TopScorersProps {
  players: Player[];
}

export function TopScorers({ players }: TopScorersProps) {
  const sorted = [...players].sort((a, b) => b.goals - a.goals);

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Flame className="h-4 w-4 text-amber-400" />
            <span>Bombardirlər Yarışı (Qızıl Buts)</span>
          </h3>
          <p className="text-[11px] text-zinc-400">Turnirin ən çox qol və məhsuldar ötürmə edən oyunçuları</p>
        </div>
        <Badge variant="gold" className="text-[10px]">
          Qızıl Buts 👟⚽
        </Badge>
      </div>

      <div className="space-y-2.5">
        {sorted.slice(0, 5).map((player, idx) => (
          <div
            key={player.id}
            className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-3 transition-colors hover:bg-white/5"
          >
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold text-zinc-500 w-4">
                #{idx + 1}
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 text-xs">
                {player.class_name}
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>{player.name}</span>
                  {idx === 0 && <span className="text-[11px]">🥇</span>}
                </div>
                <div className="text-[10px] text-zinc-400">
                  {player.position} • Reytinq:{" "}
                  <span className="text-amber-400 font-bold">{player.rating}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-right">
              <div>
                <div className="font-mono text-sm font-extrabold text-emerald-400">
                  {player.goals} Qol
                </div>
                <div className="text-[10px] text-zinc-400 font-mono">
                  {player.assists} Asist
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
