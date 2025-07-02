// Global variables
let currentUser = null
let allHostels = []

// DOM elements
const logoutBtn = document.getElementById("logoutBtn")
const adminWelcome = document.getElementById("adminWelcome")
const addHostelBtn = document.getElementById("addHostelBtn")
const refreshStatsBtn = document.getElementById("refreshStatsBtn")
const hostelModal = document.getElementById("hostelModal")
const hostelForm = document.getElementById("hostelForm")
const hostelsTableBody = document.getElementById("hostelsTableBody")
const totalHostels = document.getElementById("totalHostels")
const totalUsers = document.getElementById("totalUsers")
const avgRating = document.getElementById("avgRating")
const avgPrice = document.getElementById("avgPrice")

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  checkAuthStatus()
  loadHostels()
  loadStats()
  setupEventListeners()
})

// Check authentication status
function checkAuthStatus() {
  const token = localStorage.getItem("authToken")
  const userData = localStorage.getItem("userData")

  if (!token || !userData) {
    window.location.href = "index.html"
    return
  }

  currentUser = JSON.parse(userData)

  if (currentUser.role !== "admin") {
    alert("Access denied. Admin privileges required.")
    window.location.href = "index.html"
    return
  }

  adminWelcome.textContent = `Welcome, ${currentUser.username}`
}

// Setup event listeners
function setupEventListeners() {
  logoutBtn.addEventListener("click", logout)
  addHostelBtn.addEventListener("click", showAddHostelModal)
  refreshStatsBtn.addEventListener("click", loadStats)
  hostelForm.addEventListener("submit", handleHostelSubmit)

  // Modal close functionality
  document.querySelector(".close").addEventListener("click", closeModal)
  window.addEventListener("click", (e) => {
    if (e.target === hostelModal) {
      closeModal()
    }
  })
}

// Authentication functions
function logout() {
  localStorage.removeItem("authToken")
  localStorage.removeItem("userData")
  window.location.href = "index.html"
}

// Load admin statistics
async function loadStats() {
  try {
    const response = await fetch("/api/admin/stats", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
    })

    const data = await response.json()

    if (response.ok) {
      totalHostels.textContent = data.totalHostels
      totalUsers.textContent = data.totalUsers
      avgRating.textContent = data.avgRating
      avgPrice.textContent = `NPR ${data.avgPrice.toLocaleString()}`
    }
  } catch (error) {
    console.error("Error loading stats:", error)
  }
}

// Hostel management functions
async function loadHostels() {
  try {
    const response = await fetch("/api/hostels", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
    })

    const data = await response.json()

    if (response.ok) {
      allHostels = data
      displayHostelsTable()
    } else {
      console.error("Failed to load hostels:", data.message)
      showNotification("Failed to load hostels", "error")
    }
  } catch (error) {
    console.error("Error loading hostels:", error)
    showNotification("Error loading hostels", "error")
  }
}

function displayHostelsTable() {
  if (allHostels.length === 0) {
    hostelsTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No hostels found</td></tr>'
    return
  }

  hostelsTableBody.innerHTML = allHostels
    .map(
      (hostel) => `
      <tr>
        <td>${hostel.name}</td>
        <td>${hostel.location}</td>
        <td>NPR ${hostel.price.toLocaleString()}</td>
        <td>${hostel.rating}/5</td>
        <td>${hostel.type}</td>
        <td>${hostel.capacity}</td>
        <td>
          <div class="action-buttons">
            <button class="btn btn-sm btn-primary" onclick="editHostel('${hostel._id}')">
              <i class="fas fa-edit"></i> Edit
            </button>
            <button class="btn btn-sm btn-danger" onclick="deleteHostel('${hostel._id}')">
              <i class="fas fa-trash"></i> Delete
            </button>
          </div>
        </td>
      </tr>
    `,
    )
    .join("")
}

// Modal functions
function showAddHostelModal() {
  document.getElementById("modalTitle").innerHTML = '<i class="fas fa-plus"></i> Add New Hostel'
  hostelForm.reset()
  document.getElementById("hostelId").value = ""
  hostelModal.style.display = "block"
}

function closeModal() {
  hostelModal.style.display = "none"
  document.getElementById("hostelError").textContent = ""
}

// CRUD operations
async function handleHostelSubmit(e) {
  e.preventDefault()

  const formData = new FormData(hostelForm)
  const hostelData = {
    name: formData.get("name"),
    location: formData.get("location"),
    price: Number.parseFloat(formData.get("price")),
    rating: Number.parseFloat(formData.get("rating")),
    type: formData.get("type"),
    capacity: Number.parseInt(formData.get("capacity")),
    image: formData.get("image"),
    contact: formData.get("contact"),
    address: formData.get("address"),
    description: formData.get("description"),
    amenities: formData.get("amenities"),
    nearbyLandmarks: formData.get("nearbyLandmarks"),
  }

  const hostelId = formData.get("id")
  const isEdit = hostelId !== ""

  try {
    const url = isEdit ? `/api/hostels/${hostelId}` : "/api/hostels"
    const method = isEdit ? "PUT" : "POST"

    const response = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
      body: JSON.stringify(hostelData),
    })

    const data = await response.json()

    if (response.ok) {
      showNotification(isEdit ? "Hostel updated successfully!" : "Hostel added successfully!", "success")
      closeModal()
      loadHostels()
      loadStats()
    } else {
      document.getElementById("hostelError").textContent = data.message || "Operation failed"
    }
  } catch (error) {
    console.error("Error saving hostel:", error)
    document.getElementById("hostelError").textContent = "Network error. Please try again."
  }
}

async function editHostel(hostelId) {
  const hostel = allHostels.find((h) => h._id === hostelId)
  if (!hostel) return

  document.getElementById("modalTitle").innerHTML = '<i class="fas fa-edit"></i> Edit Hostel'
  document.getElementById("hostelId").value = hostel._id
  document.getElementById("hostelName").value = hostel.name
  document.getElementById("hostelLocation").value = hostel.location
  document.getElementById("hostelPrice").value = hostel.price
  document.getElementById("hostelRating").value = hostel.rating
  document.getElementById("hostelType").value = hostel.type
  document.getElementById("hostelCapacity").value = hostel.capacity
  document.getElementById("hostelImage").value = hostel.image || ""
  document.getElementById("hostelContact").value = hostel.contact || ""
  document.getElementById("hostelAddress").value = hostel.address || ""
  document.getElementById("hostelDescription").value = hostel.description || ""
  document.getElementById("hostelAmenities").value = Array.isArray(hostel.amenities)
    ? hostel.amenities.join(", ")
    : hostel.amenities || ""
  document.getElementById("hostelLandmarks").value = Array.isArray(hostel.nearbyLandmarks)
    ? hostel.nearbyLandmarks.join(", ")
    : hostel.nearbyLandmarks || ""

  hostelModal.style.display = "block"
}

async function deleteHostel(hostelId) {
  if (!confirm("Are you sure you want to delete this hostel?")) {
    return
  }

  try {
    const response = await fetch(`/api/hostels/${hostelId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
    })

    const data = await response.json()

    if (response.ok) {
      showNotification("Hostel deleted successfully!", "success")
      loadHostels()
      loadStats()
    } else {
      showNotification(data.message || "Failed to delete hostel", "error")
    }
  } catch (error) {
    console.error("Error deleting hostel:", error)
    showNotification("Network error. Please try again.", "error")
  }
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
