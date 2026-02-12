# tools/catapillar.py
# Catapillar CLI entry point
# 执行 .cat 文件 → 解析 → 转 Intent Flow → 运行 Runtime

import sys
import os
import warnings

# ------------------------------------------------------------
# 1️⃣ Ensure project root is on sys.path
#    保证项目根目录可被 Python 识别
# ------------------------------------------------------------
ROOT = os.path.dirname(os.path.dirname(__file__))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

# ------------------------------------------------------------
# 2️⃣ Configure Catapillar warning behavior
#    定制语言级 Warning 输出（不显示 Python traceback）
# ------------------------------------------------------------
from parser.errors import CatapillarWarning, CatapillarError

def _show_catapillar_warning(message, category, filename, lineno, file=None, line=None):
    # 自定义 Warning 输出格式
    print(f"[Catapillar Warning] {message}")

warnings.showwarning = _show_catapillar_warning
warnings.simplefilter("always", CatapillarWarning)

# ------------------------------------------------------------
# 3️⃣ Import core components
#    导入语言核心模块
# ------------------------------------------------------------
from parser.parser import parse_file
from mapper.flow_mapper import map_program_to_flow
from runtime.engine import run_flow
from runtime.lexicon_loader import load_lexicon

# 注册 Python 能力节点（必须 import 才会注册）
import runtime.robot_nodes


# ------------------------------------------------------------
# 4️⃣ Main Execution Logic
#    主执行流程
# ------------------------------------------------------------
def main():
    if len(sys.argv) < 2:
        print("Usage: python tools/catapillar.py <file.cat>")
        sys.exit(1)

    # ✅ 先加载词典
    load_lexicon("lexicon/default.yaml")
    load_lexicon("lexicon/agent.yaml")
    load_lexicon("lexicon/project_x.yaml")
    load_lexicon("lexicon/project_api.yaml")

    path = sys.argv[1]

    # 解析 AST
    ast = parse_file(path)

    # 映射成 Intent Flow
    flow = map_program_to_flow(ast)

    print("=== FLOW ===")
    print(flow)

    if not flow:
        print("No executable flow generated.")
        return

    # 执行 Runtime
    ctx = {"input": "保存这段话"}
    run_flow(flow, ctx)

    print("\n=== AST ===")
    print(ast)



# ------------------------------------------------------------
# Entry Guard
# ------------------------------------------------------------
if __name__ == "__main__":
    try:
        main()
    except CatapillarError as e:
       print(f"[Catapillar Error] {e}")
       sys.exit(1)
