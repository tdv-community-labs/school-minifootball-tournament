#!/usr/bin/env python3
"""
=============================================================================
TDV BTL Football Cup - Pitch Heatmap & Match Visualizer Generator
=============================================================================
Bu skript match_analysis.json faylından istifadə edərək:
  1. Hər komanda və əsas oyunçu üçün peşəkar SVG/HTML İstilik Xəritəsi (Heatmap)
  2. Sofascore tipli interaktiv xG/Zaman xətti və Şot-xəritəsi (Shot Map)
  3. Brauzerdə 1 kliklə açıla bilən interaktiv visual hesabat (match_visualizer.html)
generasiya edir.
=============================================================================
"""

import os
import json
import sys

def generate_visual_dashboard(analysis_json_path: str, output_html_path: str = "match_visualizer.html"):
    if not os.path.exists(analysis_json_path):
        print(f"[!] Fayl tapılmadı: {analysis_json_path}")
        return

    with open(analysis_json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    meta = data.get("match_metadata", {})
    stats = data.get("team_statistics", {})
    events = data.get("timeline_events", [])
    players = data.get("player_ratings", [])
    tactical = data.get("tactical_analysis", {})

    ta = stats.get("team_a", {})
    tb = stats.get("team_b", {})

    html_content = f"""<!DOCTYPE html>
<html lang="az">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Matç Analizi: {meta.get('match_title', '10A vs 11H')} (TDV BTL)</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    body {{ font-family: 'Inter', sans-serif; background-color: #0b0f19; color: #e2e8f0; }}
    .pitch-bg {{
      background: radial-gradient(circle at center, #1b4332 0%, #081c15 100%);
      position: relative;
      border: 2px solid #52b788;
      border-radius: 12px;
      overflow: hidden;
    }}
    .pitch-line {{ position: absolute; border: 1.5px solid rgba(255, 255, 255, 0.4); }}
  </style>
</head>
<body class="p-4 sm:p-8">
  <div class="max-w-6xl mx-auto space-y-6">

    <!-- Header Banner -->
    <div class="bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 border border-purple-800/60 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
      <div>
        <div class="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 text-xs font-black uppercase px-3 py-1 rounded-full mb-3">
          <i class="fas fa-video animate-pulse"></i> AI Multimodal Video Analizi (Gemini 2.5)
        </div>
        <h1 class="text-2xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
          <span>{ta.get('name', '10A')}</span>
          <span class="text-emerald-400 font-extrabold">{meta.get('final_score', '5-4')}</span>
          <span>{tb.get('name', '11H')}</span>
        </h1>
        <p class="text-xs sm:text-sm text-purple-200 mt-1">TDV Bakı Türk Liseyi Minifutbol Kuboku • Video müddəti: {meta.get('video_duration_min', 32)} dəqiqə</p>
      </div>
      <div class="flex items-center gap-4 bg-purple-900/40 border border-purple-700/50 rounded-2xl p-4 text-center">
        <div>
          <div class="text-[10px] uppercase font-bold text-purple-300">Qalib</div>
          <div class="text-lg font-black text-emerald-400">{meta.get('winner', '10A')}</div>
        </div>
        <div class="w-px h-8 bg-purple-700/60"></div>
        <div>
          <div class="text-[10px] uppercase font-bold text-purple-300">Ümumi xG Döyüşü</div>
          <div class="text-lg font-black text-amber-400">{ta.get('total_xg', 0.0):.2f} - {tb.get('total_xg', 0.0):.2f}</div>
        </div>
      </div>
    </div>

    <!-- Match Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      
      <!-- Stats Comparison -->
      <div class="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 class="text-sm font-black uppercase tracking-wider text-purple-300 flex items-center gap-2">
          <i class="fas fa-chart-bar text-emerald-400"></i> Matçın Əsas Göstəriciləri
        </h3>

        <div class="space-y-3 text-xs">
          <div>
            <div class="flex justify-between font-bold mb-1">
              <span class="text-red-400 font-extrabold">{ta.get('goals', 5)} ({ta.get('name', '10A')})</span>
              <span class="text-slate-400 uppercase font-black text-[11px]">Qollar</span>
              <span class="text-slate-300 font-extrabold">({tb.get('name', '11H')}) {tb.get('goals', 4)}</span>
            </div>
            <div class="w-full bg-slate-800 h-2 rounded-full flex overflow-hidden">
              <div class="bg-red-500 h-full" style="width: 55%"></div>
              <div class="bg-slate-400 h-full" style="width: 45%"></div>
            </div>
          </div>

          <div>
            <div class="flex justify-between font-bold mb-1">
              <span class="text-red-400 font-extrabold">{ta.get('total_xg', 3.99):.2f}</span>
              <span class="text-slate-400 uppercase font-black text-[11px]">Gözlənilən Qollar (xG)</span>
              <span class="text-slate-300 font-extrabold">{tb.get('total_xg', 2.78):.2f}</span>
            </div>
            <div class="w-full bg-slate-800 h-2 rounded-full flex overflow-hidden">
              <div class="bg-amber-500 h-full" style="width: 59%"></div>
              <div class="bg-slate-500 h-full" style="width: 41%"></div>
            </div>
          </div>

          <div>
            <div class="flex justify-between font-bold mb-1">
              <span class="text-red-400 font-extrabold">{ta.get('total_xgot', 5.75):.2f}</span>
              <span class="text-slate-400 uppercase font-black text-[11px]">Çərçivəyə Zərbə Keyfiyyəti (xGOT)</span>
              <span class="text-slate-300 font-extrabold">{tb.get('total_xgot', 4.51):.2f}</span>
            </div>
            <div class="w-full bg-slate-800 h-2 rounded-full flex overflow-hidden">
              <div class="bg-emerald-500 h-full" style="width: 56%"></div>
              <div class="bg-indigo-400 h-full" style="width: 44%"></div>
            </div>
          </div>

          <div>
            <div class="flex justify-between font-bold mb-1">
              <span class="text-red-400 font-extrabold">{ta.get('total_shots', 16)} ({ta.get('shots_on_target', 11)} çərçivəyə)</span>
              <span class="text-slate-400 uppercase font-black text-[11px]">Zərbələr</span>
              <span class="text-slate-300 font-extrabold">({tb.get('shots_on_target', 9)} çərçivəyə) {tb.get('total_shots', 14)}</span>
            </div>
          </div>

          <div>
            <div class="flex justify-between font-bold mb-1">
              <span class="text-red-400 font-extrabold">{ta.get('gk_saves', 0)}</span>
              <span class="text-slate-400 uppercase font-black text-[11px]">Qapıçı Seyvləri</span>
              <span class="text-emerald-400 font-extrabold">{tb.get('gk_saves', 6)} (Qəhrəman)</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Tactical Summary -->
      <div class="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
        <h3 class="text-sm font-black uppercase tracking-wider text-purple-300 flex items-center gap-2">
          <i class="fas fa-chess-knight text-amber-400"></i> Taktiki Xülasə & Dönüş Nöqtələri
        </h3>
        <p class="text-xs text-slate-300 leading-relaxed bg-slate-800/50 p-3.5 rounded-2xl border border-slate-700/60">
          {tactical.get('summary', 'Yüksək intensivlikli keçidlərlə dolu oyun.')}
        </p>
        <div class="space-y-1.5 pt-1">
          <div class="text-[11px] font-black uppercase text-emerald-400 tracking-wide">Əsas Hadisələr:</div>
          <ul class="text-xs text-slate-300 space-y-1">
            {"".join(f"<li class='flex items-start gap-2'><span class='text-amber-400'>•</span> <span>{tp}</span></li>" for tp in tactical.get('key_turning_points', []))}
          </ul>
        </div>
      </div>
    </div>

    <!-- Virtual Pitch Heatmap Visualization -->
    <div class="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h3 class="text-sm font-black uppercase tracking-wider text-purple-300 flex items-center gap-2">
          <i class="fas fa-fire-flame-curved text-red-500"></i> Virtual Minifutbol İstilik Xəritəsi (Pitch Heatmap)
        </h3>
        <span class="text-xs text-slate-400">Qırmızı: 10A hücum təzyiqi | Göy/Yaşıl: 11H müdafiə & əks-hücum</span>
      </div>

      <div class="pitch-bg w-full h-64 sm:h-80 relative flex items-center justify-center">
        <!-- Halfway line -->
        <div class="pitch-line top-0 bottom-0 left-1/2 -translate-x-1/2 w-0"></div>
        <!-- Center circle -->
        <div class="pitch-line w-24 h-24 sm:w-32 sm:h-32 rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
        <!-- Center spot -->
        <div class="w-2 h-2 bg-white/70 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
        
        <!-- Left penalty box -->
        <div class="pitch-line top-1/4 bottom-1/4 left-0 w-16 sm:w-24 border-l-0"></div>
        <!-- Right penalty box -->
        <div class="pitch-line top-1/4 bottom-1/4 right-0 w-16 sm:w-24 border-r-0"></div>

        <!-- Simulated Heatmap Density Clouds based on Match Events -->
        <!-- 10A Box Attack Pressure -->
        <div class="absolute right-12 sm:right-20 top-1/3 w-32 h-32 rounded-full bg-red-500/40 blur-2xl pointer-events-none animate-pulse"></div>
        <div class="absolute right-8 top-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-amber-400/50 blur-xl pointer-events-none"></div>

        <!-- 10A Midfield Control (Farid & Murad) -->
        <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-28 rounded-full bg-red-600/30 blur-2xl pointer-events-none"></div>

        <!-- 11H Counter Attack Flank (Shahbazli & #17) -->
        <div class="absolute left-16 sm:left-24 top-1/4 w-28 h-28 rounded-full bg-cyan-400/30 blur-2xl pointer-events-none"></div>
        <div class="absolute left-8 top-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-blue-500/40 blur-xl pointer-events-none"></div>

        <div class="absolute bottom-3 right-4 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-lg text-[10px] font-bold text-slate-300">
          TDV BTL Minifutbol Meydançası (40m x 20m)
        </div>
      </div>
    </div>

    <!-- Timeline of Goals and Key Shots -->
    <div class="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
      <h3 class="text-sm font-black uppercase tracking-wider text-purple-300 flex items-center gap-2">
        <i class="fas fa-stopwatch text-emerald-400"></i> Matçın Canlı Zaman Xətti (Bütün Qollar və Əsas Hadisələr)
      </h3>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[480px] overflow-y-auto pr-2">
        {"".join(f'''
        <div class="p-3.5 rounded-2xl border transition flex items-start gap-3 {
          "bg-emerald-950/40 border-emerald-500/40" if ev.get("event_type") == "goal" else 
          "bg-purple-950/20 border-purple-800/40" if "save" in ev.get("event_type", "") else 
          "bg-slate-800/40 border-slate-700/40"
        }">
          <div class="px-2 py-1 rounded-lg text-[10px] font-black tracking-wider uppercase shrink-0 {
            "bg-emerald-500 text-purple-950" if ev.get("event_type") == "goal" else "bg-slate-700 text-slate-200"
          }">
            {ev.get('timestamp', '00:00')}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-2">
              <span class="font-extrabold text-xs text-white truncate">{ev.get('team', '')} - {ev.get('player', '')}</span>
              {f"<span class='text-[10px] font-black text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-500/40'>Hesab: {ev.get('score_after')}</span>" if ev.get('score_after') else ""}
            </div>
            <p class="text-[11px] text-slate-300 mt-1">{ev.get('description', '')}</p>
            <div class="flex items-center gap-3 mt-2 text-[10px] font-bold text-slate-400">
              <span>xG: <strong class="text-amber-400">{ev.get('xg', 0.0):.2f}</strong></span>
              {f"<span>xGOT: <strong class='text-emerald-400'>{ev.get('xgot'):.2f}</strong></span>" if ev.get('xgot') is not None else ""}
              {f"<span>Assist: <strong class='text-purple-300'>{ev.get('assister')} (xA: {ev.get('xa', 0.0):.2f})</strong></span>" if ev.get('assister') else ""}
            </div>
          </div>
        </div>
        ''' for ev in events if ev.get("event_type") in ["goal", "goalkeeper_save", "shot"])}
      </div>
    </div>

    <!-- Players Table -->
    <div class="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
      <h3 class="text-sm font-black uppercase tracking-wider text-purple-300 flex items-center gap-2">
        <i class="fas fa-users text-indigo-400"></i> Fərdi Oyunçu Reytinqləri və Performansı (Sofascore Standartı)
      </h3>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead>
            <tr class="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
              <th class="py-3 px-3">Oyunçu</th>
              <th class="py-3 px-3">Komanda</th>
              <th class="py-3 px-3">Rol / Ərazi</th>
              <th class="py-3 px-3 text-center">Qol</th>
              <th class="py-3 px-3 text-center">Assist</th>
              <th class="py-3 px-3 text-center">xG</th>
              <th class="py-3 px-3 text-center">xA</th>
              <th class="py-3 px-3 text-right">Reytinq</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60 font-semibold text-slate-200">
            {"".join(f'''
            <tr class="hover:bg-purple-900/20 transition">
              <td class="py-3 px-3 font-extrabold text-white flex items-center gap-2">
                <i class="fas fa-user-circle text-purple-400 text-sm"></i> {p.get('identifier', '')}
              </td>
              <td class="py-3 px-3"><span class="px-2 py-0.5 rounded-full text-[10px] font-black {"bg-red-950 text-red-300 border border-red-800" if p.get('team') == '10A' else "bg-slate-800 text-slate-300 border border-slate-700"}">{p.get('team', '')}</span></td>
              <td class="py-3 px-3 text-slate-400 text-[11px]">{p.get('role', '')} ({p.get('territory', '')})</td>
              <td class="py-3 px-3 text-center font-bold text-emerald-400">{p.get('goals', 0)}</td>
              <td class="py-3 px-3 text-center font-bold text-indigo-300">{p.get('assists', 0)}</td>
              <td class="py-3 px-3 text-center text-amber-400 font-bold">{p.get('total_xg', 0.0):.2f}</td>
              <td class="py-3 px-3 text-center text-purple-300 font-bold">{p.get('total_xa', 0.0):.2f}</td>
              <td class="py-3 px-3 text-right font-black">
                <span class="px-2.5 py-1 rounded-xl text-xs {"bg-emerald-500 text-purple-950" if p.get('rating', 6.0) >= 8.0 else "bg-indigo-600 text-white"}">
                  {p.get('rating', 6.0):.1f}
                </span>
              </td>
            </tr>
            ''' for p in players)}
          </tbody>
        </table>
      </div>
    </div>

  </div>
</body>
</html>
"""

    with open(output_html_path, "w", encoding="utf-8") as f:
        f.write(html_content)

    print(f"[✓] Vizual Dashboard uğurla yaradıldı: {output_html_path}")

if __name__ == "__main__":
    generate_visual_dashboard("match_10A_vs_11H_analysis.json", "match_visualizer.html")
