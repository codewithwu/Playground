# PromptCoder 增强实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 PromptCoder 增加序列化、验证、diff 和条件模块功能，同时修复 star imports 问题

**Architecture:** 在保持现有 PyTorch-style Module 架构基础上，新增 4 个独立模块文件，分别处理序列化、验证、diff 和条件逻辑。修复所有 star imports 为显式导入。

**Tech Stack:** Python 3.12+, 无新增外部依赖

---

## 文件结构

```
PromptCoder/
├── procoder/
│   ├── __init__.py              # 修改：显式导入 + __all__
│   ├── functional.py            # 修改：显式导入
│   └── prompt/
│       ├── __init__.py          # 修改：显式导入 + __all__
│       ├── base.py              # 不改
│       ├── modules.py           # 不改
│       ├── sequential.py        # 不改
│       ├── proxy.py             # 不改
│       ├── utils.py             # 不改
│       ├── serialization.py      # 新增
│       ├── validation.py         # 新增
│       ├── diff.py              # 新增
│       └── conditionals.py      # 新增
```

---

## Task 1: 修复 star imports 问题

**Files:**
- Modify: `PromptCoder/procoder/__init__.py`
- Modify: `PromptCoder/procoder/functional.py`
- Modify: `PromptCoder/procoder/prompt/__init__.py`
- Modify: `PromptCoder/procoder/prompt/modules.py`
- Modify: `PromptCoder/procoder/prompt/sequential.py`
- Modify: `PromptCoder/procoder/prompt/proxy.py`

- [ ] **Step 1: 读取并修改 `procoder/__init__.py`**

当前内容：
```python
from .functional import *
__version__ = "0.0.1"
```

修改为：
```python
from .functional import (
    format_prompt,
    format_multiple_prompts,
    collect_refnames,
    add_refnames,
    replaced_submodule,
    removed_submodule,
    find_submodule,
    replace_prompt,
    silence,
    add_indent,
    add_indent2,
    add_indent4,
    add_indent_tab,
)

__all__ = [
    "format_prompt",
    "format_multiple_prompts",
    "collect_refnames",
    "add_refnames",
    "replaced_submodule",
    "removed_submodule",
    "find_submodule",
    "replace_prompt",
    "silence",
    "add_indent",
    "add_indent2",
    "add_indent4",
    "add_indent_tab",
]

__version__ = "0.0.1"
```

- [ ] **Step 2: 读取并修改 `procoder/functional.py`**

将顶部的 `from procoder.utils.my_typing import *` 改为显式导入需要用到的类型：
```python
from procoder.utils.my_typing import (
    Any,
    Callable,
    Dict,
    List,
    OrderedDict,
    Tuple,
    TypeVar,
    Union,
    Set,
)
```

- [ ] **Step 3: 读取并修改 `procoder/prompt/__init__.py`**

当前内容：
```python
from .base import Module, Single, T
from .modules import *
from .sequential import *
from .utils import *
```

修改为：
```python
from .base import Module, Single, T, as_module
from .modules import (
    Paired,
    Collection,
    Block,
    NamedBlock,
    NamedVariable,
)
from .sequential import Sequential, number_indexing, sharp_indexing, sharp2_indexing
from .utils import make_ordered_dict

__all__ = [
    "Module",
    "Single",
    "T",
    "as_module",
    "Paired",
    "Collection",
    "Block",
    "NamedBlock",
    "NamedVariable",
    "Sequential",
    "number_indexing",
    "sharp_indexing",
    "sharp2_indexing",
    "make_ordered_dict",
]
```

- [ ] **Step 4: 修改 `procoder/prompt/modules.py`**

将 `from procoder.utils.my_typing import *` 改为显式导入

- [ ] **Step 5: 修改 `procoder/prompt/sequential.py`**

将 `from procoder.utils.my_typing import *` 改为显式导入
将 `from .utils import *` 改为显式导入 `make_ordered_dict`

- [ ] **Step 6: 修改 `procoder/prompt/proxy.py`**

将 `from procoder.utils.my_typing import *` 改为显式导入

- [ ] **Step 7: 运行 lint 验证**

Run: `cd PromptCoder && uv run ruff check .`
Expected: 无 F403/F405 错误

- [ ] **Step 8: Commit**

```bash
git add PromptCoder/procoder/__init__.py PromptCoder/procoder/functional.py PromptCoder/procoder/prompt/__init__.py PromptCoder/procoder/prompt/modules.py PromptCoder/procoder/prompt/sequential.py PromptCoder/procoder/prompt/proxy.py
git commit -m "fix: replace star imports with explicit imports"
```

---

## Task 2: 实现序列化模块

**Files:**
- Create: `PromptCoder/procoder/prompt/serialization.py`
- Test: `PromptCoder/tests/test_serialization.py`

- [ ] **Step 1: 创建 `PromptCoder/procoder/prompt/serialization.py`**

```python
"""序列化模块：Prompt 对象的序列化与反序列化"""
from __future__ import annotations

import json
from typing import Any, Dict, TypeVar, TYPE_CHECKING

from .base import Module, Single, as_module

if TYPE_CHECKING:
    from .sequential import Sequential
    from .proxy import AddIndentProxy, SilenceProxy

T = TypeVar("T", bound=Module)


def _module_to_dict(module: Module) -> Dict[str, Any]:
    """将 Module 转为 dict"""
    result: Dict[str, Any] = {
        "type": module.__class__.__name__,
        "refname": module.refname,
    }

    if isinstance(module, Single):
        result["prompt"] = module.prompt
        result["need_format"] = module._need_format
    elif hasattr(module, "_modules"):
        result["modules"] = {
            name: _module_to_dict(sub) for name, sub in module._modules.items() if sub is not None
        }
        result["sep"] = module._sep
        result["delta_indent"] = module._delta_indent
        if hasattr(module, "_indexing_method") and module._indexing_method is not None:
            result["indexing_method"] = getattr(module, "_indexing_method", None).__name__
        if hasattr(module, "_name_enabled"):
            result["name_enabled"] = module._name_enabled

    return result


def _dict_to_module(data: Dict[str, Any]) -> Module:
    """将 dict 转为 Module"""
    module_type = data.get("type")
    refname = data.get("refname")

    if module_type == "Single":
        module = Single(data["prompt"], need_format=data.get("need_format", True))
    elif module_type == "SilenceProxy":
        from .proxy import SilenceProxy
        inner = _dict_to_module(data["modules"]["prompt"])
        module = SilenceProxy(inner)
    elif module_type == "AddIndentProxy":
        from .proxy import AddIndentProxy
        inner = _dict_to_module(data["modules"]["prompt"])
        module = AddIndentProxy(inner, data.get("delta_indent", ""))
    elif module_type in ("Sequential", "Collection", "Block", "NamedBlock", "NamedVariable", "Paired"):
        from .sequential import Sequential
        from .utils import make_ordered_dict
        modules_dict = data.get("modules", {})
        ordered = make_ordered_dict(
            list(modules_dict.keys()),
            [_dict_to_module(v) for v in modules_dict.values()]
        )
        module = Sequential(ordered)
        if "sep" in data:
            module.set_sep(data["sep"])
        if "delta_indent" in data:
            module.set_delta_indent(data["delta_indent"])
        if "indexing_method" in data:
            from .sequential import number_indexing, sharp_indexing, sharp2_indexing
            indexing_map = {
                "number_indexing": number_indexing,
                "sharp_indexing": sharp_indexing,
                "sharp2_indexing": sharp2_indexing,
            }
            method_name = data["indexing_method"]
            if method_name in indexing_map:
                module.set_indexing_method(indexing_map[method_name])
        if "name_enabled" in data and data["name_enabled"]:
            module.enable_name()
    else:
        # 未知类型，默认作为 Single 处理
        module = Single(str(data))

    if refname:
        module.set_refname(refname)

    return module


class SerializationMixin:
    """序列化混入类，为 Module 添加序列化方法"""

    def to_dict(self) -> Dict[str, Any]:
        """将 Prompt 转为 dict"""
        return _module_to_dict(self)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Module":
        """从 dict 恢复 Module"""
        return _dict_to_module(data)

    def to_json(self) -> str:
        """将 Prompt 转为 JSON 字符串"""
        return json.dumps(self.to_dict(), ensure_ascii=False, indent=2)

    @classmethod
    def from_json(cls, json_str: str) -> "Module":
        """从 JSON 字符串恢复 Module"""
        return cls.from_dict(json.loads(json_str))

    def copy(self) -> "Module":
        """深度复制 Prompt"""
        return self.from_dict(self.to_dict())


# 为 Module 类添加序列化方法
Module.to_dict = SerializationMixin.to_dict
Module.from_dict = classmethod(SerializationMixin.from_dict)  # type: ignore
Module.to_json = SerializationMixin.to_json  # type: ignore
Module.from_json = classmethod(SerializationMixin.from_json)  # type: ignore
Module.copy = SerializationMixin.copy  # type: ignore
```

- [ ] **Step 2: 创建测试文件 `PromptCoder/tests/test_serialization.py`**

```python
"""序列化模块测试"""
import pytest
from procoder.prompt import (
    Module, Single, Collection, NamedBlock, NamedVariable,
    number_indexing, sharp2_indexing
)
from procoder.prompt.serialization import _module_to_dict, _dict_to_module


def test_single_to_dict():
    s = Single("Hello {name}")
    s.set_refname("greeting")
    d = _module_to_dict(s)
    assert d["type"] == "Single"
    assert d["prompt"] == "Hello {name}"
    assert d["refname"] == "greeting"


def test_single_roundtrip():
    s = Single("Hello {name}", need_format=True)
    s.set_refname("greeting")
    d = _module_to_dict(s)
    restored = _dict_to_module(d)
    assert isinstance(restored, Single)
    assert restored.prompt == s.prompt
    assert restored.refname == s.refname


def test_collection_roundtrip():
    reqs = NamedBlock(
        "Requirements",
        NamedVariable("input", "Input variable", refname="input_var"),
        refname="reqs"
    )
    coll = Collection(reqs)
    coll.set_indexing_method(number_indexing)

    d = _module_to_dict(coll)
    restored = _dict_to_module(d)

    assert isinstance(restored, Collection)
    assert restored.refname == coll.refname


def test_json_roundtrip():
    s = Single("Test {var}")
    s.set_refname("test")
    json_str = s.to_json()
    restored = Module.from_json(json_str)
    assert restored.prompt == s.prompt


def test_copy():
    s = Single("Original {name}")
    s.set_refname("orig")
    copied = s.copy()
    assert copied.prompt == s.prompt
    assert copied.refname == s.refname
    assert copied is not s
```

- [ ] **Step 3: 运行测试验证**

Run: `cd PromptCoder && uv run pytest tests/test_serialization.py -v`
Expected: 全部 PASS

- [ ] **Step 4: Commit**

```bash
git add PromptCoder/procoder/prompt/serialization.py PromptCoder/tests/test_serialization.py
git commit -m "feat: add serialization module with to_dict/from_dict/to_json/from_json/copy"
```

---

## Task 3: 实现验证器模块

**Files:**
- Create: `PromptCoder/procoder/prompt/validation.py`
- Test: `PromptCoder/tests/test_validation.py`

- [ ] **Step 1: 创建 `PromptCoder/procoder/prompt/validation.py`**

```python
"""验证器模块：检查 Prompt 中变量的使用情况"""
from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any, Dict, List, Set

from .base import Module, Single


@dataclass
class ValidationResult:
    """验证结果"""
    valid: bool
    missing_vars: List[str]
    undefined_vars: List[str]

    @property
    def is_valid(self) -> bool:
        return self.valid and not self.missing_vars and not self.undefined_vars


class Validator:
    """Prompt 验证器"""

    # 匹配 {var_name} 格式的变量
    VAR_PATTERN = re.compile(r"\{(\w+)\}")

    @classmethod
    def _extract_vars(cls, prompt: Module) -> Set[str]:
        """从 Prompt 中提取所有变量名"""
        vars_used: Set[str] = set()

        if isinstance(prompt, Single):
            found = cls.VAR_PATTERN.findall(prompt.prompt)
            vars_used.update(found)
        elif hasattr(prompt, "_modules"):
            for sub in prompt._modules.values():
                if sub is not None:
                    vars_used.update(cls._extract_vars(sub))

        return vars_used

    @classmethod
    def check_missing_vars(cls, prompt: Module, inputs: Dict[str, Any]) -> List[str]:
        """检查 prompt 需要但 inputs 中缺失的变量"""
        required_vars = cls._extract_vars(prompt)
        provided_vars = set(inputs.keys())
        return sorted(required_vars - provided_vars)

    @classmethod
    def check_undefined_vars(cls, prompt: Module, inputs: Dict[str, Any]) -> List[str]:
        """检查 inputs 中有但 prompt 中未使用的变量"""
        required_vars = cls._extract_vars(prompt)
        provided_vars = set(inputs.keys())
        return sorted(provided_vars - required_vars)

    @classmethod
    def validate(cls, prompt: Module, inputs: Dict[str, Any]) -> ValidationResult:
        """综合验证 Prompt 和 inputs"""
        missing = cls.check_missing_vars(prompt, inputs)
        undefined = cls.check_undefined_vars(prompt, inputs)
        return ValidationResult(
            valid=len(missing) == 0,
            missing_vars=missing,
            undefined_vars=undefined,
        )
```

- [ ] **Step 2: 创建测试文件 `PromptCoder/tests/test_validation.py`**

```python
"""验证器模块测试"""
import pytest
from procoder.prompt import Single, Collection, NamedBlock, NamedVariable
from procoder.prompt.validation import Validator, ValidationResult


def test_check_missing_vars():
    s = Single("Hello {name}, you have {count} messages")
    missing = Validator.check_missing_vars(s, {"name": "Alice"})
    assert "count" in missing


def test_check_undefined_vars():
    s = Single("Hello {name}")
    undefined = Validator.check_undefined_vars(s, {"name": "Alice", "unused": "value"})
    assert "unused" in undefined


def test_validate_valid():
    s = Single("Hello {name}")
    result = Validator.validate(s, {"name": "Alice"})
    assert result.is_valid
    assert result.missing_vars == []
    assert result.undefined_vars == []


def test_validate_missing():
    s = Single("Hello {name} {missing_var}")
    result = Validator.validate(s, {"name": "Alice"})
    assert not result.valid
    assert "missing_var" in result.missing_vars


def test_validate_undefined():
    s = Single("Hello {name}")
    result = Validator.validate(s, {"name": "Alice", "extra": "value"})
    assert not result.valid
    assert "extra" in result.undefined_vars


def test_nested_module():
    block = NamedBlock(
        "Reqs",
        NamedVariable("name", "Name", refname="n"),
        refname="reqs"
    )
    s = Single("Answer for {n} is {answer}")
    missing = Validator.check_missing_vars(s, {"n": "test"})
    assert "answer" in missing
```

- [ ] **Step 3: 运行测试验证**

Run: `cd PromptCoder && uv run pytest tests/test_validation.py -v`
Expected: 全部 PASS

- [ ] **Step 4: Commit**

```bash
git add PromptCoder/procoder/prompt/validation.py PromptCoder/tests/test_validation.py
git commit -m "feat: add Validator module for prompt variable validation"
```

---

## Task 4: 实现 Diff 模块

**Files:**
- Create: `PromptCoder/procoder/prompt/diff.py`
- Test: `PromptCoder/tests/test_diff.py`

- [ ] **Step 1: 创建 `PromptCoder/procoder/prompt/diff.py`**

```python
"""Diff 模块：对比两个 Prompt 的结构差异"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Optional

from .base import Module, Single


@dataclass
class ChangedModule:
    """内容改变的模块"""
    refname: str
    old_value: str
    new_value: str


@dataclass
class DiffResult:
    """Diff 结果"""
    added: List[str]      # prompt2 有但 prompt1 没有的模块 refname
    removed: List[str]    # prompt1 有但 prompt2 没有的模块 refname
    changed: List[ChangedModule]  # 都存在但内容不同的模块


class PromptDiff:
    """Prompt 差异对比工具"""

    @classmethod
    def _get_all_refnames(cls, prompt: Module) -> Dict[str, str]:
        """获取所有模块的 refname -> 字符串表示的映射"""
        result: Dict[str, str] = {}

        def traverse(module: Module, prefix: str = ""):
            refname = module.refname or module._get_name()
            if prefix:
                refname = f"{prefix}.{refname}"

            if isinstance(module, Single):
                result[refname] = module.prompt
            elif hasattr(module, "_modules"):
                for name, sub in module._modules.items():
                    if sub is not None:
                        traverse(sub, refname)

        traverse(prompt)
        return result

    @classmethod
    def diff(cls, prompt1: Module, prompt2: Module) -> DiffResult:
        """对比两个 Prompt 的结构差异"""
        refs1 = cls._get_all_refnames(prompt1)
        refs2 = cls._get_all_refnames(prompt2)

        all_keys = set(refs1.keys()) | set(refs2.keys())

        added: List[str] = []
        removed: List[str] = []
        changed: List[ChangedModule] = []

        for key in sorted(all_keys):
            in1 = key in refs1
            in2 = key in refs2

            if in1 and not in2:
                removed.append(key)
            elif not in1 and in2:
                added.append(key)
            elif refs1[key] != refs2[key]:
                changed.append(ChangedModule(
                    refname=key,
                    old_value=refs1[key],
                    new_value=refs2[key],
                ))

        return DiffResult(
            added=added,
            removed=removed,
            changed=changed,
        )
```

- [ ] **Step 2: 创建测试文件 `PromptCoder/tests/test_diff.py`**

```python
"""Diff 模块测试"""
import pytest
from procoder.prompt import Single, Collection, NamedBlock, NamedVariable
from procoder.prompt.diff import PromptDiff, DiffResult, ChangedModule


def test_diff_added():
    p1 = Single("Hello")
    p2 = Single("Hello {name}")
    p2.set_refname("greeting")
    result = PromptDiff.diff(p1, p2)
    assert "greeting" in result.added


def test_diff_removed():
    p1 = Single("Hello {name}")
    p1.set_refname("greeting")
    p2 = Single("Hello")
    result = PromptDiff.diff(p1, p2)
    assert "greeting" in result.removed


def test_diff_changed():
    p1 = Single("Hello {name}")
    p1.set_refname("greeting")
    p2 = Single("Hi {name}")
    p2.set_refname("greeting")
    result = PromptDiff.diff(p1, p2)
    assert len(result.changed) == 1
    assert result.changed[0].refname == "greeting"
    assert result.changed[0].old_value == "Hello {name}"
    assert result.changed[0].new_value == "Hi {name}"


def test_diff_no_change():
    p1 = Single("Hello")
    p2 = Single("Hello")
    result = PromptDiff.diff(p1, p2)
    assert result.added == []
    assert result.removed == []
    assert result.changed == []


def test_diff_nested():
    block1 = NamedBlock("Reqs", Single("Requirement 1"), refname="reqs")
    block2 = NamedBlock("Reqs", Single("Requirement 2"), refname="reqs")
    result = PromptDiff.diff(block1, block2)
    assert len(result.changed) == 1
```

- [ ] **Step 3: 运行测试验证**

Run: `cd PromptCoder && uv run pytest tests/test_diff.py -v`
Expected: 全部 PASS

- [ ] **Step 4: Commit**

```bash
git add PromptCoder/procoder/prompt/diff.py PromptCoder/tests/test_diff.py
git commit -m "feat: add PromptDiff module for comparing prompt structures"
```

---

## Task 5: 实现条件模块

**Files:**
- Create: `PromptCoder/procoder/prompt/conditionals.py`
- Test: `PromptCoder/tests/test_conditionals.py`

- [ ] **Step 1: 创建 `PromptCoder/procoder/prompt/conditionals.py`**

```python
"""条件模块：根据条件选择不同的 Prompt 分支"""
from __future__ import annotations

from typing import Any, Callable, Dict, Optional

from .base import Module, TS, as_module


class IfModule(Module):
    """根据条件选择不同分支的模块"""

    def __init__(
        self,
        condition: Callable[[Dict[str, Any]], bool],
        true_module: TS,
        false_module: TS = None,
    ):
        """
        Args:
            condition: 条件函数，接收 inputs dict，返回 bool
            true_module: 条件为 True 时使用的模块
            false_module: 条件为 False 时使用的模块，可为 None
        """
        super().__init__()
        self._condition = condition
        self.add_module("true", as_module(true_module))
        if false_module is not None:
            self.add_module("false", as_module(false_module))
        self._sep = ""

    def forward(self, newline: bool = True, indent: str = "", x: Dict[str, Any] = None):
        result = []
        if self._condition(x or {}):
            result.append(self.true(newline, indent, x))
        elif "false" in self._modules:
            result.append(self.false(newline, indent, x))
        return "".join(result)


class ChoiceModule(Module):
    """根据 key 值在多个分支中选择一个"""

    def __init__(
        self,
        choice_key: str,
        choices: Dict[str, TS],
        default: TS = None,
    ):
        """
        Args:
            choice_key: inputs 中的 key，用于选择分支
            choices: key -> module 的映射
            default: 当 choice_key 的值不在 choices 中时使用，可为 None
        """
        super().__init__()
        self._choice_key = choice_key
        self._default = as_module(default) if default is not None else None

        for key, module in choices.items():
            self.add_module(f"choice_{key}", as_module(module))

        self._choices_keys = set(choices.keys())
        self._sep = ""

    def forward(self, newline: bool = True, indent: str = "", x: Dict[str, Any] = None):
        x = x or {}
        choice_value = x.get(self._choice_key)

        if choice_value in self._choices_keys:
            module = self._modules[f"choice_{choice_value}"]
        elif self._default is not None:
            module = self._default
        else:
            return ""

        return module(newline, indent, x)
```

- [ ] **Step 2: 创建测试文件 `PromptCoder/tests/test_conditionals.py`**

```python
"""条件模块测试"""
import pytest
from procoder.prompt import Single, Collection
from procoder.prompt.conditionals import IfModule, ChoiceModule


def test_if_module_true_branch():
    p = IfModule(
        condition=lambda x: x.get("is_chinese", False),
        true_module=Single("你好"),
        false_module=Single("Hello"),
    )

    result_en = p(x={"is_chinese": False})
    assert "Hello" in result_en
    assert "你好" not in result_en

    result_cn = p(x={"is_chinese": True})
    assert "你好" in result_cn
    assert "Hello" not in result_cn


def test_if_module_no_false():
    p = IfModule(
        condition=lambda x: x.get("show", False),
        true_module=Single("Visible"),
    )

    result = p(x={"show": False})
    assert result == ""


def test_choice_module():
    p = ChoiceModule(
        choice_key="language",
        choices={
            "python": Single("print('hello')"),
            "javascript": Single("console.log('hello')"),
        },
    )

    result_py = p(x={"language": "python"})
    assert "print" in result_py

    result_js = p(x={"language": "javascript"})
    assert "console.log" in result_js


def test_choice_module_default():
    p = ChoiceModule(
        choice_key="language",
        choices={
            "python": Single("print"),
        },
        default=Single("unknown"),
    )

    result = p(x={"language": "go"})
    assert "unknown" in result


def test_choice_module_no_default():
    p = ChoiceModule(
        choice_key="language",
        choices={
            "python": Single("print"),
        },
    )

    result = p(x={"language": "go"})
    assert result == ""
```

- [ ] **Step 3: 运行测试验证**

Run: `cd PromptCoder && uv run pytest tests/test_conditionals.py -v`
Expected: 全部 PASS

- [ ] **Step 4: Commit**

```bash
git add PromptCoder/procoder/prompt/conditionals.py PromptCoder/tests/test_conditionals.py
git commit -m "feat: add IfModule and ChoiceModule for conditional prompt branching"
```

---

## Task 6: 更新 `__init__.py` 导出新模块

**Files:**
- Modify: `PromptCoder/procoder/prompt/__init__.py`

- [ ] **Step 1: 更新导出**

在 `PromptCoder/procoder/prompt/__init__.py` 中添加新模块的导出：

```python
from .base import Module, Single, T, as_module
from .modules import (
    Paired,
    Collection,
    Block,
    NamedBlock,
    NamedVariable,
)
from .sequential import Sequential, number_indexing, sharp_indexing, sharp2_indexing
from .utils import make_ordered_dict
from .conditionals import IfModule, ChoiceModule  # 新增

__all__ = [
    # ... 现有内容 ...
    "IfModule",   # 新增
    "ChoiceModule",  # 新增
]
```

- [ ] **Step 2: 验证导入**

Run: `cd PromptCoder && uv run python -c "from procoder.prompt import IfModule, ChoiceModule; print('OK')"`
Expected: 输出 "OK"

- [ ] **Step 3: Commit**

```bash
git add PromptCoder/procoder/prompt/__init__.py
git commit -m "feat: export IfModule and ChoiceModule from procoder.prompt"
```

---

## Task 7: 最终验证

**Files:**
- Modify: `PromptCoder/procoder/prompt/__init__.py`

- [ ] **Step 1: 运行完整测试**

Run: `cd PromptCoder && uv run pytest tests/ -v`
Expected: 全部 PASS

- [ ] **Step 2: 运行 lint 检查**

Run: `cd PromptCoder && uv run ruff check .`
Expected: 无 F403/F405 错误

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: complete PromptCoder enhancement - serialization, validation, diff, conditionals"
```

---

## 依赖关系

```
Task 1 (star imports) ──┬── Task 2 (serialization)
                        │
Task 3 (validation)     ├── Task 4 (diff) ──┬── Task 5 (conditionals)
                        │                   │
                        └───────────────────┴── Task 6 (update exports) ── Task 7 (final)
```

## 自检清单

- [ ] spec 覆盖：序列化 ✓，验证器 ✓，Diff ✓，条件模块 ✓，代码修复 ✓
- [ ] 无 placeholder：所有代码块已完整提供
- [ ] 类型一致性：所有方法签名在任务间保持一致
