import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Eye, Trash2, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import apiService from '@/lib/api'

export default function Dashboard() {
  const [comparisons, setComparisons] = useState([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadComparisons()
  }, [])

  const loadComparisons = async () => {
    try {
      setLoading(true)
      const data = await apiService.getComparisons()
      setComparisons(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load comparisons",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this comparison?')) return

    try {
      await apiService.deleteComparison(id)
      setComparisons(comparisons.filter(c => c.id !== id))
      toast({
        title: "Success",
        description: "Comparison deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete comparison",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Manage your product comparisons and rankings
          </p>
        </div>
        <Link to="/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Comparison
          </Button>
        </Link>
      </div>

      {comparisons.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No comparisons yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first product comparison to get started with ranking and analysis.
            </p>
            <Link to="/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Comparison
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {comparisons.map((comparison) => (
            <Card key={comparison.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{comparison.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {comparison.description || 'No description'}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(comparison.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex gap-2">
                    <Badge variant="secondary">
                      {comparison.product_count} products
                    </Badge>
                    <Badge variant="outline">
                      {comparison.attribute_count} attributes
                    </Badge>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Link to={`/comparison/${comparison.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </Button>
                  </Link>
                  
                  {comparison.product_count > 1 && (
                    <Link to={`/comparison/${comparison.id}/results`} className="flex-1">
                      <Button size="sm" className="w-full">
                        <BarChart3 className="mr-2 h-4 w-4" />
                        See Results
                      </Button>
                    </Link>
                  )}
                </div>
                
                <div className="text-xs text-muted-foreground mt-2">
                  Created {new Date(comparison.created_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

