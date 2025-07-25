import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

export interface KboTeam {
    id: string;
    name: string;
    shortName?: string;
    logoUrl?: string;
    homeStadium?: string;
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
    status: 'REQUESTED' | 'IN_PROGRESS' | 'TICKET_PROPOSED' | 'SEAT_CONFIRMED' | 'COMPLETED' | 'CANCELLED';
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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/';

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
        if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
            const token = localStorage.getItem('authToken');
            if (token && config.headers) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

let isRefreshing = false;
let failedQueue: Array<{ resolve: (value: string | PromiseLike<string>) => void; reject: (reason?: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) {
            reject(error);
        } else {
            if (token) {
                resolve(token);
            } else {
                reject(new Error('No token provided in processQueue'));
            }
        }
    });
    failedQueue = [];
};

const refreshAccessToken = async (): Promise<{ access: string; refresh?: string }> => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
        throw new Error('No refresh token available');
    }

    const response = await axios.post<{ access: string; refresh: string }>(`${API_BASE_URL}auth/token/refresh/`, {
        refresh: refreshToken,
    });

    return response.data;
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry && typeof window !== 'undefined') {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        if (originalRequest.headers) {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                        }
                        return api(originalRequest);
                    })
                    .catch((err) => {
                        return Promise.reject(err);
                    });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshResponse = await refreshAccessToken();
                const newAccessToken = refreshResponse.access;

                localStorage.setItem('authToken', newAccessToken);
                if (refreshResponse.refresh) {
                    localStorage.setItem('refreshToken', refreshResponse.refresh);
                }

                processQueue(null, newAccessToken);

                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                }
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('refreshToken');
                    window.location.href = '/login';
                }
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        const errorMessage = error.response?.data?.detail || error.message || '알 수 없는 오류가 발생했습니다.';
        console.error('API Error:', errorMessage, error.response?.data);
        return Promise.reject(error);
    }
);

// 3.1 인증 (Auth)

/**
 * 사용자 회원가입 (POST /auth/signup/)
 * @param userData - { name, phone, role, password, nickname, favorite_team? }
 * @returns {Promise<{name: string; phone: string; role: string;}>}
 */
export const registerUser = async (userData: {
    name: string;
    phone: string;
    role: 'senior' | 'helper';
    password: string;
    nickname: string;
    favorite_team?: string;
}) => {
    const response = await api.post('auth/signup/', userData);
    return response.data;
};

/**
 * 사용자 로그인 (POST /auth/login/)
 * @param credentials - { phone, password }
 * @returns {Promise<{access: string; refresh: string;}>}
 */
export const loginUser = async (credentials: {
    phone: string;
    password: string;
}): Promise<{ access: string; refresh: string }> => {
    const response = await api.post<{ access: string; refresh: string }>('auth/login/', credentials);

    if (response.data.access) {
        localStorage.setItem('authToken', response.data.access);
    } else {
        throw new Error('로그인 응답에 Access Token이 없습니다.');
    }
    if (response.data.refresh) {
        localStorage.setItem('refreshToken', response.data.refresh);
    } else {
        console.warn('Refresh token is missing in login response. This might affect session persistence.');
    }

    return response.data;
};

// 3.2 사용자 (User)

/**
 * 내 정보 조회 (GET /users/me/)
 * @returns {Promise<any>}
 */
export const getUserProfile = async () => {
    const response = await api.get('users/me/');
    return response.data;
};

/**
 * 내 정보 수정 (PUT/PATCH /users/me/)
 * @param userData - 수정할 사용자 정보 (name, profile:{nickname, favorite_team, verification_info})
 * @returns {Promise<any>} 수정된 UserProfileSerializer 형식의 사용자 정보
 */
export const updateUserProfile = async (userData: any) => {
    // TODO: UserProfileSerializer 타입 정의 필요
    // 명세서: PUT/PATCH /api/users/me/
    const response = await api.patch('users/me/', userData); // 부분 수정이므로 PATCH 사용
    return response.data;
};

// 3.3 팀 및 경기 정보

/**
 * KBO 전체 팀 목록 조회 (GET /teams/)
 * @returns {Promise<KboTeam[]>} 팀 목록
 */
export const getKboTeams = async (): Promise<KboTeam[]> => {
    // 명세서: GET /api/teams/
    const response = await api.get<KboTeam[]>('teams/'); // 올바른 엔드포인트 사용
    return response.data;
};

/**
 * 경기 일정 조회 (GET /games/)
 * @param params - { date?: string; team?: string; }
 * @returns {Promise<any[]>} 경기 목록 (GameSerializer)
 */
export const getGames = async (params?: { date?: string; team?: string }) => {
    // 명세서: GET /api/games/
    const response = await api.get('games/', { params });
    return response.data;
};

// 3.4 도움 요청 (Request)

/**
 * 도움 요청 생성 (POST /reservation-requests/)
 * @param payload - { seniorId, teamId, gameDate, numberOfTickets }
 * @returns {Promise<any>} 생성된 Request 객체
 */
export const createHelpRequest = async (payload: {
    seniorId: string; // seniorId 추가
    teamId: string; // teamId는 문자열로 가정 (API 명세 확인 필요)
    gameDate: string;
    numberOfTickets: number;
    // accompanyType, additionalInfo는 백엔드 명세에 따라 제거 또는 추가
}) => {
    // 명세서: POST /api/reservation-requests/ (URL 변경)
    // 필드도 백엔드 API 명세에 맞춰서 수정했습니다.
    const response = await api.post('reservation-requests/', payload);
    return response.data;
};

/**
 * 도우미용 도움 요청 목록 조회 (GET /requests/) - pending 상태의 모든 요청
 * (API 명세서에 help-requests/로 되어 있어 해당 엔드포인트 사용)
 * @param params - { gameDate?, team?, stadium?, accompanyType? }
 * @returns {Promise<HelpRequest[]>} Request 객체 리스트
 */
export const getHelpRequests = async (params?: any): Promise<HelpRequest[]> => {
    // 명세서: GET /api/help-requests/ (도우미 권한)
    const response = await api.get<HelpRequest[]>('help-requests/', { params });
    return response.data;
};

/**
 * 도움 요청 상세 조회 (GET /requests/{requestId}/)
 * (API 명세서에 requests/{requestId}/로 되어 있어 해당 엔드포인트 사용)
 * @param requestId
 * @returns {Promise<HelpRequest>} Request 객체
 */
export const getHelpRequestDetails = async (requestId: string): Promise<HelpRequest> => {
    // 명세서: GET /api/requests/{requestId}/
    const response = await api.get<HelpRequest>(`requests/${requestId}/`);
    return response.data;
};

/**
 * 요청 매칭 완료 처리 (POST /requests/{requestId}/complete/)
 * @param requestId
 * @returns {Promise<any>}
 */
export const completeHelpRequest = async (requestId: string) => {
    // 명세서: POST /api/requests/{requestId}/complete/
    const response = await api.post(`requests/${requestId}/complete/`);
    return response.data;
};

// 3.5 제안 (Proposal)

/**
 * 제안 생성 (POST /requests/{requestId}/proposals/create/)
 * @param requestId
 * @param payload - { ticketInfo, message }
 * @returns {Promise<any>} 생성된 Proposal 객체
 */
export const createProposal = async (requestId: string, payload: { ticketInfo: string; message: string }) => {
    // TODO: ProposalCreateSerializer 타입 정의 필요
    // 명세서: POST /api/requests/{requestId}/proposals/create/
    const response = await api.post(`requests/${requestId}/proposals/create/`, payload);
    return response.data;
};

/**
 * 시니어: 특정 요청의 제안 목록 조회 (GET /requests/{requestId}/proposals/)
 * @param requestId
 * @returns {Promise<any[]>} Proposal 객체 리스트
 */
export const getProposalsForRequest = async (requestId: string) => {
    // TODO: ProposalSerializer 타입 정의 필요
    // 명세서: GET /api/requests/{requestId}/proposals/
    const response = await api.get(`requests/${requestId}/proposals/`);
    return response.data;
};

/**
 * 제안 수락 (POST /proposals/{proposalId}/accept/)
 * @param proposalId
 * @returns {Promise<{message: string}>}
 */
export const acceptProposal = async (proposalId: string) => {
    // 명세서: POST /api/proposals/{proposalId}/accept/
    const response = await api.post(`proposals/${proposalId}/accept/`);
    return response.data;
};

/**
 * 제안 거절 (POST /proposals/{proposalId}/reject/)
 * @param proposalId
 * @returns {Promise<{message: string}>}
 */
export const rejectProposal = async (proposalId: string) => {
    // 명세서: POST /api/proposals/{proposalId}/reject/
    const response = await api.post(`proposals/${proposalId}/reject/`);
    return response.data;
};

// 3.6 마이페이지 (MyPage)

/**
 * 시니어: 내 도움 요청 목록 조회 (GET /senior/requests/)
 * (API 명세서에 mypage/requests/로 되어 있어 해당 엔드포인트 사용)
 * @returns {Promise<HelpRequest[]>} Request 객체 리스트
 */
export const getMySeniorRequests = async (): Promise<HelpRequest[]> => {
    // 명세서: GET /api/senior/requests/ (URL 변경)
    const response = await api.get<HelpRequest[]>('senior/requests/');
    return response.data;
};

/**
 * 헬퍼: 내 제안 목록 조회 (GET /mypage/proposals/)
 * @returns {Promise<any[]>} Proposal 객체 리스트 (MyPage Proposal Serializer)
 */
export const getMyHelperProposals = async () => {
    // TODO: MyPage Proposal Serializer 타입 정의 필요
    // 명세서: GET /api/mypage/proposals/
    const response = await api.get('mypage/proposals/');
    return response.data;
};

/**
 * 내 통계 정보 조회 (GET /mypage/stats/)
 * @returns {Promise<any>} 통계 정보
 */
export const getMyStats = async () => {
    // TODO: StatsSerializer 타입 정의 필요
    // 명세서: GET /api/mypage/stats/
    const response = await api.get('mypage/stats/');
    return response.data;
};

/**
 * 시니어: 제안된 티켓 상세 정보 조회 (GET /senior/requests/{requestId}/proposed-ticket/)
 * @param requestId
 * @returns {Promise<ProposedTicketDetails>} 제안된 티켓 정보
 */
export const getProposedTicketDetails = async (requestId: string): Promise<ProposedTicketDetails> => {
    const response = await api.get<ProposedTicketDetails>(`senior/requests/${requestId}/proposed-ticket/`);
    return response.data;
};

/**
 * 시니어: 제안된 티켓 확정 (POST /senior/requests/{requestId}/confirm-ticket/)
 * @param requestId
 * @returns {Promise<any>}
 */
export const confirmProposedTicket = async (requestId: string) => {
    const response = await api.post(`senior/requests/${requestId}/confirm-ticket/`);
    return response.data;
};

// 기타 편의 함수

/**
 * 로컬 스토리지에서 모든 인증 관련 정보 삭제 (로그아웃 처리)
 */
export const logoutUser = () => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userRole'); // 추가: userRole도 함께 삭제
        localStorage.removeItem('userId'); // 추가: userId도 함께 삭제
        localStorage.removeItem('userName'); // 추가: userName도 함께 삭제
        localStorage.removeItem('userMileagePoints'); // 추가: mileagePoints도 함께 삭제

        // 필요한 경우 로그인 페이지로 리디렉션
        // window.location.href = '/login'; // 페이지 리로드하면서 이동
    }
};

// ✅ 타입 먼저 정의
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

// ✅ 함수 정의
export const getHelperActivities = async (): Promise<HelperActivity[]> => {
    const response = await api.get('/helper/activities/');
    return response.data;
};

export const getHelperStats = async (): Promise<HelperStats> => {
    const response = await api.get('/mypage/stats/');
    return response.data;
};

export default api; // axios 인스턴스를 기본 내보내기로 설정
