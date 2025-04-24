import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, useLocation } from 'react-router-dom';

import {
	init,
	Identify,
	identify,
	track,
	setUserId,
} from '@amplitude/analytics-browser';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import App from '@/App';

// window 타입 확장
declare global {
	interface Window {
		trackPageView?: () => void;
	}
}

// Amplitude 초기화 및 추가 설정
init(import.meta.env.VITE_AMPLITUDE_API_KEY, {
	autocapture: true,
	trackingOptions: {
		ipAddress: true,
		language: true,
		platform: true,
	},
});

// UTM 파라미터 추적 설정
function trackUTMParameters() {
	const urlParams = new URLSearchParams(window.location.search);

	// 추적할 UTM 파라미터 목록
	const utmParams = {
		utm_source: urlParams.get('utm_source'),
		utm_medium: urlParams.get('utm_medium'),
		utm_campaign: urlParams.get('utm_campaign'),
		utm_content: urlParams.get('utm_content'),
		utm_term: urlParams.get('utm_term'),
	};

	// 사용자 속성으로 UTM 파라미터 설정
	const userProps = new Identify();

	// 유효한 UTM 파라미터만 설정
	Object.entries(utmParams).forEach(([key, value]) => {
		if (value) {
			userProps.set(key, value);
		}
	});

	// 사용자 속성 업데이트
	identify(userProps);

	// 캠페인 유입 이벤트 추적 (UTM 파라미터가 하나라도 있는 경우)
	if (Object.values(utmParams).some((value) => value !== null)) {
		track('Campaign Visit', utmParams);
	}
}

// 이탈률 및 세션 추적 설정
function setupBounceTracking() {
	// 세션 시작 시간
	const sessionStartTime = Date.now();
	// 페이지 방문 카운트
	let pageViewCount = 0;
	// 최초 페이지 URL
	const entryPage = window.location.pathname;
	// 세션 ID 생성 (간단한 랜덤 ID)
	const sessionId = Math.random().toString(36).substring(2, 15);

	// 고유 사용자 ID가 없으면 생성 (로그인하지 않은 사용자용)
	const anonymousId =
		localStorage.getItem('anonymous_user_id') ||
		`anonymous_${Math.random().toString(36).substring(2, 15)}`;

	// 익명 사용자 ID 저장
	if (!localStorage.getItem('anonymous_user_id')) {
		localStorage.setItem('anonymous_user_id', anonymousId);
	}

	// 익명 사용자 ID를 Amplitude에 설정
	setUserId(anonymousId);

	// 세션 시작 이벤트 기록
	track('Session Start', {
		session_id: sessionId,
		entry_page: entryPage,
	});

	// 페이지 뷰 추적
	const trackPageView = () => {
		pageViewCount++;
		track('Page View', {
			session_id: sessionId,
			page: window.location.pathname,
			page_view_count: pageViewCount,
		});
	};

	// 첫 페이지 뷰 추적
	trackPageView();

	// 페이지 떠날 때 이탈률 및 체류 시간 추적
	window.addEventListener('beforeunload', () => {
		const sessionDuration = Math.round((Date.now() - sessionStartTime) / 1000);
		const isBounce = pageViewCount === 1;

		track('Session End', {
			session_id: sessionId,
			session_duration_seconds: sessionDuration,
			is_bounce: isBounce,
			page_view_count: pageViewCount,
			exit_page: window.location.pathname,
		});
	});

	// 내부 페이지 이동 추적을 위한 컴포넌트
	window.trackPageView = trackPageView;
}

// 페이지 로드 시 추적 설정
trackUTMParameters();
setupBounceTracking();

// 라우트 변경을 감지하여 페이지 뷰 트래킹
const RouteTracker = () => {
	const location = useLocation();

	useEffect(() => {
		// 페이지 변경 시마다 페이지 뷰 추적
		if (window.trackPageView) {
			window.trackPageView();
		}
	}, [location]);

	return null;
};

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 5,
			refetchOnWindowFocus: false,
		},
	},
});

ReactDOM.createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		<QueryClientProvider client={queryClient}>
			<BrowserRouter>
				<RouteTracker />
				<App />
			</BrowserRouter>
		</QueryClientProvider>
	</React.StrictMode>,
);
