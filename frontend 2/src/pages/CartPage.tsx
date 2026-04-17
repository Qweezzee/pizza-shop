import { FormEvent, useState } from 'react';
import { ordersApi } from '../api/orders';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export function CartPage() {
  const { cart, changeQuantity, removeItem, clearCart, refreshCart } = useCart();
  const { token, user } = useAuth();
  const [form, setForm] = useState({ fullName: '', phone: '', address: '', comment: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const submitOrder = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) {
      setMessage('Сначала войди в аккаунт');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      await ordersApi.create(token, form);
      setForm({ fullName: '', phone: '', address: '', comment: '' });
      setMessage('Едет');
      await refreshCart();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Не удалось оформить заказ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="two-column-layout">
      <section className="panel stack-md">
        <div className="section-head">
          <h1>Корзина</h1>
          {!!cart.items.length && (
            <button className="text-button" onClick={() => clearCart()}>
              Очистить всё
            </button>
          )}
        </div>

        {!cart.items.length ? (
          <div className="empty-state">Корзина пока пустая.</div>
        ) : (
          cart.items.map((item) => (
            <article className="cart-row" key={item.id}>
              <div>
                <strong>{item.pizzaSize.pizza.name}</strong>
                <p>
                  {item.pizzaSize.size.toLowerCase()} · {item.pizzaSize.diameterCm} см
                </p>
              </div>
              <div className="cart-row__actions">
                <button onClick={() => changeQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>
                  −
                </button>
                <span>{item.quantity}</span>
                <button onClick={() => changeQuantity(item.id, item.quantity + 1)}>+</button>
              </div>
              <strong>{Math.round(item.quantity * item.pizzaSize.price)} ₽</strong>
              <button className="text-button" onClick={() => removeItem(item.id)}>
                Удалить
              </button>
            </article>
          ))
        )}
      </section>

      <aside className="panel stack-md">
        <div className="section-head">
          <h2>Оформление</h2>
          <strong>{Math.round(cart.totalPrice)} ₽</strong>
        </div>

        {!user ? (
          <div className="empty-state">Чтобы оформить заказ, сначала войди в аккаунт.</div>
        ) : (
          <form className="form stack-md" onSubmit={submitOrder}>
            <input
              className="input"
              placeholder="Имя и фамилия"
              value={form.fullName}
              onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
            />
            <input
              className="input"
              placeholder="Телефон"
              value={form.phone}
              onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
            />
            <textarea
              className="input textarea"
              placeholder="Адрес доставки"
              value={form.address}
              onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
            />
            <textarea
              className="input textarea"
              placeholder="Комментарий к заказу"
              value={form.comment}
              onChange={(event) => setForm((prev) => ({ ...prev, comment: event.target.value }))}
            />
            {message && <div className={message === 'Заказ оформлен' ? 'success-box' : 'error-box'}>{message}</div>}
            <button className="button" disabled={loading || !cart.items.length}>
              {loading ? 'Отправляем...' : 'Оформить заказ'}
            </button>
          </form>
        )}
      </aside>
    </div>
  );
}
