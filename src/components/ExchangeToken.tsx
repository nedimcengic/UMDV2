import React, { useEffect } from 'react';
import axios from 'axios';

const ExchangeToken: React.FC = () => {
  useEffect(() => {
    const exchangeToken = async () => {
      const queryParams = new URLSearchParams(window.location.search);
      const authCode = queryParams.get('code');

      if (!authCode) {
        alert('Authorization code missing. Please log in again.');
        return;
      }

      try {
        const response = await axios.get(`http://localhost:4000/google-workspace/exchange-token?code=${authCode}`);
        const { tokens } = response.data;

        // Store tokens in localStorage (or send them to the backend)
        localStorage.setItem('accessToken', tokens.access_token);
        localStorage.setItem('refreshToken', tokens.refresh_token);

        alert('Login successful! You can now perform actions.');
      } catch (error) {
        console.error('Failed to exchange token:', error);
        alert('Error exchanging token. Please log in again.');
      }
    };

    exchangeToken();
  }, []);

  return <div>Authenticating...</div>;
};

export default ExchangeToken;
