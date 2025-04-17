import React from 'react';
import './Card.css';

interface CardProps {
	date: string;
	sentence: string;
	meaning: string;
	vocab: {
		word: string;
		definition: string;
	};
	videoUrl: string;
}

const Card: React.FC<CardProps> = ({
	date,
	sentence,
	meaning,
	vocab,
	videoUrl,
}) => {
	return (
		<div className="daily-english-card">
			<p className="date">📅 {date}</p>
			<h2 className="sentence">💬 "{sentence}"</h2>
			<p className="meaning">👉 {meaning}</p>
			<div className="vocab">
				<strong>📘 단어 설명</strong>
				<ul>
					<li>
						{vocab.word}: {vocab.definition}
					</li>
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
