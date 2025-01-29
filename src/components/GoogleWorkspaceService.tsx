// src/components/GoogleWorkspaceService.tsx
import React, { useState } from 'react';
import axios from 'axios';

type GoogleWorkspaceServiceProps = {
  userData: {
    firstName: string;
    lastName: string;
    email: string;
  };
  onUserDataChange: (key: string, value: string) => void;
};

const GoogleWorkspaceService: React.FC<GoogleWorkspaceServiceProps> = ({ userData, onUserDataChange }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000';

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userData.firstName || !userData.lastName || !userData.email) {
      alert('All fields are required!');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/google-workspace/create-user`, {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: 'DefaultPassword123!',
      });

      alert('User created successfully!');
    } catch (error: any) {
      if (error.response?.data?.redirectToAuth) {
        console.log('Redirecting to Google OAuth consent screen...');
        const { data } = await axios.get(`${API_BASE_URL}/google-workspace/auth-url`);
        window.location.href = data.authUrl;
      } else {
        alert(`Error creating user: ${error.response?.data?.message || 'Unknown error'}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onUserDataChange(name, value);
  };

  return (
    <div className="service-content">
      <h3>Google Workspace Service</h3>
      <form className="form" onSubmit={handleCreateUser}>
        <h4>Create User</h4>
        <input
          type="text"
          name="firstName"
          placeholder="First Name"
          value={userData.firstName}
          onChange={handleInputChange}
          required
        />
        <input
          type="text"
          name="lastName"
          placeholder="Last Name"
          value={userData.lastName}
          onChange={handleInputChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={userData.email}
          onChange={handleInputChange}
          required
        />
        <button type="submit" disabled={isSubmitting} style={{ marginTop: '10px' }}>
          {isSubmitting ? 'Creating...' : 'Create User'}
        </button>
      </form>
    </div>
  );
};

export default GoogleWorkspaceService;
