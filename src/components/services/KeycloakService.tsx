import React, { useEffect, useState, ChangeEvent } from 'react';
import Select from 'react-select';
import axios from 'axios';

interface KeycloakServiceProps {
  userData: {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  onInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onGroupSelect: (groupId: string, groupName: string) => void;
  onUserSelect: (userIds: string[]) => void;
  onGroupNameChange: (name: string) => void;
}

const KeycloakService: React.FC<KeycloakServiceProps> = ({
  userData,
  onInputChange,
  onGroupSelect,
  onUserSelect,
  onGroupNameChange,
}) => {
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<{ id: string; name: string } | null>(null); // Track selected group

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000';

  // Fetch users and groups from the backend
  useEffect(() => {
    const fetchUsersAndGroups = async () => {
      try {
        const [usersResponse, groupsResponse] = await Promise.all([
          axios.get(`${API_BASE_URL}/keycloak/users`),
          axios.get(`${API_BASE_URL}/keycloak/groups`),
        ]);

        setUsers(
          usersResponse.data.map((user: any) => ({
            value: user.id,
            label: user.username || user.email,
          }))
        );

        setGroups(
          groupsResponse.data.map((group: any) => ({
            value: group.id,
            label: group.name,
          }))
        );
      } catch (error) {
        console.error('Error fetching users or groups:', error);
      }
    };

    fetchUsersAndGroups();
  }, []);

  // Handle Sync to Atlassian (triggered via button in ActionsSidebar)
  const handleSyncToAtlassian = async () => {
    if (!selectedGroup) {
      setSyncMessage('Please select a group before syncing to Atlassian.');
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/atlassian-scim/sync`, {
        keycloakGroupId: selectedGroup.id,
        groupName: selectedGroup.name,
      });
      setSyncMessage(response.data.message || 'Group synced successfully to Atlassian!');
    } catch (error) {
      console.error('Error syncing to Atlassian:', error);
      setSyncMessage('Failed to sync group to Atlassian. Please try again.');
    }
  };

  return (
    <div>
      <h3>Keycloak Service</h3>

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
      <Select
        options={users}
        isMulti
        onChange={(selectedOptions) =>
          onUserSelect(selectedOptions.map((option: any) => option.value))
        }
        placeholder="Search and select users"
      />

      {/* Select Group Section */}
      <h4>Select Group</h4>
      <Select
        options={groups}
        onChange={(selectedOption) => {
          if (selectedOption) {
            const groupId = (selectedOption as any).value;
            const groupName = (selectedOption as any).label;
            setSelectedGroup({ id: groupId, name: groupName }); // Set selected group
            onGroupSelect(groupId, groupName);
          }
        }}
        placeholder="Search and select a group"
      />

      {/* Sync Message */}
      {syncMessage && <div className="sync-message">{syncMessage}</div>}

      {/* Create Group Section */}
      <h4>Create Group</h4>
      <div className="form">
        <input
          type="text"
          placeholder="Enter new group name"
          onChange={(e) => onGroupNameChange(e.target.value)}
        />
      </div>

      {/* Sync Trigger */}
      <div style={{ marginTop: '20px' }}>
        <button
          onClick={handleSyncToAtlassian} // Trigger sync
          disabled={!selectedGroup} // Disable button if no group is selected
        >
          Sync to Atlassian
        </button>
      </div>
    </div>
  );
};

export default KeycloakService;
