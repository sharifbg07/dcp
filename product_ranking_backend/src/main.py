#!/usr/bin/env python3
"""
Product Ranking API - Flask Implementation
A simple Flask API that provides product ranking functionality
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import json
from datetime import datetime
import os

app = Flask(__name__)
CORS(app)

# Database setup
DB_PATH = '/tmp/product_ranking.db'

def init_db():
    """Initialize SQLite database with required tables"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create tables
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS comparisons (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS attributes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            comparison_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            data_type TEXT NOT NULL,
            unit TEXT,
            FOREIGN KEY (comparison_id) REFERENCES comparisons (id)
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            comparison_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (comparison_id) REFERENCES comparisons (id)
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS product_attribute_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER NOT NULL,
            attribute_id INTEGER NOT NULL,
            value TEXT NOT NULL,
            FOREIGN KEY (product_id) REFERENCES products (id),
            FOREIGN KEY (attribute_id) REFERENCES attributes (id)
        )
    ''')
    
    conn.commit()
    conn.close()

def get_db():
    """Get database connection"""
    return sqlite3.connect(DB_PATH)

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'Product Ranking API'})

@app.route('/api/comparisons/', methods=['GET'])
def list_comparisons():
    """List all comparisons"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT c.*, 
               COUNT(DISTINCT p.id) as product_count,
               COUNT(DISTINCT a.id) as attribute_count
        FROM comparisons c
        LEFT JOIN products p ON c.id = p.comparison_id
        LEFT JOIN attributes a ON c.id = a.comparison_id
        GROUP BY c.id
        ORDER BY c.created_at DESC
    ''')
    
    comparisons = []
    for row in cursor.fetchall():
        comparisons.append({
            'id': row[0],
            'name': row[1],
            'description': row[2],
            'created_at': row[3],
            'updated_at': row[4],
            'product_count': row[5] or 0,
            'attribute_count': row[6] or 0
        })
    
    conn.close()
    return jsonify(comparisons)

@app.route('/api/comparisons/', methods=['POST'])
def create_comparison():
    """Create new comparison"""
    data = request.get_json()
    
    if not data or not data.get('name'):
        return jsonify({'error': 'Name is required'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO comparisons (name, description)
        VALUES (?, ?)
    ''', (data['name'], data.get('description')))
    
    comparison_id = cursor.lastrowid
    conn.commit()
    
    # Get the created comparison
    cursor.execute('SELECT * FROM comparisons WHERE id = ?', (comparison_id,))
    row = cursor.fetchone()
    
    comparison = {
        'id': row[0],
        'name': row[1],
        'description': row[2],
        'created_at': row[3],
        'updated_at': row[4],
        'product_count': 0,
        'attribute_count': 0
    }
    
    conn.close()
    return jsonify(comparison), 201

@app.route('/api/comparisons/<int:comparison_id>/', methods=['GET'])
def get_comparison_detail(comparison_id):
    """Get comparison details with attributes and products"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Get comparison
    cursor.execute('SELECT * FROM comparisons WHERE id = ?', (comparison_id,))
    comp_row = cursor.fetchone()
    
    if not comp_row:
        return jsonify({'error': 'Comparison not found'}), 404
    
    # Get attributes
    cursor.execute('SELECT * FROM attributes WHERE comparison_id = ?', (comparison_id,))
    attributes = []
    for row in cursor.fetchall():
        attributes.append({
            'id': row[0],
            'name': row[2],
            'data_type': row[3],
            'unit': row[4]
        })
    
    # Get products with attribute data
    cursor.execute('SELECT * FROM products WHERE comparison_id = ?', (comparison_id,))
    products = []
    for row in cursor.fetchall():
        product_id = row[0]
        
        # Get attribute data for this product
        cursor.execute('''
            SELECT pad.*, a.name, a.data_type, a.unit
            FROM product_attribute_data pad
            JOIN attributes a ON pad.attribute_id = a.id
            WHERE pad.product_id = ?
        ''', (product_id,))
        
        attribute_data = []
        for attr_row in cursor.fetchall():
            attribute_data.append({
                'id': attr_row[0],
                'attribute': {
                    'id': attr_row[2],
                    'name': attr_row[4],
                    'data_type': attr_row[5],
                    'unit': attr_row[6]
                },
                'value': attr_row[3]
            })
        
        products.append({
            'id': row[0],
            'name': row[2],
            'description': row[3],
            'created_at': row[4],
            'updated_at': row[5],
            'attribute_data': attribute_data
        })
    
    comparison = {
        'id': comp_row[0],
        'name': comp_row[1],
        'description': comp_row[2],
        'created_at': comp_row[3],
        'updated_at': comp_row[4],
        'attributes': attributes,
        'products': products,
        'product_count': len(products)
    }
    
    conn.close()
    return jsonify(comparison)

@app.route('/api/comparisons/<int:comparison_id>/attributes/', methods=['POST'])
def create_attribute(comparison_id):
    """Create new attribute for comparison"""
    data = request.get_json()
    
    if not data or not data.get('name') or not data.get('data_type'):
        return jsonify({'error': 'Name and data_type are required'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Check if comparison exists
    cursor.execute('SELECT id FROM comparisons WHERE id = ?', (comparison_id,))
    if not cursor.fetchone():
        return jsonify({'error': 'Comparison not found'}), 404
    
    cursor.execute('''
        INSERT INTO attributes (comparison_id, name, data_type, unit)
        VALUES (?, ?, ?, ?)
    ''', (comparison_id, data['name'], data['data_type'], data.get('unit')))
    
    attribute_id = cursor.lastrowid
    conn.commit()
    
    # Get the created attribute
    cursor.execute('SELECT * FROM attributes WHERE id = ?', (attribute_id,))
    row = cursor.fetchone()
    
    attribute = {
        'id': row[0],
        'name': row[2],
        'data_type': row[3],
        'unit': row[4],
        'comparison': row[1]
    }
    
    conn.close()
    return jsonify(attribute), 201

@app.route('/api/comparisons/<int:comparison_id>/products/', methods=['POST'])
def create_product(comparison_id):
    """Create new product for comparison"""
    data = request.get_json()
    
    if not data or not data.get('name'):
        return jsonify({'error': 'Name is required'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Check if comparison exists
    cursor.execute('SELECT id FROM comparisons WHERE id = ?', (comparison_id,))
    if not cursor.fetchone():
        return jsonify({'error': 'Comparison not found'}), 404
    
    # Create product
    cursor.execute('''
        INSERT INTO products (comparison_id, name, description)
        VALUES (?, ?, ?)
    ''', (comparison_id, data['name'], data.get('description', '')))
    
    product_id = cursor.lastrowid
    
    # Add attribute data if provided
    if data.get('attribute_data'):
        for attr_data in data['attribute_data']:
            cursor.execute('''
                INSERT INTO product_attribute_data (product_id, attribute_id, value)
                VALUES (?, ?, ?)
            ''', (product_id, attr_data['attribute_id'], attr_data['value']))
    
    conn.commit()
    
    # Get the created product
    cursor.execute('SELECT * FROM products WHERE id = ?', (product_id,))
    row = cursor.fetchone()
    
    product = {
        'id': row[0],
        'name': row[2],
        'description': row[3],
        'created_at': row[4],
        'updated_at': row[5]
    }
    
    conn.close()
    return jsonify(product), 201

@app.route('/api/comparisons/<int:comparison_id>/results/', methods=['GET'])
def get_ranking_results(comparison_id):
    """Get ranking results for comparison"""
    sort_by = request.args.get('sort_by')
    sort_order = request.args.get('sort_order', 'desc')
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Get comparison details
    comparison_detail = get_comparison_detail(comparison_id)
    if comparison_detail.status_code != 200:
        return comparison_detail
    
    comparison_data = comparison_detail.get_json()
    
    # Process results for ranking
    results = []
    for product in comparison_data['products']:
        attribute_values = {}
        for attr_data in product['attribute_data']:
            attr_name = attr_data['attribute']['name']
            attribute_values[attr_name] = {
                'value': attr_data['value'],
                'unit': attr_data['attribute']['unit'],
                'data_type': attr_data['attribute']['data_type']
            }
        
        results.append({
            'product_id': product['id'],
            'product_name': product['name'],
            'attribute_values': attribute_values,
            'rank': 1  # Will be updated after sorting
        })
    
    # Sort results if sort_by is specified
    if sort_by and results:
        def sort_key(item):
            if sort_by not in item['attribute_values']:
                return float('-inf') if sort_order == 'desc' else float('inf')
            
            value = item['attribute_values'][sort_by]['value']
            data_type = item['attribute_values'][sort_by]['data_type']
            
            if data_type == 'number':
                try:
                    return float(value)
                except ValueError:
                    return 0
            elif data_type == 'boolean':
                return value.lower() in ['true', '1', 'yes', 'on']
            else:  # text
                return value.lower()
        
        reverse = sort_order == 'desc'
        results.sort(key=sort_key, reverse=reverse)
    
    # Update ranks
    for i, result in enumerate(results, 1):
        result['rank'] = i
    
    response_data = {
        'comparison': comparison_data,
        'results': results,
        'sort_by': sort_by,
        'sort_order': sort_order
    }
    
    conn.close()
    return jsonify(response_data)

@app.route('/')
def index():
    """Root endpoint"""
    return jsonify({
        'message': 'Product Ranking API',
        'version': '1.0',
        'endpoints': {
            'comparisons': '/api/comparisons/',
            'health': '/health'
        }
    })

if __name__ == '__main__':
    # Initialize database
    init_db()
    
    # Start Flask app
    app.run(host='0.0.0.0', port=5000, debug=False)

