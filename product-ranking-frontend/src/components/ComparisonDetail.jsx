import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Plus, Edit, Trash2, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import apiService from '@/lib/api'
import ProductForm from './ProductForm'

export default function ComparisonDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [comparison, setComparison] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showProductForm, setShowProductForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)

  useEffect(() => {
    loadComparison()
  }, [id])

  const loadComparison = async () => {
    try {
      setLoading(true)
      const data = await apiService.getComparison(id)
      setComparison(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load comparison",
        variant: "destructive",
      })
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProduct = async (productId) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      await apiService.deleteProduct(id, productId)
      await loadComparison()
      toast({
        title: "Success",
        description: "Product deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      })
    }
  }

  const handleProductSaved = () => {
    setShowProductForm(false)
    setEditingProduct(null)
    loadComparison()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!comparison) {
    return (
      <div className="text-center py-16">
        <h3 className="text-lg font-semibold mb-2">Comparison not found</h3>
        <Button onClick={() => navigate('/')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold tracking-tight">{comparison.name}</h2>
          {comparison.description && (
            <p className="text-muted-foreground">{comparison.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowProductForm(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
          {comparison.products.length > 1 && (
            <Link to={`/comparison/${id}/results`}>
              <Button>
                <BarChart3 className="mr-2 h-4 w-4" />
                See Results
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Attributes */}
      <Card>
        <CardHeader>
          <CardTitle>Attributes</CardTitle>
          <CardDescription>
            The attributes used for comparison
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {comparison.attributes.map((attribute) => (
              <Badge key={attribute.id} variant="secondary">
                {attribute.name}
                {attribute.unit && ` (${attribute.unit})`}
                <span className="ml-1 text-xs opacity-70">
                  {attribute.data_type}
                </span>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Products */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Products ({comparison.products.length})</CardTitle>
              <CardDescription>
                Products in this comparison
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {comparison.products.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No products added yet</p>
              <Button onClick={() => setShowProductForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add First Product
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {comparison.products.map((product) => (
                <div key={product.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold">{product.name}</h4>
                      {product.description && (
                        <p className="text-sm text-muted-foreground">
                          {product.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingProduct(product)
                          setShowProductForm(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteProduct(product.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {product.attribute_data.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {product.attribute_data.map((data) => (
                        <div key={data.id} className="text-sm">
                          <span className="font-medium">{data.attribute.name}:</span>
                          <span className="ml-1">
                            {data.value}
                            {data.attribute.unit && ` ${data.attribute.unit}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Form Modal */}
      {showProductForm && (
        <ProductForm
          comparison={comparison}
          product={editingProduct}
          onSave={handleProductSaved}
          onCancel={() => {
            setShowProductForm(false)
            setEditingProduct(null)
          }}
        />
      )}
    </div>
  )
}

