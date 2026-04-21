import React from 'react';
import { MOVIES } from '../data/movies';
import { useT } from '../i18n';

export default function InfoModal({ onClose }) {
  const { t } = useT();
  return (
    <div className="modal-overlay open" onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="modal info-modal">
        <button className="info-modal-close" onClick={onClose}>✕</button>

        <div className="info-hero">
          <span className="info-hero-icon">🏆</span>
          <h2 className="info-hero-title">{t('start.title')}</h2>
          <p className="info-hero-sub">{t('info.heroSub', { count: MOVIES.length })}</p>
        </div>

        <div className="info-section">
          <div className="info-section-icon">🎬</div>
          <div>
            <h3>{t('info.problemHeading')}</h3>
            <p>{t('info.problemBody')}</p>
          </div>
        </div>

        <div className="info-section">
          <div className="info-section-icon">✨</div>
          <div>
            <h3>{t('info.solutionHeading')}</h3>
            <p>
              {/* Rebuild the paragraph with <strong> spans so the visual
                  emphasis survives translation. The i18n body holds {bp},
                  {intl}, {anim}, {filmsTotal} placeholders that we replace
                  with JSX nodes by splitting on those tokens. */}
              {(() => {
                const body = t('info.solutionBody', {
                  bp: '__BP__',
                  intl: '__INTL__',
                  anim: '__ANIM__',
                  filmsTotal: '__FILMS__',
                });
                const parts = body.split(/(__BP__|__INTL__|__ANIM__|__FILMS__)/);
                return parts.map((part, i) => {
                  if (part === '__BP__') return <strong key={i}>{t('info.solutionBoldBP')}</strong>;
                  if (part === '__INTL__') return <strong key={i}>{t('info.solutionBoldINT')}</strong>;
                  if (part === '__ANIM__') return <strong key={i}>{t('info.solutionBoldANIM')}</strong>;
                  if (part === '__FILMS__') return <strong key={i}>{t('info.solutionBoldFilms', { count: MOVIES.length })}</strong>;
                  return <React.Fragment key={i}>{part}</React.Fragment>;
                });
              })()}
            </p>
          </div>
        </div>

        <div className="info-divider" />

        <div className="info-features">
          <h3 className="info-features-title">{t('info.featuresTitle')}</h3>

          <div className="info-feature">
            <span className="info-feature-emoji">🎬</span>
            <div>
              <strong>{t('info.featureJourney')}</strong>
              <p>{t('info.featureJourneyDesc')}</p>
            </div>
          </div>

          <div className="info-feature">
            <span className="info-feature-emoji">📋</span>
            <div>
              <strong>{t('info.featureFilms')}</strong>
              <p>{t('info.featureFilmsDesc', { count: MOVIES.length })}</p>
            </div>
          </div>

          <div className="info-feature">
            <span className="info-feature-emoji">⚔️</span>
            <div>
              <strong>{t('info.featureBattle')}</strong>
              <p>{t('info.featureBattleDesc')}</p>
            </div>
          </div>

          <div className="info-feature">
            <span className="info-feature-emoji">🃏</span>
            <div>
              <strong>{t('info.featureCards')}</strong>
              <p>{t('info.featureCardsDesc')}</p>
            </div>
          </div>

          <div className="info-feature">
            <span className="info-feature-emoji">🧩</span>
            <div>
              <strong>{t('info.featureDaily')}</strong>
              <p>{t('info.featureDailyDesc')}</p>
            </div>
          </div>

          <div className="info-feature">
            <span className="info-feature-emoji">👥</span>
            <div>
              <strong>{t('info.featureProfiles')}</strong>
              <p>{t('info.featureProfilesDesc')}</p>
            </div>
          </div>
        </div>

        <div className="info-divider" />

        <details className="info-hidden">
          <summary>{t('info.hiddenFeaturesSummary')}</summary>
          <ul>
            <li>{t('info.hidden1')}</li>
            <li>{t('info.hidden2')}</li>
            <li>{t('info.hidden3')}</li>
            <li>{t('info.hidden4')}</li>
            <li>{t('info.hidden5')}</li>
            <li>{t('info.hidden6')}</li>
            <li>{t('info.hidden7')}</li>
            <li>{t('info.hidden8')}</li>
          </ul>
        </details>

        <div className="info-footer">
          <p>{t('info.footerGoal')}</p>
        </div>
      </div>
    </div>
  );
}
