import { FormEvent, useEffect, useMemo, useState } from 'react';
import { supportApi } from '../api/support';
import { useSupportSocket } from '../chat/useSupportSocket';
import { useAuth } from '../context/AuthContext';

export function SupportPage() {
  const { token, user } = useAuth();
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [statusLabel, setStatusLabel] = useState<'OPEN' | 'CLOSED'>('OPEN');
  const [text, setText] = useState('');
  const [pageError, setPageError] = useState('');
  const { connect, sendMessage, messages, status, error } = useSupportSocket(token);

  useEffect(() => {
    const loadConversation = async () => {
      if (!token) return;
      try {
        const conversation = await supportApi.getMyConversation(token);
        setConversationId(conversation.id);
        setStatusLabel(conversation.status);
      } catch (loadError) {
        setPageError(loadError instanceof Error ? loadError.message : 'Не удалось открыть поддержку');
      }
    };

    loadConversation();
  }, [token]);

  useEffect(() => {
    if (conversationId) {
      connect(conversationId);
    }
  }, [conversationId, connect]);

  const canSend = useMemo(() => status === 'connected' && statusLabel !== 'CLOSED' && text.trim().length > 0, [status, statusLabel, text]);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!canSend) return;
    sendMessage(text);
    setText('');
  };

  return (
    <section className="support-layout">
      <article className="panel stack-md">
        <div className="section-head">
          <div>
            <h1>Поддержка</h1>
            <p>Напиши нам, и админ ответит в этом же окне.</p>
          </div>
          <span className={`status-badge ${statusLabel === 'CLOSED' ? 'status-badge--closed' : ''}`}>
            {statusLabel === 'OPEN' ? 'Диалог открыт' : 'Диалог закрыт'}
          </span>
        </div>

        <div className="support-meta-row">
          <div className="user-pill">
            <span>{user?.username}</span>
            <small>{status === 'connected' ? 'онлайн' : status === 'connecting' ? 'подключение...' : 'не подключен'}</small>
          </div>
        </div>

        {pageError && <div className="error-box">{pageError}</div>}
        {error && <div className="error-box">{error}</div>}

        <div className="chat-box">
          {messages.length === 0 ? (
            <div className="empty-state">Пока сообщений нет. Начни диалог первым.</div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`chat-message ${message.authorRole === 'ADMIN' ? 'chat-message--admin' : 'chat-message--user'}`}
              >
                <div className="chat-message__meta">
                  <strong>{message.authorName}</strong>
                  <span>{new Date(message.createdAt).toLocaleString('ru-RU')}</span>
                </div>
                <p>{message.text}</p>
              </div>
            ))
          )}
        </div>

        <form className="stack-sm" onSubmit={onSubmit}>
          <textarea
            className="input textarea"
            placeholder={statusLabel === 'CLOSED' ? 'Диалог закрыт администратором' : 'Опиши проблему или вопрос'}
            value={text}
            onChange={(event) => setText(event.target.value)}
            disabled={statusLabel === 'CLOSED'}
          />
          <button className="button" disabled={!canSend}>
            Отправить сообщение
          </button>
        </form>
      </article>
    </section>
  );
}
