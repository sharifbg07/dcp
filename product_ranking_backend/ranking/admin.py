from django.contrib import admin
from .models import Comparison, Attribute, Product, ProductAttributeData


@admin.register(Comparison)
class ComparisonAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_at', 'updated_at']
    search_fields = ['name', 'description']
    list_filter = ['created_at']


@admin.register(Attribute)
class AttributeAdmin(admin.ModelAdmin):
    list_display = ['name', 'comparison', 'data_type', 'unit']
    list_filter = ['data_type', 'comparison']
    search_fields = ['name']


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'comparison', 'created_at']
    list_filter = ['comparison', 'created_at']
    search_fields = ['name', 'description']


@admin.register(ProductAttributeData)
class ProductAttributeDataAdmin(admin.ModelAdmin):
    list_display = ['product', 'attribute', 'value']
    list_filter = ['attribute', 'product__comparison']
    search_fields = ['product__name', 'attribute__name', 'value']
