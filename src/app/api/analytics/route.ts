import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const radarData = [
    { metric: "Hücum Gücü", teamA: 92, teamB: 84 },
    { metric: "Müdafiə İntizamı", teamA: 85, teamB: 78 },
    { metric: "xG Gözləntisi", teamA: 88, teamB: 72 },
    { metric: "Topa Sahiblik", teamA: 55, teamB: 45 },
    { metric: "Zərbə Dəqiqliyi", teamA: 82, teamB: 75 },
    { metric: "Fiziki Dözümlülük", teamA: 90, teamB: 86 },
  ];

  return NextResponse.json({
    success: true,
    data: {
      matchId: "m_22_17",
      title: "10A vs 11H (Böyük Final)",
      score: "5 - 4",
      radar: radarData,
      xg: { teamA: 3.99, teamB: 2.78 },
      shots: { teamA: 16, teamB: 14, onTargetA: 11, onTargetB: 9 },
    },
  });
}
