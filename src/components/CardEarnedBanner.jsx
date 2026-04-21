import React from 'react';
import { RARITIES } from '../utils/cards';
import { useT } from '../i18n';

export default function CardEarnedBanner({ onOpen, onDismiss }) {
  const { t } = useT();
  return (
    <div className="card-earned-banner">
      <div className="card-earned-glow" />
      <div className="card-earned-content">
        <div className="card-earned-icon">🎬</div>
        <div className="card-earned-text">
          <div className="card-earned-title">{t('cards.earned')}</div>
          <div className="card-earned-sub">
            Could be <span style={{ color: RARITIES.RARE.color }}>{t('cards.rarity.rare')}</span>,{' '}
            <span style={{ color: RARITIES.EPIC.color }}>{t('cards.rarity.epic')}</span>, or even{' '}
            <span style={{ color: RARITIES.LEGENDARY.color }}>{t('cards.rarity.legendary')}</span>
          </div>
        </div>
      </div>
      <div className="card-earned-actions">
        <button className="card-earned-open" onClick={onOpen}>{t('cards.open')}</button>
        <button className="card-earned-later" onClick={onDismiss}>{t('cards.dismiss')}</button>
      </div>
    </div>
  );
}
