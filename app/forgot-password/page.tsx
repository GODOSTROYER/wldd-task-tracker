'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { ArrowLeft, Mail, Trello } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api('/api/auth/forgot-password', {
        method: 'POST',
        body: { email },
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Trello className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">TrelloClone</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Forgot Password</h1>
          <p className="text-gray-600">
            {success
              ? 'Check your inbox for a reset link'
              : "Enter your email and we'll send you a reset link"}
          </p>
        </div>

        <Card className="shadow-xl border-0">
          <CardContent className="p-8">
            {success ? (
              <div className="space-y-6 text-center">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <Mail className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <p className="text-gray-900 font-medium mb-1">Email sent!</p>
                  <p className="text-sm text-gray-600">
                    If an account exists for <span className="font-medium">{email}</span>,
                    you&apos;ll receive a password reset link shortly.
                  </p>
                </div>
                <Link href="/login">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Sign In
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </Button>

                <p className="text-center text-sm text-gray-600">
                  <Link href="/login" className="text-blue-600 hover:text-blue-500 font-medium inline-flex items-center gap-1">
                    <ArrowLeft className="h-3 w-3" />
                    Back to Sign In
                  </Link>
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
