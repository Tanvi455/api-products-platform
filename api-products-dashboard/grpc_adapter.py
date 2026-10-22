
import os
import sys
import threading
from concurrent import futures

from flask import Flask, jsonify, request
from flask_cors import CORS
import grpc

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
Q1_DIR = os.path.join(PROJECT_ROOT, "Q1_GRPC_Task_Manager")

sys.path.insert(0, Q1_DIR)

import task_pb2
import task_pb2_grpc

app = Flask(__name__)
CORS(app)

GRPC_ADDRESS = "localhost:50051"
channel = grpc.insecure_channel(GRPC_ADDRESS)
stub = task_pb2_grpc.TaskServiceStub(channel)
rpc_lock = threading.Lock()


def task_dict(task):
    return {
        "id": task.id,
        "title": task.title,
        "status": task.status,
    }


def grpc_error(error):
    code = error.code()
    status = 404 if code == grpc.StatusCode.NOT_FOUND else (
        400 if code in (
            grpc.StatusCode.INVALID_ARGUMENT,
            grpc.StatusCode.FAILED_PRECONDITION,
        ) else 503
    )
    return jsonify({
        "error": error.details() or "gRPC request failed",
        "grpc_code": code.name,
    }), status


@app.get("/health")
def health():
    try:
        grpc.channel_ready_future(channel).result(timeout=2)
        return jsonify({
            "status": "UP",
            "service": "APIFORGE gRPC Adapter",
            "grpc_server": GRPC_ADDRESS,
        })
    except grpc.FutureTimeoutError:
        return jsonify({
            "status": "DOWN",
            "error": "gRPC server is not reachable",
        }), 503


@app.post("/api/tasks")
def create_task():
    data = request.get_json(silent=True) or {}
    title = str(data.get("title", "")).strip()

    if not title:
        return jsonify({"error": "Task title is required"}), 400

    try:
        task = stub.CreateTask(
            task_pb2.CreateTaskRequest(title=title),
            timeout=5,
        )
        return jsonify(task_dict(task)), 201
    except grpc.RpcError as error:
        return grpc_error(error)

@app.get("/api/tasks")
def list_tasks():
    try:
        tasks = stub.ListTasks(
            task_pb2.ListTasksRequest(),
            timeout=10,
        )
        return jsonify([task_dict(task) for task in tasks])
    except grpc.RpcError as error:
        return grpc_error(error)


@app.get("/api/tasks/stream")
def stream_tasks():
    from flask import Response, stream_with_context
    import json

    @stream_with_context
    def generate():
        try:
            tasks = stub.ListTasks(
                task_pb2.ListTasksRequest(),
                timeout=10,
            )
            for task in tasks:
                yield f"data: {json.dumps(task_dict(task))}\n\n"
            yield "event: complete\ndata: {}\n\n"
        except grpc.RpcError as error:
            payload = {
                "error": error.details() or "gRPC stream failed",
                "grpc_code": error.code().name,
            }
            yield f"event: error\ndata: {json.dumps(payload)}\n\n"

    return Response(
        generate(),
        content_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@app.get("/api/tasks/<int:task_id>")
def get_task(task_id):
    try:
        task = stub.GetTask(
            task_pb2.GetTaskRequest(id=task_id),
            timeout=5,
        )
        return jsonify(task_dict(task))
    except grpc.RpcError as error:
        return grpc_error(error)


@app.patch("/api/tasks/<int:task_id>")
def update_task(task_id):
    data = request.get_json(silent=True) or {}
    status = str(data.get("status", "")).strip()

    if status not in {"pending", "in_progress", "done"}:
        return jsonify({
            "error": "Status must be pending, in_progress, or done"
        }), 400

    try:
        task = stub.UpdateTask(
            task_pb2.UpdateTaskRequest(
                id=task_id,
                status=status,
            ),
            timeout=5,
        )
        return jsonify(task_dict(task))
    except grpc.RpcError as error:
        return grpc_error(error)


if __name__ == "__main__":
    try:
        app.run(host="127.0.0.1", port=5003, debug=False)
    finally:
        channel.close()
