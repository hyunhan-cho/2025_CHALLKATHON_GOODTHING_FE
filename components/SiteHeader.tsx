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
    const [showLoginChoicePopup, setShowLoginChoicePopup] = useState(false);

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
        alert('로그아웃 되었습니다.');
        router.push('/login');
    };

    const handleMyPageClick = () => {
        if (!isAuthenticated) {
            alert('로그인부터 해주세요!');
            setShowLoginChoicePopup(true);
        } else {
            const targetPath = userRole === 'senior' ? '/senior/my-page' : '/helper/my-page';
            router.push(targetPath);
        }
    };

    return (
        <>
            <header className="bg-brand-navy text-white shadow-md sticky top-0 z-50">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group">
                        <Ticket size={32} className="group-hover:animate-pulse" />
                        <span className="text-2xl font-bold group-hover:text-brand-sky transition-colors">
                            같이가요
                        </span>
                    </Link>
                    <nav className="flex items-center gap-6">
                        {isAuthenticated ? (
                            <>
                                <button
                                    onClick={handleMyPageClick}
                                    className="text-lg hover:text-brand-sky transition-colors flex items-center gap-2"
                                >
                                    <UserCircle size={24} />
                                    마이페이지
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="text-lg hover:text-brand-sky transition-colors"
                                >
                                    로그아웃
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={handleMyPageClick}
                                className="text-lg hover:text-brand-sky transition-colors flex items-center gap-2"
                            >
                                <UserCircle size={24} />
                                마이페이지
                            </button>
                        )}
                    </nav>
                </div>
            </header>

            {showLoginChoicePopup && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl text-center space-y-4">
                        <p className="text-lg font-bold">어떤 역할로 로그인할까요?</p>
                        <div className="flex justify-around space-x-4">
                            <button
                                onClick={() => {
                                    router.push('/senior/login');
                                    setShowLoginChoicePopup(false);
                                }}
                                className="bg-blue-500 text-white px-4 py-2 rounded-lg"
                            >
                                시니어 팬으로 로그인
                            </button>
                            <button
                                onClick={() => {
                                    router.push('/helper/login');
                                    setShowLoginChoicePopup(false);
                                }}
                                className="bg-green-500 text-white px-4 py-2 rounded-lg"
                            >
                                헬퍼 로그인
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
