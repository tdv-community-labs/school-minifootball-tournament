import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { PlayerQuerySchema } from "@/lib/validations/tournament";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const query = Object.fromEntries(url.searchParams.entries());
    const filter = PlayerQuerySchema.parse(query);

    let dbQuery = supabase.from("tournament_players").select("*");
    if (filter.division) {
      dbQuery = dbQuery.eq("division", filter.division);
    }

    const { data, error } = await dbQuery
      .order(filter.sortBy, { ascending: false })
      .limit(filter.limit);

    if (error || !data || data.length === 0) {
      const defaultPlayers = [
        { id: "p-1", name: "Orxan Namazov", class_name: "10A", division: "10-11", position: "Hücumçu", goals: 14, assists: 8, yellow_cards: 1, red_cards: 0, clean_sheets: 0, rating: 9.4 },
        { id: "p-2", name: "Kənan Əliyev", class_name: "11H", division: "10-11", position: "Hücumçu", goals: 12, assists: 6, yellow_cards: 2, red_cards: 0, clean_sheets: 0, rating: 9.1 },
        { id: "p-3", name: "Fərid Qasımov", class_name: "11C", division: "10-11", position: "Yarımmüdafiəçi", goals: 9, assists: 11, yellow_cards: 0, red_cards: 0, clean_sheets: 0, rating: 8.8 },
        { id: "p-4", name: "Tural Məmmədli", class_name: "8A", division: "7-9", position: "Hücumçu", goals: 11, assists: 4, yellow_cards: 1, red_cards: 0, clean_sheets: 0, rating: 8.7 },
        { id: "p-5", name: "Murad Hüseynov", class_name: "10A", division: "10-11", position: "Qapıçı", goals: 0, assists: 1, yellow_cards: 1, red_cards: 0, clean_sheets: 5, rating: 8.9 },
      ];
      return NextResponse.json({ success: true, data: defaultPlayers, source: "default" });
    }

    return NextResponse.json({ success: true, data, source: "supabase" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
