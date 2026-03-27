import { Response } from 'express'
import { ChatThread, ChatMessage } from '../models'
import { SenderRole } from '../models/ChatMessage'
import { success, error } from '../utils/jsend'
import { AuthRequest } from '../middlewares/auth.middleware'

const PLACEHOLDER_RESPONSES = [
  `Great question! Here's how you can implement a **binary search** in Python:

\`\`\`python
def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1
\`\`\`

The time complexity is $O(\\log n)$ and space complexity is $O(1)$.`,

  `## Understanding Big-O Notation

Big-O describes the **upper bound** of an algorithm's growth rate. Here are the most common complexities:

| Complexity | Name | Example |
|-----------|------|---------|
| $O(1)$ | Constant | Hash table lookup |
| $O(\\log n)$ | Logarithmic | Binary search |
| $O(n)$ | Linear | Array traversal |
| $O(n \\log n)$ | Linearithmic | Merge sort |
| $O(n^2)$ | Quadratic | Bubble sort |

> **Tip:** Always aim for the lowest complexity possible, but remember that constants matter for small inputs!`,

  `The **quadratic formula** is useful in many algorithmic contexts. Given $ax^2 + bx + c = 0$, the solution is:

$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$

Here's how you'd implement it in TypeScript:

\`\`\`typescript
function solveQuadratic(a: number, b: number, c: number): [number, number] | null {
  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return null;
  const sqrtD = Math.sqrt(discriminant);
  return [(-b + sqrtD) / (2 * a), (-b - sqrtD) / (2 * a)];
}
\`\`\`

The discriminant $\\Delta = b^2 - 4ac$ tells us:
- If $\\Delta > 0$: two real roots
- If $\\Delta = 0$: one repeated root
- If $\\Delta < 0$: no real roots`,

  `## React Hooks Cheat Sheet

Here are the most common hooks you'll use:

### \`useState\`
\`\`\`jsx
const [count, setCount] = useState(0);
\`\`\`

### \`useEffect\`
\`\`\`jsx
useEffect(() => {
  document.title = \`Count: \${count}\`;
  return () => {
    // cleanup function
  };
}, [count]);
\`\`\`

### \`useMemo\`
\`\`\`jsx
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(a, b);
}, [a, b]);
\`\`\`

**Rules of Hooks:**
1. Only call hooks at the **top level** — never inside loops or conditions
2. Only call hooks from **React functions** — not regular JS functions
3. Custom hooks must start with \`use\``,

  `Let me explain **recursion** with the classic Fibonacci example.

The mathematical definition is:

$$F(n) = \\begin{cases} 0 & \\text{if } n = 0 \\\\ 1 & \\text{if } n = 1 \\\\ F(n-1) + F(n-2) & \\text{if } n > 1 \\end{cases}$$

The naive recursive approach has $O(2^n)$ time complexity:

\`\`\`python
def fib(n):
    if n <= 1:
        return n
    return fib(n - 1) + fib(n - 2)
\`\`\`

But with **memoization**, we can bring it down to $O(n)$:

\`\`\`python
from functools import lru_cache

@lru_cache(maxsize=None)
def fib(n):
    if n <= 1:
        return n
    return fib(n - 1) + fib(n - 2)
\`\`\`

> Always look for overlapping subproblems — that's the hallmark of dynamic programming!`,

  `Here's a quick guide to **SQL JOINs**:

\`\`\`sql
-- INNER JOIN: only matching rows
SELECT users.name, orders.total
FROM users
INNER JOIN orders ON users.id = orders.user_id;

-- LEFT JOIN: all left rows + matching right
SELECT users.name, COALESCE(orders.total, 0) as total
FROM users
LEFT JOIN orders ON users.id = orders.user_id;
\`\`\`

The key relationships:
- **One-to-Many**: A user has many orders
- **Many-to-Many**: Students ↔ Courses (via enrollment table)
- **One-to-One**: User ↔ Profile

Remember: \`INNER JOIN\` filters out non-matching rows, while \`LEFT JOIN\` keeps all rows from the left table.`,

  `## Sorting Algorithm Comparison

The sum of the first $n$ natural numbers is $\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}$, which is why simple nested loops give us $O(n^2)$.

Here's **merge sort** in Go — a classic $O(n \\log n)$ algorithm:

\`\`\`go
func mergeSort(arr []int) []int {
    if len(arr) <= 1 {
        return arr
    }
    mid := len(arr) / 2
    left := mergeSort(arr[:mid])
    right := mergeSort(arr[mid:])
    return merge(left, right)
}

func merge(left, right []int) []int {
    result := make([]int, 0, len(left)+len(right))
    i, j := 0, 0
    for i < len(left) && j < len(right) {
        if left[i] <= right[j] {
            result = append(result, left[i])
            i++
        } else {
            result = append(result, right[j])
            j++
        }
    }
    result = append(result, left[i:]...)
    result = append(result, right[j:]...)
    return result
}
\`\`\`

**Key takeaway:** Merge sort guarantees $O(n \\log n)$ in *all* cases, unlike quicksort which degrades to $O(n^2)$ in the worst case.`,

  `### The Rust Ownership Model

Rust's ownership system prevents memory bugs at compile time. The three rules are:

1. Each value has exactly **one owner**
2. When the owner goes out of scope, the value is **dropped**
3. You can have *either* one mutable reference \`&mut T\` *or* many immutable references \`&T\`

\`\`\`rust
fn main() {
    let s1 = String::from("hello");
    let s2 = s1; // s1 is MOVED, no longer valid

    // This won't compile:
    // println!("{}", s1);

    // Use clone() for a deep copy:
    let s3 = s2.clone();
    println!("{} {}", s2, s3); // Both valid!
}
\`\`\`

Think of it like passing a physical book — you can't read it after giving it away, unless you make a copy first!`
]

function getPlaceholderResponse(): string {
  return PLACEHOLDER_RESPONSES[Math.floor(Math.random() * PLACEHOLDER_RESPONSES.length)]
}

export const listThreads = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(error('Not authenticated', 'UNAUTHORIZED'))
      return
    }

    const threads = await ChatThread.find({ userId: req.user.id }).sort({ updatedAt: -1 }).lean()

    const threadsData = threads.map(t => ({
      id: t._id.toString(),
      title: t.title,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt
    }))

    res.status(200).json(success(threadsData))
  } catch (err) {
    console.error('List threads error:', err)
    res.status(500).json(error('Failed to list threads', 'INTERNAL_ERROR'))
  }
}

export const createThread = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(error('Not authenticated', 'UNAUTHORIZED'))
      return
    }

    const { title } = req.body
    if (!title || !title.trim()) {
      res.status(400).json(error('Title is required', 'VALIDATION_ERROR'))
      return
    }

    const thread = await ChatThread.create({
      userId: req.user.id,
      title: title.trim()
    })

    res.status(201).json(
      success({
        id: thread._id.toString(),
        title: thread.title,
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt
      })
    )
  } catch (err) {
    console.error('Create thread error:', err)
    res.status(500).json(error('Failed to create thread', 'INTERNAL_ERROR'))
  }
}

export const getThreadMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(error('Not authenticated', 'UNAUTHORIZED'))
      return
    }

    const { threadId } = req.params

    const thread = await ChatThread.findOne({ _id: threadId, userId: req.user.id })
    if (!thread) {
      res.status(404).json(error('Thread not found', 'NOT_FOUND'))
      return
    }

    const messages = await ChatMessage.find({ threadId }).sort({ createdAt: 1 }).lean()

    const messagesData = messages.map(m => ({
      id: m._id.toString(),
      role: m.role,
      content: m.content,
      createdAt: m.createdAt
    }))

    res.status(200).json(success(messagesData))
  } catch (err) {
    console.error('Get thread messages error:', err)
    res.status(500).json(error('Failed to get messages', 'INTERNAL_ERROR'))
  }
}

export const sendMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(error('Not authenticated', 'UNAUTHORIZED'))
      return
    }

    const { threadId } = req.params
    const { content } = req.body

    if (!content || !content.trim()) {
      res.status(400).json(error('Message content is required', 'VALIDATION_ERROR'))
      return
    }

    const thread = await ChatThread.findOne({ _id: threadId, userId: req.user.id })
    if (!thread) {
      res.status(404).json(error('Thread not found', 'NOT_FOUND'))
      return
    }

    // Save user message
    const userMessage = await ChatMessage.create({
      threadId,
      role: SenderRole.USER,
      content: content.trim()
    })

    // Generate and save placeholder AI response
    const aiResponse = getPlaceholderResponse()
    const assistantMessage = await ChatMessage.create({
      threadId,
      role: SenderRole.ASSISTANT,
      content: aiResponse
    })

    // Touch the thread's updatedAt
    thread.set('updatedAt', new Date())
    await thread.save()

    res.status(200).json(
      success({
        userMessage: {
          id: userMessage._id.toString(),
          role: userMessage.role,
          content: userMessage.content,
          createdAt: userMessage.createdAt
        },
        assistantMessage: {
          id: assistantMessage._id.toString(),
          role: assistantMessage.role,
          content: assistantMessage.content,
          createdAt: assistantMessage.createdAt
        }
      })
    )
  } catch (err) {
    console.error('Send message error:', err)
    res.status(500).json(error('Failed to send message', 'INTERNAL_ERROR'))
  }
}

export const deleteThread = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(error('Not authenticated', 'UNAUTHORIZED'))
      return
    }

    const { threadId } = req.params

    const thread = await ChatThread.findOneAndDelete({ _id: threadId, userId: req.user.id })
    if (!thread) {
      res.status(404).json(error('Thread not found', 'NOT_FOUND'))
      return
    }

    // Delete all messages in the thread
    await ChatMessage.deleteMany({ threadId })

    res.status(200).json(success({ message: 'Thread deleted' }))
  } catch (err) {
    console.error('Delete thread error:', err)
    res.status(500).json(error('Failed to delete thread', 'INTERNAL_ERROR'))
  }
}

export const updateThread = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(error('Not authenticated', 'UNAUTHORIZED'))
      return
    }

    const { threadId } = req.params
    const { title } = req.body

    if (!title || !title.trim()) {
      res.status(400).json(error('Title is required', 'VALIDATION_ERROR'))
      return
    }

    const thread = await ChatThread.findOneAndUpdate(
      { _id: threadId, userId: req.user.id },
      { title: title.trim() },
      { new: true }
    )

    if (!thread) {
      res.status(404).json(error('Thread not found', 'NOT_FOUND'))
      return
    }

    res.status(200).json(
      success({
        id: thread._id.toString(),
        title: thread.title,
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt
      })
    )
  } catch (err) {
    console.error('Update thread error:', err)
    res.status(500).json(error('Failed to update thread', 'INTERNAL_ERROR'))
  }
}
