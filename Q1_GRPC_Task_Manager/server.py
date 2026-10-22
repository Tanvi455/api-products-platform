import argparse
import threading
import time
from datetime import datetime
from concurrent import futures

import grpc

import task_pb2
import task_pb2_grpc

VALID_STATUSES = {"pending", "in_progress", "done"}

ERRORS = "Error cases"


def now():
    return datetime.now().strftime("%H:%M:%S.%f")[:-3]


def log(msg):
    print(f"{now()} [server] {msg}", flush=True)


class TaskService(task_pb2_grpc.TaskServiceServicer):
    def __init__(self, get_delay=0.0):
        self._tasks = {}
        self._next_id = 1
        self._lock = threading.Lock()
        self._get_delay = get_delay
        self._step_lock = threading.Lock()
        self._step_no = 0
        self._step_title = None

    def _step(self, title):
        """Print a numbered step header whenever the kind of work changes."""
        with self._step_lock:
            if title != self._step_title:
                self._step_no += 1
                self._step_title = title
                print(f"\n{now()} --- Step {self._step_no}: {title}", flush=True)

    def CreateTask(self, request, context):
        self._step("Create tasks")
        with self._lock:
            task = task_pb2.Task(id=self._next_id, title=request.title, status="pending")
            self._tasks[task.id] = task
            self._next_id += 1
            total = len(self._tasks)
        log(f"CreateTask: generated incremental id={task.id}, stored in memory (total tasks: {total})")
        return task

    def GetTask(self, request, context):
        # Validate the ID before applying the simulated delay.
        if request.id < 1:
            self._step(ERRORS)
            log(f"GetTask({request.id}): ERROR INVALID_ARGUMENT (id < 1)")
            context.abort(
                grpc.StatusCode.INVALID_ARGUMENT,
                "task id must be >= 1"
            )

        with self._lock:
            task = self._tasks.get(request.id)

        if task is None:
            self._step(ERRORS)
            log(f"GetTask({request.id}): ERROR NOT_FOUND (task id does not exist)")
            context.abort(
                grpc.StatusCode.NOT_FOUND,
                f"task {request.id} not found"
            )

        self._step("Fetch task by id")

        if self._get_delay:
            log(
                f"GetTask({request.id}): "
                f"sleeping {self._get_delay}s before responding"
            )
            time.sleep(self._get_delay)

        log(f"GetTask({request.id}): found in memory")
        return task

    def ListTasks(self, request, context):
        self._step("ListTasks (server streaming)")
        with self._lock:
            tasks = list(self._tasks.values())
        log(f"ListTasks: server-streaming {len(tasks)} tasks")
        for task in tasks:
            log(f"ListTasks: streaming task id={task.id}")
            yield task

    def _update(self, request, context, step=None):
        with self._lock:
            task = self._tasks.get(request.id)
            if task is None:
                self._step(ERRORS)
                log(f"Update({request.id}): ERROR NOT_FOUND (task id does not exist)")
                context.abort(grpc.StatusCode.NOT_FOUND, f"task {request.id} not found")
            if request.status not in VALID_STATUSES:
                self._step(ERRORS)
                log(f"Update({request.id}): ERROR FAILED_PRECONDITION (invalid status '{request.status}')")
                context.abort(
                    grpc.StatusCode.FAILED_PRECONDITION,
                    f"invalid status '{request.status}'; expected one of {sorted(VALID_STATUSES)}",
                )
            if step:
                self._step(step)
            old = task.status
            task.status = request.status
            log(f"Update({request.id}): status '{old}' -> '{request.status}' (valid status, stored in memory)")
            updated = task_pb2.Task()
            updated.CopyFrom(task)
            return updated

    def UpdateTask(self, request, context):
        return self._update(request, context, step="Update task status")

    def StreamTaskUpdates(self, request_iterator, context):
        self._step("StreamTaskUpdates (bidirectional streaming)")
        log("StreamTaskUpdates: bidirectional stream opened")
        for request in request_iterator:
            log(f"StreamTaskUpdates: received update id={request.id} status='{request.status}'")
            yield self._update(request, context)
        log("StreamTaskUpdates: client finished sending, stream closed")


def serve(port=50051, get_delay=0.0):
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    task_pb2_grpc.add_TaskServiceServicer_to_server(TaskService(get_delay), server)
    server.add_insecure_port(f"localhost:{port}")
    server.start()
    print(f"{now()} Task server listening on localhost:{port} (GetTask delay: {get_delay}s)")
    server.wait_for_termination()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=50051)
    parser.add_argument("--get-delay", type=float, default=0.0, help="seconds GetTask sleeps before responding")
    args = parser.parse_args()
    serve(args.port, args.get_delay)

