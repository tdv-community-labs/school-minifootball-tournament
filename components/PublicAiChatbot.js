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
      className="fixed bottom-20 right-3.5 lg:bottom-6 lg:right-6 z-40 font-sans pointer-events-none transition-colors duration-200"
      style=${{ marginBottom: 'max(0px, env(safe-area-inset-bottom, 0px))' }}
    >
      <!-- Floating Action Button (FAB) -->
      ${!isOpen && html`
        <button
          onClick=${() => setIsOpen(true)}
          className="pointer-events-auto group flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-800 dark:hover:bg-zinc-700 px-3.5 py-3 sm:px-4 sm:py-3.5 rounded-full shadow-2xl transition transform hover:scale-105 active:scale-95 border border-zinc-700 dark:border-zinc-600 cursor-pointer"
          title="Turnir AI Köməkçisi"
        >
          <div className="relative">
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping"></span>
            <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full inline-block absolute -top-1 -right-1"></span>
            <i className="fas fa-robot text-base sm:text-lg text-emerald-400"></i>
          </div>
          <span className="text-xs font-black tracking-wide pr-1">Turnir AI</span>
          <i className="fas fa-futbol text-emerald-400 text-xs sm:text-sm group-hover:rotate-45 transition"></i>
        </button>
      `}

      <!-- Chat Window Modal -->
      ${isOpen && html`
        <div className="pointer-events-auto w-[calc(100vw-1.5rem)] sm:w-[380px] max-w-[380px] h-[460px] sm:h-[520px] max-h-[72vh] bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden animate-fadeIn transition-colors duration-200">
          
          <!-- Header -->
          <div className="bg-zinc-950 text-white p-4 flex items-center justify-between border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-zinc-800 flex items-center justify-center text-emerald-400 border border-zinc-700">
                <i className="fas fa-robot text-lg"></i>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-black text-white">TDV BTL Turnir AI</h4>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                </div>
                <p className="text-[10px] text-zinc-400">Canlı Məlumat Köməkçisi (${activeYear})</p>
              </div>
            </div>
            
            <button
              onClick=${() => setIsOpen(false)}
              className="text-zinc-400 hover:text-white transition w-8 h-8 rounded-full flex items-center justify-center hover:bg-zinc-800 cursor-pointer"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>

          <!-- Quick Suggestion Pills -->
          <div className="bg-zinc-50 dark:bg-zinc-950/80 border-b border-zinc-200 dark:border-zinc-800 px-3 py-2 flex items-center gap-1.5 overflow-x-auto text-[10px] transition-colors duration-200">
            <button
              onClick=${(e) => handleSendMessage(e, 'Bu il kimlər liderdir və cədvəldə vəziyyət necədir?')}
              className="bg-white dark:bg-zinc-800 hover:bg-emerald-50 dark:hover:bg-zinc-700 hover:text-emerald-600 dark:hover:text-emerald-400 text-zinc-800 dark:text-zinc-200 font-bold px-2.5 py-1 rounded-xl whitespace-nowrap shadow-2xs border border-zinc-200 dark:border-zinc-700 transition cursor-pointer"
            >
              🏆 Liderlər
            </button>
            <button
              onClick=${(e) => handleSendMessage(e, 'Bombardirlər kimdir və ən çox qolu kim vurub?')}
              className="bg-white dark:bg-zinc-800 hover:bg-emerald-50 dark:hover:bg-zinc-700 hover:text-emerald-600 dark:hover:text-emerald-400 text-zinc-800 dark:text-zinc-200 font-bold px-2.5 py-1 rounded-xl whitespace-nowrap shadow-2xs border border-zinc-200 dark:border-zinc-700 transition cursor-pointer"
            >
              ⚽ Bombardirlər
            </button>
            <button
              onClick=${(e) => handleSendMessage(e, 'Son keçirilən oyunların nəticələri necə olub?')}
              className="bg-white dark:bg-zinc-800 hover:bg-emerald-50 dark:hover:bg-zinc-700 hover:text-emerald-600 dark:hover:text-emerald-400 text-zinc-800 dark:text-zinc-200 font-bold px-2.5 py-1 rounded-xl whitespace-nowrap shadow-2xs border border-zinc-200 dark:border-zinc-700 transition cursor-pointer"
            >
              📅 Son Matçlar
            </button>
          </div>

          <!-- Messages Scroll View -->
          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs bg-zinc-50/50 dark:bg-zinc-950/40 transition-colors duration-200">
            ${messages.map((m, idx) => html`
              <div key=${idx} className=${`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className=${`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-emerald-600 text-white rounded-br-none shadow-xs'
                    : 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-bl-none shadow-2xs whitespace-pre-line'
                }`}>
                  ${m.role === 'model' && html`
                    <div className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 mb-1 flex items-center gap-1">
                      <i className="fas fa-robot text-[10px]"></i> BTL Bot
                    </div>
                  `}
                  ${m.text}
                </div>
              </div>
            `)}

            ${isLoading && html`
              <div className="flex justify-start">
                <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-3 text-xs rounded-bl-none shadow-2xs flex items-center gap-2 text-zinc-700 dark:text-zinc-300 font-bold">
                  <i className="fas fa-spinner fa-spin text-emerald-500"></i>
                  <span>Məlumatlar analiz edilir...</span>
                </div>
              </div>
            `}
            <div ref=${messagesEndRef} />
          </div>

          <!-- Chat Input -->
          <form onSubmit=${handleSendMessage} className="p-3 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-2 transition-colors duration-200">
            <input
              type="text"
              value=${query}
              onChange=${(e) => setQuery(e.target.value)}
              placeholder=${lang === 'en' ? 'Ask a question...' : 'Turnir barədə sual yazın...'}
              className="flex-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs rounded-xl p-2.5 font-medium focus:outline-none focus:border-emerald-500 transition placeholder-zinc-400"
              disabled=${isLoading}
            />
            <button
              type="submit"
              disabled=${isLoading || !query.trim()}
              className="w-9 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center text-xs transition shadow-xs disabled:opacity-40 cursor-pointer"
            >
              <i className="fas fa-paper-plane"></i>
            </button>
          </form>

        </div>
      `}
    </div>
  `;
}
