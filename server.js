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
const JWT_SECRET = process.env.JWT_SECRET || "nepal-hostel-finder-secret-key-2024"

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
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err))

// User Schema
const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    preferences: {
      preferredLocation: { type: String },
      budgetRange: { type: [Number], default: [5000, 20000] },
      preferredAmenities: { type: [String], default: [] },
      minRating: { type: Number, default: 3.0 },
      hostelType: { type: String },
    },
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
    address: { type: String },
    nearbyLandmarks: { type: [String], default: [] },
  },
  { timestamps: true },
)

const Hostel = mongoose.model("Hostel", hostelSchema)

// Interaction Schema for tracking user behavior
const interactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    hostelId: { type: mongoose.Schema.Types.ObjectId, ref: "Hostel", required: true },
    interactionType: { type: String, enum: ["view", "like", "book", "rate"], required: true },
    rating: { type: Number, min: 1, max: 5 },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true },
)

const Interaction = mongoose.model("Interaction", interactionSchema)

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

// Initialize sample data
async function initializeData() {
  try {
    console.log("🔄 Initializing Nepal Hostel Finder data...")

    // Create admin user
    const adminExists = await User.findOne({ email: "admin@nepalhostel.com" })
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash("admin123", 12)
      await User.create({
        username: "admin",
        email: "admin@nepalhostel.com",
        password: hashedPassword,
        role: "admin",
      })
      console.log("✅ Admin user created (admin@nepalhostel.com / admin123)")
    }

    // Create sample user
    const userExists = await User.findOne({ email: "user@nepalhostel.com" })
    if (!userExists) {
      const userPassword = await bcrypt.hash("user123", 12)
      await User.create({
        username: "testuser",
        email: "user@nepalhostel.com",
        phone: "9841234567",
        password: userPassword,
        role: "user",
        preferences: {
          preferredLocation: "Kathmandu",
          budgetRange: [8000, 15000],
          preferredAmenities: ["WiFi", "Mess", "Study Room"],
          minRating: 4.0,
          hostelType: "Mixed",
        },
      })
      console.log("✅ Sample user created (user@nepalhostel.com / user123)")
    }

    // Create sample hostels
    const hostelCount = await Hostel.countDocuments()
    if (hostelCount === 0) {
      const sampleHostels = [
        {
          name: "Kathmandu Central Boys Hostel",
          location: "Kathmandu",
          price: 8500,
          rating: 4.3,
          type: "Boys",
          capacity: 60,
          image: "/placeholder.svg?height=200&width=350",
          description:
            "Modern boys hostel in the heart of Kathmandu with excellent facilities and easy access to colleges and universities.",
          amenities: ["WiFi", "Mess", "Laundry", "Study Room", "24/7 Security", "Hot Water", "Parking"],
          contact: "9841234567",
          address: "New Baneshwor, Kathmandu",
          nearbyLandmarks: ["Tribhuvan University", "City Centre", "Bus Park"],
        },
        {
          name: "Lalitpur Girls Paradise",
          location: "Lalitpur",
          price: 12500,
          rating: 4.6,
          type: "Girls",
          capacity: 40,
          image: "/placeholder.svg?height=200&width=350",
          description:
            "Premium girls hostel in Lalitpur with top-notch security, modern amenities, and a supportive environment for female students.",
          amenities: ["WiFi", "Mess", "Gym", "Library", "CCTV", "Female Warden", "Medical Room", "Recreation Room"],
          contact: "9851234567",
          address: "Jawalakhel, Lalitpur",
          nearbyLandmarks: ["Patan Durbar Square", "UN Park", "Jawalakhel Zoo"],
        },
        {
          name: "Bhaktapur Heritage Mixed Hostel",
          location: "Bhaktapur",
          price: 6500,
          rating: 4.0,
          type: "Mixed",
          capacity: 50,
          image: "/placeholder.svg?height=200&width=350",
          description:
            "Affordable mixed hostel in the cultural city of Bhaktapur, offering separate floors for boys and girls with traditional Newari architecture.",
          amenities: ["WiFi", "Shared Kitchen", "Common Room", "Parking", "Cultural Tours", "Traditional Mess"],
          contact: "9861234567",
          address: "Durbar Square Area, Bhaktapur",
          nearbyLandmarks: ["Bhaktapur Durbar Square", "Nyatapola Temple", "Pottery Square"],
        },
        {
          name: "Thamel Backpackers Boys Lodge",
          location: "Kathmandu",
          price: 15500,
          rating: 4.4,
          type: "Boys",
          capacity: 30,
          image: "/placeholder.svg?height=200&width=350",
          description:
            "Premium boys hostel in the vibrant Thamel area, perfect for students who want to be close to the action with luxury amenities.",
          amenities: ["WiFi", "AC Rooms", "Mess", "Gym", "Recreation Room", "Rooftop Garden", "Laundry"],
          contact: "9871234567",
          address: "Thamel, Kathmandu",
          nearbyLandmarks: ["Thamel Market", "Garden of Dreams", "Kathmandu Durbar Square"],
        },
        {
          name: "Patan Girls Sanctuary",
          location: "Lalitpur",
          price: 9500,
          rating: 4.2,
          type: "Girls",
          capacity: 35,
          image: "/placeholder.svg?height=200&width=350",
          description:
            "Safe and comfortable girls hostel near Patan with traditional architecture and modern facilities for a homely environment.",
          amenities: ["WiFi", "Mess", "Study Hall", "Medical Room", "Security", "Cultural Programs", "Garden"],
          contact: "9881234567",
          address: "Mangal Bazaar, Lalitpur",
          nearbyLandmarks: ["Patan Museum", "Golden Temple", "Mahabouddha Temple"],
        },
        {
          name: "Bhaktapur Boys Heritage Home",
          location: "Bhaktapur",
          price: 7800,
          rating: 4.1,
          type: "Boys",
          capacity: 45,
          image: "/placeholder.svg?height=200&width=350",
          description:
            "Traditional Newari-style boys hostel offering cultural immersion with modern comforts in the historic city of Bhaktapur.",
          amenities: ["WiFi", "Traditional Mess", "Cultural Programs", "Library", "Heritage Tours", "Courtyard"],
          contact: "9891234567",
          address: "Taumadhi Square, Bhaktapur",
          nearbyLandmarks: ["Taumadhi Square", "Dattatreya Temple", "Peacock Window"],
        },
        {
          name: "New Road Executive Mixed",
          location: "Kathmandu",
          price: 11500,
          rating: 4.5,
          type: "Mixed",
          capacity: 70,
          image: "/placeholder.svg?height=200&width=350",
          description:
            "Modern executive-style mixed hostel in the commercial heart of Kathmandu with separate wings and premium facilities.",
          amenities: [
            "WiFi",
            "Cafeteria",
            "Study Rooms",
            "Elevator",
            "Backup Power",
            "Shopping Access",
            "Conference Room",
          ],
          contact: "9801234567",
          address: "New Road, Kathmandu",
          nearbyLandmarks: ["New Road Shopping", "Ratna Park", "Tundikhel"],
        },
        {
          name: "Lalitpur Luxury Girls Residence",
          location: "Lalitpur",
          price: 18500,
          rating: 4.8,
          type: "Girls",
          capacity: 25,
          image: "/placeholder.svg?height=200&width=350",
          description:
            "Ultra-luxury girls hostel with premium amenities, personalized services, and an exclusive environment for discerning students.",
          amenities: ["WiFi", "AC", "Private Bathrooms", "Spa", "Concierge", "Transport Service", "Fine Dining"],
          contact: "9811234567",
          address: "Sanepa, Lalitpur",
          nearbyLandmarks: ["Sanepa Temple", "Lagankhel", "Ring Road"],
        },
        {
          name: "Durbar Marg Elite Boys",
          location: "Kathmandu",
          price: 22000,
          rating: 4.7,
          type: "Boys",
          capacity: 20,
          image: "/placeholder.svg?height=200&width=350",
          description:
            "Elite boys hostel in the prestigious Durbar Marg area offering luxury accommodation with world-class amenities and services.",
          amenities: ["WiFi", "AC", "Private Rooms", "Housekeeping", "Concierge", "Fine Dining", "Business Center"],
          contact: "9821234567",
          address: "Durbar Marg, Kathmandu",
          nearbyLandmarks: ["Royal Palace", "Narayanhiti Palace", "Durbar Marg Shopping"],
        },
        {
          name: "Bhaktapur Cultural Girls Home",
          location: "Bhaktapur",
          price: 10500,
          rating: 4.3,
          type: "Girls",
          capacity: 30,
          image: "/placeholder.svg?height=200&width=350",
          description:
            "Girls hostel that combines traditional Newari culture with modern safety and comfort, perfect for cultural enthusiasts.",
          amenities: ["WiFi", "Traditional Mess", "Cultural Classes", "Security", "Heritage Walks", "Art Workshop"],
          contact: "9831234567",
          address: "Suryamadhi, Bhaktapur",
          nearbyLandmarks: ["Changu Narayan", "Nagarkot", "Traditional Craft Centers"],
        },
      ]

      await Hostel.insertMany(sampleHostels)
      console.log(`✅ Created ${sampleHostels.length} sample hostels`)
    }

    console.log("🎉 Nepal Hostel Finder initialized successfully!")
  } catch (error) {
    console.error("❌ Error initializing data:", error)
  }
}

// Auth routes
app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body

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

    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    })

    if (existingUser) {
      return res.status(400).json({ message: "Username or email already exists" })
    }

    const hashedPassword = await bcrypt.hash(password, 12)
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

// Recommendation routes
app.post("/api/recommendations", authenticateToken, async (req, res) => {
  try {
    const { preferences, context } = req.body
    const userId = req.user.userId
    const hostels = await Hostel.find()

    // Update user preferences
    await User.findByIdAndUpdate(userId, { preferences })

    // Get user interactions for collaborative filtering
    const userInteractions = await Interaction.find({ userId })

    // Generate recommendations using the engine
    const recommendations = recommendationEngine.hybridRecommendation(
      userId,
      hostels,
      preferences,
      context,
      userInteractions,
    )

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

    const interaction = new Interaction({
      userId,
      hostelId,
      interactionType,
      rating,
    })

    await interaction.save()
    res.json({ message: "Interaction tracked successfully" })
  } catch (error) {
    console.error("Error tracking interaction:", error)
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

app.post("/api/hostels", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const hostelData = req.body
    if (typeof hostelData.amenities === "string") {
      hostelData.amenities = hostelData.amenities.split(",").map((a) => a.trim())
    }
    if (typeof hostelData.nearbyLandmarks === "string") {
      hostelData.nearbyLandmarks = hostelData.nearbyLandmarks.split(",").map((l) => l.trim())
    }

    const hostel = new Hostel(hostelData)
    await hostel.save()
    res.status(201).json(hostel)
  } catch (error) {
    console.error("Error creating hostel:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.put("/api/hostels/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const hostelData = req.body
    if (typeof hostelData.amenities === "string") {
      hostelData.amenities = hostelData.amenities.split(",").map((a) => a.trim())
    }
    if (typeof hostelData.nearbyLandmarks === "string") {
      hostelData.nearbyLandmarks = hostelData.nearbyLandmarks.split(",").map((l) => l.trim())
    }

    const hostel = await Hostel.findByIdAndUpdate(req.params.id, hostelData, { new: true })
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

// Admin stats
app.get("/api/admin/stats", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const totalHostels = await Hostel.countDocuments()
    const totalUsers = await User.countDocuments({ role: "user" })
    const totalInteractions = await Interaction.countDocuments()

    const hostels = await Hostel.find()
    const avgRating = hostels.length > 0 ? hostels.reduce((sum, h) => sum + h.rating, 0) / hostels.length : 0
    const avgPrice = hostels.length > 0 ? hostels.reduce((sum, h) => sum + h.price, 0) / hostels.length : 0

    res.json({
      totalHostels,
      totalUsers,
      totalInteractions,
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
  console.log(`🚀 Nepal Hostel Finder running on port ${PORT}`)
  console.log(`🌐 Open http://localhost:${PORT} in your browser`)
  await initializeData()
})
