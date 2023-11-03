(1) Measuring the performance of loading the assignment page:
   
k6 run load-page-performance-test.js

          /\      |‾‾| /‾‾/   /‾‾/
     /\  /  \     |  |/  /   /  /
    /  \/    \    |     (   /   ‾‾\
   /          \   |  |\  \ |  (‾)  |
  / __________ \  |__| \__\ \_____/ .io

  execution: local
     script: load-page-performance-test.js
     output: -

  scenarios: (100.00%) 1 scenario, 10 max VUs, 35s max duration (incl. graceful stop):
           * default: 10 looping VUs for 5s (gracefulStop: 30s)


     data_received..................: 57 MB  11 MB/s
     data_sent......................: 1.1 MB 226 kB/s
     http_req_blocked...............: avg=8.01µs  p(99)=0s
     http_req_connecting............: avg=971ns   p(99)=0s
     http_req_duration..............: avg=3.45ms  p(99)=21.4ms
       { expected_response:true }...: avg=3.45ms  p(99)=21.4ms
     http_req_failed................: 0.00%  ✓ 0           ✗ 14123
     http_req_receiving.............: avg=63.88µs p(99)=775.27µs
     http_req_sending...............: avg=12.38µs p(99)=519.83µs
     http_req_tls_handshaking.......: avg=0s      p(99)=0s
     http_req_waiting...............: avg=3.37ms  p(99)=20.77ms
     http_reqs......................: 14123  2818.249751/s
     iteration_duration.............: avg=3.53ms  p(99)=21.81ms
     iterations.....................: 14123  2818.249751/s
     vus............................: 10     min=10        max=10
     vus_max........................: 10     min=10        max=10


running (05.0s), 00/10 VUs, 14123 complete and 0 interrupted iterations
default ✓ [======================================] 10 VUs  5s

(2) Measuring the performance of submitting assignments:

k6 run submission-performance-test.js

          /\      |‾‾| /‾‾/   /‾‾/
     /\  /  \     |  |/  /   /  /
    /  \/    \    |     (   /   ‾‾\
   /          \   |  |\  \ |  (‾)  |
  / __________ \  |__| \__\ \_____/ .io

  execution: local
     script: submission-performance-test.js
     output: -

  scenarios: (100.00%) 1 scenario, 10 max VUs, 35s max duration (incl. graceful stop):
           * default: 10 looping VUs for 5s (gracefulStop: 30s)


     data_received..................: 22 MB  4.4 MB/s
     data_sent......................: 1.3 MB 267 kB/s
     http_req_blocked...............: avg=9.47µs  p(99)=0s
     http_req_connecting............: avg=1.34µs  p(99)=0s
     http_req_duration..............: avg=4.68ms  p(99)=31.96ms
       { expected_response:true }...: avg=4.68ms  p(99)=31.96ms
     http_req_failed................: 0.00%  ✓ 0           ✗ 10484
     http_req_receiving.............: avg=74.59µs p(99)=829.1µs
     http_req_sending...............: avg=17.4µs  p(99)=531.29µs
     http_req_tls_handshaking.......: avg=0s      p(99)=0s
     http_req_waiting...............: avg=4.59ms  p(99)=29.89ms
     http_reqs......................: 10484  2078.428809/s
     iteration_duration.............: avg=9.58ms  p(99)=44.91ms
     iterations.....................: 5242   1039.214405/s
     vus............................: 10     min=10        max=10
     vus_max........................: 10     min=10        max=10


running (05.0s), 00/10 VUs, 5242 complete and 0 interrupted iterations
default ✓ [======================================] 10 VUs  5s