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

export const updateJiraAssignee = async (payload, requestContext) => {
  console.log(`Payload: ${JSON.stringify(payload)}`)

  console.log("updateJiraAssignee function was called!"); // Log start
  console.log(`Received payload: ${JSON.stringify(payload)}`);

  const issueKey = payload.issueKey;
  const newAssignee = payload.newAssignee;

  if (!issueKey || !newAssignee) {
    console.log("Missing issueKey or newAssignee!");
    return { message: "Missing issue key or new assignee." };
  }

  console.log(`Updating assignee for issue ${issueKey} to ${newAssignee}`);

  const response = await api.asApp().requestJira(route`/rest/api/3/issue/${issueKey}/assignee`, {
    method: 'PUT',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      accountId: newAssignee
    })
  });

  if (response.status === 204) {
    console.log(`Successfully updated assignee for ${issueKey}`);
    return { message: `Assignee updated successfully for ${issueKey}.` };
  } else {
    const error = await response.json();
    console.error(`Failed to update assignee: ${JSON.stringify(error)}`);
    return { message: `Error updating assignee: ${JSON.stringify(error)}` };
  }
}

