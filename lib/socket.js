import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io({
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });
  }
  return socket;
}

export function useSocket() {
  const [matchData, setMatchData] = useState(null);
  const [styleData, setStyleData] = useState(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    const s = getSocket();
    socketRef.current = s;

    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));
    s.on('match:state', (data) => setMatchData(data));
    s.on('style:state', (data) => setStyleData(data));

    return () => {
      s.off('connect');
      s.off('disconnect');
      s.off('match:state');
      s.off('style:state');
    };
  }, []);

  const emit = (event, data) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data);
    }
  };

  return { matchData, styleData, connected, emit, socket: socketRef.current };
}
