import { Inter } from 'next/font/google';
import './globals.css';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './components2/app-sidebar';
import { ThemeProvider } from './components2/theme-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'FPLerr',
  description: 'fpl appa',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
