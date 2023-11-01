import { makeQueue } from "./src/makeQueue.js";
import { serve, createClient } from "./deps.js";
import { grade } from "./services/gradingService.js";

const client = createClient({
  url: "redis://redis:6379",
  pingInterval: 1000,
})

await client.connect();

let gradingQueue = new makeQueue();

const handleRequest = async (request) => {

  const requestData = await request.json();

  gradingQueue.enqueue(requestData);
  StartGrading();
  return new Response("OK", { status: 200 });

};

let InGrading = false;

const StartGrading = async() => {

  //If grading is already in progress, don't start another one
  if (InGrading) {
    return;
  }

  InGrading = true;

  while (gradingQueue.length > 0) {   
    try {
      const gradeData = gradingQueue.dequeue();
      const id = gradeData.id;
      const code = gradeData.code;
      const testCode = gradeData.testCode;
  
      client.publish("grade-results", JSON.stringify({ id: id, result: await grade(code, testCode) }));

    } catch (e) {
      console.log("Grading error")
    }    
  }
  InGrading = false;
}

const portConfig = { port: 7000, hostname: "0.0.0.0" };
serve(handleRequest, portConfig);
