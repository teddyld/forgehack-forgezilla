import api, { route } from '@forge/api';

const mockData = {
  "manager": {
    "id": "001",
    "name": "Lily S."
  },
  "tickets": [
    {
      "ticketId": "123",
      "title": "Fix login authentication bug",
      "type": "bug",
      "priority": "high",
      "requiredSkills": ["JavaScript", "OAuth"],
      "status": "open",
      "estimatedEffort": 5
    },
    {
      "ticketId": "124",
      "title": "Implement new reporting dashboard",
      "type": "feature",
      "priority": "medium",
      "requiredSkills": ["React", "GraphQL"],
      "status": "open",
      "estimatedEffort": 12
    }
  ],
  "engineers": [
    {
      "engineerId": "001",
      "name": "Alice Johnson",
      "skills": ["JavaScript", "React", "GraphQL"],
      "pastTickets": ["101", "102"],
      "currentWorkload": 15,
      "availability": false,
      "collaborationPatterns": ["002", "003"],
      "githubContributions": {
        "JavaScript": 120,
        "React": 80,
        "GraphQL": 50
      }
    },
    {
      "engineerId": "002",
      "name": "Bob Smith",
      "skills": ["JavaScript", "Node.js", "OAuth"],
      "pastTickets": ["TICKET-103", "TICKET-104"],
      "currentWorkload": 5,
      "availability": true,
      "collaborationPatterns": ["001", "004"],
      "githubContributions": {
        "JavaScript": 90,
        "Node.js": 70,
        "OAuth": 30
      }
    }
  ]
}

export const getTeamResources = async (payload, requestContext) => {
  console.log(JSON.stringify(payload.context))
  console.log(`Request Context: ${JSON.stringify(requestContext)}`);

  // const projectKey = payload.context.jira.projectKey;
  // console.log(`Fetching current team resources for project: ${projectKey}`);

  return mockData
}