import { useEffect, useState, useRef } from 'react';
import syncManager from './sync';

export function useSocket() {
  const [matchData, setMatchData] = useState(null);
  const [styleData, setStyleData] = useState(null);
  const [connected, setConnected] = useState(false);
  const [hostId, setHostId] = useState(null);

  useEffect(() => {
    if (!syncManager) return;

    const params = new URLSearchParams(window.location.search);
    const urlHostId = params.get('host');
    const isOverlay = window.location.pathname.includes('overlay');
    const isRemote = params.get('role') === 'remote';

    const start = async () => {
      try {
        if (urlHostId) {
          // Initialize as Client (Overlay or Remote)
          await syncManager.initClient(urlHostId);
          setHostId(urlHostId);
        } else if (isOverlay || isRemote) {
          // If overlay/remote but no host ID, we can't do much yet
          console.error('[Sync] No host ID provided in URL');
        } else {
          // Initialize as Host (Admin Panel)
          const savedId = localStorage.getItem('p2p_host_id');
          const id = await syncManager.initHost(savedId);
          localStorage.setItem('p2p_host_id', id);
          setHostId(id);
        }
        setConnected(true);
      } catch (err) {
        console.error('[Sync] Init error:', err);
      }
    };

    start();

    const unsubscribe = syncManager.subscribe((state) => {
      setMatchData(state.match);
      setStyleData(state.style);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const emit = (event, data) => {
    if (syncManager) {
      syncManager.emit(event, data);
    }
  };

  return { matchData, styleData, connected, emit, hostId };
}
