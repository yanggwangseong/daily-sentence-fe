import React from 'react';
import './ActionButtons.css';

const ActionButtons: React.FC = () => {
	return (
		<div className="action-buttons">
			<div className="button-group">
				<button className="action-button share">공유하기</button>
				<button
					className="action-button feedback"
					onClick={() => {
						window.open(
							'https://docs.google.com/forms/d/e/1FAIpQLSeacEjmcxGbEp9ZMQHUONgEj9scaJTLbEk0mREkbtS8x9WTtQ/viewform?usp=dialog',
							'_blank',
						);
					}}
				>
					기능/버그 제안
				</button>
			</div>
		</div>
	);
};

export default ActionButtons;
