import { useState, useEffect, useRef } from 'react';

// Module-level signals — lets AIChatWidget and AdminDashboard stay in sync
// without a context provider. Both components are in different subtrees.

let _launcherVisible = false;
const _launcherListeners = new Set<(v: boolean) => void>();
const _openCallbacks = new Set<() => void>();

export function setCoriLauncherVisible(show: boolean) {
  _launcherVisible = show;
  _launcherListeners.forEach(l => l(show));
}

export function fireCoriOpen() {
  _openCallbacks.forEach(cb => cb());
}

export function useCoriLauncherVisible(): boolean {
  const [show, setShow] = useState(_launcherVisible);
  useEffect(() => {
    _launcherListeners.add(setShow);
    return () => { _launcherListeners.delete(setShow); };
  }, []);
  return show;
}

export function useOnCoriOpen(cb: () => void): void {
  const cbRef = useRef(cb);
  useEffect(() => { cbRef.current = cb; });
  useEffect(() => {
    const stable = () => cbRef.current();
    _openCallbacks.add(stable);
    return () => { _openCallbacks.delete(stable); };
  }, []);
}
