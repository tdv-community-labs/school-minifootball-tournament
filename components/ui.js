// TDV Community Labs - Sports UI Component Suite (Linear / Stripe Grade)
// Standartlaşdırılmış Kart, Düymə, Nişan və Boş Vəziyyət Komponentləri

import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

/**
 * Zərif Status Nişanı (Badge)
 */
export const Badge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700/60',
    primary: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    brand: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    danger: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    info: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20'
  };

  return html`
    <span className=${`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border transition-colors ${variants[variant] || variants.default} ${className}`}>
      ${children}
    </span>
  `;
};

/**
 * 8pt Şəbəkə Standartlı İnteraktiv Düymə (Button)
 */
export const Button = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  icon = null,
  type = 'button',
  title = ''
}) => {
  const sizeClasses = {
    xs: 'px-2.5 py-1 text-[11px] gap-1 rounded-lg',
    sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-xl',
    md: 'px-4 py-2 text-xs gap-2 rounded-xl font-bold',
    lg: 'px-5 py-2.5 text-sm gap-2 rounded-2xl font-black'
  };

  const variantClasses = {
    primary: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm hover:shadow-emerald-500/25 border border-emerald-500/40 active:scale-[0.98]',
    secondary: 'bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700/80 text-zinc-800 dark:text-zinc-200 border border-zinc-200/80 dark:border-white/[0.08] active:scale-[0.98]',
    outline: 'bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 active:scale-[0.98]',
    ghost: 'bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 border border-transparent',
    danger: 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 active:scale-[0.98]'
  };

  return html`
    <button
      type=${type}
      onClick=${onClick}
      disabled=${disabled}
      title=${title}
      className=${`inline-flex items-center justify-center font-bold transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none ${sizeClasses[size] || sizeClasses.md} ${variantClasses[variant] || variantClasses.primary} ${className}`}
    >
      ${icon && html`<i className=${`${icon} text-xs`}></i>`}
      ${children}
    </button>
  `;
};

/**
 * Standart Bento Kart Konteyneri (Card)
 */
export const Card = ({
  children,
  className = '',
  hover = true,
  onClick = null
}) => {
  return html`
    <div
      onClick=${onClick}
      className=${`p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs transition-all duration-200 ${
        hover ? 'hover:-translate-y-0.5 hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700' : ''
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      ${children}
    </div>
  `;
};

/**
 * Boş Məlumat Sahəsi (Empty State)
 */
export const EmptyState = ({
  icon = 'fas fa-futbol',
  title = 'Məlumat Tapılmadı',
  description = 'Bu kateqoriya üzrə hazırda heç bir aktiv qeyd yoxdur.',
  action = null
}) => {
  return html`
    <div className="py-14 px-6 text-center max-w-sm mx-auto flex flex-col items-center justify-center animate-fadeIn">
      <div className="w-14 h-14 rounded-3xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60 flex items-center justify-center text-xl text-zinc-400 dark:text-zinc-500 mb-3.5 shadow-inner">
        <i className=${icon}></i>
      </div>
      <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 mb-1">${title}</h3>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4">${description}</p>
      ${action}
    </div>
  `;
};
