import React from 'react';
import './ActionButtons.css';

interface Props {
	isOpen: boolean;
	email: string;
	status: 'idle' | 'submitting' | 'success' | 'error';
	errorMessage: string;
	onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onSubmit: () => void;
	onClose: () => void;
}

const SubscriptionModal: React.FC<Props> = ({
	isOpen,
	email,
	status,
	errorMessage,
	onEmailChange,
	onSubmit,
	onClose,
}) => {
	if (!isOpen) return null;
	return (
		<div className="subscription-modal-overlay">
			<div className="subscription-modal">
				<h3>구독하기</h3>
				<p>
					매주 월요일 아침, 지난 1주일간의 영어 문장을 이메일로 보내드립니다.
				</p>
				<div className="subscription-input-group">
					<input
						type="email"
						placeholder="이메일 주소를 입력하세요"
						value={email}
						onChange={onEmailChange}
						disabled={status === 'submitting' || status === 'success'}
					/>
					{errorMessage && (
						<div className="subscription-error">{errorMessage}</div>
					)}
				</div>
				<div className="subscription-button-group">
					<button
						className="subscription-button submit"
						onClick={onSubmit}
						disabled={status === 'submitting' || status === 'success'}
					>
						{status === 'submitting'
							? '처리 중...'
							: status === 'success'
								? '구독 완료!'
								: '구독하기'}
					</button>
					<button className="subscription-button cancel" onClick={onClose}>
						닫기
					</button>
				</div>
			</div>
		</div>
	);
};

export default SubscriptionModal;
