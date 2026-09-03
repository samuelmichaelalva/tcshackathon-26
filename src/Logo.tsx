import React from 'react';

export function Logo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <img src="/logo.svg" alt="SafeOffer AI Logo" className={className} />
  );
}
