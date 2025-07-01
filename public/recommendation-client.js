// Client-side recommendation integration
class RecommendationClient {
  constructor() {
    this.userPreferences = this.loadUserPreferences()
    this.currentContext = this.getCurrentContext()
  }

  // Get personalized recommendations
  async getRecommendations(userId) {
    try {
      const response = await fetch("/api/recommendations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({
          userId,
          preferences: this.userPreferences,
          context: this.currentContext,
        }),
      })

      const data = await response.json()
      return data.recommendations || []
    } catch (error) {
      console.error("Error fetching recommendations:", error)
      return []
    }
  }

  // Update user preferences
  updatePreferences(newPreferences) {
    this.userPreferences = { ...this.userPreferences, ...newPreferences }
    this.saveUserPreferences()
  }

  // Track user interactions
  async trackInteraction(hostelId, interactionType, rating = null) {
    try {
      await fetch("/api/interactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({
          hostelId,
          interactionType,
          rating,
        }),
      })
    } catch (error) {
      console.error("Error tracking interaction:", error)
    }
  }

  // Get current context
  getCurrentContext() {
    const now = new Date()
    const hour = now.getHours()

    return {
      timeOfDay: hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening",
      season: this.getCurrentSeason(),
      weather: "normal", // Could integrate with weather API
      urgency: "normal",
      nearLandmarks: true,
      landmarks: ["Durbar Square", "Thamel"], // User's preferred landmarks
    }
  }

  getCurrentSeason() {
    const month = new Date().getMonth() + 1
    if (month >= 3 && month <= 5) return "spring"
    if (month >= 6 && month <= 8) return "summer"
    if (month >= 9 && month <= 11) return "autumn"
    return "winter"
  }

  // Local storage management
  loadUserPreferences() {
    const saved = localStorage.getItem("userPreferences")
    return saved
      ? JSON.parse(saved)
      : {
          preferredLocation: null,
          budgetRange: [5000, 15000],
          preferredAmenities: ["WiFi", "Mess"],
          minRating: 3.0,
          hostelType: null,
        }
  }

  saveUserPreferences() {
    localStorage.setItem("userPreferences", JSON.stringify(this.userPreferences))
  }
}

// Initialize recommendation client
const recommendationClient = new RecommendationClient()
