// src/components/GroupForm.tsx
import React from 'react';

const GroupForm: React.FC = () => (
  <form className="form">
    <h3>Create Group</h3>
    <input type="text" placeholder="Group Name" />
    <button type="submit">Create Group</button>
  </form>
);

export default GroupForm;
