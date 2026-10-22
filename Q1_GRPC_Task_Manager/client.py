from datetime import datetime

import grpc

import task_pb2
import task_pb2_grpc


def out(msg=""):
    lead = ""
    while msg.startswith("\n"):
        lead += "\n"
        msg = msg[1:]
    print(f"{lead}{datetime.now().strftime('%H:%M:%S.%f')[:-3]} {msg}")


def fmt(task):
    return f"Task(id={task.id}, title={task.title!r}, status={task.status!r})"


def get_task(stub, task_id, timeout=1.0):
    try:
        task = stub.GetTask(task_pb2.GetTaskRequest(id=task_id), timeout=timeout)
        out(f"GetTask({task_id}) -> {fmt(task)}")
    except grpc.RpcError as e:
        if e.code() == grpc.StatusCode.DEADLINE_EXCEEDED:
            out(f"GetTask({task_id}) timed out after {timeout}s; try again later")
        else:
            out(f"GetTask({task_id}) failed: {e.code().name}: {e.details()}")


def main():
    with grpc.insecure_channel("localhost:50051") as channel:
        stub = task_pb2_grpc.TaskServiceStub(channel)

        out("--- 1. Create three tasks")
        for title in ("Write proto", "Implement server", "Implement client"):
            out(fmt(stub.CreateTask(task_pb2.CreateTaskRequest(title=title))))

        out("\n--- 2. Fetch task #2 (1s deadline)")
        get_task(stub, 2)

        out("\n--- 3. ListTasks (server streaming)")
        for task in stub.ListTasks(task_pb2.ListTasksRequest()):
            out(fmt(task))

        out("\n--- 4. StreamTaskUpdates (bidirectional streaming)")
        updates = [(1, "in_progress"), (2, "done"), (3, "in_progress")]
        for task in stub.StreamTaskUpdates(task_pb2.UpdateTaskRequest(id=i, status=s) for i, s in updates):
            out(f"server -> {fmt(task)}")

        out("\n--- 5. Error cases")
        get_task(stub, 0)
        get_task(stub, 99)
        try:
            stub.UpdateTask(task_pb2.UpdateTaskRequest(id=1, status="bogus"))
        except grpc.RpcError as e:
            out(f"UpdateTask invalid status: {e.code().name}: {e.details()}")


if __name__ == "__main__":
    main()

