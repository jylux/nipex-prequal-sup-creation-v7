// frontend/src/components/LoginForm.tsx
import React, { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';

interface LoginFormProps {
  redirectTo?: string;
}

export default function LoginForm({ redirectTo = '/dashboard' }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await axios.post(
        'http://localhost:4000/api/auth/login',
        { email, password },
        { withCredentials: true }
      );
      router.push(redirectTo);
    } catch (err) {
      alert('Login failed');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border p-4 space-y-4">
      <div>
        <label>Email</label>
        <input
          type="email"
          className="border px-2"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <label>Password</label>
        <input
          type="password"
          className="border px-2"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <button type="submit" className="bg-gray-200 px-4 py-2 rounded">
        Login
      </button>
    </form>
  );
}
