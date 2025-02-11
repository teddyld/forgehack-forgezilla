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
      accountId: issue.fields.assignee ? 
        issue.fields.assignee.accountId : "None",
      status: issue.fields.status.name,
      priority: issue.fields.priority.name,
      ...customFields
    }
  });
}

const getJiraUsersByQuery = async (query) => {
  // console.log(`Searching for Jira users with query: ${query}`);

  try {
    const response = await api.asUser().requestJira(route`/rest/api/3/user/search?query=${query}`);
    const users = await response.json();

    if (!response.ok) {
      console.error(`Failed to fetch users: ${JSON.stringify(users)}`);
      return [];
    }

    return users.map(user => ({
      accountId: user.accountId,
      displayName: user.displayName,
      emailAddress: user.emailAddress || "N/A"
    }));
  } catch (error) {
    console.error(`Error in getJiraUsersByQuery: ${error.message}`);
    return [];
  }
};


export const updateJiraAssignee = async (payload, requestContext) => {
  console.log("🔹 Updating Jira Assignee - Payload:", payload);

  const { issueKey, newAssignee } = payload;

  if (!issueKey || !newAssignee) {
    console.log("❌ Missing issueKey or newAssignee!");
    return {
      status: "error",
      message: "❌ Missing required parameters.",
      errorDetails: { issueKey, newAssignee }
    };
  }

  const users = await getJiraUsersByQuery(newAssignee);
  if (!users.length) {
    console.log(`❌ User ${newAssignee} not found in Jira.`);
    return {
      status: "error",
      message: "❌ Invalid assignee. No matching Jira user found.",
      errorDetails: { issueKey, attemptedAssignee: newAssignee }
    };
  }

  const validUser = users.find(user => user.displayName === newAssignee);
  if (!validUser) {
    console.log(`❌ Error: User ${newAssignee} is not a valid Jira user.`);
    return {
      status: "error",
      message: "❌ Invalid assignee. User does not exist in Jira.",
      errorDetails: { issueKey, attemptedAssignee: newAssignee }
    };
  }

  console.log(`✅ User ${validUser.displayName} (${validUser.accountId}) is valid. Proceeding with update.`);

  try {
    const response = await api.asUser().requestJira(route`/rest/api/3/issue/${issueKey}/assignee`, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ accountId: validUser.accountId })
    });

    console.log(`🔹 Response Status: ${response.status}`);
    console.log(`🔹 Response Headers: ${JSON.stringify(response.headers)}`);
    const responseBody = await response.text();
    console.log(`🔹 Response Body: ${responseBody}`);

    if (response.status === 204) {
      console.log(`✅ Successfully updated assignee for ${issueKey}`);
      return {
        status: "success",
        message: "✅ Assignee updated successfully!",
        details: {
          issueKey,
          newAssignee: validUser.displayName
        }
      };
    } else {
      console.error(`❌ Failed to update assignee: ${responseBody}`);
      return {
        status: "error",
        message: `❌ Error updating assignee: ${responseBody}`,
        errorDetails: { issueKey, attemptedAssignee: newAssignee, responseBody }
      };
    }
  } catch (error) {
    console.error(`❌ Exception in updateJiraAssignee: ${error.message}`);
    return {
      status: "error",
      message: `❌ Exception: ${error.message}`,
      errorDetails: { issueKey, attemptedAssignee: newAssignee }
    };
  }
};

export const createComment = async (payload, requestContext) => {
  const { issueIdOrKey, content } = payload

  console.log("Payload", payload)

  if (!issueIdOrKey || !content) {  
    return { message: "Could not post your comment because a valid issue id or key was not passed or no comment was provided" }
  }

  const bodyData = {
    "version": 1,
    "type": "doc",
    "content": [
      {
        "content": [
          {
            "text": content,
            "type": "text"
          }
        ],
        "type": "paragraph"
      }
    ]
  }

  const response = await api.asUser().requestJira(route`/rest/api/3/issue/${issueIdOrKey}/comment`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(bodyData)
  });

  console.log(`Response: ${response.status} ${response.statusText}`);
  console.log(await response.json());

  return { message: "Comment successfully created" }
}