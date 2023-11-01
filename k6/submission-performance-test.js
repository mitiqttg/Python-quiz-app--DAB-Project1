import http from "k6/http";

export const options = {
    duration: "5s",
    vus: 10,
    summaryTrendStats: ["avg", "p(99)"]
};

export default function () {

  const data = {
      assignmentID: 1,
      user: 1,
      code: "def hello():\nreturn 'Hello';",
  };

  http.get("http://localhost:7800");
  http.post(
    "http://localhost:7800/api/submit",
    JSON.stringify(data))
}