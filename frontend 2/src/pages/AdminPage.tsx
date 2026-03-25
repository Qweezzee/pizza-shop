import { FormEvent, useEffect, useState } from 'react';
import { ordersApi } from '../api/orders';
import { pizzasApi } from '../api/pizzas';
import { useAuth } from '../context/AuthContext';
import type { Order, OrderStatus, Pizza } from '../types';

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

export function AdminPage() {
  const { token } = useAuth();
  const [pizzas, setPizzas] = useState<Pizza[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [form, setForm] = useState(defaultPizzaForm);
  const [message, setMessage] = useState('');

  const loadData = async () => {
    if (!token) return;
    const [pizzaData, orderData] = await Promise.all([pizzasApi.getAll(), ordersApi.all(token)]);
    setPizzas(pizzaData);
    setOrders(orderData);
  };

  useEffect(() => {
    loadData();
  }, [token]);

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

  const updateStatus = async (id: number, status: OrderStatus) => {
    if (!token) return;
    await ordersApi.changeStatus(token, id, status);
    await loadData();
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
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
