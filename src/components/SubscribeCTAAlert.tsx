import React from 'react';
import './SubscribeCTAAlert.css';

interface Props {
	onSubscribe: () => void;
	onClose: () => void;
}

const SubscribeCTAAlert: React.FC<Props> = ({ onSubscribe, onClose }) => (
	<div className="cta-overlay">
		<div className="cta-modal">
			<div className="cta-header">
				<span className="cta-icon">📩</span>
				<h2>매주 영어 한 문장, 무료 구독!</h2>
			</div>
			<p className="cta-description">
				<strong>월요일 아침</strong>마다 지난 1주일간의 영어 문장을 <br />
				<span className="highlight">이메일로 보내드립니다.</span>
			</p>
			<div className="cta-actions">
				<button onClick={onSubscribe} className="cta-primary">
					지금 무료로 구독하기
				</button>
				<button onClick={onClose} className="cta-secondary">
					7일간 다시 보지 않기
				</button>
			</div>
		</div>
	</div>
);

export default SubscribeCTAAlert;
