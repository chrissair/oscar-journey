import React, { useState } from 'react';
import MovieBattle from './MovieBattle';
import QuoteBattle from './QuoteBattle';
import QuoteTrivia from './QuoteTrivia';
import PeopleBattle from './PeopleBattle';
import { useT } from '../i18n';

const MODES = [
  { id: 'movie', icon: '⚔️' },
  { id: 'people', icon: '🎭' },
  { id: 'quote', icon: '💬' },
  { id: 'trivia', icon: '🧩' },
];

// Map mode id to the translated label key in battle.*
const MODE_LABEL_KEYS = {
  movie: 'battle.movieBattle',
  people: 'battle.peopleBattle',
  quote: 'battle.quoteBattle',
  trivia: 'battle.quoteTrivia',
};

export default function BattleHub({ profile, playlist, watchedSet, onOpenDetail, simpleBattle, onSaveProfile }) {
  const [mode, setMode] = useState('movie');
  const { t } = useT();

  // Derive label and subtitle via t() so they update on language change
  const modeLabel = t(MODE_LABEL_KEYS[mode]);
  const modeSub = t(`battle.modeSub.${mode}`);

  // First word of the label for the pill buttons
  const modeFirstWord = (id) => t(MODE_LABEL_KEYS[id]).split(' ')[0];

  return (
    <div className="battle-hub">
      {/* Mode selector pills */}
      <div className="battle-mode-selector">
        {MODES.map(m => (
          <button
            key={m.id}
            className={`battle-mode-btn ${mode === m.id ? 'battle-mode-active' : ''}`}
            onClick={() => setMode(m.id)}
          >
            <span className="battle-mode-label">{m.icon} {modeFirstWord(m.id)}</span>
          </button>
        ))}
      </div>

      {/* Title + subtitle */}
      <h2 className="battle-mode-title">{modeLabel}</h2>
      <p className="battle-mode-sub">{modeSub}</p>

      {mode === 'movie' && (
        <MovieBattle
          profile={profile}
          playlist={playlist}
          watchedSet={watchedSet}
          onOpenDetail={onOpenDetail}
          simpleBattle={simpleBattle}
          onSaveProfile={onSaveProfile}
        />
      )}

      {mode === 'quote' && (
        <QuoteBattle profile={profile} onSaveProfile={onSaveProfile} />
      )}

      {mode === 'trivia' && (
        <QuoteTrivia profile={profile} onSaveProfile={onSaveProfile} />
      )}

      {mode === 'people' && (
        <PeopleBattle profile={profile} onSaveProfile={onSaveProfile} />
      )}
    </div>
  );
}
