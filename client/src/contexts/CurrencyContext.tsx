import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';

interface CurrencyContextType {
  currency: string;
  setCurrency: (c: string) => void;
  rates: Record<string, number>;
  convert: (amountINR: number) => number;
  formatAmount: (amountINR: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);

const SUPPORTED_CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'JPY', 'CAD', 'AUD'];

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState(() => localStorage.getItem('currency') || 'INR');
  const [rates, setRates] = useState<Record<string, number>>({ INR: 1 });

  useEffect(() => {
    api.get<{ success: boolean; data: Record<string, number> }>('/public/exchange-rates')
      .then(res => setRates(res.data.data))
      .catch(() => {});
  }, []);

  const setCurrency = (c: string) => {
    setCurrencyState(c);
    localStorage.setItem('currency', c);
  };

  const convert = (amountINR: number) => {
    const rate = rates[currency] || 1;
    return Math.round(amountINR * rate * 100) / 100;
  };

  const formatAmount = (amountINR: number) => {
    const amount = convert(amountINR);
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, rates, convert, formatAmount }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}

export { SUPPORTED_CURRENCIES };
