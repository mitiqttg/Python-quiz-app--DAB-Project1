The application is divided into four main components and the database. The components are:

- Programming-ui:
  A system that controls the browser UI and allows user input. When a user creates a submission, programming-ui sends it to programming-api as a POST request.
  After submitting an assignment, programming-ui sends a GET request for submission feedback to programming-api every second until feedback is received.

- Programming-api:
  A system that receives user submissions and provides programming-ui with the correct assignments and submission feedback for each user. 
  Programming-api communicates with the database for saving user submissions and grader results and fetching assignments.
  When receiving new submission, programming-api checks if they need to be graded, and sends the submission to grader-api as a POST request if grading is needed.

- Grader-api:
  A system that receives ungraded submissions and sends them to grader-image one at a time.
  When grading is done in grader-image, grader-api sends the results as a ping on a channel that is listened to by programming-api. This is done with a Reids client.

- Grader-image: 
  An image that takes a program submission, runs it and compares the result to a model solution, and provides feedback on if the submission was correct or not.


Possible improvements:
- Currently, by far the slowest function of the application is grading submissions. This could be sped up by improving the grader-image as well as
  creating more replicas of grader-api and grader-image to improve simultaneous grading.
- Programming-ui could be improved so that it better utilizes static content
- Caching in all parts of the application could be improved so that it's better defined which data should be cached and for how long.