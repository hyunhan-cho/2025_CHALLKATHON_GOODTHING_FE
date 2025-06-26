// components/kbo-teams.ts
'use client';

import { useEffect, useState } from 'react';
import { getKboTeams, KboTeam } from '@/lib/api'; // lib/api에서 KboTeam 및 getKboTeams 임포트

interface UseKboTeamsResult {
    teams: KboTeam[];
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
}

/**
 * KBO 팀 목록을 백엔드에서 불러오는 React Hook
 * @returns {UseKboTeamsResult} 팀 목록, 로딩 상태, 에러 정보, 재요청 함수
 */
export const useKboTeams = (): UseKboTeamsResult => {
    const [teams, setTeams] = useState<KboTeam[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTeams = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await getKboTeams(); // lib/api에서 임포트한 함수 호출
            setTeams(data);
        } catch (err: any) {
            console.error('KBO 팀 목록을 불러오는 데 실패했습니다:', err);
            // AxiosError 처리. lib/api.ts의 인터셉터에서 이미 처리되므로 간단하게 메시지 전달.
            setError(err.message || 'KBO 팀 목록을 불러오는데 실패했습니다.'); // err.response?.data?.message 대신 err.message 사용
            setTeams([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTeams();
    }, []);

    return { teams, isLoading, error, refetch: fetchTeams };
};
