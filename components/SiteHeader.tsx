'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Ticket, UserCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { jwtDecode } from 'jwt-decode';

export default function SiteHeader() {
    const router = useRouter();

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userRole, setUserRole] = useState('senior');

    useEffect(() => {
        const authToken = localStorage.getItem('authToken');

        if (authToken) {
            try {
                const decodedToken: { role: string } = jwtDecode(authToken);
                setIsAuthenticated(true);
                setUserRole(decodedToken.role);
            } catch (error) {
                console.error('JWT 토큰 디코딩 실패:', error);

                localStorage.removeItem('authToken');
                localStorage.removeItem('userRole');
                setIsAuthenticated(false);
            }
        } else {
            setIsAuthenticated(false);
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');

        setIsAuthenticated(false);

        console.log('로그아웃 버튼 클릭됨');
        alert('로그아웃 되었습니다.');
        router.push('/login');
    };

    return (
        <header className="bg-brand-navy text-white shadow-md sticky top-0 z-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 group">
                    <Ticket size={32} className="group-hover:animate-pulse" />
                    <span className="text-2xl font-bold group-hover:text-brand-sky transition-colors">같이가요</span>
                </Link>
                <nav className="flex items-center gap-6">
                    {isAuthenticated ? (
                        <>
                            <Link
                                href={userRole === 'senior' ? '/senior/my-page' : '/helper/my-page'}
                                className="text-lg hover:text-brand-sky transition-colors flex items-center gap-2"
                            >
                                <UserCircle size={24} />
                                마이페이지
                            </Link>
                            <button onClick={handleLogout} className="text-lg hover:text-brand-sky transition-colors">
                                로그아웃
                            </button>
                        </>
                    ) : (
                        <Link href="/login" className="text-lg hover:text-brand-sky transition-colors">
                            로그인 / 회원가입
                        </Link>
                    )}
                </nav>
            </div>
        </header>
    );
}
