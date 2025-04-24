import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import Card, { CardProps } from '../components/Card';
import Footer from '../components/Footer';
import Header from '../components/Header';

import './DailyPage.css';

const getAdjacentDate = (date: string, days: number): string => {
	const currentDate = new Date(date);
	currentDate.setDate(currentDate.getDate() + days);
	return currentDate.toLocaleDateString('sv-SE');
};

const fetchSentenceByDate = async (date: string): Promise<CardProps | null> => {
	try {
		const res = await fetch(`/api/sentences/days/${date}`);
		if (!res.ok) {
			console.log(`${date} 데이터 없음: ${res.status}`);
			return null;
		}
		return await res.json();
	} catch (error) {
		console.error(`${date} 데이터 가져오기 실패:`, error);
		return null;
	}
};

const DailyPage: React.FC = () => {
	const today = new Date().toLocaleDateString('sv-SE');
	const [searchParams] = useSearchParams();
	// Check if date parameter exists in the URL
	const dateParam = searchParams.get('date');
	const [currentDate, setCurrentDate] = useState<string>(dateParam || today);

	const queryClient = useQueryClient();
	const carouselRef = useRef<HTMLDivElement>(null);
	const [isScrolling, setIsScrolling] = useState(false);
	const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
	const [prevDirection, setPrevDirection] = useState<'up' | 'down' | null>(
		null,
	);
	const [isAnimating, setIsAnimating] = useState(false);
	const [transitionState, setTransitionState] = useState<{
		current: string;
		prev: string;
		next: string;
	}>({
		current: 'current-card',
		prev: 'previous-card',
		next: 'next-card',
	});

	const prevDate = getAdjacentDate(currentDate, -1);
	const nextDate = getAdjacentDate(currentDate, 1);
	const prevTwoDaysDate = getAdjacentDate(currentDate, -2);
	const nextTwoDaysDate = getAdjacentDate(currentDate, 2);

	// Update current date when URL parameter changes
	useEffect(() => {
		if (dateParam) {
			setCurrentDate(dateParam);
		}
	}, [dateParam]);

	// Pre-fetch several past and future days on initial load
	useEffect(() => {
		const fetchAdjacentDays = async () => {
			const date = currentDate;
			// Prefetch 10 days before today
			for (let i = 1; i <= 10; i++) {
				const pastDate = getAdjacentDate(date, -i);
				queryClient.prefetchQuery({
					queryKey: ['sentence', pastDate],
					queryFn: () => fetchSentenceByDate(pastDate),
				});
			}

			// Prefetch 3 days after today (if they exist)
			for (let i = 1; i <= 3; i++) {
				const futureDate = getAdjacentDate(date, i);
				queryClient.prefetchQuery({
					queryKey: ['sentence', futureDate],
					queryFn: () => fetchSentenceByDate(futureDate),
				});
			}
		};

		fetchAdjacentDays();
	}, [queryClient, currentDate]);

	// Load current and adjacent cards
	const { data: currentData, isLoading: isCurrentLoading } = useQuery({
		queryKey: ['sentence', currentDate],
		queryFn: () => fetchSentenceByDate(currentDate),
	});

	const { data: prevData } = useQuery({
		queryKey: ['sentence', prevDate],
		queryFn: () => fetchSentenceByDate(prevDate),
	});

	const { data: nextData } = useQuery({
		queryKey: ['sentence', nextDate],
		queryFn: () => fetchSentenceByDate(nextDate),
	});

	// Prefetch two days away in both directions
	useQuery({
		queryKey: ['sentence', prevTwoDaysDate],
		queryFn: () => fetchSentenceByDate(prevTwoDaysDate),
		enabled: !!prevData,
	});

	useQuery({
		queryKey: ['sentence', nextTwoDaysDate],
		queryFn: () => fetchSentenceByDate(nextTwoDaysDate),
		enabled: !!nextData,
	});

	const prefetchAdjacentData = (date: string) => {
		queryClient.prefetchQuery({
			queryKey: ['sentence', date],
			queryFn: () => fetchSentenceByDate(date),
		});
	};

	const handlePrevCard = () => {
		if (prevData && !isScrolling && !isAnimating) {
			setIsScrolling(true);
			setIsAnimating(true);
			setPrevDirection('up');

			// Set animation classes for the transition
			setTransitionState({
				current: 'card-moving-down',
				prev: 'card-becoming-current-from-top',
				next: 'next-card',
			});

			// Allow animation to start before changing data
			setTimeout(() => {
				setCurrentDate(prevDate);
				prefetchAdjacentData(getAdjacentDate(prevDate, -1));

				// Reset animation classes after transition
				setTimeout(() => {
					setTransitionState({
						current: 'current-card',
						prev: 'previous-card',
						next: 'next-card',
					});
					setIsAnimating(false);
					setPrevDirection(null);
				}, 700); // Match CSS transition duration

				if (scrollTimeout.current) {
					clearTimeout(scrollTimeout.current);
				}
				scrollTimeout.current = setTimeout(() => {
					setIsScrolling(false);
				}, 900); // Slightly longer to ensure everything completes
			}, 50);
		}
	};

	const handleNextCard = () => {
		if (nextData && !isScrolling && !isAnimating) {
			setIsScrolling(true);
			setIsAnimating(true);
			setPrevDirection('down');

			// Set animation classes for the transition
			setTransitionState({
				current: 'card-moving-up',
				prev: 'previous-card',
				next: 'card-becoming-current-from-bottom',
			});

			// Allow animation to start before changing data
			setTimeout(() => {
				setCurrentDate(nextDate);
				prefetchAdjacentData(getAdjacentDate(nextDate, 1));

				// Reset animation classes after transition
				setTimeout(() => {
					setTransitionState({
						current: 'current-card',
						prev: 'previous-card',
						next: 'next-card',
					});
					setIsAnimating(false);
					setPrevDirection(null);
				}, 700); // Match CSS transition duration

				if (scrollTimeout.current) {
					clearTimeout(scrollTimeout.current);
				}
				scrollTimeout.current = setTimeout(() => {
					setIsScrolling(false);
				}, 900); // Slightly longer to ensure everything completes
			}, 50);
		}
	};

	// Touch handling for swipe
	const [touchStart, setTouchStart] = useState<number | null>(null);
	const [touchEnd, setTouchEnd] = useState<number | null>(null);
	const minSwipeDistance = 40; // Reduced for better sensitivity

	const onTouchStart = (e: React.TouchEvent) => {
		setTouchEnd(null);
		setTouchStart(e.targetTouches[0].clientY);
	};

	const onTouchMove = (e: React.TouchEvent) => {
		setTouchEnd(e.targetTouches[0].clientY);
	};

	const onTouchEnd = () => {
		if (!touchStart || !touchEnd) return;

		const distance = touchStart - touchEnd;
		const isSwipeDown = distance < -minSwipeDistance;
		const isSwipeUp = distance > minSwipeDistance;

		console.log('Swipe distance:', distance);

		if (isSwipeDown) {
			console.log('Swiped down, going to previous card');
			handlePrevCard();
		} else if (isSwipeUp) {
			console.log('Swiped up, going to next card');
			handleNextCard();
		}
	};

	// Handle mouse wheel scrolling
	const handleWheel = (e: React.WheelEvent) => {
		// Prevent default to avoid scrolling the page
		e.preventDefault();

		if (isScrolling || isAnimating) return;

		// Check for scroll direction
		if (e.deltaY < 0) {
			// Scrolling up - show previous card
			console.log('Scrolling up, going to previous card');
			handlePrevCard();
		} else if (e.deltaY > 0) {
			// Scrolling down - show next card
			console.log('Scrolling down, going to next card');
			handleNextCard();
		}
	};

	// Get appropriate class for previous card
	const getPrevCardClass = () => {
		const baseClass = 'carousel-card';
		if (isAnimating && prevDirection === 'up') {
			return `${baseClass} ${transitionState.prev}`;
		}
		if (isAnimating && prevDirection === 'down') {
			return `${baseClass} card-entering-prev`;
		}
		return `${baseClass} previous-card`;
	};

	// Get appropriate class for next card
	const getNextCardClass = () => {
		const baseClass = 'carousel-card';
		if (isAnimating && prevDirection === 'down') {
			return `${baseClass} ${transitionState.next}`;
		}
		if (isAnimating && prevDirection === 'up') {
			return `${baseClass} card-entering-next`;
		}
		return `${baseClass} next-card`;
	};

	// Get appropriate class for current card
	const getCurrentCardClass = () => {
		const baseClass = 'carousel-card';
		if (isAnimating) {
			return `${baseClass} ${transitionState.current}`;
		}
		return `${baseClass} current-card`;
	};

	return (
		<div className="app">
			<Header />
			<main className="main-content">
				{isCurrentLoading ? (
					<p>로딩 중...</p>
				) : (
					<div
						className="card-carousel"
						ref={carouselRef}
						onTouchStart={onTouchStart}
						onTouchMove={onTouchMove}
						onTouchEnd={onTouchEnd}
						onWheel={handleWheel}
					>
						{prevData && (
							<div className={getPrevCardClass()}>
								<Card
									date={prevData.date}
									sentence={prevData.sentence}
									meaning={prevData.meaning}
									vocab={prevData.vocab}
									videoUrl={prevData.videoUrl}
								/>
							</div>
						)}

						{currentData && (
							<div className={getCurrentCardClass()}>
								<Card
									date={currentData.date}
									sentence={currentData.sentence}
									meaning={currentData.meaning}
									vocab={currentData.vocab}
									videoUrl={currentData.videoUrl}
								/>
							</div>
						)}

						{nextData && (
							<div className={getNextCardClass()}>
								<Card
									date={nextData.date}
									sentence={nextData.sentence}
									meaning={nextData.meaning}
									vocab={nextData.vocab}
									videoUrl={nextData.videoUrl}
								/>
							</div>
						)}

						{prevData && <div className="scroll-indicator scroll-up"></div>}
						{nextData && <div className="scroll-indicator scroll-down"></div>}
					</div>
				)}
			</main>
			<Footer />
		</div>
	);
};

export default DailyPage;
