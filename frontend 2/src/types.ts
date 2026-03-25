export type Role = 'USER' | 'ADMIN';
export type PizzaSizeType = 'SMALL' | 'MEDIUM' | 'LARGE';
export type OrderStatus = 'NEW' | 'CONFIRMED' | 'COOKING' | 'DELIVERING' | 'COMPLETED' | 'CANCELED';

export interface User {
  id: number;
  username: string;
  email: string;
  role: Role;
  createdAt?: string;
}

export interface PizzaSize {
  id: number;
  pizzaId: number;
  size: PizzaSizeType;
  diameterCm: number;
  price: number;
}

export interface Pizza {
  id: number;
  name: string;
  description: string;
  imageUrl?: string | null;
  category: string;
  isActive: boolean;
  sizes: PizzaSize[];
}

export interface CartItem {
  id: number;
  userId: number;
  pizzaSizeId: number;
  quantity: number;
  pizzaSize: PizzaSize & {
    pizza: Pizza;
  };
}

export interface CartResponse {
  items: CartItem[];
  totalPrice: number;
}

export interface OrderItem {
  id: number;
  orderId: number;
  pizzaSizeId: number;
  quantity: number;
  price: number;
  pizzaName: string;
  size: PizzaSizeType;
}

export interface Order {
  id: number;
  userId: number;
  fullName: string;
  phone: string;
  address: string;
  comment?: string | null;
  status: OrderStatus;
  totalPrice: number;
  createdAt: string;
  items: OrderItem[];
  user?: Pick<User, 'id' | 'username' | 'email'>;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}
