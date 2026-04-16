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

  const connectionLabel =
    status === 'connected' ? 'В сети' : status === 'connecting' ? 'Подключаем чат…' : 'Нет соединения';

  return (
    <section className="support-layout">
      <article className="panel support-page-shell stack-lg">
        <div className="support-hero">
          <div className="stack-sm">
            <span className="eyebrow">Поддержка 24/7</span>
            <div>
              <h1>Чат с поддержкой</h1>
              <p>Задай вопрос по заказу, оплате или доставке. Ответ придёт прямо сюда, без перезагрузки страницы.</p>
            </div>
          </div>

          <div className="support-summary-grid">
            <div className="support-summary-card">
              <span>Статус диалога</span>
              <strong>{statusLabel === 'OPEN' ? 'Открыт' : 'Закрыт'}</strong>
              <small>{statusLabel === 'OPEN' ? 'Можно писать новые сообщения' : 'Новые сообщения отключены администратором'}</small>
            </div>
            <div className="support-summary-card">
              <span>Подключение</span>
              <strong>{connectionLabel}</strong>
              <small>{user?.username ? `Аккаунт: ${user.username}` : 'Пользователь не определён'}</small>
            </div>
          </div>
        </div>

        {(pageError || error) && <div className="error-box">{pageError || error}</div>}

        <div className="support-chat-shell">
          <div className="support-chat-shell__header">
            <div>
              <h2>Диалог</h2>
              <p>{messages.length > 0 ? `Сообщений: ${messages.length}` : 'Пока сообщений нет, можно начать первым.'}</p>
            </div>
            <span className={`status-badge ${statusLabel === 'CLOSED' ? 'status-badge--closed' : 'status-badge--live'}`}>
              {statusLabel === 'OPEN' ? 'Оператор на линии' : 'Диалог завершён'}
            </span>
          </div>

          <div className="chat-box support-chat-box">
            {messages.length === 0 ? (
              <div className="empty-state support-empty-state">
                <strong>Чат пока пустой</strong>
                <p>Опиши проблему одним сообщением, и администратор увидит её сразу.</p>
              </div>
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

          <form className="support-compose" onSubmit={onSubmit}>
            <textarea
              className="input textarea support-compose__textarea"
              placeholder={statusLabel === 'CLOSED' ? 'Диалог закрыт администратором' : 'Напиши, что случилось: заказ, оплата, доставка, ошибка на сайте…'}
              value={text}
              onChange={(event) => setText(event.target.value)}
              disabled={statusLabel === 'CLOSED'}
            />
            <div className="support-compose__footer">
              <p>
                {statusLabel === 'CLOSED'
                  ? 'Чтобы продолжить, администратор должен снова открыть диалог.'
                  : 'Сообщение отправится сразу после нажатия кнопки.'}
              </p>
              <button className="button" disabled={!canSend}>
                Отправить сообщение
              </button>
            </div>
          </form>
        </div>
      </article>
    </section>
  );
}
