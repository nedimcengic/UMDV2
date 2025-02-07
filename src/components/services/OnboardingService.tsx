import React, { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  role: string;
  managerEmail: string;
}

const departments = [
  { id: '49ee9eb3-c616-4376-886b-415f4e304794', name: 'Core Administration' },
  { id: '97f243a2-ffb3-46db-88a5-bfceb9b9ebd2', name: 'Editorial' },
  { id: 'ac4b19b8-bad1-4420-8248-e821c628947d', name: 'HR' },
  { id: 'ab875cb9-7912-4d5e-b709-526ad90868ce', name: 'IT Admin' },
  { id: '3342b79c-a03a-4eb7-a238-fe6dcb43be5a', name: 'Partnerships' },
  { id: '732829b7-f628-494a-b179-76a3d5334387', name: 'Programs' },
  { id: '6f5a0b10-4bd6-4023-99bc-f4e8dadccecd', name: 'IT Products' },
  { id: '9155d082-338c-47e9-80cb-0b806f666e82', name: 'Finance' },
  { id: '504728fd-f4fa-4405-8fcc-2bf8b8414e4b', name: 'Reporters Shield' },
];

interface OnboardingServiceProps {
  formData: FormData;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

const OnboardingService: React.FC<OnboardingServiceProps> = ({ formData, onInputChange }) => {

  const [selectedServices, setSelectedServices] = useState({
    keycloak: false,
    googleWorkspace: false,
    certify: false,
  });

  const [selectedGoogleGroups, setSelectedGoogleGroups] = useState({
    staff: false,
    internalComms: false,
  });

  const [loading, setLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    onInputChange(e);  // Use the passed prop instead of setFormData
  };
 

  const handleServiceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setSelectedServices((prevServices) => ({ ...prevServices, [name]: checked }));
  };

  const handleGroupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setSelectedGoogleGroups((prevGroups) => ({ ...prevGroups, [name]: checked }));
  };

  const validateForm = () => {
    if (!formData.firstName || !formData.lastName || !formData.email) {
      setFeedbackMessage('First Name, Last Name, and Email are required.');
      return false;
    }

    if (selectedServices.certify && (!formData.department || !formData.role)) {
      setFeedbackMessage('Department and Role are required for Certify.');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email) {
      setFeedbackMessage('First Name, Last Name, and Email are required.');
      return;
    }
  
    setFeedbackMessage(null);
    setLoading(true);
  
    try {
      const promises = [];
  
      // ✅ Google Workspace User Creation
      if (selectedServices.googleWorkspace) {
        const googleWorkspacePayload = {
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
        };
        console.log("Google Workspace Payload:", googleWorkspacePayload);
  
        promises.push(axios.post(`${API_BASE_URL}/google-workspace/create-user`, googleWorkspacePayload));
      }
  
      // ✅ Keycloak User Creation
      if (selectedServices.keycloak) {
        const keycloakPayload = {
          username: formData.email.split('@')[0], // Extract username from email
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          enabled: true,
        };
        console.log("Keycloak Payload:", keycloakPayload);
  
        promises.push(axios.post(`${API_BASE_URL}/keycloak/create-user`, keycloakPayload));
      }
  
      // ✅ Certify User Creation
      if (selectedServices.certify) {
        const certifyPayload = {
          Email: formData.email,
          FirstName: formData.firstName,
          LastName: formData.lastName,
          ManagerEmail: formData.managerEmail || null,
          DepartmentID: formData.department || null,
          Role: formData.role || null,
          SendWelcomeEmail: 1,
          Active: 1,
          EmpGLD1ID: 'e25f084f-2a58-43dc-9586-9ed9ffd57f7a', // Example identifier
        };
        console.log("Certify Payload:", certifyPayload);
  
        promises.push(axios.post(`${API_BASE_URL}/certify/upsert-user`, certifyPayload));
      }
  
      await Promise.all(promises);
      console.log("All selected services processed successfully!");
  
      setFeedbackMessage("Onboarding completed successfully!");
    } catch (error: any) {
      console.error("Error during onboarding:", error.response?.data || error.message);
      setFeedbackMessage("Onboarding failed. Please check the details.");
    } finally {
      setLoading(false);
    }
  };
  
  
  return (
    <div className="service-content">
      <h3>Onboarding Service</h3>

      {feedbackMessage && (
        <div className={`feedback-message ${feedbackMessage.includes('failed') ? 'error' : 'success'}`}>
          {feedbackMessage}
        </div>
      )}

      <form className="form">
        <h4>User Details</h4>
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
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleInputChange}
        />
        <select
          name="department"
          value={formData.department}
          onChange={handleInputChange}
          disabled={!selectedServices.certify}
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
          placeholder="Role (Required for Certify)"
          value={formData.role}
          onChange={handleInputChange}
          disabled={!selectedServices.certify}
        />
        <input
          type="email"
          name="managerEmail"
          placeholder="Manager Email (Optional)"
          value={formData.managerEmail}
          onChange={handleInputChange}
        />
      </form>

      <form className="form">
        <h4>Select Services for Onboarding</h4>
        <label>
          <input
            type="checkbox"
            name="keycloak"
            checked={selectedServices.keycloak}
            onChange={handleServiceChange}
          />
          Keycloak
        </label>
        <label>
          <input
            type="checkbox"
            name="googleWorkspace"
            checked={selectedServices.googleWorkspace}
            onChange={handleServiceChange}
          />
          Google Workspace
        </label>
        <label>
          <input
            type="checkbox"
            name="certify"
            checked={selectedServices.certify}
            onChange={handleServiceChange}
          />
          Certify
        </label>
      </form>

      <form className="form">
        <h4>Google Groups</h4>
        <label>
          <input
            type="checkbox"
            name="staff"
            checked={selectedGoogleGroups.staff}
            onChange={handleGroupChange}
            disabled={!selectedServices.googleWorkspace}
          />
          staff@occrp.org
        </label>
        <label>
          <input
            type="checkbox"
            name="internalComms"
            checked={selectedGoogleGroups.internalComms}
            onChange={handleGroupChange}
            disabled={!selectedServices.googleWorkspace}
          />
          internal.comms@occrp.org
        </label>
      </form>

      <button type="button" onClick={handleSubmit} disabled={loading}>
        {loading ? 'Submitting...' : 'Submit Onboarding'}
      </button>
    </div>
  );
};

export default OnboardingService;