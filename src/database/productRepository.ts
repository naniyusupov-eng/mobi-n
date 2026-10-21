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

  /**
   * Replaces the whole catalogue with the server's products (GET /products).
   * Categories are rebuilt from the products so the catalogue filter matches.
   */
  replaceAll: (products: Product[]) => {
    const db = getDatabase();
    db.withTransactionSync(() => {
      db.runSync('DELETE FROM products');
      const insert = db.prepareSync(`
        INSERT OR REPLACE INTO products (
          id, code, name, categoryId, categoryName, description,
          priceDona, priceBlok, priceKorobka, priceKg,
          itemsPerBlock, itemsPerBox, stockDona, imageUrl
        ) VALUES (
          $id, $code, $name, $categoryId, $categoryName, $description,
          $priceDona, $priceBlok, $priceKorobka, $priceKg,
          $itemsPerBlock, $itemsPerBox, $stockDona, $imageUrl
        )
      `);
      try {
        for (const p of products) {
          insert.executeSync({
            $id: p.id,
            $code: p.code || '',
            $name: p.name,
            $categoryId: p.categoryId || 'cat_other',
            $categoryName: p.categoryName || '',
            $description: p.description || '',
            $priceDona: p.priceDona || 0,
            $priceBlok: p.priceBlok || 0,
            $priceKorobka: p.priceKorobka || 0,
            $priceKg: p.priceKg || 0,
            $itemsPerBlock: p.itemsPerBlock || 1,
            $itemsPerBox: p.itemsPerBox || 1,
            $stockDona: p.stockDona || 0,
            $imageUrl: p.imageUrl || null,
          });
        }
      } finally {
        insert.finalizeSync();
      }

      // Categories: keep the ones still used (and their icons), add new ones from the server
      db.runSync("DELETE FROM categories WHERE id <> 'cat_all' AND id NOT IN (SELECT DISTINCT categoryId FROM products)");
      const seen = new Set<string>();
      for (const p of products) {
        const catId = p.categoryId || 'cat_other';
        if (seen.has(catId)) continue;
        seen.add(catId);
        db.runSync('INSERT OR IGNORE INTO categories (id, name) VALUES ($id, $name)', {
          $id: catId,
          $name: p.categoryName || catId,
        });
      }
    });
  },

  decreaseStock: (productId: string, quantityDona: number) => {
    const db = getDatabase();
    db.runSync(
      'UPDATE products SET stockDona = MAX(0, stockDona - $qty) WHERE id = $id',
      { $qty: quantityDona, $id: productId }
    );
  },
};
