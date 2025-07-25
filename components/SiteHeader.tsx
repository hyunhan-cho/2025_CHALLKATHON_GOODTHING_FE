// components/SiteHeader.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Ticket, UserCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { jwtDecode } from 'jwt-decode';
import SignupModal from './SignupModal';

export default function SiteHeader() {
    const router = useRouter();

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userRole, setUserRole] = useState('senior');
    const [userName, setUserName] = useState<string | null>(null);
    const [showLoginChoicePopup, setShowLoginChoicePopup] = useState(false);
    const [showSignupModal, setShowSignupModal] = useState(false);

    // 인증 상태를 확인하고 업데이트하는 함수를 useCallback으로 감싸 최적화
    const updateAuthStatus = useCallback(() => {
        const authToken = localStorage.getItem('authToken');
        const storedUserName = localStorage.getItem('userName');
        const storedUserRole = localStorage.getItem('userRole');

        if (authToken) {
            try {
                const decodedToken: { role: string; name?: string; exp: number } = jwtDecode(authToken);
                const currentTime = Date.now() / 1000;

                if (decodedToken.exp > currentTime) {
                    // 토큰 만료 여부도 확인
                    setIsAuthenticated(true);
                    setUserRole(storedUserRole || decodedToken.role);
                    setUserName(storedUserName || decodedToken.name || null);
                } else {
                    // 토큰 만료 시 localStorage 정리
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem('userRole');
                    localStorage.removeItem('userId');
                    localStorage.removeItem('userName');
                    localStorage.removeItem('userMileagePoints');
                    setIsAuthenticated(false);
                    setUserRole('senior');
                    setUserName(null);
                }
            } catch (error) {
                console.error('JWT 토큰 디코딩 실패 또는 토큰 유효하지 않음:', error);
                // 오류 발생 시 모든 인증 관련 localStorage 항목 삭제
                localStorage.removeItem('authToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('userRole');
                localStorage.removeItem('userId');
                localStorage.removeItem('userName');
                localStorage.removeItem('userMileagePoints');

                setIsAuthenticated(false);
                setUserRole('senior');
                setUserName(null);
            }
        } else {
            setIsAuthenticated(false);
            setUserRole('senior');
            setUserName(null);
        }
    }, []);

    // 컴포넌트 마운트 시 및 라우터 경로 변경 시 인증 상태 업데이트
    useEffect(() => {
        updateAuthStatus();
    }, [router.pathname, updateAuthStatus]);

    // 윈도우의 storage 이벤트를 수신하여 localStorage 변경 감지 (같은 도메인 내 다른 탭/창에서 로그인/로그아웃 시)
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'authToken' || e.key === 'userName' || e.key === 'userRole') {
                updateAuthStatus();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [updateAuthStatus]);

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userId');
        localStorage.removeItem('userName');
        localStorage.removeItem('userMileagePoints');
        setIsAuthenticated(false);
        setUserRole('senior');
        setUserName(null);
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

    const handleOpenSignupModal = () => {
        setShowSignupModal(true);
    };

    const handleCloseSignupModal = () => {
        setShowSignupModal(false);
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
                            // 로그인된 상태
                            <>
                                {userName && ( // 닉네임이 있을 경우에만 표시
                                    <span className="text-lg font-semibold text-brand-sky">{userName}님</span>
                                )}
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
                            // 로그인되지 않은 상태
                            <>
                                <button
                                    onClick={() => setShowLoginChoicePopup(true)}
                                    className="text-lg hover:text-brand-sky transition-colors flex items-center gap-2"
                                >
                                    <UserCircle size={24} />
                                    로그인
                                </button>
                                <button
                                    onClick={handleOpenSignupModal}
                                    className="text-lg hover:text-brand-sky transition-colors"
                                >
                                    회원가입
                                </button>
                                <button
                                    onClick={handleMyPageClick}
                                    className="text-lg hover:text-brand-sky transition-colors flex items-center gap-2"
                                >
                                    마이페이지
                                </button>
                            </>
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
                                    router.push('/login?role=senior');
                                    setShowLoginChoicePopup(false);
                                }}
                                className="bg-blue-500 text-white px-4 py-2 rounded-lg"
                            >
                                시니어 팬으로 로그인
                            </button>
                            <button
                                onClick={() => {
                                    router.push('/login?role=helper');
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

            <SignupModal isOpen={showSignupModal} onClose={handleCloseSignupModal} />
        </>
    );
}
