import React, { useEffect, useState, useRef } from 'react';

import './DailyPage.css';
import { format, parseISO, addDays } from 'date-fns';

import Card from '../components/Card';

interface SentenceData {
	date: string;
	sentence: string;
	meaning: string;
	vocab: {
		word: string;
		definition: string;
	}[];
	videoUrl: string;
}

const DailyPage: React.FC = () => {
	// States
	const [currentData, setCurrentData] = useState<SentenceData | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);
	const [currentDate, setCurrentDate] = useState<string>('');
	const [canNavigatePrev, setCanNavigatePrev] = useState<boolean>(true);
	const [canNavigateNext, setCanNavigateNext] = useState<boolean>(false);
	const [cardClassName, setCardClassName] = useState<string>(
		'carousel-card current-card',
	);

	// Refs for scroll handling
	const containerRef = useRef<HTMLDivElement>(null);
	const lastTouchY = useRef<number | null>(null);
	const lastWheelTime = useRef<number>(0);
	const lastTouchTime = useRef<number>(0);
	const isAnimating = useRef<boolean>(false);

	// Get adjusted today's date at 9am to avoid timezone issues
	const getTodayDate = (): string => {
		const today = new Date();
		today.setHours(9, 0, 0, 0);
		return format(today, 'yyyy-MM-dd');
	};

	// Helper function to check if a date is in the future
	const isFutureDate = (dateString: string): boolean => {
		const today = getTodayDate();
		return dateString > today;
	};

	// Function to get adjacent date (prev or next)
	const getAdjacentDate = (direction: 'prev' | 'next'): string => {
		// Parse the date string to ensure consistent date handling
		const currentDateObj = parseISO(currentDate);
		const newDate =
			direction === 'prev'
				? addDays(currentDateObj, -1)
				: addDays(currentDateObj, 1);

		return format(newDate, 'yyyy-MM-dd');
	};

	// Function to fetch data for a specific date
	const fetchData = async (date: string) => {
		try {
			setIsLoading(true);
			const response = await fetch(`/api/sentences/days/${date}`);

			if (!response.ok) {
				throw new Error('Network response was not ok');
			}

			const data = await response.json();
			return data;
		} catch (err) {
			setError('Could not fetch data. Please try again later.');
			console.error('Fetch error:', err);
			return null;
		} finally {
			setIsLoading(false);
		}
	};

	// Get appropriate card class based on animation state
	const getCardClass = (): string => {
		return cardClassName;
	};

	// Navigate to previous card/date
	const handlePrevCard = async () => {
		if (isAnimating.current || !canNavigatePrev) return;
		isAnimating.current = true;

		// Start animation to move current card down
		setCardClassName('carousel-card card-moving-down');

		// Calculate the previous date
		const prevDate = getAdjacentDate('prev');

		// Fetch previous data
		const prevData = await fetchData(prevDate);

		// After animation duration, update state with new data
		setTimeout(async () => {
			if (prevData) {
				setCurrentDate(prevDate);
				setCurrentData(prevData);

				// Update navigation flags
				setCanNavigateNext(true); // We can always go forward after going back

				// Reset card class for entry animation
				setCardClassName('carousel-card card-becoming-current-from-top');

				// Reset animation flag after animation completes
				setTimeout(() => {
					setCardClassName('carousel-card current-card');
					isAnimating.current = false;
				}, 500);
			} else {
				// In case of error, revert to original state
				setCardClassName('carousel-card current-card');
				isAnimating.current = false;
			}
		}, 500);
	};

	// Navigate to next card/date
	const handleNextCard = async () => {
		if (isAnimating.current || !canNavigateNext) return;
		isAnimating.current = true;

		// Start animation to move current card up
		setCardClassName('carousel-card card-moving-up');

		// Calculate the next date
		const nextDate = getAdjacentDate('next');

		// Fetch next data
		const nextData = await fetchData(nextDate);

		// After animation duration, update state with new data
		setTimeout(async () => {
			if (nextData) {
				setCurrentDate(nextDate);
				setCurrentData(nextData);

				// Update navigation flags
				const isNextDateFuture = isFutureDate(nextDate);
				setCanNavigateNext(!isNextDateFuture);

				// Reset card class for entry animation
				setCardClassName('carousel-card card-becoming-current-from-bottom');

				// Reset animation flag after animation completes
				setTimeout(() => {
					setCardClassName('carousel-card current-card');
					isAnimating.current = false;
				}, 500);
			} else {
				// In case of error, revert to original state
				setCardClassName('carousel-card current-card');
				isAnimating.current = false;
			}
		}, 500);
	};

	// Touch event handlers
	const onTouchStart = (e: React.TouchEvent) => {
		lastTouchY.current = e.touches[0].clientY;
		lastTouchTime.current = Date.now();
	};

	const onTouchMove = (e: React.TouchEvent) => {
		if (isAnimating.current || !lastTouchY.current) return;

		const currentY = e.touches[0].clientY;
		const diffY = currentY - lastTouchY.current;

		// Prevent default scrolling when handling our swipe
		if (Math.abs(diffY) > 10) {
			e.preventDefault();
		}
	};

	const onTouchEnd = (e: React.TouchEvent) => {
		if (isAnimating.current || !lastTouchY.current) return;

		const currentY = e.changedTouches[0].clientY;
		const diffY = currentY - lastTouchY.current;
		const timeDiff = Date.now() - lastTouchTime.current;

		// Threshold for minimum time between events
		if (timeDiff < 300) {
			lastTouchY.current = null;
			return;
		}

		// Reset for next touch
		lastTouchY.current = null;

		// Threshold for swipe distance
		if (Math.abs(diffY) < 50) return;

		if (diffY > 0 && canNavigatePrev) {
			// Swipe down, go to previous
			handlePrevCard();
		} else if (diffY < 0 && canNavigateNext) {
			// Swipe up, go to next
			handleNextCard();
		}
	};

	// Mouse wheel event handler
	const handleWheel = (e: WheelEvent) => {
		if (isAnimating.current) return;

		const now = Date.now();
		if (now - lastWheelTime.current < 500) return; // Prevent rapid scrolling

		lastWheelTime.current = now;

		if (e.deltaY < 0 && canNavigatePrev) {
			// Scrolling up, go to previous
			handlePrevCard();
		} else if (e.deltaY > 0 && canNavigateNext) {
			// Scrolling down, go to next
			handleNextCard();
		}
	};

	// Initial data load
	useEffect(() => {
		const loadInitialData = async () => {
			const today = getTodayDate();
			setCurrentDate(today);

			const data = await fetchData(today);
			if (data) {
				setCurrentData(data);
				// Since we're at today's date, we can go backwards but not forwards
				setCanNavigatePrev(true);
				setCanNavigateNext(false);
			}
		};

		loadInitialData();
	}, []);

	// Set up wheel event listener
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
	}, [canNavigatePrev, canNavigateNext]);

	// Render component
	return (
		<div className="main-content">
			<div
				className="card-carousel"
				ref={containerRef}
				onTouchStart={onTouchStart}
				onTouchMove={onTouchMove}
				onTouchEnd={onTouchEnd}
			>
				{/* Current Card */}
				{currentData && (
					<div className={getCardClass()}>
						<Card
							date={currentData.date}
							sentence={currentData.sentence}
							meaning={currentData.meaning}
							vocab={currentData.vocab}
							videoUrl={currentData.videoUrl}
						/>
					</div>
				)}

				{/* Loading state */}
				{isLoading && <div className="loading">Loading...</div>}

				{/* Error state */}
				{error && <div className="error">{error}</div>}

				{/* Scroll indicators */}
				<div className="scroll-indicator-container">
					<div
						className={`scroll-indicator scroll-up ${!canNavigatePrev ? 'disabled' : ''}`}
					></div>
					<div
						className={`scroll-indicator scroll-down ${!canNavigateNext ? 'disabled' : ''}`}
					></div>
				</div>
			</div>
		</div>
	);
};

export default DailyPage;
