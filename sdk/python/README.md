# CiteAlpha Python SDK

Read-only client for `/api/v1` (companies, GCI, history, rankings, changelog).

```python
from citealpha import CiteAlpha

ca = CiteAlpha("https://citealpha.com")
print(ca.gci("infy")["gci_score"])
```
