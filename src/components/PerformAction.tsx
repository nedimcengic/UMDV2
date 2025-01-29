import React from 'react';
import axios from 'axios';

const PerformAction: React.FC = () => {
  const handleCreateUser = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');

      if (!accessToken) {
        alert('You are not logged in. Please log in first.');
        return;
      }

      const response = await axios.post(
        'http://localhost:4000/google-workspace/create-user',
        {
          email: 'newuser@example.com',
          firstName: 'John',
          lastName: 'Doe',
          password: 'securepassword',
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      alert('User created successfully!');
      console.log(response.data);
    } catch (error) {
      console.error('Failed to create user:', error);
      alert('Error creating user. Please try again.');
    }
  };

  return <button onClick={handleCreateUser}>Create Google Workspace User</button>;
};

export default PerformAction;
