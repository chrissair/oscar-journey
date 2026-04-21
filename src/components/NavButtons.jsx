import React from 'react';
import { useT } from '../i18n';

export default function NavButtons({ currentIdx, total, onPrev, onNext, canAdvance }) {
  const { t } = useT();
  const isFirst = currentIdx === 0;
  const isLast = currentIdx === total - 1;

  return (
    <div className="nav-row">
      <button className="btn-prev" onClick={onPrev} disabled={isFirst}>
        ← {t('common.previous')}
      </button>
      <button className="btn-next" onClick={onNext} disabled={!canAdvance}>
        {!canAdvance ? t('navButtons.lockedBeforeRate') : isLast ? t('navButtons.completeJourney') : t('navButtons.nextFilm')}
      </button>
    </div>
  );
}
