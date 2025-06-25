'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Handshake, User, CalendarDays, Ticket } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getHelpRequests, HelpRequest } from '@/lib/api'; // HelpRequest 인터페이스도 api.ts에서 가져옵니다.

// mockHelpRequests는 이제 필요 없으므로 삭제합니다.
// const mockHelpRequests: HelpRequest[] = [ ... ]; // 이 라인도 삭제!

const Users = User; // Declare the Users variable

export default function HelperDashboardPage() {
    const router = useRouter();
    const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([]); // 실제 데이터를 저장할 상태
    const [loading, setLoading] = useState(true); // 로딩 상태
    const [error, setError] = useState<string | null>(null); // 에러 상태

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                setLoading(true); // 데이터 로딩 시작
                const data = await getHelpRequests(); // API 호출
                setHelpRequests(data); // 가져온 데이터로 상태 업데이트
            } catch (err: any) {
                // 에러 타입 명시
                console.error('데이터를 불러오는 중 오류 발생:', err);
                // 백엔드 에러 메시지를 사용자에게 보여줄 수도 있습니다.
                setError(err.response?.data?.message || '도움 요청 목록을 불러오는데 실패했습니다.');
            } finally {
                setLoading(false); // 로딩 종료
            }
        };

        fetchRequests();
    }, []); // 컴포넌트가 처음 마운트될 때 한 번만 실행

    const handleStartHelping = (requestId: string) => {
        // Navigate to the detailed request page
        router.push(`/helper/request/${requestId}`);
    };

    if (loading) {
        return (
            <div className="py-8 text-center text-xl text-gray-500">
                <p>도움 요청 목록을 불러오는 중입니다...</p>
                {/* 스피너 등을 추가하여 로딩 UI를 개선할 수 있습니다. */}
            </div>
        );
    }

    if (error) {
        return (
            <div className="py-8 text-center text-xl text-red-600">
                <p>{error}</p>
                <p>잠시 후 다시 시도해주세요.</p>
            </div>
        );
    }

    return (
        <div className="py-8">
            <h2 className="text-3xl font-bold text-brand-navy mb-8 text-center">도움이 필요한 요청 목록</h2>
            {helpRequests.length > 0 ? (
                <div className="space-y-6">
                    {helpRequests.map((req) => (
                        <Card key={req.id} className="shadow-lg">
                            <CardHeader>
                                <CardTitle className="text-2xl text-brand-navy-light flex items-center gap-2">
                                    <User size={28} /> {req.seniorFanName}님의 요청
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center gap-2 text-lg">
                                    <Ticket className="text-brand-navy" />
                                    <strong>팀:</strong> {req.teamName}
                                </div>
                                <div className="flex items-center gap-2 text-lg">
                                    <CalendarDays className="text-brand-navy" />
                                    <strong>날짜:</strong> {req.gameDate}
                                </div>
                                <div className="flex items-center gap-2 text-lg">
                                    <Users className="text-brand-navy" />
                                    <strong>수량:</strong> {req.numberOfTickets}매
                                </div>
                                <div className="pt-4">
                                    <Button
                                        onClick={() => handleStartHelping(req.id)}
                                        size="lg"
                                        className="w-full btn-touch-lg bg-brand-navy hover:bg-brand-navy-light text-white flex items-center justify-center gap-2"
                                    >
                                        <Handshake size={22} />
                                        <span>도움 시작하기</span>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <p className="text-xl text-gray-600 text-center py-10 bg-gray-50 rounded-md">
                    현재 도움이 필요한 요청이 없습니다. 감사합니다!
                </p>
            )}
        </div>
    );
}
