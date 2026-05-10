import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import syncManager from './sync';

export function useSocket() {
  const [matchData, setMatchData] = useState(null);
  const [styleData, setStyleData] = useState(null);
  const [connected, setConnected] = useState(false);
  const [hostId, setHostId] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!syncManager) return;

    // Connect to Socket.IO server
    const socket = io();
    socketRef.current = socket;
    syncManager.setSocket(socket);

    socket.on('connect', () => {
      console.log('[Socket.IO] Connected to server');
      setConnected(true);
    });

    socket.on('match:state', (data) => {
      console.log('[Socket.IO] Received match state:', data);
      // If we are Host, we use this as initial state if local is empty
      // If we are Client, we prioritize PeerJS but this is a good backup
      if (syncManager.role === 'host' && !syncManager.state.match) {
        syncManager.state.match = data;
        syncManager.notify();
      }
    });

    const params = new URLSearchParams(window.location.search);
    const urlHostId = params.get('host');
    const isOverlay = window.location.pathname.includes('/overlay');
    const isRemote = window.location.pathname.includes('/remote');

    const start = async () => {
      try {
        if (urlHostId) {
          // Initialize as Client (Overlay or Remote)
          await syncManager.initClient(urlHostId);
          setHostId(urlHostId);
        } else if (isOverlay) {
          // Special case: If overlay on same PC, try to auto-connect to local host ID
          const localHostId = localStorage.getItem('p2p_host_id');
          if (localHostId) {
            console.log('[Sync] Auto-connecting to local host:', localHostId);
            await syncManager.initClient(localHostId);
            setHostId(localHostId);
          } else {
            console.warn('[Sync] Waiting for host ID in URL or localStorage...');
          }
        } else if (isRemote) {
          console.warn('[Sync] Remote requires host ID in URL');
        } else {
          // Initialize as Host (Admin Panel)
          const savedId = localStorage.getItem('p2p_host_id');
          const id = await syncManager.initHost(savedId);
          localStorage.setItem('p2p_host_id', id);
          setHostId(id);
        }
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
      socket.disconnect();
    };
  }, []);

  const emit = (event, data) => {
    if (syncManager) {
      syncManager.emit(event, data);
    }
  };

  return { matchData, styleData, connected, emit, hostId };
}
