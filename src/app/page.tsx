"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/tournament/Navbar";
import { PlayoffBracket } from "@/components/tournament/PlayoffBracket";
import { GroupStandings } from "@/components/tournament/GroupStandings";
import { TopScorers } from "@/components/tournament/TopScorers";
import { MatchRadarModal } from "@/components/tournament/MatchRadarModal";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Swords, Sparkles, Shield, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function TournamentDashboard() {
  const [division, setDivision] = useState("10-11");
  const [selectedMatch, setSelectedMatch] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Queries
  const { data: matchesData, isLoading: isLoadingMatches } = useQuery({
    queryKey: ["matches", division],
    queryFn: async () => {
      const res = await fetch(`/api/matches?division=${division}`);
      return res.json();
    },
  });

  const { data: standingsData, isLoading: isLoadingStandings } = useQuery({
    queryKey: ["standings", division],
    queryFn: async () => {
      const res = await fetch(`/api/standings?division=${division}`);
      return res.json();
    },
  });

  const { data: playersData, isLoading: isLoadingPlayers } = useQuery({
    queryKey: ["players", division],
    queryFn: async () => {
      const res = await fetch(`/api/players?division=${division}`);
      return res.json();
    },
  });

  const handleOpenAnalytics = (match: any) => {
    setSelectedMatch(match);
    setIsModalOpen(true);
    toast.success(`${match.team_a} vs ${match.team_b} analitikası açıldı!`, {
      description: "Radar göstəriciləri və xG statistikası yükləndi.",
    });
  };

  const matches = matchesData?.data || [];
  const standings = standingsData?.data || [];
  const players = playersData?.data || [];

  return (
    <div className="min-h-screen bg-[#040d07] text-zinc-100 flex flex-col">
      <Navbar division={division} onSelectDivision={setDivision} />

      <main className="flex-1 p-4 sm:p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Hero Pitch Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/60 via-zinc-950 to-green-950/40 p-6 sm:p-8 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300 mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              <span>TDV BTL Çempionlar Liqası • 2022-2023 Mövsümü</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              Minifutbol Kuboku Turnir Portalı ⚽
            </h1>
            <p className="mt-2 text-sm text-zinc-300 leading-relaxed">
              Məktəb çempionatının bütün qrup oyunları, pley-off mərhələləri, qol krallığı
              və peşəkar analitika mərkəzi.
            </p>
          </div>
          <div className="absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-emerald-600/20 blur-3xl pointer-events-none" />
        </div>

        {/* Playoff Bracket Section */}
        {isLoadingMatches ? (
          <Skeleton className="h-80" />
        ) : (
          <PlayoffBracket matches={matches} onOpenAnalytics={handleOpenAnalytics} />
        )}

        {/* Dual Layout: Standings & Top Scorers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {isLoadingStandings ? (
            <Skeleton className="h-96" />
          ) : (
            <GroupStandings standings={standings} division={division} />
          )}

          {isLoadingPlayers ? (
            <Skeleton className="h-96" />
          ) : (
            <TopScorers players={players} />
          )}
        </div>
      </main>

      {/* Match Radar Modal */}
      <MatchRadarModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        match={selectedMatch}
      />
    </div>
  );
}
