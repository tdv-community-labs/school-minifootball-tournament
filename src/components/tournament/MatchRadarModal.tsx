"use client";

import React from "react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Swords, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MatchRadarModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  match: {
    team_a: string;
    team_b: string;
    score_a: number;
    score_b: number;
    stage: string;
  } | null;
}

export function MatchRadarModal({ open, onOpenChange, match }: MatchRadarModalProps) {
  if (!match) return null;

  const data = [
    { subject: "Hücum Gücü", teamA: 92, teamB: 84, fullMark: 100 },
    { subject: "Müdafiə", teamA: 85, teamB: 78, fullMark: 100 },
    { subject: "xG Gözləntisi", teamA: 88, teamB: 72, fullMark: 100 },
    { subject: "Topa Nəzarət", teamA: 55, teamB: 45, fullMark: 100 },
    { subject: "Zərbə Dəqiqliyi", teamA: 82, teamB: 75, fullMark: 100 },
    { subject: "İntizam", teamA: 90, teamB: 86, fullMark: 100 },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <div className="flex items-center justify-between">
          <DialogTitle className="flex items-center gap-2">
            <Swords className="h-5 w-5 text-emerald-400" />
            <span>Matç Radar Müqayisəsi</span>
          </DialogTitle>
          <Badge variant="outline" className="border-emerald-500/30 text-emerald-300">
            {match.stage}
          </Badge>
        </div>
        <DialogDescription>
          {match.team_a} ({match.score_a}) vs {match.team_b} ({match.score_b}) statistik analitikası
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        {/* Radar Chart */}
        <div className="h-[280px] w-full bg-white/[0.02] rounded-2xl border border-white/5 p-2">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
              <PolarGrid stroke="rgba(255, 255, 255, 0.1)" />
              <PolarAngleAxis dataKey="subject" stroke="#a1a1aa" fontSize={11} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#52525b" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#09090b",
                  borderColor: "rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                }}
              />
              <Radar
                name={match.team_a}
                dataKey="teamA"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.4}
              />
              <Radar
                name={match.team_b}
                dataKey="teamB"
                stroke="#f59e0b"
                fill="#f59e0b"
                fillOpacity={0.3}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 text-xs font-semibold">
          <div className="flex items-center gap-2 text-emerald-400">
            <span className="h-3 w-3 rounded-full bg-emerald-500" />
            <span>{match.team_a}</span>
          </div>
          <div className="flex items-center gap-2 text-amber-400">
            <span className="h-3 w-3 rounded-full bg-amber-500" />
            <span>{match.team_b}</span>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
