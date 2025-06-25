import { useEffect, useState } from 'react';
import { getKboTeams, KboTeam } from '@/lib/api';

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
            const data = await getKboTeams(); // API 호출
            setTeams(data);
        } catch (err: any) {
            console.error('KBO 팀 목록을 불러오는 데 실패했습니다:', err);
            setError(err.response?.data?.message || 'KBO 팀 목록을 불러오는데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTeams();
    }, []); // 컴포넌트가 처음 마운트될 때 한 번만 실행

    return { teams, isLoading, error, refetch: fetchTeams };
};
