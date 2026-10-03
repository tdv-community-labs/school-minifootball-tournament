/**
 * ============================================================================
 * FAYL ADI: components/Fanzone.js
 * MƏQSƏDİ: Fanzona - Xəbərlər, Müsahibələr, Səsvermələr və Canlı Lent
 * ============================================================================
 */
import React, { useState } from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

export default function Fanzone({ activeYear }) {
  const [activePollIndex, setActivePollIndex] = useState(null);

  const newsItems = [
    {
      id: 1,
      type: 'breaking',
      title: 'Mövsümün Ən Böyük Transfer Şayiəsi!',
      excerpt: 'TDV BTL turnirində bəzi ulduz oyunçuların növbəti mövsüm üçün rəqib komandalarla gizli danışıqlar apardığı iddia edilir...',
      time: '2 saat əvvəl',
      author: 'İnsayder Cavid',
      image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=800&auto=format&fit=crop'
    },
    {
      id: 2,
      type: 'interview',
      title: 'Eksklüziv: MVP Namizədi ilə Müsahibə',
      excerpt: '"Bizim məqsədimiz ancaq çempionluqdur. Digər komandaların nə etdiyi bizi maraqlandırmır." - Dünənki matçdan sonra qızğın açıqlamalar.',
      time: '5 saat əvvəl',
      author: 'Redaksiya',
      image: 'https://images.unsplash.com/photo-1551280857-2b9bbe5240f5?q=80&w=800&auto=format&fit=crop'
    },
    {
      id: 3,
      type: 'tactics',
      title: 'Taktiki Analiz: 2-1-1 Formasiyasının Çöküşü',
      excerpt: 'Son turlarda bir çox komandanın istifadə etdiyi 2-1-1 sistemi niyə sürətli cinah hücumlarına qarşı aciz qalır? Ekspert rəyi.',
      time: '1 gün əvvəl',
      author: 'Taktika Ustası',
      image: 'https://images.unsplash.com/photo-1508344928928-7165b67de128?q=80&w=800&auto=format&fit=crop'
    }
  ];

  const polls = [
    {
      id: 1,
      question: 'Sizcə bu mövsümün Çempionu kim olacaq?',
      options: [
        { text: '11 A', votes: 45 },
        { text: '11 H', votes: 32 },
        { text: '10 A', votes: 18 },
        { text: 'Digər', votes: 5 }
      ]
    },
    {
      id: 2,
      question: 'Turnirin ən yaxşı Qapıçısı kimdir?',
      options: [
        { text: 'Emin (11 H)', votes: 60 },
        { text: 'Rauf (10 B)', votes: 25 },
        { text: 'Kərim (11 A)', votes: 15 }
      ]
    }
  ];

  return html`
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn pb-20">
      
      <!-- Fanzone Header -->
      <div className="relative bg-gradient-to-br from-indigo-950 via-[#161a25] to-slate-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-10 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-black uppercase tracking-wider mb-4">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            Canlı Fanzona
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight drop-shadow-lg mb-2">Mətbuat & Azarkeşlər</h2>
          <p className="text-slate-400 max-w-xl text-sm sm:text-base">Turnir ətrafında baş verən ən son hadisələr, şayiələr, eksklüziv müsahibələr və səsvermələr. Nəbzi burada tutun!</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- LEFT COLUMN: News Feed -->
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xl font-black text-white flex items-center gap-2 border-b border-white/10 pb-3">
            <i className="far fa-newspaper text-emerald-400"></i> Son Xəbərlər
          </h3>
          
          <div className="space-y-4">
            ${newsItems.map((news) => html`
              <article key=${news.id} className="group bg-[#1a1f2e] border border-white/5 rounded-2xl overflow-hidden shadow-lg hover:border-emerald-500/30 transition-all cursor-pointer flex flex-col sm:flex-row">
                <div className="sm:w-1/3 h-48 sm:h-auto overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10 sm:hidden"></div>
                  <img src=${news.image} alt=${news.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ${news.type === 'breaking' && html`
                    <span className="absolute top-3 left-3 z-20 bg-red-600 text-white text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider shadow-lg">Son Dəqiqə</span>
                  `}
                </div>
                <div className="p-5 sm:p-6 sm:w-2/3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                      <span className="flex items-center gap-1.5"><i className="far fa-clock"></i> ${news.time}</span>
                      <span>•</span>
                      <span className="text-emerald-400">${news.author}</span>
                    </div>
                    <h4 className="text-lg sm:text-xl font-black text-white leading-tight mb-2 group-hover:text-emerald-400 transition-colors">${news.title}</h4>
                    <p className="text-sm text-slate-400 line-clamp-2">${news.excerpt}</p>
                  </div>
                  <div className="mt-4">
                    <span className="text-xs font-black text-indigo-400 group-hover:text-indigo-300 flex items-center gap-1.5">
                      Ətraflı Oxu <i className="fas fa-arrow-right text-[10px] group-hover:translate-x-1 transition-transform"></i>
                    </span>
                  </div>
                </div>
              </article>
            `)}
          </div>
        </div>

        <!-- RIGHT COLUMN: Polls & Media -->
        <div className="space-y-6">
          <h3 className="text-xl font-black text-white flex items-center gap-2 border-b border-white/10 pb-3">
            <i className="fas fa-poll text-amber-400"></i> Səsvermə (Polls)
          </h3>

          <div className="space-y-4">
            ${polls.map((poll, idx) => {
              const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);
              const hasVoted = activePollIndex === idx;

              return html`
                <div key=${poll.id} className="bg-[#1a1f2e] border border-white/5 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-[40px] pointer-events-none"></div>
                  
                  <h4 className="text-sm font-black text-white mb-4 leading-snug">${poll.question}</h4>
                  
                  <div className="space-y-2.5">
                    ${poll.options.map((opt, i) => {
                      const percent = Math.round((opt.votes / totalVotes) * 100);
                      return html`
                        <div 
                          key=${i}
                          onClick=${() => setActivePollIndex(idx)}
                          className=${`relative p-3 rounded-xl border cursor-pointer transition-all overflow-hidden ${hasVoted ? 'border-white/10' : 'border-white/5 hover:border-amber-500/40 bg-white/5'}`}
                        >
                          ${hasVoted && html`
                            <div className="absolute left-0 top-0 bottom-0 bg-amber-500/20 transition-all duration-1000" style=${{ width: `${percent}%` }}></div>
                          `}
                          <div className="relative z-10 flex justify-between items-center text-xs font-bold text-slate-200">
                            <span>${opt.text}</span>
                            ${hasVoted && html`<span className="text-amber-400">${percent}%</span>`}
                          </div>
                        </div>
                      `;
                    })}
                  </div>
                  <div className="mt-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">
                    Cəmi ${totalVotes} Səs
                  </div>
                </div>
              `;
            })}
          </div>

          <!-- Video Highlights Promo -->
          <div className="mt-8 bg-gradient-to-tr from-rose-950 to-slate-900 border border-rose-500/30 rounded-2xl p-5 shadow-xl relative overflow-hidden group cursor-pointer">
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors z-10"></div>
            <img src="https://images.unsplash.com/photo-1518605368461-1ee18751db5b?q=80&w=800&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-700" />
            <div className="relative z-20 flex flex-col items-center justify-center text-center py-6">
              <div className="w-12 h-12 bg-rose-600 rounded-full flex items-center justify-center text-white mb-3 shadow-[0_0_20px_rgba(225,29,72,0.6)] group-hover:scale-110 transition-transform">
                <i className="fas fa-play ml-1 text-lg"></i>
              </div>
              <h4 className="text-white font-black uppercase tracking-wide">Həftənin Qolları</h4>
              <p className="text-[10px] text-rose-200 font-bold mt-1 uppercase tracking-widest">YouTube İcmalı</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  `;
}
