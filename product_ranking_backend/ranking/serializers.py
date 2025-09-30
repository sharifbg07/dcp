from rest_framework import serializers
from .models import Comparison, Attribute, Product, ProductAttributeData


class AttributeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attribute
        fields = ['id', 'name', 'data_type', 'unit']


class ProductAttributeDataSerializer(serializers.ModelSerializer):
    attribute = AttributeSerializer(read_only=True)
    attribute_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = ProductAttributeData
        fields = ['id', 'attribute', 'attribute_id', 'value']


class ProductSerializer(serializers.ModelSerializer):
    attribute_data = ProductAttributeDataSerializer(many=True, read_only=True)
    
    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'created_at', 'updated_at', 'attribute_data']


class ComparisonSerializer(serializers.ModelSerializer):
    attributes = AttributeSerializer(many=True, read_only=True)
    products = ProductSerializer(many=True, read_only=True)
    product_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Comparison
        fields = ['id', 'name', 'description', 'created_at', 'updated_at', 'attributes', 'products', 'product_count']
    
    def get_product_count(self, obj):
        return obj.products.count()


class ComparisonListSerializer(serializers.ModelSerializer):
    """Simplified serializer for listing comparisons"""
    product_count = serializers.SerializerMethodField()
    attribute_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Comparison
        fields = ['id', 'name', 'description', 'created_at', 'updated_at', 'product_count', 'attribute_count']
    
    def get_product_count(self, obj):
        return obj.products.count()
    
    def get_attribute_count(self, obj):
        return obj.attributes.count()


class ProductCreateSerializer(serializers.ModelSerializer):
    attribute_data = serializers.ListField(
        child=serializers.DictField(
            child=serializers.CharField()
        ),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'attribute_data']
    
    def validate(self, data):
        print(f"Validating data: {data}")
        return data
    
    def create(self, validated_data):
        print(f"Creating product with validated data: {validated_data}")
        attribute_data = validated_data.pop('attribute_data', [])
        product = Product.objects.create(**validated_data)
        
        # Create attribute data
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
                    pass
        
        return product


class RankingResultSerializer(serializers.Serializer):
    """Serializer for ranking results"""
    product_id = serializers.IntegerField()
    product_name = serializers.CharField()
    attribute_values = serializers.DictField()
    rank = serializers.IntegerField()
    score = serializers.FloatField(required=False)

