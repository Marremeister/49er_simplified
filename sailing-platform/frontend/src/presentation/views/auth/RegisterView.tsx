import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../../application/hooks/useAuth';
import { Card } from '../../components/common/Card/Card';
import { Input } from '../../components/common/Input/Input';
import { Button } from '../../components/common/Button/Button';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(50, 'Username is too long'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128, 'Password is too long'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterView: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await register(data.email, data.username, data.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              sign in to existing account
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
              name="email"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  label="Email address"
                  type="email"
                  autoComplete="email"
                  error={errors.email?.message}
                  placeholder="Enter your email"
                />
              )}
            />

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
                  placeholder="Choose a username"
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
                  autoComplete="new-password"
                  error={errors.password?.message}
                  placeholder="Create a password"
                />
              )}
            />

            <Controller
              name="confirmPassword"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  label="Confirm Password"
                  type="password"
                  autoComplete="new-password"
                  error={errors.confirmPassword?.message}
                  placeholder="Confirm your password"
                />
              )}
            />

            <Button
              type="submit"
              fullWidth
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              Create account
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};