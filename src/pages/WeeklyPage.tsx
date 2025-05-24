import { useState, useEffect } from 'react';

import { useQuery } from '@tanstack/react-query';

import Footer from '../components/Footer';
import Header from '../components/Header';

import './WeeklyPage.css';
import { API_BASE_URL } from '@/constants/env-file';

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

const fetchWeeklySentences = async (
	startDate: string,
): Promise<SentenceData[]> => {
	try {
		const res = await fetch(`${API_BASE_URL}/sentences/weeklys/${startDate}`, {
			credentials: 'include',
		});
		if (!res.ok) {
			console.error(`Weekly data fetch failed: ${res.status}`);
			return [];
		}
		const data = await res.json();
		if (data && data.success && Array.isArray(data.data)) {
			return data.data;
		}
		return [];
	} catch (error) {
		console.error('Error fetching weekly data:', error);
		return [];
	}
};

// Check if a date is in the future
const isFutureDate = (dateStr: string): boolean => {
	const date = new Date(dateStr);
	const today = new Date();
	today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
	return date > today;
};

const WeeklyPage = () => {
	// Get the current Monday as the default start date
	const getMonday = (date: Date) => {
		const day = date.getDay();
		const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
		return new Date(date.setDate(diff));
	};

	const today = new Date();
	const [startDate, setStartDate] = useState(
		getMonday(today).toLocaleDateString('sv-SE', {
			timeZone: 'Asia/Seoul',
		}),
	);

	const { data: weeklySentences, isLoading } = useQuery({
		queryKey: ['weekly-sentences', startDate],
		queryFn: () => fetchWeeklySentences(startDate),
	});

	// Check if we can navigate to previous week
	const [canGoToPrevWeek, setCanGoToPrevWeek] = useState(true);

	// Check if next week is in the future
	const nextWeekDate = new Date(startDate);
	nextWeekDate.setDate(nextWeekDate.getDate() + 7);
	const isNextWeekInFuture = isFutureDate(
		nextWeekDate.toLocaleDateString('sv-SE', {
			timeZone: 'Asia/Seoul',
		}),
	);

	// Prefetch previous week data to check if it exists
	useEffect(() => {
		const checkPrevWeekData = async () => {
			const prevWeek = new Date(startDate);
			prevWeek.setDate(prevWeek.getDate() - 7);
			const prevWeekStr = prevWeek.toLocaleDateString('sv-SE', {
				timeZone: 'Asia/Seoul',
			});

			try {
				const res = await fetch(
					`${API_BASE_URL}/sentences/weeklys/${prevWeekStr}`,
					{
						credentials: 'include',
					},
				);
				const data = await res.json();
				setCanGoToPrevWeek(
					res.ok &&
						data &&
						data.success &&
						Array.isArray(data.data) &&
						data.data.length > 0,
				);
			} catch (error) {
				console.error('Error checking previous week data:', error);
				setCanGoToPrevWeek(false);
			}
		};

		checkPrevWeekData();
	}, [startDate]);

	const handlePreviousWeek = () => {
		if (!canGoToPrevWeek) return;

		const prevWeek = new Date(startDate);
		prevWeek.setDate(prevWeek.getDate() - 7);
		setStartDate(
			prevWeek.toLocaleDateString('sv-SE', {
				timeZone: 'Asia/Seoul',
			}),
		);
	};

	const handleNextWeek = () => {
		if (isNextWeekInFuture) return;

		const nextWeek = new Date(startDate);
		nextWeek.setDate(nextWeek.getDate() + 7);
		setStartDate(
			nextWeek.toLocaleDateString('sv-SE', {
				timeZone: 'Asia/Seoul',
			}),
		);
	};

	// Format date to be more readable
	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString('ko-KR', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			weekday: 'short',
		});
	};

	// Get the week number and month for the week title
	const getWeekTitle = (dateString: string) => {
		const date = new Date(dateString);
		const month = date.getMonth() + 1; // JavaScript months are 0-indexed

		// Get the week number within the month
		const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
		const firstDayOfMonthWeekday = firstDayOfMonth.getDay() || 7; // Convert Sunday (0) to 7

		// Adjust the date to account for days from previous month in the first week
		const adjustedDate = date.getDate() + (firstDayOfMonthWeekday - 1);
		const weekNumber = Math.ceil(adjustedDate / 7);

		return `${month}월 ${weekNumber}주차`;
	};

	// Format date range for subtitle
	const formatDateRange = (startDateStr: string) => {
		const startDate = new Date(startDateStr);
		const endDate = new Date(startDateStr);
		endDate.setDate(endDate.getDate() + 6);

		const startFormatted = startDate.toLocaleDateString('ko-KR', {
			month: 'numeric',
			day: 'numeric',
		});

		const endFormatted = endDate.toLocaleDateString('ko-KR', {
			month: 'numeric',
			day: 'numeric',
		});

		return `${startFormatted} ~ ${endFormatted}`;
	};

	// Enable scrolling on the WeeklyPage
	useEffect(() => {
		// Save original body style and classes
		const originalOverflow = document.body.style.overflowY;

		// Add class to body
		document.body.classList.add('weekly-page-active');

		// Enable scrolling
		document.body.style.overflowY = 'auto';

		// Cleanup function to restore original style when component unmounts
		return () => {
			document.body.style.overflowY = originalOverflow;
			document.body.classList.remove('weekly-page-active');
		};
	}, []);

	return (
		<div className="app-weekly">
			<Header />
			<main className="weekly-content">
				<div className="week-navigation">
					<button
						onClick={handlePreviousWeek}
						className={`week-nav-button ${!canGoToPrevWeek ? 'disabled' : ''}`}
						disabled={!canGoToPrevWeek}
					>
						&lt; 이전 주
					</button>
					<div className="week-title-container">
						<h2 className="week-title">{getWeekTitle(startDate)}</h2>
						<p className="week-subtitle">{formatDateRange(startDate)}</p>
					</div>
					<button
						onClick={handleNextWeek}
						className={`week-nav-button ${isNextWeekInFuture ? 'disabled' : ''}`}
						disabled={isNextWeekInFuture}
					>
						다음 주 &gt;
					</button>
				</div>

				{isLoading ? (
					<p className="loading">로딩 중...</p>
				) : (
					<div className="weekly-list">
						{weeklySentences && weeklySentences.length > 0 ? (
							weeklySentences.map((data, index) => (
								<div key={index} className="weekly-item">
									<div className="weekly-item-date">
										<span>📅</span> {formatDate(data.date)}
									</div>
									<div className="weekly-item-content">
										<p className="weekly-sentence">
											"{data.sentence}" : {data.meaning}
										</p>
										{data.vocab && data.vocab.length > 0 && (
											<ul className="weekly-vocab">
												{data.vocab.slice(0, 2).map((v, i) => (
													<li key={i}>
														{v.word}: {v.definition}
													</li>
												))}
											</ul>
										)}
										<div className="weekly-video-link">
											<a
												href={data.videoUrl}
												target="_blank"
												rel="noopener noreferrer"
											>
												<span>📺</span> 관련 영상 보기
											</a>
										</div>
									</div>
									{index < weeklySentences.length - 1 && (
										<div className="weekly-divider"></div>
									)}
								</div>
							))
						) : (
							<p className="no-data">이 주에 데이터가 없습니다.</p>
						)}
					</div>
				)}
			</main>
			<Footer />
		</div>
	);
};

export default WeeklyPage;
