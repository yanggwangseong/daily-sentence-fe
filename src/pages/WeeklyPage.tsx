import React, { useState } from 'react';

import { useQuery } from '@tanstack/react-query';

import Card from '../components/Card';
import Footer from '../components/Footer';
import Header from '../components/Header';

import './WeeklyPage.css';

const fetchWeeklySentences = async (startDate: string) => {
	try {
		// Get sentences for the week starting from startDate
		// This is a placeholder for the actual API call
		const days = [];
		const currentDate = new Date(startDate);

		for (let i = 0; i < 7; i++) {
			const dateStr = currentDate.toLocaleDateString('sv-SE');
			try {
				const res = await fetch(`/api/sentences/days/${dateStr}`);
				if (res.ok) {
					days.push(await res.json());
				}
			} catch (error) {
				console.error(`Error fetching data for ${dateStr}:`, error);
			}
			currentDate.setDate(currentDate.getDate() + 1);
		}

		return days;
	} catch (error) {
		console.error('Error fetching weekly data:', error);
		return [];
	}
};

const WeeklyPage: React.FC = () => {
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

	return (
		<div className="app">
			<Header />
			<main className="weekly-content">
				<div className="week-navigation">
					<button onClick={handlePreviousWeek} className="week-nav-button">
						&lt; 이전 주
					</button>
					<h2 className="week-title">
						{startDate} ~{' '}
						{new Date(
							new Date(startDate).setDate(new Date(startDate).getDate() + 6),
						).toLocaleDateString('sv-SE')}
					</h2>
					<button onClick={handleNextWeek} className="week-nav-button">
						다음 주 &gt;
					</button>
				</div>

				{isLoading ? (
					<p className="loading">로딩 중...</p>
				) : (
					<div className="weekly-cards">
						{weeklySentences && weeklySentences.length > 0 ? (
							weeklySentences.map((data, index) => (
								<div key={index} className="weekly-card-wrapper">
									<Card
										date={data.date}
										sentence={data.sentence}
										meaning={data.meaning}
										vocab={data.vocab}
										videoUrl={data.videoUrl}
									/>
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
