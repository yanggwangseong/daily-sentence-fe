import { useState } from 'react';

import { useQuery } from '@tanstack/react-query';

import Footer from '../components/Footer';
import Header from '../components/Header';

import './WeeklyPage.css';

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
		// Use the new API endpoint for weekly data
		const res = await fetch(`/api/sentences/weeklys/${startDate}`);
		if (!res.ok) {
			console.error(`Weekly data fetch failed: ${res.status}`);
			return [];
		}
		return await res.json();
	} catch (error) {
		console.error('Error fetching weekly data:', error);
		return [];
	}
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
		getMonday(today).toLocaleDateString('sv-SE'),
	);

	const { data: weeklySentences, isLoading } = useQuery({
		queryKey: ['weekly-sentences', startDate],
		queryFn: () => fetchWeeklySentences(startDate),
	});

	const handlePreviousWeek = () => {
		const prevWeek = new Date(startDate);
		prevWeek.setDate(prevWeek.getDate() - 7);
		setStartDate(prevWeek.toLocaleDateString('sv-SE'));
	};

	const handleNextWeek = () => {
		const nextWeek = new Date(startDate);
		nextWeek.setDate(nextWeek.getDate() + 7);
		setStartDate(nextWeek.toLocaleDateString('sv-SE'));
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

		// Get the first day of the month
		const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);

		// Find the first Monday of the month
		const firstMonday = new Date(firstDayOfMonth);
		const dayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday, 1 = Monday, etc.

		// If first day is not Monday, find the next Monday
		if (dayOfWeek !== 1) {
			const daysToAdd = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
			firstMonday.setDate(firstMonday.getDate() + daysToAdd);
		}

		// If the date is before the first Monday of the month, it's part of the last week of previous month
		if (date < firstMonday) {
			const prevMonth = new Date(date);
			prevMonth.setDate(0); // Last day of previous month
			return `${prevMonth.getMonth() + 1}월 마지막주`;
		}

		// Calculate the week number
		const dayDiff = Math.floor(
			(date.getTime() - firstMonday.getTime()) / (24 * 60 * 60 * 1000),
		);
		const weekNumber = Math.floor(dayDiff / 7) + 1;

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

	return (
		<div className="app">
			<Header />
			<main className="weekly-content">
				<div className="week-navigation">
					<button onClick={handlePreviousWeek} className="week-nav-button">
						&lt; 이전 주
					</button>
					<div className="week-title-container">
						<h2 className="week-title">{getWeekTitle(startDate)}</h2>
						<p className="week-subtitle">{formatDateRange(startDate)}</p>
					</div>
					<button onClick={handleNextWeek} className="week-nav-button">
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
