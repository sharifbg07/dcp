const API_BASE_URL = 'https://nghki1cjdzng.manus.space/api'

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body)
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  // Comparison endpoints
  async getComparisons() {
    return this.request('/comparisons/')
  }

  async createComparison(data) {
    return this.request('/comparisons/', {
      method: 'POST',
      body: data,
    })
  }

  async getComparison(id) {
    return this.request(`/comparisons/${id}/`)
  }

  async updateComparison(id, data) {
    return this.request(`/comparisons/${id}/`, {
      method: 'PUT',
      body: data,
    })
  }

  async deleteComparison(id) {
    return this.request(`/comparisons/${id}/`, {
      method: 'DELETE',
    })
  }

  // Attribute endpoints
  async getAttributes(comparisonId) {
    return this.request(`/comparisons/${comparisonId}/attributes/`)
  }

  async createAttribute(comparisonId, data) {
    return this.request(`/comparisons/${comparisonId}/attributes/`, {
      method: 'POST',
      body: data,
    })
  }

  async updateAttribute(comparisonId, attributeId, data) {
    return this.request(`/comparisons/${comparisonId}/attributes/${attributeId}/`, {
      method: 'PUT',
      body: data,
    })
  }

  async deleteAttribute(comparisonId, attributeId) {
    return this.request(`/comparisons/${comparisonId}/attributes/${attributeId}/`, {
      method: 'DELETE',
    })
  }

  // Product endpoints
  async getProducts(comparisonId) {
    return this.request(`/comparisons/${comparisonId}/products/`)
  }

  async createProduct(comparisonId, data) {
    return this.request(`/comparisons/${comparisonId}/products/`, {
      method: 'POST',
      body: data,
    })
  }

  async updateProduct(comparisonId, productId, data) {
    return this.request(`/comparisons/${comparisonId}/products/${productId}/`, {
      method: 'PUT',
      body: data,
    })
  }

  async deleteProduct(comparisonId, productId) {
    return this.request(`/comparisons/${comparisonId}/products/${productId}/`, {
      method: 'DELETE',
    })
  }

  async updateProductAttributes(comparisonId, productId, attributeData) {
    return this.request(`/comparisons/${comparisonId}/products/${productId}/attributes/`, {
      method: 'POST',
      body: { attribute_data: attributeData },
    })
  }

  // Ranking results
  async getRankingResults(comparisonId, sortBy = null, sortOrder = 'desc') {
    const params = new URLSearchParams()
    if (sortBy) params.append('sort_by', sortBy)
    if (sortOrder) params.append('sort_order', sortOrder)
    
    const queryString = params.toString()
    const endpoint = `/comparisons/${comparisonId}/results/${queryString ? `?${queryString}` : ''}`
    
    return this.request(endpoint)
  }
}

export const apiService = new ApiService()
export default apiService

