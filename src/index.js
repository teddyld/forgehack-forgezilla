import api, { route } from '@forge/api';

const customFieldsMapToLabel = {
  "customfield_10038": "Type",
  "customfield_10037": "Skills"
}

export const getTeamResources = async (payload, requestContext) => {
  // console.log(`Payload: ${JSON.stringify(payload)}`);
  // console.log(`Request Context: ${JSON.stringify(requestContext)}`);

  const projectKey = payload.projectKey ? payload.projectKey : null;

  const response = await api.asApp().requestJira(route`/rest/api/3/search?jql=project=${projectKey}`);
  const data = await response.json();
  const issuesData = await extractIssueDetails(data)

  return issuesData
}

const extractIssueDetails = async (data) => {
  return data.issues.map(issue => {
    const customFields = {
      "Type": "None",
      "Skills": [],
    }

    for (const customField in customFieldsMapToLabel) {
      if (customField in issue.fields) {
        const label = customFieldsMapToLabel[customField]

        if (label == "Type") {
          customFields[label] = issue.fields[customField].value
        } else if (label == "Skills") {
          if (issue.fields[customField] === "N/A") continue
          customFields[label] = issue.fields[customField].split(",").map((skill) => skill.trim())
        } else {
          console.log("The provided label has not been implemented")
        }
      }
    }

    return {
      key: issue.key,
      title: issue.fields.summary,
      assignee: issue.fields.assignee ? 
        issue.fields.assignee.displayName : "None",
      status: issue.fields.status.name,
      priority: issue.fields.priority.name,
      ...customFields
    }
  });
}