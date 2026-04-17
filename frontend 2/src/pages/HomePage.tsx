import { useEffect, useMemo, useState } from 'react';
import { pizzasApi } from '../api/pizzas';
import { PizzaCard } from '../components/PizzaCard';
import type { Pizza } from '../types';

export function HomePage() {
  const [pizzas, setPizzas] = useState<Pizza[]>([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Все');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    pizzasApi
      .getAll()
      .then(setPizzas)
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => ['Все', ...new Set(pizzas.map((pizza) => pizza.category))], [pizzas]);

  const filtered = pizzas.filter((pizza) => {
    const matchesCategory = category === 'Все' || pizza.category === category;
    const matchesQuery = pizza.name.toLowerCase().includes(query.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="stack-lg">
      <section className="hero">
        <div>
          <span className="eyebrow">Тихий уютный интерфейс</span>
          <h1>Пицца на вечер, после тяжелого дня</h1>
        </div>
        <div className="hero__note">
          <strong>Тестовые входы</strong>
          <p>admin@pizza.com / admin12345</p>
          <p>user@pizza.com / user12345</p>
        </div>
      </section>

      <section className="toolbar">
        <input
          className="input"
          placeholder="Поиск"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <div className="chip-row">
          {categories.map((item) => (
            <button
              key={item}
              className={`chip ${item === category ? 'chip--active' : ''}`}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      {loading ? (
        <div className="empty-state">Загружаем меню</div>
      ) : (
        <section className="pizza-grid">
          {filtered.map((pizza) => (
            <PizzaCard key={pizza.id} pizza={pizza} />
          ))}
        </section>
      )}
    </div>
  );
}
