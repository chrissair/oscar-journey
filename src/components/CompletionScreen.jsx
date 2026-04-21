import React from 'react';
import { useT } from '../i18n';

export default function CompletionScreen({ total, onRestart }) {
  const { t } = useT();
  return (
    <div className="screen active">
      <div className="complete-screen">
        <span className="big-icon">🎬</span>
        <h1>{t('completion.title')}</h1>
        <p>
          {t('completion.subtitleWithTotal', { total })}
        </p>
        <button className="btn-primary" onClick={onRestart}>
          {t('completion.restart')}
        </button>
      </div>
    </div>
  );
}
