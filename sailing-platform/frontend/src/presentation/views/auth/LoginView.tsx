import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../../application/hooks/useAuth';
import { Card } from '../../components/common/Card/Card';
import { Input } from '../../components/common/Input/Input';
import { Button } from '../../components/common/Button/Button';

const loginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginView: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await login(data.username, data.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
              create a new account
            </Link>
          </p>
        </div>

        <Card className="mt-8">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <Controller
              name="username"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  label="Username"
                  type="text"
                  autoComplete="username"
                  error={errors.username?.message}
                  placeholder="Enter your username"
                />
              )}
            />

            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  label="Password"
                  type="password"
                  autoComplete="current-password"
                  error={errors.password?.message}
                  placeholder="Enter your password"
                />
              )}
            />

            <Button
              type="submit"
              fullWidth
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              Sign in
            </Button>

            <div className="text-sm text-center">
              <span className="text-gray-600">Demo credentials:</span>
              <br />
              <span className="font-mono text-sm">admin / admin123</span>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};