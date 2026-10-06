"use client";

import React from "react";
import { Trophy, Swords, Sparkles, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Match {
  id: string;
  stage: string;
  team_a: string;
  team_b: string;
  score_a: number;
  score_b: number;
  penalty_score_a?: number | null;
  penalty_score_b?: number | null;
  match_date?: string;
  mom?: string;
}

interface PlayoffBracketProps {
  matches: Match[];
  onOpenAnalytics: (match: Match) => void;
}

export function PlayoffBracket({ matches, onOpenAnalytics }: PlayoffBracketProps) {
  const finalMatch = matches.find((m) => m.stage.includes("Final")) || {
    id: "m-fin",
    stage: "Böyük Final",
    team_a: "10A",
    team_b: "11H",
    score_a: 5,
    score_b: 4,
    match_date: "01.06.2023 • 17:00",
    mom: "Orxan Namazov",
  };

  const semiMatches = matches.filter((m) => m.stage.includes("Yarımfinal"));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-400" />
            <span>Pley-off Braketi (Playoff Bracket)</span>
          </h2>
          <p className="text-xs text-zinc-400">
            Mərhələlər üzrə canlı və arxiv oyun nəticələri, xG dəyərləri və penalti seriyaları
          </p>
        </div>
        <Badge variant="gold" className="text-xs font-mono">
          Final Qalibi: 10A 🏆
        </Badge>
      </div>

      {/* Bracket Tree Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
        {/* Semi-finals Column */}
        <div className="space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Yarımfinallar
          </div>
          {(semiMatches.length > 0 ? semiMatches : [
            { id: "s1", stage: "Yarımfinal 1", team_a: "10A", team_b: "11C", score_a: 4, score_b: 2 },
            { id: "s2", stage: "Yarımfinal 2", team_a: "11H", team_b: "10B", score_a: 3, score_b: 2, penalty_score_a: 4, penalty_score_b: 3 },
          ]).map((match) => (
            <div
              key={match.id}
              className="rounded-2xl border border-white/10 bg-zinc-900/40 p-4 backdrop-blur-xl transition-all hover:border-emerald-500/40"
            >
              <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-2">
                <span>{match.stage}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onOpenAnalytics(match as Match)}
                  className="h-6 px-2 text-[10px] text-emerald-400 hover:text-emerald-300"
                >
                  <Eye className="h-3 w-3 mr-1" /> Analitika
                </Button>
              </div>

              <div className="space-y-2">
                <div
                  className={`flex items-center justify-between p-2 rounded-xl border ${
                    match.score_a > match.score_b
                      ? "border-emerald-500/30 bg-emerald-500/10 font-bold text-white"
                      : "border-white/5 bg-white/[0.02] text-zinc-400"
                  }`}
                >
                  <span>{match.team_a}</span>
                  <span className="font-mono text-base">{match.score_a}</span>
                </div>

                <div
                  className={`flex items-center justify-between p-2 rounded-xl border ${
                    match.score_b > match.score_a
                      ? "border-emerald-500/30 bg-emerald-500/10 font-bold text-white"
                      : "border-white/5 bg-white/[0.02] text-zinc-400"
                  }`}
                >
                  <span>{match.team_b}</span>
                  <span className="font-mono text-base">{match.score_b}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Center Grand Final Card */}
        <div className="lg:scale-105">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2 text-center">
            Böyük Final
          </div>
          <div className="rounded-3xl border-2 border-amber-500/40 bg-gradient-to-b from-zinc-900/90 to-zinc-950 p-6 backdrop-blur-2xl shadow-[0_0_50px_rgba(245,158,11,0.15)] text-center relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-500" />

            <div className="flex justify-center mb-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Trophy className="h-6 w-6" />
              </div>
            </div>

            <h3 className="text-lg font-extrabold text-white">Çempionluq Matçı</h3>
            <p className="text-xs text-zinc-400 mt-0.5">{finalMatch.match_date}</p>

            <div className="my-6 flex items-center justify-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-black text-emerald-400">{finalMatch.team_a}</div>
                <Badge variant="outline" className="border-emerald-500/30 text-[10px] mt-1">
                  Çempion 🥇
                </Badge>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 font-mono text-3xl font-black text-white shadow-inner">
                {finalMatch.score_a} : {finalMatch.score_b}
              </div>

              <div className="text-center">
                <div className="text-2xl font-black text-zinc-300">{finalMatch.team_b}</div>
                <Badge variant="outline" className="border-zinc-500/30 text-[10px] mt-1">
                  Vitse-Çempion 🥈
                </Badge>
              </div>
            </div>

            {finalMatch.mom && (
              <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl py-1.5 px-3 inline-block">
                🌟 Oyunun Ən Yaxşısı (MOM): <strong>{finalMatch.mom}</strong>
              </p>
            )}

            <div className="mt-5">
              <Button
                variant="default"
                onClick={() => onOpenAnalytics(finalMatch as Match)}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-600/30"
              >
                Matçın Dərin Analitikasını Aç (xG, Radar)
              </Button>
            </div>
          </div>
        </div>

        {/* Tournament Highlights Card */}
        <div className="space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Turnir Məlumatı
          </div>
          <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5 backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between text-xs border-b border-white/5 pb-2">
              <span className="text-zinc-400">Toplam Oyun Sayı</span>
              <span className="font-mono font-bold text-white">48 Matç</span>
            </div>
            <div className="flex items-center justify-between text-xs border-b border-white/5 pb-2">
              <span className="text-zinc-400">Vurulan Qol Sayı</span>
              <span className="font-mono font-bold text-emerald-400">184 Qol (3.83 / oyun)</span>
            </div>
            <div className="flex items-center justify-between text-xs border-b border-white/5 pb-2">
              <span className="text-zinc-400">Ən Məhsuldar Komanda</span>
              <span className="font-bold text-white">10A (24 Qol)</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Fair-Play İntizamı</span>
              <span className="font-bold text-emerald-300">0 Qırmızı vərəqə</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
