'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import {
    AlertCircle,
    CheckCircle2,
    Hourglass,
    RefreshCw,
    TicketIcon,
    CalendarDays,
    UsersIcon,
    UserCircle,
} from 'lucide-react';

import { getMySeniorRequests, HelpRequest } from '@/lib/api';

type RequestStatus =
    | 'WAITING_FOR_HELPER'
    | 'HELPER_MATCHED'
    | 'TICKET_PROPOSED'
    | 'SEAT_CONFIRMED'
    | 'COMPLETED'
    | 'CANCELLED';

const statusMapping: {
    [key in RequestStatus]: {
        statusText: string;
        icon: React.ElementType;
        colorClass: string;
        bgColorClass?: string;
        actionLink?: (id: string) => string;
        actionText?: string;
    };
} = {
    WAITING_FOR_HELPER: {
        statusText: '헬퍼 배정 대기 중',
        icon: Hourglass,
        colorClass: 'text-yellow-700',
        bgColorClass: 'bg-yellow-50',
    },
    HELPER_MATCHED: {
        statusText: '헬퍼 매칭! 티켓 찾는 중',
        icon: RefreshCw,
        colorClass: 'text-blue-700',
        bgColorClass: 'bg-blue-50',
    },
    TICKET_PROPOSED: {
        statusText: '헬퍼가 티켓을 찾았어요!',
        icon: AlertCircle,
        colorClass: 'text-orange-600',
        bgColorClass: 'bg-orange-50',
        actionLink: (id: string) => `/senior/confirmation?requestId=${id}`,
        actionText: '티켓 확인 및 확정',
    },
    SEAT_CONFIRMED: {
        statusText: '좌석 확정! 경기 당일 만나요',
        icon: CheckCircle2,
        colorClass: 'text-green-700',
        bgColorClass: 'bg-green-50',
    },
    COMPLETED: {
        statusText: '관람 완료',
        icon: CheckCircle2,
        colorClass: 'text-green-700',
        bgColorClass: 'bg-gray-100',
    },
    CANCELLED: {
        statusText: '요청 취소됨',
        icon: AlertCircle,
        colorClass: 'text-red-600',
        bgColorClass: 'bg-gray-100',
    },
};

function StatusIcon({ status }: { status: RequestStatus }) {
    const IconComponent = statusMapping[status]?.icon || Hourglass;

    const isSpinning = status === 'HELPER_MATCHED';
    return (
        <IconComponent
            className={`${statusMapping[status]?.colorClass} ${isSpinning ? 'animate-spin' : ''}`}
            size={32}
        />
    );
}

export default function SeniorMyPage() {
    const [requests, setRequests] = useState<HelpRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const data = await getMySeniorRequests();

                setRequests(data.filter((req: any) => Object.keys(statusMapping).includes(req.status)));
            } catch (err: any) {
                console.error('예매 요청 목록을 불러오는 중 오류 발생:', err);
                setError(err.response?.data?.message || '예매 요청 목록을 불러오는데 실패했습니다.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchRequests();
    }, []);
    if (isLoading) {
        return (
            <div className="py-8 text-center text-xl text-gray-500 min-h-[calc(100vh-10rem)] flex items-center justify-center">
                <p>예매 요청 목록을 불러오는 중입니다...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="py-8 text-center text-xl text-red-600 min-h-[calc(100vh-10rem)] flex items-center justify-center">
                <p>{error}</p>
                <p>잠시 후 다시 시도해주세요.</p>
            </div>
        );
    }

    const currentRequests = requests.filter((r) => r.status !== 'COMPLETED' && r.status !== 'CANCELLED');
    const pastRequests = requests.filter((r) => r.status === 'COMPLETED' || r.status === 'CANCELLED');

    return (
        <div className="py-8">
            <header className="mb-12 text-center">
                <h2 className="text-4xl font-bold text-brand-navy">나의 예매 요청 현황</h2>
                <p className="text-xl text-gray-600 mt-2">야구 경기 예매 요청 상태를 확인하세요.</p>
            </header>

            <section className="mb-12">
                <h3 className="text-2xl font-semibold text-brand-navy mb-6">현재 진행 중인 요청</h3>
                {currentRequests.length > 0 ? (
                    <div className="space-y-6">
                        {currentRequests.map((req) => {
                            const statusInfo = statusMapping[req.status as RequestStatus];
                            if (!statusInfo) return null;

                            const CardHeaderBg = statusInfo.bgColorClass || 'bg-slate-50';

                            return (
                                <Card key={req.id} className="shadow-lg overflow-hidden">
                                    <CardHeader className={`p-5 ${CardHeaderBg}`}>
                                        <div className="flex justify-between items-start gap-4">
                                            <div>
                                                <CardTitle className="text-2xl text-brand-navy-light mb-1">
                                                    {req.teamName}
                                                </CardTitle>
                                                <div className="text-md text-gray-700 space-y-1">
                                                    <p className="flex items-center gap-2">
                                                        <CalendarDays size={18} /> {req.gameDate}{' '}
                                                    </p>
                                                    <p className="flex items-center gap-2">
                                                        <UsersIcon size={18} /> {req.numberOfTickets}매
                                                    </p>
                                                    {req.helperName && (
                                                        <p className="flex items-center gap-2">
                                                            <UserCircle size={18} /> 담당 헬퍼: {req.helperName}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <StatusIcon status={req.status as RequestStatus} />
                                                <p className={`mt-1 text-sm font-semibold ${statusInfo.colorClass}`}>
                                                    {statusInfo.statusText}
                                                </p>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    {statusInfo.actionLink && statusInfo.actionText && (
                                        <CardContent className="p-5 border-t">
                                            <Link href={statusInfo.actionLink(req.id)} passHref>
                                                <Button
                                                    size="lg"
                                                    className={`w-full btn-touch-lg text-lg ${
                                                        req.status === 'TICKET_PROPOSED'
                                                            ? 'bg-orange-500 hover:bg-orange-600'
                                                            : 'bg-brand-navy hover:bg-brand-navy-light'
                                                    } text-white`}
                                                >
                                                    {statusInfo.actionText}
                                                </Button>
                                            </Link>
                                        </CardContent>
                                    )}
                                </Card>
                            );
                        })}
                    </div>
                ) : (
                    <Card className="shadow-sm border-gray-200">
                        <CardContent className="p-8 text-center">
                            <TicketIcon size={48} className="mx-auto text-gray-400 mb-4" />
                            <p className="text-xl text-gray-600">현재 진행 중인 요청이 없습니다.</p>
                            <p className="text-md text-gray-500 mt-1">
                                새로운 경기를 보러 가고 싶으시면 아래 버튼을 눌러주세요.
                            </p>
                        </CardContent>
                    </Card>
                )}
            </section>

            <section>
                <h3 className="text-2xl font-semibold text-brand-navy mb-6">지난 요청 내역</h3>
                {pastRequests.length > 0 ? (
                    <div className="space-y-4">
                        {pastRequests.map((req) => {
                            const statusInfo = statusMapping[req.status as RequestStatus];
                            if (!statusInfo) return null;

                            return (
                                <Card key={req.id} className="shadow-md bg-gray-100">
                                    <CardContent className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                        <div>
                                            <p className="text-xl font-semibold text-gray-800">{req.teamName}</p>
                                            <p className="text-md text-gray-600">
                                                {req.gameDate} / {req.numberOfTickets}매{' '}
                                            </p>
                                            {req.helperName && (
                                                <p className="text-sm text-gray-500">도움주신 헬퍼: {req.helperName}</p>
                                            )}
                                        </div>
                                        <Badge
                                            className={`text-md px-4 py-1.5 mt-2 sm:mt-0 ${statusInfo.bgColorClass} ${statusInfo.colorClass}`}
                                        >
                                            {statusInfo.statusText}
                                        </Badge>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                ) : (
                    <Card className="shadow-sm border-gray-200">
                        <CardContent className="p-8 text-center">
                            <CalendarDays size={48} className="mx-auto text-gray-400 mb-4" />
                            <p className="text-xl text-gray-600">지난 요청 내역이 없습니다.</p>
                        </CardContent>
                    </Card>
                )}
            </section>
            <div className="mt-16 text-center">
                <Link href="/senior/select-team" passHref>
                    <Button
                        size="lg"
                        className="btn-touch-xl bg-brand-navy hover:bg-brand-navy-light text-white text-xl px-10 py-6"
                    >
                        새로운 경기 예매 요청하기
                    </Button>
                </Link>
            </div>
        </div>
    );
}
