// src/PrivateRoute.js
// Wraps protected pages (e.g. Dashboard).
// If user is not logged in, redirects to /login automatically.

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}
