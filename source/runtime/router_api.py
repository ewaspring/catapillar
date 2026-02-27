# runtime/router_api.py

from runtime.intents import *

class ApiRouter:

    def route(self, current_intent, ctx):
        status = ctx.get("status_code", None)

        if current_intent == INTENT_INPUT:
            return INTENT_PARSE_URL

        if current_intent == INTENT_PARSE_URL:
            return INTENT_HTTP_REQUEST

        if current_intent == INTENT_HTTP_REQUEST:
            if status and 200 <= status < 300:
                return INTENT_HANDLE_SUCCESS
            else:
                return INTENT_HANDLE_ERROR

        if current_intent == INTENT_HANDLE_SUCCESS:
            return INTENT_EXTRACT_DATA

        if current_intent == INTENT_EXTRACT_DATA:
            return INTENT_OUTPUT_SUCCESS

        if current_intent == INTENT_HANDLE_ERROR:
            return INTENT_OUTPUT_ERROR

        return None
