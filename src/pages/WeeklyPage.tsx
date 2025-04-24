import { useState } from 'react';
import { Link } from 'react-router-dom';

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
											<Link to={`/?date=${data.date}`}>자세히 보기</Link>
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
