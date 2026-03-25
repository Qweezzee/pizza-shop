import { useMemo, useState } from 'react';
import { ApiError } from '../api/client';
import { useCart } from '../context/CartContext';
import type { Pizza } from '../types';

const sizeTitles = {
  SMALL: 'маленькая',
  MEDIUM: 'средняя',
  LARGE: 'большая',
};

const fallbackImages = [
  'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1574126154517-d1e0d89ef734?auto=format&fit=crop&w=900&q=80',
];

export function PizzaCard({ pizza }: { pizza: Pizza }) {
  const [selectedSizeId, setSelectedSizeId] = useState<number>(pizza.sizes[0]?.id ?? 0);
  const [message, setMessage] = useState('');
  const { addToCart } = useCart();

  const activeSize = useMemo(
    () => pizza.sizes.find((item) => item.id === selectedSizeId) ?? pizza.sizes[0],
    [pizza.sizes, selectedSizeId],
  );

  const image = pizza.imageUrl || fallbackImages[pizza.id % fallbackImages.length];

  const handleAdd = async () => {
    try {
      await addToCart(activeSize.id, 1);
      setMessage('Добавили в корзину');
      setTimeout(() => setMessage(''), 1500);
    } catch (error) {
      if (error instanceof ApiError) {
        setMessage(error.message);
        return;
      }
      setMessage('Не удалось добавить в корзину');
    }
  };

  return (
    <article className="pizza-card">
      <img className="pizza-card__image" src={image} alt={pizza.name} />
      <div className="pizza-card__body">
        <div className="pizza-card__meta">
          <span>{pizza.category}</span>
          <span>{activeSize?.diameterCm} см</span>
        </div>
        <h3>{pizza.name}</h3>
        <p>{pizza.description}</p>

        <div className="size-switcher">
          {pizza.sizes.map((size) => (
            <button
              key={size.id}
              className={size.id === activeSize.id ? 'is-active' : ''}
              onClick={() => setSelectedSizeId(size.id)}
            >
              {sizeTitles[size.size]}
            </button>
          ))}
        </div>

        <div className="pizza-card__footer">
          <div>
            <strong>{Math.round(activeSize?.price ?? 0)} ₽</strong>
            <small>{sizeTitles[activeSize?.size ?? 'SMALL']}</small>
          </div>
          <button className="button" onClick={handleAdd}>
            В корзину
          </button>
        </div>

        {message && <div className="card-message">{message}</div>}
      </div>
    </article>
  );
}
