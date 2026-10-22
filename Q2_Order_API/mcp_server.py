import json
import os

import httpx
from mcp.server.fastmcp import FastMCP

API_BASE_URL = os.getenv("ORDER_API_URL", "http://127.0.0.1:8000")

mcp = FastMCP("Order Management MCP Server")


@mcp.tool(name="order_api")
async def order_api(
    action: str,
    item: str = "",
    quantity: int = 0,
    order_id: int = 0,
) -> str:
    """Manage orders. Actions: create_order, get_order, list_orders."""
    async with httpx.AsyncClient(base_url=API_BASE_URL, timeout=5.0) as client:
        if action == "create_order":
            if not item.strip():
                return json.dumps({"error": "item must not be empty"})
            if quantity <= 0:
                return json.dumps({"error": "quantity must be greater than zero"})
            response = await client.post(
               "/api/orders",
                json={"item": item, "quantity": quantity},
            )

        elif action == "get_order":
            if order_id < 1:
                return json.dumps({"error": "order_id must be at least 1"})
            response = await client.get(f"/api/orders/{order_id}")

        elif action == "list_orders":
           response = await client.get("/api/orders")

        else:
            return json.dumps({
                "error": "Unsupported action",
                "allowed_actions": [
                    "create_order", "get_order", "list_orders"
                ],
            })

        try:
            response.raise_for_status()
            return json.dumps(response.json())
        except httpx.HTTPStatusError:
            return json.dumps({
                "error": "Order API request failed",
                "status_code": response.status_code,
                "details": response.text,
            })


if __name__ == "__main__":
    mcp.run(transport="stdio")
