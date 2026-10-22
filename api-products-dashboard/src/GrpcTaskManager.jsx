import { useCallback, useEffect, useState } from "react";

const API = "/grpc-api/api/tasks";
const STREAM_API = "/grpc-api/api/tasks/stream";

export default function GrpcTaskManager() {
  const [tasks, setTasks] = useState([]);
  const [streaming, setStreaming] = useState(false);
const [streamedTasks, setStreamedTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [lookupId, setLookupId] = useState("");
const [lookupTask, setLookupTask] = useState(null);
const [lookupLoading, setLookupLoading] = useState(false);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(API);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Request failed: ${response.status}`);
      }

      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        `${err.message}. Check that the gRPC server and adapter are running.`
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  async function createTask(event) {
    event.preventDefault();
    if (!title.trim()) return;

    setCreating(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Request failed: ${response.status}`);
      }

      setTitle("");
      setMessage(`Task #${data.id} created successfully.`);
      await loadTasks();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function updateStatus(task, status) {
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API}/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Request failed: ${response.status}`);
      }

      setMessage(`Task #${data.id} updated to ${data.status}.`);
      await loadTasks();
    } catch (err) {
      setError(err.message);
    }
  }
  async function getTaskById(event) {
  event.preventDefault();

  if (!lookupId || Number(lookupId) < 1) {
    setError("Enter a valid task ID.");
    return;
  }

  setLookupLoading(true);
  setError("");
  setMessage("");
  setLookupTask(null);

  try {
    const response = await fetch(`${API}/${Number(lookupId)}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Request failed: ${response.status}`);
    }

    setLookupTask(data);
    setMessage(`Task #${data.id} retrieved successfully.`);
  } catch (err) {
    setError(err.message);
  } finally {
    setLookupLoading(false);
  }
}
async function streamTasks() {
  setStreaming(true);
  setStreamedTasks([]);
  setError("");
  setMessage("");

  try {
    const response = await fetch(STREAM_API);

    if (!response.ok || !response.body) {
      throw new Error(`Stream request failed: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const events = buffer.split("\n\n");
      buffer = events.pop() || "";

      for (const event of events) {
        const dataLine = event
          .split("\n")
          .find((line) => line.startsWith("data: "));

        if (!dataLine || dataLine === "data: {}") continue;

        try {
          const task = JSON.parse(dataLine.slice(6));

          if (task.id !== undefined) {
            setStreamedTasks((previous) => [...previous, task]);
          }
        } catch {
          // Ignore malformed or incomplete event data.
        }
      }
    }

    setMessage("Task stream completed successfully.");
  } catch (err) {
    setError(`Streaming failed: ${err.message}`);
  } finally {
    setStreaming(false);
  }
}

  return (
    <section className="grpc-task-panel">
      <div className="live-orders-header">
        <div>
          <div className="eyebrow">
            <span className="live-dot" /> GRPC SERVICE
          </div>
          <h3>Live Tasks</h3>
          <p>Tasks retrieved from your gRPC server</p>
          <button
  type="button"
  className="orders-refresh"
  onClick={streamTasks}
  disabled={streaming}
>
  {streaming ? "Streaming..." : "▶ Stream Tasks"}
</button>
        </div>

        <div className="orders-header-actions">
          <span className="orders-count">{tasks.length} tasks</span>
          <button
            id="grpc-task-refresh"
            type="button"
            className="orders-refresh"
            onClick={loadTasks}
            disabled={loading}
          >
            {loading ? "Loading..." : "↻ Refresh"}
          </button>
        </div>
      </div>

      <form
          id="grpc-create-task"
          className="create-order-form"
          onSubmit={createTask}
        >
        <h3>Create New Task</h3>
        <input
          type="text"
          placeholder="Enter task title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={200}
          required
        />
        <button type="submit" disabled={creating || !title.trim()}>
          {creating ? "Creating..." : "Create Task"}
        </button>
      </form>
      <div className="create-order-form grpc-lookup-panel">
  <h3>Get Task by ID</h3>

  <form onSubmit={getTaskById}>
    <input
      type="number"
      min="1"
      placeholder="Enter task ID"
      value={lookupId}
      onChange={(event) => setLookupId(event.target.value)}
      required
    />

    <button type="submit" disabled={lookupLoading}>
      {lookupLoading ? "Searching..." : "Get Task"}
    </button>
  </form>

  {lookupTask && (
    <div className="grpc-lookup-result">
      <strong>Task #{lookupTask.id}</strong>
      <p>{lookupTask.title}</p>
      <span className="order-status">{lookupTask.status}</span>
    </div>
  )}
</div>

      {error && <p className="orders-error" role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
      {loading && <p className="orders-message">Loading tasks...</p>}
      <div className="grpc-stream-panel">
  <h3>Server-Side Streaming Results</h3>
  <p>
    {streaming
      ? "Receiving tasks from the gRPC stream..."
      : `${streamedTasks.length} tasks received`}
  </p>

  {streamedTasks.length > 0 && (
    <div className="orders-table-wrap">
      <table className="orders-table">
        <thead>
          <tr>
            <th>TASK ID</th>
            <th>TITLE</th>
            <th>STATUS</th>
          </tr>
        </thead>
        <tbody>
          {streamedTasks.map((task, index) => (
            <tr key={`${task.id}-${index}`}>
              <td className="order-id">#{task.id}</td>
              <td className="order-item">{task.title}</td>
              <td>
                <span className="order-status">{task.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</div>

      {!loading && (
        <div id="grpc-task-table" className="orders-table-wrap">
          <table className="orders-table">
            <thead>
              <tr>
                <th>TASK ID</th>
                <th>TITLE</th>
                <th>STATUS</th>
                <th>UPDATE STATUS</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id}>
                  <td className="order-id">#{task.id}</td>
                  <td className="order-item">{task.title}</td>
                  <td>
                    <span className="order-status">{task.status}</span>
                  </td>
                  <td>
                    <select
                      className="grpc-status-select"
                      aria-label={`Status for task ${task.id}`}
                      value={task.status}
                       onChange={(event) =>
                        updateStatus(task, event.target.value)
                        }
                      >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In progress</option>
                      <option value="done">Done</option>
                    </select>
                  </td>
                </tr>
              ))}

              {tasks.length === 0 && (
                <tr>
                  <td colSpan="4" className="orders-empty">
                    No tasks found. Create your first task above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}