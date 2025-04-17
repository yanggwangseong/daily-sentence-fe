import React, { useEffect, useState } from 'react';

import './App.css';
import ActionButtons from './components/ActionButtons';
import Card, { CardProps } from './components/Card';
import Footer from './components/Footer';
import Header from './components/Header';

const App: React.FC = () => {
	const [data, setData] = useState<CardProps | null>(null);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const today = new Date().toLocaleDateString('sv-SE');
				const res = await fetch(`/api/sentences/days/${today}`);
				const json = await res.json();
				setData(json);
			} catch (error) {
				console.error('데이터 가져오기 실패:', error);
			}
		};

		fetchData();
	}, []);

	return (
		<div className="app">
			<Header />
			<main className="main-content">
				{data ? (
					<Card
						date={data.date}
						sentence={data.sentence}
						meaning={data.meaning}
						vocab={data.vocab}
						videoUrl={data.videoUrl}
					/>
				) : (
					<p>로딩 중...</p>
				)}
				<ActionButtons />
			</main>
			<Footer />
		</div>
	);
};

export default App;
