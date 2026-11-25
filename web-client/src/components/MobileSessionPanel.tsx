import React from 'react';
import { Clipboard, Shield, Activity, RotateCcw, Eye, Focus, LockKeyhole, LogOut, ScanEye, Monitor, SlidersHorizontal, Volume2 } from 'lucide-react';
import { t, type I18nKey } from '../lib/i18n';
import { formatConnectionError } from '../lib/errors';
import type { SessionMenuProps } from './SessionMenu';
import type { PreferredCodec } from '../lib/displayPrefs';
const qualityNames = { low: 'qualityLow', balanced: 'qualityBalanced', best: 'qualityBest' } as const;

export type MobilePanel = 'toolbar' | 'actions' | 'display' | 'gestures';

const gestureRows = {
  touch: [
    ['gTouchTapTitle', 'gTouchTapDesc'],
    ['gDoubleTapTitle', 'gTouchDoubleTapDesc'],
    ['gTouchRightTitle', 'gTouchRightDesc'],
    ['gTouchDragTitle', 'gTouchDragDesc'],
    ['gTouchPinchTitle', 'gTouchPinchDesc'],
    ['gTouchScrollTitle', 'gTouchScrollDesc'],
  ],
  mouse: [
    ['gMouseSlideTitle', 'gMouseSlideDesc'],
    ['gMouseTapTitle', 'gMouseTapDesc'],
    ['gDoubleTapTitle', 'gMouseDoubleTapDesc'],
    ['gMouseDragTitle', 'gMouseDragDesc'],
    ['gMouseRightTitle', 'gMouseRightDesc'],
    ['gMousePinchTitle', 'gMousePinchDesc'],
    ['gTouchScrollTitle', 'gTouchScrollDesc'],
  ],
} as const;

export function MobileSessionPanel(p: SessionMenuProps & { mobilePanel: MobilePanel }) {
  const label = (key: I18nKey) => t(p.locale, key);
  React.useEffect(() => {
    if (p.decoderError) p.onNotify(formatConnectionError(p.locale, p.decoderError).message, true);
  }, [p.decoderError, p.locale, p.onNotify]);
  const notify = (text: string) => p.onNotify(text);
  const monitors = p.peer?.displays ?? [];
  const panelName = { toolbar: 'session', actions: 'moreActions', display: 'screens', gestures: 'dockGuide' } as const;

  const toggle = (Icon: typeof Eye, text: I18nKey, checked: boolean, change: () => void, disabled = false) => (
    <label className="tool-row"><Icon /><span>{label(text)}</span>
      <input type="checkbox" role="switch" checked={checked} onChange={change} disabled={disabled} />
    </label>
  );
  const action = (Icon: typeof Eye, text: I18nKey, run: () => void, danger = false) => (
    <button type="button" className={danger ? 'tool-row destructive' : 'tool-row'} onClick={run}><Icon />{label(text)}</button>
  );
  return (
    <div className="remote-menu-backdrop" data-testid="session-backdrop" onPointerDown={e => e.stopPropagation()}
      onClick={e => { if (e.target === e.currentTarget) p.onClose(); }}>
      {p.mobilePanel !== 'toolbar' && (
        <section className="remote-menu-panel" role="dialog" aria-label={label(panelName[p.mobilePanel])} data-testid="session-menu">
          {p.mobilePanel === 'actions' && <>
            <div className="tool-group">
              {toggle(Volume2, 'remoteAudio', p.audioEnabled, p.onToggleAudio)}
              {toggle(Clipboard, 'clipSync', p.clipboardSync, p.onToggleClipboardSync, !p.clipboardAllowed)}
              {p.peer?.privacyAllowed && toggle(Shield, 'privacyMode', p.privacyEnabled, p.onTogglePrivacy, p.privacyPending || p.viewOnly)}
            </div>
            <div className="tool-group">{action(Activity, 'diagTitle', p.onToggleDiagnostics)}</div>
            <div className="tool-group">
              {p.peer?.restartAllowed && action(RotateCcw, 'restartDevice', p.onRestart)}
              {action(LockKeyhole, 'lockScreen', () => p.onQuickKey('Lock'))}
              {action(LogOut, 'disconnectRemote', p.onDisconnect, true)}
            </div>
          </>}
          {p.mobilePanel === 'gestures' && <div className="tool-group">
            <h2 className="text-base font-semibold my-2">{label(p.touchMode ? 'touchModeGestures' : 'mouseModeGestures')}</h2>
            <dl data-testid="gesture-guide">{gestureRows[p.touchMode ? 'touch' : 'mouse'].map(([name, desc]) =>
              <div key={name}><dt>{label(name)}</dt><dd>{label(desc)}</dd></div>)}</dl>
          </div>}
          {p.mobilePanel === 'display' && <>
            {monitors.length > 1 && <div className="tool-group tool-options">{monitors.map(d =>
              <button key={d.index} aria-pressed={d.index === p.display} disabled={d.online === false}
                onClick={() => { p.onSwitchDisplay(d.index); notify(label('requestSent')+' · '+(d.name || label('screens')+' '+(d.index+1))); }}><Monitor />{d.name || label('screens')+' '+(d.index+1)}</button>)}</div>}
            <div className="tool-group">
              <details><summary><ScanEye />{label('view')}</summary>
                <button type="button" className="view-fit-action" data-testid="view-fit" aria-pressed={p.viewMode === 'fit'}
                  onClick={() => { p.onFit(); notify(label('fit')); }}>{label('fit')}</button>
              </details>
              {p.sizes.length > 0 && <label className="tool-row"><Monitor /><span>{label('remoteResolution')}</span>
                <select disabled={p.viewOnly} value={p.sizes.findIndex(s => s.width === p.stats.width && s.height === p.stats.height)}
                  onChange={e => { const size = p.sizes[Number(e.target.value)]; if (size) { p.onResolution(size.width,size.height); notify(label('requestSent')+' · '+size.width+' × '+size.height); } }}>
                  <option disabled value={-1}>{p.stats.width} × {p.stats.height}</option>
                  {p.sizes.map((s,i) => <option key={i} value={i}>{s.width} × {s.height}</option>)}
                </select></label>}
              <details data-testid="mobile-quality">
                <summary><SlidersHorizontal />{label('qualityAndFps')}<small>{label(qualityNames[p.quality])} · {p.targetFps} FPS</small></summary>
                <div className="tool-options mode-options">
                  {(['low', 'balanced', 'best'] as const).map(level =>
                    <button key={level} aria-pressed={p.quality === level} onClick={() => { p.onChangeQuality(level, p.targetFps); notify(label('requestSent')+' · '+label(qualityNames[level])); }}>
                      {label(qualityNames[level])}
                    </button>)}
                </div>
                <label className="tool-row"><span>{label('targetFps')}</span><select value={p.targetFps} onChange={e => { p.onChangeQuality(p.quality, Number(e.target.value)); notify(label('requestSent')+' · '+e.target.value+' FPS'); }}>
                  {[15,30,60].map(n => <option key={n}>{n}</option>)}</select></label>
                <label className="tool-row"><span>{label('sessionCodecLabel')}</span><select value={p.preferredCodec} onChange={e => { p.onChangeQuality(p.quality,p.targetFps,e.target.value as PreferredCodec); notify(label('requestSent')+' · '+(e.target.value === 'auto' ? label('codecAuto') : e.target.value.toUpperCase())); }}>
                  {['auto','h264','vp8','vp9','av1'].map(v => <option key={v} value={v}>{v==='auto'?label('codecAuto'):v.toUpperCase()}</option>)}</select></label>
              </details>
            </div>
            {monitors.length > 1 && <div className="tool-group">
              {toggle(Focus,'followWindow',p.followWindow,() => { p.onToggleFollowWindow(); notify(label('followWindow')+' · '+label(p.followWindow ? 'optionOff' : 'optionOn')); })}
            </div>}
          </>}
        </section>
      )}
    </div>
  );
}
