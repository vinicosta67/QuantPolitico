import type {Metadata} from 'next';
import './globals.css';
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: 'Quant Político',
  description: 'Plataforma de Inteligência Política',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
      </head>
      <body className={cn(inter.className, "font-body antialiased")} suppressHydrationWarning={true}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
