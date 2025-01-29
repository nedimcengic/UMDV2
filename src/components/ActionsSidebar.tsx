import React from 'react';

type ActionsSidebarProps = {
  onActionSelect: (action: string) => void;
};

const ActionsSidebar: React.FC<ActionsSidebarProps> = ({ onActionSelect }) => (
  <div className="actions-sidebar">
    <button onClick={() => onActionSelect('createUser')}>Create User</button>
    <button onClick={() => onActionSelect('createGroup')}>Create Group</button>
    <button onClick={() => onActionSelect('addUsersToGroup')}>Add to Group</button>
    <button onClick={() => onActionSelect('removeUsersFromGroup')}>Remove from Group</button>
    <button onClick={() => onActionSelect('syncToAtlassian')}>Sync to Atlassian</button>
  </div>
);

export default ActionsSidebar;
