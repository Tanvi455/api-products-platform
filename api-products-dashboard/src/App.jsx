import GrpcTaskManager from "./GrpcTaskManager";
import { useEffect, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Code2,
  Gauge,
  LayoutDashboard,
  Menu,
  Network,
  Radio,
  Server,
  Settings2,
  ShieldCheck,
  Workflow,
  X,
} from "lucide-react";
import "./App.css";

const navigation = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, group: "WORKSPACE" },
  { id: "grpc", label: "gRPC Task Manager", icon: Workflow, group: "API PRODUCTS" },
  { id: "orders", label: "Order API & Gateway", icon: Network, group: "API PRODUCTS" },
  { id: "limits", label: "Rate Limiting Lab", icon: Gauge, group: "API PRODUCTS" },
];

const products = [
  { id: "grpc", number: "01", name: "gRPC Task Manager", subtitle: "Task lifecycle & streaming", icon: Workflow, color: "violet", protocol: "gRPC", state: "Ready to connect" },
  { id: "orders", number: "02", name: "Order API + MCP", subtitle: "REST endpoints & gateway", icon: Network, color: "blue", protocol: "REST · MCP · Kong", state: "Ready to connect" },
  { id: "limits", number: "03", name: "Rate Limiting Lab", subtitle: "Token & Leaky Bucket", icon: Gauge, color: "orange", protocol: "Python", state: "Demo mode" },
];

function Overview({ onNavigate }) {
  return (
    <>
      <section className="welcome">
        <div>
          <div className="eyebrow"><span className="live-dot" /> DEVELOPER WORKSPACE</div>
          <h2>Your APIs, <span>one workspace.</span></h2>
          <p>Explore your services, inspect API workflows, and understand rate limiting in one place.</p>
        </div>
        <div className="welcome-art"><Boxes size={76} strokeWidth={1} /><span className="art-ring ring-one" /><span className="art-ring ring-two" /></div>
      </section>

      <div className="section-heading">
        <div><h3>Project overview</h3><p>Your three API engineering modules</p></div>
        <span className="small-label">3 MODULES</span>
      </div>

      <section className="product-grid">
        {products.map((product) => {
          const Icon = product.icon;
          return (
            <button className="product-card" key={product.id} onClick={() => onNavigate(product.id)}>
              <div className="product-top">
                <div className={`product-icon ${product.color}`}><Icon size={22} /></div>
                <span className="product-number">{product.number}</span>
              </div>
              <h4>{product.name}</h4>
              <p>{product.subtitle}</p>
              <div className="product-footer"><span>{product.protocol}</span><ArrowUpRight size={17} /></div>
            </button>
          );
        })}
      </section>

      <div className="section-heading second-heading">
        <div><h3>System architecture</h3><p>How the modules fit together</p></div>
      </div>
      <section className="architecture">
        <div className="architecture-node"><Code2 size={20} /><span>React UI</span><small>Dashboard</small></div>
        <div className="architecture-line"><span>HTTP / adapter</span><i /></div>
        <div className="architecture-node"><Server size={20} /><span>Python services</span><small>gRPC · FastAPI</small></div>
        <div className="architecture-line"><span>Gateway / tools</span><i /></div>
        <div className="architecture-node"><ShieldCheck size={20} /><span>Kong + MCP</span><small>Routing & tools</small></div>
      </section>
      <p className="architecture-note"><CircleAlert size={15} /> Connections will be enabled in the next integration steps. Status labels are not live health checks yet.</p>
    </>
  );
}

function ModulePage({ page, onNavigate }) {
  const details = {
    grpc: {
      eyebrow: "MODULE 01 / RPC",
      title: "gRPC Task Manager",
      description: "Create tasks, inspect their status, and explore streaming operations.",
      icon: Workflow,
      chips: ["Create task", "Get task by ID", "ListTasks stream", "Bidirectional updates"],
      message: "The gRPC server uses a binary protocol. We'll connect this browser interface through a small Python HTTP adapter.",
    },
    orders: {
      eyebrow: "MODULE 02 / API PLATFORM",
      title: "Order API & Gateway",
      description: "Work with orders and inspect REST, MCP, and Kong gateway behavior.",
      icon: Network,
      chips: ["Create order", "Retrieve order", "List orders", "Kong rate limit"],
      message: "Your FastAPI service and Kong gateway will supply the live data. MCP actions will use the existing MCP server flow.",
    },
    limits: {
      eyebrow: "MODULE 03 / ALGORITHMS",
      title: "Rate Limiting Lab",
      description: "Explore how token capacity, refill rates, and queue limits affect requests.",
      icon: Gauge,
      chips: ["Token Bucket", "Leaky Bucket meter", "Leaky Bucket queue", "Allowed vs rejected"],
      message: "We will connect the Python algorithms so the visual results reflect real implementation behavior.",
    },
  };

  const detail = details[page];
  const Icon = detail.icon;

  return (
    <>
      <button className="back-link" onClick={() => onNavigate("overview")}>← Back to overview</button>
      <section className="module-hero">
        <div className="product-icon violet"><Icon size={25} /></div>
        <div className="eyebrow">{detail.eyebrow}</div>
        <h2>{detail.title}</h2>
        <p>{detail.description}</p>
      </section>
      <div className="section-heading"><div><h3>Capabilities</h3><p>Assignment workflow</p></div></div>
      <section className="capability-grid">
        {detail.chips.map((chip, index) => (
  <button
    type="button"
    className="capability"
    key={chip}
    onClick={() => {
      if (page !== "grpc") return;

      const targets = [
        "grpc-create-task",
        "grpc-task-table",
        "grpc-task-refresh",
        "grpc-task-table",
      ];

      document.getElementById(targets[index])?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }}
    style={{ cursor: page === "grpc" ? "pointer" : "default" }}
  >
    <span>{String(index + 1).padStart(2, "0")}</span>
    <CheckCircle2 size={18} />
    <strong>{chip}</strong>
  </button>
))}
      </section>
      <section className="connection-panel">
        <div className="connection-icon"><Radio size={22} /></div>
        <div><h3>Integration setup</h3><p>{detail.message}</p></div>
        <span className="setup-pill"><Clock3 size={13} /> Next step</span>
      </section>
    </>
  );
}
function RateLimitLab() {
  const [algorithm, setAlgorithm] = useState("token");
  const [amount, setAmount] = useState("1");
  const [results, setResults] = useState([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [config, setConfig] = useState(null);

  useEffect(() => {
    fetch("/rate-limit-api/api/limit/status")
      .then((response) => {
        if (!response.ok) throw new Error("Could not load configuration");
        return response.json();
      })
      .then(setConfig)
      .catch((err) => setError(err.message));
  }, []);

  async function sendRequest() {
    setSending(true);
    setError("");

    try {
      const response = await fetch("/rate-limit-api/api/limit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          algorithm,
          amount: Number(amount),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Request failed: ${response.status}`);
      }

      setResults((previous) => [
        {
          ...data,
          id: `${Date.now()}-${Math.random()}`,
        },
        ...previous,
      ]);
    } catch (err) {
      setError(
        `${err.message}. Check that the Flask API is running on port 5002.`
      );
    } finally {
      setSending(false);
    }
  }

  const accepted = results.filter((item) => item.allowed).length;
  const rejected = results.filter((item) => !item.allowed).length;

  return (
    <section className="rate-lab">
      <div className="rate-module-hero">
  <div className="rate-module-icon">
    <Gauge size={25} />
  </div>

  <div className="rate-module-eyebrow">
    MODULE 03 / TRAFFIC CONTROL
  </div>

  <h2>Rate Limiting Lab</h2>

  <p>
    Simulate API traffic, compare rate-limiting algorithms,
    and observe request behavior in real time.
  </p>

  <div className="rate-module-status">
    <span className="live-dot" />
    PYTHON ENGINE CONNECTED
    <span className="rate-lab-badge">LIVE DEMO</span>
  </div>
</div>
      <div className="rate-metrics">
        <div className="rate-metric">
          <span>Total requests</span>
          <strong>{results.length}</strong>
        </div>
        <div className="rate-metric">
          <span>Accepted</span>
          <strong>{accepted}</strong>
        </div>
        <div className="rate-metric">
          <span>Rejected</span>
          <strong>{rejected}</strong>
        </div>
      </div>

      <div className="rate-control-panel">
        <h4>Request simulator</h4>
        <label htmlFor="rate-algorithm">Select algorithm</label>
        <select
          id="rate-algorithm"
          value={algorithm}
          onChange={(event) => setAlgorithm(event.target.value)}
        >
          <option value="token">Token Bucket</option>
          <option value="leaky">Leaky Bucket — Meter</option>
          <option value="queue">Leaky Bucket — Queue</option>
        </select>

        <label htmlFor="rate-amount">Request amount</label>
        <input
          id="rate-amount"
          type="number"
          min="0.1"
          step="0.1"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />

        <button
          type="button"
          className="rate-send-button"
          onClick={sendRequest}
          disabled={sending || !amount || Number(amount) <= 0}
        >
          {sending ? "Sending..." : "Send Request →"}
        </button>
      </div>

      {error && <p className="rate-error" role="alert">{error}</p>}

      <div className="rate-results-panel">
        <div className="rate-results-heading">
          <h4>Request activity</h4>
          <button
            type="button"
            onClick={() => setResults([])}
            disabled={results.length === 0}
          >
            Clear history
          </button>
        </div>

        {results.length === 0 ? (
          <p className="rate-empty">
            No requests yet. Select an algorithm and send your first request.
          </p>
        ) : (
          <div className="rate-results-list">
            {results.map((item) => (
              <div className="rate-result-row" key={item.id}>
                <div>
                  <strong>
                    {item.algorithm === "token"
                      ? "Token Bucket"
                      : item.algorithm === "leaky"
                        ? "Leaky Bucket"
                        : "Queue Leaky Bucket"}
                  </strong>
                  <small>{new Date(item.timestamp * 1000).toLocaleTimeString()}</small>
                </div>
                <span className={item.allowed ? "rate-accepted" : "rate-rejected"}>
                  {item.result}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {config && (
        <div className="rate-config-panel">
          <h4>Algorithm configuration</h4>
          <p>Token Bucket: capacity {config.configuration.token_capacity},
            refill {config.configuration.token_refill_rate_per_second}/second</p>
          <p>Leaky Bucket: capacity {config.configuration.leaky_capacity},
            leak {config.configuration.leaky_rate_per_second}/second</p>
          <p>Queue Bucket: capacity {config.configuration.queue_capacity},
            processing rate {config.configuration.queue_processing_rate_per_second}/second</p>
        </div>
      )}
    </section>
  );
}
export default function App() {
  const [page, setPage] = useState("overview");
  const [mobileOpen, setMobileOpen] = useState(false);

  const [orders, setOrders] = useState([]);
const [ordersLoading, setOrdersLoading] = useState(false);
const [ordersError, setOrdersError] = useState("");

useEffect(() => {
  if (page !== "orders") return;

  const controller = new AbortController();

  async function fetchOrders() {
    setOrdersLoading(true);
    setOrdersError("");

    try {
      const response = await fetch("/api/orders", {
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(
          response.status === 429
            ? "Kong rate limit reached. Please wait and try again."
            : `Request failed with status ${response.status}`
        );
      }

      const data = await response.json();
      setOrders(Array.isArray(data) ? data : data.orders ?? []);
    } catch (error) {
      if (error.name !== "AbortError") {
        setOrdersError(error.message || "Unable to load orders.");
      }
    } finally {
      if (!controller.signal.aborted) {
        setOrdersLoading(false);
      }
    }
  }

  fetchOrders();

  return () => controller.abort();
}, [page]);

  const navigate = (id) => {
    setPage(id);
    setMobileOpen(false);
  };

  return (
    <div className="app-shell">
      {mobileOpen && <button className="mobile-scrim" aria-label="Close menu" onClick={() => setMobileOpen(false)} />}
      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="brand"><div className="brand-mark"><Activity size={22} /></div><div><strong>API<span>FORGE</span></strong><small>PRODUCTS WORKSPACE</small></div><button className="close-menu" aria-label="Close menu" onClick={() => setMobileOpen(false)}><X size={19} /></button></div>
        <div className="workspace-switch"><div className="workspace-avatar">AP</div><div><strong>API Engineering</strong><small>Local workspace</small></div><Settings2 size={16} /></div>
        <nav>
          <div className="nav-group-label">WORKSPACE</div>
          {navigation.filter((item) => item.group === "WORKSPACE").map((item) => { const Icon = item.icon; return <button key={item.id} className={`nav-link ${page === item.id ? "active" : ""}`} onClick={() => navigate(item.id)}><Icon size={18} />{item.label}</button>; })}
          <div className="nav-group-label api-label">API PRODUCTS</div>
          {navigation.filter((item) => item.group === "API PRODUCTS").map((item) => { const Icon = item.icon; return <button key={item.id} className={`nav-link ${page === item.id ? "active" : ""}`} onClick={() => navigate(item.id)}><Icon size={18} />{item.label}<span className="nav-arrow">›</span></button>; })}
        </nav>
        <div className="sidebar-bottom"><div className="connection-status"><span className="status-dot" /><div><strong>Local environment</strong><small>UI running · integrations pending</small></div></div><div className="sidebar-version">API Products Assignment <span>v1.0</span></div></div>
      </aside>

      <main className="main-area">
        <header className="topbar"><button className="mobile-menu" aria-label="Open menu" onClick={() => setMobileOpen(true)}><Menu size={22} /></button><div className="breadcrumb">Workspace <span>/</span> <strong>{navigation.find((item) => item.id === page)?.label || "Overview"}</strong></div><div className="topbar-right"><span className="environment"><span /> LOCAL DEV</span><div className="user-avatar">T</div></div></header>
        <div className="page-content">
      {page === "overview" ? (
  <Overview onNavigate={navigate} />
) : page === "limits" ? (
  <>
    <button
      className="back-link"
      onClick={() => navigate("overview")}
    >
      ← Back to overview
    </button>
    <RateLimitLab />
  </>
) : page === "grpc" ? (
  <>
    <ModulePage page={page} onNavigate={navigate} />
    <GrpcTaskManager />
  </>
) : (
  <ModulePage page={page} onNavigate={navigate} />
)}

{page === "orders" && (
  <section className="live-orders-panel">
    <div className="live-orders-header">
      <div>
        <div className="eyebrow">
          <span className="live-dot" /> KONG GATEWAY
        </div>
        <h3>Live Orders</h3>
        <p>Orders retrieved from your connected API</p>
      </div>

      <div className="orders-header-actions">
        <span className="orders-count">
          {orders.length} orders
        </span>

        <button
          className="orders-refresh"
          onClick={() => {
            setPage("overview");
            setTimeout(() => setPage("orders"), 0);
          }}
          disabled={ordersLoading}
        >
          {ordersLoading ? "Loading..." : "↻ Refresh"}
        </button>
      </div>
    </div>
<div className="create-order-form">
  <h3>Create New Order</h3>

  <form
    onSubmit={async (event) => {
      event.preventDefault();

      const form = event.currentTarget;
      const formData = new FormData(form);

      const newOrder = {
        item: formData.get("item").trim(),
        quantity: Number(formData.get("quantity")),
      };

      try {
        const response = await fetch("/api/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newOrder),
        });

        if (!response.ok) {
          throw new Error(`Request failed: ${response.status}`);
        }

        form.reset();
        await fetchOrders();
      } catch (error) {
        alert(`Could not create order: ${error.message}`);
      }
    }}
  >
    <input
      type="text"
      name="item"
      placeholder="Enter item name"
      required
    />

    <input
      type="number"
      name="quantity"
      placeholder="Quantity"
      min="1"
      defaultValue="1"
      required
    />

    <button type="submit">Create Order</button>
  </form>
</div>
    {ordersError && (
      <p className="orders-error" role="alert">{ordersError}</p>
    )}

    {ordersLoading && <p className="orders-message">Loading orders...</p>}

    {!ordersLoading && !ordersError && (
      <div className="orders-table-wrap">
        <table className="orders-table">
          <thead>
            <tr>
              <th>ORDER ID</th>
              <th>ITEM</th>
              <th>QUANTITY</th>
              <th>STATUS</th>
            </tr>
          </thead>

          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="order-id">#{order.id}</td>
                <td className="order-item">{order.item}</td>
                <td>{order.quantity}</td>
                <td>
                  <span className="order-status">{order.status}</span>
                </td>
              </tr>
            ))}

            {orders.length === 0 && (
              <tr>
                <td colSpan="4" className="orders-empty">
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    )}
  </section>
)}
          <footer className="footer"><span>APIFORGE <span className="footer-dot">·</span> API Products Engineering</span><span>Built for learning & demonstration</span></footer>
        </div>
      </main>
    </div>
  );
}
