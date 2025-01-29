import React from 'react';
import axios from 'axios';

const LoginButton: React.FC = () => {
  const handleLogin = async () => {
    try {
      const response = await axios.get('http://localhost:4000/google-workspace/auth-url');
      window.location.href = response.data.authUrl; // Redirect to Google's OAuth page
    } catch (error) {
      console.error('Failed to get auth URL:', error);
      alert('Error logging in. Please try again.');
    }
  };

  return <button onClick={handleLogin}>Log in with Google</button>;
};

export default LoginButton;
