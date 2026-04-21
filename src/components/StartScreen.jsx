import React from 'react';
import { MOVIES, GENRE_LABELS } from '../data/movies';
import { useT } from '../i18n';

export default function StartScreen({ onStart }) {
  const { t } = useT();
  const bpCount   = MOVIES.filter(m => m.category === 'BP').length;
  const intCount  = MOVIES.filter(m => m.category === 'INT').length;
  const animCount = MOVIES.filter(m => m.category === 'ANIM').length;
  const essCount  = MOVIES.filter(m => m.category === 'ESSENTIAL').length;

  return (
    <div className="screen active">
      <div className="start-screen">
        <span className="big-trophy">🏆</span>
        <h1>{t('start.title')}</h1>
        <p>
          {t('start.pitchParagraph', { total: MOVIES.length, essCount })}
        </p>
        <p style={{ fontSize: '0.9rem', color: 'var(--cream-dim)', marginBottom: '6px' }}>
          {t('start.subPitch')}
        </p>
        <p style={{ fontSize: '0.82rem', color: 'var(--cream-dim)', fontStyle: 'italic' }}>
          {t('start.disclaimerItalic')}
        </p>
        <div className="stat-pills">
          <div className="stat-pill"><span>{MOVIES.length}</span> {t('start.statFilms')}</div>
          <div className="stat-pill"><span>{bpCount}</span> {t('start.statBestPicture')}</div>
          <div className="stat-pill"><span>{intCount}</span> {t('start.statInternational')}</div>
          <div className="stat-pill"><span>{animCount}</span> {t('start.statAnimated')}</div>
          <div className="stat-pill"><span>{essCount}</span> {t('start.statEssential')}</div>
          <div className="stat-pill"><span>{Object.keys(GENRE_LABELS).length}</span> {t('start.statGenres')}</div>
        </div>
        <button className="btn-primary" onClick={onStart}>{t('start.begin')}</button>
      </div>
    </div>
  );
}
