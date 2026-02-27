from runtime.nodes import capability
from runtime.intents import *
from runtime.lexicon_loader import resolve_intent


# 1️⃣ INPUT NODE
# Responsible only for receiving input.
# Does not decide what the input means.
@capability(INTENT_INPUT)
def node_input(ctx):
    text = ctx.get("input", "")
    print("[INPUT] Received:", text)
    return {"text": text}


# 2️⃣ PARSE NODE
# Performs structural parsing.
# No branching or decision logic here.
@capability(INTENT_PARSE)
def node_parse(ctx):
    text = ctx.get("text", "")
    print("[PARSE] Processing text")

    resolved = resolve_intent(text)

    if resolved:
        print("[PARSE] Resolved intent:", resolved)
        return {
            "parsed_text": text,
            "resolved_intent": resolved
        }
    else:
        print("[PARSE] No intent matched")
        return {
            "parsed_text": text,
            "resolved_intent": None
        }

# 3️⃣ DECIDE NODE
# Delegates decision-making to the router.
# Does not branch internally.
@capability(INTENT_DECIDE)
def node_decide(ctx):
    print("[DECIDE] Passing control to router")
    return ctx


# 4️⃣ ACTION NODE
# Executes an action defined by the router.
# The node itself does not determine which action.
@capability(INTENT_ACTION)
def node_action(ctx):
    action = ctx.get("action", "undefined")
    print(f"[ACTION] Executing action: {action}")
    return ctx


# 5️⃣ FEEDBACK NODE
# Final stage in the flow.
# Used to signal completion or return output.
@capability(INTENT_FEEDBACK)
def node_feedback(ctx):
    print("[FEEDBACK] Flow completed")
    return ctx
