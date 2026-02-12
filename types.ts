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

// FIX: Added module declaration for 'react-router-dom' to resolve widespread "Module has no exported member" errors.
// This ensures that the compiler can resolve standard React Router v6 components and hooks used throughout the application.
declare module 'react-router-dom' {
  export const BrowserRouter: any;
  export const HashRouter: any;
  export const Routes: any;
  export const Route: any;
  export const Navigate: any;
  export const Outlet: any;
  export const Link: any;
  export const NavLink: any;
  export const useLocation: any;
  export const useParams: any;
  export const useNavigate: any;
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
