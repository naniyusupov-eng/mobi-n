import { getDatabase } from './db';
import { Category, Product } from '../types';

export const productRepository = {
  getCategories: (): Category[] => {
    const db = getDatabase();
    return db.getAllSync<Category>('SELECT * FROM categories ORDER BY name ASC');
  },

  getAll: (categoryId?: string, search?: string): Product[] => {
    const db = getDatabase();
    let query = 'SELECT * FROM products WHERE 1=1';
    const params: Record<string, any> = {};

    if (categoryId && categoryId !== 'cat_all') {
      query += ' AND categoryId = $catId';
      params.$catId = categoryId;
    }

    if (search && search.trim().length > 0) {
      query += ' AND (name LIKE $search OR code LIKE $search OR description LIKE $search)';
      params.$search = `%${search.trim()}%`;
    }

    query += ' ORDER BY name ASC';
    return db.getAllSync<Product>(query, params);
  },

  getById: (id: string): Product | null => {
    const db = getDatabase();
    return db.getFirstSync<Product>('SELECT * FROM products WHERE id = $id', { $id: id }) || null;
  },

  decreaseStock: (productId: string, quantityDona: number) => {
    const db = getDatabase();
    db.runSync(
      'UPDATE products SET stockDona = MAX(0, stockDona - $qty) WHERE id = $id',
      { $qty: quantityDona, $id: productId }
    );
  },
};
