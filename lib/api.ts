import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
    console.error('NEXT_PUBLIC_API_BASE_URL 환경 변수가 설정되지 않았습니다. .env.local 파일을 확인해주세요.');
}

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
            if (!config.headers) {
                config.headers = {};
            }

            (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export interface HelpRequest {
    id: string;
    seniorFanName: string;
    teamName: string;
    gameDate: string;
    gameTime?: string;
    numberOfTickets: number;
    status: string;
    contactPreference?: 'phone' | 'chat';
    phoneNumber?: string;
    notes?: string;
}

export interface HelperActivity {
    id: string;
    seniorFanName: string;
    teamName: string;
    gameDate: string;
    status: 'COMPLETED' | 'IN_PROGRESS';
}

export interface HelperStats {
    totalSessionsCompleted: number;
    mileagePoints: number;
}

export interface ProposedTicketDetails {
    id: string;
    seniorFanName: string;
    teamName: string;
    matchDate: string;
    numberOfTickets: number;
    seatType: string;
    totalPrice: string;
    helperName: string;
}

export type RequestStatus =
    | 'WAITING_FOR_HELPER'
    | 'HELPER_MATCHED'
    | 'TICKET_PROPOSED'
    | 'SEAT_CONFIRMED'
    | 'COMPLETED'
    | 'CANCELLED';

export interface ReservationRequest {
    id: string;
    teamName: string;
    matchDate: string;
    numberOfTickets: number;
    status: RequestStatus;
    helperName?: string;
}

export interface CreateReservationRequestPayload {
    seniorId?: string;
    teamId: string;
    gameDate: string;
    numberOfTickets: number;
}

export interface KboTeam {
    id: string;
    name: string;
    shortName?: string;
    logoUrl?: string;
    homeStadium?: string;
}

/**
 * 도움 요청 목록을 백엔드에서 가져오는 함수 (helper/dashboard/page.tsx에서 사용)
 * @returns {Promise<HelpRequest[]>} 도움 요청 목록 배열
 */
export const getHelpRequests = async (): Promise<HelpRequest[]> => {
    try {
        const response = await api.get<HelpRequest[]>('/help-requests/');
        return response.data;
    } catch (error) {
        console.error('도움 요청 목록을 가져오는 데 실패했습니다:', error);
        throw error;
    }
};

/**
 * 특정 ID의 도움 요청 상세 정보를 백엔드에서 가져오는 함수 (helper/request/[requestId]/page.tsx에서 사용)
 * @param {string} id 가져올 도움 요청의 ID
 * @returns {Promise<HelpRequest>} 특정 ID의 도움 요청 상세 정보
 */
export const getHelpRequestById = async (id: string): Promise<HelpRequest> => {
    try {
        const response = await api.get<HelpRequest>(`/help-requests/${id}/`);
        return response.data;
    } catch (error) {
        console.error(`ID ${id}의 도움 요청을 가져오는 데 실패했습니다:`, error);
        throw error;
    }
};

/**
 * 현재 로그인한 헬퍼의 도움 활동 목록을 백엔드에서 가져오는 함수 (helper/my-page/page.tsx에서 사용)
 * @returns {Promise<HelperActivity[]>} 헬퍼 활동 목록 배열
 */
export const getHelperActivities = async (): Promise<HelperActivity[]> => {
    try {
        const response = await api.get<HelperActivity[]>('/helper/activities/');
        return response.data;
    } catch (error) {
        console.error('헬퍼 활동 목록을 가져오는 데 실패했습니다:', error);
        throw error;
    }
};

/**
 * 현재 로그인한 헬퍼의 요약 통계를 백엔드에서 가져오는 함수 (helper/my-page/page.tsx에서 사용)
 * @returns {Promise<HelperStats>} 헬퍼 요약 통계 객체
 */
export const getHelperStats = async (): Promise<HelperStats> => {
    try {
        const response = await api.get<HelperStats>('/helper/stats/');
        return response.data;
    } catch (error) {
        console.error('헬퍼 요약 통계를 가져오는 데 실패했습니다:', error);
        throw error;
    }
};

/**
 * 특정 요청에 대해 헬퍼가 제안한 티켓 상세 정보를 가져오는 함수 (senior/confirmation/page.tsx에서 사용)
 * @param {string} requestId 도움 요청 ID
 * @returns {Promise<ProposedTicketDetails>} 제안된 티켓 상세 정보
 */
export const getProposedTicketDetails = async (requestId: string): Promise<ProposedTicketDetails> => {
    try {
        const response = await api.get<ProposedTicketDetails>(`/senior/requests/${requestId}/proposed-ticket/`);
        return response.data;
    } catch (error) {
        console.error(`요청 ID ${requestId}의 제안된 티켓 정보를 가져오는 데 실패했습니다:`, error);
        throw error;
    }
};

/**
 * 시니어 팬이 제안된 티켓을 확정하는 함수 (senior/confirmation/page.tsx에서 사용)
 * @param {string} requestId 확정할 도움 요청 ID
 * @returns {Promise<any>} 확정 결과
 */
export const confirmProposedTicket = async (requestId: string): Promise<any> => {
    try {
        const response = await api.post(`/senior/requests/${requestId}/confirm-ticket/`);
        return response.data;
    } catch (error) {
        console.error(`요청 ID ${requestId}의 티켓 확정에 실패했습니다:`, error);
        throw error;
    }
};

/**
 * 현재 로그인한 시니어 팬의 모든 예매 요청 목록을 백엔드에서 가져오는 함수 (senior/my-page/page.tsx에서 사용)
 * @returns {Promise<ReservationRequest[]>} 시니어 팬의 예매 요청 목록 배열
 */
export const getSeniorReservationRequests = async (): Promise<ReservationRequest[]> => {
    try {
        const response = await api.get<ReservationRequest[]>('/senior/requests/');
        return response.data;
    } catch (error) {
        console.error('시니어 예매 요청 목록을 가져오는 데 실패했습니다:', error);
        throw error;
    }
};

/**
 * 새로운 예매 요청을 백엔드에 생성하는 함수 (senior/select-date/page.tsx에서 사용)
 * @param {CreateReservationRequestPayload} payload 생성할 요청 데이터
 * @returns {Promise<ReservationRequest>} 생성된 예매 요청 객체 (백엔드 응답)
 */
export const createReservationRequest = async (
    payload: CreateReservationRequestPayload
): Promise<ReservationRequest> => {
    try {
        const response = await api.post<ReservationRequest>('/reservation-requests/', payload);
        return response.data;
    } catch (error) {
        console.error('예매 요청 생성에 실패했습니다:', error);
        throw error;
    }
};

/**
 * KBO 전체 팀 목록을 백엔드에서 가져오는 함수 (components/kbo-teams.ts (useKboTeams)에서 사용)
 * @returns {Promise<KboTeam[]>} KBO 팀 목록 배열
 */
export const getKboTeams = async (): Promise<KboTeam[]> => {
    try {
        const response = await api.get<KboTeam[]>('/kbo-teams/');
        return response.data;
    } catch (error) {
        console.error('KBO 팀 목록을 가져오는 데 실패했습니다:', error);
        throw error;
    }
};

interface LoginResponseData {
    access?: string;
    refresh?: string;
    key?: string;
}

// 회원가입
export const registerUser = async (userData: any) => {
    try {
        const response = await api.post('/auth/registration/', userData);
        return response.data;
    } catch (error) {
        console.error('회원가입 실패:', error);
        throw error;
    }
};

export const loginUser = async (credentials: any) => {
    try {
        const response = await api.post<LoginResponseData>('/auth/login/', credentials);

        if (response.data) {
            if (response.data.access) {
                localStorage.setItem('authToken', response.data.access);
                if (response.data.refresh) {
                    localStorage.setItem('refreshToken', response.data.refresh);
                }
            } else if (response.data.key) {
                localStorage.setItem('authToken', response.data.key);
            }
        } else {
            throw new Error('로그인 응답 데이터가 비어 있습니다.');
        }
        return response.data;
    } catch (error) {
        console.error('로그인 실패:', error);
        throw error;
    }
};

export const logoutUser = async () => {
    try {
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userId');
        localStorage.removeItem('userName');
        localStorage.removeItem('userMileagePoints');
    } catch (error) {
        console.error('로그아웃 실패:', error);
        throw error;
    }
};

export const getUserProfile = async () => {
    try {
        const response = await api.get('/auth/user/');
        return response.data;
    } catch (error) {
        console.error('사용자 프로필을 가져오는 데 실패했습니다:', error);
        throw error;
    }
};
