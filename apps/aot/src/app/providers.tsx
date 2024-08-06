'use client';

import { SessionProvider } from '@repo/auth/react';
import { TooltipProvider } from '@repo/ui/components/tooltip';
import { ThemeProvider } from 'next-themes';
import { TRPCReactProvider } from '~/trpc/react';

interface Props {
  children: React.ReactNode;
}

export function Providers({ children }: Props) {
  return (
    <SessionProvider>
      <TRPCReactProvider>
        <ThemeProvider attribute="class">
          <TooltipProvider>{children}</TooltipProvider>
        </ThemeProvider>
      </TRPCReactProvider>
    </SessionProvider>
  );
}
