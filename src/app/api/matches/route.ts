import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { MatchQuerySchema } from "@/lib/validations/tournament";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const query = Object.fromEntries(url.searchParams.entries());
    const filter = MatchQuerySchema.parse(query);

    let dbQuery = supabase.from("tournament_matches").select("*");
    if (filter.division) {
      dbQuery = dbQuery.eq("division", filter.division);
    }
    if (filter.stage) {
      dbQuery = dbQuery.eq("stage", filter.stage);
    }

    const { data, error } = await dbQuery.order("id");

    if (error || !data || data.length === 0) {
      // Fallback default matches
      const defaultMatches = [
        {
          id: "m-fin-10-11",
          year: "2022-2023",
          division: "10-11",
          stage: "Böyük Final",
          team_a: "10A",
          team_b: "11H",
          score_a: 5,
          score_b: 4,
          match_date: "01.06.2023 • 17:00",
          mom: "Orxan Namazov",
          stats: { xgA: 3.99, xgB: 2.78, possessionA: 55, possessionB: 45, shotsA: 16, shotsB: 14 },
        },
        {
          id: "m-semi-1",
          year: "2022-2023",
          division: "10-11",
          stage: "Yarımfinal",
          team_a: "10A",
          team_b: "11C",
          score_a: 4,
          score_b: 2,
          match_date: "28.05.2023 • 16:00",
          mom: "Murad Hüseynov",
          stats: { xgA: 2.8, xgB: 1.9, possessionA: 52, possessionB: 48 },
        },
        {
          id: "m-semi-2",
          year: "2022-2023",
          division: "10-11",
          stage: "Yarımfinal",
          team_a: "11H",
          team_b: "10B",
          score_a: 3,
          score_b: 2,
          penalty_score_a: 4,
          penalty_score_b: 3,
          match_date: "28.05.2023 • 17:30",
          mom: "Kənan Əliyev",
          stats: { xgA: 2.1, xgB: 2.2, possessionA: 50, possessionB: 50 },
        },
      ];
      return NextResponse.json({ success: true, data: defaultMatches, source: "default" });
    }

    return NextResponse.json({ success: true, data, source: "supabase" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
