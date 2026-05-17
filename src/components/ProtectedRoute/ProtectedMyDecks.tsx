import { lazy } from 'react';
import { ProtectedRoute } from './index';

const MyDecks = lazy(() => import('@/pages/SavedDecks').then(m => ({ default: m.MyDecks })));

const ProtectedMyDecks = () => (
  <ProtectedRoute>
    <MyDecks />
  </ProtectedRoute>
);

export default ProtectedMyDecks;
