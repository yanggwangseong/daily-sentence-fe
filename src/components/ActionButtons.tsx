import React, { useState } from 'react';

import './ActionButtons.css';

interface SubscriptionModal {
	isOpen: boolean;
	email: string;
	status: 'idle' | 'submitting' | 'success' | 'error';
	errorMessage: string;
}

const ActionButtons: React.FC = () => {
	const [modal, setModal] = useState<SubscriptionModal>({
		isOpen: false,
		email: '',
		status: 'idle',
		errorMessage: '',
	});

	const handleSubscribe = () => {
		setModal({ ...modal, isOpen: true });
	};

	const handleCloseModal = () => {
		setModal({
			isOpen: false,
			email: '',
			status: 'idle',
			errorMessage: '',
		});
	};

	const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setModal({ ...modal, email: e.target.value, errorMessage: '' });
	};

	const validateEmail = (email: string): boolean => {
		const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return re.test(email);
	};

	const handleSubmitSubscription = async () => {
		// Validate email
		if (!validateEmail(modal.email)) {
			setModal({ ...modal, errorMessage: '이메일 형식이 올바르지 않습니다.' });
			return;
		}

		// Set submitting state
		setModal({ ...modal, status: 'submitting' });

		try {
			const response = await fetch(
				`/api/subscribers/${encodeURIComponent(modal.email)}`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
				},
			);

			if (response.status === 409) {
				setModal({
					...modal,
					status: 'error',
					errorMessage: '이미 구독자입니다.',
				});
				return;
			}

			if (response.status === 400) {
				setModal({
					...modal,
					status: 'error',
					errorMessage: '이메일 형식이 올바르지 않습니다.',
				});
				return;
			}

			if (!response.ok) {
				throw new Error('Subscription failed');
			}

			// Success
			setModal({
				...modal,
				status: 'success',
			});

			// Reset after success display
			setTimeout(() => {
				setModal({
					isOpen: false,
					email: '',
					status: 'idle',
					errorMessage: '',
				});
			}, 2000);
		} catch (error) {
			console.error('구독 요청 실패:', error);
			setModal({
				...modal,
				status: 'error',
				errorMessage: '구독 요청이 실패했습니다. 다시 시도해주세요.',
			});
		}
	};

	const handleFeedback = () => {
		window.open(
			'https://docs.google.com/forms/d/e/1FAIpQLSeacEjmcxGbEp9ZMQHUONgEj9scaJTLbEk0mREkbtS8x9WTtQ/viewform?usp=dialog',
			'_blank',
		);
	};

	return (
		<div className="action-buttons">
			<div className="button-group">
				<button className="action-button subscribe" onClick={handleSubscribe}>
					<span>구독하기</span>
				</button>
				<button className="action-button feedback" onClick={handleFeedback}>
					<span>피드백</span>
				</button>
			</div>

			{modal.isOpen && (
				<div className="subscription-modal-overlay">
					<div className="subscription-modal">
						<h3>구독하기</h3>
						<p>
							매주 월요일 아침, 지난 1주일간의 영어 문장을 이메일로
							보내드립니다.
						</p>

						<div className="subscription-input-group">
							<input
								type="email"
								placeholder="이메일 주소를 입력하세요"
								value={modal.email}
								onChange={handleEmailChange}
								disabled={
									modal.status === 'submitting' || modal.status === 'success'
								}
							/>
							{modal.errorMessage && (
								<div className="subscription-error">{modal.errorMessage}</div>
							)}
						</div>

						<div className="subscription-button-group">
							<button
								className="subscription-button submit"
								onClick={handleSubmitSubscription}
								disabled={
									modal.status === 'submitting' || modal.status === 'success'
								}
							>
								{modal.status === 'submitting'
									? '처리 중...'
									: modal.status === 'success'
										? '구독 완료!'
										: '구독하기'}
							</button>
							<button
								className="subscription-button cancel"
								onClick={handleCloseModal}
							>
								닫기
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default ActionButtons;
