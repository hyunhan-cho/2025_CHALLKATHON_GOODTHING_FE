import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

// =================================================================
// 1. 타입 정의 (Interfaces)
// =================================================================

export interface KboTeam {
    id: number;
    name: string;
    shortName: string;
    homeStadium: string;
    logoUrl?: string;
}

export interface GameDetail {
    gameId: number;
    date: string;
    time: string;
    homeTeam: { name: string };
    awayTeam: { name: string };
    stadium: string;
}

export interface DecodedToken {
    token_type: string;
    exp: number;
    iat: number;
    jti: string;
    userId: number;
    role: 'senior' | 'helper';
    name: string;
    mileagePoints?: number;
}

export interface RawHelpRequestResponse {
    requestId: number;
    userId: {
        id: number;
        name: string;
        phone: string;
        role: string;
        mileagePoints: number;
    };
    game: GameDetail;
    accompanyType: string;
    additionalInfo: string;
    createdAt: string;
    updatedAt: string;
    numberOfTickets: number;
    status:
        | 'WAITING_FOR_HELPER'
        | 'HELPER_MATCHED'
        | 'TICKET_PROPOSED'
        | 'SEAT_CONFIRMED'
        | 'COMPLETED'
        | 'CANCELLED';
}

export interface HelpRequest {
    id: string;
    seniorFanName: string;
    teamName: string;
    gameDate: string;
    gameTime?: string;
    numberOfTickets: number;
    notes?: string;
    contactPreference: 'phone' | 'chat';
    phoneNumber?: string;
    status:
        | 'WAITING_FOR_HELPER'
        | 'HELPER_MATCHED'
        | 'TICKET_PROPOSED'
        | 'SEAT_CONFIRMED'
        | 'COMPLETED'
        | 'CANCELLED'
        | 'REQUESTED'
        | 'IN_PROGRESS';
    helperName?: string;
}

export interface ProposedTicketDetails {
    requestId: string;
    helperName: string;
    teamName: string;
    matchDate: string;
    numberOfTickets: number;
    seatType: string;
    totalPrice: string;
}

// =================================================================
// 2. Axios 인스턴스 및 인터셉터 설정
// =================================================================

const API_BASE_URL =
    'https://port-0-goodthing-rest-backend-mcge9of87641a8f6.sel5.cloudtype.app/api/';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true, // 🔥 refresh token 쿠키 자동 전송
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (error: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) prom.reject(error);
        else if (token) prom.resolve(token);
    });
    failedQueue = [];
};

// 요청 인터셉터
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');
        const publicUrls = ['/auth/login', '/auth/signup', '/teams', '/games'];

        // 요청 URL이 공개 API 목록에 포함되면, Authorization 헤더 없이 바로 보냅니다.
        if (publicUrls.some((url) => config.url?.includes(url))) {
            return config;
        }

        // 그 외의 모든 보호된 API에 대해서만 토큰을 추가합니다.
        if (token) {
            try {
                // 추가: 토큰이 만료되었는지 미리 확인해서 만료된 토큰은 보내지 않도록 방어
                const decodedToken: { exp: number } = jwtDecode(token);
                if (decodedToken.exp * 1000 > Date.now()) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
            } catch (e) {
                console.error("Invalid token found", e);
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// 응답 인터셉터 (401 토큰 만료 시)
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // 🔥 공개 API는 refresh token 검사 건너뛰기
        const skipRefreshUrls = ['/auth/login', '/auth/signup', '/teams', '/games'];
        if (skipRefreshUrls.some((url) => originalRequest.url?.includes(url))) {
            return Promise.reject(error);
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const { data } = await axios.post(
                    `${API_BASE_URL}auth/refresh/`,
                    {},
                    { withCredentials: true }
                );

                // 새 access token 저장
                localStorage.setItem('authToken', data.access);

                processQueue(null, data.access);
                originalRequest.headers.Authorization = `Bearer ${data.access}`;
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                logoutUser();
                if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

// =================================================================
// 3. API 호출 함수
// =================================================================

// 인증
export const registerUser = async (userData: any) => {
    const response = await api.post('auth/signup/', userData);
    return response.data;
};

export const loginUser = async (credentials: { phone: string; password: string }) => {
    const response = await api.post('auth/login/', credentials, { withCredentials: true });
    if (response.data.access) {
        localStorage.setItem('authToken', response.data.access);
    }
    return response.data;
};

// 사용자
export const getUserProfile = async () => {
    const response = await api.get('users/me/');
    return response.data;
};

export const updateUserProfile = async (userData: any) => {
    const response = await api.patch('users/me/', userData);
    return response.data;
};

// 팀/게임 정보
export const getKboTeams = async (): Promise<KboTeam[]> => {
    const response = await api.get<KboTeam[]>('teams/');
    return response.data.map((team) => ({
        ...team,
        name: team.shortName,
    }));
};

export const getGames = async (params?: { date?: string; team?: string }) => {
    const response = await api.get('games/', { params });
    return response.data;
};

// 요청 관련
export const createHelpRequest = async (payload: {
    seniorId: string;
    teamId: string;
    gameDate: string;
    numberOfTickets: number;
}) => {
    const response = await api.post('reservation-requests/', payload);
    return response.data;
};

export const getHelpRequests = async (params?: any): Promise<HelpRequest[]> => {
    const response = await api.get<HelpRequest[]>('help-requests/', { params });
    return response.data;
};

export const getHelpRequestDetails = async (requestId: string) => {
    const response = await api.get<RawHelpRequestResponse>(`requests/${requestId}/`);
    return response.data;
};

export const completeHelpRequest = async (requestId: string) => {
    const response = await api.post(`requests/${requestId}/complete/`);
    return response.data;
};

// 제안 관련
export const createProposal = async (requestId: string, payload: any) => {
    const response = await api.post(`requests/${requestId}/proposals/create/`, payload);
    return response.data;
};

export const getProposalsForRequest = async (requestId: string) => {
    const response = await api.get(`requests/${requestId}/proposals/`);
    return response.data;
};

export const acceptProposal = async (proposalId: string) => {
    const response = await api.post(`proposals/${proposalId}/accept/`);
    return response.data;
};

export const rejectProposal = async (proposalId: string) => {
    const response = await api.post(`proposals/${proposalId}/reject/`);
    return response.data;
};

// 마이페이지
export const getMySeniorRequests = async () => {
    const response = await api.get('senior/requests/');
    return response.data;
};

export const getMyHelperProposals = async () => {
    const response = await api.get('mypage/proposals/');
    return response.data;
};

export const getMyStats = async () => {
    const response = await api.get('mypage/stats/');
    return response.data;
};

// 시니어 전용
export const getProposedTicketDetails = async (requestId: string) => {
    const response = await api.get<ProposedTicketDetails>(
        `senior/requests/${requestId}/proposed-ticket/`
    );
    return response.data;
};

export const confirmProposedTicket = async (requestId: string) => {
    const response = await api.post(`senior/requests/${requestId}/confirm-ticket/`);
    return response.data;
};

// 헬퍼 활동
export interface HelperActivity {
    id: string;
    seniorFanName: string;
    teamName: string;
    gameDate: string;
    status: 'COMPLETED' | 'IN_PROGRESS';
}

export const getHelperActivities = async (): Promise<HelperActivity[]> => {
    const response = await api.get('/helper/activities/');
    return response.data;
};

export interface HelperStats {
    totalSessionsCompleted: number;
    mileagePoints: number;
}

export const getHelperStats = async (): Promise<HelperStats> => {
    const response = await api.get('/mypage/stats/');
    return response.data;
};

// 로그아웃
export const logoutUser = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userMileagePoints');
};

export default api;
