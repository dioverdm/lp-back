import { Router } from 'express';
import { authenticate, withCompany, can } from '../../middlewares/auth.js';
import * as ctrl from './catalog.controller.js';

const router = Router();
router.use(authenticate, withCompany);

router.get('/categories',      can('catalog.read'),   ctrl.listCategories);
router.post('/categories',     can('catalog.create'), ctrl.createCategory);
router.get('/products',        can('products.read'),  ctrl.listProducts);
router.get('/products/search', can('products.read'),  ctrl.searchProducts);
router.get('/products/:id',    can('products.read'),  ctrl.getProduct);
router.post('/products',       can('products.create'),ctrl.createProduct);
router.put('/products/:id',    can('products.update'),ctrl.updateProduct);
router.delete('/products/:id', can('products.delete'),ctrl.deleteProduct);

export default router;
