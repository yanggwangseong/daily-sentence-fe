import React from 'react';
import './Card.css';

export interface CardProps {
	date: string;
	sentence: string;
	meaning: string;
	vocab: Vocab[];
	videoUrl: string;
}

interface Vocab {
	word: string;
	definition: string;
}

const Card: React.FC<CardProps> = ({
	date,
	sentence,
	meaning,
	vocab,
	videoUrl,
}) => {
	// Check if the date is today
	const isToday = (dateString: string): boolean => {
		try {
			const today = new Date();
			today.setHours(0, 0, 0, 0); // Reset hours to compare dates only

			// 날짜 문자열이 비어있거나 유효하지 않은 경우 처리
			if (!dateString || dateString.trim() === '') {
				return false;
			}

			const cardDate = new Date(dateString);

			// 유효하지 않은a 날짜 확인
			if (isNaN(cardDate.getTime())) {
				console.error('Invalid date in Card component:', dateString);
				return false;
			}

			return today.getTime() === cardDate.getTime();
		} catch (error) {
			console.error('Error comparing dates:', error);
			return false;
		}
	};

	const todayFlag = isToday(date);

	return (
		<div className="daily-english-card">
			<div className="card-header">
				<div className="date-container">
					<p className="date">📅 {date}</p>
					{todayFlag && <span className="today-badge">Today</span>}
				</div>
				<h2 className="sentence">💬 "{sentence}"</h2>
				<p className="meaning">👉 {meaning}</p>
			</div>

			<div className="content-separator"></div>

			<div className="vocab">
				<strong>📘 단어 설명</strong>
				<ul>
					{vocab.map((v, i) => (
						<li key={i}>
							{v.word}: {v.definition}
						</li>
					))}
				</ul>
			</div>

			<a
				href={videoUrl}
				className="video-link"
				target="_blank"
				rel="noopener noreferrer"
			>
				📺 관련 영상 보기
			</a>
		</div>
	);
};

export default Card;
