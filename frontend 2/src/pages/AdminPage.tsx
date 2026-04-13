import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ordersApi } from '../api/orders';
import { pizzasApi } from '../api/pizzas';
import { supportApi } from '../api/support';
import { useSupportSocket } from '../chat/useSupportSocket';
import { useAuth } from '../context/AuthContext';
import type { Order, OrderStatus, Pizza, SupportConversationListItem, SupportConversationStatus } from '../types';

const defaultPizzaForm = {
  name: '',
  description: '',
  imageUrl: '',
  category: 'Классика',
  sizes: [
    { size: 'SMALL', diameterCm: 25, price: 399 },
    { size: 'MEDIUM', diameterCm: 30, price: 549 },
    { size: 'LARGE', diameterCm: 35, price: 699 },
  ],
};

const statuses: OrderStatus[] = ['NEW', 'CONFIRMED', 'COOKING', 'DELIVERING', 'COMPLETED', 'CANCELED'];
const supportStatuses: SupportConversationStatus[] = ['OPEN', 'CLOSED'];

export function AdminPage() {
  const { token } = useAuth();
  const [pizzas, setPizzas] = useState<Pizza[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [conversations, setConversations] = useState<SupportConversationListItem[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [form, setForm] = useState(defaultPizzaForm);
  const [message, setMessage] = useState('');
  const [supportText, setSupportText] = useState('');
  const [supportError, setSupportError] = useState('');
  const { connect, messages, sendMessage, status } = useSupportSocket(token);

  const loadData = async () => {
    if (!token) return;
    const [pizzaData, orderData, conversationData] = await Promise.all([
      pizzasApi.getAll(),
      ordersApi.all(token),
      supportApi.getAll(token),
    ]);
    setPizzas(pizzaData);
    setOrders(orderData);
    setConversations(conversationData);
    setSelectedConversationId((prev) => prev ?? conversationData[0]?.id ?? null);
  };

  useEffect(() => {
    loadData();
  }, [token]);

  useEffect(() => {
    if (selectedConversationId) {
      connect(selectedConversationId);
    }
  }, [selectedConversationId, connect]);

  const selectedConversation = useMemo(
    () => conversations.find((item) => item.id === selectedConversationId) ?? null,
    [conversations, selectedConversationId],
  );

  const createPizza = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;
    try {
      await pizzasApi.create(token, form as never);
      setForm(defaultPizzaForm);
      setMessage('Пицца добавлена');
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Ошибка создания');
    }
  };

  const hidePizza = async (id: number) => {
    if (!token) return;
    await pizzasApi.remove(token, id);
    await loadData();
  };

  const updateStatus = async (id: number, nextStatus: OrderStatus) => {
    if (!token) return;
    await ordersApi.changeStatus(token, id, nextStatus);
    await loadData();
  };

  const updateSupportStatus = async (conversationId: number, nextStatus: SupportConversationStatus) => {
    if (!token) return;
    await supportApi.updateStatus(token, conversationId, nextStatus);
    await loadData();
  };

  const submitSupportMessage = (event: FormEvent) => {
    event.preventDefault();
    if (!selectedConversationId || !supportText.trim()) return;
    setSupportError('');
    try {
      sendMessage(supportText);
      setSupportText('');
      setTimeout(() => {
        loadData();
      }, 150);
    } catch (error) {
      setSupportError(error instanceof Error ? error.message : 'Не удалось отправить сообщение');
    }
  };

  return (
    <div className="stack-lg">
      <section className="two-column-layout">
        <article className="panel stack-md">
          <div className="section-head">
            <h1>Добавить пиццу</h1>
          </div>
          <form className="form stack-md" onSubmit={createPizza}>
            <input
              className="input"
              placeholder="Название"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            />
            <input
              className="input"
              placeholder="Категория"
              value={form.category}
              onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
            />
            <input
              className="input"
              placeholder="Ссылка на картинку"
              value={form.imageUrl}
              onChange={(event) => setForm((prev) => ({ ...prev, imageUrl: event.target.value }))}
            />
            <textarea
              className="input textarea"
              placeholder="Описание"
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            />
            {form.sizes.map((size, index) => (
              <div className="admin-size-grid" key={size.size}>
                <strong>{size.size}</strong>
                <input
                  className="input"
                  type="number"
                  value={size.diameterCm}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      sizes: prev.sizes.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, diameterCm: Number(event.target.value) } : item,
                      ),
                    }))
                  }
                />
                <input
                  className="input"
                  type="number"
                  value={size.price}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      sizes: prev.sizes.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, price: Number(event.target.value) } : item,
                      ),
                    }))
                  }
                />
              </div>
            ))}
            {message && <div className="success-box">{message}</div>}
            <button className="button">Сохранить пиццу</button>
          </form>
        </article>

        <article className="panel stack-md">
          <div className="section-head">
            <h2>Текущие пиццы</h2>
            <p>{pizzas.length} позиций</p>
          </div>
          <div className="stack-sm">
            {pizzas.map((pizza) => (
              <div className="admin-row" key={pizza.id}>
                <div>
                  <strong>{pizza.name}</strong>
                  <p>{pizza.category}</p>
                </div>
                <button className="text-button" onClick={() => hidePizza(pizza.id)}>
                  Скрыть
                </button>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="panel stack-md">
        <div className="section-head">
          <h2>Все заказы</h2>
          <p>Смена статуса для админа</p>
        </div>
        <div className="stack-sm">
          {orders.map((order) => (
            <article className="order-admin-row" key={order.id}>
              <div>
                <strong>#{order.id} · {order.user?.username}</strong>
                <p>
                  {order.fullName} · {order.phone} · {Math.round(order.totalPrice)} ₽
                </p>
              </div>
              <select
                className="input select"
                value={order.status}
                onChange={(event) => updateStatus(order.id, event.target.value as OrderStatus)}
              >
                {statuses.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </article>
          ))}
        </div>
      </section>

      <section className="panel stack-md">
        <div className="section-head">
          <div>
            <h2>Чат поддержки</h2>
            <p>Realtime-диалог между пользователем и админом через WebSocket.</p>
          </div>
          <div className="user-pill">
            <span>Статус</span>
            <small>{status === 'connected' ? 'онлайн' : status === 'connecting' ? 'подключение...' : 'офлайн'}</small>
          </div>
        </div>

        <div className="support-admin-grid">
          <div className="support-list stack-sm">
            {conversations.length === 0 ? (
              <div className="empty-state">Пока нет обращений.</div>
            ) : (
              conversations.map((conversation) => (
                <button
                  type="button"
                  key={conversation.id}
                  className={`support-list-item ${selectedConversationId === conversation.id ? 'support-list-item--active' : ''}`}
                  onClick={() => setSelectedConversationId(conversation.id)}
                >
                  <div className="support-list-item__top">
                    <strong>{conversation.user.username}</strong>
                    <span>{conversation.status}</span>
                  </div>
                  <p>{conversation.lastMessage?.text || 'Диалог создан, сообщений пока нет'}</p>
                </button>
              ))
            )}
          </div>

          <div className="stack-md">
            {selectedConversation ? (
              <>
                <div className="section-head">
                  <div>
                    <h3>{selectedConversation.user.username}</h3>
                    <p>{selectedConversation.user.email}</p>
                  </div>
                  <select
                    className="input select"
                    value={selectedConversation.status}
                    onChange={(event) => updateSupportStatus(selectedConversation.id, event.target.value as SupportConversationStatus)}
                  >
                    {supportStatuses.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="chat-box chat-box--admin">
                  {messages.length === 0 ? (
                    <div className="empty-state">В этом диалоге пока нет сообщений.</div>
                  ) : (
                    messages.map((chatMessage) => (
                      <div
                        key={chatMessage.id}
                        className={`chat-message ${chatMessage.authorRole === 'ADMIN' ? 'chat-message--admin' : 'chat-message--user'}`}
                      >
                        <div className="chat-message__meta">
                          <strong>{chatMessage.authorName}</strong>
                          <span>{new Date(chatMessage.createdAt).toLocaleString('ru-RU')}</span>
                        </div>
                        <p>{chatMessage.text}</p>
                      </div>
                    ))
                  )}
                </div>

                {supportError && <div className="error-box">{supportError}</div>}

                <form className="stack-sm" onSubmit={submitSupportMessage}>
                  <textarea
                    className="input textarea"
                    placeholder={selectedConversation.status === 'CLOSED' ? 'Диалог закрыт' : 'Ответить пользователю'}
                    value={supportText}
                    onChange={(event) => setSupportText(event.target.value)}
                    disabled={selectedConversation.status === 'CLOSED'}
                  />
                  <button className="button" disabled={!supportText.trim() || selectedConversation.status === 'CLOSED'}>
                    Отправить ответ
                  </button>
                </form>
              </>
            ) : (
              <div className="empty-state">Выбери обращение слева.</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
