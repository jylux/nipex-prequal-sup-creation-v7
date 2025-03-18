// frontend/src/components/LoginForm.tsx
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import axios from 'axios';

interface LoginFormProps {
  redirectTo?: string;
}

export default function LoginForm({ redirectTo = '/dashboard' }: LoginFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Use axios with withCredentials to handle cookies
      const response = await axios.post(
        // 'http://localhost:4000/api/auth/login',
        'https://nipex-prequal-sup-creation-v7.onrender.com/api/auth/login',
        { email, password },
        { withCredentials: true } // Important for cookie-based auth
      );
      
      toast({
        title: "Login successful",
        description: "Redirecting to dashboard...",
      });
      
      // If the API also returns a token in the response, store it as a fallback
      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      
      router.push(redirectTo);
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Extract error message from the response
      const errorMessage = error.response?.data?.message || 'Login failed. Please check your credentials.';
      
      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-xl text-center font-bold">Login to NIPEX JQS</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">Password</label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}