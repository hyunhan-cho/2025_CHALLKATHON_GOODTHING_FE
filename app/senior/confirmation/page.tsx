'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter, useSearchParams } from 'next/navigation';
import { Ticket, CalendarDays, Users, Tag, CheckCircle2, ListChecks } from 'lucide-react';
import { getProposedTicketDetails, confirmProposedTicket, ProposedTicketDetails } from '@/lib/api';
import Link from 'next/link';

export default function ReservationConfirmationPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const requestId = searchParams.get('requestId');

    const [reservationDetails, setReservationDetails] = useState<ProposedTicketDetails | null>(null);
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
                const data = await getProposedTicketDetails(requestId); // API 호출
                setReservationDetails(data);
            } catch (err: any) {
                console.error('티켓 예매 정보를 불러오는 중 오류 발생:', err);
                setError(err.response?.data?.message || '티켓 예매 정보를 불러오는데 실패했습니다.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchTicketDetails();
    }, [requestId]);

    const handleConfirmSeat = async () => {
        if (!requestId) {
            alert('요청 ID가 없어 좌석을 확정할 수 없습니다.');
            return;
        }
        try {
            await confirmProposedTicket(requestId);
            alert('좌석이 성공적으로 확정되었습니다! 즐거운 관람 되세요.');
            router.push('/senior/my-page');
        } catch (err: any) {
            console.error('좌석 확정 중 오류 발생:', err);
            alert(err.response?.data?.message || '좌석 확정에 실패했습니다. 다시 시도해주세요.');
        }
    };

    const handleGoToRequestList = () => {
        router.push('/senior/my-page');
    };

    if (isLoading) {
        return (
            <div className="py-8 text-center text-xl text-gray-500 min-h-[calc(100vh-10rem)] flex items-center justify-center">
                <p>티켓 예매 정보를 불러오는 중입니다...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-10">
                <p className="text-xl text-red-600 mb-6">{error}</p>
                <Link href="/senior/my-page" passHref>
                    {' '}
                    <Button variant="outline" className="text-lg">
                        <ListChecks className="mr-2 h-5 w-5" /> 내 요청 목록으로
                    </Button>
                </Link>
            </div>
        );
    }

    if (!reservationDetails) {
        return (
            <div className="text-center py-10">
                <p className="text-xl text-red-600 mb-6">티켓 예매 정보를 찾을 수 없습니다.</p>
                <Link href="/senior/my-page" passHref>
                    <Button variant="outline" className="text-lg">
                        <ListChecks className="mr-2 h-5 w-5" /> 내 요청 목록으로
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="py-8 max-w-2xl mx-auto">
            <Card className="shadow-xl">
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl text-brand-navy">티켓 예매 정보 확인</CardTitle>
                    <CardDescription className="text-lg pt-2">
                        <span className="font-semibold text-brand-navy-light">{reservationDetails.helperName}</span>{' '}
                        헬퍼님이 찾아주신 티켓 정보입니다.
                        <br /> 내용을 확인하고 좌석을 확정해주세요.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 text-lg">
                    <div className="space-y-3 p-4 bg-sky-50 rounded-lg">
                        <div className="flex items-center gap-3">
                            <Ticket className="text-brand-navy" size={24} />
                            <span className="font-medium text-gray-600">응원팀:</span>
                            <span className="font-semibold text-brand-navy">{reservationDetails.teamName}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <CalendarDays className="text-brand-navy" size={24} />
                            <span className="font-medium text-gray-600">경기일시:</span>
                            <span className="font-semibold text-brand-navy">{reservationDetails.matchDate}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Users className="text-brand-navy" size={24} />
                            <span className="font-medium text-gray-600">티켓수량:</span>
                            <span className="font-semibold text-brand-navy">
                                {reservationDetails.numberOfTickets}매
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Users className="text-brand-navy" size={24} />
                            <span className="font-medium text-gray-600">좌석정보:</span>
                            <span className="font-semibold text-brand-navy">{reservationDetails.seatType}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Tag className="text-brand-navy" size={24} />
                            <span className="font-medium text-gray-600">총 금액:</span>
                            <span className="font-semibold text-brand-navy text-xl">
                                {reservationDetails.totalPrice}
                            </span>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row gap-4 pt-8">
                    <Button
                        onClick={handleGoToRequestList}
                        variant="outline"
                        className="w-full sm:w-1/2 btn-touch-lg border-brand-navy text-brand-navy hover:bg-brand-sky/20 bg-white flex items-center justify-center gap-2"
                    >
                        <ListChecks size={22} />
                        <span>요청 목록으로</span>
                    </Button>
                    <Button
                        onClick={handleConfirmSeat}
                        className="w-full sm:w-1/2 btn-touch-lg bg-brand-navy hover:bg-brand-navy-light text-white flex items-center justify-center gap-2"
                    >
                        <CheckCircle2 size={22} />
                        <span>이 좌석으로 확정</span>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
