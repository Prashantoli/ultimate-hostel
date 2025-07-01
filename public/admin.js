// Global variables
let currentUser = null
let allHostels = []

// DOM elements
const logoutBtn = document.getElementById("logoutBtn")
const adminWelcome = document.getElementById("adminWelcome")
const addHostelBtn = document.getElementById("addHostelBtn")
const hostelModal = document.getElementById("hostelModal")
const hostelForm = document.getElementById("hostelForm")
const hostelsTableBody = document.getElementById("hostelsTableBody")
const totalHostels = document.getElementById("totalHostels")
const avgRating = document.getElementById("avgRating")
const avgPrice = document.getElementById("avgPrice")

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  checkAuthStatus()
  loadHostels()
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
      updateStatistics()
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
    hostelsTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No hostels found</td></tr>'
    return
  }

  hostelsTableBody.innerHTML = allHostels
    .map(
      (hostel) => `
        <tr>
            <td>${hostel.name}</td>
            <td>${hostel.location}</td>
            <td>$${hostel.price}</td>
            <td>${hostel.rating}/5</td>
            <td>${hostel.type}</td>
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

function updateStatistics() {
  totalHostels.textContent = allHostels.length

  if (allHostels.length > 0) {
    const avgRatingValue = allHostels.reduce((sum, hostel) => sum + hostel.rating, 0) / allHostels.length
    const avgPriceValue = allHostels.reduce((sum, hostel) => sum + hostel.price, 0) / allHostels.length

    avgRating.textContent = avgRatingValue.toFixed(1)
    avgPrice.textContent = `$${Math.round(avgPriceValue)}`
  } else {
    avgRating.textContent = "0"
    avgPrice.textContent = "$0"
  }
}

// Modal functions
function showAddHostelModal() {
  document.getElementById("modalTitle").textContent = "Add New Hostel"
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
    image: formData.get("image"),
    description: formData.get("description"),
    amenities: formData.get("amenities"),
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

  document.getElementById("modalTitle").textContent = "Edit Hostel"
  document.getElementById("hostelId").value = hostel._id
  document.getElementById("hostelName").value = hostel.name
  document.getElementById("hostelLocation").value = hostel.location
  document.getElementById("hostelPrice").value = hostel.price
  document.getElementById("hostelRating").value = hostel.rating
  document.getElementById("hostelType").value = hostel.type
  document.getElementById("hostelImage").value = hostel.image || ""
  document.getElementById("hostelDescription").value = hostel.description || ""
  document.getElementById("hostelAmenities").value = Array.isArray(hostel.amenities)
    ? hostel.amenities.join(", ")
    : hostel.amenities || ""

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
    borderRadius: "5px",
    color: "white",
    zIndex: "9999",
    fontSize: "1rem",
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
  })

  switch (type) {
    case "success":
      notification.style.backgroundColor = "#28a745"
      break
    case "error":
      notification.style.backgroundColor = "#dc3545"
      break
    case "warning":
      notification.style.backgroundColor = "#ffc107"
      notification.style.color = "#333"
      break
    default:
      notification.style.backgroundColor = "#17a2b8"
  }

  document.body.appendChild(notification)

  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification)
    }
  }, 3000)
}
