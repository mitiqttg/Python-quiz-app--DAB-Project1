import * as programmingAssignmentService from "./services/programmingAssignmentService.js";
import * as programmingSubmissionService from "./services/programmingSubmissionService.js";
import { serve } from "./deps.js";
import { sql } from "./database/database.js";
import { createClient } from "./deps.js";
import { cacheMethodCalls } from "./util/cacheUtil.js";

const cachedAssignmentService = cacheMethodCalls(programmingAssignmentService, []);
const cachedSubmissionService = cacheMethodCalls(programmingSubmissionService, ["addSubmission", "addGraderResults"]);

const graderClient = createClient({
  url: "redis://redis:6379",
  pingInterval: 1000,
});

await graderClient.connect();
await graderClient.subscribe(
  "grade-results",
  (message, channel) => handleGradeResultReceived(message, channel),
);

const handleGradeResultReceived = async (message, channel) => {
  const graderResult = JSON.parse(message);

  let correct = false;

  if (graderResult.result.includes("\nOK")) {
    correct = true;
  }
  
  await cachedSubmissionService.addGraderResultsToSubmission(graderResult.id, graderResult.result, correct);
}

const handleRequest = async (request) => {
  const programmingAssignments = await programmingAssignmentService.findAll();

  const requestData = await request.json();
  const testCode = programmingAssignments[0]["test_code"];
  const data = {
    testCode: testCode,
    code: requestData.code,
  };

  const response = await fetch("http://grader-api:7000/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return response;
};

const portConfig = { port: 7777, hostname: "0.0.0.0" };
serve(handleRequest, portConfig);
