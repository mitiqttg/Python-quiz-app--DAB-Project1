Description of the application:

- Grader-api:
  Processes submissions and grade them one by one in a grader-image. When      completed the grading process, sends the results as a notification through a channel. The programming-api listens to this channel and receives the results using a Redis client.

- Grader-image: 
  Receives a program submission, executes it, compares the output to a model solution, and feedbacks on the submission correctness.

- Programming-ui:
  Takes care of the browser UI. When a user make a submission, programming-ui sends a POST request to programming-api. After submitted, programming-ui sends a GET request to programming-api until feedback is received.

- Programming-api:
  Receives user submissions and sends programming-ui assignments and feedbacks. Programming-api queries the database to store user submissions/grader results and to retrieve assignments. When receiving new submissions, programming-api assesses whether they require grading and, if necessary, forwards the submission to grader-api using a POST request.

Possible improvements:

+ Utilizes static content for programming-ui.
    
+ Improving the grader-image and creating more replicas of grader-api and grader-image to improve parallel grading.