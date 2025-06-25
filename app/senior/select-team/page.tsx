'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useKboTeams } from '@/components/kbo-teams'; // 수정된 useKboTeams Hook 임포트
import React from 'react'; // React 임포트

export default function SelectTeamPage() {
    const router = useRouter();
    const { teams, isLoading, error } = useKboTeams(); // useKboTeams Hook 사용

    const handleTeamSelect = (teamId: string) => {
        // team.id만 받도록 수정
        // Store selected team (e.g., in state management or pass via query params)
        console.log('Selected team ID:', teamId);
        router.push(`/senior/select-date?teamId=${teamId}`);
    };

    if (isLoading) {
        return (
            <div className="py-8 text-center text-xl text-gray-500 min-h-[calc(100vh-10rem)] flex items-center justify-center">
                <p>KBO 팀 목록을 불러오는 중입니다...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="py-8 text-center text-xl text-red-600 min-h-[calc(100vh-10rem)] flex items-center justify-center">
                <p>{error}</p>
                <p>팀 목록을 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요.</p>
            </div>
        );
    }

    if (teams.length === 0) {
        return (
            <div className="py-8 text-center text-xl text-gray-600 min-h-[calc(100vh-10rem)] flex items-center justify-center">
                <p>표시할 KBO 팀이 없습니다.</p>
            </div>
        );
    }

    return (
        <div className="py-8">
            <h2 className="text-3xl font-bold text-brand-navy mb-8 text-center">응원하는 KBO 팀을 선택해주세요!</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                {teams.map(
                    (
                        team // KBO_TEAMS 대신 teams 사용
                    ) => (
                        <Card
                            key={team.id}
                            className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer group"
                            onClick={() => handleTeamSelect(team.id)} // team.id만 전달
                        >
                            <CardContent className="p-0 flex flex-col items-center justify-center aspect-square">
                                <div className="relative w-20 h-20 sm:w-24 sm:h-24 mb-3">
                                    <Image
                                        src={
                                            team.logoUrl ||
                                            `/placeholder.svg?width=100&height=100&text=${
                                                team.shortName || team.name.charAt(0)
                                            }`
                                        }
                                        alt={`${team.name} 로고`}
                                        layout="fill"
                                        objectFit="contain"
                                        className="group-hover:scale-110 transition-transform duration-300"
                                    />
                                </div>
                                <p className="text-lg font-semibold text-brand-navy group-hover:text-brand-navy-light text-center px-2">
                                    {team.name}
                                </p>
                            </CardContent>
                        </Card>
                    )
                )}
            </div>
            <div className="mt-12 text-center">
                <Button
                    variant="outline"
                    size="lg"
                    className="text-lg border-brand-navy text-brand-navy hover:bg-brand-sky/20"
                    onClick={() => router.back()}
                >
                    이전으로
                </Button>
            </div>
        </div>
    );
}
