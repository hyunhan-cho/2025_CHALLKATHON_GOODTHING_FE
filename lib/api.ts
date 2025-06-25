import axios from 'axios';

// 타입 정의
interface AuthResponse {
    access?: string;
    key?: string;
    refresh?: string;
}

interface RefreshTokenResponse {
    access: string;
    refresh?: string;
}

// 환경 변수에서 API 기본 URL을 가져옵니다. .env.local 파일에 설정해야 합니다.
// 예: NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
    console.error('NEXT_PUBLIC_API_BASE_URL 환경 변수가 설정되지 않았습니다. .env.local 파일을 확인해주세요.');
}

// 모든 API 요청의 기본 설정을 담은 axios 인스턴스 생성
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 모든 요청에 인증 토큰을 추가하는 인터셉터
api.interceptors.request.use(
    (config) => {
        // 브라우저 환경에서만 localStorage 접근 (SSR 오류 방지)
        if (typeof window !== 'undefined') {
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

// 토큰 갱신 중인지 추적하는 변수
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) {
            reject(error);
        } else {
            resolve(token);
        }
    });
    failedQueue = [];
};

// 토큰 갱신 함수
const refreshToken = async (): Promise<RefreshTokenResponse> => {
    const refresh = localStorage.getItem('refreshToken');
    if (!refresh) {
        throw new Error('No refresh token available');
    }
    
    const response = await axios.post<RefreshTokenResponse>(`${API_BASE_URL}/auth/token/refresh/`, {
        refresh: refresh
    });
    
    return response.data;
};

// 모든 응답 에러를 한 곳에서 처리하는 인터셉터
api.interceptors.response.use(
    (response) => response, // 성공한 응답은 그대로 반환
    async (error) => {
        const originalRequest = error.config;
        
        // 401 에러이고 아직 재시도하지 않은 요청인 경우
        if (error.response?.status === 401 && !originalRequest._retry && typeof window !== 'undefined') {
            if (isRefreshing) {
                // 이미 토큰 갱신 중이면 대기열에 추가
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    if (originalRequest.headers) {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                    }
                    return api(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshResponse = await refreshToken();
                const newAccessToken = refreshResponse.access;
                
                // 새 토큰 저장
                localStorage.setItem('authToken', newAccessToken);
                if (refreshResponse.refresh) {
                    localStorage.setItem('refreshToken', refreshResponse.refresh);
                }
                
                // 대기 중인 요청들 처리
                processQueue(null, newAccessToken);
                
                // 원래 요청 재시도
                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                }
                return api(originalRequest);
                
            } catch (refreshError) {
                // 토큰 갱신 실패 시 로그아웃 처리
                processQueue(refreshError, null);
                localStorage.removeItem('authToken');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }
        
        // 네트워크 에러나 서버 에러를 일관되게 처리
        const errorMessage = error.response?.data?.detail || error.message || '알 수 없는 오류가 발생했습니다.';
        console.error('API Error:', errorMessage);
        return Promise.reject(error);
    }
);


// 모든 API 호출 함수에서 반복적인 try...catch 구문을 제거하고, 생성된 api 인스턴스를 사용합니다.

export const getKboTeams = async () => {
    const response = await api.get('kbo-teams/');
    return response.data;
};

export const registerUser = async (userData: any) => {
    const response = await api.post('auth/signup/', userData);
    return response.data;
};

export const loginUser = async (credentials: any) => {
    const response = await api.post<AuthResponse>('auth/login/', credentials);
    if (response.data) {
        const accessToken = response.data.access || response.data.key;
        if (accessToken && typeof window !== 'undefined') {
            localStorage.setItem('authToken', accessToken);
            if (response.data.refresh) {
                localStorage.setItem('refreshToken', response.data.refresh);
            }
        } else {
             throw new Error('로그인 응답에 인증 토큰이 없습니다.');
        }
    } else {
        throw new Error('로그인 응답 데이터가 비어 있습니다.');
    }
    return response.data;
};

export const getHelpRequests = async () => {
    const response = await api.get('help-requests/');
    return response.data;
};

export const getHelpRequestById = async (id: string) => {
    const response = await api.get(`requests/${id}/`);
    return response.data;
};

export const getHelperActivities = async () => {
    const response = await api.get('helper/activities/');
    return response.data;
};

export const getHelperStats = async () => {
    const response = await api.get('helper/stats/');
    return response.data;
};

export const getProposedTicketDetails = async (requestId: string) => {
    const response = await api.get(`senior/requests/${requestId}/proposed-ticket/`);
    return response.data;
};

export const confirmProposedTicket = async (requestId: string) => {
    const response = await api.post(`senior/requests/${requestId}/confirm-ticket/`);
    return response.data;
};

export const getSeniorReservationRequests = async () => {
    const response = await api.get('senior/requests/');
    return response.data;
};

export const createReservationRequest = async (payload: any) => {
    const response = await api.post('reservation-requests/', payload);
    return response.data;
};

export const getUserProfile = async () => {
    const response = await api.get('auth/user/');
    return response.data;
};

export const logoutUser = async () => {
    if (typeof window !== 'undefined') {
        localStorage.clear();
    }
};
