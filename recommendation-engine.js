// Advanced Recommendation Engine for Nepal Hostel Finder
class HostelRecommendationEngine {
  constructor() {
    this.userProfiles = new Map()
    this.hostelFeatures = new Map()
    this.userInteractions = []
  }

  // Content-Based Filtering Algorithm
  contentBasedRecommendation(userId, hostels, userPreferences) {
    const userProfile = this.getUserProfile(userId)
    const recommendations = []

    for (const hostel of hostels) {
      const contentScore = this.calculateContentSimilarity(hostel, userProfile, userPreferences)
      recommendations.push({
        hostel,
        score: contentScore,
        reason: this.generateContentReason(hostel, userProfile),
      })
    }

    return recommendations.sort((a, b) => b.score - a.score).slice(0, 10) // Top 10 recommendations
  }

  // Context-Based Filtering Algorithm
  contextBasedRecommendation(userId, hostels, context) {
    const contextualScores = []

    for (const hostel of hostels) {
      const contextScore = this.calculateContextualScore(hostel, context)
      contextualScores.push({
        hostel,
        score: contextScore,
        reason: this.generateContextReason(hostel, context),
      })
    }

    return contextualScores.sort((a, b) => b.score - a.score).slice(0, 10)
  }

  // Collaborative Filtering Algorithm
  collaborativeFiltering(userId, hostels) {
    const userSimilarities = this.findSimilarUsers(userId)
    const recommendations = []

    for (const hostel of hostels) {
      const collaborativeScore = this.calculateCollaborativeScore(hostel, userSimilarities)
      recommendations.push({
        hostel,
        score: collaborativeScore,
        reason: this.generateCollaborativeReason(hostel, userSimilarities),
      })
    }

    return recommendations.sort((a, b) => b.score - a.score).slice(0, 10)
  }

  // Hybrid Recommendation (Combines all algorithms)
  hybridRecommendation(userId, hostels, userPreferences, context) {
    const contentRecs = this.contentBasedRecommendation(userId, hostels, userPreferences)
    const contextRecs = this.contextBasedRecommendation(userId, hostels, context)
    const collaborativeRecs = this.collaborativeFiltering(userId, hostels)

    // Weighted combination
    const hybridScores = new Map()

    // Content-based weight: 40%
    contentRecs.forEach((rec) => {
      const hostelId = rec.hostel._id
      hybridScores.set(hostelId, (hybridScores.get(hostelId) || 0) + rec.score * 0.4)
    })

    // Context-based weight: 35%
    contextRecs.forEach((rec) => {
      const hostelId = rec.hostel._id
      hybridScores.set(hostelId, (hybridScores.get(hostelId) || 0) + rec.score * 0.35)
    })

    // Collaborative weight: 25%
    collaborativeRecs.forEach((rec) => {
      const hostelId = rec.hostel._id
      hybridScores.set(hostelId, (hybridScores.get(hostelId) || 0) + rec.score * 0.25)
    })

    // Create final recommendations
    const finalRecs = []
    for (const [hostelId, score] of hybridScores) {
      const hostel = hostels.find((h) => h._id === hostelId)
      if (hostel) {
        finalRecs.push({
          hostel,
          score,
          reason: this.generateHybridReason(hostel, contentRecs, contextRecs, collaborativeRecs),
        })
      }
    }

    return finalRecs.sort((a, b) => b.score - a.score).slice(0, 10)
  }

  // Calculate Content Similarity Score
  calculateContentSimilarity(hostel, userProfile, userPreferences) {
    let score = 0

    // Location preference (30% weight)
    if (userPreferences.preferredLocation === hostel.location) {
      score += 30
    }

    // Price preference (25% weight)
    const priceScore = this.calculatePriceScore(hostel.price, userPreferences.budgetRange)
    score += priceScore * 0.25

    // Amenities matching (20% weight)
    const amenityScore = this.calculateAmenityScore(hostel.amenities, userPreferences.preferredAmenities)
    score += amenityScore * 0.2

    // Rating preference (15% weight)
    if (hostel.rating >= userPreferences.minRating) {
      score += 15
    }

    // Hostel type preference (10% weight)
    if (userPreferences.hostelType === hostel.type) {
      score += 10
    }

    return Math.min(score, 100) // Cap at 100
  }

  // Calculate Contextual Score
  calculateContextualScore(hostel, context) {
    let score = 0

    // Time-based scoring
    if (context.timeOfDay === "evening" && hostel.amenities.includes("24/7 Security")) {
      score += 20
    }

    // Weather-based scoring
    if (context.weather === "cold" && hostel.amenities.includes("Hot Water")) {
      score += 15
    }

    // Seasonal scoring
    if (context.season === "festival" && hostel.location === "Kathmandu") {
      score += 25 // Kathmandu is popular during festivals
    }

    // Urgency scoring
    if (context.urgency === "immediate" && hostel.capacity > 20) {
      score += 20 // Higher capacity = more likely to have availability
    }

    // Distance from landmarks
    if (context.nearLandmarks && this.isNearLandmarks(hostel, context.landmarks)) {
      score += 30
    }

    return Math.min(score, 100)
  }

  // Calculate Collaborative Score
  calculateCollaborativeScore(hostel, similarUsers) {
    let score = 0
    let totalWeight = 0

    for (const [userId, similarity] of similarUsers) {
      const userRating = this.getUserRatingForHostel(userId, hostel._id)
      if (userRating > 0) {
        score += userRating * similarity
        totalWeight += similarity
      }
    }

    return totalWeight > 0 ? (score / totalWeight) * 20 : 0 // Scale to 0-100
  }

  // Helper Methods
  calculatePriceScore(hostelPrice, budgetRange) {
    const [minBudget, maxBudget] = budgetRange
    if (hostelPrice >= minBudget && hostelPrice <= maxBudget) {
      return 100
    }

    // Penalty for being outside budget
    const deviation = Math.min(Math.abs(hostelPrice - minBudget), Math.abs(hostelPrice - maxBudget))
    return Math.max(0, 100 - (deviation / 1000) * 10) // Reduce score based on price deviation
  }

  calculateAmenityScore(hostelAmenities, preferredAmenities) {
    if (!preferredAmenities || preferredAmenities.length === 0) return 50

    const matchingAmenities = hostelAmenities.filter((amenity) => preferredAmenities.includes(amenity))

    return (matchingAmenities.length / preferredAmenities.length) * 100
  }

  findSimilarUsers(userId) {
    const similarities = new Map()
    const userInteractions = this.getUserInteractions(userId)

    for (const [otherUserId, otherInteractions] of this.userInteractions) {
      if (otherUserId !== userId) {
        const similarity = this.calculateUserSimilarity(userInteractions, otherInteractions)
        if (similarity > 0.3) {
          // Threshold for similarity
          similarities.set(otherUserId, similarity)
        }
      }
    }

    return Array.from(similarities.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10) // Top 10 similar users
  }

  calculateUserSimilarity(user1Interactions, user2Interactions) {
    // Cosine similarity calculation
    const commonHostels = new Set()
    const user1Hostels = new Set(user1Interactions.map((i) => i.hostelId))
    const user2Hostels = new Set(user2Interactions.map((i) => i.hostelId))

    for (const hostelId of user1Hostels) {
      if (user2Hostels.has(hostelId)) {
        commonHostels.add(hostelId)
      }
    }

    if (commonHostels.size === 0) return 0

    let dotProduct = 0
    let norm1 = 0
    let norm2 = 0

    for (const hostelId of commonHostels) {
      const rating1 = user1Interactions.find((i) => i.hostelId === hostelId)?.rating || 0
      const rating2 = user2Interactions.find((i) => i.hostelId === hostelId)?.rating || 0

      dotProduct += rating1 * rating2
      norm1 += rating1 * rating1
      norm2 += rating2 * rating2
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2))
  }

  // Reason Generation
  generateContentReason(hostel, userProfile) {
    const reasons = []

    if (userProfile.preferredLocation === hostel.location) {
      reasons.push(`Located in your preferred area: ${hostel.location}`)
    }

    if (hostel.rating >= 4.0) {
      reasons.push(`Highly rated (${hostel.rating}/5 stars)`)
    }

    if (hostel.amenities.includes("WiFi")) {
      reasons.push("Has WiFi connectivity")
    }

    return reasons.join(", ") || "Matches your preferences"
  }

  generateContextReason(hostel, context) {
    const reasons = []

    if (context.urgency === "immediate" && hostel.capacity > 20) {
      reasons.push("High availability for immediate booking")
    }

    if (context.season === "festival" && hostel.location === "Kathmandu") {
      reasons.push("Perfect location for festival season")
    }

    return reasons.join(", ") || "Suitable for current context"
  }

  generateCollaborativeReason(hostel, similarUsers) {
    return `Recommended by users with similar preferences (${similarUsers.length} similar users)`
  }

  generateHybridReason(hostel, contentRecs, contextRecs, collaborativeRecs) {
    return `Best overall match based on your preferences, current context, and similar users`
  }

  // User Profile Management
  getUserProfile(userId) {
    return (
      this.userProfiles.get(userId) || {
        preferredLocation: null,
        budgetRange: [0, 50000],
        preferredAmenities: [],
        minRating: 3.0,
        hostelType: null,
      }
    )
  }

  updateUserProfile(userId, preferences) {
    this.userProfiles.set(userId, { ...this.getUserProfile(userId), ...preferences })
  }

  // Interaction Tracking
  trackUserInteraction(userId, hostelId, interactionType, rating = null) {
    this.userInteractions.push({
      userId,
      hostelId,
      interactionType, // 'view', 'like', 'book', 'rate'
      rating,
      timestamp: new Date(),
    })
  }

  getUserInteractions(userId) {
    return this.userInteractions.filter((interaction) => interaction.userId === userId)
  }

  getUserRatingForHostel(userId, hostelId) {
    const interaction = this.userInteractions.find((i) => i.userId === userId && i.hostelId === hostelId && i.rating)
    return interaction ? interaction.rating : 0
  }

  // Utility Methods
  isNearLandmarks(hostel, landmarks) {
    // Simple landmark proximity check (in real app, use geolocation)
    const hostelLandmarks = {
      Kathmandu: ["Durbar Square", "Thamel", "Swayambhunath"],
      Lalitpur: ["Patan Durbar Square", "Golden Temple"],
      Bhaktapur: ["Bhaktapur Durbar Square", "Nyatapola Temple"],
    }

    const nearbyLandmarks = hostelLandmarks[hostel.location] || []
    return landmarks.some((landmark) => nearbyLandmarks.includes(landmark))
  }
}

// Export for use in other files
export default HostelRecommendationEngine
