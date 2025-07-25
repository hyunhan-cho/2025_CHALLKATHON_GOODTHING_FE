'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter, useSearchParams } from 'next/navigation';
import type React from 'react';
import { useEffect, useState } from 'react'; // useState와 useEffect 임포트
import { jwtDecode } from 'jwt-decode';
import { loginUser } from '@/lib/api';

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const role = searchParams.get('role') || 'senior';

    const [isSubmitting, setIsSubmitting] = useState(false); // 제출 중 상태 추가

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        console.log('handleSubmit 함수 호출됨'); // 디버깅용 로그 유지

        if (isSubmitting) {
            // 이미 제출 중이면 중복 호출 방지
            console.log('이미 제출 중입니다. 중복 호출 방지.');
            return;
        }

        event.preventDefault();

        const phone = (event.currentTarget.elements.namedItem('phone') as HTMLInputElement)?.value;
        const password = (event.currentTarget.elements.namedItem('password') as HTMLInputElement)?.value;

        if (!phone || !password) {
            alert('전화번호와 비밀번호를 모두 입력해주세요.');
            return;
        }

        setIsSubmitting(true); // 제출 시작 시 상태를 true로 설정

        try {
            const data = await loginUser({ phone, password });

            const accessToken = data.access || data.key;

            if (!accessToken) {
                throw new Error('서버 응답에 인증 토큰이 없습니다. 백엔드 응답을 확인하세요.');
            }

            interface DecodedTokenPayload {
                role?: string;
                userId?: number;
                name?: string;
                mileagePoints?: number;
            }
            const decodedToken: DecodedTokenPayload = jwtDecode(accessToken);

            const userRole = decodedToken.role;
            const userId = decodedToken.userId;
            const userName = decodedToken.name;
            const mileagePoints = decodedToken.mileagePoints;

            localStorage.setItem('authToken', accessToken);
            if (data.refresh) {
                localStorage.setItem('refreshToken', data.refresh);
            }

            if (userRole) localStorage.setItem('userRole', userRole);
            if (userId) localStorage.setItem('userId', String(userId));
            if (userName) localStorage.setItem('userName', userName);
            if (mileagePoints !== undefined) {
                localStorage.setItem('userMileagePoints', String(mileagePoints));
            }

            alert('로그인 성공! 환영합니다.');

            if (userRole === 'senior') {
                router.push('/senior/select-team');
            } else if (userRole === 'helper') {
                router.push('/helper/dashboard');
            } else {
                alert('알 수 없는 사용자 역할입니다. 로그인 정보를 초기화합니다.');
                localStorage.clear();
                router.push('/login');
            }
        } catch (error: any) {
            console.error('로그인 중 에러 발생:', error);

            const errorMessage = error.response?.data?.detail || error.message || '알 수 없는 오류가 발생했습니다.';
            alert(`로그인 실패: ${errorMessage}\n(올바른 전화번호와 비밀번호를 입력했는지 확인해주세요.)`);
        } finally {
            setIsSubmitting(false); // 제출 완료 후 상태를 false로 재설정 (성공/실패 모두)
        }
    };

    return (
        <div className="flex items-center justify-center py-12">
            <Card className="w-full max-w-lg shadow-xl">
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl text-brand-navy">
                        {role === 'senior' ? '시니어 팬 로그인' : '헬퍼 로그인'}
                    </CardTitle>
                    <CardDescription className="text-lg pt-2">
                        같이가요 서비스 이용을 위해 로그인해주세요.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="phone" className="text-lg">
                                아이디 (전화번호)
                            </Label>
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="01012345678"
                                className="h-14 text-lg px-4"
                                required
                                disabled={isSubmitting} // 제출 중일 때 Input 비활성화
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-lg">
                                비밀번호
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="********"
                                className="h-14 text-lg px-4"
                                required
                                disabled={isSubmitting} // 제출 중일 때 Input 비활성화
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full btn-touch-lg bg-brand-navy hover:bg-brand-navy-light text-white"
                            disabled={isSubmitting} // 제출 중일 때 버튼 비활성화
                        >
                            {isSubmitting ? '로그인 중...' : '로그인'}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col items-center gap-4 pt-6">
                    <p className="text-md text-gray-600">계정이 없으신가요?</p>
                    <Link href="/signup" passHref>
                        <Button
                            variant="outline"
                            className="w-full btn-touch-lg border-brand-navy text-brand-navy hover:bg-brand-sky/30 bg-white"
                            disabled={isSubmitting} // 제출 중일 때 회원가입 버튼도 비활성화
                        >
                            회원가입
                        </Button>
                    </Link>
                    <Link href="#" className="text-md text-brand-navy hover:underline mt-2">
                        아이디/비밀번호 찾기
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}
