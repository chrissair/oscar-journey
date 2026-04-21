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
            {(() => {
              const sentence = t('cards.couldBe', { rare: '__R__', epic: '__E__', legendary: '__L__' });
              return sentence.split(/(__R__|__E__|__L__)/).map((p, i) => {
                if (p === '__R__') return <span key={i} style={{ color: RARITIES.RARE.color }}>{t('cards.rarity.rare')}</span>;
                if (p === '__E__') return <span key={i} style={{ color: RARITIES.EPIC.color }}>{t('cards.rarity.epic')}</span>;
                if (p === '__L__') return <span key={i} style={{ color: RARITIES.LEGENDARY.color }}>{t('cards.rarity.legendary')}</span>;
                return <React.Fragment key={i}>{p}</React.Fragment>;
              });
            })()}
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
