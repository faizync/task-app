Deploy React Frontend and nodeJs backend on ec2 and create a rds and connect it with your application.

We have used Only one VPC for backend and frontend EC2 servers. Frontend is in public subnet and backend is in private subnet.
We created /api endpoint in frontend/src/api.js 
Then in forntned Nginx config we proxied the requests the comes from /api to Private EC2 (backend).
THis method works because our servers are in same VPC, so frontend can call private ip easily.
If we have seperate VPC or no VPC at all (like AWS Amplify), then that solution wont work.
Switch to ALB Method branch to learn more.
