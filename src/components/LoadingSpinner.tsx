import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'dots' | 'pulse' | 'bars' | 'orbit';
  color?: string;
  text?: string;
}

export default function LoadingSpinner({ 
  size = 'md', 
  variant = 'spinner',
  color = 'indigo',
  text 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const colorClasses = {
    border: `border-${color}-600`,
    bg: `bg-${color}-600`,
    text: `text-${color}-600`
  };

  if (variant === 'spinner') {
    return (
      <div className="flex flex-col items-center justify-center gap-3">
        <div className={`${sizeClasses[size]} border-4 border-slate-200 border-t-${color}-600 rounded-full animate-spin`}></div>
        {text && <p className={`text-sm text-slate-600 animate-pulse`}>{text}</p>}
      </div>
    );
  }

  if (variant === 'dots') {
    return (
      <div className="flex flex-col items-center justify-center gap-3">
        <div className="flex gap-2">
          <div className={`w-3 h-3 bg-${color}-600 rounded-full animate-bounce`} style={{ animationDelay: '0ms' }}></div>
          <div className={`w-3 h-3 bg-${color}-600 rounded-full animate-bounce`} style={{ animationDelay: '150ms' }}></div>
          <div className={`w-3 h-3 bg-${color}-600 rounded-full animate-bounce`} style={{ animationDelay: '300ms' }}></div>
        </div>
        {text && <p className={`text-sm text-slate-600 animate-pulse`}>{text}</p>}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className="flex flex-col items-center justify-center gap-3">
        <div className={`${sizeClasses[size]} bg-${color}-600 rounded-full animate-ping opacity-75`}></div>
        {text && <p className={`text-sm text-slate-600 animate-pulse`}>{text}</p>}
      </div>
    );
  }

  if (variant === 'bars') {
    return (
      <div className="flex flex-col items-center justify-center gap-3">
        <div className="flex gap-1 items-end h-8">
          <div className={`w-2 bg-${color}-600 rounded-full animate-pulse`} style={{ height: '60%', animationDelay: '0ms' }}></div>
          <div className={`w-2 bg-${color}-600 rounded-full animate-pulse`} style={{ height: '100%', animationDelay: '150ms' }}></div>
          <div className={`w-2 bg-${color}-600 rounded-full animate-pulse`} style={{ height: '80%', animationDelay: '300ms' }}></div>
          <div className={`w-2 bg-${color}-600 rounded-full animate-pulse`} style={{ height: '40%', animationDelay: '450ms' }}></div>
        </div>
        {text && <p className={`text-sm text-slate-600 animate-pulse`}>{text}</p>}
      </div>
    );
  }

  if (variant === 'orbit') {
    return (
      <div className="flex flex-col items-center justify-center gap-3">
        <div className="relative w-12 h-12">
          <div className={`absolute inset-0 border-4 border-${color}-200 rounded-full`}></div>
          <div className={`absolute inset-0 border-4 border-transparent border-t-${color}-600 rounded-full animate-spin`}></div>
          <div className={`absolute inset-2 border-4 border-transparent border-t-${color}-400 rounded-full animate-spin`} style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
        </div>
        {text && <p className={`text-sm text-slate-600 animate-pulse`}>{text}</p>}
      </div>
    );
  }

  return null;
}

// Full page loading overlay
export function LoadingOverlay({ text = 'Loading...', variant = 'orbit' }: { text?: string; variant?: LoadingSpinnerProps['variant'] }) {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-8 border border-slate-200">
        <LoadingSpinner variant={variant} size="xl" text={text} />
      </div>
    </div>
  );
}

// Inline loading state
export function LoadingState({ text = 'Loading...', variant = 'spinner' }: { text?: string; variant?: LoadingSpinnerProps['variant'] }) {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <LoadingSpinner variant={variant} size="lg" text={text} />
    </div>
  );
}
