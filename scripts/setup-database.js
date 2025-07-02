import mongoose from "mongoose"
import bcrypt from "bcryptjs"

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/nepal_hostel_finder"

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

async function setupDatabase() {
  try {
    console.log("🔄 Connecting to MongoDB...")
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    console.log("✅ Connected to MongoDB successfully!")

    // Clear existing data (optional - remove if you want to keep existing data)
    console.log("Clearing existing data...")
    await User.deleteMany({})
    await Hostel.deleteMany({})

    // Create admin user
    console.log("Creating admin user...")
    const adminExists = await User.findOne({ email: "admin@nepalhostel.com" })
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash("admin123", 12)
      await User.create({
        username: "admin",
        email: "admin@nepalhostel.com",
        password: hashedPassword,
        role: "admin",
      })
      console.log("✅ Admin user created successfully!")
    } else {
      console.log("ℹ️ Admin user already exists")
    }

    // Create sample regular user
    console.log("Creating sample user...")
    const userExists = await User.findOne({ email: "user@nepalhostel.com" })
    if (!userExists) {
      const userPassword = await bcrypt.hash("user123", 12)
      await User.create({
        username: "testuser",
        email: "user@nepalhostel.com",
        phone: "9841234567",
        password: userPassword,
        role: "user",
      })
      console.log("✅ Sample user created successfully!")
    } else {
      console.log("ℹ️ Sample user already exists")
    }

    // Create sample hostels for Nepal
    console.log("Creating sample hostels...")
    const hostelCount = await Hostel.countDocuments()
    const sampleHostels = [
      {
        name: "Kathmandu Boys Hostel",
        location: "Kathmandu",
        price: 8000,
        rating: 4.2,
        type: "Boys",
        capacity: 50,
        image: "/placeholder.svg?height=200&width=350",
        description:
          "A comfortable boys hostel in the heart of Kathmandu with modern facilities and easy access to colleges.",
        amenities: ["WiFi", "Mess", "Laundry", "Study Room", "24/7 Security", "Hot Water"],
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
        description: "Safe and secure girls hostel in Lalitpur with excellent amenities and female warden supervision.",
        amenities: ["WiFi", "Mess", "Gym", "Library", "CCTV", "Female Warden", "Medical Room"],
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
        description: "Budget-friendly mixed hostel in historic Bhaktapur city with separate floors for boys and girls.",
        amenities: ["WiFi", "Shared Kitchen", "Common Room", "Parking", "Cultural Tours"],
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
        description: "Premium boys hostel in Thamel area with luxury facilities and close to tourist attractions.",
        amenities: ["WiFi", "AC Rooms", "Mess", "Gym", "Recreation Room", "Rooftop Garden"],
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
        description: "Well-maintained girls hostel near Patan Durbar Square with traditional Newari architecture.",
        amenities: ["WiFi", "Mess", "Study Hall", "Medical Room", "Security", "Cultural Programs"],
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
        description: "Traditional style boys hostel with modern amenities in the cultural heart of Bhaktapur.",
        amenities: ["WiFi", "Traditional Mess", "Cultural Programs", "Library", "Heritage Tours"],
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
        description: "Modern mixed hostel in the commercial heart of Kathmandu with separate wings for boys and girls.",
        amenities: ["WiFi", "Cafeteria", "Study Rooms", "Elevator", "Backup Power", "Shopping Access"],
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
        description: "Luxury girls hostel with premium facilities and services in upscale Lalitpur area.",
        amenities: ["WiFi", "AC", "Private Bathrooms", "Spa", "Concierge", "Transport Service"],
        contact: "9811234567",
      },
      {
        name: "Durbar Marg Boys Elite",
        location: "Kathmandu",
        price: 20000,
        rating: 4.6,
        type: "Boys",
        capacity: 15,
        image: "/placeholder.svg?height=200&width=350",
        description: "Elite boys hostel in prestigious Durbar Marg area with luxury amenities and services.",
        amenities: ["WiFi", "AC", "Private Rooms", "Housekeeping", "Concierge", "Fine Dining"],
        contact: "9821234567",
      },
      {
        name: "Bhaktapur Girls Heritage",
        location: "Bhaktapur",
        price: 10000,
        rating: 4.2,
        type: "Girls",
        capacity: 25,
        image: "/placeholder.svg?height=200&width=350",
        description: "Girls hostel combining traditional Newari culture with modern safety and comfort.",
        amenities: ["WiFi", "Traditional Mess", "Cultural Classes", "Security", "Heritage Walks"],
        contact: "9831234567",
      },
    ]
    if (hostelCount === 0) {
      await Hostel.insertMany(sampleHostels)
      console.log(`✅ Created ${sampleHostels.length} sample hostels successfully!`)
    } else {
      console.log(`ℹ️ Found ${hostelCount} existing hostels, skipping creation`)
    }

    console.log("Database setup completed successfully!")
    console.log("\nLogin credentials:")
    console.log("Admin: admin@nepalhostel.com / admin123")
    console.log("User: user@nepalhostel.com / user123")
    console.log("\nTotal hostels created:", sampleHostels.length)
    console.log("\nLocations: Kathmandu, Lalitpur, Bhaktapur")
    console.log("Types: Boys, Girls, Mixed hostels")
    console.log("Price range: NPR 6,000 - NPR 20,000")

    process.exit(0)
  } catch (error) {
    console.error("Error setting up database:", error)
    process.exit(1)
  }
}

setupDatabase()
