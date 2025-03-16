// frontend/src/pages/index.tsx
import React from 'react';
import LoginForm from '@/components/LoginForm';

export default function HomePage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <LoginForm redirectTo="/dashboard" />
    </div>
  );
}
