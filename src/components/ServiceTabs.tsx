// src/components/ServiceTabs.tsx
import React from 'react';

type ServiceTabsProps = {
  selectedService: string;
  onServiceChange: (service: string) => void;
};

const ServiceTabs: React.FC<ServiceTabsProps> = ({ selectedService, onServiceChange }) => {
  const services = ['Keycloak', 'Google Workspace', 'Certify', 'Onboarding'];

  return (
    <div className="service-tabs">
      {services.map((service) => (
        <button
          key={service}
          className={service === selectedService ? 'tab-active' : ''}
          onClick={() => onServiceChange(service)}
        >
          {service}
        </button>
      ))}
    </div>
  );
};

export default ServiceTabs;
