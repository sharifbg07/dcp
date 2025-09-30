from rest_framework import generics, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Q
from .models import Comparison, Attribute, Product, ProductAttributeData
from .serializers import (
    ComparisonSerializer, ComparisonListSerializer, AttributeSerializer,
    ProductSerializer, ProductCreateSerializer, ProductAttributeDataSerializer,
    RankingResultSerializer
)


class ComparisonListCreateView(generics.ListCreateAPIView):
    """List all comparisons or create a new comparison"""
    queryset = Comparison.objects.all()
    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return ComparisonListSerializer
        return ComparisonSerializer


class ComparisonDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a comparison"""
    queryset = Comparison.objects.all()
    serializer_class = ComparisonSerializer


class AttributeListCreateView(generics.ListCreateAPIView):
    """List attributes for a comparison or create new attributes"""
    serializer_class = AttributeSerializer
    
    def get_queryset(self):
        comparison_id = self.kwargs.get('comparison_id')
        return Attribute.objects.filter(comparison_id=comparison_id)
    
    def perform_create(self, serializer):
        comparison_id = self.kwargs.get('comparison_id')
        serializer.save(comparison_id=comparison_id)


class AttributeDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete an attribute"""
    serializer_class = AttributeSerializer
    
    def get_queryset(self):
        comparison_id = self.kwargs.get('comparison_id')
        return Attribute.objects.filter(comparison_id=comparison_id)


class ProductListCreateView(generics.ListCreateAPIView):
    """List products for a comparison or create new products"""
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ProductCreateSerializer
        return ProductSerializer
    
    def get_queryset(self):
        comparison_id = self.kwargs.get('comparison_id')
        return Product.objects.filter(comparison_id=comparison_id)
    
    def perform_create(self, serializer):
        comparison_id = self.kwargs.get('comparison_id')
        print(f"Creating product for comparison {comparison_id}")
        print(f"Request data: {self.request.data}")
        serializer.save(comparison_id=comparison_id)


class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a product"""
    serializer_class = ProductSerializer
    
    def get_queryset(self):
        comparison_id = self.kwargs.get('comparison_id')
        return Product.objects.filter(comparison_id=comparison_id)


@api_view(['POST'])
def update_product_attributes(request, comparison_id, product_id):
    """Update attribute data for a product"""
    try:
        product = Product.objects.get(id=product_id, comparison_id=comparison_id)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
    
    attribute_data = request.data.get('attribute_data', [])
    
    # Clear existing attribute data
    ProductAttributeData.objects.filter(product=product).delete()
    
    # Create new attribute data
    for attr_data in attribute_data:
        attribute_id = attr_data.get('attribute_id')
        value = attr_data.get('value')
        
        if attribute_id and value is not None:
            try:
                attribute = Attribute.objects.get(id=attribute_id, comparison=product.comparison)
                ProductAttributeData.objects.create(
                    product=product,
                    attribute=attribute,
                    value=str(value)
                )
            except Attribute.DoesNotExist:
                continue
    
    # Return updated product
    serializer = ProductSerializer(product)
    return Response(serializer.data)


@api_view(['GET'])
def get_ranking_results(request, comparison_id):
    """Get ranking results for a comparison"""
    try:
        comparison = Comparison.objects.get(id=comparison_id)
    except Comparison.DoesNotExist:
        return Response({'error': 'Comparison not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Get sorting parameters
    sort_by = request.GET.get('sort_by')  # attribute name
    sort_order = request.GET.get('sort_order', 'desc')  # 'asc' or 'desc'
    
    products = Product.objects.filter(comparison=comparison).prefetch_related('attribute_data__attribute')
    
    results = []
    for product in products:
        attribute_values = {}
        for attr_data in product.attribute_data.all():
            attribute_values[attr_data.attribute.name] = {
                'value': attr_data.value,
                'unit': attr_data.attribute.unit,
                'data_type': attr_data.attribute.data_type
            }
        
        results.append({
            'product_id': product.id,
            'product_name': product.name,
            'attribute_values': attribute_values
        })
    
    # Sort results if sort_by is specified
    if sort_by:
        def get_sort_value(item):
            attr_value = item['attribute_values'].get(sort_by, {}).get('value', '')
            try:
                return float(attr_value)
            except (ValueError, TypeError):
                return attr_value.lower() if isinstance(attr_value, str) else ''
        
        reverse_order = sort_order == 'desc'
        results.sort(key=get_sort_value, reverse=reverse_order)
    
    # Add ranking
    for i, result in enumerate(results, 1):
        result['rank'] = i
    
    return Response({
        'comparison': ComparisonSerializer(comparison).data,
        'results': results,
        'sort_by': sort_by,
        'sort_order': sort_order
    })
