import { lazy } from 'react';
import { ProtectedRoute } from './index';

const ProfileEdit = lazy(() => import('@/pages/ProfileEdit'));

const ProtectedProfileEdit = () => (
  <ProtectedRoute>
    <ProfileEdit />
  </ProtectedRoute>
);

export default ProtectedProfileEdit;
