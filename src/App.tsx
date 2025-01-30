import React, { useState, ChangeEvent, useEffect } from 'react';
import axios from 'axios';
import ActionsSidebar from './components/ActionsSidebar';
import ServiceTabs from './components/ServiceTabs';
import KeycloakService from './components/services/KeycloakService';
import GoogleWorkspaceService from './components/services/GoogleWorkspaceService';
import CertifyService from './components/services/CertifyService';
import OnboardingService from './components/services/OnboardingService'; // Import Onboarding Service
import './styles/App.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000';

interface UserData {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  groups?: string[]; // Optional property for groups
}
interface OnboardingFormData {
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  role: string;
  managerEmail: string;
}

const App: React.FC = () => {
  const [selectedService, setSelectedService] = useState<string>('Keycloak');
  const [userData, setUserData] = useState<UserData>({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    groups: [], // Initialize as an empty array
  });
  const [onboardingData, setOnboardingData] = useState<OnboardingFormData>({
    firstName: '',
    lastName: '',
    email: '',
    department: '',
    role: '',
    managerEmail: '',
  });
  
  
  const [groupName, setGroupName] = useState<string>('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  // Check for tokens in localStorage on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('accessToken');
    const refreshToken = urlParams.get('refreshToken');

    if (accessToken && refreshToken) {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      setIsLoggedIn(true);
      window.history.replaceState({}, document.title, '/');
    } else {
      const storedAccessToken = localStorage.getItem('accessToken');
      const storedRefreshToken = localStorage.getItem('refreshToken');
      if (storedAccessToken && storedRefreshToken) {
        setIsLoggedIn(true);
      }
    }
  }, []);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
  };
  const handleOnboardingInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setOnboardingData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleLogin = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/google-workspace/auth-url`);
      window.location.href = response.data.authUrl;
    } catch (error) {
      console.error('Failed to get Google login URL:', error);
      alert('Error logging in. Please try again.');
    }
  };

  const checkLoginStatus = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/google-workspace/check-login`);
      setIsLoggedIn(response.data.loggedIn);
    } catch (error) {
      setIsLoggedIn(false);
    }
  };

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const handleAction = async (action: string) => {
    try {
      const payload = {
        userIds: selectedUserIds,
        groupId: selectedGroupId,
      };
      console.log('Triggered action:', action);

      if (selectedService === 'Keycloak') {
        switch (action) {
          case 'createUser':
            await axios.post(`${API_BASE_URL}/keycloak/create-user`, userData);
            alert('User created successfully!');
            break;
          case 'createGroup':
            await axios.post(`${API_BASE_URL}/keycloak/create-group`, { groupName });
            alert('Group created successfully!');
            break;
          case 'addUsersToGroup':
            await axios.post(`${API_BASE_URL}/keycloak/add-user-to-group`, payload);
            alert('Users added to group successfully!');
            break;
          case 'removeUsersFromGroup':
            await axios.post(`${API_BASE_URL}/keycloak/remove-user-from-group`, payload);
            alert('Users removed from group successfully!');
            break;
          default:
            console.warn(`Unhandled action: ${action}`);
        }
      } else if (selectedService === 'Google Workspace') {
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
          alert('You are not logged in. Please log in to Google Workspace first.');
          return;
        }

        switch (action) {
          case 'createUser':
            await axios.post(
              `${API_BASE_URL}/google-workspace/create-user`,
              userData,
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              }
            );
            alert('User created successfully in Google Workspace!');
            break;
          case 'createGroup':
            const groupPayload = {
              email: `${groupName.toLowerCase()}@occrp.org`, // Replace with your domain
              name: groupName,
              description: 'Optional group description',
            };
            await axios.post(
              `${API_BASE_URL}/google-workspace/create-group`,
              groupPayload,
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              }
            );
            alert('Group created successfully in Google Workspace!');
            break;
          case 'addUsersToGroup':
            const addUserPayload = {
              userEmail: selectedUserIds[0], // Assuming the email is in selectedUserIds array
              groupEmail: selectedGroupId,
            };
            await axios.post(
              `${API_BASE_URL}/google-workspace/add-user-to-group`,
              addUserPayload,
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              }
            );
            alert('Users added to group successfully in Google Workspace!');
            break;
          case 'removeUsersFromGroup':
            console.log('Removing user from group:', {
              userEmail: selectedUserIds[0],
              groupEmail: selectedGroupId,
            });

            await axios.delete(
              `${API_BASE_URL}/google-workspace/remove-user-from-group`,
              {
                data: {
                  userEmail: selectedUserIds[0],
                  groupEmail: selectedGroupId,
                },
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              }
            );
            alert('User removed from group successfully!');
            break;
          default:
            console.warn(`Unhandled action: ${action}`);
        }
      }
    } catch (error) {
      console.error(`Error executing action '${action}':`, error);
      alert(`Failed to execute action: ${action}`);
    }
  };

  return (
    <div className="app-container">
      <header>
        <h1>User Management Dashboard</h1>
        {!isLoggedIn && selectedService === 'Google Workspace' && (
          <button onClick={handleLogin}>Log in with Google</button>
        )}
      </header>
      <div className="dashboard-layout">
        <ActionsSidebar onActionSelect={(action) => handleAction(action)} />
        <main className="main-content">
          <ServiceTabs selectedService={selectedService} onServiceChange={setSelectedService} />
          {selectedService === 'Keycloak' && (
            <KeycloakService
              userData={userData}
              onInputChange={handleInputChange}
              onGroupSelect={(groupId: string, groupName: string) => {
                setSelectedGroupId(groupId);
              }}
              onUserSelect={(userIds: string[]) => setSelectedUserIds(userIds)}
              onGroupNameChange={setGroupName}
            />
          )}
          {selectedService === 'Google Workspace' && (
            <GoogleWorkspaceService
              userData={userData}
              onInputChange={handleInputChange}
              onGroupNameChange={setGroupName}
              onGroupEmailChange={(email: string) => {
                setSelectedGroupId(email);
              }}
              onUserEmailChange={(email: string) => {
                setSelectedUserIds([email]);
              }}
            />
          )}
          {selectedService === 'Certify' && <CertifyService />} {/* Certify Service */}
          {selectedService === 'Onboarding' && (
  <        OnboardingService
           formData={onboardingData}
             onInputChange={handleOnboardingInputChange}
  />
)}
        </main>
      </div>
    </div>
  );
};

export default App;
