"use client";

import React from "react";
import { Shield, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Standing {
  id: string;
  division: string;
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
  form?: string[];
}

interface GroupStandingsProps {
  standings: Standing[];
  division: string;
}

export function GroupStandings({ standings, division }: GroupStandingsProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-400" />
            <span>Turnir Cədvəli ({division}-ci Siniflər)</span>
          </h3>
          <p className="text-[11px] text-zinc-400">Xal durumu, top fərqi və son oyun forması</p>
        </div>
        <Badge variant="outline" className="border-emerald-500/30 text-emerald-300 text-[10px]">
          Qrup Mərhələsi
        </Badge>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-white/10 text-zinc-400 font-mono text-[11px]">
              <th className="py-2.5 px-3">#</th>
              <th className="py-2.5 px-3">Komanda</th>
              <th className="py-2.5 px-2 text-center">O</th>
              <th className="py-2.5 px-2 text-center">Q</th>
              <th className="py-2.5 px-2 text-center">H</th>
              <th className="py-2.5 px-2 text-center">M</th>
              <th className="py-2.5 px-2 text-center">VQ</th>
              <th className="py-2.5 px-2 text-center">BQ</th>
              <th className="py-2.5 px-2 text-center">TF</th>
              <th className="py-2.5 px-3 text-center">Forma</th>
              <th className="py-2.5 px-3 text-right">Xal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-medium">
            {standings.map((row, index) => (
              <tr
                key={row.id}
                className="hover:bg-white/[0.02] transition-colors"
              >
                <td className="py-3 px-3 font-mono">
                  <span
                    className={`inline-flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold ${
                      index === 0
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : index === 1
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        : "text-zinc-500"
                    }`}
                  >
                    {index + 1}
                  </span>
                </td>
                <td className="py-3 px-3 font-bold text-white flex items-center gap-2">
                  <span>{row.team}</span>
                  {index === 0 && <span className="text-[10px]">👑</span>}
                </td>
                <td className="py-3 px-2 text-center text-zinc-400 font-mono">{row.played}</td>
                <td className="py-3 px-2 text-center text-emerald-400 font-mono">{row.won}</td>
                <td className="py-3 px-2 text-center text-amber-400 font-mono">{row.drawn}</td>
                <td className="py-3 px-2 text-center text-rose-400 font-mono">{row.lost}</td>
                <td className="py-3 px-2 text-center text-zinc-300 font-mono">{row.gf}</td>
                <td className="py-3 px-2 text-center text-zinc-400 font-mono">{row.ga}</td>
                <td className="py-3 px-2 text-center font-mono font-bold text-emerald-300">
                  {row.gd > 0 ? `+${row.gd}` : row.gd}
                </td>
                <td className="py-3 px-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    {(row.form || ["W", "W", "D"]).slice(-5).map((f, i) => (
                      <span
                        key={i}
                        className={`inline-flex h-4 w-4 items-center justify-center rounded text-[9px] font-bold ${
                          f === "W"
                            ? "bg-emerald-500/30 text-emerald-300"
                            : f === "D"
                            ? "bg-amber-500/30 text-amber-300"
                            : "bg-rose-500/30 text-rose-300"
                        }`}
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="py-3 px-3 text-right font-mono text-base font-extrabold text-white">
                  {row.points}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
