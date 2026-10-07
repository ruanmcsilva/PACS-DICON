import React from 'react';
import { Activity, ShieldCheck, Zap, Monitor, Users, Cpu } from 'lucide-react';
import { useLanguage } from '../../core/context/LanguageContext';

export const StatsSection: React.FC = () => {
  const { t } = useLanguage();

  const specs = [
    {
      value: t('stats.card1.val'),
      label: t('stats.card1.title'),
      desc: t('stats.card1.desc'),
      icon: Zap,
      color: '#00a8ff',
    },
    {
      value: t('stats.card2.val'),
      label: t('stats.card2.title'),
      desc: t('stats.card2.desc'),
      icon: Monitor,
      color: '#38bdf8',
    },
    {
      value: t('stats.card3.val'),
      label: t('stats.card3.title'),
      desc: t('stats.card3.desc'),
      icon: ShieldCheck,
      color: '#10b981',
    },
    {
      value: t('stats.card4.val'),
      label: t('stats.card4.title'),
      desc: t('stats.card4.desc'),
      icon: Activity,
      color: '#06b6d4',
    },
    {
      value: t('stats.card5.val'),
      label: t('stats.card5.title'),
      desc: t('stats.card5.desc'),
      icon: Users,
      color: '#a855f7',
    },
  ];

  return (
    <section className="stats-section">
      <div className="stats-container">
        <div className="section-head text-center">
          <div className="section-pill">
            <Cpu size={14} />
            <span>{t('stats.pill')}</span>
          </div>
          <h2 className="section-title">
            {t('stats.titlePre')}<span className="highlight-cyan">{t('stats.titleHighlight')}</span>
          </h2>
          <p className="section-subtitle">
            {t('stats.subtitle')}
          </p>
        </div>

        <div className="stats-grid">
          {specs.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className="stat-box glass-card">
                <div className="stat-box-icon" style={{ color: item.color, borderColor: `${item.color}33`, background: `${item.color}15` }}>
                  <Icon size={26} />
                </div>
                <div className="stat-box-value" style={{ color: item.color }}>
                  {item.value}
                </div>
                <div className="stat-box-label">{item.label}</div>
                <div className="stat-box-desc">{item.desc}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;

