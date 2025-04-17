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
	return (
		<div className="daily-english-card">
			<p className="date">📅 {date}</p>
			<h2 className="sentence">💬 "{sentence}"</h2>
			<p className="meaning">👉 {meaning}</p>
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
