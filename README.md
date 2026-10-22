\# APIFORGE — API Products Assignment



A unified dashboard and collection of API implementations demonstrating gRPC communication, RESTful order management, API gateway integration, and rate-limiting algorithms.



\## Project Overview



APIFORGE brings together three components of the API Products assignment into one project workspace.



\- \*\*Q1 — gRPC Task Manager:\*\* Task creation, retrieval, updates, server-side streaming, bidirectional streaming, and error handling.

\- \*\*Q2 — Order API:\*\* REST endpoints for order management, Model Context Protocol (MCP) integration, and Kong API gateway rate limiting.

\- \*\*Q3 — Rate Limiting Algorithms:\*\* Token Bucket, Leaky Bucket, and queue-based Leaky Bucket implementations, with a dashboard for observing rate-limiting behavior.



The React dashboard provides a unified interface for interacting with the assignment components.



\## Technology Stack



\- \*\*Frontend:\*\* React, Vite, JavaScript, CSS

\- \*\*gRPC:\*\* Python, gRPC, Protocol Buffers

\- \*\*REST API:\*\* Python

\- \*\*API Gateway:\*\* Kong

\- \*\*MCP:\*\* Model Context Protocol

\- \*\*Rate Limiting:\*\* Token Bucket, Leaky Bucket, and Queue-based Leaky Bucket

\- \*\*Containerization:\*\* Docker and Docker Compose

\- \*\*Version Control:\*\* Git and GitHub



\## Project Structure



```text

BITS\_API\_Assignment/

├── Q1\_GRPC\_Task\_Manager/

│   ├── client.py

│   ├── server.py

│   ├── task.proto

│   ├── task\_pb2.py

│   ├── task\_pb2\_grpc.py

│   ├── requirements.txt

│   └── screenshots/

│       └── grpc\_client\_results.png

├── Q2\_Order\_API/

│   ├── api.py

│   ├── mcp\_server.py

│   ├── test\_mcp.py

│   ├── docker-compose.yml

│   ├── kong/

│   │   └── kong.yml

│   └── screenshots/

│       ├── kong\_rate\_limit.png

│       ├── mcp\_kong\_integration.png

│       ├── mcp\_test.png

│       └── rest\_api\_test.png

├── Q3\_Rate\_Limiters/

│   ├── rate\_limiters.py

│   ├── demo.py

│   └── screenshots/

│       ├── leaky\_bucket\_demo.png

│       ├── rate\_limiter\_tests.png

│       └── token\_bucket\_demo.png

├── api-products-dashboard/

│   ├── src/

│   ├── package.json

│   ├── vite.config.js

│   └── README.md

├── screenshots/

└── README.md

```



\## Q1 — gRPC Task Manager



\*\*Implementation directory:\*\* `Q1\_GRPC\_Task\_Manager/`



The Task Manager uses Protocol Buffers to define the service contract and gRPC for client-server communication.



\### RPC Operations



\- `CreateTask` — creates a task.

\- `GetTask` — retrieves a task by ID.

\- `ListTasks` — streams tasks from the server to the client.

\- `UpdateTask` — updates a task's status.

\- `StreamTaskUpdates` — receives a stream of update requests and returns a stream of task responses.



\### Validation and Error Handling



The implementation demonstrates handling for:



\- Invalid task IDs using `INVALID\_ARGUMENT`.

\- Non-existent tasks using `NOT\_FOUND`.

\- Invalid task statuses using `FAILED\_PRECONDITION`.

\- Client deadlines using a one-second timeout for `GetTask`.



\### Run the gRPC Server



From the assignment root directory, open a terminal and run:



```powershell

python .\\Q1\_GRPC\_Task\_Manager\\server.py

```



\### Run the gRPC Client



Open a separate terminal and run:



```powershell

python .\\Q1\_GRPC\_Task\_Manager\\client.py

```



Install the required Python dependencies from the Q1 directory if needed:



```powershell

cd .\\Q1\_GRPC\_Task\_Manager

python -m pip install -r requirements.txt

```



\### Test Evidence



The Q1 client was executed successfully. Its output demonstrated:



\- Creation of three tasks.

\- Graceful handling of the one-second `GetTask` deadline.

\- Server-side streaming through `ListTasks`.

\- Three responses from `StreamTaskUpdates`.

\- Expected error handling for invalid IDs, missing tasks, and invalid statuses.



Screenshot evidence:



`Q1\_GRPC\_Task\_Manager/screenshots/grpc\_client\_results.png`



\## Q2 — Order API, MCP and Kong



\*\*Implementation directory:\*\* `Q2\_Order\_API/`



\### REST API



Implementation: `Q2\_Order\_API/api.py`



The Order API provides the following operations:



\- `POST /orders` — creates an order.

\- `GET /orders/{id}` — retrieves an order by ID.

\- `GET /orders` — lists orders.



The API manages order operations through HTTP requests and JSON responses.



\### MCP Integration



Implementation: `Q2\_Order\_API/mcp\_server.py`



Test file: `Q2\_Order\_API/test\_mcp.py`



The MCP component integrates order operations through the Model Context Protocol. Refer to the implementation and test files for the supported tools, actions, and request handling.



\### Kong API Gateway



Configuration: `Q2\_Order\_API/kong/kong.yml`



Compose file: `Q2\_Order\_API/docker-compose.yml`



The declarative Kong configuration defines the order API service and route and applies a rate-limiting plugin with a limit of \*\*5 requests per minute per client IP\*\*, using the local policy.



The configured upstream service is:



`http://host.docker.internal:5001/orders`



The route exposed through Kong is `/api/orders`. The configuration strips the route prefix before forwarding requests to the upstream service.



The Order API must be running at the configured address before requests can be tested through Kong.



\### Start Kong



From the Q2 directory, run:



```powershell

cd C:\\Users\\ASUS\\Desktop\\BITS\_API\_Assignment\\Q2\_Order\_API

docker compose up -d

```



This starts the Kong service defined in `docker-compose.yml`. Ensure Docker Desktop is running and the upstream Order API is available.



\### Q2 Screenshots



Evidence is available in `Q2\_Order\_API/screenshots/`:



\- `rest\_api\_test.png` — REST API testing.

\- `mcp\_test.png` — MCP testing.

\- `mcp\_kong\_integration.png` — MCP and Kong integration.

\- `kong\_rate\_limit.png` — Kong rate-limiting demonstration.



\## Q3 — Rate Limiting Algorithms



\*\*Implementation directory:\*\* `Q3\_Rate\_Limiters/`



Implementation file: `Q3\_Rate\_Limiters/rate\_limiters.py`



The implementation contains three rate-limiting variants.



\### Token Bucket



The Token Bucket algorithm maintains a token balance that replenishes at a configured rate. Requests are allowed when sufficient tokens are available, permitting bursts up to the configured capacity.



\### Leaky Bucket



The meter-style Leaky Bucket tracks a bucket level that decreases over time. Requests are rejected when adding them would exceed the configured capacity.



\### Queue-based Leaky Bucket



`QueueLeakyBucket` places requests into a bounded FIFO queue and processes them at a configured rate. New submissions are rejected when the queue is full.



\### Run the Algorithm Tests



From the assignment root directory, run:



```powershell

python .\\Q3\_Rate\_Limiters\\rate\_limiters.py

```



The script includes assertions covering token refill, bucket overflow, queue rejection, and FIFO processing. A successful execution prints:



```text

ok

```



\### Run the Demonstration



```powershell

python .\\Q3\_Rate\_Limiters\\demo.py

```



\### Q3 Screenshots



Evidence is available in `Q3\_Rate\_Limiters/screenshots/`:



\- `token\_bucket\_demo.png` — Token Bucket demonstration.

\- `leaky\_bucket\_demo.png` — Leaky Bucket demonstration.

\- `rate\_limiter\_tests.png` — Rate-limiter test evidence.



\## APIFORGE Dashboard



The dashboard is implemented using React and Vite and provides a unified interface for interacting with the assignment components.



\### Prerequisites



\- Python and the dependencies required by the backend components.

\- Node.js and npm.

\- Docker Desktop for the Kong gateway configuration.

\- The required backend services running before testing their dashboard integrations.



\### Start the Dashboard



From the assignment root directory, run:



```powershell

cd .\\api-products-dashboard

npm install

npm run dev

```



Open the local URL displayed in the terminal by Vite.



Keep the dashboard and backend services running in their respective terminals during integration testing.



\## Testing and Evidence



The repository includes screenshots and source implementations for the three assignment components.



| Component | Implementation | Evidence |

|---|---|---|

| Q1 — gRPC Task Manager | `Q1\_GRPC\_Task\_Manager/` | `Q1\_GRPC\_Task\_Manager/screenshots/` |

| Q2 — Order API, MCP and Kong | `Q2\_Order\_API/` | `Q2\_Order\_API/screenshots/` |

| Q3 — Rate Limiting Algorithms | `Q3\_Rate\_Limiters/` | `Q3\_Rate\_Limiters/screenshots/` |

| APIFORGE Dashboard | `api-products-dashboard/` | Dashboard source and local execution |



The Q1 client execution confirmed the expected bidirectional streaming responses and error-handling behavior. Run the Q2 and Q3 tests in your environment to verify their current status before submission.



\## Installation Notes



\### Python Dependencies



Install dependencies using the relevant component's `requirements.txt` file when provided.



For Q1:



```powershell

cd C:\\Users\\ASUS\\Desktop\\BITS\_API\_Assignment\\Q1\_GRPC\_Task\_Manager

python -m pip install -r requirements.txt

```



For Q2, install the Python packages required by `api.py`, `mcp\_server.py`, and `test\_mcp.py` according to their imports and project configuration.



\### Dashboard Dependencies



```powershell

cd C:\\Users\\ASUS\\Desktop\\BITS\_API\_Assignment\\api-products-dashboard

npm install

```



\### Operational Notes



\- Start the required backend services before testing the dashboard integrations.

\- Verify ports and configuration values before starting multiple services.

\- Ensure the Order API is reachable at the upstream address configured in Kong.

\- Do not commit passwords, access tokens, private keys, or other secrets.

\- Keep screenshots and test evidence aligned with the implementation actually executed.



\## Assignment Deliverables



\- \*\*Q1:\*\* gRPC Task Manager source, Protocol Buffers service definition, client/server implementation, and test evidence.

\- \*\*Q2:\*\* Order REST API, MCP server and tool implementation, Kong configuration, and rate-limiting evidence.

\- \*\*Q3:\*\* Token Bucket, Leaky Bucket, queue-based Leaky Bucket implementations, and test evidence.

\- \*\*Dashboard:\*\* APIFORGE React/Vite frontend source and project documentation.





