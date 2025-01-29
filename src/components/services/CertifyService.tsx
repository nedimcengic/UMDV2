import React, { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:4000";

const CertifyService: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    managerEmail: '',
    department: '',
    role: '',
  });

  const [loading, setLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const departments = [
    { id: "49ee9eb3-c616-4376-886b-415f4e304794", name: "Core Administration" },
    { id: "97f243a2-ffb3-46db-88a5-bfceb9b9ebd2", name: "Editorial" },
    { id: "ac4b19b8-bad1-4420-8248-e821c628947d", name: "HR" },
    { id: "ab875cb9-7912-4d5e-b709-526ad90868ce", name: "IT Admin" },
    { id: "3342b79c-a03a-4eb7-a238-fe6dcb43be5a", name: "Partnerships" },
    { id: "732829b7-f628-494a-b179-76a3d5334387", name: "Programs" },
    { id: "6f5a0b10-4bd6-4023-99bc-f4e8dadccecd", name: "IT Products" },
    { id: "1d61434a-7e3f-4495-bc5e-9a4e7f23c80a", name: "zz_DO_NOT_USE_zz" },
    { id: "9155d082-338c-47e9-80cb-0b806f666e82", name: "Finance" },
    { id: "504728fd-f4fa-4405-8fcc-2bf8b8414e4b", name: "Reporters Shield" }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.email || !formData.firstName || !formData.department) {
      setFeedbackMessage("Email, First Name, and Department are required.");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setFeedbackMessage(null);
    setLoading(true);

    try {
      const payload = {
        Email: formData.email,
        FirstName: formData.firstName,
        LastName: formData.lastName,
        ManagerEmail: formData.managerEmail || null,
        DepartmentID: formData.department,
        Role: formData.role || null,
        SendWelcomeEmail: 1,
        Active: 1,
        EmpGLD1ID: 'e25f084f-2a58-43dc-9586-9ed9ffd57f7a',
      };

      const response = await axios.post(`${API_BASE_URL}/certify/upsert-user`, payload);

      if (response.status === 200) {
        setFeedbackMessage("User created successfully!");
      } else {
        setFeedbackMessage("User creation succeeded, but response was unexpected.");
      }

      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        managerEmail: '',
        department: '',
        role: '',
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Failed to upsert user. Please try again.";
      setFeedbackMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="service-content">
      <h3>Certify Service</h3>

      {feedbackMessage && (
        <div className={`feedback-message ${feedbackMessage.includes('failed') ? 'error' : 'success'}`}>
          {feedbackMessage}
        </div>
      )}

      <form className="form">
        <h4>User Details</h4>
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleInputChange}
        />
        <input
          type="text"
          name="firstName"
          placeholder="First Name"
          value={formData.firstName}
          onChange={handleInputChange}
        />
        <input
          type="text"
          name="lastName"
          placeholder="Last Name"
          value={formData.lastName}
          onChange={handleInputChange}
        />
        <input
          type="email"
          name="managerEmail"
          placeholder="Manager Email"
          value={formData.managerEmail}
          onChange={handleInputChange}
        />
        <select
          name="department"
          value={formData.department}
          onChange={handleInputChange}
        >
          <option value="">Select Department</option>
          {departments.map((dept) => (
            <option key={dept.id} value={dept.id}>
              {dept.name}
            </option>
          ))}
        </select>
        <input
          type="text"
          name="role"
          placeholder="Role"
          value={formData.role}
          onChange={handleInputChange}
        />
      </form>

      <button type="button" onClick={handleSubmit} disabled={loading}>
        {loading ? "Submitting..." : "Submit"}
      </button>
    </div>
  );
};

export default CertifyService;
