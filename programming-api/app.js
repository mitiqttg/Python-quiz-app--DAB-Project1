import * as programmingAssignmentService from "./services/programmingAssignmentService.js";
import * as programmingSubmissionService from "./services/programmingAssignmentSubmissionService.js"
import { serve } from "./deps.js";
import { createClient } from "./deps.js";
import { cacheMethodCalls } from "./util/cacheUtil.js";

const cachedAssignmentService = cacheMethodCalls(programmingAssignmentService, []);
const cachedSubmissionService = cacheMethodCalls(programmingSubmissionService, ["addSubmission", "addGraderResultsToSubmission"]);

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

const handleGetNextAssignmentForUser = async (request, urlPatternResult) => {

  const userId = urlPatternResult.pathname.groups.user;

  //Find all assignments
  const programmingAssignments = await cachedAssignmentService.findAll();

  //Find submissions by user
  const submissions = await cachedSubmissionService.findAllForUser(userId);

  //Filter complete and correct submissions
  const correctSubmissions = submissions.filter(s => s.correct === true);

  let nextAssignmentOrder = 1;
  correctSubmissions.forEach(s => {
    const assignment = programmingAssignments.find(a => a.id === s.programming_assignment_id);
    if (assignment.assignment_order === nextAssignmentOrder) {
      //user has done this assignment correctly, move to the next assignment
      nextAssignmentOrder++;
    }
  });

  const nextAssignment = programmingAssignments.find(a => a.assignment_order === nextAssignmentOrder);

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

const handleFetchUserPoints = async (request, urlPatternResult) => {
  const user = urlPatternResult.pathname.groups.user;

  const userSubmissions = await cachedSubmissionService.findAllForUser(user);
  const correctSubmissions = userSubmissions.filter(s => s.correct === true);

  let correctIds = [];
  correctSubmissions.forEach(s => {
    if (!correctIds.includes(s.programming_assignment_id)) {
      correctIds = [s.programming_assignment_id, ...correctIds];
    }
  })

  return Response.json({
    points: 100 * correctIds.length,
  });
}


const handleFetchFeedback = async (request, urlPatternResult) => {

  const id = urlPatternResult.pathname.groups.submissionId;

  const submissions = await cachedSubmissionService.findAllSubmissions();
  if (submissions.length === 0) {
    return new Response("Not found", { status: 404 });
  }

  const submission = submissions.find(s => s.id === Number(id));
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

  //check if user has a submission in grading
  const userSubmissions = await cachedSubmissionService.findAllForUser(submissionData.user);
  const pendingSubmission = userSubmissions.find(s => s.status === "pending");
  if (pendingSubmission) {
    console.log("previous submission still in grading");
    return Response.json({
      id: -1
    });
  }

  const addResult = await cachedSubmissionService.addSubmission(submissionData);
  submissionData.id = addResult[0].id;

  //check if identical code has been submitted
  const allSubmissions = await cachedSubmissionService.findAllForAssignment(submissionData.assignmentID);

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
  
  //If grade found, add graded submission
  if (!shouldSendToGrader) {
    cachedSubmissionService.addGraderResultsToSubmission(submissionData.id, submissionData.grader_feedback, submissionData.correct);
    return Response.json(response);
  }

  //Send submission to grader
  sendToGrader(submissionData);
  return Response.json(response);
}

const sendToGrader = async (submissionData) => {

  //Get testcode for the assignment
  const programmingAssignments = await cachedAssignmentService.findOne(submissionData.assignmentID);
  if (programmingAssignments.length === 0) {
    return new Response("Bad Request", { status: 400 });
  }

  const testCode = programmingAssignments[0]["test_code"];

  //Send data to grader

  const data = {
    testCode: testCode,
    code: submissionData.code,
    id: submissionData.id,
  };

  //console.log("sending to grader");
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
    fn: handleGetNextAssignmentForUser,
  },
  {
    method: "GET",
    pattern: new URLPattern({ pathname: "/points/:user" }),
    fn: handleFetchUserPoints,
  },
  {
    method: "GET",
    pattern: new URLPattern({ pathname: "/feedback/:submissionId" }),
    fn: handleFetchFeedback,
  },
];

const portConfig = { port: 7777, hostname: "0.0.0.0" };
serve(handleRequest, portConfig);
