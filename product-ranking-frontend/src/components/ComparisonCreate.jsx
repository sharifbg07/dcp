import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import apiService from '@/lib/api'

export default function ComparisonCreate() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })
  
  const [attributes, setAttributes] = useState([
    { name: '', data_type: 'text', unit: '' }
  ])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleAttributeChange = (index, field, value) => {
    setAttributes(prev => prev.map((attr, i) => 
      i === index ? { ...attr, [field]: value } : attr
    ))
  }

  const addAttribute = () => {
    setAttributes(prev => [...prev, { name: '', data_type: 'text', unit: '' }])
  }

  const removeAttribute = (index) => {
    if (attributes.length > 1) {
      setAttributes(prev => prev.filter((_, i) => i !== index))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a comparison name",
        variant: "destructive",
      })
      return
    }

    const validAttributes = attributes.filter(attr => attr.name.trim())
    if (validAttributes.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one attribute",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      
      // Create comparison
      const comparison = await apiService.createComparison(formData)
      
      // Create attributes
      for (const attr of validAttributes) {
        await apiService.createAttribute(comparison.id, {
          name: attr.name.trim(),
          data_type: attr.data_type,
          unit: attr.unit.trim() || null
        })
      }

      toast({
        title: "Success",
        description: "Comparison created successfully",
      })
      
      navigate(`/comparison/${comparison.id}`)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create comparison",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Create New Comparison</h2>
          <p className="text-muted-foreground">
            Set up a new product comparison with custom attributes
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Enter the basic details for your comparison
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Comparison Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Laptop Comparison, Smartphone Comparison"
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
                placeholder="Optional description of what you're comparing"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attributes</CardTitle>
            <CardDescription>
              Define the attributes you want to compare (e.g., CPU, Price, RAM)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {attributes.map((attribute, index) => (
              <div key={index} className="flex gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <Label>Attribute Name *</Label>
                  <Input
                    value={attribute.name}
                    onChange={(e) => handleAttributeChange(index, 'name', e.target.value)}
                    placeholder="e.g., CPU, Price, RAM"
                  />
                </div>
                
                <div className="w-32 space-y-2">
                  <Label>Data Type</Label>
                  <Select
                    value={attribute.data_type}
                    onValueChange={(value) => handleAttributeChange(index, 'data_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="boolean">Boolean</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="w-24 space-y-2">
                  <Label>Unit</Label>
                  <Input
                    value={attribute.unit}
                    onChange={(e) => handleAttributeChange(index, 'unit', e.target.value)}
                    placeholder="e.g., GB, USD"
                  />
                </div>
                
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAttribute(index)}
                  disabled={attributes.length === 1}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            <Button
              type="button"
              variant="outline"
              onClick={addAttribute}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Attribute
            </Button>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={() => navigate('/')}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Comparison'}
          </Button>
        </div>
      </form>
    </div>
  )
}

