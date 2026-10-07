import React, { useState } from 'react';
import { Calculator, DollarSign, TrendingUp, Sparkles, ArrowRight, Printer, Server, Clock } from 'lucide-react';
import { useLanguage } from '../../core/context/LanguageContext';

interface RoiCalculatorSectionProps {
  onOpenDemo?: () => void;
}

export const RoiCalculatorSection: React.FC<RoiCalculatorSectionProps> = ({ onOpenDemo }) => {
  const { t } = useLanguage();
  const [examVolume, setExamVolume] = useState<number>(1500);

  // Cálculo de economia estimada
  // Média de R$ 3,80 por exame em películas, papel especial, envelopes e impressoras
  const filmSavingMonthly = Math.round(examVolume * 3.8);
  // Economia mensal em manutenção de servidor local, nobreaks, ar-condicionado e TI
  const serverSavingMonthly = examVolume < 1000 ? 1500 : examVolume < 3000 ? 2800 : 4200;
  // Total mensal e anual
  const totalMonthlySaving = filmSavingMonthly + serverSavingMonthly;
  const totalAnnualSaving = totalMonthlySaving * 12;

  // Formatar para moeda brasileira (R$)
  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  };

  return (
    <section id="calculadora" className="roi-section">
      <div className="roi-container">
        <div className="section-head text-center">
          <div className="section-pill">
            <Calculator size={14} />
            <span>{t('roi.pill')}</span>
          </div>
          <h2 className="section-title">
            {t('roi.titlePre')}<span className="highlight-emerald">{t('roi.titleHighlight')}</span>
          </h2>
          <p className="section-subtitle">
            {t('roi.subtitle')}
          </p>
        </div>

        <div className="calculator-box glass-card">
          <div className="calc-controls">
            <div className="slider-label-row">
              <span className="slider-title">{t('roi.sliderQuestion')}</span>
              <span className="slider-value-display">
                <strong>{examVolume.toLocaleString('pt-BR')}</strong> {t('roi.examUnit')}
              </span>
            </div>

            <div className="slider-container">
              <input
                type="range"
                min="200"
                max="10000"
                step="100"
                value={examVolume}
                onChange={(e) => setExamVolume(Number(e.target.value))}
                className="custom-range-slider"
              />
              <div className="slider-marks">
                <span>200 exames</span>
                <span>2.500 exames</span>
                <span>5.000 exames</span>
                <span>10.000+ exames</span>
              </div>
            </div>

            {/* Breakdown de onde vem a economia */}
            <div className="calc-breakdown-grid">
              <div className="breakdown-card">
                <div className="breakdown-icon text-cyan">
                  <Printer size={22} />
                </div>
                <div className="breakdown-info">
                  <span className="breakdown-label">Economia em Películas & Papel</span>
                  <span className="breakdown-val">{formatCurrency(filmSavingMonthly)} / mês</span>
                  <span className="breakdown-desc">Fim do custo de filmes radiológicos e sacolas</span>
                </div>
              </div>

              <div className="breakdown-card">
                <div className="breakdown-icon text-purple">
                  <Server size={22} />
                </div>
                <div className="breakdown-info">
                  <span className="breakdown-label">Economia em Hardware & TI</span>
                  <span className="breakdown-val">{formatCurrency(serverSavingMonthly)} / mês</span>
                  <span className="breakdown-desc">Zero nobreaks, ar-condicionado 24h e técnicos</span>
                </div>
              </div>

              <div className="breakdown-card">
                <div className="breakdown-icon text-amber">
                  <Clock size={22} />
                </div>
                <div className="breakdown-info">
                  <span className="breakdown-label">Ganho de Produtividade</span>
                  <span className="breakdown-val text-amber">+35% Agilidade</span>
                  <span className="breakdown-desc">Laudos rápidos por voz e templates inteligentes</span>
                </div>
              </div>
            </div>
          </div>

          {/* Resultado Destaque */}
          <div className="calc-result-panel">
            <div className="result-badge">
              <Sparkles size={16} />
              <span>Economia Estimada Total</span>
            </div>

            <div className="annual-amount">
              <span className="currency-prefix">R$</span>
              <span className="amount-number">{totalAnnualSaving.toLocaleString('pt-BR')}</span>
              <span className="amount-period">/ ano</span>
            </div>

            <p className="monthly-equivalent">
              Equivalente a <strong>{formatCurrency(totalMonthlySaving)}</strong> poupados todos os meses no seu caixa.
            </p>

            <button className="btn-calc-cta" onClick={onOpenDemo}>
              <span>Quero Essa Economia na Minha Clínica</span>
              <ArrowRight size={18} />
            </button>

            <div className="calc-guarantee">
              ✓ Implantação rápida em menos de 24 horas • Sem taxa de cancelamento
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RoiCalculatorSection;
