// app/page.tsx
'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react'; // useState, useEffect, useCallback 훅 임포트
import { useRouter } from 'next/navigation'; // useRouter 훅 임포트
import { jwtDecode } from 'jwt-decode'; // jwtDecode 임포트
import RoleMismatchModal from '@/components/RoleMismatchModal'; // 새로 생성한 모달 임포트
import { getHelperActivities, getHelperStats, HelperActivity, HelperStats } from '@/lib/api';

export default function LandingPage() {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [showRoleMismatchModal, setShowRoleMismatchModal] = useState(false); // 역할 불일치 모달 표시 상태
    const [roleMismatchMessage, setRoleMismatchMessage] = useState(''); // 역할 불일치 모달 메시지

    // 인증 상태를 확인하고 업데이트하는 함수를 useCallback으로 감싸 최적화
    const updateAuthStatus = useCallback(() => {
        const authToken = localStorage.getItem('authToken');
        const storedUserRole = localStorage.getItem('userRole');

        if (authToken && storedUserRole) {
            try {
                const decodedToken: { exp: number; role: string } = jwtDecode(authToken);
                const currentTime = Date.now() / 1000;

                if (decodedToken.exp > currentTime) {
                    setIsAuthenticated(true);
                    setUserRole(storedUserRole);
                } else {
                    // 토큰 만료 시 localStorage 정리
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem('userRole');
                    localStorage.removeItem('userId');
                    localStorage.removeItem('userName');
                    localStorage.removeItem('userMileagePoints');
                    setIsAuthenticated(false);
                    setUserRole(null);
                }
            } catch (error) {
                console.error('JWT 토큰 디코딩 실패 또는 유효하지 않음:', error);
                // 토큰 오류 시 localStorage 정리
                localStorage.removeItem('authToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('userRole');
                localStorage.removeItem('userId');
                localStorage.removeItem('userName');
                localStorage.removeItem('userMileagePoints');
                setIsAuthenticated(false);
                setUserRole(null);
            }
        } else {
            setIsAuthenticated(false);
            setUserRole(null);
        }
    }, []);

    // 컴포넌트 마운트 시 및 라우터 경로 변경 시 인증 상태 업데이트
    useEffect(() => {
        updateAuthStatus();
    }, [router.pathname, updateAuthStatus]);

    // 윈도우의 storage 이벤트를 수신하여 localStorage 변경 감지 (같은 도메인 내 다른 탭/창에서 로그인/로그아웃 시)
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'authToken' || e.key === 'userRole') {
                updateAuthStatus();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [updateAuthStatus]);

    // "경기 보러가고 싶어요" 버튼 클릭 핸들러 (시니어)
    const handleSeniorButtonClick = () => {
        if (isAuthenticated) {
            if (userRole === 'senior') {
                router.push('/senior/select-team'); // 로그인된 시니어는 바로 팀 선택 페이지로
            } else {
                // 헬퍼 계정인데 시니어 버튼 누른 경우
                setRoleMismatchMessage(
                    '현재 헬퍼 계정으로 로그인되어 있습니다. 시니어 팬 서비스를 이용하시려면 로그아웃 후 다시 로그인해주세요.'
                );
                setShowRoleMismatchModal(true);
            }
        } else {
            // 로그인 안 된 상태
            router.push('/login?role=senior');
        }
    };

    // "도움 드리고 싶어요" 버튼 클릭 핸들러 (헬퍼)
    const handleHelperButtonClick = () => {
        if (isAuthenticated) {
            if (userRole === 'helper') {
                router.push('/helper/dashboard'); // 로그인된 헬퍼는 바로 대시보드로
            } else {
                // 시니어 계정인데 헬퍼 버튼 누른 경우
                setRoleMismatchMessage(
                    '현재 시니어 팬 계정으로 로그인되어 있습니다. 헬퍼 서비스를 이용하시려면 로그아웃 후 다시 로그인해주세요.'
                );
                setShowRoleMismatchModal(true);
            }
        } else {
            // 로그인 안 된 상태
            router.push('/login?role=helper');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center text-center min-h-[calc(100vh-20rem)] py-12">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-brand-navy mb-6">
                <span className="block">KBO 야구 관람,</span>
                <span className="block mt-2 sm:mt-3">
                    이제 <span className="text-brand-sky">같이가요</span>와 함께!
                </span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-700 max-w-2xl mx-auto mb-12">
                온라인 티켓 예매가 어려우신 시니어 팬분들을 위해, 디지털에 능숙한 헬퍼가 예매부터 경기장 동행까지
                도와드립니다.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 w-full max-w-md md:max-w-2xl">
                {/* "경기 보러가고 싶어요" 버튼 */}
                <Button
                    variant="default"
                    className="w-full btn-touch-xl bg-brand-navy hover:bg-brand-navy-light text-white flex items-center justify-center gap-3"
                    onClick={handleSeniorButtonClick}
                >
                    <span>경기 보러가고 싶어요</span>
                    <ArrowRight size={28} />
                </Button>

                {/* "도움 드리고 싶어요" 버튼 */}
                <Button
                    variant="outline"
                    className="w-full btn-touch-xl border-brand-navy text-brand-navy hover:bg-brand-sky/30 hover:text-brand-navy bg-white flex items-center justify-center gap-3"
                    onClick={handleHelperButtonClick}
                >
                    <span>도움 드리고 싶어요</span>
                    <ArrowRight size={28} />
                </Button>
            </div>
            <p className="mt-12 text-lg text-gray-600">버튼을 눌러 시작해보세요!</p>

            {/* 역할 불일치 모달 렌더링 */}
            <RoleMismatchModal
                isOpen={showRoleMismatchModal}
                onClose={() => setShowRoleMismatchModal(false)}
                message={roleMismatchMessage}
                actionText="로그아웃하고 다시 로그인하기"
                onActionClick={() => {
                    // localStorage를 정리하고 로그인 페이지로 이동
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem('userRole');
                    localStorage.removeItem('userId');
                    localStorage.removeItem('userName');
                    localStorage.removeItem('userMileagePoints');
                    router.push('/login');
                }}
            />
        </div>
    );
}
