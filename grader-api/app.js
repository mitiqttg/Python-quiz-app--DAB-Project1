import { serve } from "./deps.js";
import { grade } from "./services/gradingService.js";
import { Queue } from "./src/Queue.js";
import { createClient } from "./deps.js";

const client = createClient({
  url: "redis://redis:6379",
  pingInterval: 1000,
})

await client.connect();

let GradingQueue = new Queue();

const handleRequest = async (request) => {

  const requestData = await request.json();

  GradingQueue.enqueue(requestData);
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

  while (GradingQueue.length > 0) {
    
    try {

      const gradeData = GradingQueue.dequeue();

      console.log("Grading submission:");
      console.log(gradeData);
  
      const code = gradeData.code;
      const testCode = gradeData.testCode;
      const id = gradeData.id;
  
      client.publish("grade-results", JSON.stringify({ id: id, result: await grade(code, testCode) }));

    } catch (e) {
      console.log("Grading error")
    }    
  }

  InGrading = false;

}

const portConfig = { port: 7000, hostname: "0.0.0.0" };
serve(handleRequest, portConfig);
