import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import './App.css';

import DailyPage from './pages/DailyPage';
import WeeklyPage from './pages/WeeklyPage';

const App: React.FC = () => {
	return (
		<Routes>
			<Route path="/" element={<DailyPage />} />
			<Route path="/weekly" element={<WeeklyPage />} />
			<Route path="*" element={<Navigate to="/" replace />} />
		</Routes>
	);
};

export default App;
