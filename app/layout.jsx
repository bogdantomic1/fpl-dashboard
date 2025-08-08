import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from './components/theme-provider';
import TopNav from './components/TopNav';
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
          <TopNav />

          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
