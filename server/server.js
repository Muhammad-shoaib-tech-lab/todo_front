import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());
app.use(passport.initialize());

// Load env variables
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/todoapp";
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret"; 
const PORT = process.env.PORT || 5000;

// Connect DB
mongoose
  .connect(MONGO_URI)
  .then(() => console.log(" MongoDB connected"))
  .catch((e) => console.log(" DB Error:", e));

// Models
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ["user", "admin"], default: "user" },
});
const User = mongoose.model("User", userSchema);

const todoSchema = new mongoose.Schema({
  title: String,
  description: String,
  dueDate: Date,
  priority: String,
  category: String,
  location: String,
  reminder: String,
  tag: String,
  assignTo: String,
  userEmail: String,
});
const Todo = mongoose.model("Todo", todoSchema);

// JWT Strategy
const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: JWT_SECRET,
};

passport.use(
  new JwtStrategy(opts, async (jwt_payload, done) => {
    try {
      const user = await User.findById(jwt_payload.id).select("-password");
      if (user) return done(null, user);
      return done(null, false);
    } catch (err) {
      return done(err, false);
    }
  })
);

// Middleware
const requireAuth = passport.authenticate("jwt", { session: false });

const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied: Admins only" });
  }
  next();
};

// ================= AUTH =================
// Register
app.post("/api/register", async (req, res) => {
  const { email, password, role } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const user = new User({ email, password, role: role || "user" });
    await user.save();

    res.json({ message: "Registered successfully" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || user.password !== password) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ token, email: user.email, role: user.role });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ================= TODOS =================
// Create Todo
app.post("/api/todos", requireAuth, async (req, res) => {
  try {
    const todo = new Todo(req.body);
    await todo.save();
    res.json(todo);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Get Todos by User Email
app.get("/api/todos/:userEmail", requireAuth, async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.email !== req.params.userEmail) {
      return res.status(403).json({ message: "Not allowed" });
    }
    const todos = await Todo.find({ userEmail: req.params.userEmail });
    res.json(todos);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Get all todos (admin only)
app.get("/api/todos", requireAuth, requireAdmin, async (req, res) => {
  try {
    const todos = await Todo.find();
    res.json(todos);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Update Todo
app.put("/api/todos/:id", requireAuth, async (req, res) => {
  try {
    const updatedTodo = await Todo.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updatedTodo) return res.status(404).json({ error: "Todo not found" });
    res.json(updatedTodo);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete Todo
app.delete("/api/todos/:id", requireAuth, async (req, res) => {
  try {
    const todo = await Todo.findByIdAndDelete(req.params.id);
    if (!todo) return res.status(404).json({ message: "Todo not found" });
    res.json({ message: "Deleted successfully" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ================= USERS =================
// Get all users (admin)
app.get("/api/users", requireAuth, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({}, "-password");
    res.json(users);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Get user by email (admin)
app.get("/api/getUser", requireAuth, requireAdmin, async (req, res) => {
  const email = req.query.email;
  if (!email)
    return res.status(400).json({ message: "Missing email parameter" });

  try {
    const user = await User.findOne({ email }, "-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Delete user (and their todos)
app.delete("/api/users/:id", requireAuth, requireAdmin, async (req, res) => {
  const userId = req.params.id;
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    await Todo.deleteMany({ userEmail: user.email });
    await User.findByIdAndDelete(userId);

    res.json({ message: "User and their todos deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error deleting user" });
  }
});

// Update user (email, role)
app.put("/api/users/:id", requireAuth, requireAdmin, async (req, res) => {
  const userId = req.params.id;
  const { email, role } = req.body;

  try {
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { email, role },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(updatedUser);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Update Email + Todos
app.put("/api/todos/updateEmail", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { oldEmail, newEmail, newRole } = req.body;

    if (!oldEmail || !newEmail) {
      return res
        .status(400)
        .json({ error: "Both oldEmail and newEmail are required" });
    }

    const todosResult = await Todo.updateMany(
      { $or: [{ assignTo: oldEmail }, { userEmail: oldEmail }] },
      { $set: { assignTo: newEmail, userEmail: newEmail } }
    );

    const userResult = await User.findOneAndUpdate(
      { email: oldEmail },
      { email: newEmail, ...(newRole && { role: newRole }) },
      { new: true }
    );

    if (!userResult) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      message: "Email (and role if provided) updated successfully",
      updatedTodos: todosResult.modifiedCount,
      updatedUser: userResult,
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ================= SERVER =================
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));






















