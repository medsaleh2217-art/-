import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { I18nProvider } from './i18n';
import { CartProvider } from './state/cart';
import { DataProvider } from './state/data';
import { ToastProvider } from './state/toast';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/CartPage';
import StaticPage, { NotFound } from './pages/StaticPage';

// لوحة التحكم تُحمّل عند الحاجة فقط حتى لا تُبطئ المتجر للزوار
const AdminApp = lazy(() => import('./admin/AdminApp'));

export default function App() {
  return (
    <I18nProvider>
      <ToastProvider>
        <DataProvider>
          <CartProvider>
            <BrowserRouter>
              <Routes>
                <Route element={<Layout />}>
                  <Route index element={<Home />} />
                  <Route path="products" element={<Catalog />} />
                  <Route path="product/:id" element={<ProductPage />} />
                  <Route path="cart" element={<CartPage />} />
                  <Route path="about" element={<StaticPage kind="about" />} />
                  <Route path="contact" element={<StaticPage kind="contact" />} />
                  <Route path="privacy" element={<StaticPage kind="privacy" />} />
                  <Route path="policy" element={<StaticPage kind="policy" />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
                <Route
                  path="admin/*"
                  element={
                    <Suspense fallback={<div className="center page">…</div>}>
                      <AdminApp />
                    </Suspense>
                  }
                />
              </Routes>
            </BrowserRouter>
          </CartProvider>
        </DataProvider>
      </ToastProvider>
    </I18nProvider>
  );
}
