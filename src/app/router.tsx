import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { AppLayout } from '@/app/layout';
import { HistoryPage } from '@/pages/history';
import { IndexPage } from '@/pages/index';
import { PrimaryPackagingPage } from '@/pages/primary-packaging';
import { ProductSpecsPage } from '@/pages/product-specs';
import { SecondaryPackagingPage } from '@/pages/secondary-packaging';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<IndexPage />} />
          <Route path="/primary-packaging" element={<PrimaryPackagingPage />} />
          <Route path="/secondary-packaging" element={<SecondaryPackagingPage />} />
          <Route path="/product-specs" element={<ProductSpecsPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
