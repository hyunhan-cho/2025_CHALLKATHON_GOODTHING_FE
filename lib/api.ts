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
  withCredentials: true, // 쿠키 전송
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

// 요청 인터셉터: 공개 API는 토큰 없이, 그 외엔 붙여주기
api.interceptors.request.use(
  (config) => {
    const publicPaths = ['/auth/login', '/auth/signup', '/teams', '/games'];

    // 공개 API 요청일 때는 헤더 그대로 반환 (토큰 제거)
    if (publicPaths.some((p) => config.url?.includes(p))) {
      return config;
    }

    // 보호된 API: 로컬스토리지 토큰이 유효하면 붙이기
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const decoded: { exp: number } = jwtDecode(token);
        if (decoded.exp * 1000 > Date.now()) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch {
        // invalid token
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 응답 인터셉터: 401일 때 refresh 로직 (공개 API 제외)
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    const publicPaths = ['/auth/login', '/auth/signup', '/teams', '/games'];

    if (publicPaths.some((p) => originalRequest.url?.includes(p))) {
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
  const res = await api.post('auth/signup/', userData);
  return res.data;
};

export const loginUser = async (creds: { phone: string; password: string }) => {
  const res = await api.post('auth/login/', creds, { withCredentials: true });
  if (res.data.access) localStorage.setItem('authToken', res.data.access);
  return res.data;
};

// 사용자
export const getUserProfile = async () => (await api.get('users/me/')).data;
export const updateUserProfile = async (ud: any) => (await api.patch('users/me/', ud)).data;

// 팀/게임
export const getKboTeams = async (): Promise<KboTeam[]> =>
  (await api.get<KboTeam[]>('teams/')).data.map((t) => ({ ...t, name: t.shortName }));
export const getGames = async (params?: any) => (await api.get('games/', { params })).data;

// 요청
export const createHelpRequest = async (p: any) => (await api.post('reservation-requests/', p)).data;
export const getHelpRequests = async (p?: any) => (await api.get<HelpRequest[]>('help-requests/', { params: p })).data;
export const getHelpRequestDetails = async (id: string) => (await api.get<RawHelpRequestResponse>(`requests/${id}/`)).data;
export const completeHelpRequest = async (id: string) => (await api.post(`requests/${id}/complete/`)).data;

// 제안
export const createProposal = async (rid: string, p: any) => (await api.post(`requests/${rid}/proposals/create/`, p)).data;
export const getProposalsForRequest = async (rid: string) => (await api.get(`requests/${rid}/proposals/`)).data;
export const acceptProposal = async (pid: string) => (await api.post(`proposals/${pid}/accept/`)).data;
export const rejectProposal = async (pid: string) => (await api.post(`proposals/${pid}/reject/`)).data;

// 마이페이지
export const getMySeniorRequests = async () => (await api.get('senior/requests/')).data;
export const getMyHelperProposals = async () => (await api.get('mypage/proposals/')).data;
export const getMyStats = async () => (await api.get('mypage/stats/')).data;

// 시니어 전용
export const getProposedTicketDetails = async (id: string) =>
  (await api.get<ProposedTicketDetails>(`senior/requests/${id}/proposed-ticket/`)).data;
export const confirmProposedTicket = async (id: string) =>
  (await api.post(`senior/requests/${id}/confirm-ticket/`)).data;

// 헬퍼 활동
export interface HelperActivity { id: string; seniorFanName: string; teamName: string; gameDate: string; status: 'COMPLETED' | 'IN_PROGRESS'; }
export const getHelperActivities = async (): Promise<HelperActivity[]> => (await api.get('/helper/activities/')).data;
export interface HelperStats { totalSessionsCompleted: number; mileagePoints: number; }
export const getHelperStats = async (): Promise<HelperStats> => (await api.get('/mypage/stats/')).data;

// 로그아웃
export const logoutUser = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userRole');
  localStorage.removeItem('userId');
  localStorage.removeItem('userName');
  localStorage.removeItem('userMileagePoints');
};

export default api;
