// src/components/UserForm.tsx
import React from 'react';

const UserForm: React.FC = () => (
  <form className="form">
    <h3>Create User</h3>
    <input type="text" placeholder="Username" />
    <input type="email" placeholder="Email" />
    <button type="submit">Submit</button>
  </form>
);

export default UserForm;
