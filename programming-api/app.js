import * as programmingAssignmentService from "./services/programmingAssignmentService.js";
import * as programmingSubmissionService from "./services/programmingSubmissionService.js"
import { cacheMethodCalls } from "./util/cacheUtil.js";
import { createClient, serve } from "./deps.js";

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
  
  await cachedSubmissionService.addGraderResults(graderResult.id, graderResult.result, correct);
}

//--------Request handling--------//

const handleRequest = async (request) => {

  const mapping = urlMapping.find(
    (um) => um.method === request.method && um.pattern.test(request.url)
  );

  if (!mapping) {
    return new Response("Not found", { status: 404 });
  }

  const mappingResult = mapping.pattern.exec(request.url);
  return await mapping.fn(request, mappingResult);
};

const getNextAssignmentForUser = async (request, urlPatternResult) => {

  const userId = urlPatternResult.pathname.groups.user;

  // Find all assignments
  const programmingAssignments = await cachedAssignmentService.findAll();

  // Find submissions by user
  const submissions = await cachedSubmissionService.findAllFromUser(userId);

  // Filter complete and correct submissions
  const correctSubmissions = submissions.filter(sub => sub.correct === true);

  let assignmentNumber = 1;
  correctSubmissions.forEach(sub => {
    const assignment = programmingAssignments.find(assignment => assignment.id === sub.programming_assignment_id);
    // If the assignment is graded correct, move to the next assignment
    if (assignment.assignment_order === assignmentNumber) {
      assignmentNumber++;
    }
  });

  const nextAssignment = programmingAssignments.find(assignment => assignment.assignment_order === assignmentNumber);

  const response = {
    title: "",
    handout: "",
    id: "",
  }

  if (nextAssignment) {
    response.title = nextAssignment.title;
    response.handout = nextAssignment.handout;
    response.id = nextAssignment.id;
  }

  return Response.json(response);
}

const getUserPoint = async (request, urlPatternResult) => {
  const user = urlPatternResult.pathname.groups.user;

  const userSubmissions = await cachedSubmissionService.findAllFromUser(user);
  const correctSubmissions = userSubmissions.filter(sub => sub.correct === true);

  let correctIds = [];
  correctSubmissions.forEach(sub => {
    if (!correctIds.includes(sub.programming_assignment_id)) {
      correctIds = [sub.programming_assignment_id, ...correctIds];
    }
  })

  return Response.json({
    points: 100 * correctIds.length,
  });
}


const handleFeedback = async (request, urlPatternResult) => {

  const id = urlPatternResult.pathname.groups.submissionId;

  const submissions = await cachedSubmissionService.findAllSubmissions();
  if (submissions.length === 0) {
    return new Response("Not found", { status: 404 });
  }

  const submission = submissions.find(sub => sub.id === Number(id));
  if (!submission) {
    return new Response("Not found", { status: 404 });
  }

  const response = {
    status: submission.status,
    feedback: submission.grader_feedback,
    correct: submission.correct,
  }

  return Response.json(response);
}

//--------Submitting assignment--------//

const handleSubmitAssignment = async (request) => {

  const submissionData = await request.json();

  if (!submissionData.assignmentID || !submissionData.code || !submissionData.user) {
    return new Response("Bad Request", { status: 400 });
  }

  // Check if user has a submission in grading
  const userSubmissions = await cachedSubmissionService.findAllFromUser(submissionData.user);
  const pendingSubmission = userSubmissions.find(sub => sub.status === "pending");
  if (pendingSubmission) {
    return Response.json({
      id: -1
    });
  }

  const addResult = await cachedSubmissionService.addSubmission(submissionData);
  submissionData.id = addResult[0].id;

  // Check if identical code has been submitted
  const allSubmissions = await cachedSubmissionService.findAllFromAssignment(submissionData.assignmentID);

  let shouldSendToGrader = true;

  if (allSubmissions.length !== 0) {
    
    allSubmissions.every(oldSubmission => {
      if (oldSubmission.code === submissionData.code && oldSubmission.status === "processed") {
        submissionData.status = oldSubmission.status;
        submissionData.grader_feedback = oldSubmission.grader_feedback;
        submissionData.correct = oldSubmission.correct;
        shouldSendToGrader = false; 
        return false;
      }
      return true;
    });
  }

  const response = {
    id: submissionData.id
  }
  
  // If grade found, add graded submission
  if (!shouldSendToGrader) {
    cachedSubmissionService.addGraderResults(submissionData.id, submissionData.grader_feedback, submissionData.correct);
    return Response.json(response);
  }

  // Send submission to grader
  sendToGrader(submissionData);
  return Response.json(response);
}

const sendToGrader = async (submissionData) => {

  // Get testcode for the assignment
  const programmingAssignments = await cachedAssignmentService.findAnAssignment(submissionData.assignmentID);
  if (programmingAssignments.length === 0) {
    return new Response("Bad request", { status: 400 });
  }

  const testCode = programmingAssignments[0]["test_code"];

  // Send data to grader

  const data = {
    testCode: testCode,
    code: submissionData.code,
    id: submissionData.id,
  };

  fetch("http://nginx:8000/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return new Response("OK", { status: 200 });
}


const urlMapping = [
  {
    method: "POST",
    pattern: new URLPattern({ pathname: "/submit" }),
    fn: handleSubmitAssignment,
  },
  {
    method: "GET",
    pattern: new URLPattern({ pathname: "/next/:user" }),
    fn: getNextAssignmentForUser,
  },
  {
    method: "GET",
    pattern: new URLPattern({ pathname: "/points/:user" }),
    fn: getUserPoint,
  },
  {
    method: "GET",
    pattern: new URLPattern({ pathname: "/feedback/:submissionId" }),
    fn: handleFeedback,
  },
];

const portConfig = { port: 7777, hostname: "0.0.0.0" };
serve(handleRequest, portConfig);
