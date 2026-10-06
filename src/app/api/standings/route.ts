import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const division = url.searchParams.get("division") || "10-11";

    const { data, error } = await supabase
      .from("tournament_standings")
      .select("*")
      .eq("division", division)
      .order("points", { ascending: false });

    if (error || !data || data.length === 0) {
      const defaultStandings = [
        { id: "std-10a", division: "10-11", team: "10A", played: 6, won: 5, drawn: 1, lost: 0, gf: 24, ga: 8, gd: 16, points: 16, form: ["W","W","W","D","W","W"] },
        { id: "std-11h", division: "10-11", team: "11H", played: 6, won: 5, drawn: 0, lost: 1, gf: 21, ga: 9, gd: 12, points: 15, form: ["W","W","L","W","W","W"] },
        { id: "std-11c", division: "10-11", team: "11C", played: 6, won: 3, drawn: 2, lost: 1, gf: 15, ga: 11, gd: 4, points: 11, form: ["W","D","W","D","L","W"] },
        { id: "std-10b", division: "10-11", team: "10B", played: 6, won: 3, drawn: 1, lost: 2, gf: 14, ga: 12, gd: 2, points: 10, form: ["D","W","W","L","W","L"] },
      ];
      return NextResponse.json({ success: true, data: defaultStandings, source: "default" });
    }

    return NextResponse.json({ success: true, data, source: "supabase" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
