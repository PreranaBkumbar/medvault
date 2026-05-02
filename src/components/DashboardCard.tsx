import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', id }) => (
  <div id={id} className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ${className}`}>
    {children}
  </div>
);

export const CardHeader: React.FC<CardProps> = ({ children, className = '', id }) => (
  <div id={id} className={`px-6 py-4 border-b border-gray-50 ${className}`}>
    {children}
  </div>
);

export const CardTitle: React.FC<CardProps> = ({ children, className = '', id }) => (
  <h3 id={id} className={`text-lg font-bold text-gray-900 ${className}`}>
    {children}
  </h3>
);

export const CardContent: React.FC<CardProps> = ({ children, className = '', id }) => (
  <div id={id} className={`px-6 py-4 ${className}`}>
    {children}
  </div>
);

export const CardFooter: React.FC<CardProps> = ({ children, className = '', id }) => (
  <div id={id} className={`px-6 py-4 border-t border-gray-50 flex items-center ${className}`}>
    {children}
  </div>
);
