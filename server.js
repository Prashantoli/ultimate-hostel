import express from "express"
import mongoose from "mongoose"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import cors from "cors"
import path from "path"
import { fileURLToPath } from "url"
import HostelRecommendationEngine from "./recommendation-engine.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000
const JWT_SECRET = process.env.JWT_SECRET || "nepal-hostel-finder-secret-key"

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, "public")))

// Initialize recommendation engine
const recommendationEngine = new HostelRecommendationEngine()

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/nepal_hostel_finder"

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err))

// User Schema
const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
  },
  { timestamps: true },
)

const User = mongoose.model("User", userSchema)

// Hostel Schema
const hostelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    location: { type: String, required: true, enum: ["Kathmandu", "Lalitpur", "Bhaktapur"] },
    price: { type: Number, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    type: { type: String, required: true, enum: ["Boys", "Girls", "Mixed"] },
    capacity: { type: Number, required: true },
    image: { type: String },
    description: { type: String },
    amenities: { type: [String], default: [] },
    contact: { type: String },
  },
  { timestamps: true },
)

const Hostel = mongoose.model("Hostel", hostelSchema)

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    return res.status(401).json({ message: "Access token required" })
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token" })
    }
    req.user = user
    next()
  })
}

// Admin middleware
const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" })
  }
  next()
}

// Initialize default data
async function initializeData() {
  try {
    // Create admin user if it doesn't exist
    const adminExists = await User.findOne({ email: "admin@nepalhostel.com" })
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash("admin123", 10)
      await User.create({
        username: "admin",
        email: "admin@nepalhostel.com",
        password: hashedPassword,
        role: "admin",
      })
      console.log("Admin user created")
    }

    // Create sample hostels if none exist
    const hostelCount = await Hostel.countDocuments()
    if (hostelCount === 0) {
      const sampleHostels = [
        {
          name: "Kathmandu Boys Hostel",
          location: "Kathmandu",
          price: 8000,
          rating: 4.2,
          type: "Boys",
          capacity: 50,
          image: "/placeholder.svg?height=200&width=350",
          description: "A comfortable boys hostel in the heart of Kathmandu with modern facilities.",
          amenities: ["WiFi", "Mess", "Laundry", "Study Room", "24/7 Security"],
          contact: "9841234567",
        },
        {
          name: "Lalitpur Girls Residence",
          location: "Lalitpur",
          price: 12000,
          rating: 4.5,
          type: "Girls",
          capacity: 30,
          image: "/placeholder.svg?height=200&width=350",
          description: "Safe and secure girls hostel in Lalitpur with excellent amenities.",
          amenities: ["WiFi", "Mess", "Gym", "Library", "CCTV", "Warden"],
          contact: "9851234567",
        },
        {
          name: "Bhaktapur Mixed Hostel",
          location: "Bhaktapur",
          price: 6000,
          rating: 3.8,
          type: "Mixed",
          capacity: 40,
          image: "/placeholder.svg?height=200&width=350",
          description: "Budget-friendly mixed hostel in historic Bhaktapur city.",
          amenities: ["WiFi", "Shared Kitchen", "Common Room", "Parking"],
          contact: "9861234567",
        },
        {
          name: "Thamel Boys Lodge",
          location: "Kathmandu",
          price: 15000,
          rating: 4.3,
          type: "Boys",
          capacity: 25,
          image: "/placeholder.svg?height=200&width=350",
          description: "Premium boys hostel in Thamel area with luxury facilities.",
          amenities: ["WiFi", "AC Rooms", "Mess", "Gym", "Recreation Room"],
          contact: "9871234567",
        },
        {
          name: "Patan Girls Hostel",
          location: "Lalitpur",
          price: 9000,
          rating: 4.1,
          type: "Girls",
          capacity: 35,
          image: "/placeholder.svg?height=200&width=350",
          description: "Well-maintained girls hostel near Patan Durbar Square.",
          amenities: ["WiFi", "Mess", "Study Hall", "Medical Room", "Security"],
          contact: "9881234567",
        },
        {
          name: "Bhaktapur Heritage Boys",
          location: "Bhaktapur",
          price: 7500,
          rating: 4.0,
          type: "Boys",
          capacity: 45,
          image: "/placeholder.svg?height=200&width=350",
          description: "Traditional style boys hostel with modern amenities in Bhaktapur.",
          amenities: ["WiFi", "Traditional Mess", "Cultural Programs", "Library"],
          contact: "9891234567",
        },
        {
          name: "New Road Mixed Residence",
          location: "Kathmandu",
          price: 11000,
          rating: 4.4,
          type: "Mixed",
          capacity: 60,
          image: "/placeholder.svg?height=200&width=350",
          description: "Modern mixed hostel in the commercial heart of Kathmandu.",
          amenities: ["WiFi", "Cafeteria", "Study Rooms", "Elevator", "Backup Power"],
          contact: "9801234567",
        },
        {
          name: "Lalitpur Premium Girls",
          location: "Lalitpur",
          price: 18000,
          rating: 4.7,
          type: "Girls",
          capacity: 20,
          image: "/placeholder.svg?height=200&width=350",
          description: "Luxury girls hostel with premium facilities and services.",
          amenities: ["WiFi", "AC", "Private Bathrooms", "Spa", "Concierge", "Transport"],
          contact: "9811234567",
        },
      ]

      await Hostel.insertMany(sampleHostels)
      console.log("Sample hostels created")
    }
  } catch (error) {
    console.error("Error initializing data:", error)
  }
}

// Routes

// Auth routes
app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body

    // Find user by username or email
    const user = await User.findOne({
      $or: [{ username }, { email: username }],
    })

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    const token = jwt.sign({ userId: user._id, username: user.username, role: user.role }, JWT_SECRET, {
      expiresIn: "24h",
    })

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, email, phone, password } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    })

    if (existingUser) {
      return res.status(400).json({ message: "Username or email already exists" })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = new User({
      username,
      email,
      phone,
      password: hashedPassword,
    })

    await user.save()

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    })
  } catch (error) {
    console.error("Registration error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Recommendation API routes
app.post("/api/recommendations", authenticateToken, async (req, res) => {
  try {
    const { userId, preferences, context } = req.body
    const hostels = await Hostel.find()

    // Update user profile with preferences
    recommendationEngine.updateUserProfile(userId, preferences)

    // Get hybrid recommendations
    const recommendations = recommendationEngine.hybridRecommendation(userId, hostels, preferences, context)

    res.json({ recommendations })
  } catch (error) {
    console.error("Error generating recommendations:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.post("/api/interactions", authenticateToken, async (req, res) => {
  try {
    const { hostelId, interactionType, rating } = req.body
    const userId = req.user.userId

    // Track user interaction
    recommendationEngine.trackUserInteraction(userId, hostelId, interactionType, rating)

    res.json({ message: "Interaction tracked successfully" })
  } catch (error) {
    console.error("Error tracking interaction:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.get("/api/user-profile", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId
    const profile = recommendationEngine.getUserProfile(userId)
    res.json({ profile })
  } catch (error) {
    console.error("Error fetching user profile:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Hostel routes
app.get("/api/hostels", async (req, res) => {
  try {
    const hostels = await Hostel.find().sort({ createdAt: -1 })
    res.json(hostels)
  } catch (error) {
    console.error("Error fetching hostels:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.get("/api/hostels/:id", async (req, res) => {
  try {
    const hostel = await Hostel.findById(req.params.id)
    if (!hostel) {
      return res.status(404).json({ message: "Hostel not found" })
    }
    res.json(hostel)
  } catch (error) {
    console.error("Error fetching hostel:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.post("/api/hostels", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, location, price, rating, type, capacity, image, description, amenities, contact } = req.body

    const hostel = new Hostel({
      name,
      location,
      price,
      rating,
      type,
      capacity,
      image,
      description,
      amenities: typeof amenities === "string" ? amenities.split(",").map((a) => a.trim()) : amenities,
      contact,
    })

    await hostel.save()
    res.status(201).json(hostel)
  } catch (error) {
    console.error("Error creating hostel:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.put("/api/hostels/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, location, price, rating, type, capacity, image, description, amenities, contact } = req.body

    const hostel = await Hostel.findByIdAndUpdate(
      req.params.id,
      {
        name,
        location,
        price,
        rating,
        type,
        capacity,
        image,
        description,
        amenities: typeof amenities === "string" ? amenities.split(",").map((a) => a.trim()) : amenities,
        contact,
      },
      { new: true },
    )

    if (!hostel) {
      return res.status(404).json({ message: "Hostel not found" })
    }

    res.json(hostel)
  } catch (error) {
    console.error("Error updating hostel:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.delete("/api/hostels/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const hostel = await Hostel.findByIdAndDelete(req.params.id)
    if (!hostel) {
      return res.status(404).json({ message: "Hostel not found" })
    }
    res.json({ message: "Hostel deleted successfully" })
  } catch (error) {
    console.error("Error deleting hostel:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Admin stats route
app.get("/api/admin/stats", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const totalHostels = await Hostel.countDocuments()
    const totalUsers = await User.countDocuments({ role: "user" })

    const hostels = await Hostel.find()
    const avgRating = hostels.length > 0 ? hostels.reduce((sum, h) => sum + h.rating, 0) / hostels.length : 0
    const avgPrice = hostels.length > 0 ? hostels.reduce((sum, h) => sum + h.price, 0) / hostels.length : 0

    res.json({
      totalHostels,
      totalUsers,
      avgRating: Math.round(avgRating * 10) / 10,
      avgPrice: Math.round(avgPrice),
    })
  } catch (error) {
    console.error("Error fetching stats:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Serve static files
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"))
})

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`)
  await initializeData()
})
