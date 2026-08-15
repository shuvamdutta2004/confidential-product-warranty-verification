import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Confidential Product Warranty Verification | ZK dApp on Midnight',
  description: 'Prove product warranty coverage and file claims without exposing serial numbers, store receipts, purchase dates, or customer identity. Zero-knowledge smart contracts on Midnight Network.',
  keywords: 'midnight network, zero knowledge, product warranty, compact, privacy, blockchain, warranty claim',
  openGraph: {
    title: 'Confidential Product Warranty Verification — ZK dApp',
    description: 'Privacy-preserving product warranty verification and proof system on Midnight Network',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}

