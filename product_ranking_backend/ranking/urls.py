from django.urls import path
from . import views

urlpatterns = [
    # Comparison URLs
    path('comparisons/', views.ComparisonListCreateView.as_view(), name='comparison-list-create'),
    path('comparisons/<int:pk>/', views.ComparisonDetailView.as_view(), name='comparison-detail'),
    
    # Attribute URLs
    path('comparisons/<int:comparison_id>/attributes/', views.AttributeListCreateView.as_view(), name='attribute-list-create'),
    path('comparisons/<int:comparison_id>/attributes/<int:pk>/', views.AttributeDetailView.as_view(), name='attribute-detail'),
    
    # Product URLs
    path('comparisons/<int:comparison_id>/products/', views.ProductListCreateView.as_view(), name='product-list-create'),
    path('comparisons/<int:comparison_id>/products/<int:pk>/', views.ProductDetailView.as_view(), name='product-detail'),
    
    # Product attribute data
    path('comparisons/<int:comparison_id>/products/<int:product_id>/attributes/', views.update_product_attributes, name='update-product-attributes'),
    
    # Ranking results
    path('comparisons/<int:comparison_id>/results/', views.get_ranking_results, name='ranking-results'),
]

