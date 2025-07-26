'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    ArrowLeft,
    CheckCircle,
    MessageSquare,
    Phone,
    UserCircle2,
    CalendarDays,
    TicketIcon,
    Info,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import {
    getHelpRequestDetails,
    HelpRequest,
    RawHelpRequestResponse,
} from '@/lib/api';

const statusMap = {
    REQUESTED: { text: '요청 접수', color: 'bg-gray-500', step: 1 },
    WAITING_FOR_HELPER: { text: '헬퍼 배정 대기 중', color: 'bg-yellow-500', step: 1 },
    IN_PROGRESS: { text: '도움 진행 중', color: 'bg-blue-500', step: 2 },
    TICKET_PROPOSED: { text: '티켓 정보 전달 완료', color: 'bg-orange-500', step: 3 },
    SEAT_CONFIRMED: { text: '좌석 확정! 경기 당일 만나요', color: 'bg-purple-500', step: 4 },
    COMPLETED: { text: '도움 완료', color: 'bg-green-500', step: 5 },
} as const;

type RequestStatus = keyof typeof statusMap;
const totalSteps = 5;

export default function HelperRequestDetailPage() {
    const router = useRouter();
    const params = useParams();
    const requestId = params.requestId as string;

    const [reservationDetails, setReservationDetails] = useState<HelpRequest | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTicketDetails = async () => {
            if (!requestId) {
                setIsLoading(false);
                setError('확인할 요청 ID가 없습니다.');
                return;
            }
            try {
                setIsLoading(true);
                setError(null);

                // API 요청
                const data: RawHelpRequestResponse = await getHelpRequestDetails(requestId);
                const game = data.game;

                // 데이터 매핑
                // homeTeam이 shortName을 가질 수 있도록 타입 단언
                const homeTeam = game?.homeTeam as { shortName?: string; name: string } | undefined;
                const mappedData: HelpRequest = {
                    id: String(data.requestId),
                    seniorFanName: data.userId.name,
                    teamName: homeTeam?.shortName || homeTeam?.name || '정보 없음',
                    gameDate: game?.date || '정보 없음',
                    gameTime: game?.time,
                    numberOfTickets: data.numberOfTickets,
                    notes: data.additionalInfo || undefined,
                    contactPreference: data.userId.phone ? 'phone' : 'chat',
                    phoneNumber: data.userId.phone,
                    status: data.status,
                    helperName: undefined,
                };

                setReservationDetails(mappedData);
            } catch (err: any) {
                console.error('요청 상세 로드 오류:', err);
                setError('요청 상세 정보를 불러오는데 실패했습니다.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchTicketDetails();
    }, [requestId]);

    const handleMarkAsHelped = () => {
        if (!reservationDetails) return;
        alert(`"${reservationDetails.seniorFanName}"님에게 티켓 정보를 전달합니다.`);
        router.push('/helper/dashboard');
    };

    const handleContact = () => {
        if (
            reservationDetails?.contactPreference === 'phone' &&
            reservationDetails.phoneNumber
        ) {
            alert(`전화 걸기: ${reservationDetails.phoneNumber}`);
        } else {
            alert('채팅 기능은 준비 중입니다.');
        }
    };

    // ===== UI =====
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
                <p className="text-xl text-gray-500">요청 정보를 불러오는 중입니다...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-10">
                <p className="text-xl text-red-600 mb-6">{error}</p>
                <Link href="/helper/dashboard">
                    <Button variant="outline">
                        <ArrowLeft className="mr-2 h-5 w-5" /> 대시보드로 돌아가기
                    </Button>
                </Link>
            </div>
        );
    }

    if (!reservationDetails) {
        return (
            <div className="text-center py-10">
                <p className="text-xl text-red-600 mb-6">요청 정보를 찾을 수 없습니다.</p>
                <Link href="/helper/dashboard">
                    <Button variant="outline">
                        <ArrowLeft className="mr-2 h-5 w-5" /> 대시보드로 돌아가기
                    </Button>
                </Link>
            </div>
        );
    }

    const currentStatusInfo =
        reservationDetails.status && statusMap[reservationDetails.status as RequestStatus]
            ? statusMap[reservationDetails.status as RequestStatus]
            : { text: '알 수 없음', color: 'bg-gray-400', step: 0 };

    const progressPercentage = (currentStatusInfo.step / totalSteps) * 100;

    return (
        <div className="py-8 max-w-3xl mx-auto">
            <Card className="shadow-xl">
                <CardHeader>
                    <div className="flex justify-between items-center mb-2">
                        <Button variant="outline" size="sm" onClick={() => router.back()}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> 뒤로가기
                        </Button>
                        <span
                            className={`px-3 py-1 text-sm text-white rounded-full ${currentStatusInfo.color}`}
                        >
                            {currentStatusInfo.text}
                        </span>
                    </div>
                    <CardTitle className="text-3xl text-brand-navy flex items-center gap-3">
                        <UserCircle2 size={36} /> {reservationDetails.seniorFanName}님의 예매 요청
                    </CardTitle>
                    <CardDescription>
                        요청 세부사항을 확인하고 도움을 진행해주세요.
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                            className={`${currentStatusInfo.color} h-3 rounded-full`}
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>
                    <p className="text-center mt-2 text-md font-medium">
                        현재 상태: {currentStatusInfo.text} ({currentStatusInfo.step}/{totalSteps} 단계)
                    </p>

                    <div className="border-t pt-6 space-y-4 text-lg">
                        <div className="flex items-start gap-3">
                            <TicketIcon size={24} />
                            <div>
                                <span className="font-semibold">응원팀:</span>
                                <span className="ml-2">{reservationDetails.teamName}</span>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <CalendarDays size={24} />
                            <div>
                                <span className="font-semibold">희망 경기일:</span>
                                <span className="ml-2">
                                    {reservationDetails.gameDate}
                                    {reservationDetails.gameTime &&
                                        ` (${reservationDetails.gameTime})`}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Info size={24} />
                            <div>
                                <span className="font-semibold">필요 티켓 수:</span>
                                <span className="ml-2">
                                    {reservationDetails.numberOfTickets}매
                                </span>
                            </div>
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col sm:flex-row gap-4 pt-8 border-t">
                    <Button
                        onClick={handleContact}
                        variant="outline"
                        className="w-full sm:flex-1"
                    >
                        {reservationDetails.contactPreference === 'phone' ? (
                            <Phone size={22} />
                        ) : (
                            <MessageSquare size={22} />
                        )}
                        <span>
                            {reservationDetails.contactPreference === 'phone'
                                ? '어르신께 전화하기'
                                : '어르신과 채팅하기'}
                        </span>
                    </Button>
                    <Button
                        onClick={handleMarkAsHelped}
                        className="w-full sm:flex-1 bg-brand-navy text-white"
                    >
                        <CheckCircle size={22} />
                        티켓 정보 전달하기
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
