import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './StatusWidget.css'; // Import your CSS

type ServiceStatus = {
  name: string;
  status: string;
  description: string;
};

const StatusWidget: React.FC = () => {
  const [statuses, setStatuses] = useState<ServiceStatus[]>([
    { name: 'Slack', status: 'loading', description: 'Checking status...' },
    { name: 'Atlassian', status: 'loading', description: 'Checking status...' },
    { name: 'GitHub', status: 'loading', description: 'Checking status...' },
    { name: 'Google Workspace', status: 'loading', description: 'Checking status...' }
  ]);

  const statusColors: { [key: string]: string } = {
    operational: 'status-green',
    degraded_performance: 'status-yellow',
    partial_outage: 'status-yellow',
    major_outage: 'status-red',
    loading: 'status-gray'
  };

  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const [slackRes, atlassianRes, githubRes, googleRes] = await Promise.all([
          axios.get('https://status.slack.com/api/v2.0.0/current'),
          axios.get('https://bqlf8qjztdtr.statuspage.io/api/v2/status.json'),
          axios.get('https://kctbh9vrtdwd.statuspage.io/api/v2/status.json'),
          axios.get('https://www.google.com/appsstatus/rss/en') // Google Workspace RSS feed
        ]);

        setStatuses([
          {
            name: 'Slack',
            status: slackRes.data.status,
            description: slackRes.data.status
          },
          {
            name: 'Atlassian',
            status: atlassianRes.data.status.indicator,
            description: atlassianRes.data.status.description
          },
          {
            name: 'GitHub',
            status: githubRes.data.status.indicator,
            description: githubRes.data.status.description
          },
          {
            name: 'Google Workspace',
            status: googleRes.data.includes("up") ? 'operational' : 'degraded_performance',
            description: googleRes.data.includes("up") ? 'Operational' : 'Issue Detected'
          }
        ]);
      } catch (error) {
        console.error("Error fetching service statuses:", error);
      }
    };

    fetchStatuses();
    const interval = setInterval(fetchStatuses, 60000); // Refresh every minute

    return () => clearInterval(interval); // Clean up on component unmount
  }, []);

  return (
    <div className="status-widget">
      <h3>Service Status</h3>
      <ul>
        {statuses.map(service => (
          <li key={service.name} className="status-item">
            <span className={`status-indicator ${statusColors[service.status] || 'status-gray'}`}></span>
            <span className="service-name">{service.name}</span>
            <span className="description">{service.description}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default StatusWidget;
