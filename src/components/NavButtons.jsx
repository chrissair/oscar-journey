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
        {!canAdvance ? '🔒 Watch & Rate to Continue' : isLast ? '★ Complete Journey' : 'Next Film →'}
      </button>
    </div>
  );
}
