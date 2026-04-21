import React, { useState } from 'react';
import { RARITIES } from '../utils/cards';
import { useT } from '../i18n';

const LS_KEY = 'oscars_whats_new_v3_seen';

export default function WhatsNewAnnouncement({ onGoToBattle, onPlayDaily }) {
  const { t } = useT();
  const [visible, setVisible] = useState(() => !localStorage.getItem(LS_KEY));

  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem(LS_KEY, 'true');
    // Also mark the individual announcements as seen so they don't show separately
    localStorage.setItem('oscars_cards_announcement_seen', 'true');
    localStorage.setItem('oscars_daily_announcement_seen', 'true');
    setVisible(false);
  };

  return (
    <div className="wn-overlay" onClick={(e) => { if (e.target === e.currentTarget) dismiss(); }}>
      <div className="wn-modal">
        <div className="wn-glow" />
        <button className="wn-close" onClick={dismiss}>✕</button>

        <div className="wn-badge">{t('whatsNew.badge')}</div>
        <h2 className="wn-title">{t('whatsNew.title')}</h2>

        {/* Canon Refresh + 5-tier System */}
        <div className="wn-section">
          <div className="wn-section-header">
            <span className="wn-section-icon">✦</span>
            <div>
              <div className="wn-section-title">{t('whatsNew.canonHeading')}</div>
              <div className="wn-section-sub">{t('whatsNew.canonSub')}</div>
            </div>
          </div>
          <div className="wn-card-row" style={{ justifyContent: 'center', gap: 14 }}>
            <span className="tier-pips tier-5" style={{ padding: '5px 10px' }}>
              {Array.from({ length: 5 }, (_, i) => <span key={i} className="tier-pip filled" />)}
              <span className="tier-pip-label">{t('whatsNew.tierApex')}</span>
            </span>
            <span className="tier-pips tier-3" style={{ padding: '5px 10px' }}>
              {Array.from({ length: 3 }, (_, i) => <span key={i} className="tier-pip filled" />)}
              <span className="tier-pip-label">{t('whatsNew.tierLandmark')}</span>
            </span>
            <span className="tier-pips tier-2" style={{ padding: '5px 10px' }}>
              {Array.from({ length: 2 }, (_, i) => <span key={i} className="tier-pip filled" />)}
              <span className="tier-pip-label">{t('whatsNew.tierAcclaimed')}</span>
            </span>
          </div>
          <p className="wn-section-desc">{t('whatsNew.canonBody')}</p>
        </div>

        <div className="wn-divider" />

        {/* Battle Cards Section */}
        <div className="wn-section">
          <div className="wn-section-header">
            <span className="wn-section-icon">⚔️</span>
            <div>
              <div className="wn-section-title">{t('whatsNew.cardsHeading')}</div>
              <div className="wn-section-sub">{t('whatsNew.cardsSub')}</div>
            </div>
          </div>
          <div className="wn-card-row">
            <div className="wn-card" style={{ borderColor: RARITIES.COMMON.color }}>
              <span style={{ color: RARITIES.COMMON.color }}>{t('cards.rarity.common')}</span>
            </div>
            <div className="wn-card" style={{ borderColor: RARITIES.RARE.color, boxShadow: `0 0 8px ${RARITIES.RARE.glow}` }}>
              <span style={{ color: RARITIES.RARE.color }}>{t('cards.rarity.rare')}</span>
            </div>
            <div className="wn-card" style={{ borderColor: RARITIES.EPIC.color, boxShadow: `0 0 8px ${RARITIES.EPIC.glow}` }}>
              <span style={{ color: RARITIES.EPIC.color }}>{t('cards.rarity.epic')}</span>
            </div>
            <div className="wn-card wn-card-legendary" style={{ borderColor: RARITIES.LEGENDARY.color, boxShadow: `0 0 12px ${RARITIES.LEGENDARY.glow}` }}>
              <span style={{ color: RARITIES.LEGENDARY.color }}>{t('cards.rarity.legendary')}</span>
            </div>
          </div>
          <p className="wn-section-desc">{t('whatsNew.cardsBody')}</p>
        </div>

        <div className="wn-divider" />

        {/* Daily Oscar Section */}
        <div className="wn-section">
          <div className="wn-section-header">
            <span className="wn-section-icon">🎬</span>
            <div>
              <div className="wn-section-title">{t('whatsNew.dailyHeading')}</div>
              <div className="wn-section-sub">{t('whatsNew.dailySub')}</div>
            </div>
          </div>
          <p className="wn-section-desc">{t('whatsNew.dailyBody')}</p>
        </div>

        <div className="wn-buttons">
          <button className="wn-btn-primary" onClick={() => { dismiss(); if (onGoToBattle) onGoToBattle(); }}>
            {t('whatsNew.startBattling')}
          </button>
          <button className="wn-btn-secondary" onClick={() => { dismiss(); if (onPlayDaily) onPlayDaily(); }}>
            {t('whatsNew.playDaily')}
          </button>
        </div>

        <button className="wn-dismiss" onClick={dismiss}>{t('whatsNew.exploreLater')}</button>
      </div>
    </div>
  );
}
