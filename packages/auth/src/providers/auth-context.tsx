'use client';
import { createContext } from 'react';
import type { AuthHookResult } from '../types';
export const AuthContext = createContext<AuthHookResult | null>(null);
