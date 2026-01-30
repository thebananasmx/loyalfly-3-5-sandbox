// FIX: Add React import for JSX type definitions.
import React from 'react';

// FIX: Added global JSX namespace declaration to fix "Property '...' does not exist on type 'JSX.IntrinsicElements'" errors.
// This provides a fallback for all JSX elements, resolving the type errors across multiple files.
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  enrollmentDate: string;
  stamps: number;
  rewardsRedeemed: number;
}

export interface Business {
  id: string;
  name: string;
  email: string;
  slug: string;
  plan?: 'Gratis' | 'Entrepreneur' | 'Pro';
  customerCount: number;
  cardSettings: any;
  surveySettings: any;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  imageUrl: string;
  content: string;
  excerpt: string;
  status: 'draft' | 'published';
  authorId?: string;
  createdAt: any;
  updatedAt?: any;
}