import React, { useEffect, useState, useRef } from 'react';

import './DailyPage.css';
import { format, parseISO, addDays } from 'date-fns';

import Card from '../components/Card';
import Footer from '../components/Footer';
import Header from '../components/Header';
import SubscribeCTAAlert from '../components/SubscribeCTAAlert';
import SubscriptionModal from '../components/SubscriptionModal';

import { API_BASE_URL } from '@/constants/env-file';

interface SentenceData {
	date: string;
	sentence: string;
	meaning: string;
	vocab: { word: string; definition: string }[];
	videoUrl: string;
}

const CTA_STORAGE_KEY = 'hideSubscribeCTAUntil';

const DailyPage: React.FC = () => {
	const [currentData, setCurrentData] = useState<SentenceData | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);
	const [currentDate, setCurrentDate] = useState<string>('');
	const [canNavigatePrev, setCanNavigatePrev] = useState<boolean>(true);
	const [canNavigateNext, setCanNavigateNext] = useState<boolean>(false);
	const [cardClassName, setCardClassName] = useState<string>(
		'carousel-card current-card',
	);
	const [showCTA, setShowCTA] = useState(false);
	const [showSubscribeModal, setShowSubscribeModal] = useState(false);
	const [subscribeEmail, setSubscribeEmail] = useState('');
	const [subscribeStatus, setSubscribeStatus] = useState<
		'idle' | 'submitting' | 'success' | 'error'
	>('idle');
	const [subscribeError, setSubscribeError] = useState('');

	const containerRef = useRef<HTMLDivElement>(null);
	const lastTouchY = useRef<number | null>(null);
	const lastWheelTime = useRef<number>(0);
	const lastTouchTime = useRef<number>(0);
	const isAnimating = useRef<boolean>(false);
	const currentDateRef = useRef<string>('');
	let scrollBlockTimer: NodeJS.Timeout | null = null;

	const scrollHandlersRef = useRef<{ cleanup?: () => void }>({});

	const blockFurtherScroll = () => {
		if (scrollBlockTimer) clearTimeout(scrollBlockTimer);
		isAnimating.current = true;
		scrollBlockTimer = setTimeout(() => {
			isAnimating.current = false;
		}, 600);
	};

	const getTodayDate = (): string => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		return format(today, 'yyyy-MM-dd');
	};

	const isFutureDate = (dateString: string): boolean => {
		const today = getTodayDate();
		return dateString > today;
	};

	const getAdjacentDate = (
		direction: 'prev' | 'next',
		baseDate: string = currentDate,
	): string => {
		if (!baseDate) return getTodayDate();
		try {
			const baseDateObj = parseISO(baseDate);
			if (isNaN(baseDateObj.getTime())) return getTodayDate();
			const newDate =
				direction === 'prev'
					? addDays(baseDateObj, -1)
					: addDays(baseDateObj, 1);
			return format(newDate, 'yyyy-MM-dd');
		} catch {
			return getTodayDate();
		}
	};

	const fetchData = async (date: string) => {
		try {
			setIsLoading(true);
			const response = await fetch(`${API_BASE_URL}/sentences/days/${date}`, {
				credentials: 'include',
			});
			if (!response.ok) throw new Error('Fetch failed');
			const data = await response.json();
			if (data && data.success && data.data) {
				return data.data;
			}
			throw new Error('Invalid response');
		} catch (err) {
			setError('데이터를 불러올 수 없습니다.');
			return null;
		} finally {
			setIsLoading(false);
		}
	};

	const getCardClass = (): string => cardClassName;

	const handlePrevCard = async () => {
		if (isAnimating.current || !canNavigatePrev) return;
		blockFurtherScroll();

		const prevDate = getAdjacentDate('prev', currentDateRef.current);
		setCardClassName('carousel-card card-moving-down');

		const prevData = await fetchData(prevDate);
		if (!prevData) {
			setCardClassName('carousel-card current-card');
			return;
		}

		setTimeout(() => {
			currentDateRef.current = prevDate;
			setCurrentDate(prevDate);
			setCurrentData(prevData);
			setCanNavigateNext(true);
			setCardClassName('carousel-card card-becoming-current-from-top');

			setTimeout(() => {
				setCardClassName('carousel-card current-card');
			}, 500);
		}, 500);
	};

	const handleNextCard = async () => {
		if (isAnimating.current || !canNavigateNext) return;

		const nextDate = getAdjacentDate('next', currentDateRef.current);
		if (isFutureDate(nextDate)) {
			return;
		}

		blockFurtherScroll();
		setCardClassName('carousel-card card-moving-up');

		const nextData = await fetchData(nextDate);
		if (!nextData) {
			setCardClassName('carousel-card current-card');
			return;
		}

		setTimeout(() => {
			currentDateRef.current = nextDate;
			setCurrentDate(nextDate);
			setCurrentData(nextData);
			const potentialNextDate = getAdjacentDate('next', nextDate);
			setCanNavigateNext(!isFutureDate(potentialNextDate));
			setCardClassName('carousel-card card-becoming-current-from-bottom');

			setTimeout(() => {
				setCardClassName('carousel-card current-card');
			}, 500);
		}, 500);
	};

	const onTouchStart = (e: React.TouchEvent) => {
		lastTouchY.current = e.touches[0].clientY;
		lastTouchTime.current = Date.now();
	};

	const onTouchEnd = (e: React.TouchEvent) => {
		if (!lastTouchY.current || isAnimating.current) return;
		const diffY = e.changedTouches[0].clientY - lastTouchY.current;
		if (Math.abs(diffY) < 50) return;

		if (diffY > 0 && canNavigatePrev) {
			handlePrevCard();
		} else if (diffY < 0 && canNavigateNext) {
			const nextDate = getAdjacentDate('next', currentDateRef.current);
			if (!isFutureDate(nextDate)) {
				handleNextCard();
			}
		}
		lastTouchY.current = null;
	};

	const handleWheel = (e: WheelEvent) => {
		if (isAnimating.current) return;
		const now = Date.now();
		if (now - lastWheelTime.current < 500) return;
		lastWheelTime.current = now;

		if (e.deltaY < 0 && canNavigatePrev) {
			handlePrevCard();
		} else if (e.deltaY > 0 && canNavigateNext) {
			const nextDate = getAdjacentDate('next', currentDateRef.current);
			if (!isFutureDate(nextDate)) {
				handleNextCard();
			}
		}
	};

	useEffect(() => {
		const today = getTodayDate();
		currentDateRef.current = today;
		setCurrentDate(today);
		fetchData(today).then((data) => {
			if (data) {
				setCurrentData(data);
				setCanNavigatePrev(true);
				const potentialNextDate = getAdjacentDate('next', today);
				setCanNavigateNext(!isFutureDate(potentialNextDate));
			}
			setIsLoading(false);
		});
	}, []);

	useEffect(() => {
		const currentContainer = containerRef.current;
		if (currentContainer) {
			currentContainer.addEventListener('wheel', handleWheel, {
				passive: false,
			});
		}
		return () => {
			if (currentContainer) {
				currentContainer.removeEventListener('wheel', handleWheel);
			}
		};
	}, [canNavigatePrev, canNavigateNext, currentDate]);

	useEffect(() => {
		if (currentDate) {
			currentDateRef.current = currentDate;
		}
	}, [currentDate]);

	useEffect(() => {
		const hideUntil = localStorage.getItem(CTA_STORAGE_KEY);
		if (!hideUntil || new Date(hideUntil) < new Date()) {
			const showCTAIfAllowed = () => {
				setShowCTA(true);
			};

			const onWheel = () => {
				showCTAIfAllowed();
			};

			const onTouchEnd = () => {
				showCTAIfAllowed();
			};

			window.addEventListener('wheel', onWheel);
			window.addEventListener('touchend', onTouchEnd);

			scrollHandlersRef.current.cleanup = () => {
				window.removeEventListener('wheel', onWheel);
				window.removeEventListener('touchend', onTouchEnd);
			};

			return scrollHandlersRef.current.cleanup;
		}
	}, []);

	const handleCTAClose = () => {
		const nextShow = new Date();
		nextShow.setDate(nextShow.getDate() + 7); // 7일 후
		localStorage.setItem(CTA_STORAGE_KEY, nextShow.toISOString());
		setShowCTA(false);
		if (scrollHandlersRef.current.cleanup) {
			scrollHandlersRef.current.cleanup();
			scrollHandlersRef.current.cleanup = undefined;
		}
	};

	const handleCTASubscribe = () => {
		setShowCTA(false);
		setShowSubscribeModal(true);
	};

	const handleSubscribeModalClose = () => {
		setShowSubscribeModal(false);
		setSubscribeEmail('');
		setSubscribeStatus('idle');
		setSubscribeError('');
	};

	const handleSubscribeEmailChange = (
		e: React.ChangeEvent<HTMLInputElement>,
	) => {
		setSubscribeEmail(e.target.value);
		setSubscribeError('');
	};

	const validateEmail = (email: string): boolean => {
		const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return re.test(email);
	};

	const handleSubmitSubscription = async () => {
		if (!validateEmail(subscribeEmail)) {
			setSubscribeError('이메일 형식이 올바르지 않습니다.');
			return;
		}
		setSubscribeStatus('submitting');
		try {
			const response = await fetch(
				`${API_BASE_URL}/subscribers/${encodeURIComponent(subscribeEmail)}`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					credentials: 'include',
				},
			);
			if (response.status === 409) {
				setSubscribeStatus('error');
				setSubscribeError('이미 구독자입니다.');
				return;
			}
			if (response.status === 400) {
				setSubscribeStatus('error');
				setSubscribeError('이메일 형식이 올바르지 않습니다.');
				return;
			}
			if (!response.ok) {
				throw new Error('Subscription failed');
			}
			setSubscribeStatus('success');
			setTimeout(() => {
				handleSubscribeModalClose();
			}, 2000);
		} catch (error) {
			console.error('구독 요청 실패:', error);
			setSubscribeStatus('error');
			setSubscribeError('구독 요청이 실패했습니다. 다시 시도해주세요.');
		}
	};

	return (
		<>
			{showCTA && (
				<SubscribeCTAAlert
					onSubscribe={handleCTASubscribe}
					onClose={handleCTAClose}
				/>
			)}
			<SubscriptionModal
				isOpen={showSubscribeModal}
				email={subscribeEmail}
				status={subscribeStatus}
				errorMessage={subscribeError}
				onEmailChange={handleSubscribeEmailChange}
				onSubmit={handleSubmitSubscription}
				onClose={handleSubscribeModalClose}
			/>
			<div className="page-container">
				<Header />
				<div className="main-content">
					<div
						className="card-carousel"
						ref={containerRef}
						onTouchStart={onTouchStart}
						onTouchEnd={onTouchEnd}
					>
						{currentData && (
							<div className={getCardClass()}>
								<div
									className={`scroll-indicator scroll-up ${!canNavigatePrev ? 'disabled' : ''}`}
									onClick={canNavigatePrev ? handlePrevCard : undefined}
								></div>
								<Card {...currentData} />
								<div
									className={`scroll-indicator scroll-down ${!canNavigateNext ? 'disabled' : ''}`}
									onClick={
										canNavigateNext
											? () => {
													const nextDate = getAdjacentDate(
														'next',
														currentDateRef.current,
													);
													if (!isFutureDate(nextDate)) {
														handleNextCard();
													}
												}
											: undefined
									}
								></div>
							</div>
						)}
						{isLoading && <div className="loading">Loading...</div>}
						{error && <div className="error">{error}</div>}
					</div>
				</div>
				<Footer />
			</div>
		</>
	);
};

export default DailyPage;
