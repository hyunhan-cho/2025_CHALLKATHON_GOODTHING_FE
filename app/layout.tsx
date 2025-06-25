import type React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';

import SiteHeader from '@/components/SiteHeader';

const font = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: '같이가요 - KBO 티켓 예매 도우미',
    description: '시니어 팬분들을 위한 KBO 야구 티켓 예매 지원 서비스',
    generator: 'v0.dev',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ko">
            <body className={cn(font.className, 'min-h-screen flex flex-col')}>
                <SiteHeader />
                <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">{children}</main>
                <footer className="bg-gray-100 text-center py-6 text-gray-600 text-sm">
                    <p>&copy; {new Date().getFullYear()} 같이가요. 모든 권리 보유.</p>
                    <p className="mt-1">시니어 팬분들의 즐거운 야구 관람을 응원합니다!</p>
                </footer>
            </body>
        </html>
    );
}
