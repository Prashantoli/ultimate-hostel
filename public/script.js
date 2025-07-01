// Global variables
let currentUser = null
let allHostels = []
let filteredHostels = []

// Import recommendation client
let recommendationClient = null
const RecommendationClient = window.RecommendationClient || null

// DOM elements
const loginBtn = document.getElementById("loginBtn")
const registerBtn = document.getElementById("registerBtn")
const logoutBtn = document.getElementById("logoutBtn")
const userWelcome = document.getElementById("userWelcome")
const loginModal = document.getElementById("loginModal")
const registerModal = document.getElementById("registerModal")
const loginForm = document.getElementById("loginForm")
const registerForm = document.getElementById("registerForm")
const searchInput = document.getElementById("searchInput")
const searchBtn = document.getElementById("searchBtn")
const hostelGrid = document.getElementById("hostelGrid")
const resultsCount = document.getElementById("resultsCount")
const adminPanelBtn = document.getElementById("adminPanelBtn")

// Filter elements
const locationFilter = document.getElementById("locationFilter")
const priceFilter = document.getElementById("priceFilter")
const ratingFilter = document.getElementById("ratingFilter")
const typeFilter = document.getElementById("typeFilter")
const sortBy = document.getElementById("sortBy")

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  checkAuthStatus()
  loadHostels()
  setupEventListeners()

  // Initialize recommendation client
  if (RecommendationClient) {
    recommendationClient = new RecommendationClient()
  }
})

// Setup event listeners
function setupEventListeners() {
  loginBtn.addEventListener("click", showLoginModal)
  registerBtn.addEventListener("click", showRegisterModal)
  logoutBtn.addEventListener("click", logout)
  loginForm.addEventListener("submit", handleLogin)
  registerForm.addEventListener("submit", handleRegister)
  searchBtn.addEventListener("click", performSearch)
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      performSearch()
    }
  })

  // Filter event listeners
  locationFilter.addEventListener("change", applyFilters)
  priceFilter.addEventListener("change", applyFilters)
  ratingFilter.addEventListener("change", applyFilters)
  typeFilter.addEventListener("change", applyFilters)
  sortBy.addEventListener("change", applyFilters)

  // Admin panel button
  adminPanelBtn.addEventListener("click", () => {
    window.location.href = "admin.html"
  })

  // Modal close functionality
  document.getElementById("loginClose").addEventListener("click", hideLoginModal)
  document.getElementById("registerClose").addEventListener("click", hideRegisterModal)

  // Switch between login and register
  document.getElementById("showRegisterFromLogin").addEventListener("click", (e) => {
    e.preventDefault()
    hideLoginModal()
    showRegisterModal()
  })

  document.getElementById("showLoginFromRegister").addEventListener("click", (e) => {
    e.preventDefault()
    hideRegisterModal()
    showLoginModal()
  })

  window.addEventListener("click", (e) => {
    if (e.target === loginModal) {
      hideLoginModal()
    }
    if (e.target === registerModal) {
      hideRegisterModal()
    }
  })
}

// Authentication functions
function checkAuthStatus() {
  const token = localStorage.getItem("authToken")
  const userData = localStorage.getItem("userData")

  if (token && userData) {
    currentUser = JSON.parse(userData)
    updateUIForLoggedInUser()
  }
}

function showLoginModal() {
  loginModal.style.display = "block"
}

function hideLoginModal() {
  loginModal.style.display = "none"
  document.getElementById("loginError").textContent = ""
}

function showRegisterModal() {
  registerModal.style.display = "block"
}

function hideRegisterModal() {
  registerModal.style.display = "none"
  document.getElementById("registerError").textContent = ""
  document.getElementById("registerSuccess").textContent = ""
}

async function handleLogin(e) {
  e.preventDefault()

  const username = document.getElementById("loginUsername").value
  const password = document.getElementById("loginPassword").value
  const errorDiv = document.getElementById("loginError")

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    })

    const data = await response.json()

    if (response.ok) {
      localStorage.setItem("authToken", data.token)
      localStorage.setItem("userData", JSON.stringify(data.user))
      currentUser = data.user
      updateUIForLoggedInUser()
      hideLoginModal()
      loginForm.reset()
      showNotification("Login successful!", "success")
    } else {
      errorDiv.textContent = data.message || "Login failed"
    }
  } catch (error) {
    console.error("Login error:", error)
    errorDiv.textContent = "Network error. Please try again."
  }
}

async function handleRegister(e) {
  e.preventDefault()

  const username = document.getElementById("registerUsername").value
  const email = document.getElementById("registerEmail").value
  const phone = document.getElementById("registerPhone").value
  const password = document.getElementById("registerPassword").value
  const confirmPassword = document.getElementById("confirmPassword").value
  const errorDiv = document.getElementById("registerError")
  const successDiv = document.getElementById("registerSuccess")

  // Clear previous messages
  errorDiv.textContent = ""
  successDiv.textContent = ""

  // Validate passwords match
  if (password !== confirmPassword) {
    errorDiv.textContent = "Passwords do not match"
    return
  }

  try {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, email, phone, password }),
    })

    const data = await response.json()

    if (response.ok) {
      successDiv.textContent = "Registration successful! You can now login."
      registerForm.reset()
      setTimeout(() => {
        hideRegisterModal()
        showLoginModal()
      }, 2000)
    } else {
      errorDiv.textContent = data.message || "Registration failed"
    }
  } catch (error) {
    console.error("Registration error:", error)
    errorDiv.textContent = "Network error. Please try again."
  }
}

function logout() {
  localStorage.removeItem("authToken")
  localStorage.removeItem("userData")
  currentUser = null
  updateUIForLoggedOutUser()
  showNotification("Logged out successfully!", "info")
}

function updateUIForLoggedInUser() {
  loginBtn.style.display = "none"
  registerBtn.style.display = "none"
  logoutBtn.style.display = "inline-block"
  userWelcome.style.display = "inline"
  userWelcome.textContent = `Welcome, ${currentUser.username}!`

  if (currentUser.role === "admin") {
    adminPanelBtn.style.display = "inline-block"
  }
}

function updateUIForLoggedOutUser() {
  loginBtn.style.display = "inline-block"
  registerBtn.style.display = "inline-block"
  logoutBtn.style.display = "none"
  userWelcome.style.display = "none"
  adminPanelBtn.style.display = "none"
}

// Enhanced hostel loading with recommendations
async function loadHostels() {
  try {
    const response = await fetch("/api/hostels")
    const data = await response.json()

    if (response.ok) {
      allHostels = data

      // Get personalized recommendations if user is logged in
      if (currentUser && recommendationClient) {
        const recommendations = await recommendationClient.getRecommendations(currentUser.id)

        if (recommendations.length > 0) {
          // Show recommended hostels first
          const recommendedHostels = recommendations.map((rec) => ({
            ...rec.hostel,
            isRecommended: true,
            recommendationScore: rec.score,
            recommendationReason: rec.reason,
          }))

          // Add non-recommended hostels
          const nonRecommendedHostels = allHostels.filter(
            (hostel) => !recommendedHostels.some((rec) => rec._id === hostel._id),
          )

          filteredHostels = [...recommendedHostels, ...nonRecommendedHostels]
        } else {
          filteredHostels = [...allHostels]
        }
      } else {
        filteredHostels = [...allHostels]
      }

      displayHostels(filteredHostels)
      updateResultsCount()
    } else {
      console.error("Failed to load hostels:", data.message)
      resultsCount.textContent = "Failed to load hostels"
    }
  } catch (error) {
    console.error("Error loading hostels:", error)
    resultsCount.textContent = "Error loading hostels"
  }
}

function displayHostels(hostels) {
  if (hostels.length === 0) {
    hostelGrid.innerHTML = '<div class="no-results">No hostels found matching your criteria.</div>'
    return
  }

  hostelGrid.innerHTML = hostels.map((hostel) => createHostelCard(hostel)).join("")
}

function createHostelCard(hostel) {
  const amenities = Array.isArray(hostel.amenities)
    ? hostel.amenities
    : hostel.amenities
      ? hostel.amenities.split(",").map((a) => a.trim())
      : []

  const typeClass = hostel.type.toLowerCase()

  // Add recommendation badge if this is a recommended hostel
  const recommendationBadge = hostel.isRecommended
    ? `<div class="recommendation-badge">
         <i class="fas fa-star"></i> Recommended for you
         <div class="recommendation-reason">${hostel.recommendationReason}</div>
       </div>`
    : ""

  return `
        <div class="hostel-card ${hostel.isRecommended ? "recommended" : ""}" 
             onclick="trackHostelView('${hostel._id}')">
            ${recommendationBadge}
            <img src="${hostel.image || "/placeholder.svg?height=200&width=350"}" 
                 alt="${hostel.name}" class="hostel-image">
            <div class="hostel-content">
                <div class="hostel-header">
                    <div>
                        <h3 class="hostel-title">${hostel.name}</h3>
                        <div class="hostel-location">
                            <i class="fas fa-map-marker-alt"></i>
                            ${hostel.location}
                        </div>
                    </div>
                    <div class="hostel-price">NPR ${hostel.price.toLocaleString()}</div>
                </div>
                <div class="hostel-rating">
                    <div class="stars">${generateStars(hostel.rating)}</div>
                    <span>${hostel.rating}/5</span>
                </div>
                <span class="hostel-type ${typeClass}">${hostel.type} Hostel</span>
                <p class="hostel-description">${hostel.description || "No description available."}</p>
                <div class="hostel-amenities">
                    ${amenities.map((amenity) => `<span class="amenity">${amenity}</span>`).join("")}
                </div>
                ${
                  hostel.contact
                    ? `
                <div class="hostel-contact">
                    <i class="fas fa-phone"></i>
                    ${hostel.contact}
                </div>
                `
                    : ""
                }
                <div class="hostel-actions">
                    <button class="btn btn-primary btn-sm" onclick="likeHostel('${hostel._id}')">
                        <i class="fas fa-heart"></i> Like
                    </button>
                    <button class="btn btn-success btn-sm" onclick="bookHostel('${hostel._id}')">
                        <i class="fas fa-calendar"></i> Book
                    </button>
                </div>
            </div>
        </div>
    `
}

function generateStars(rating) {
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 !== 0
  let stars = ""

  for (let i = 0; i < fullStars; i++) {
    stars += '<i class="fas fa-star"></i>'
  }

  if (hasHalfStar) {
    stars += '<i class="fas fa-star-half-alt"></i>'
  }

  const emptyStars = 5 - Math.ceil(rating)
  for (let i = 0; i < emptyStars; i++) {
    stars += '<i class="far fa-star"></i>'
  }

  return stars
}

// Search and filter functions
function performSearch() {
  const searchTerm = searchInput.value.toLowerCase().trim()

  if (searchTerm === "") {
    filteredHostels = [...allHostels]
  } else {
    filteredHostels = allHostels.filter(
      (hostel) =>
        hostel.name.toLowerCase().includes(searchTerm) ||
        hostel.location.toLowerCase().includes(searchTerm) ||
        (hostel.description && hostel.description.toLowerCase().includes(searchTerm)),
    )
  }

  applyFilters()
}

function applyFilters() {
  let filtered = [...filteredHostels]

  // Apply location filter
  const location = locationFilter.value
  if (location) {
    filtered = filtered.filter((hostel) => hostel.location === location)
  }

  // Apply price filter
  const priceRange = priceFilter.value
  if (priceRange) {
    const [min, max] = priceRange.split("-").map((p) => p.replace("+", ""))
    filtered = filtered.filter((hostel) => {
      if (max) {
        return hostel.price >= Number.parseInt(min) && hostel.price <= Number.parseInt(max)
      } else {
        return hostel.price >= Number.parseInt(min)
      }
    })
  }

  // Apply rating filter
  const minRating = ratingFilter.value
  if (minRating) {
    filtered = filtered.filter((hostel) => hostel.rating >= Number.parseFloat(minRating))
  }

  // Apply type filter
  const type = typeFilter.value
  if (type) {
    filtered = filtered.filter((hostel) => hostel.type === type)
  }

  // Apply sorting
  const sortOption = sortBy.value
  filtered.sort((a, b) => {
    switch (sortOption) {
      case "name":
        return a.name.localeCompare(b.name)
      case "price":
        return a.price - b.price
      case "price-desc":
        return b.price - a.price
      case "rating":
        return b.rating - a.rating
      default:
        return 0
    }
  })

  displayHostels(filtered)
  updateResultsCount(filtered.length)
}

function updateResultsCount(count = filteredHostels.length) {
  resultsCount.textContent = `Found ${count} hostel${count !== 1 ? "s" : ""}`
}

// Utility functions
function showNotification(message, type = "info") {
  const notification = document.createElement("div")
  notification.className = `notification notification-${type}`
  notification.textContent = message

  Object.assign(notification.style, {
    position: "fixed",
    top: "20px",
    right: "20px",
    padding: "1rem 2rem",
    borderRadius: "5px",
    color: "white",
    zIndex: "9999",
    fontSize: "1rem",
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
  })

  switch (type) {
    case "success":
      notification.style.backgroundColor = "#059669"
      break
    case "error":
      notification.style.backgroundColor = "#dc2626"
      break
    case "warning":
      notification.style.backgroundColor = "#d97706"
      break
    default:
      notification.style.backgroundColor = "#2563eb"
  }

  document.body.appendChild(notification)

  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification)
    }
  }, 3000)
}

// Track user interactions for recommendations
async function trackHostelView(hostelId) {
  if (recommendationClient) {
    await recommendationClient.trackInteraction(hostelId, "view")
  }
}

async function likeHostel(hostelId) {
  if (recommendationClient) {
    await recommendationClient.trackInteraction(hostelId, "like")
    showNotification("Added to your preferences!", "success")
  }
}

async function bookHostel(hostelId) {
  if (recommendationClient) {
    await recommendationClient.trackInteraction(hostelId, "book")
    showNotification("Booking interest recorded!", "info")
  }
}
