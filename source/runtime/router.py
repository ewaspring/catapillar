from runtime.intents import *

class Router:
    """
    Router decides the next intent based on current intent and context.
    It does NOT inspect raw text.
    It only works with Intent IDs.
    """

    def route(self, current_intent, ctx):
        """
        Returns the next Intent ID or None to stop execution.
        """

        # INPUT → PARSE
        if current_intent == INTENT_INPUT:
            return INTENT_PARSE

        # PARSE → DECIDE
        if current_intent == INTENT_PARSE:
            return INTENT_DECIDE

        # DECIDE → resolved intent (must be set in ctx)
        if current_intent == INTENT_DECIDE:
            next_intent = ctx.get("resolved_intent")

            if next_intent and next_intent != INTENT_DECIDE:
                return next_intent

            return INTENT_FEEDBACK
        # ACTION → FEEDBACK
        if current_intent == INTENT_ACTION:
            return INTENT_FEEDBACK

        # FEEDBACK → END (stop execution)
        if current_intent == INTENT_FEEDBACK:
            return None

        return None
