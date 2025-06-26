'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useKboTeams } from '@/components/kbo-teams';

export default function SelectTeamPage() {
    const router = useRouter();
    const { teams, isLoading, error } = useKboTeams();
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

    const handleTeamSelect = (teamId: string) => {
        setSelectedTeamId(teamId);
        setTimeout(() => {
            router.push(`/senior/select-date?teamId=${teamId}`);
        }, 300);
    };

    if (isLoading) {
        return (
            <div className="py-8 text-center text-xl text-gray-500 min-h-screen flex items-center justify-center">
                <p>KBO 팀 목록을 불러오는 중입니다...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="py-8 text-center text-xl text-red-600 min-h-screen flex items-center justify-center">
                <p>{error}</p>
                <p>팀 목록을 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요.</p>
            </div>
        );
    }

    if (teams.length === 0) {
        return (
            <div className="py-8 text-center text-xl text-gray-600 min-h-screen flex items-center justify-center">
                <p>표시할 KBO 팀이 없습니다.</p>
            </div>
        );
    }

    return (
        <div className="py-8">
            <h2 className="text-3xl font-bold text-brand-navy mb-8 text-center">응원하는 KBO 팀을 선택해주세요!</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                {teams.map((team) => {
                    const isSelected = selectedTeamId === String(team.id);
                    return (
                        <Card
                            key={team.id}
                            className={`overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer group border-2 ${
                                isSelected ? 'border-brand-navy' : 'border-gray-200'
                            }`}
                            onClick={() => handleTeamSelect(String(team.id))}
                        >
                            <CardContent className="p-6 flex items-center justify-center h-full">
                                <p
                                    className={`text-lg text-center ${
                                        isSelected
                                            ? 'font-bold underline text-brand-navy'
                                            : 'text-gray-700 group-hover:text-brand-navy'
                                    }`}
                                >
                                    {team.name}
                                </p>
                            </CardContent>
                        </Card>
                    );
                })}
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
