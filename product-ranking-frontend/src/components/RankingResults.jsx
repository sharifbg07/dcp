import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import apiService from '@/lib/api'

export default function RankingResults() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('')
  const [sortOrder, setSortOrder] = useState('desc')

  useEffect(() => {
    loadResults()
  }, [id, sortBy, sortOrder])

  const loadResults = async () => {
    try {
      setLoading(true)
      const data = await apiService.getRankingResults(id, sortBy || null, sortOrder)
      setResults(data)
      console.log('Results loaded:', data)
    } catch (error) {
      console.error('Error loading results:', error)
      toast({
        title: "Error",
        description: "Failed to load ranking results",
        variant: "destructive",
      })
      navigate(`/comparison/${id}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSortChange = (attributeName) => {
    if (sortBy === attributeName) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')
    } else {
      setSortBy(attributeName)
      setSortOrder('desc')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!results) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">No results found</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(`/comparison/${id}`)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Comparison
        </button>
        <h1 className="text-2xl font-bold">{results.comparison.name} - Results</h1>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Sort by Attribute:</h2>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => handleSortChange('')}
            className={`px-4 py-2 rounded ${!sortBy ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
          >
            Default Order
          </button>
          {results.comparison.attributes.map((attr) => (
            <button
              key={attr.id}
              onClick={() => handleSortChange(attr.name)}
              className={`px-4 py-2 rounded flex items-center gap-2 ${
                sortBy === attr.name ? 'bg-blue-500 text-white' : 'bg-gray-100'
              }`}
            >
              {attr.name}
              {sortBy === attr.name && (
                sortOrder === 'desc' ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Ranking Results:</h2>
        {results.results.map((result, index) => (
          <div key={result.product_id} className="border rounded-lg p-4 bg-white shadow">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">
                #{result.rank} - {result.product_name}
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(result.attribute_values).map(([attrName, attrData]) => (
                <div key={attrName} className="flex justify-between">
                  <span className="font-medium">{attrName}:</span>
                  <span>
                    {attrData.value} {attrData.unit && attrData.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

