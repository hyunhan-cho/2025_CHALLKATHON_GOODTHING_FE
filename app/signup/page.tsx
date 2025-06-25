'use client';

import * as React from 'react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const KBO_TEAMS = [
    { id: '1', name: '두산 베어스' },
    { id: '2', name: 'LG 트윈스' },
    { id: '3', name: 'SSG 랜더스' },
    { id: '4', name: '키움 히어로즈' },
    { id: '5', name: 'KIA 타이거즈' },
    { id: '6', name: '삼성 라이온즈' },
    { id: '7', name: '롯데 자이언츠' },
    { id: '8', name: '한화 이글스' },
    { id: '9', name: 'NC 다이노스' },
    { id: '10', name: 'KT 위즈' },
];

export default function SignupPage() {
    const [role, setRole] = useState('senior');
    const [selectedTeamId, setSelectedTeamId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData(event.currentTarget);
        const name = formData.get('name') as string;
        const phone = formData.get('phone') as string;
        const password = formData.get('password') as string;
        const nickname = formData.get('nickname') as string;

        const favorite_team_to_send = selectedTeamId === '없음' ? null : selectedTeamId;

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
            const response = await fetch('http://localhost:8000/api/auth/signup/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    phone,
                    role,
                    password,
                    nickname,
                    favorite_team: favorite_team_to_send,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                let errorMessage = '회원가입 실패';

                if (errorData) {
                    if (
                        errorData.phone &&
                        Array.isArray(errorData.phone) &&
                        errorData.phone.includes('This field must be unique.')
                    ) {
                        errorMessage = '이미 가입된 전화번호입니다.';
                    } else if (errorData.role) {
                        errorMessage = '역할 선택이 올바르지 않습니다.';
                    } else if (errorData.password) {
                        errorMessage = `비밀번호 오류: ${
                            Array.isArray(errorData.password) ? errorData.password.join(', ') : errorData.password
                        }`;
                    } else if (errorData.detail) {
                        errorMessage = errorData.detail;
                    } else if (typeof errorData === 'object') {
                        errorMessage = Object.values(errorData).flat().join(', ');
                    }
                }
                throw new Error(errorMessage);
            }

            alert('회원가입에 성공했습니다! 이제 로그인 페이지로 이동하여 로그인할 수 있습니다.');
        } catch (error: any) {
            console.error('회원가입 중 에러 발생:', error.message);
            alert(`회원가입 실패: ${error.message}`);
        } finally {
            setIsSubmitting(false); // 제출 완료
        }
    };

    return (
        <div className="flex items-center justify-center py-12">
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
                                <SelectTrigger className="w-full h-14 text-lg px-4">
                                    <SelectValue placeholder="응원하는 팀을 선택해주세요" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="없음">선택 안 함</SelectItem>
                                    {KBO_TEAMS.map((team) => (
                                        <SelectItem key={team.id} value={team.id}>
                                            {team.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
                        >
                            로그인
                        </Button>
                    </a>

                    <a href="#" className="text-md text-brand-navy hover:underline mt-2">
                        아이디/비밀번호 찾기
                    </a>
                </CardFooter>
            </Card>
        </div>
    );
}
