import { lazy } from 'react';
import { ProtectedRoute } from './index';

const EditDeck = lazy(() => import('@/pages/SavedDecks').then(m => ({ default: m.EditDeck })));

const ProtectedEditDeck = () => (
  <ProtectedRoute>
    <EditDeck />
  </ProtectedRoute>
);

export default ProtectedEditDeck;
