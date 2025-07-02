// Advanced Recommendation Engine for Nepal Hostel Finder
class HostelRecommendationEngine {
  constructor() {
    this.userProfiles = new Map()
    this.userInteractions = new Map()
  }

  // Content-Based Filtering Algorithm
  contentBasedRecommendation(userId, hostels, userPreferences) {
    const recommendations = []

    for (const hostel of hostels) {
      const contentScore = this.calculateContentSimilarity(hostel, userPreferences)
      recommendations.push({
        hostel,
        score: contentScore,
        reason: this.generateContentReason(hostel, userPreferences),
      })
    }

    return recommendations.sort((a, b) => b.score - a.score).slice(0, 10)
  }

  // Context-Based Filtering Algorithm
  contextBasedRecommendation(userId, hostels, context) {
    const recommendations = []

    for (const hostel of hostels) {
      const contextScore = this.calculateContextualScore(hostel, context)
      recommendations.push({
        hostel,
        score: contextScore,
        reason: this.generateContextReason(hostel, context),
      })
    }

    return recommendations.sort((a, b) => b.score - a.score).slice(0, 10)
  }

  // Collaborative Filtering Algorithm
  collaborativeFiltering(userId, hostels, userInteractions) {
    const recommendations = []
    const userSimilarities = this.findSimilarUsers(userId, userInteractions)

    for (const hostel of hostels) {
      const collaborativeScore = this.calculateCollaborativeScore(hostel, userSimilarities, userInteractions)
      recommendations.push({
        hostel,
        score: collaborativeScore,
        reason: this.generateCollaborativeReason(hostel, userSimilarities),
      })
    }

    return recommendations.sort((a, b) => b.score - a.score).slice(0, 10)
  }

  // Hybrid Recommendation (Combines all algorithms)
  hybridRecommendation(userId, hostels, userPreferences, context, userInteractions = []) {
    const contentRecs = this.contentBasedRecommendation(userId, hostels, userPreferences)
    const contextRecs = this.contextBasedRecommendation(userId, hostels, context)
    const collaborativeRecs = this.collaborativeFiltering(userId, hostels, userInteractions)

    // Weighted combination
    const hybridScores = new Map()

    // Content-based weight: 40%
    contentRecs.forEach((rec) => {
      const hostelId = rec.hostel._id.toString()
      hybridScores.set(hostelId, (hybridScores.get(hostelId) || 0) + rec.score * 0.4)
    })

    // Context-based weight: 35%
    contextRecs.forEach((rec) => {
      const hostelId = rec.hostel._id.toString()
      hybridScores.set(hostelId, (hybridScores.get(hostelId) || 0) + rec.score * 0.35)
    })

    // Collaborative weight: 25%
    collaborativeRecs.forEach((rec) => {
      const hostelId = rec.hostel._id.toString()
      hybridScores.set(hostelId, (hybridScores.get(hostelId) || 0) + rec.score * 0.25)
    })

    // Create final recommendations
    const finalRecs = []
    for (const [hostelId, score] of hybridScores) {
      const hostel = hostels.find((h) => h._id.toString() === hostelId)
      if (hostel) {
        finalRecs.push({
          hostel,
          score,
          reason: this.generateHybridReason(hostel, score),
        })
      }
    }

    return finalRecs.sort((a, b) => b.score - a.score).slice(0, 10)
  }

  // Calculate Content Similarity Score
  calculateContentSimilarity(hostel, userPreferences) {
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

    return Math.min(score, 100)
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
      score += 25
    }

    // Urgency scoring
    if (context.urgency === "immediate" && hostel.capacity > 30) {
      score += 20
    }

    // Landmark proximity
    if (context.nearLandmarks && this.isNearLandmarks(hostel, context.landmarks)) {
      score += 30
    }

    return Math.min(score, 100)
  }

  // Calculate Collaborative Score
  calculateCollaborativeScore(hostel, similarUsers, userInteractions) {
    let score = 0
    let totalWeight = 0

    for (const [userId, similarity] of similarUsers) {
      const userRating = this.getUserRatingForHostel(userId, hostel._id, userInteractions)
      if (userRating > 0) {
        score += userRating * similarity
        totalWeight += similarity
      }
    }

    return totalWeight > 0 ? (score / totalWeight) * 20 : 0
  }

  // Helper Methods
  calculatePriceScore(hostelPrice, budgetRange) {
    const [minBudget, maxBudget] = budgetRange
    if (hostelPrice >= minBudget && hostelPrice <= maxBudget) {
      return 100
    }

    const deviation = Math.min(Math.abs(hostelPrice - minBudget), Math.abs(hostelPrice - maxBudget))
    return Math.max(0, 100 - (deviation / 1000) * 10)
  }

  calculateAmenityScore(hostelAmenities, preferredAmenities) {
    if (!preferredAmenities || preferredAmenities.length === 0) return 50

    const matchingAmenities = hostelAmenities.filter((amenity) => preferredAmenities.includes(amenity))

    return (matchingAmenities.length / preferredAmenities.length) * 100
  }

  findSimilarUsers(userId, userInteractions) {
    const similarities = new Map()
    const userInteractionMap = new Map()

    // Group interactions by user
    userInteractions.forEach((interaction) => {
      if (!userInteractionMap.has(interaction.userId)) {
        userInteractionMap.set(interaction.userId, [])
      }
      userInteractionMap.get(interaction.userId).push(interaction)
    })

    const currentUserInteractions = userInteractionMap.get(userId) || []

    for (const [otherUserId, otherInteractions] of userInteractionMap) {
      if (otherUserId !== userId) {
        const similarity = this.calculateUserSimilarity(currentUserInteractions, otherInteractions)
        if (similarity > 0.3) {
          similarities.set(otherUserId, similarity)
        }
      }
    }

    return Array.from(similarities.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
  }

  calculateUserSimilarity(user1Interactions, user2Interactions) {
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
      const rating1 = user1Interactions.find((i) => i.hostelId === hostelId)?.rating || 3
      const rating2 = user2Interactions.find((i) => i.hostelId === hostelId)?.rating || 3

      dotProduct += rating1 * rating2
      norm1 += rating1 * rating1
      norm2 += rating2 * rating2
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2))
  }

  getUserRatingForHostel(userId, hostelId, userInteractions) {
    const interaction = userInteractions.find((i) => i.userId === userId && i.hostelId === hostelId && i.rating)
    return interaction ? interaction.rating : 0
  }

  isNearLandmarks(hostel, landmarks) {
    return landmarks.some((landmark) => hostel.nearbyLandmarks.includes(landmark))
  }

  // Reason Generation
  generateContentReason(hostel, userPreferences) {
    const reasons = []

    if (userPreferences.preferredLocation === hostel.location) {
      reasons.push(`Located in your preferred area: ${hostel.location}`)
    }

    if (hostel.rating >= userPreferences.minRating) {
      reasons.push(`Meets your rating requirement (${hostel.rating}/5 stars)`)
    }

    if (userPreferences.preferredAmenities.some((amenity) => hostel.amenities.includes(amenity))) {
      reasons.push("Has your preferred amenities")
    }

    return reasons.join(", ") || "Matches your preferences"
  }

  generateContextReason(hostel, context) {
    const reasons = []

    if (context.urgency === "immediate" && hostel.capacity > 30) {
      reasons.push("High availability for immediate booking")
    }

    if (context.season === "festival" && hostel.location === "Kathmandu") {
      reasons.push("Perfect location for festival season")
    }

    return reasons.join(", ") || "Suitable for current context"
  }

  generateCollaborativeReason(hostel, similarUsers) {
    return `Recommended by ${similarUsers.length} users with similar preferences`
  }

  generateHybridReason(hostel, score) {
    if (score > 80) return "Excellent match based on all factors"
    if (score > 60) return "Good match for your preferences"
    if (score > 40) return "Decent option to consider"
    return "Alternative option"
  }
}

export default HostelRecommendationEngine
