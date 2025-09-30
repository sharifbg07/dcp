from django.db import models
from django.utils import timezone


class Comparison(models.Model):
    """Model to store comparison projects"""
    name = models.CharField(max_length=200, help_text="Name of the comparison (e.g., 'Laptop Comparison')")
    description = models.TextField(blank=True, null=True, help_text="Optional description of the comparison")
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class Attribute(models.Model):
    """Model to store attributes for comparison"""
    DATA_TYPE_CHOICES = [
        ('text', 'Text'),
        ('number', 'Number'),
        ('boolean', 'Boolean'),
    ]
    
    comparison = models.ForeignKey(Comparison, on_delete=models.CASCADE, related_name='attributes')
    name = models.CharField(max_length=100, help_text="Name of the attribute (e.g., 'CPU', 'Price', 'RAM')")
    data_type = models.CharField(max_length=10, choices=DATA_TYPE_CHOICES, default='text')
    unit = models.CharField(max_length=20, blank=True, null=True, help_text="Unit of measurement (e.g., 'GHz', 'USD', 'GB')")
    
    class Meta:
        unique_together = ['comparison', 'name']
        ordering = ['name']

    def __str__(self):
        return f"{self.comparison.name} - {self.name}"


class Product(models.Model):
    """Model to store products in a comparison"""
    comparison = models.ForeignKey(Comparison, on_delete=models.CASCADE, related_name='products')
    name = models.CharField(max_length=200, help_text="Name of the product")
    description = models.TextField(blank=True, null=True, help_text="Optional description of the product")
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['comparison', 'name']
        ordering = ['name']

    def __str__(self):
        return f"{self.comparison.name} - {self.name}"


class ProductAttributeData(models.Model):
    """Model to store attribute data for products"""
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='attribute_data')
    attribute = models.ForeignKey(Attribute, on_delete=models.CASCADE)
    value = models.TextField(help_text="Value of the attribute for this product")

    class Meta:
        unique_together = ['product', 'attribute']

    def __str__(self):
        return f"{self.product.name} - {self.attribute.name}: {self.value}"

    def get_numeric_value(self):
        """Convert value to numeric if possible, for sorting purposes"""
        try:
            return float(self.value)
        except (ValueError, TypeError):
            return 0
