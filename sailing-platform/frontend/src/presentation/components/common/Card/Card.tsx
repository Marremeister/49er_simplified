// src/presentation/components/common/Card/Card.tsx
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'small' | 'medium' | 'large';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'medium'
}) => {
  const paddingClasses = {
    none: '',
    small: 'p-4',
    medium: 'p-6',
    large: 'p-8',
  };

  return (
    <div className={`bg-white shadow rounded-lg ${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  );
};

