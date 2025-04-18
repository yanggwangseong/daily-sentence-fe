import React from 'react';
import './ActionButtons.css';

const ActionButtons: React.FC = () => {
	const handleShare = async () => {
		try {
			await navigator.clipboard.writeText(window.location.href);
			alert('링크가 복사되었습니다!');
		} catch (err) {
			console.error('클립보드 복사 실패:', err);
			alert('링크 복사에 실패했습니다.');
		}
	};

	return (
		<div className="action-buttons">
			<div className="button-group">
				<button className="action-button share" onClick={handleShare}>
					공유하기
				</button>
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
