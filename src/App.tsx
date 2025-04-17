import React from 'react';

import './App.css';
import ActionButtons from './components/ActionButtons';
import Card from './components/Card';
import Footer from './components/Footer';
import Header from './components/Header';

const App: React.FC = () => {
	return (
		<div className="app">
			<Header />
			<main className="main-content">
				<Card
					date="2025.04.16"
					sentence="Are you nuts?"
					meaning="제정신이야?"
					vocab={{
						word: 'nuts',
						definition: '미친, 제정신이 아닌',
					}}
					videoUrl="https://www.youtube.com/shorts/4ZQoE7ckquc"
				/>
				<ActionButtons />
			</main>
			<Footer />
		</div>
	);
};

export default App;
