import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, UserRole, WholesaleStatus } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  try {
    if (!stored || !stored.includes('.')) {
      console.error('Invalid stored password format');
      return false;
    }

    const [hashed, salt] = stored.split(".");
    if (!hashed || !salt) {
      console.error('Invalid password components');
      return false;
    }

    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error('Error comparing passwords:', error);
    return false;
  }
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log('Attempting login for username:', username);
        const user = await storage.getUserByUsername(username);

        if (!user) {
          console.log('User not found:', username);
          return done(null, false, { message: "Invalid username or password" });
        }

        const isValidPassword = await comparePasswords(password, user.password);
        if (!isValidPassword) {
          console.log('Invalid password for user:', username);
          return done(null, false, { message: "Invalid username or password" });
        }

        // Check wholesale account status
        if (user.role === UserRole.WHOLESALE) {
          if (!user.wholesaleStatus || user.wholesaleStatus === WholesaleStatus.PENDING) {
            return done(null, false, { message: "Your wholesale account is pending approval" });
          }
          if (user.wholesaleStatus === WholesaleStatus.REJECTED) {
            return done(null, false, { message: "Your wholesale account application was rejected" });
          }
          if (user.wholesaleStatus === WholesaleStatus.BLOCKED) {
            return done(null, false, { message: "Your wholesale account has been blocked" });
          }
        }

        console.log('Successful login for user:', username, 'with role:', user.role);
        return done(null, user);
      } catch (error) {
        console.error('Error during authentication:', error);
        return done(error);
      }
    })
  );

  passport.serializeUser((user, done) => {
    console.log('Serializing user:', user.id);
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      console.log('Deserializing user:', id);
      const user = await storage.getUser(id);
      if (!user) {
        console.log('User not found during deserialization:', id);
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      console.error('Error deserializing user:', error);
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      console.log("Registration request received:", { ...req.body, password: '***' });

      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const userData = {
        ...req.body,
        password: await hashPassword(req.body.password),
        wholesaleStatus: req.body.role === UserRole.WHOLESALE ? WholesaleStatus.PENDING : null
      };

      console.log("Creating user with data:", { ...userData, password: '***' });
      const user = await storage.createUser(userData);
      console.log("User created:", { ...user, password: '***' });

      if (user.role === UserRole.WHOLESALE) {
        return res.status(201).json({ 
          message: "Your wholesale account has been registered and is pending approval. You will be notified once approved.",
          user 
        });
      }

      // Auto-login for non-wholesale users
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json({ user });
      });
    } catch (error) {
      console.error("Error during registration:", error);
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        console.error("Error during login:", err);
        return next(err);
      }
      if (!user) {
        console.log("Authentication failed:", info?.message);
        return res.status(401).json({ message: info?.message || "Authentication failed" });
      }

      req.login(user, (err) => {
        if (err) {
          console.error("Error logging in user:", err);
          return next(err);
        }
        console.log("User logged in successfully:", { id: user.id, role: user.role });
        res.status(200).json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    console.log("Logging out user:", req.user?.id);
    req.logout((err) => {
      if (err) {
        console.error("Error during logout:", err);
        return next(err);
      }
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      console.log("Unauthorized access attempt to /api/user");
      return res.sendStatus(401);
    }
    res.json(req.user);
  });
}