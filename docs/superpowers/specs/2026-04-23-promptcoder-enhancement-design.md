# PromptCoder 增强方案设计

**日期：** 2026-04-23
**状态：** 已批准

---

## 1. 目标

在保持 PromptCoder 现有架构的基础上：
1. 修复 star imports 导致的 lint 错误
2. 增加序列化/反序列化功能
3. 增加 Prompt 验证器
4. 增加 Prompt diff 工具
5. 增加条件模块（IfModule / ChoiceModule）

---

## 2. 文件结构变更

```
PromptCoder/
├── procoder/
│   ├── __init__.py          # 修复：显式导入 + __all__
│   ├── functional.py        # 修复：显式导入
│   └── prompt/
│       ├── __init__.py      # 修复：显式导入 + __all__
│       ├── base.py          # 核心 Module 类
│       ├── modules.py       # 预制模块
│       ├── sequential.py    # Sequential 组合
│       ├── proxy.py         # 代理模块
│       ├── utils.py         # 工具函数
│       ├── serialization.py # 新增：序列化/反序列化
│       ├── validation.py    # 新增：Prompt 验证器
│       ├── diff.py          # 新增：Prompt diff 工具
│       └── conditionals.py  # 新增：条件模块
```

---

## 3. 序列化模块 (`serialization.py`)

### 3.1 数据结构

```python
{
    "type": "Single|Collection|Block|...",
    "prompt": "...",           # 仅 Single 有
    "modules": {...},         # 子模块字典
    "sep": "\n",
    "refname": "...",
    "need_format": True,       # 仅 Single 有
    "delta_indent": "  ",     # 仅 Proxy 类有
}
```

### 3.2 API

- `Module.to_dict() -> dict` — 转为 JSON-serializable dict
- `Module.from_dict(dict) -> Module` — 从 dict 恢复
- `Module.to_json() -> str` — 转为 JSON 字符串
- `Module.from_json(str) -> Module` — 从 JSON 恢复
- `Module.copy() -> Module` — 便捷深度复制

---

## 4. 验证器模块 (`validation.py`)

### 4.1 API

```python
class Validator:
    @staticmethod
    def check_undefined_vars(prompt: Module, inputs: Dict[str, Any]) -> List[str]:
        """检查 inputs 中有但 prompt 中未使用的变量"""

    @staticmethod
    def check_missing_vars(prompt: Module, inputs: Dict[str, Any]) -> List[str]:
        """检查 prompt 需要但 inputs 中缺失的变量"""

    @staticmethod
    def validate(prompt: Module, inputs: Dict[str, Any]) -> ValidationResult:
        """综合验证，返回结果包含 missing_vars, undefined_vars, valid"""
```

### 4.2 ValidationResult 结构

```python
@dataclass
class ValidationResult:
    valid: bool
    missing_vars: List[str]
    undefined_vars: List[str]
```

---

## 5. Diff 模块 (`diff.py`)

### 5.1 API

```python
class PromptDiff:
    @staticmethod
    def diff(prompt1: Module, prompt2: Module) -> DiffResult:
        """对比两个 Prompt 的结构差异"""
```

### 5.2 DiffResult 结构

```python
@dataclass
class DiffResult:
    added: List[str]      # prompt2 有但 prompt1 没有的模块 refname
    removed: List[str]    # prompt1 有但 prompt2 没有的模块 refname
    changed: List[ChangedModule]  # 都存在但内容不同的模块

@dataclass
class ChangedModule:
    refname: str
    old_value: str
    new_value: str
```

---

## 6. 条件模块 (`conditionals.py`)

### 6.1 IfModule

```python
class IfModule(Module):
    def __init__(
        self,
        condition: Callable[[Dict[str, Any]], bool],
        true_module: TS,
        false_module: TS = None
    ):
        """
        根据条件选择不同分支
        - condition: 条件函数，接收 inputs dict，返回 bool
        - true_module: 条件为 True 时使用的模块
        - false_module: 条件为 False 时使用的模块，可为 None
        """
```

### 6.2 ChoiceModule

```python
class ChoiceModule(Module):
    def __init__(
        self,
        choice_key: str,
        choices: Dict[str, TS],
        default: TS = None
    ):
        """
        根据 key 值选择多个分支中的一个
        - choice_key: inputs 中的 key，用于选择分支
        - choices: key -> module 的映射
        - default: 当 choice_key 的值不在 choices 中时使用，可为 None
        """
```

### 6.3 使用示例

```python
# IfModule
pp.IfModule(
    condition=lambda x: x.get("is_chinese", False),
    true_module=chinese_prompt,
    false_module=english_prompt
)

# ChoiceModule
pp.ChoiceModule(
    choice_key="language",
    choices={
        "python": python_prompt,
        "javascript": js_prompt,
    },
    default=default_prompt
)
```

---

## 7. 代码修复

### 7.1 Star imports 修复

所有 `from xxx import *` 改为显式导入，并添加 `__all__` 列表。

**修改文件：**
- `procoder/__init__.py`
- `procoder/functional.py`
- `procoder/prompt/__init__.py`
- `procoder/prompt/modules.py`
- `procoder/prompt/sequential.py`
- `procoder/prompt/proxy.py`

### 7.2 类型注解修复

- `get_all_submodules` 返回类型改为 `Set["Module"]`
- 补充部分缺失的类型注解

---

## 8. 测试策略

- 为每个新模块编写单元测试
- 测试覆盖：正常路径、边界情况、错误处理
- 序列化模块需测试 round-trip（to_dict -> from_dict）

---

## 9. 依赖变更

无新增外部依赖，使用 Python 标准库。
