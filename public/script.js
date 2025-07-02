// Global variables
let currentUser = null
let allHostels = []
let filteredHostels = []

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
const recommendationsSection = document.getElementById("recommendationsSection")
const recommendationsGrid = document.getElementById("recommendationsGrid")
const contactForm = document.getElementById("contactForm")

// Filter elements
const locationFilter = document.getElementById("locationFilter")
const priceFilter = document.getElementById("priceFilter")
const ratingFilter = document.getElementById("ratingFilter")
const typeFilter = document.getElementById("typeFilter")
const sortBy = document.getElementById("sortBy")

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 Nepal Hostel Finder starting...")
  checkAuthStatus()
  loadHostels()
  setupEventListeners()
  setupSmoothScrolling()
})

// Setup event listeners
function setupEventListeners() {
  // Authentication
  if (loginBtn) loginBtn.addEventListener("click", showLoginModal)
  if (registerBtn) registerBtn.addEventListener("click", showRegisterModal)
  if (logoutBtn) logoutBtn.addEventListener("click", logout)
  if (loginForm) loginForm.addEventListener("submit", handleLogin)
  if (registerForm) registerForm.addEventListener("submit", handleRegister)

  // Search
  if (searchBtn) searchBtn.addEventListener("click", performSearch)
  if (searchInput) {
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") performSearch()
    })
  }

  // Filters
  if (locationFilter) locationFilter.addEventListener("change", applyFilters)
  if (priceFilter) priceFilter.addEventListener("change", applyFilters)
  if (ratingFilter) ratingFilter.addEventListener("change", applyFilters)
  if (typeFilter) typeFilter.addEventListener("change", applyFilters)
  if (sortBy) sortBy.addEventListener("change", applyFilters)

  // Admin panel
  if (adminPanelBtn) {
    adminPanelBtn.addEventListener("click", () => {
      window.location.href = "admin.html"
    })
  }

  // Contact form
  if (contactForm) contactForm.addEventListener("submit", handleContactForm)

  // Modal functionality
  setupModalListeners()
}

function setupModalListeners() {
  const loginClose = document.getElementById("loginClose")
  const registerClose = document.getElementById("registerClose")
  const showRegisterFromLogin = document.getElementById("showRegisterFromLogin")
  const showLoginFromRegister = document.getElementById("showLoginFromRegister")

  if (loginClose) loginClose.addEventListener("click", hideLoginModal)
  if (registerClose) registerClose.addEventListener("click", hideRegisterModal)

  if (showRegisterFromLogin) {
    showRegisterFromLogin.addEventListener("click", (e) => {
      e.preventDefault()
      hideLoginModal()
      showRegisterModal()
    })
  }

  if (showLoginFromRegister) {
    showLoginFromRegister.addEventListener("click", (e) => {
      e.preventDefault()
      hideRegisterModal()
      showLoginModal()
    })
  }

  window.addEventListener("click", (e) => {
    if (e.target === loginModal) hideLoginModal()
    if (e.target === registerModal) hideRegisterModal()
  })
}

function setupSmoothScrolling() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault()
      const target = document.querySelector(this.getAttribute("href"))
      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })
      }
    })
  })
}

// Authentication functions
function checkAuthStatus() {
  const token = localStorage.getItem("authToken")
  const userData = localStorage.getItem("userData")

  if (token && userData) {
    currentUser = JSON.parse(userData)
    updateUIForLoggedInUser()
    console.log("✅ User authenticated:", currentUser.username)
  }
}

function showLoginModal() {
  if (loginModal) loginModal.style.display = "block"
}

function hideLoginModal() {
  if (loginModal) {
    loginModal.style.display = "none"
    const errorDiv = document.getElementById("loginError")
    if (errorDiv) errorDiv.textContent = ""
  }
}

function showRegisterModal() {
  if (registerModal) registerModal.style.display = "block"
}

function hideRegisterModal() {
  if (registerModal) {
    registerModal.style.display = "none"
    const errorDiv = document.getElementById("registerError")
    const successDiv = document.getElementById("registerSuccess")
    if (errorDiv) errorDiv.textContent = ""
    if (successDiv) successDiv.textContent = ""
  }
}

async function handleLogin(e) {
  e.preventDefault()

  const username = document.getElementById("loginUsername").value
  const password = document.getElementById("loginPassword").value
  const errorDiv = document.getElementById("loginError")

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

      // Reload hostels to get personalized recommendations
      loadHostels()
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

  errorDiv.textContent = ""
  successDiv.textContent = ""

  if (password !== confirmPassword) {
    errorDiv.textContent = "Passwords do not match"
    return
  }

  try {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

  // Hide recommendations section
  if (recommendationsSection) {
    recommendationsSection.style.display = "none"
  }

  // Reload hostels without personalization
  loadHostels()
}

function updateUIForLoggedInUser() {
  if (loginBtn) loginBtn.style.display = "none"
  if (registerBtn) registerBtn.style.display = "none"
  if (logoutBtn) logoutBtn.style.display = "inline-block"
  if (userWelcome) {
    userWelcome.style.display = "inline"
    userWelcome.textContent = `Welcome, ${currentUser.username}!`
  }

  if (currentUser.role === "admin" && adminPanelBtn) {
    adminPanelBtn.style.display = "inline-block"
  }
}

function updateUIForLoggedOutUser() {
  if (loginBtn) loginBtn.style.display = "inline-block"
  if (registerBtn) registerBtn.style.display = "inline-block"
  if (logoutBtn) logoutBtn.style.display = "none"
  if (userWelcome) userWelcome.style.display = "none"
  if (adminPanelBtn) adminPanelBtn.style.display = "none"
}

// Hostel loading and recommendations
async function loadHostels() {
  try {
    showLoadingState()

    const response = await fetch("/api/hostels")
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

    const data = await response.json()
    allHostels = data
    filteredHostels = [...allHostels]

    // Get personalized recommendations if user is logged in
    if (currentUser) {
      await loadRecommendations()
    }

    displayHostels(filteredHostels)
    updateResultsCount()
    console.log("✅ Hostels loaded successfully:", data.length)
  } catch (error) {
    console.error("❌ Error loading hostels:", error)
    showErrorState()
  }
}

async function loadRecommendations() {
  try {
    const preferences = {
      preferredLocation: "Kathmandu",
      budgetRange: [8000, 15000],
      preferredAmenities: ["WiFi", "Mess", "Study Room"],
      minRating: 4.0,
      hostelType: "Mixed",
    }

    const context = {
      timeOfDay: getTimeOfDay(),
      season: getCurrentSeason(),
      weather: "normal",
      urgency: "normal",
      nearLandmarks: true,
      landmarks: ["University", "Bus Park", "Market"],
    }

    const response = await fetch("/api/recommendations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
      body: JSON.stringify({ preferences, context }),
    })

    if (response.ok) {
      const data = await response.json()
      if (data.recommendations && data.recommendations.length > 0) {
        displayRecommendations(data.recommendations)
        if (recommendationsSection) {
          recommendationsSection.style.display = "block"
        }
      }
    }
  } catch (error) {
    console.warn("⚠️ Could not load recommendations:", error)
  }
}

function displayRecommendations(recommendations) {
  if (!recommendationsGrid) return

  recommendationsGrid.innerHTML = recommendations
    .slice(0, 6)
    .map((rec) => createHostelCard(rec.hostel, true, rec.reason))
    .join("")
}

function showLoadingState() {
  if (hostelGrid) {
    hostelGrid.innerHTML = `
      <div class="loading-state">
        <i class="fas fa-spinner fa-spin"></i>
        <h3>Loading hostels...</h3>
        <p>Finding the best accommodations for you</p>
      </div>
    `
  }
  if (resultsCount) {
    resultsCount.textContent = "Loading hostels..."
  }
}

function showErrorState() {
  if (hostelGrid) {
    hostelGrid.innerHTML = `
      <div class="error-state">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Error loading hostels</h3>
        <p>Please refresh the page or try again later</p>
        <button onclick="loadHostels()" class="btn btn-primary">
          <i class="fas fa-redo"></i> Retry
        </button>
      </div>
    `
  }
  if (resultsCount) {
    resultsCount.textContent = "Error loading hostels"
  }
}

function displayHostels(hostels) {
  if (!hostelGrid) return

  if (hostels.length === 0) {
    hostelGrid.innerHTML = `
      <div class="no-results">
        <i class="fas fa-search"></i>
        <h3>No hostels found</h3>
        <p>Try adjusting your search criteria or filters</p>
      </div>
    `
    return
  }

  hostelGrid.innerHTML = hostels.map((hostel) => createHostelCard(hostel)).join("")
}

function createHostelCard(hostel, isRecommended = false, reason = "") {
  const amenities = Array.isArray(hostel.amenities)
    ? hostel.amenities
    : hostel.amenities
      ? hostel.amenities.split(",").map((a) => a.trim())
      : []

  const typeClass = hostel.type.toLowerCase()

  const recommendationBadge = isRecommended
    ? `
    <div class="recommendation-badge">
      <i class="fas fa-star"></i> Recommended for you
      <div class="recommendation-reason">${reason}</div>
    </div>
  `
    : ""

  return `
    <div class="hostel-card ${isRecommended ? "recommended" : ""}" 
         onclick="trackHostelView('${hostel._id}')">
      ${recommendationBadge}
      <img src="${hostel.image || "/placeholder.svg?height=220&width=380"}" 
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
          ${amenities
            .slice(0, 6)
            .map((amenity) => `<span class="amenity">${amenity}</span>`)
            .join("")}
          ${amenities.length > 6 ? `<span class="amenity">+${amenities.length - 6} more</span>` : ""}
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
        (hostel.description && hostel.description.toLowerCase().includes(searchTerm)) ||
        hostel.amenities.some((amenity) => amenity.toLowerCase().includes(searchTerm)),
    )
  }

  applyFilters()
}

function applyFilters() {
  let filtered = [...filteredHostels]

  // Apply location filter
  const location = locationFilter?.value
  if (location) {
    filtered = filtered.filter((hostel) => hostel.location === location)
  }

  // Apply price filter
  const priceRange = priceFilter?.value
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
  const minRating = ratingFilter?.value
  if (minRating) {
    filtered = filtered.filter((hostel) => hostel.rating >= Number.parseFloat(minRating))
  }

  // Apply type filter
  const type = typeFilter?.value
  if (type) {
    filtered = filtered.filter((hostel) => hostel.type === type)
  }

  // Apply sorting
  const sortOption = sortBy?.value
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
      case "recommended":
      default:
        return 0
    }
  })

  displayHostels(filtered)
  updateResultsCount(filtered.length)
}

function updateResultsCount(count = filteredHostels.length) {
  if (resultsCount) {
    resultsCount.textContent = `Found ${count} hostel${count !== 1 ? "s" : ""}`
  }
}

// Contact form handler
async function handleContactForm(e) {
  e.preventDefault()

  const name = document.getElementById("contactName").value
  const email = document.getElementById("contactEmail").value
  const subject = document.getElementById("contactSubject").value
  const message = document.getElementById("contactMessage").value

  // Simulate form submission
  showNotification("Thank you for your message! We'll get back to you soon.", "success")
  contactForm.reset()
}

// User interaction tracking
async function trackHostelView(hostelId) {
  if (currentUser) {
    try {
      await fetch("/api/interactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({
          hostelId,
          interactionType: "view",
        }),
      })
    } catch (error) {
      console.warn("Could not track view:", error)
    }
  }
}

async function likeHostel(hostelId) {
  if (!currentUser) {
    showNotification("Please login to like hostels", "warning")
    showLoginModal()
    return
  }

  try {
    await fetch("/api/interactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
      body: JSON.stringify({
        hostelId,
        interactionType: "like",
      }),
    })
    showNotification("Added to your preferences!", "success")
  } catch (error) {
    console.warn("Could not track like:", error)
  }
}

async function bookHostel(hostelId) {
  if (!currentUser) {
    showNotification("Please login to book hostels", "warning")
    showLoginModal()
    return
  }

  try {
    await fetch("/api/interactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
      body: JSON.stringify({
        hostelId,
        interactionType: "book",
      }),
    })
    showNotification("Booking interest recorded! Contact the hostel directly.", "info")
  } catch (error) {
    console.warn("Could not track booking:", error)
  }
}

// Utility functions
function getTimeOfDay() {
  const hour = new Date().getHours()
  if (hour < 12) return "morning"
  if (hour < 18) return "afternoon"
  return "evening"
}

function getCurrentSeason() {
  const month = new Date().getMonth() + 1
  if (month >= 3 && month <= 5) return "spring"
  if (month >= 6 && month <= 8) return "summer"
  if (month >= 9 && month <= 11) return "autumn"
  return "winter"
}

function showNotification(message, type = "info") {
  const notification = document.createElement("div")
  notification.className = `notification notification-${type}`
  notification.textContent = message

  Object.assign(notification.style, {
    position: "fixed",
    top: "20px",
    right: "20px",
    padding: "1rem 2rem",
    borderRadius: "8px",
    color: "white",
    zIndex: "9999",
    fontSize: "1rem",
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
    maxWidth: "400px",
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
  }, 4000)
}
