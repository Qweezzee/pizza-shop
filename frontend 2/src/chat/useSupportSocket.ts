import { useCallback, useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { API_URL } from '../api/client';
import type { SupportChatMessage } from '../types';

type ChatConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export function useSupportSocket(token: string | null) {
  const socketRef = useRef<Socket | null>(null);
  const conversationIdRef = useRef<number | null>(null);

  const [status, setStatus] = useState<ChatConnectionStatus>('disconnected');
  const [messages, setMessages] = useState<SupportChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const disconnect = useCallback(() => {
    const socket = socketRef.current;
    socketRef.current = null;
    conversationIdRef.current = null;

    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
    }

    setStatus('disconnected');
  }, []);

  const connect = useCallback(
    (conversationId: number) => {
      if (!token) {
        setStatus('error');
        setError('Залогинься сначала');
        return;
      }

      setError(null);
      disconnect();

      const socket = io(API_URL, {
        autoConnect: false,
        transports: ['websocket'],
        auth: {
          token: `Bearer ${token}`,
        },
      });

      socketRef.current = socket;
      conversationIdRef.current = conversationId;
      setStatus('connecting');
      setMessages([]);

      socket.on('connect', () => {
        socket.emit('support:join', { conversationId }, (ack: { ok: boolean; error?: string }) => {
          if (ack.ok) {
            setStatus('connected');
          } else {
            setStatus('error');
            setError(ack.error || 'Иди гуляй');
          }
        });
      });

      socket.on('connect_error', (eventError) => {
        setStatus('error');
        setError(eventError instanceof Error ? eventError.message : 'Ошибка подключения');
      });

      socket.on('disconnect', () => {
        setStatus('disconnected');
      });

      socket.on('support:history', (history: SupportChatMessage[]) => {
        setMessages(history);
      });

      socket.on('support:message', (message: SupportChatMessage) => {
        setMessages((prev) => [...prev, message]);
      });

      socket.connect();
    },
    [disconnect, token],
  );

  const sendMessage = useCallback((text: string) => {
    const socket = socketRef.current;
    const conversationId = conversationIdRef.current;

    if (!socket || !conversationId) return;

    socket.emit(
      'support:message',
      { conversationId, text },
      (ack: { ok: boolean; error?: string }) => {
        if (!ack.ok) {
          setStatus('error');
          setError(ack.error || 'Не удалось отправить сообщение');
        }
      },
    );
  }, []);

  useEffect(() => () => disconnect(), [disconnect]);

  return {
    status,
    messages,
    error,
    connect,
    disconnect,
    sendMessage,
  };
}
