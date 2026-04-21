import React from 'react';
import { MOVIES_BY_ID } from '../data/movies';
import { useT } from '../i18n';

function useTimeAgo() {
  const { t, lang } = useT();
  return (timestamp) => {
    if (!timestamp) return '';
    const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return t('activity.justNow');
    if (diff < 3600) return t('activity.minutesAgo', { count: Math.floor(diff / 60) });
    if (diff < 86400) return t('activity.hoursAgo', { count: Math.floor(diff / 3600) });
    if (diff < 604800) return t('activity.daysAgo', { count: Math.floor(diff / 86400) });
    // For older entries fall back to locale-appropriate short date.
    const locale = lang === 'zh' ? 'zh-Hant' : 'en-US';
    return d.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
  };
}

export default function ActivityFeed({ activities, currentProfileId, onOpenDetail }) {
  const { t } = useT();
  const timeAgo = useTimeAgo();
  if (!activities || activities.length === 0) return null;

  return (
    <div className="activity-feed">
      <div className="activity-feed-title">{t('activity.feedTitle')}</div>
      {activities.map(a => {
        const name = a.profileId === currentProfileId ? t('activity.you') : a.displayName;
        // Build the "<name> watched <film> (year)" row. We do a small split on
        // the translated sentence pattern so the film title stays clickable and
        // the year sits in its own span — one-string renders in Chinese word
        // order ("<name> 看了 <film>") while the English pattern is preserved.
        const sentence = t('activity.watched', { name: '__NAME__', film: '__FILM__' });
        const parts = sentence.split(/(__NAME__|__FILM__)/);
        return (
          <div key={a.id} className="activity-item">
            <span className="activity-avatar">{a.avatar || '\u{1F464}'}</span>
            <span className="activity-text">
              {parts.map((p, i) => {
                if (p === '__NAME__') return <strong key={i}>{name}</strong>;
                if (p === '__FILM__') return (
                  <span key={i} className="activity-movie-link" onClick={() => {
                    if (onOpenDetail) {
                      const movie = MOVIES_BY_ID[a.movieId];
                      if (movie) onOpenDetail(movie);
                    }
                  }}>
                    {a.movieTitle}
                  </span>
                );
                return <React.Fragment key={i}>{p}</React.Fragment>;
              })}
              <span className="activity-year"> ({a.movieYear})</span>
            </span>
            <span className="activity-time">{timeAgo(a.timestamp)}</span>
          </div>
        );
      })}
    </div>
  );
}
