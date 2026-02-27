from typing import Dict, List
from runtime.lexicon_loader import resolve_intent

def map_program_to_flow(program: Dict) -> List[str]:
    flow = []

    for flow_obj in program.get("flows", []):
        for segment in flow_obj.get("segments", []):
            for line in segment.get("lines", []):
                if line.get("type") == "Arrow":
                    from_word = line["from"]
                    to_word = line["to"]

                    from_intent = resolve_intent(from_word)
                    to_intent = resolve_intent(to_word)

                    if from_intent:
                        flow.append(from_intent)
                    if to_intent:
                        flow.append(to_intent)

    return flow
