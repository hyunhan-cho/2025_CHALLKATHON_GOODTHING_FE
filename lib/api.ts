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
    date: string; // YYYY-MM-DD
    time: string; // HH:MM:SS
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

if (!API_BASE_URL) {
    console.error('API_BASE_URL is not set. Please check your environment variables.');
}

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // 🔥 쿠키 전송
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (error: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else if (token) {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// 요청 인터셉터
api.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('authToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
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

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return api(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // 🔥 refresh token은 HttpOnly 쿠키로 전송됨
                const { data } = await axios.post(
                    `${API_BASE_URL}auth/refresh/`,
                    {},
                    { withCredentials: true }
                );

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

// 3.1 인증 (Auth)
export const registerUser = async (userData: any) => {
    const response = await api.post('auth/signup/', userData);
    return response.data;
};

export const loginUser = async (credentials: { phone: string; password: string }) => {
    const response = await api.post('auth/login/', credentials, { withCredentials: true });
    if (response.data.access) {
        localStorage.setItem('authToken', response.data.access);
    }
    // refresh token은 쿠키로 내려오기 때문에 localStorage 저장 ❌
    return response.data;
};

// 3.2 사용자 (User)
export const getUserProfile = async () => {
    const response = await api.get('users/me/');
    return response.data;
};

export const updateUserProfile = async (userData: any) => {
    const response = await api.patch('users/me/', userData);
    return response.data;
};

// 3.3 팀 및 경기 정보
export const getKboTeams = async (): Promise<KboTeam[]> => {
    const response = await axios.get<KboTeam[]>(`${API_BASE_URL}teams/`, { withCredentials: true });
    return response.data.map((team) => ({
        ...team,
        name: team.shortName,
    }));
};

export const getGames = async (params?: { date?: string; team?: string }) => {
    const response = await api.get('games/', { params });
    return response.data;
};

// 3.4 도움 요청 (Request)
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

export const getHelpRequestDetails = async (
    requestId: string
): Promise<RawHelpRequestResponse> => {
    const response = await api.get<RawHelpRequestResponse>(`requests/${requestId}/`);
    return response.data;
};

export const completeHelpRequest = async (requestId: string) => {
    const response = await api.post(`requests/${requestId}/complete/`);
    return response.data;
};

// 3.5 제안 (Proposal)
export const createProposal = async (
    requestId: string,
    payload: { ticketInfo: string; message: string }
) => {
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

// 3.6 마이페이지 (MyPage)
export const getMySeniorRequests = async (): Promise<HelpRequest[]> => {
    const response = await api.get<HelpRequest[]>('senior/requests/');
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

// 3.7 시니어 전용 API
export const getProposedTicketDetails = async (
    requestId: string
): Promise<ProposedTicketDetails> => {
    const response = await api.get<ProposedTicketDetails>(
        `senior/requests/${requestId}/proposed-ticket/`
    );
    return response.data;
};

export const confirmProposedTicket = async (requestId: string) => {
    const response = await api.post(
        `senior/requests/${requestId}/confirm-ticket/`
    );
    return response.data;
};

// =================================================================
// 4. 헬퍼 활동 관련 API
// =================================================================

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

// =================================================================
// 5. 유틸리티 함수
// =================================================================

export const logoutUser = () => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userId');
        localStorage.removeItem('userName');
        localStorage.removeItem('userMileagePoints');
    }
};

export default api;
