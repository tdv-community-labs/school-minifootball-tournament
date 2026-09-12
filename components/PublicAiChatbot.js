/**
 * ============================================================================
 * FAYL ADI: components/PublicAiChatbot.js
 * MƏQSƏDİ: Sayt Ziyarətçiləri Üçün Üzən Süni İntellekt Çatbotu
 * 
 * BU KOMPONENTİN VƏZİFƏLƏRİ:
 *   1. Saytın sağ aşağı küncündə həmişə əlçatan interaktiv düymə və çat pəncərəsi.
 *   2. Ziyarətçilərin istənilən dildə (AZ, EN, RU, TR) suallarına Google Gemini AI ilə cavab.
 *   3. Cari mövsüm və kateqoriya kontekstini dərhal nəzərə alma.
 *   4. Hazır sürətli sual düymələri ("Bombardir kimdir?", "Lider kimdir?").
 * ============================================================================
 */
import React, { useState, useEffect, useRef } from 'react';
import htm from 'htm';
import { db } from '../services/database.js?v=20260910_0080';
import { askPublicChatbot } from '../services/geminiAssistant.js?v=20260910_0080';

const html = htm.bind(React.createElement);

export default function PublicAiChatbot({ activeYear = '2022-2023', activeDivision = '10-11', lang = 'az' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'model',
      text: lang === 'en' 
        ? 'Hello! I am TDV BTL Tournament AI Assistant. Ask me anything about standings, top scorers, or match schedules!' 
        : 'Salam! Mən TDV BTL Mini-Futbol Turnirinin AI köməkçisiyəm. Qrup cədvəli, bombardirlər və ya oyunlar barədə istənilən sualı verə bilərsiniz! ⚽'
    }
  ]);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e, directText = null) => {
    if (e) e.preventDefault();
    const textToSend = (directText || query).trim();
    if (!textToSend || isLoading) return;

    setQuery('');
    const newMsgs = [...messages, { role: 'user', text: textToSend }];
    setMessages(newMsgs);
    setIsLoading(true);

    try {
      // Gather real-time context from database
      const [allPlayers, allMatches, allClasses] = await Promise.all([
        db.getPlayers(activeYear),
        db.getMatches(activeYear),
        db.getClasses(activeYear)
      ]);

      // Calculate top 5 scorers
      const topScorers = [...allPlayers]
        .sort((a, b) => (b.goals || 0) - (a.goals || 0))
        .slice(0, 8)
        .map(p => ({ name: p.name, class: p.class, goals: p.goals || 0, assists: p.assists || 0 }));

      // Recent matches
      const recentMatches = [...allMatches]
        .slice(0, 6)
        .map(m => ({ teamA: m.teamA, teamB: m.teamB, scoreA: m.scoreA, scoreB: m.scoreB, stage: m.stage }));

      const contextData = {
        activeYear,
        activeDivision,
        totalPlayers: allPlayers.length,
        totalClasses: allClasses.length,
        totalMatches: allMatches.length,
        topScorers,
        recentMatches
      };

      const reply = await askPublicChatbot(textToSend, contextData);
      setMessages([...newMsgs, { role: 'model', text: reply }]);
    } catch (err) {
      console.error('Chatbot error:', err);
      setMessages([
        ...newMsgs,
        {
          role: 'model',
          text: lang === 'en' 
            ? 'Sorry, AI service is busy. Please try again in a moment.' 
            : 'Bağışlayın, hazırda AI xidməti məşğuldur. Zəhmət olmasa bir az sonra yenidən cəhd edin.'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return html`
    <div 
      className="fixed bottom-20 right-3.5 lg:bottom-6 lg:right-6 z-40 font-sans pointer-events-none"
      style=${{ marginBottom: 'max(0px, env(safe-area-inset-bottom, 0px))' }}
    >
      <!-- Floating Action Button (FAB) -->
      ${!isOpen && html`
        <button
          onClick=${() => setIsOpen(true)}
          className="pointer-events-auto group flex items-center gap-2 bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 hover:from-purple-800 hover:to-indigo-800 text-white px-3.5 py-3 sm:px-4 sm:py-3.5 rounded-full shadow-2xl hover:shadow-purple-500/25 transition transform hover:scale-105 active:scale-95 border border-purple-700/50"
          title="Turnir AI Köməkçisi"
        >
          <div className="relative">
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping"></span>
            <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full inline-block absolute -top-1 -right-1"></span>
            <i className="fas fa-robot text-base sm:text-lg text-purple-200"></i>
          </div>
          <span className="text-xs font-black tracking-wide pr-1">Turnir AI</span>
          <i className="fas fa-futbol text-emerald-400 text-xs sm:text-sm group-hover:rotate-45 transition"></i>
        </button>
      `}

      <!-- Chat Window Modal -->
      ${isOpen && html`
        <div className="pointer-events-auto w-[calc(100vw-1.5rem)] sm:w-[380px] max-w-[380px] h-[460px] sm:h-[520px] max-h-[72vh] bg-white rounded-3xl shadow-2xl border border-purple-100 flex flex-col overflow-hidden animate-fadeIn">
          
          <!-- Header -->
          <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-900 text-white p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-purple-300 backdrop-blur-sm border border-white/10">
                <i className="fas fa-robot text-lg"></i>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-black">TDV BTL Turnir AI</h4>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                </div>
                <p className="text-[10px] text-purple-200">Canlı Məlumat Köməkçisi (${activeYear})</p>
              </div>
            </div>
            
            <button
              onClick=${() => setIsOpen(false)}
              className="text-purple-300 hover:text-white transition w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>

          <!-- Quick Suggestion Pills -->
          <div className="bg-purple-50/70 border-b border-purple-100 px-3 py-2 flex items-center gap-1.5 overflow-x-auto text-[10px]">
            <button
              onClick=${(e) => handleSendMessage(e, 'Bu il kimlər liderdir və cədvəldə vəziyyət necədir?')}
              className="bg-white hover:bg-purple-100 text-purple-950 font-bold px-2.5 py-1 rounded-xl whitespace-nowrap shadow-2xs border border-purple-100 transition"
            >
              🏆 Liderlər
            </button>
            <button
              onClick=${(e) => handleSendMessage(e, 'Bombardirlər kimdir və ən çox qolu kim vurub?')}
              className="bg-white hover:bg-purple-100 text-purple-950 font-bold px-2.5 py-1 rounded-xl whitespace-nowrap shadow-2xs border border-purple-100 transition"
            >
              ⚽ Bombardirlər
            </button>
            <button
              onClick=${(e) => handleSendMessage(e, 'Son keçirilən oyunların nəticələri necə olub?')}
              className="bg-white hover:bg-purple-100 text-purple-950 font-bold px-2.5 py-1 rounded-xl whitespace-nowrap shadow-2xs border border-purple-100 transition"
            >
              📅 Son Matçlar
            </button>
          </div>

          <!-- Messages Scroll View -->
          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs bg-slate-50/50">
            ${messages.map((m, idx) => html`
              <div key=${idx} className=${`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className=${`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-purple-950 text-white rounded-br-none shadow-sm'
                    : 'bg-white border border-gray-100 text-gray-800 rounded-bl-none shadow-xs whitespace-pre-line'
                }`}>
                  ${m.role === 'model' && html`
                    <div className="text-[9px] font-black uppercase text-purple-700 mb-1 flex items-center gap-1">
                      <i className="fas fa-robot text-[10px]"></i> BTL Bot
                    </div>
                  `}
                  ${m.text}
                </div>
              </div>
            `)}

            ${isLoading && html`
              <div className="flex justify-start">
                <div className="bg-white border border-gray-100 rounded-2xl p-3 text-xs rounded-bl-none shadow-xs flex items-center gap-2 text-purple-900 font-bold">
                  <i className="fas fa-spinner fa-spin text-purple-600"></i>
                  <span>Məlumatlar analiz edilir...</span>
                </div>
              </div>
            `}
            <div ref=${messagesEndRef} />
          </div>

          <!-- Chat Input -->
          <form onSubmit=${handleSendMessage} className="p-3 bg-white border-t border-gray-100 flex items-center gap-2">
            <input
              type="text"
              value=${query}
              onChange=${(e) => setQuery(e.target.value)}
              placeholder=${lang === 'en' ? 'Ask a question...' : 'Turnir barədə sual yazın...'}
              className="flex-1 bg-gray-50 border border-gray-200 text-xs rounded-xl p-2.5 font-medium focus:outline-none focus:border-purple-900 transition"
              disabled=${isLoading}
            />
            <button
              type="submit"
              disabled=${isLoading || !query.trim()}
              className="w-9 h-9 rounded-xl bg-purple-950 hover:bg-purple-900 text-white flex items-center justify-center text-xs transition shadow-sm disabled:opacity-40"
            >
              <i className="fas fa-paper-plane"></i>
            </button>
          </form>

        </div>
      `}
    </div>
  `;
}
