import { InsertUser, User, Product, Order, OrderItem, OrderStatus, PouchCategory, PouchFlavor, NicotineStrength } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Initial product data
const initialProducts: Product[] = [
  {
    id: 1,
    name: "Fresh Mint Pouch",
    description: "Refreshing mint nicotine pouch with long-lasting flavor",
    category: PouchCategory.DRY,
    flavor: PouchFlavor.FRESH_MINT,
    strength: NicotineStrength.MG_6,
    price: "15.00",
    wholesalePrice: "8.00",
    stock: 1000,
    minRetailOrder: 5,
    minWholesaleOrder: 100
  },
  {
    id: 2,
    name: "Blueberry Blast",
    description: "Sweet and fruity blueberry nicotine pouch",
    category: PouchCategory.WET,
    flavor: PouchFlavor.BLUEBERRY,
    strength: NicotineStrength.MG_8,
    price: "15.00",
    wholesalePrice: "8.00",
    stock: 1000,
    minRetailOrder: 5,
    minWholesaleOrder: 100
  },
  {
    id: 3,
    name: "Strong Mint",
    description: "Extra strong mint flavor with maximum satisfaction",
    category: PouchCategory.DRY,
    flavor: PouchFlavor.GOD_MINT,
    strength: NicotineStrength.MG_22,
    price: "15.00",
    wholesalePrice: "8.00",
    stock: 1000,
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