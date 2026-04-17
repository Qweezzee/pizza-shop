import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export function Layout() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const totalCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="container topbar__inner">
          <Link className="brand" to="/">
            <span className="brand__badge">TK</span>
            <div>
              <strong>Hog`s pizza</strong>
              <p>Fast pizza delivery</p>
            </div>
          </Link>

          <nav className="nav">
            <NavLink to="/">Меню</NavLink>
            <NavLink to="/cart">Корзина{totalCount ? ` (${totalCount})` : ''}</NavLink>
            {user && <NavLink to="/orders">Заказы</NavLink>}
            {user && <NavLink to="/support">Поддержка</NavLink>}
            {user?.role === 'ADMIN' && <NavLink to="/admin">Админ</NavLink>}
          </nav>

          <div className="topbar__actions">
            {user ? (
              <>
                <div className="user-pill">
                  <span>{user.username}</span>
                  <small>{user.role === 'ADMIN' ? 'админ' : 'гость'}</small>
                </div>
                <button className="button button--ghost" onClick={logout}>
                  Ливнуть
                </button>
              </>
            ) : (
              <Link className="button button--ghost" to="/auth">
                Войти
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="container main-content">
        <Outlet />
      </main>
    </div>
  );
}
