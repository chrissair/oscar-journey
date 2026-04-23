import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './App.css'

// Firestore's WebChannel state can get permanently corrupted after long tab
// dormancy, firing an unrecoverable "INTERNAL ASSERTION FAILED" error. Once
// it fires, the SDK instance is dead for the page lifetime — reload once.
const FIRESTORE_RELOAD_FLAG = 'firestoreAssertionReloadAt';
function handleFirestoreAssertion(message) {
  if (typeof message !== 'string') return false;
  if (!/FIRESTORE.*INTERNAL ASSERTION/i.test(message)) return false;
  try {
    const last = Number(sessionStorage.getItem(FIRESTORE_RELOAD_FLAG) || 0);
    if (Date.now() - last < 30000) return false; // guard against reload loops
    sessionStorage.setItem(FIRESTORE_RELOAD_FLAG, String(Date.now()));
  } catch {}
  window.location.reload();
  return true;
}
window.addEventListener('error', (e) => {
  handleFirestoreAssertion(e?.message || e?.error?.message);
});
window.addEventListener('unhandledrejection', (e) => {
  const msg = e?.reason?.message || (typeof e?.reason === 'string' ? e.reason : '');
  handleFirestoreAssertion(msg);
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
