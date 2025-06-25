'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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
import { getHelpRequestById, HelpRequest } from '@/lib/api'; // API 함수와 HelpRequest 인터페이스 임포트

// 백엔드의 실제 상태 값과 일치하도록 조정해야 합니다.
// 예: 백엔드에서 'REQUESTED', 'IN_PROGRESS', 'TICKET_PROPOSED', 'COMPLETED' 등으로 올 수 있습니다.
const statusMap = {
    REQUESTED: { text: '요청 접수', color: 'bg-gray-500', step: 1 },
    IN_PROGRESS: { text: '도움 진행 중', color: 'bg-blue-500', step: 2 },
    TICKET_PROPOSED: { text: '티켓 정보 전달 완료', color: 'bg-orange-500', step: 3 }, // 헬퍼가 티켓 정보를 입력하면 이 상태로 변경
    SEAT_CONFIRMED: { text: '좌석 확정', color: 'bg-purple-500', step: 4 }, // 시니어 팬이 좌석을 확정하면 이 상태로 변경 (새로 추가)
    COMPLETED: { text: '도움 완료', color: 'bg-green-500', step: 5 }, // 관람 완료 또는 최종 완료
} as const; // 타입 추론을 위해 'as const' 추가

// statusMap의 키 값을 타입으로 정의
type RequestStatus = keyof typeof statusMap;

// 총 단계 수는 statusMap의 가장 높은 step 값에 따라 달라질 수 있습니다.
const totalSteps = 5; // REQUESTED -> IN_PROGRESS -> TICKET_PROPOSED -> SEAT_CONFIRMED -> COMPLETED

export default function HelperRequestDetailPage() {
    const router = useRouter();
    const params = useParams();
    const requestId = params.requestId as string; // URL 파라미터에서 요청 ID 가져오기

    const [requestDetails, setRequestDetails] = useState<HelpRequest | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!requestId) {
                setIsLoading(false);
                setError('요청 ID가 제공되지 않았습니다.');
                return;
            }
            try {
                setIsLoading(true);
                setError(null); // 에러 초기화
                const data = await getHelpRequestById(requestId); // API 호출

                // 백엔드에서 가져온 status 값이 statusMap에 정의된 타입인지 확인합니다.
                // 백엔드 상태 값이 다를 경우 statusMap을 업데이트하거나, 매핑 로직을 추가해야 합니다.
                if (data.status && Object.keys(statusMap).includes(data.status as RequestStatus)) {
                    setRequestDetails(data);
                } else {
                    console.warn(`백엔드에서 알 수 없는 요청 상태를 받았습니다: ${data.status}`);
                    // 알 수 없는 상태라도 일단 데이터를 설정하여 렌더링되게 하고, UI에서 폴백 처리
                    setRequestDetails(data);
                    // setError("알 수 없는 요청 상태입니다."); // 필요한 경우 사용자에게 에러 메시지 표시
                }
            } catch (err: any) {
                console.error(`ID ${requestId}의 요청 상세 정보를 불러오는 중 오류 발생:`, err);
                setError(
                    err.response?.data?.message ||
                        `요청 정보를 불러오는데 실패했습니다: ${err.message || '알 수 없는 오류'}`
                );
            } finally {
                setIsLoading(false);
            }
        };

        fetchDetails();
    }, [requestId]); // requestId가 변경될 때마다 다시 불러옵니다.

    const handleMarkAsHelped = async () => {
        if (!requestDetails) return;

        // 실제로는 여기에 새로운 화면/모달로 이동하여 티켓 정보를 입력받고
        // 백엔드 API를 통해 상태를 'TICKET_PROPOSED' 등으로 업데이트하는 로직이 들어갈 것입니다.
        // 예: router.push(`/helper/propose-ticket?requestId=${requestId}`);

        alert(`"${requestDetails.seniorFanName}"님에게 티켓 정보를 전달하는 화면으로 이동합니다. (구현 필요)`);
        // 백엔드에 요청의 상태를 'TICKET_PROPOSED'로 변경하는 API 호출을 가정합니다.
        // try {
        //   await updateRequestStatus(requestId, "TICKET_PROPOSED"); // 이런 API 함수가 필요
        //   setRequestDetails(prev => prev ? { ...prev, status: "TICKET_PROPOSED" } : null);
        //   alert("티켓 정보 전달 완료 상태로 변경되었습니다.");
        //   router.push("/helper/dashboard"); // 대시보드로 돌아가기
        // } catch (err) {
        //   console.error("상태 업데이트 실패:", err);
        //   alert("상태 업데이트에 실패했습니다.");
        // }

        // 현재는 시뮬레이션: 일정 시간 후 대시보드로 리다이렉트
        setTimeout(() => {
            alert('티켓 정보 전달이 시뮬레이션되었으며, 상태가 업데이트되었습니다.');
            router.push('/helper/dashboard');
        }, 1500);
    };

    const handleContact = () => {
        if (requestDetails?.contactPreference === 'phone' && requestDetails.phoneNumber) {
            alert(`전화 걸기: ${requestDetails.phoneNumber}`);
            // window.location.href = `tel:${requestDetails.phoneNumber}`; // 실제 전화 걸기
        } else if (requestDetails?.contactPreference === 'chat') {
            alert('채팅 기능은 현재 준비 중입니다. (구현 필요)');
            // router.push(`/chat/${requestId}`); // 예시 채팅 라우트
        } else {
            alert('연락처 정보가 없거나 선호하는 연락 방법이 지정되지 않았습니다.');
        }
    };

    if (isLoading) {
        // app/helper/request/loading.tsx가 자동으로 렌더링되므로, 여기서는 간단하게 처리
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
                <Link href="/helper/dashboard" passHref>
                    <Button variant="outline" className="text-lg">
                        <ArrowLeft className="mr-2 h-5 w-5" /> 대시보드로 돌아가기
                    </Button>
                </Link>
            </div>
        );
    }

    if (!requestDetails) {
        return (
            <div className="text-center py-10">
                <p className="text-xl text-red-600 mb-6">요청 정보를 찾을 수 없습니다.</p>
                <Link href="/helper/dashboard" passHref>
                    <Button variant="outline" className="text-lg">
                        <ArrowLeft className="mr-2 h-5 w-5" /> 대시보드로 돌아가기
                    </Button>
                </Link>
            </div>
        );
    }

    // 백엔드에서 넘어온 status가 statusMap의 key에 없는 경우를 대비하여 폴백 처리
    const currentStatusInfo = statusMap[requestDetails.status as RequestStatus] || {
        text: '알 수 없음',
        color: 'bg-gray-400',
        step: 0,
    };
    const progressPercentage = (currentStatusInfo.step / totalSteps) * 100;

    return (
        <div className="py-8 max-w-3xl mx-auto">
            <Card className="shadow-xl">
                <CardHeader>
                    <div className="flex justify-between items-center mb-2">
                        <Button variant="outline" size="sm" onClick={() => router.back()} className="text-md">
                            <ArrowLeft className="mr-2 h-4 w-4" /> 뒤로가기
                        </Button>
                        <span
                            className={`px-3 py-1 text-sm font-semibold text-white rounded-full ${currentStatusInfo.color}`}
                        >
                            {currentStatusInfo.text}
                        </span>
                    </div>
                    <CardTitle className="text-3xl text-brand-navy flex items-center gap-3">
                        <UserCircle2 size={36} /> {requestDetails.seniorFanName}님의 예매 요청
                    </CardTitle>
                    <CardDescription className="text-lg pt-1">
                        아래 요청 세부사항을 확인하고 도움을 진행해주세요.
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Progress Bar */}
                    <div>
                        <div className="flex justify-between mb-1 text-sm text-gray-600">
                            <span>요청 접수</span>
                            <span>티켓 제안</span> {/* 텍스트를 "정보 전달"에서 "티켓 제안"으로 변경 */}
                            <span>좌석 확정</span> {/* 새로운 단계 추가 */}
                            <span>도움 완료</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-700">
                            <div
                                className={`${currentStatusInfo.color} h-3 rounded-full transition-all duration-500 ease-out`}
                                style={{ width: `${progressPercentage}%` }}
                            />
                        </div>
                        <p className="text-center mt-2 text-md font-medium text-brand-navy-light">
                            현재 상태: {currentStatusInfo.text} ({currentStatusInfo.step}/{totalSteps} 단계)
                        </p>
                    </div>

                    <div className="border-t pt-6 space-y-4 text-lg">
                        <div className="flex items-start gap-3">
                            <TicketIcon className="text-brand-navy mt-1 flex-shrink-0" size={24} />
                            <div>
                                <span className="font-semibold text-gray-700">응원팀:</span>
                                <span className="ml-2 text-brand-navy-light font-bold">{requestDetails.teamName}</span>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <CalendarDays className="text-brand-navy mt-1 flex-shrink-0" size={24} />
                            <div>
                                <span className="font-semibold text-gray-700">희망 경기일:</span>
                                <span className="ml-2 text-brand-navy-light font-bold">
                                    {requestDetails.gameDate}{' '}
                                    {requestDetails.gameTime && `(${requestDetails.gameTime})`}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Info className="text-brand-navy mt-1 flex-shrink-0" size={24} />{' '}
                            {/* Using Info icon for tickets */}
                            <div>
                                <span className="font-semibold text-gray-700">필요 티켓 수:</span>
                                <span className="ml-2 text-brand-navy-light font-bold">
                                    {requestDetails.numberOfTickets}매
                                </span>
                            </div>
                        </div>
                        {requestDetails.notes && (
                            <div className="flex items-start gap-3 p-3 bg-sky-50 rounded-md">
                                <Info className="text-brand-sky mt-1 flex-shrink-0" size={24} />
                                <div>
                                    <span className="font-semibold text-gray-700">요청사항:</span>
                                    <p className="ml-2 text-gray-800 whitespace-pre-line">{requestDetails.notes}</p>
                                </div>
                            </div>
                        )}
                        {/* 연락처 정보는 백엔드에서 직접 받는 필드가 있다면 추가. 현재 mock은 phoneNumber가 있었음 */}
                        {requestDetails.phoneNumber && requestDetails.contactPreference === 'phone' && (
                            <div className="flex items-start gap-3 p-3 bg-indigo-50 rounded-md">
                                <Phone className="text-brand-navy mt-1 flex-shrink-0" size={24} />
                                <div>
                                    <span className="font-semibold text-gray-700">연락처:</span>
                                    <p className="ml-2 text-gray-800">{requestDetails.phoneNumber}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col sm:flex-row gap-4 pt-8 border-t">
                    <Button
                        onClick={handleContact}
                        variant="outline"
                        className="w-full sm:flex-1 btn-touch-lg border-brand-navy text-brand-navy hover:bg-brand-sky/20 bg-white flex items-center justify-center gap-2"
                    >
                        {requestDetails.contactPreference === 'phone' ? (
                            <Phone size={22} />
                        ) : (
                            <MessageSquare size={22} />
                        )}
                        <span>
                            {requestDetails.contactPreference === 'phone' ? '어르신께 전화하기' : '어르신과 채팅하기'}
                        </span>
                    </Button>
                    <Button
                        onClick={handleMarkAsHelped}
                        // TICKET_PROPOSED 상태 이상에서는 버튼 비활성화 (이미 티켓을 제안했으므로)
                        disabled={
                            requestDetails.status === 'TICKET_PROPOSED' ||
                            requestDetails.status === 'SEAT_CONFIRMED' ||
                            requestDetails.status === 'COMPLETED'
                        }
                        className="w-full sm:flex-1 btn-touch-lg bg-brand-navy hover:bg-brand-navy-light text-white flex items-center justify-center gap-2"
                    >
                        <CheckCircle size={22} />
                        <span>
                            {requestDetails.status === 'TICKET_PROPOSED' ||
                            requestDetails.status === 'SEAT_CONFIRMED' ||
                            requestDetails.status === 'COMPLETED'
                                ? '티켓 정보 전달 완료됨'
                                : '티켓 정보 전달하기'}
                        </span>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
