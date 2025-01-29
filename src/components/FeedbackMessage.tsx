// src/components/FeedbackMessage.tsx
import React from 'react';

type FeedbackMessageProps = {
  message: string;
  type: 'success' | 'error';
};

const FeedbackMessage: React.FC<FeedbackMessageProps> = ({ message, type }) => (
  <div className={`feedback-message ${type}`}>
    {message}
  </div>
);

export default FeedbackMessage;
