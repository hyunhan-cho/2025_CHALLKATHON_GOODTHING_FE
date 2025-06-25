'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, Users, CalendarCheck2, Star, ShieldCheck, ListChecks } from 'lucide-react';
import { getHelperActivities, getHelperStats, HelperActivity, HelperStats } from '@/lib/api'; // 새로운 API 함수와 인터페이스 임포트

const activityStatusMap = {
    COMPLETED: { text: '도움 완료', bgColor: 'bg-green-100', textColor: 'text-green-700' },
    IN_PROGRESS: { text: '진행 중', bgColor: 'bg-blue-100', textColor: 'text-blue-700' },
} as const;

type ActivityStatus = keyof typeof activityStatusMap;

export default function HelperMyPage() {
    const [activities, setActivities] = useState<HelperActivity[]>([]);
    const [stats, setStats] = useState<HelperStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchHelperData = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const activitiesData = await getHelperActivities();

                setActivities(
                    activitiesData.filter((act) =>
                        Object.keys(activityStatusMap).includes(act.status as ActivityStatus)
                    )
                );

                const statsData = await getHelperStats();
                setStats(statsData);
            } catch (err: any) {
                console.error('헬퍼 데이터를 불러오는 중 오류 발생:', err);
                setError(err.response?.data?.message || '활동 내역 및 통계를 불러오는데 실패했습니다.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchHelperData();
    }, []);

    if (isLoading) {
        return (
            <div className="py-8 text-center text-xl text-gray-500 min-h-[calc(100vh-10rem)] flex items-center justify-center">
                <p>활동 내역과 통계를 불러오는 중입니다...</p>
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

    const completedActivities = activities.filter((activity) => activity.status === 'COMPLETED');
    const inProgressActivities = activities.filter((activity) => activity.status === 'IN_PROGRESS');

    return (
        <div className="py-8">
            <header className="mb-12 text-center">
                <h2 className="text-4xl font-bold text-brand-navy">나의 도움 활동</h2>
                <p className="text-xl text-gray-600 mt-2">그동안의 도움 내역과 성과를 확인해보세요.</p>
            </header>

            <section className="mb-16">
                <h3 className="text-2xl font-semibold text-brand-navy mb-6 flex items-center gap-2">
                    <ShieldCheck size={28} />
                    활동 요약
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                    <Card className="shadow-xl border-2 border-brand-navy bg-white overflow-hidden">
                        <CardHeader className="bg-brand-navy text-white p-6">
                            <CardTitle className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
                                <Award size={36} className="flex-shrink-0" />
                                <span>총 도움 완료</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 sm:p-8 text-center">
                            <p className="text-6xl sm:text-7xl font-bold text-brand-navy mb-1">
                                {stats?.totalSessionsCompleted || 0} {/* stats가 null일 경우 0으로 표시 */}
                                <span className="text-4xl sm:text-5xl ml-2">회</span>
                            </p>
                            <p className="text-lg text-gray-600">완료된 도움 세션</p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-xl border-2 border-brand-sky bg-white overflow-hidden">
                        <CardHeader className="bg-brand-sky text-brand-navy p-6">
                            <CardTitle className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
                                <Star size={36} className="flex-shrink-0" />
                                <span>적립된 도움 마일리지</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 sm:p-8 text-center">
                            <p className="text-6xl sm:text-7xl font-bold text-brand-navy mb-1">
                                {(stats?.mileagePoints || 0).toLocaleString()} {/* stats가 null일 경우 0으로 표시 */}
                                <span className="text-4xl sm:text-5xl ml-2">점</span>
                            </p>
                            <p className="text-lg text-gray-600">감사 마일리지</p>
                        </CardContent>
                    </Card>
                </div>
            </section>

            <section>
                <h3 className="text-2xl font-semibold text-brand-navy mb-6 flex items-center gap-2">
                    <ListChecks size={28} />
                    상세 도움 내역
                </h3>

                {inProgressActivities.length > 0 && (
                    <div className="mb-8">
                        <h4 className="text-xl font-medium text-brand-navy-light mb-4">
                            현재 진행 중인 도움 ({inProgressActivities.length}건)
                        </h4>
                        <div className="space-y-4">
                            {inProgressActivities.map((activity) => {
                                const statusInfo = activityStatusMap[activity.status as ActivityStatus];
                                return (
                                    <Card key={activity.id} className="shadow-lg border border-blue-200 bg-blue-50/50">
                                        <CardContent className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-2 items-center">
                                            <div className="flex items-center gap-3 col-span-1 sm:col-span-1">
                                                <Users className="text-blue-600 flex-shrink-0" size={28} />
                                                <div>
                                                    <p className="text-xl font-semibold text-blue-700">
                                                        {activity.seniorFanName}
                                                    </p>
                                                    <p className="text-sm text-gray-500">도움 받는 분</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 col-span-1 sm:col-span-1">
                                                <CalendarCheck2 className="text-blue-600 flex-shrink-0" size={28} />
                                                <div>
                                                    <p className="text-lg text-gray-800">{activity.teamName}</p>
                                                    <p className="text-sm text-gray-500">{activity.gameDate}</p>
                                                </div>
                                            </div>
                                            <div className="text-left sm:text-right col-span-1 sm:col-span-1">
                                                <span
                                                    className={`inline-block px-4 py-1.5 rounded-full text-md font-semibold ${statusInfo?.bgColor} ${statusInfo?.textColor}`}
                                                >
                                                    {statusInfo?.text || activity.status}
                                                </span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                )}

                {completedActivities.length > 0 ? (
                    <div>
                        <h4 className="text-xl font-medium text-brand-navy-light mb-4">
                            완료된 도움 내역 ({completedActivities.length}건)
                        </h4>
                        <div className="space-y-4">
                            {completedActivities.map((activity) => {
                                const statusInfo = activityStatusMap[activity.status as ActivityStatus];
                                return (
                                    <Card key={activity.id} className="shadow-md border border-gray-200 bg-white">
                                        <CardContent className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-2 items-center">
                                            <div className="flex items-center gap-3 col-span-1 sm:col-span-1">
                                                <Users className="text-brand-navy flex-shrink-0" size={28} />
                                                <div>
                                                    <p className="text-xl font-semibold text-gray-800">
                                                        {activity.seniorFanName}
                                                    </p>
                                                    <p className="text-sm text-gray-500">도움 받은 분</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 col-span-1 sm:col-span-1">
                                                <CalendarCheck2 className="text-brand-navy flex-shrink-0" size={28} />
                                                <div>
                                                    <p className="text-lg text-gray-700">{activity.teamName}</p>
                                                    <p className="text-sm text-gray-500">{activity.gameDate}</p>
                                                </div>
                                            </div>
                                            <div className="text-left sm:text-right col-span-1 sm:col-span-1">
                                                <span
                                                    className={`inline-block px-4 py-1.5 rounded-full text-md font-semibold ${statusInfo?.bgColor} ${statusInfo?.textColor}`}
                                                >
                                                    {statusInfo?.text || activity.status}
                                                </span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    !inProgressActivities.length && (
                        <Card className="shadow-sm border-gray-200">
                            <CardContent className="p-8 text-center">
                                <ListChecks size={48} className="mx-auto text-gray-400 mb-4" />
                                <p className="text-xl text-gray-600">아직 도움 내역이 없습니다.</p>
                                <p className="text-md text-gray-500 mt-1">
                                    새로운 요청을 확인하고 도움을 시작해보세요!
                                </p>
                            </CardContent>
                        </Card>
                    )
                )}
            </section>
        </div>
    );
}
