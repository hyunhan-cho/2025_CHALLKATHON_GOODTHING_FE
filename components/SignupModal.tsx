// components/SignupModal.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useKboTeams } from '@/components/kbo-teams'; // KBO 팀 목록 가져오기
import { registerUser } from '@/lib/api'; // 회원가입 API 호출

interface SignupModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SignupModal({ isOpen, onClose }: SignupModalProps) {
    const router = useRouter();
    const [role, setRole] = useState('senior');
    const [selectedTeamId, setSelectedTeamId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { teams, isLoading: teamsLoading, error: teamsError } = useKboTeams();

    if (!isOpen) return null; // 모달이 닫혀있으면 아무것도 렌더링하지 않음

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData(event.currentTarget);
        const name = formData.get('name') as string;
        const phone = formData.get('phone') as string;
        const password = formData.get('password') as string;
        const nickname = formData.get('nickname') as string;

        const favorite_team_to_send = selectedTeamId === '없음' || !selectedTeamId ? null : selectedTeamId;

        if (!name || !phone || !password || !nickname) {
            alert('모든 필수 정보를 입력해주세요.');
            setIsSubmitting(false);
            return;
        }

        if (!/^\d{10,11}$/.test(phone)) {
            alert('전화번호 형식이 올바르지 않습니다. 숫자 10~11자리를 입력해주세요.');
            setIsSubmitting(false);
            return;
        }

        try {
            await registerUser({
                name,
                phone,
                role: role as 'senior' | 'helper', // role은 'senior' 또는 'helper'여야 함
                password,
                nickname,
                favorite_team: favorite_team_to_send,
            });

            alert('회원가입에 성공했습니다! 이제 로그인할 수 있습니다.');
            onClose(); // 회원가입 성공 시 모달 닫기
            router.push('/login'); // 로그인 페이지로 이동
        } catch (error: any) {
            console.error('회원가입 중 에러 발생:', error);
            const errorMessage =
                error.response?.data?.favorite_team?.[0] ||
                error.response?.data?.phone?.[0] ||
                error.response?.data?.detail ||
                '회원가입 중 오류가 발생했습니다.';
            alert(`회원가입 실패: ${errorMessage}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-lg shadow-xl">
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl text-brand-navy">회원가입</CardTitle>
                    <CardDescription className="text-lg pt-2">같이가요 서비스에 오신 것을 환영합니다!</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-lg">
                                이름
                            </Label>
                            <Input
                                id="name"
                                name="name"
                                type="text"
                                placeholder="김철수"
                                className="h-14 text-lg px-4"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone" className="text-lg">
                                전화번호
                            </Label>
                            <Input
                                id="phone"
                                name="phone"
                                type="tel"
                                placeholder="01012345678"
                                className="h-14 text-lg px-4"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-lg">
                                비밀번호
                            </Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="********"
                                className="h-14 text-lg px-4"
                                required
                                minLength={6}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="nickname" className="text-lg">
                                닉네임
                            </Label>
                            <Input
                                id="nickname"
                                name="nickname"
                                type="text"
                                placeholder="야구사랑"
                                className="h-14 text-lg px-4"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-lg">회원 유형</Label>
                            <RadioGroup onValueChange={setRole} value={role} className="flex flex-col space-y-3">
                                <div className="flex items-center space-x-3">
                                    <RadioGroupItem value="senior" id="r1" className="w-5 h-5" />
                                    <Label htmlFor="r1" className="text-base">
                                        시니어 팬 (도움 받는 분)
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <RadioGroupItem value="helper" id="r2" className="w-5 h-5" />
                                    <Label htmlFor="r2" className="text-base">
                                        헬퍼 (도움 주는 분)
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="favorite_team" className="text-lg">
                                응원팀 (선택 사항)
                            </Label>
                            <Select onValueChange={setSelectedTeamId} value={selectedTeamId}>
                                <SelectTrigger
                                    className="w-full h-14 text-lg px-4"
                                    disabled={teamsLoading || !!teamsError}
                                >
                                    <SelectValue placeholder="응원하는 팀을 선택해주세요" />
                                </SelectTrigger>
                                <SelectContent>
                                    {teamsLoading ? (
                                        <SelectItem value="loading" disabled>
                                            팀 목록을 불러오는 중...
                                        </SelectItem>
                                    ) : teamsError ? (
                                        <SelectItem value="error" disabled>
                                            팀 목록 로딩 실패
                                        </SelectItem>
                                    ) : (
                                        <>
                                            <SelectItem value="없음">선택 안 함</SelectItem>
                                            {teams.map((team) => (
                                                <SelectItem key={team.id} value={String(team.id)}>
                                                    {team.name}
                                                </SelectItem>
                                            ))}
                                        </>
                                    )}
                                </SelectContent>
                            </Select>
                            {teamsError && <p className="text-red-500 text-sm mt-1">{teamsError}</p>}
                        </div>

                        <Button
                            type="submit"
                            className="w-full btn-touch-lg bg-brand-navy hover:bg-brand-navy-light text-white"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? '가입 중...' : '가입하기'}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col items-center gap-4 pt-6">
                    <p className="text-md text-gray-600">이미 계정이 있으신가요?</p>
                    <a href="/login" className="w-full">
                        <Button
                            variant="outline"
                            className="w-full btn-touch-lg border-brand-navy text-brand-navy hover:bg-brand-sky/30 bg-white"
                            onClick={onClose} // 로그인 페이지로 이동 시 모달 닫기
                        >
                            로그인
                        </Button>
                    </a>
                </CardFooter>
            </Card>
        </div>
    );
}
