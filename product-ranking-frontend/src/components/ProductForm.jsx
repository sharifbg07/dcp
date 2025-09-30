import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import apiService from '@/lib/api'

export default function ProductForm({ comparison, product, onSave, onCancel }) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })
  
  const [attributeValues, setAttributeValues] = useState({})

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description || '',
      })
      
      // Set existing attribute values
      const values = {}
      product.attribute_data.forEach(data => {
        values[data.attribute.id] = data.value
      })
      setAttributeValues(values)
    } else {
      // Initialize empty attribute values
      const values = {}
      comparison.attributes.forEach(attr => {
        values[attr.id] = ''
      })
      setAttributeValues(values)
    }
  }, [product, comparison])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleAttributeChange = (attributeId, value) => {
    setAttributeValues(prev => ({
      ...prev,
      [attributeId]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a product name",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      
      // Prepare attribute data
      const attributeData = Object.entries(attributeValues)
        .filter(([_, value]) => value.toString().trim() !== '')
        .map(([attributeId, value]) => ({
          attribute_id: parseInt(attributeId),
          value: value.toString().trim()
        }))

      let savedProduct
      if (product) {
        // Update existing product
        savedProduct = await apiService.updateProduct(comparison.id, product.id, formData)
        
        // Update attribute data separately for existing products
        if (attributeData.length > 0) {
          await apiService.updateProductAttributes(comparison.id, savedProduct.id, attributeData)
        }
      } else {
        // Create new product with attribute data
        const productData = {
          ...formData,
          attribute_data: attributeData
        }
        console.log('Sending product data:', productData)
        savedProduct = await apiService.createProduct(comparison.id, productData)
      }

      toast({
        title: "Success",
        description: `Product ${product ? 'updated' : 'created'} successfully`,
      })
      
      onSave()
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${product ? 'update' : 'create'} product`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>
                {product ? 'Edit Product' : 'Add New Product'}
              </CardTitle>
              <CardDescription>
                {product ? 'Update product information and attributes' : 'Enter product information and attribute values'}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., MacBook Pro 14-inch, iPhone 13"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Optional description of the product"
                  rows={3}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Attribute Values</h4>
              <div className="grid gap-4">
                {comparison.attributes.map((attribute) => (
                  <div key={attribute.id} className="space-y-2">
                    <Label htmlFor={`attr-${attribute.id}`}>
                      {attribute.name}
                      {attribute.unit && ` (${attribute.unit})`}
                      <span className="text-xs text-muted-foreground ml-2">
                        {attribute.data_type}
                      </span>
                    </Label>
                    <Input
                      id={`attr-${attribute.id}`}
                      type={attribute.data_type === 'number' ? 'number' : 'text'}
                      value={attributeValues[attribute.id] || ''}
                      onChange={(e) => handleAttributeChange(attribute.id, e.target.value)}
                      placeholder={
                        attribute.data_type === 'number' 
                          ? 'Enter numeric value'
                          : attribute.data_type === 'boolean'
                          ? 'true/false or yes/no'
                          : 'Enter text value'
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : (product ? 'Update Product' : 'Add Product')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

