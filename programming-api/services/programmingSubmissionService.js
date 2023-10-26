import { sql } from "../database/database.js";
  
const findAllFromUser = async (userId) => {
  return await sql`SELECT * FROM programming_assignment_submissions WHERE user_uuid = ${userId};`;
}

const findAllFromAssignment = async (assignmentId) => {
  return await sql`SELECT * FROM programming_assignment_submissions WHERE programming_assignment_id = ${assignmentId};`;
}

const findAllSubmissions = async () => {
    return await sql`SELECT * FROM programming_assignment_submissions;`;
};

const addSubmission = async (submission) => {
    return await sql`INSERT INTO programming_assignment_submissions ( programming_assignment_id, code, user_uuid ) 
                        VALUES ( ${submission.assignmentID}, ${submission.code}, ${submission.user} ) RETURNING id;`
}

const clearSubmissions = async () => {
  return await sql`DELETE FROM programming_assignment_submissions`;
}

const addGraderResults = async (submissionId, result, correctness) => {
    return await sql`UPDATE programming_assignment_submissions 
                      SET grader_feedback = ${result},
                        correct = ${correctness},
                        status = ${'processed'}
                      WHERE id = ${submissionId}`
}

export { findAllSubmissions, findAllFromUser, findAllFromAssignment, addGraderResults, addSubmission, clearSubmissions };