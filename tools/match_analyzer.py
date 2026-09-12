#!/usr/bin/env python3
"""
=============================================================================
TDV BTL Football Cup - Autonomous Match Video Analyzer (xG / xGOT / xA)
=============================================================================
Bu skript 30 deqiqelik futbol matcinin videosunu (YouTube ve ya yerli MP4)
Gemini 2.5 Multimodal API vasitesile avtomatik analiz edir:
  1. Her qol ve zerbe ani (deqiqe:saniye ile)
  2. xG (Gozlenilen Qol) ve xGOT (Cerciveye zerbe keyfiyyeti)
  3. xA (Gozlenilen Assist) ve qapici seyvleri
  4. Komandalarin umumi zerbe, qol ve xG statistikasi
  5. Oyuncularin ferdi performans ve erazi profili
  6. Strukturlasdirilmis JSON fayli ve vizual terminal hesabatı
=============================================================================
"""

import sys
import os
import json
import urllib.request
import urllib.error
import argparse
from datetime import datetime

DEFAULT_API_KEY = os.environ.get("GEMINI_API_KEY", "AQ.Ab8RN6KLWwAGO85GdHBo5seR_zl56xfeQ5Jt0mpdcdXxAzSMlg")
DEFAULT_YOUTUBE_URL = "https://www.youtube.com/watch?v=spKp8pezfPQ"

SYSTEM_PROMPT = """You are a world-class professional football and mini-football video analyst (Opta / StatsBomb / Sofascore expert).
You are analyzing a high-intensity school mini-football match video (TDV-BTL Football Cup, 30 minutes duration).

Your job is to thoroughly watch and analyze the entire video and extract a comprehensive, timestamped match event dataset with advanced metrics:
1. Identify both teams and their kit/jersey colors (e.g. Red vs Black/Dark).
2. Record every Goal scored:
   - Exact timestamp (MM:SS)
   - Scoring team and player description / shirt number
   - Location (penalty box, outside box, close-range rebound, penalty, header)
   - Calculated xG (0.01 to 0.99 based on distance, angle, defensive pressure)
   - Calculated xGOT (0.05 to 0.99 based on ball placement towards corners, power, difficulty for goalkeeper)
   - Assisting player and calculated xA (Expected Assist value)
3. Record all Significant Shots / Attempts:
   - On target vs off target vs blocked
   - Outcome (Goal, Goalkeeper Save, Missed High/Wide, Blocked by defender)
   - Individual xG and xGOT
4. Record Goalkeeper Saves (difficulty, technique, prevented goals).
5. Compile aggregate team statistics:
   - Total Shots
   - Shots on Target
   - Total xG (sum of all shot xGs)
   - Total xGOT (sum of on-target xGOTs)
   - Goalkeeper Saves
   - Final Score verified from video
6. Extract Key Player Highlights & Territory/Role Profiles:
   - Player or identifier (e.g. Red #10, Black Goalkeeper, etc.)
   - Playing style & territory (e.g. Left wing infiltrator, deep lying playmaker, target striker)
   - Estimated match rating (1.0 - 10.0 Sofascore scale)

Output must be STRICT, VALID, RAW JSON matching the following schema. Do NOT include markdown code blocks, backticks, or explanatory text. Just the JSON object.

{
  "match_metadata": {
    "match_title": "10A vs 11H",
    "competition": "TDV BTL Football Cup",
    "video_duration_min": 32,
    "final_score": "5-4",
    "winner": "10A",
    "team_colors": {
      "team_a": {"name": "10A", "jersey_color": "Qırmızı (Red)"},
      "team_b": {"name": "11H", "jersey_color": "Qara (Black)"}
    }
  },
  "team_statistics": {
    "team_a": {
      "name": "10A",
      "goals": 5,
      "total_shots": 16,
      "shots_on_target": 11,
      "total_xg": 3.85,
      "total_xgot": 4.90,
      "gk_saves": 5,
      "possession_dominance_pct": 54
    },
    "team_b": {
      "name": "11H",
      "goals": 4,
      "total_shots": 14,
      "shots_on_target": 9,
      "total_xg": 2.95,
      "total_xgot": 3.75,
      "gk_saves": 6,
      "possession_dominance_pct": 46
    }
  },
  "timeline_events": [
    {
      "timestamp": "03:45",
      "event_type": "goal",
      "team": "10A",
      "player": "Red #7 (Striker)",
      "description": "Powerful low drive from edge of the box into the bottom left corner",
      "location": "box_edge",
      "distance_meters": 11.5,
      "xg": 0.32,
      "xgot": 0.78,
      "xa": 0.32,
      "assister": "Red #10",
      "score_after": "1-0"
    }
  ],
  "player_ratings": [
    {
      "identifier": "Red #10",
      "team": "10A",
      "role": "Playmaker / Midfielder",
      "territory": "Central & attacking third",
      "rating": 8.9,
      "goals": 2,
      "assists": 2,
      "shots": 5,
      "key_passes": 4,
      "total_xg": 1.25,
      "total_xa": 1.10
    }
  ],
  "tactical_analysis": {
    "summary": "High intensity mini-football match with rapid transitions...",
    "key_turning_points": [
      "..."
    ]
  }
}
"""

def analyze_match_video(youtube_url: str, api_key: str, output_file: str = "match_analysis.json") -> dict:
    print(f"[*] TDV BTL Match Analyzer ishe dushdu...")
    print(f"[*] Video: {youtube_url}")
    print(f"[*] Model: gemini-2.5-flash (Multimodal Video Processing)")

    endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"

    payload = {
        "contents": [
            {
                "parts": [
                    {
                        "file_data": {
                            "file_uri": youtube_url
                        }
                    },
                    {
                        "text": SYSTEM_PROMPT
                    }
                ]
            }
        ],
        "generationConfig": {
            "responseMimeType": "application/json",
            "temperature": 0.2
        }
    }

    req = urllib.request.Request(
        endpoint,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )

    print("[*] 30 deqiqelik video Gemini 2.5 modeline gonderildi. Analiz gedir (texminen 30-60 saniye)...")
    start_time = datetime.now()

    try:
        with urllib.request.urlopen(req, timeout=300) as response:
            res_json = json.loads(response.read().decode("utf-8"))
            elapsed = (datetime.now() - start_time).total_seconds()
            print(f"[OK] Analiz tamamlandi! ({elapsed:.1f} saniye)")

            candidates = res_json.get("candidates", [])
            if not candidates:
                raise ValueError("Modelden cavab gelmedi.")

            raw_content = candidates[0]["content"]["parts"][0]["text"].strip()

            if raw_content.startswith("```"):
                raw_content = raw_content.split("```")[1]
                if raw_content.startswith("json"):
                    raw_content = raw_content[4:]
                raw_content = raw_content.strip()

            parsed_data = json.loads(raw_content)

            with open(output_file, "w", encoding="utf-8") as f:
                json.dump(parsed_data, f, ensure_ascii=False, indent=2)

            print(f"[OK] Neticeler saxlanildi: {output_file}\n")
            return parsed_data

    except urllib.error.HTTPError as e:
        err_msg = e.read().decode("utf-8")
        print(f"[!] HTTP Xetasi ({e.code}): {err_msg}", file=sys.stderr)
        raise
    except Exception as e:
        print(f"[!] Xeta bash verdi: {e}", file=sys.stderr)
        raise


def print_dashboard_report(data: dict):
    meta = data.get("match_metadata", {})
    stats = data.get("team_statistics", {})
    events = data.get("timeline_events", [])
    players = data.get("player_ratings", [])

    ta = stats.get("team_a", {})
    tb = stats.get("team_b", {})

    print("=" * 70)
    print(f"      TDV BTL FUTBOL KUBOKU - AVTOMATIK MATCH ANALIZI")
    print(f"         {meta.get('match_title', 'Match')} | Yekun Hesab: {meta.get('final_score', 'N/A')}")
    print("=" * 70)
    print(f"  Qalib: {meta.get('winner', 'N/A')}  |  Video Muddeti: ~{meta.get('video_duration_min', 30)} deqiqe")
    print("-" * 70)
    print(f"  GOSTERICI                      {ta.get('name', 'Komanda A'):<15} {tb.get('name', 'Komanda B'):<15}")
    print("-" * 70)
    print(f"  Qollar:                        {ta.get('goals', 0):<15} {tb.get('goals', 0):<15}")
    print(f"  Umumi Zerbeler:                {ta.get('total_shots', 0):<15} {tb.get('total_shots', 0):<15}")
    print(f"  Qapi Cercivesine Zerbeler:     {ta.get('shots_on_target', 0):<15} {tb.get('shots_on_target', 0):<15}")
    print(f"  Gozlenilen Qollar (xG):        {ta.get('total_xg', 0.0):<15.2f} {tb.get('total_xg', 0.0):<15.2f}")
    print(f"  Zerbe Keyfiyyeti (xGOT):       {ta.get('total_xgot', 0.0):<15.2f} {tb.get('total_xgot', 0.0):<15.2f}")
    print(f"  Qapici Seyvleri:               {ta.get('gk_saves', 0):<15} {tb.get('gk_saves', 0):<15}")
    print(f"  Dominantliq (%):               {ta.get('possession_dominance_pct', 50)}%{'':<12} {tb.get('possession_dominance_pct', 50)}%")
    print("=" * 70)

    print("\n  [TIMELINE] MATCHIN ESAS HADİSELERİ VE QOLLAR (ZAMAN XETTI):")
    print("-" * 70)
    for ev in events:
        icon = "[GOAL!]" if ev.get("event_type") == "goal" else "[SHOT]" if "shot" in ev.get("event_type", "") else "[EVENT]"
        xg_val = f"{ev.get('xg'):.2f}" if ev.get('xg') is not None else "0.00"
        xgot_val = f"{ev.get('xgot'):.2f}" if ev.get('xgot') is not None else "-"
        xa_val = f"{ev.get('xa'):.2f}" if ev.get('xa') is not None else "-"
        print(f"  [{ev.get('timestamp', '00:00')}] {icon} | {ev.get('team', '')} - {ev.get('player', '')}")
        print(f"         xG: {xg_val} | xGOT: {xgot_val} | xA: {xa_val} | Mesafe: ~{ev.get('distance_meters', 'N/A')}m")
        print(f"         Tesvir: {ev.get('description', '')}")
        if ev.get("score_after"):
            print(f"         Hesab: {ev.get('score_after')}")
        print()

    if players:
        print("=" * 70)
        print("  OYUNCULARIN SOFASCORE REYTINQLERI VE PERFORMANSI:")
        print("-" * 70)
        for p in players:
            r = p.get('rating') or 6.0
            print(f"  * {p.get('identifier', '')} ({p.get('team', '')}) - Reytinq: {r:.1f}/10")
            print(f"    Rol/Movqe: {p.get('role', '')} | Erazi: {p.get('territory', '')}")
            xg_p = f"{p.get('total_xg'):.2f}" if p.get('total_xg') is not None else "0.00"
            xa_p = f"{p.get('total_xa'):.2f}" if p.get('total_xa') is not None else "0.00"
            print(f"    Stat: Qol: {p.get('goals', 0)} | Assist: {p.get('assists', 0)} | xG: {xg_p} | xA: {xa_p}")
        print("=" * 70)

    tactical = data.get("tactical_analysis", {})
    if tactical:
        print("\n  [TACTICAL INSIGHTS] TAKTIKI ANALIZ VE ESAS DONUS NOQTELERI:")
        print("-" * 70)
        if tactical.get("summary"):
            print(f"  Xulase: {tactical.get('summary')}\n")
        for tp in tactical.get("key_turning_points", []):
            print(f"  * {tp}")
        print("=" * 70)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="TDV BTL Video Football Analyzer")
    parser.add_argument("--url", default=DEFAULT_YOUTUBE_URL, help="YouTube video URL")
    parser.add_argument("--key", default=DEFAULT_API_KEY, help="Gemini API Key")
    parser.add_argument("--out", default="match_10A_vs_11H_analysis.json", help="Output JSON path")
    args = parser.parse_args()

    data = analyze_match_video(args.url, args.key, args.out)
    print_dashboard_report(data)
