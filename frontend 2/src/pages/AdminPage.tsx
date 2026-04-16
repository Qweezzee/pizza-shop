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

const orderStatusLabels: Record<OrderStatus, string> = {
  NEW: 'Новый',
  CONFIRMED: 'Подтверждён',
  COOKING: 'Готовится',
  DELIVERING: 'В пути',
  COMPLETED: 'Завершён',
  CANCELED: 'Отменён',
};

const supportStatusLabels: Record<SupportConversationStatus, string> = {
  OPEN: 'Открыт',
  CLOSED: 'Закрыт',
};

const sizeLabels: Record<string, string> = {
  SMALL: 'Маленькая',
  MEDIUM: 'Средняя',
  LARGE: 'Большая',
};

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

  const openConversationsCount = conversations.filter((item) => item.status === 'OPEN').length;
  const newOrdersCount = orders.filter((item) => item.status === 'NEW').length;
  const connectionLabel = status === 'connected' ? 'Онлайн' : status === 'connecting' ? 'Подключение…' : 'Офлайн';

  return (
    <div className="admin-layout stack-lg">
      <section className="admin-hero panel">
        <div>
          <span className="eyebrow">Панель управления</span>
          <h1>Админка</h1>
          <p>Управляй меню, заказами и поддержкой в одном аккуратном рабочем пространстве.</p>
        </div>

        <div className="admin-kpi-grid">
          <div className="admin-kpi-card">
            <span>Пиццы в меню</span>
            <strong>{pizzas.length}</strong>
            <small>Доступные позиции каталога</small>
          </div>
          <div className="admin-kpi-card">
            <span>Новые заказы</span>
            <strong>{newOrdersCount}</strong>
            <small>Требуют подтверждения</small>
          </div>
          <div className="admin-kpi-card">
            <span>Открытые чаты</span>
            <strong>{openConversationsCount}</strong>
            <small>Пользователи ждут ответ</small>
          </div>
        </div>
      </section>

      <section className="two-column-layout admin-top-grid">
        <article className="panel stack-md">
          <div className="section-head">
            <div>
              <h2>Добавить пиццу</h2>
              <p>Заполни карточку и сразу добавь новую позицию в каталог.</p>
            </div>
          </div>
          <form className="form stack-md" onSubmit={createPizza}>
            <div className="admin-form-grid">
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
            </div>
            <input
              className="input"
              placeholder="Ссылка на картинку"
              value={form.imageUrl}
              onChange={(event) => setForm((prev) => ({ ...prev, imageUrl: event.target.value }))}
            />
            <textarea
              className="input textarea"
              placeholder="Краткое описание"
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            />

            <div className="stack-sm">
              <div className="section-head">
                <h3>Размеры и цены</h3>
                <p>Диаметр в см и стоимость в ₽</p>
              </div>
              {form.sizes.map((size, index) => (
                <div className="admin-size-card" key={size.size}>
                  <div>
                    <strong>{sizeLabels[size.size] ?? size.size}</strong>
                    <p>{size.size}</p>
                  </div>
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
            </div>
            {message && <div className="success-box">{message}</div>}
            <button className="button">Сохранить пиццу</button>
          </form>
        </article>

        <article className="panel stack-md">
          <div className="section-head">
            <div>
              <h2>Позиции в меню</h2>
              <p>Управление текущими карточками пиццы.</p>
            </div>
            <span className="status-badge">{pizzas.length} шт.</span>
          </div>
          <div className="admin-entity-list stack-sm">
            {pizzas.map((pizza) => (
              <div className="admin-entity-card" key={pizza.id}>
                <div>
                  <strong>{pizza.name}</strong>
                  <p>{pizza.category}</p>
                </div>
                <button className="button button--ghost" onClick={() => hidePizza(pizza.id)}>
                  Скрыть
                </button>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="panel stack-md">
        <div className="section-head">
          <div>
            <h2>Заказы</h2>
            <p>Следи за потоком заказов и быстро меняй их статусы.</p>
          </div>
          <span className="status-badge">Всего: {orders.length}</span>
        </div>
        <div className="admin-orders-grid">
          {orders.map((order) => (
            <article className="admin-order-card" key={order.id}>
              <div className="admin-order-card__head">
                <div>
                  <strong>Заказ #{order.id}</strong>
                  <p>{order.user?.username} · {order.fullName}</p>
                </div>
                <span className={`status-badge admin-order-badge admin-order-badge--${order.status.toLowerCase()}`}>
                  {orderStatusLabels[order.status]}
                </span>
              </div>

              <div className="admin-order-card__meta">
                <span>{order.phone}</span>
                <span>{Math.round(order.totalPrice)} ₽</span>
                <span>{new Date(order.createdAt).toLocaleString('ru-RU')}</span>
              </div>

              <select
                className="input select"
                value={order.status}
                onChange={(event) => updateStatus(order.id, event.target.value as OrderStatus)}
              >
                {statuses.map((item) => (
                  <option key={item} value={item}>
                    {orderStatusLabels[item]}
                  </option>
                ))}
              </select>
            </article>
          ))}
        </div>
      </section>

      <section className="panel stack-md support-admin-panel">
        <div className="section-head">
          <div>
            <h2>Поддержка</h2>
            <p>Открывай обращения, отвечай пользователям и закрывай диалоги без лишнего шума.</p>
          </div>
          <div className="user-pill user-pill--status">
            <span>WebSocket</span>
            <small>{connectionLabel}</small>
          </div>
        </div>

        <div className="support-admin-grid support-admin-grid--enhanced">
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
                    <span className={`support-status-pill support-status-pill--${conversation.status.toLowerCase()}`}>
                      {supportStatusLabels[conversation.status]}
                    </span>
                  </div>
                  <p>{conversation.lastMessage?.text || 'Диалог создан, сообщений пока нет'}</p>
                  <small>{conversation.lastMessage ? new Date(conversation.lastMessage.createdAt).toLocaleString('ru-RU') : 'Без активности'}</small>
                </button>
              ))
            )}
          </div>

          <div className="support-thread-card stack-md">
            {selectedConversation ? (
              <>
                <div className="support-thread-card__header">
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
                        {supportStatusLabels[item]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="chat-box chat-box--admin support-thread-box">
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

                <form className="support-compose" onSubmit={submitSupportMessage}>
                  <textarea
                    className="input textarea support-compose__textarea"
                    placeholder={selectedConversation.status === 'CLOSED' ? 'Диалог закрыт' : 'Ответить пользователю'}
                    value={supportText}
                    onChange={(event) => setSupportText(event.target.value)}
                    disabled={selectedConversation.status === 'CLOSED'}
                  />
                  <div className="support-compose__footer">
                    <p>
                      {selectedConversation.status === 'CLOSED'
                        ? 'Чтобы отправить сообщение, снова открой диалог.'
                        : 'Ответ отправится в чат сразу после нажатия кнопки.'}
                    </p>
                    <button className="button" disabled={!supportText.trim() || selectedConversation.status === 'CLOSED'}>
                      Отправить ответ
                    </button>
                  </div>
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
