import React from 'react';
import { Link } from 'react-router-dom';

import './Header.css';
import ActionButtons from './ActionButtons';

const Header: React.FC = () => {
	return (
		<header className="header">
			<div className="header-content">
				<h1>매일영어</h1>
			</div>
			<div className="header-buttons">
				<Link to="/weekly" className="weekly-button">
					<span>Weekly</span>
					<span>📅</span>
				</Link>
				<ActionButtons />
			</div>
		</header>
	);
};

export default Header;
