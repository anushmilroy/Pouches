import { InsertUser, User, Product, Order, OrderItem, OrderStatus, PouchCategory, PouchFlavor, NicotineStrength, WholesaleStatus, UserRole } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

const initialProducts: Product[] = [
  {
    id: 1,
    name: "PUXX Apple Mint",
    description: "Fresh and crisp apple mint nicotine pouch",
    category: "DRY",
    flavor: "APPLE_MINT",
    strength: "MG_6",
    price: "15.00",
    wholesalePrice: "8.00",
    stock: 10000,
    minRetailOrder: 5,
    minWholesaleOrder: 100,
    imagePath: "attached_assets/apple-mint-6mg.jpg"
  },
  {
    id: 2,
    name: "PUXX Apple Mint",
    description: "Fresh and crisp apple mint nicotine pouch",
    category: "DRY",
    flavor: "APPLE_MINT",
    strength: "MG_12",
    price: "15.00",
    wholesalePrice: "8.00",
    stock: 5000,
    minRetailOrder: 5,
    minWholesaleOrder: 100,
    imagePath: "attached_assets/apple-mint-12mg.jpg"
  },
  {
    id: 3,
    name: "PUXX Cool Mint",
    description: "Refreshing cool mint nicotine pouch",
    category: "DRY",
    flavor: "COOL_MINT",
    strength: "MG_6",
    price: "15.00",
    wholesalePrice: "8.00",
    stock: 10000,
    minRetailOrder: 5,
    minWholesaleOrder: 100,
    imagePath: "attached_assets/cool-mint-6mg.jpg"
  },
  {
    id: 4,
    name: "PUXX Cool Mint",
    description: "Refreshing cool mint nicotine pouch",
    category: "DRY",
    flavor: "COOL_MINT",
    strength: "MG_12",
    price: "15.00",
    wholesalePrice: "8.00",
    stock: 5000,
    minRetailOrder: 5,
    minWholesaleOrder: 100,
    imagePath: "attached_assets/cool-mint-12mg.jpg"
  },
  {
    id: 5,
    name: "PUXX Cool Mint",
    description: "Refreshing cool mint nicotine pouch",
    category: "DRY",
    flavor: "COOL_MINT",
    strength: "MG_16",
    price: "15.00",
    wholesalePrice: "8.00",
    stock: 5000,
    minRetailOrder: 5,
    minWholesaleOrder: 100,
    imagePath: "attached_assets/cool-mint-16mg.jpg"
  },
  {
    id: 6,
    name: "PUXX Cool Mint",
    description: "Refreshing cool mint nicotine pouch",
    category: "DRY",
    flavor: "COOL_MINT",
    strength: "MG_22",
    price: "15.00",
    wholesalePrice: "8.00",
    stock: 5000,
    minRetailOrder: 5,
    minWholesaleOrder: 100,
    imagePath: "attached_assets/cool-mint-22mg.jpg"
  }
];

const defaultAdmin = {
  username: "admin",
  password: "72af7034f304259be4f53457166e65040ca15f9018010b53daebe89bb2dd6a103498af96884771efb0268c07805362a6fda9852327174501144d94c9889d787f.9506be6ac397d4f92673f19ab0ae36c7", // This is hashed 'admin123'
  role: "ADMIN"
};

interface Promotion {
  id: number;
  name: string;
  description: string;
  discount: string; //e.g., "10%" or "5.00"
  startDate: Date;
  endDate: Date;
  productIds: number[];
}

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

  // Referral operations
  getUserByReferralCode(code: string): Promise<User | undefined>;
  getUserEarnings(userId: number): Promise<{ total: string; orders: Order[] }>;
  generateReferralCode(userId: number): Promise<string>;

  // Promotion operations
  getPromotions(): Promise<Promotion[]>;
  createPromotion(promotion: Omit<Promotion, "id">): Promise<Promotion>;
  updatePromotion(id: number, data: Partial<Promotion>): Promise<Promotion>;

  // Wholesale management
  getWholesaleUsers(): Promise<User[]>;
  updateWholesaleStatus(id: number, status: keyof typeof WholesaleStatus): Promise<User>;
  updateCustomPricing(id: number, customPricing: Record<string, number>): Promise<User>;
  blockWholesaleUser(id: number): Promise<User>;
  unblockWholesaleUser(id: number): Promise<User>;

  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private products: Map<number, Product>;
  private orders: Map<number, Order>;
  private orderItems: Map<number, OrderItem>;
  private promotions: Map<number, Promotion>;
  private currentId: { [key: string]: number };
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.promotions = new Map();
    this.currentId = { users: 1, products: 7, orders: 1, orderItems: 1, promotions: 1 };
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });

    // Initialize products
    initialProducts.forEach(product => {
      this.products.set(product.id, product);
    });

    // Create default admin user
    this.createUser({
      ...defaultAdmin,
      id: 1
    });

    console.log("Storage initialized with products:", this.getProducts());
    console.log("Default admin user created");
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
    const user: User = {
      id,
      username: insertUser.username,
      password: insertUser.password,
      role: insertUser.role,
      referrerId: null,
      referralCode: null,
      commission: null,
      createdAt: new Date(),
      wholesaleStatus: insertUser.wholesaleStatus || null,
      customPricing: null
    };
    console.log("Creating user:", { ...user, password: '***' });
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

  async getUserByReferralCode(code: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.referralCode === code,
    );
  }

  async getUserEarnings(userId: number): Promise<{ total: string; orders: Order[] }> {
    const orders = Array.from(this.orders.values()).filter(
      (order) => order.referrerId === userId,
    );

    const total = orders.reduce((sum, order) => {
      return sum + parseFloat(order.commissionAmount?.toString() || "0");
    }, 0);

    return {
      total: total.toFixed(2),
      orders
    };
  }

  async generateReferralCode(userId: number): Promise<string> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");

    if (user.referralCode) {
      return user.referralCode;
    }

    // Generate a unique referral code based on username and random string
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    const referralCode = `${user.username.substring(0, 4).toUpperCase()}-${randomStr}`;

    // Update user with new referral code
    user.referralCode = referralCode;
    this.users.set(userId, user);

    return referralCode;
  }

  async getPromotions(): Promise<Promotion[]> {
    return Array.from(this.promotions.values());
  }

  async createPromotion(promotion: Omit<Promotion, "id">): Promise<Promotion> {
    const id = this.currentId.promotions++;
    const newPromotion = { ...promotion, id };
    this.promotions.set(id, newPromotion);
    return newPromotion;
  }

  async updatePromotion(id: number, data: Partial<Promotion>): Promise<Promotion> {
    const promotion = this.promotions.get(id);
    if (!promotion) throw new Error("Promotion not found");

    const updatedPromotion = { ...promotion, ...data };
    this.promotions.set(id, updatedPromotion);
    return updatedPromotion;
  }

  async getWholesaleUsers(): Promise<User[]> {
    console.log("Fetching wholesale users");
    const allUsers = Array.from(this.users.values());
    console.log("All users:", allUsers.map(u => ({ ...u, password: '***' })));
    const wholesaleUsers = allUsers.filter(
      (user) => user.role === UserRole.WHOLESALE
    );
    console.log("Filtered wholesale users:", wholesaleUsers.map(u => ({ ...u, password: '***' })));
    return wholesaleUsers;
  }

  async updateWholesaleStatus(id: number, status: keyof typeof WholesaleStatus): Promise<User> {
    const user = await this.getUser(id);
    if (!user) throw new Error("User not found");

    user.wholesaleStatus = status;
    this.users.set(id, user);
    return user;
  }

  async updateCustomPricing(id: number, customPricing: Record<string, number>): Promise<User> {
    const user = await this.getUser(id);
    if (!user) throw new Error("User not found");

    user.customPricing = customPricing;
    this.users.set(id, user);
    return user;
  }

  async blockWholesaleUser(id: number): Promise<User> {
    const user = await this.getUser(id);
    if (!user) throw new Error("User not found");
    if (user.role !== "WHOLESALE") throw new Error("User is not a wholesale account");

    user.wholesaleStatus = "BLOCKED";
    this.users.set(id, user);
    return user;
  }

  async unblockWholesaleUser(id: number): Promise<User> {
    const user = await this.getUser(id);
    if (!user) throw new Error("User not found");
    if (user.role !== "WHOLESALE") throw new Error("User is not a wholesale account");

    user.wholesaleStatus = "APPROVED";
    this.users.set(id, user);
    return user;
  }
}

export const storage = new MemStorage();