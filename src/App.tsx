import React, { useState, useEffect } from 'react';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import './App.css';

import ActionButtons from './components/ActionButtons';
import Card, { CardProps } from './components/Card';
import Footer from './components/Footer';
import Header from './components/Header';

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

const App: React.FC = () => {
	const today = new Date().toLocaleDateString('sv-SE');
	const [currentDate, setCurrentDate] = useState<string>(today);
	const queryClient = useQueryClient();

	const prevDate = getAdjacentDate(currentDate, -1);
	const nextDate = getAdjacentDate(currentDate, 1);

	// Pre-fetch several past days on initial load
	useEffect(() => {
		const fetchPastDays = async () => {
			const date = today;
			// Prefetch 7 days before today
			for (let i = 1; i <= 7; i++) {
				const pastDate = getAdjacentDate(date, -i);
				queryClient.prefetchQuery({
					queryKey: ['sentence', pastDate],
					queryFn: () => fetchSentenceByDate(pastDate),
				});
			}
		};

		fetchPastDays();
	}, [queryClient, today]);

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

	const prefetchAdjacentData = (date: string) => {
		queryClient.prefetchQuery({
			queryKey: ['sentence', date],
			queryFn: () => fetchSentenceByDate(date),
		});
	};

	const handlePrevCard = () => {
		if (prevData) {
			setCurrentDate(prevDate);
			prefetchAdjacentData(getAdjacentDate(prevDate, -1));
		}
	};

	const handleNextCard = () => {
		if (nextData) {
			setCurrentDate(nextDate);
			prefetchAdjacentData(getAdjacentDate(nextDate, 1));
		}
	};

	// Touch handling for swipe
	const [touchStart, setTouchStart] = useState<number | null>(null);
	const [touchEnd, setTouchEnd] = useState<number | null>(null);
	const minSwipeDistance = 50;

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

	return (
		<div className="app">
			<Header />
			<main className="main-content">
				{isCurrentLoading ? (
					<p>로딩 중...</p>
				) : (
					<div
						className="card-carousel"
						onTouchStart={onTouchStart}
						onTouchMove={onTouchMove}
						onTouchEnd={onTouchEnd}
					>
						{prevData && (
							<div className="carousel-card previous-card">
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
							<div className="carousel-card current-card">
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
							<div className="carousel-card next-card">
								<Card
									date={nextData.date}
									sentence={nextData.sentence}
									meaning={nextData.meaning}
									vocab={nextData.vocab}
									videoUrl={nextData.videoUrl}
								/>
							</div>
						)}
					</div>
				)}
				<div className="navigation-buttons">
					<button
						onClick={handlePrevCard}
						disabled={!prevData}
						className="nav-button prev-button"
					>
						이전
					</button>
					<button
						onClick={handleNextCard}
						disabled={!nextData}
						className="nav-button next-button"
					>
						다음
					</button>
				</div>
				<ActionButtons />
			</main>
			<Footer />
		</div>
	);
};

export default App;
