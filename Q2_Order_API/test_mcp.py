import asyncio
import json
import sys
from pathlib import Path

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client


async def main():
    server_file = Path(__file__).with_name("mcp_server.py").resolve()

    server_params = StdioServerParameters(
        command=sys.executable,
        args=[str(server_file)],
    )

    async with stdio_client(server_params) as (read_stream, write_stream):
        async with ClientSession(read_stream, write_stream) as session:
            await session.initialize()

            tools = await session.list_tools()
            print("Discovered MCP tools:")
            for tool in tools.tools:
                print(f"- {tool.name}: {tool.description}")

            print("\n1. Create order through MCP")
            result = await session.call_tool(
                "order_api",
                arguments={
                    "action": "create_order",
                    "item": "Keyboard",
                    "quantity": 2,
                },
            )
            for content in result.content:
                if hasattr(content, "text"):
                    print(content.text)

            print("\n2. Retrieve order #1 through MCP")
            result = await session.call_tool(
                "order_api",
                arguments={"action": "get_order", "order_id": 1},
            )
            for content in result.content:
                if hasattr(content, "text"):
                    print(content.text)

            print("\n3. List orders through MCP")
            result = await session.call_tool(
                "order_api",
                arguments={"action": "list_orders"},
            )
            for content in result.content:
                if hasattr(content, "text"):
                    print(content.text)


if __name__ == "__main__":
    asyncio.run(main())
