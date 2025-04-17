import React from 'react';
import './Footer.css';

const Footer: React.FC = () => {
	return (
		<footer className="footer">
			<div className="footer-content">
				<p className="copyright">
					Copyright © 2025, 매일영어. All rights reserved.
				</p>
				<p className="contact">이메일: dailysentence6@gmail.com</p>
			</div>
		</footer>
	);
};

export default Footer;
