# runtime/api_nodes.py

from runtime.nodes import capability
from runtime.intents import *
import requests  # 你之后可以换成 httpx 或自己写

@capability(INTENT_INPUT)
def node_input(ctx):
    # 如果 ctx 里没有 input，就简单从命令行读取
    text = ctx.get("input")
    if text is None:
        text = input("Enter URL: ")
    print("[INPUT] URL:", text)
    return {"url": text}


@capability(INTENT_PARSE_URL)
def node_parse_url(ctx):
    url = ctx.get("url", "").strip()
    print("[PARSE_URL] Parsed URL:", url)
    return {"url": url}


@capability(INTENT_HTTP_REQUEST)
def node_http_request(ctx):
    url = ctx.get("url")
    print("[HTTP] Requesting:", url)

    try:
        resp = requests.get(url, timeout=5)
        status = resp.status_code
        body = resp.text
        print(f"[HTTP] Status: {status}")
        ctx["status_code"] = status
        ctx["response_body"] = body
        return {
            "status_code": status,
            "response_body": body,
        }
    except Exception as e:
        print("[HTTP] Error:", e)
        ctx["status_code"] = 0
        ctx["response_body"] = str(e)
        return {
            "status_code": 0,
            "response_body": str(e),
        }


@capability(INTENT_HANDLE_SUCCESS)
def node_handle_success(ctx):
    print("[SUCCESS] Handling success branch")
    return ctx


@capability(INTENT_HANDLE_ERROR)
def node_handle_error(ctx):
    print("[ERROR] Handling error branch")
    return ctx


@capability(INTENT_EXTRACT_DATA)
def node_extract_data(ctx):
    body = ctx.get("response_body", "")
    # 这里简单截断展示，真实系统你可以做 JSON 解析等
    snippet = body[:120]
    print("[EXTRACT] Snippet:", snippet)
    return {"snippet": snippet}


@capability(INTENT_OUTPUT_SUCCESS)
def node_output_success(ctx):
    snippet = ctx.get("snippet", "")
    print("[OUTPUT_SUCCESS] Data snippet:\n", snippet)
    return ctx


@capability(INTENT_OUTPUT_ERROR)
def node_output_error(ctx):
    body = ctx.get("response_body", "")
    print("[OUTPUT_ERROR] Error body:\n", body)
    return ctx
