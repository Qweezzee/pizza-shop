import { useEffect, useState } from 'react';
import { ordersApi } from '../api/orders';
import { useAuth } from '../context/AuthContext';
import type { Order } from '../types';

const statusMap: Record<string, string> = {
  NEW: 'новый',
  CONFIRMED: 'подтверждён',
  COOKING: 'готовится',
  DELIVERING: 'в пути',
  COMPLETED: 'завершён',
  CANCELED: 'отменён',
};

export function OrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!token) return;
    ordersApi.my(token).then(setOrders);
  }, [token]);

  return (
    <section className="stack-md">
      <div className="section-head">
        <h1>Мои заказы</h1>
      </div>

      {!orders.length ? (
        <div className="empty-state">Пусто.</div>
      ) : (
        orders.map((order) => (
          <article className="panel stack-sm" key={order.id}>
            <div className="section-head">
              <div>
                <strong>Заказ #{order.id}</strong>
                <p>{new Date(order.createdAt).toLocaleString('ru-RU')}</p>
              </div>
              <span className="status-badge">{statusMap[order.status]}</span>
            </div>
            <div className="order-items">
              {order.items.map((item) => (
                <div key={item.id} className="order-item-row">
                  <span>
                    {item.pizzaName} · {item.size.toLowerCase()}
                  </span>
                  <span>
                    {item.quantity} × {Math.round(item.price)} ₽
                  </span>
                </div>
              ))}
            </div>
            <strong>Итого: {Math.round(order.totalPrice)} ₽</strong>
          </article>
        ))
      )}
    </section>
  );
}
