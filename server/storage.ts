import { InsertUser, User, Product, Order, OrderItem, OrderStatus, PouchCategory, PouchFlavor, NicotineStrength } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Initial product data
const initialProducts: Product[] = [
  {
    id: 1,
    name: "PUXX Apple Mint",
    description: "Fresh and crisp apple mint nicotine pouch",
    category: PouchCategory.DRY,
    flavor: PouchFlavor.APPLE_MINT,
    strength: NicotineStrength.MG_6,
    price: "15.00",
    wholesalePrice: "8.00",
    stock: 10000,
    minRetailOrder: 5,
    minWholesaleOrder: 100
  },
  {
    id: 2,
    name: "PUXX Apple Mint",
    description: "Fresh and crisp apple mint nicotine pouch",
    category: PouchCategory.DRY,
    flavor: PouchFlavor.APPLE_MINT,
    strength: NicotineStrength.MG_12,
    price: "15.00",
    wholesalePrice: "8.00",
    stock: 5000,
    minRetailOrder: 5,
    minWholesaleOrder: 100
  },
  {
    id: 3,
    name: "PUXX Cool Mint",
    description: "Refreshing cool mint nicotine pouch",
    category: PouchCategory.DRY,
    flavor: PouchFlavor.COOL_MINT,
    strength: NicotineStrength.MG_6,
    price: "15.00",
    wholesalePrice: "8.00",
    stock: 10000,
    minRetailOrder: 5,
    minWholesaleOrder: 100
  },
  {
    id: 4,
    name: "PUXX Cool Mint",
    description: "Refreshing cool mint nicotine pouch",
    category: PouchCategory.DRY,
    flavor: PouchFlavor.COOL_MINT,
    strength: NicotineStrength.MG_12,
    price: "15.00",
    wholesalePrice: "8.00",
    stock: 5000,
    minRetailOrder: 5,
    minWholesaleOrder: 100
  },
  {
    id: 5,
    name: "PUXX Cool Mint",
    description: "Refreshing cool mint nicotine pouch",
    category: PouchCategory.DRY,
    flavor: PouchFlavor.COOL_MINT,
    strength: NicotineStrength.MG_16,
    price: "15.00",
    wholesalePrice: "8.00",
    stock: 5000,
    minRetailOrder: 5,
    minWholesaleOrder: 100
  },
  {
    id: 6,
    name: "PUXX Cool Mint",
    description: "Refreshing cool mint nicotine pouch",
    category: PouchCategory.DRY,
    flavor: PouchFlavor.COOL_MINT,
    strength: NicotineStrength.MG_22,
    price: "15.00",
    wholesalePrice: "8.00",
    stock: 5000,
    minRetailOrder: 5,
    minWholesaleOrder: 100
  },
  {
    id: 7,
    name: "PUXX Peppermint",
    description: "Classic peppermint nicotine pouch",
    category: PouchCategory.DRY,
    flavor: PouchFlavor.PEPPERMINT,
    strength: NicotineStrength.MG_6,
    price: "15.00",
    wholesalePrice: "8.00",
    stock: 10000,
    minRetailOrder: 5,
    minWholesaleOrder: 100
  },
  {
    id: 8,
    name: "PUXX Peppermint",
    description: "Classic peppermint nicotine pouch",
    category: PouchCategory.DRY,
    flavor: PouchFlavor.PEPPERMINT,
    strength: NicotineStrength.MG_12,
    price: "15.00",
    wholesalePrice: "8.00",
    stock: 5000,
    minRetailOrder: 5,
    minWholesaleOrder: 100
  },
  {
    id: 9,
    name: "PUXX Peppermint",
    description: "Classic peppermint nicotine pouch",
    category: PouchCategory.DRY,
    flavor: PouchFlavor.PEPPERMINT,
    strength: NicotineStrength.MG_16,
    price: "15.00",
    wholesalePrice: "8.00",
    stock: 5000,
    minRetailOrder: 5,
    minWholesaleOrder: 100
  },
  {
    id: 10,
    name: "PUXX Peppermint",
    description: "Classic peppermint nicotine pouch",
    category: PouchCategory.DRY,
    flavor: PouchFlavor.PEPPERMINT,
    strength: NicotineStrength.MG_22,
    price: "15.00",
    wholesalePrice: "8.00",
    stock: 5000,
    minRetailOrder: 5,
    minWholesaleOrder: 100
  },
  {
    id: 11,
    name: "PUXX Cola",
    description: "Refreshing cola flavored nicotine pouch",
    category: PouchCategory.DRY,
    flavor: PouchFlavor.COLA,
    strength: NicotineStrength.MG_6,
    price: "15.00",
    wholesalePrice: "8.00",
    stock: 5000,
    minRetailOrder: 5,
    minWholesaleOrder: 100
  },
  {
    id: 12,
    name: "PUXX Cola",
    description: "Refreshing cola flavored nicotine pouch",
    category: PouchCategory.DRY,
    flavor: PouchFlavor.COLA,
    strength: NicotineStrength.MG_12,
    price: "15.00",
    wholesalePrice: "8.00",
    stock: 5000,
    minRetailOrder: 5,
    minWholesaleOrder: 100
  },
  {
    id: 13,
    name: "PUXX Cola",
    description: "Refreshing cola flavored nicotine pouch",
    category: PouchCategory.DRY,
    flavor: PouchFlavor.COLA,
    strength: NicotineStrength.MG_16,
    price: "15.00",
    wholesalePrice: "8.00",
    stock: 5000,
    minRetailOrder: 5,
    minWholesaleOrder: 100
  },
  {
    id: 14,
    name: "PUXX Spearmint",
    description: "Fresh spearmint nicotine pouch",
    category: PouchCategory.DRY,
    flavor: PouchFlavor.SPEARMINT,
    strength: NicotineStrength.MG_6,
    price: "15.00",
    wholesalePrice: "8.00",
    stock: 10000,
    minRetailOrder: 5,
    minWholesaleOrder: 100
  },
  {
    id: 15,
    name: "PUXX Spearmint",
    description: "Fresh spearmint nicotine pouch",
    category: PouchCategory.DRY,
    flavor: PouchFlavor.SPEARMINT,
    strength: NicotineStrength.MG_12,
    price: "15.00",
    wholesalePrice: "8.00",
    stock: 5000,
    minRetailOrder: 5,
    minWholesaleOrder: 100
  },
  {
    id: 16,
    name: "PUXX Spearmint",
    description: "Fresh spearmint nicotine pouch",
    category: PouchCategory.DRY,
    flavor: PouchFlavor.SPEARMINT,
    strength: NicotineStrength.MG_16,
    price: "15.00",
    wholesalePrice: "8.00",
    stock: 5000,
    minRetailOrder: 5,
    minWholesaleOrder: 100
  },
  {
    id: 17,
    name: "PUXX Spearmint",
    description: "Fresh spearmint nicotine pouch",
    category: PouchCategory.DRY,
    flavor: PouchFlavor.SPEARMINT,
    strength: NicotineStrength.MG_22,
    price: "15.00",
    wholesalePrice: "8.00",
    stock: 5000,
    minRetailOrder: 5,
    minWholesaleOrder: 100
  },
  {
    id: 18,
    name: "PUXX Watermelon",
    description: "Sweet watermelon nicotine pouch",
    category: PouchCategory.DRY,
    flavor: PouchFlavor.WATERMELON,
    strength: NicotineStrength.MG_6,
    price: "15.00",
    wholesalePrice: "8.00",
    stock: 5000,
    minRetailOrder: 5,
    minWholesaleOrder: 100
  },
  {
    id: 19,
    name: "PUXX Watermelon",
    description: "Sweet watermelon nicotine pouch",
    category: PouchCategory.DRY,
    flavor: PouchFlavor.WATERMELON,
    strength: NicotineStrength.MG_16,
    price: "15.00",
    wholesalePrice: "8.00",
    stock: 5000,
    minRetailOrder: 5,
    minWholesaleOrder: 100
  },
  {
    id: 20,
    name: "PUXX Cherry",
    description: "Sweet cherry nicotine pouch",
    category: PouchCategory.DRY,
    flavor: PouchFlavor.CHERRY,
    strength: NicotineStrength.MG_6,
    price: "15.00",
    wholesalePrice: "8.00",
    stock: 5000,
    minRetailOrder: 5,
    minWholesaleOrder: 100
  },
  {
    id: 21,
    name: "PUXX Cherry",
    description: "Sweet cherry nicotine pouch",
    category: PouchCategory.DRY,
    flavor: PouchFlavor.CHERRY,
    strength: NicotineStrength.MG_16,
    price: "15.00",
    wholesalePrice: "8.00",
    stock: 5000,
    minRetailOrder: 5,
    minWholesaleOrder: 100
  }
];

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserCommission(id: number, commission: number): Promise<User>;

  // Product operations
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;

  // Order operations
  createOrder(order: Order): Promise<Order>;
  getOrder(id: number): Promise<Order | undefined>;
  getUserOrders(userId: number): Promise<Order[]>;
  getDistributorOrders(distributorId: number): Promise<Order[]>;
  updateOrderStatus(id: number, status: keyof typeof OrderStatus): Promise<Order>;

  // Order items
  createOrderItem(item: OrderItem): Promise<OrderItem>;
  getOrderItems(orderId: number): Promise<OrderItem[]>;

  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private products: Map<number, Product>;
  private orders: Map<number, Order>;
  private orderItems: Map<number, OrderItem>;
  private currentId: { [key: string]: number };
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.currentId = { users: 1, products: 4, orders: 1, orderItems: 1 };
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });

    // Initialize products
    initialProducts.forEach(product => {
      this.products.set(product.id, product);
    });

    console.log("Storage initialized with products:", this.getProducts());
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId.users++;
    const user = { id, commission: "0", ...insertUser };
    this.users.set(id, user);
    return user;
  }

  async updateUserCommission(id: number, commission: number): Promise<User> {
    const user = await this.getUser(id);
    if (!user) throw new Error("User not found");
    user.commission = commission.toString();
    this.users.set(id, user);
    return user;
  }

  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createOrder(order: Order): Promise<Order> {
    const id = this.currentId.orders++;
    const newOrder = { ...order, id };
    this.orders.set(id, newOrder);
    return newOrder;
  }

  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getUserOrders(userId: number): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(
      (order) => order.userId === userId,
    );
  }

  async getDistributorOrders(distributorId: number): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(
      (order) => order.distributorId === distributorId,
    );
  }

  async updateOrderStatus(id: number, status: keyof typeof OrderStatus): Promise<Order> {
    const order = await this.getOrder(id);
    if (!order) throw new Error("Order not found");
    const updatedOrder = { ...order, status };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  async createOrderItem(item: OrderItem): Promise<OrderItem> {
    const id = this.currentId.orderItems++;
    const newItem = { ...item, id };
    this.orderItems.set(id, newItem);
    return newItem;
  }

  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return Array.from(this.orderItems.values()).filter(
      (item) => item.orderId === orderId,
    );
  }
}

export const storage = new MemStorage();