// src/components/services/GoogleWorkspaceService.tsx
import React, { ChangeEvent } from 'react';

interface GoogleWorkspaceServiceProps {
  userData: {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  onInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onGroupEmailChange: (email: string) => void; // Declare the prop
  onUserEmailChange: (email: string) => void; // Declare the prop
  onGroupNameChange: (name: string) => void;
}

const GoogleWorkspaceService: React.FC<GoogleWorkspaceServiceProps> = ({
  userData,
  onInputChange,
  onGroupEmailChange,
  onUserEmailChange,
  onGroupNameChange,
}) => {
  return (
    <div>
      <h3>Google Workspace Service</h3>

      {/* Create User Section */}
      <h4>Create User</h4>
      <div className="form">
        <input
          type="text"
          placeholder="Username"
          name="username"
          value={userData.username}
          onChange={onInputChange}
        />
        <input
          type="email"
          placeholder="Email"
          name="email"
          value={userData.email}
          onChange={onInputChange}
        />
        <input
          type="text"
          placeholder="First Name"
          name="firstName"
          value={userData.firstName}
          onChange={onInputChange}
        />
        <input
          type="text"
          placeholder="Last Name"
          name="lastName"
          value={userData.lastName}
          onChange={onInputChange}
        />
      </div>

      {/* Select User Section */}
      <h4>Select User</h4>
      <div className="form">
        <input
          type="email"
          placeholder="Add user email"
          onChange={(e) => onUserEmailChange(e.target.value)} // Properly handle the value
        />
      </div>

      {/* Select Group Section */}
      <h4>Select Group</h4>
      <div className="form">
        <input
          type="email"
          placeholder="Add group email"
          onChange={(e) => onGroupEmailChange(e.target.value)} // Properly handle the value
        />
      </div>

      {/* Create Group Section */}
      <h4>Create Group</h4>
      <div className="form">
        <input
          type="text"
          placeholder="Enter new group name"
          onChange={(e) => onGroupNameChange(e.target.value)} // Properly handle the value
        />
      </div>
    </div>
  );
};

export default GoogleWorkspaceService;
