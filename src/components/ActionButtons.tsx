import React, { useState } from 'react';

import { track } from '@amplitude/analytics-browser';

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
		// CTR 측정을 위한 구독 버튼 클릭 이벤트 추적
		track('Subscription Funnel', {
			step: 'subscribe_button_click',
			location: 'action_buttons',
		});

		setModal({ ...modal, isOpen: true });
	};

	const handleCloseModal = () => {
		// 모달 닫기 이벤트 추적 (구독 퍼널 이탈)
		track('Subscription Funnel', {
			step: 'modal_close',
			location: 'subscription_modal',
			funnel_exit: true,
		});

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
		// 구독 제출 버튼 클릭 이벤트 추적
		track('Subscription Funnel', {
			step: 'form_submit',
			location: 'subscription_modal',
		});

		// Validate email
		if (!validateEmail(modal.email)) {
			setModal({ ...modal, errorMessage: '이메일 형식이 올바르지 않습니다.' });

			// 유효성 검사 실패 이벤트 추적 (구독 퍼널 장애물)
			track('Subscription Funnel', {
				step: 'validation_error',
				error_type: 'invalid_email',
				email_input: modal.email,
				funnel_exit: false,
			});

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

				// 중복 구독자 이벤트 추적
				track('Subscription Funnel', {
					step: 'already_subscribed',
					email: modal.email,
					funnel_exit: true,
				});

				return;
			}

			if (response.status === 400) {
				setModal({
					...modal,
					status: 'error',
					errorMessage: '이메일 형식이 올바르지 않습니다.',
				});

				// 서버 측 유효성 검사 실패 이벤트 추적
				track('Subscription Funnel', {
					step: 'server_validation_error',
					email: modal.email,
					funnel_exit: true,
				});

				return;
			}

			if (!response.ok) {
				throw new Error('Subscription failed');
			}

			// 구독 완료 - 전환 성공
			track('Subscription Funnel', {
				step: 'subscription_complete',
				email: modal.email,
				funnel_complete: true,
			});

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

			// 서버 오류 이벤트 추적
			track('Subscription Funnel', {
				step: 'server_error',
				funnel_exit: true,
			});
		}
	};

	const handleFeedback = () => {
		// 피드백 버튼 클릭 이벤트 추적
		track('Button Click', {
			button_name: 'feedback',
			location: 'action_buttons',
		});

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
