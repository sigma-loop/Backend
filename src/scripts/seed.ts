import mongoose from 'mongoose'
import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import { User, Role } from '../models/User'
import { Course, Difficulty } from '../models/Course'
import { Lesson, LessonType } from '../models/Lesson'
import { Challenge } from '../models/Challenge'
import { Enrollment } from '../models/Enrollment'
import { LessonProgress } from '../models/LessonProgress'
import { Submission, Status, SubmissionLanguage } from '../models/Submission'
import { ChatThread } from '../models/ChatThread'
import { ChatMessage, SenderRole } from '../models/ChatMessage'

dotenv.config()

const MONGODB_URI = process.env.DATABASE_URL || 'mongodb://localhost:27017/lambda-lap'

/** Helper: days ago from now */
function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

const seedDatabase = async () => {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB')

    // Clear ALL collections
    await Promise.all([
      User.deleteMany({}),
      Course.deleteMany({}),
      Lesson.deleteMany({}),
      Challenge.deleteMany({}),
      Enrollment.deleteMany({}),
      LessonProgress.deleteMany({}),
      Submission.deleteMany({}),
      ChatThread.deleteMany({}),
      ChatMessage.deleteMany({})
    ])
    console.log('Cleared all existing data')

    // ─── 1. USERS ────────────────────────────────────────────────────────
    const passwordHash = await bcrypt.hash('password123', 10)

    await User.create({
      email: 'admin@sigmaloop.com',
      passwordHash,
      role: Role.ADMIN,
      profileData: { name: 'Omar Khalil', bio: 'Platform administrator' },
      stats: { streakDays: 0, totalXp: 0, lessonsCompleted: 0 }
    })

    await User.create({
      email: 'sara.python@sigmaloop.com',
      passwordHash,
      role: Role.INSTRUCTOR,
      profileData: {
        name: 'Sara Mansour',
        bio: 'Python developer with 8 years of experience. Passionate about teaching beginners.',
        avatar: 'https://i.pravatar.cc/150?u=sara'
      },
      stats: { streakDays: 0, totalXp: 0, lessonsCompleted: 0 }
    })

    await User.create({
      email: 'ahmed.js@sigmaloop.com',
      passwordHash,
      role: Role.INSTRUCTOR,
      profileData: {
        name: 'Ahmed Farouk',
        bio: 'Full-stack JavaScript engineer. Building web apps since ES5 days.',
        avatar: 'https://i.pravatar.cc/150?u=ahmed'
      },
      stats: { streakDays: 0, totalXp: 0, lessonsCompleted: 0 }
    })

    await User.create({
      email: 'lina.systems@sigmaloop.com',
      passwordHash,
      role: Role.INSTRUCTOR,
      profileData: {
        name: 'Lina Haddad',
        bio: 'Systems programmer specializing in Rust and Go. Former Google engineer.',
        avatar: 'https://i.pravatar.cc/150?u=lina'
      },
      stats: { streakDays: 0, totalXp: 0, lessonsCompleted: 0 }
    })

    const studentData = [
      { email: 'nour@student.com', name: 'Nour El-Din', streak: 12, xp: 2400, lessons: 18 },
      { email: 'yara@student.com', name: 'Yara Hassan', streak: 7, xp: 1850, lessons: 14 },
      { email: 'kareem@student.com', name: 'Kareem Mostafa', streak: 3, xp: 950, lessons: 7 },
      { email: 'dina@student.com', name: 'Dina Sayed', streak: 21, xp: 3200, lessons: 24 },
      { email: 'ali@student.com', name: 'Ali Mahmoud', streak: 0, xp: 300, lessons: 2 },
      { email: 'layla@student.com', name: 'Layla Karim', streak: 5, xp: 1200, lessons: 9 },
      { email: 'hassan@student.com', name: 'Hassan Awad', streak: 0, xp: 50, lessons: 1 },
      { email: 'maha@student.com', name: 'Maha Tawfik', streak: 15, xp: 2800, lessons: 20 },
      { email: 'omar.s@student.com', name: 'Omar Salem', streak: 1, xp: 600, lessons: 4 },
      { email: 'rana@student.com', name: 'Rana Adel', streak: 9, xp: 1600, lessons: 12 }
    ]

    const students = await Promise.all(
      studentData.map(s =>
        User.create({
          email: s.email,
          passwordHash,
          role: Role.STUDENT,
          profileData: { name: s.name },
          stats: { streakDays: s.streak, totalXp: s.xp, lessonsCompleted: s.lessons }
        })
      )
    )

    console.log(
      `Created ${3 + 1 + students.length} users (1 admin, 3 instructors, ${students.length} students)`
    )

    // ─── 2. COURSES ──────────────────────────────────────────────────────
    const pythonCourse = await Course.create({
      title: 'Python Fundamentals',
      description:
        'Start your programming journey with Python. Learn variables, data types, control flow, functions, and basic data structures. No prior experience needed.',
      difficulty: Difficulty.BEGINNER,
      tags: ['Python', 'Beginner', 'Programming Basics'],
      isPublished: true
    })

    const jsCourse = await Course.create({
      title: 'JavaScript Essentials',
      description:
        'Master the language of the web. Covers ES6+ syntax, DOM manipulation, async/await, closures, and modern JavaScript patterns.',
      difficulty: Difficulty.BEGINNER,
      tags: ['JavaScript', 'Web Development', 'Frontend'],
      isPublished: true
    })

    const dsaCourse = await Course.create({
      title: 'Data Structures & Algorithms',
      description:
        'Build a strong foundation in computer science fundamentals. Arrays, linked lists, trees, graphs, sorting, searching, and dynamic programming.',
      difficulty: Difficulty.INTERMEDIATE,
      tags: ['DSA', 'Computer Science', 'Problem Solving', 'Python'],
      isPublished: true
    })

    const tsCourse = await Course.create({
      title: 'Advanced TypeScript',
      description:
        'Go beyond the basics with generics, conditional types, mapped types, decorators, and real-world patterns for building type-safe applications.',
      difficulty: Difficulty.ADVANCED,
      tags: ['TypeScript', 'Advanced', 'Web Development'],
      isPublished: true
    })

    const goCourse = await Course.create({
      title: 'Go for Backend Development',
      description:
        'Learn Go from scratch and build production-grade backend services. Covers goroutines, channels, the standard library, and REST API development.',
      difficulty: Difficulty.INTERMEDIATE,
      tags: ['Go', 'Backend', 'Concurrency', 'REST API'],
      isPublished: true
    })

    const rustCourse = await Course.create({
      title: 'Rust Systems Programming',
      description:
        'Understand ownership, borrowing, lifetimes, and fearless concurrency. Build performant CLI tools and system utilities.',
      difficulty: Difficulty.ADVANCED,
      tags: ['Rust', 'Systems Programming', 'Performance'],
      isPublished: true
    })

    const draftCourse = await Course.create({
      title: 'C++ Masterclass',
      description:
        'From pointers to templates — a deep dive into modern C++. (Course under development)',
      difficulty: Difficulty.INTERMEDIATE,
      tags: ['C++', 'Systems Programming'],
      isPublished: false
    })

    console.log('Created 7 courses (6 published, 1 draft)')

    // ─── 3. LESSONS ──────────────────────────────────────────────────────

    // --- Python Fundamentals (5 lessons) ---
    const pyL1 = await Lesson.create({
      courseId: pythonCourse._id,
      title: 'Variables & Data Types',
      orderIndex: 1,
      type: LessonType.LESSON,
      contentMarkdown: `# Variables & Data Types

Welcome to your first Python lesson! In this lesson, you'll learn how to store and work with data.

## What is a Variable?

A variable is a name that refers to a value stored in memory. Think of it as a labeled box that holds data.

\`\`\`python
name = "Alice"
age = 25
height = 5.7
is_student = True
\`\`\`

## Python Data Types

| Type | Example | Description |
|------|---------|-------------|
| \`str\` | \`"hello"\` | Text |
| \`int\` | \`42\` | Whole numbers |
| \`float\` | \`3.14\` | Decimal numbers |
| \`bool\` | \`True\` / \`False\` | Boolean values |

## Type Checking

Use \`type()\` to check a variable's type:

\`\`\`python
x = 42
print(type(x))  # <class 'int'>
\`\`\`

## Key Takeaways

- Variables are created by assignment (\`=\`)
- Python is dynamically typed — no need to declare types
- Use meaningful variable names (\`student_count\` not \`sc\`)`
    })

    const pyL2 = await Lesson.create({
      courseId: pythonCourse._id,
      title: 'Strings & Input',
      orderIndex: 2,
      type: LessonType.LESSON,
      contentMarkdown: `# Strings & Input

Strings are one of the most commonly used data types. Let's learn how to create, manipulate, and format them.

## Creating Strings

\`\`\`python
single = 'Hello'
double = "World"
multi = """This is
a multi-line string"""
\`\`\`

## String Operations

\`\`\`python
greeting = "Hello" + " " + "World"   # Concatenation
repeated = "Ha" * 3                    # "HaHaHa"
length = len("Python")                 # 6
\`\`\`

## f-Strings (Formatted Strings)

\`\`\`python
name = "Sara"
age = 28
print(f"My name is {name} and I am {age} years old.")
\`\`\`

## User Input

\`\`\`python
user_name = input("Enter your name: ")
print(f"Welcome, {user_name}!")
\`\`\`

> **Note:** \`input()\` always returns a string. Use \`int()\` or \`float()\` to convert.`
    })

    const pyL3 = await Lesson.create({
      courseId: pythonCourse._id,
      title: 'Control Flow: if / elif / else',
      orderIndex: 3,
      type: LessonType.LESSON,
      contentMarkdown: `# Control Flow

Programs need to make decisions. Python uses \`if\`, \`elif\`, and \`else\` to control which code runs.

## Basic if Statement

\`\`\`python
temperature = 35

if temperature > 30:
    print("It's hot outside!")
\`\`\`

## if / elif / else

\`\`\`python
score = 85

if score >= 90:
    grade = "A"
elif score >= 80:
    grade = "B"
elif score >= 70:
    grade = "C"
else:
    grade = "F"

print(f"Your grade: {grade}")
\`\`\`

## Comparison Operators

| Operator | Meaning |
|----------|---------|
| \`==\` | Equal to |
| \`!=\` | Not equal to |
| \`>\` | Greater than |
| \`<\` | Less than |
| \`>=\` | Greater or equal |
| \`<=\` | Less or equal |

## Logical Operators

\`\`\`python
age = 20
has_id = True

if age >= 18 and has_id:
    print("Entry allowed")
\`\`\``
    })

    const pyL4 = await Lesson.create({
      courseId: pythonCourse._id,
      title: 'Challenge: Grade Calculator',
      orderIndex: 4,
      type: LessonType.CHALLENGE,
      contentMarkdown: `# Challenge: Grade Calculator

Apply what you've learned about variables and control flow!

## Task

Write a function \`get_grade(score)\` that takes a numeric score (0–100) and returns the letter grade:

- **A**: 90–100
- **B**: 80–89
- **C**: 70–79
- **D**: 60–69
- **F**: below 60

## Examples

\`\`\`python
get_grade(95)  # "A"
get_grade(82)  # "B"
get_grade(55)  # "F"
\`\`\``
    })

    const pyL5 = await Lesson.create({
      courseId: pythonCourse._id,
      title: 'Loops: for & while',
      orderIndex: 5,
      type: LessonType.LESSON,
      contentMarkdown: `# Loops

Loops let you repeat code. Python has two main loop types: \`for\` and \`while\`.

## for Loop

\`\`\`python
fruits = ["apple", "banana", "cherry"]

for fruit in fruits:
    print(fruit)
\`\`\`

### range()

\`\`\`python
for i in range(5):
    print(i)  # 0, 1, 2, 3, 4
\`\`\`

## while Loop

\`\`\`python
count = 0
while count < 5:
    print(count)
    count += 1
\`\`\`

## Loop Control

- \`break\` — exit the loop immediately
- \`continue\` — skip to the next iteration

\`\`\`python
for i in range(10):
    if i == 5:
        break
    if i % 2 == 0:
        continue
    print(i)  # 1, 3
\`\`\``
    })

    // --- JavaScript Essentials (4 lessons) ---
    const jsL1 = await Lesson.create({
      courseId: jsCourse._id,
      title: 'Variables & Modern Syntax',
      orderIndex: 1,
      type: LessonType.LESSON,
      contentMarkdown: `# Variables & Modern Syntax

JavaScript has evolved significantly. Let's start with modern ES6+ variable declarations.

## let, const, and var

\`\`\`javascript
const PI = 3.14159;        // Cannot be reassigned
let counter = 0;           // Can be reassigned
var oldStyle = "avoid";    // Function-scoped (legacy)
\`\`\`

> **Rule of thumb:** Use \`const\` by default. Use \`let\` only when you need to reassign.

## Template Literals

\`\`\`javascript
const name = "Ahmed";
const greeting = \`Hello, \${name}! Today is \${new Date().toLocaleDateString()}\`;
\`\`\`

## Destructuring

\`\`\`javascript
// Array destructuring
const [first, second] = [10, 20];

// Object destructuring
const { title, author } = { title: "Dune", author: "Herbert" };
\`\`\`

## Arrow Functions

\`\`\`javascript
const add = (a, b) => a + b;
const greet = (name) => {
  return \`Hello, \${name}!\`;
};
\`\`\``
    })

    const jsL2 = await Lesson.create({
      courseId: jsCourse._id,
      title: 'Functions & Closures',
      orderIndex: 2,
      type: LessonType.LESSON,
      contentMarkdown: `# Functions & Closures

Functions are first-class citizens in JavaScript. Closures are one of the language's most powerful features.

## Function Types

\`\`\`javascript
// Declaration
function add(a, b) { return a + b; }

// Expression
const multiply = function(a, b) { return a * b; };

// Arrow
const divide = (a, b) => a / b;
\`\`\`

## Closures

A closure is a function that remembers the variables from its outer scope even after the outer function has returned.

\`\`\`javascript
function createCounter() {
  let count = 0;
  return {
    increment: () => ++count,
    getCount: () => count
  };
}

const counter = createCounter();
counter.increment();
counter.increment();
console.log(counter.getCount()); // 2
\`\`\`

## Practical Use: Private State

Closures let you create private variables — data that can only be accessed through specific functions.`
    })

    const jsL3 = await Lesson.create({
      courseId: jsCourse._id,
      title: 'Async JavaScript: Promises & async/await',
      orderIndex: 3,
      type: LessonType.LESSON,
      contentMarkdown: `# Async JavaScript

JavaScript is single-threaded but handles async operations elegantly with Promises and async/await.

## Promises

\`\`\`javascript
const fetchData = () => {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve({ id: 1, name: "Item" }), 1000);
  });
};

fetchData()
  .then(data => console.log(data))
  .catch(err => console.error(err));
\`\`\`

## async / await

\`\`\`javascript
async function loadUser() {
  try {
    const response = await fetch("/api/user");
    const user = await response.json();
    return user;
  } catch (error) {
    console.error("Failed to load user:", error);
  }
}
\`\`\`

## Promise.all

Run multiple async operations in parallel:

\`\`\`javascript
const [users, posts] = await Promise.all([
  fetch("/api/users").then(r => r.json()),
  fetch("/api/posts").then(r => r.json())
]);
\`\`\``
    })

    const jsL4 = await Lesson.create({
      courseId: jsCourse._id,
      title: 'Challenge: Array Manipulation',
      orderIndex: 4,
      type: LessonType.CHALLENGE,
      contentMarkdown: `# Challenge: Array Manipulation

Test your JavaScript skills with array operations.

## Task

Write a function \`removeDuplicates(arr)\` that removes duplicate values from an array while preserving the original order.

## Examples

\`\`\`javascript
removeDuplicates([1, 2, 2, 3, 4, 4, 5]);  // [1, 2, 3, 4, 5]
removeDuplicates(["a", "b", "a", "c"]);     // ["a", "b", "c"]
removeDuplicates([]);                        // []
\`\`\``
    })

    // --- DSA (5 lessons) ---
    const dsaL1 = await Lesson.create({
      courseId: dsaCourse._id,
      title: 'Big-O Notation & Complexity Analysis',
      orderIndex: 1,
      type: LessonType.LESSON,
      contentMarkdown: `# Big-O Notation

Before diving into data structures, you need to understand how we measure algorithm efficiency.

## What is Big-O?

Big-O describes the **upper bound** of an algorithm's growth rate as input size increases.

## Common Complexities

| Big-O | Name | Example |
|-------|------|---------|
| O(1) | Constant | Array index access |
| O(log n) | Logarithmic | Binary search |
| O(n) | Linear | Linear search |
| O(n log n) | Linearithmic | Merge sort |
| O(n²) | Quadratic | Bubble sort |
| O(2ⁿ) | Exponential | Recursive Fibonacci |

## Analyzing Code

\`\`\`python
# O(n) — single loop
def find_max(arr):
    maximum = arr[0]
    for num in arr:
        if num > maximum:
            maximum = num
    return maximum

# O(n²) — nested loops
def has_duplicate(arr):
    for i in range(len(arr)):
        for j in range(i + 1, len(arr)):
            if arr[i] == arr[j]:
                return True
    return False
\`\`\``
    })

    const dsaL2 = await Lesson.create({
      courseId: dsaCourse._id,
      title: 'Arrays & Linked Lists',
      orderIndex: 2,
      type: LessonType.LESSON,
      contentMarkdown: `# Arrays & Linked Lists

Two fundamental ways to store sequential data, each with different trade-offs.

## Arrays

- **Access:** O(1) by index
- **Insert/Delete at end:** O(1) amortized
- **Insert/Delete at beginning:** O(n)
- **Search:** O(n) unsorted, O(log n) sorted

## Linked Lists

\`\`\`python
class Node:
    def __init__(self, val, next=None):
        self.val = val
        self.next = next

class LinkedList:
    def __init__(self):
        self.head = None

    def prepend(self, val):
        self.head = Node(val, self.head)

    def append(self, val):
        if not self.head:
            self.head = Node(val)
            return
        curr = self.head
        while curr.next:
            curr = curr.next
        curr.next = Node(val)
\`\`\`

## When to Use What?

| Operation | Array | Linked List |
|-----------|-------|-------------|
| Random access | O(1) | O(n) |
| Insert at head | O(n) | O(1) |
| Insert at tail | O(1)* | O(n)** |
| Memory | Contiguous | Scattered |

*amortized, **without tail pointer`
    })

    const dsaL3 = await Lesson.create({
      courseId: dsaCourse._id,
      title: 'Challenge: Two Sum',
      orderIndex: 3,
      type: LessonType.CHALLENGE,
      contentMarkdown: `# Challenge: Two Sum

A classic interview problem. Can you solve it efficiently?

## Task

Given an array of integers \`nums\` and a target integer \`target\`, return the **indices** of the two numbers that add up to \`target\`.

- Each input has **exactly one** solution
- You may not use the same element twice
- Return the answer as a list of two indices

## Examples

\`\`\`python
two_sum([2, 7, 11, 15], 9)    # [0, 1]  (2 + 7 = 9)
two_sum([3, 2, 4], 6)          # [1, 2]  (2 + 4 = 6)
two_sum([3, 3], 6)              # [0, 1]
\`\`\`

## Hint

A brute-force approach uses O(n²). Can you do it in O(n) using a hash map?`
    })

    const dsaL4 = await Lesson.create({
      courseId: dsaCourse._id,
      title: 'Stacks & Queues',
      orderIndex: 4,
      type: LessonType.LESSON,
      contentMarkdown: `# Stacks & Queues

Two essential abstract data types used everywhere — from browser history to task scheduling.

## Stack (LIFO)

Last In, First Out.

\`\`\`python
stack = []
stack.append(1)   # push
stack.append(2)
stack.append(3)
top = stack.pop()  # 3
\`\`\`

**Use cases:** Undo/redo, expression evaluation, DFS traversal, call stack.

## Queue (FIFO)

First In, First Out.

\`\`\`python
from collections import deque

queue = deque()
queue.append(1)     # enqueue
queue.append(2)
front = queue.popleft()  # 1
\`\`\`

**Use cases:** BFS traversal, task scheduling, print queues, message buffers.`
    })

    const dsaL5 = await Lesson.create({
      courseId: dsaCourse._id,
      title: 'Challenge: Valid Parentheses',
      orderIndex: 5,
      type: LessonType.CHALLENGE,
      contentMarkdown: `# Challenge: Valid Parentheses

Apply your knowledge of stacks!

## Task

Write a function \`is_valid(s)\` that takes a string containing just the characters \`(\`, \`)\`, \`{\`, \`}\`, \`[\`, \`]\`, and determines if the input string is valid.

A string is valid if:
1. Open brackets are closed by the same type
2. Open brackets are closed in the correct order
3. Every close bracket has a corresponding open bracket

## Examples

\`\`\`python
is_valid("()")       # True
is_valid("()[]{}")   # True
is_valid("(]")       # False
is_valid("([)]")     # False
is_valid("{[]}")     # True
\`\`\``
    })

    // --- Advanced TypeScript (4 lessons) ---
    const tsL1 = await Lesson.create({
      courseId: tsCourse._id,
      title: 'Generics Deep Dive',
      orderIndex: 1,
      type: LessonType.LESSON,
      contentMarkdown: `# Generics Deep Dive

Generics let you write reusable, type-safe code without sacrificing flexibility.

## Basic Generic Function

\`\`\`typescript
function identity<T>(arg: T): T {
  return arg;
}

const num = identity(42);        // type: number
const str = identity("hello");   // type: string
\`\`\`

## Generic Constraints

\`\`\`typescript
interface HasLength {
  length: number;
}

function logLength<T extends HasLength>(item: T): void {
  console.log(item.length);
}

logLength("hello");    // OK
logLength([1, 2, 3]);  // OK
// logLength(42);      // Error: number has no .length
\`\`\`

## Generic Utility Types

\`\`\`typescript
// Make all properties optional
type PartialUser = Partial<User>;

// Make all properties required
type RequiredUser = Required<User>;

// Pick specific properties
type UserPreview = Pick<User, "id" | "name">;

// Omit specific properties
type UserWithoutPassword = Omit<User, "password">;
\`\`\``
    })

    const tsL2 = await Lesson.create({
      courseId: tsCourse._id,
      title: 'Conditional & Mapped Types',
      orderIndex: 2,
      type: LessonType.LESSON,
      contentMarkdown: `# Conditional & Mapped Types

TypeScript's type system is Turing-complete. Conditional and mapped types are where it gets powerful.

## Conditional Types

\`\`\`typescript
type IsString<T> = T extends string ? true : false;

type A = IsString<"hello">;  // true
type B = IsString<42>;       // false
\`\`\`

## Mapped Types

\`\`\`typescript
type Readonly<T> = {
  readonly [K in keyof T]: T[K];
};

type Nullable<T> = {
  [K in keyof T]: T[K] | null;
};
\`\`\`

## infer Keyword

Extract types from other types:

\`\`\`typescript
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

type Fn = () => string;
type Result = ReturnType<Fn>;  // string
\`\`\``
    })

    const tsL3 = await Lesson.create({
      courseId: tsCourse._id,
      title: 'Decorators & Metadata',
      orderIndex: 3,
      type: LessonType.LESSON,
      contentMarkdown: `# Decorators & Metadata

Decorators provide a way to add annotations and modify classes and their members at design time.

## Class Decorator

\`\`\`typescript
function sealed(constructor: Function) {
  Object.seal(constructor);
  Object.seal(constructor.prototype);
}

@sealed
class BugReport {
  type = "report";
  title: string;
  constructor(t: string) {
    this.title = t;
  }
}
\`\`\`

## Method Decorator

\`\`\`typescript
function log(target: any, key: string, descriptor: PropertyDescriptor) {
  const original = descriptor.value;
  descriptor.value = function (...args: any[]) {
    console.log(\`Calling \${key} with\`, args);
    return original.apply(this, args);
  };
}

class Calculator {
  @log
  add(a: number, b: number) { return a + b; }
}
\`\`\``
    })

    const tsL4 = await Lesson.create({
      courseId: tsCourse._id,
      title: 'Challenge: Type-Safe Event Emitter',
      orderIndex: 4,
      type: LessonType.CHALLENGE,
      contentMarkdown: `# Challenge: Type-Safe Event Emitter

Build a generic, type-safe event emitter in TypeScript.

## Task

Create a \`TypedEmitter<Events>\` class where \`Events\` is a map of event names to their payload types.

\`\`\`typescript
type Events = {
  login: { userId: string };
  logout: undefined;
  error: { message: string; code: number };
};

const emitter = new TypedEmitter<Events>();
emitter.on("login", (payload) => {
  console.log(payload.userId);  // type-safe!
});
emitter.emit("login", { userId: "123" });
\`\`\``
    })

    // --- Go for Backend Development (4 lessons) ---
    const goL1 = await Lesson.create({
      courseId: goCourse._id,
      title: 'Go Basics: Types, Functions, and Packages',
      orderIndex: 1,
      type: LessonType.LESSON,
      contentMarkdown: `# Go Basics

Go is a statically typed, compiled language designed for simplicity and performance.

## Hello World

\`\`\`go
package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
}
\`\`\`

## Variables & Types

\`\`\`go
var name string = "Alice"
age := 25               // short declaration (type inferred)
var pi float64 = 3.14

// Multiple assignment
x, y := 10, 20
\`\`\`

## Functions

\`\`\`go
func add(a, b int) int {
    return a + b
}

// Multiple return values
func divide(a, b float64) (float64, error) {
    if b == 0 {
        return 0, fmt.Errorf("division by zero")
    }
    return a / b, nil
}
\`\`\``
    })

    const goL2 = await Lesson.create({
      courseId: goCourse._id,
      title: 'Structs, Interfaces & Error Handling',
      orderIndex: 2,
      type: LessonType.LESSON,
      contentMarkdown: `# Structs, Interfaces & Errors

Go uses composition over inheritance. Structs and interfaces are the core building blocks.

## Structs

\`\`\`go
type User struct {
    ID    int
    Name  string
    Email string
}

u := User{ID: 1, Name: "Sara", Email: "sara@example.com"}
\`\`\`

## Interfaces

\`\`\`go
type Shape interface {
    Area() float64
}

type Circle struct { Radius float64 }
type Rect struct { Width, Height float64 }

func (c Circle) Area() float64 { return math.Pi * c.Radius * c.Radius }
func (r Rect) Area() float64   { return r.Width * r.Height }

func printArea(s Shape) {
    fmt.Printf("Area: %.2f\\n", s.Area())
}
\`\`\`

## Error Handling

\`\`\`go
result, err := doSomething()
if err != nil {
    log.Fatal(err)
}
\`\`\``
    })

    const goL3 = await Lesson.create({
      courseId: goCourse._id,
      title: 'Goroutines & Channels',
      orderIndex: 3,
      type: LessonType.LESSON,
      contentMarkdown: `# Goroutines & Channels

Go's concurrency model is one of its biggest strengths.

## Goroutines

A goroutine is a lightweight thread managed by the Go runtime.

\`\`\`go
func sayHello(name string) {
    fmt.Printf("Hello, %s!\\n", name)
}

go sayHello("Alice")  // runs concurrently
go sayHello("Bob")
\`\`\`

## Channels

Channels are Go's way of communicating between goroutines.

\`\`\`go
ch := make(chan string)

go func() {
    ch <- "hello from goroutine"
}()

msg := <-ch
fmt.Println(msg)
\`\`\`

## Select Statement

\`\`\`go
select {
case msg := <-ch1:
    fmt.Println("Received from ch1:", msg)
case msg := <-ch2:
    fmt.Println("Received from ch2:", msg)
case <-time.After(time.Second):
    fmt.Println("Timeout!")
}
\`\`\``
    })

    const goL4 = await Lesson.create({
      courseId: goCourse._id,
      title: 'Challenge: Concurrent Word Counter',
      orderIndex: 4,
      type: LessonType.CHALLENGE,
      contentMarkdown: `# Challenge: Concurrent Word Counter

Put your goroutine and channel skills to the test.

## Task

Write a function \`wordCount(text string) map[string]int\` that counts occurrences of each word in a given text. Words are separated by whitespace and should be case-insensitive.

## Examples

\`\`\`go
wordCount("Go go GO")
// map[string]int{"go": 3}

wordCount("hello world hello")
// map[string]int{"hello": 2, "world": 1}
\`\`\``
    })

    // --- Rust Systems Programming (3 lessons) ---
    const rustL1 = await Lesson.create({
      courseId: rustCourse._id,
      title: 'Ownership & Borrowing',
      orderIndex: 1,
      type: LessonType.LESSON,
      contentMarkdown: `# Ownership & Borrowing

Rust's ownership system is what makes it unique — memory safety without a garbage collector.

## Ownership Rules

1. Each value has exactly **one owner**
2. When the owner goes out of scope, the value is **dropped**
3. Ownership can be **moved** or **borrowed**

\`\`\`rust
fn main() {
    let s1 = String::from("hello");
    let s2 = s1;       // s1 is MOVED to s2
    // println!("{s1}"); // ERROR: s1 is no longer valid
    println!("{s2}");    // OK
}
\`\`\`

## Borrowing

\`\`\`rust
fn calculate_length(s: &String) -> usize {
    s.len()  // s is borrowed, not owned
}

let s = String::from("hello");
let len = calculate_length(&s);
println!("{s} has length {len}");  // s is still valid
\`\`\`

## Mutable References

\`\`\`rust
fn append_world(s: &mut String) {
    s.push_str(", world!");
}

let mut greeting = String::from("hello");
append_world(&mut greeting);
\`\`\``
    })

    const rustL2 = await Lesson.create({
      courseId: rustCourse._id,
      title: 'Enums, Pattern Matching & Option/Result',
      orderIndex: 2,
      type: LessonType.LESSON,
      contentMarkdown: `# Enums & Pattern Matching

Rust's enums are far more powerful than in most languages — they can hold data.

## Enums with Data

\`\`\`rust
enum Shape {
    Circle(f64),
    Rectangle(f64, f64),
    Triangle { base: f64, height: f64 },
}
\`\`\`

## Pattern Matching

\`\`\`rust
fn area(shape: &Shape) -> f64 {
    match shape {
        Shape::Circle(r) => std::f64::consts::PI * r * r,
        Shape::Rectangle(w, h) => w * h,
        Shape::Triangle { base, height } => 0.5 * base * height,
    }
}
\`\`\`

## Option & Result

\`\`\`rust
fn find_user(id: u32) -> Option<String> {
    if id == 1 { Some("Alice".into()) } else { None }
}

fn parse_number(s: &str) -> Result<i32, String> {
    s.parse::<i32>().map_err(|e| e.to_string())
}
\`\`\``
    })

    const rustL3 = await Lesson.create({
      courseId: rustCourse._id,
      title: 'Challenge: Implement a Stack',
      orderIndex: 3,
      type: LessonType.CHALLENGE,
      contentMarkdown: `# Challenge: Implement a Stack

Build a generic stack data structure in Rust.

## Task

Implement a \`Stack<T>\` with the following methods:
- \`new() -> Stack<T>\`
- \`push(&mut self, item: T)\`
- \`pop(&mut self) -> Option<T>\`
- \`peek(&self) -> Option<&T>\`
- \`is_empty(&self) -> bool\`

## Example

\`\`\`rust
let mut stack = Stack::new();
stack.push(1);
stack.push(2);
assert_eq!(stack.peek(), Some(&2));
assert_eq!(stack.pop(), Some(2));
assert_eq!(stack.pop(), Some(1));
assert!(stack.is_empty());
\`\`\``
    })

    // --- Draft C++ Course (2 lessons) ---
    const cppL1 = await Lesson.create({
      courseId: draftCourse._id,
      title: 'Pointers & Memory',
      orderIndex: 1,
      type: LessonType.LESSON,
      contentMarkdown: `# Pointers & Memory (Draft)

This lesson is under construction.

## Coming Soon

- Raw pointers
- Smart pointers (unique_ptr, shared_ptr)
- Stack vs Heap allocation
- RAII pattern`
    })

    const cppL2 = await Lesson.create({
      courseId: draftCourse._id,
      title: 'Templates & Generic Programming',
      orderIndex: 2,
      type: LessonType.LESSON,
      contentMarkdown: `# Templates (Draft)

This lesson is under construction.

## Coming Soon

- Function templates
- Class templates
- Template specialization`
    })

    console.log('Created 27 lessons across 7 courses')

    // ─── 4. CHALLENGES ───────────────────────────────────────────────────

    // Challenge 1: Grade Calculator (Python — pyL4)
    const challenge1 = await Challenge.create({
      lessonId: pyL4._id,
      title: 'Grade Calculator',
      starterCodes: {
        python: `def get_grade(score):
    # Return "A" (>=90), "B" (>=80), "C" (>=70), "D" (>=60), or "F"
    pass`
      },
      solutionCodes: {
        python: `def get_grade(score):
    if score >= 90: return "A"
    elif score >= 80: return "B"
    elif score >= 70: return "C"
    elif score >= 60: return "D"
    else: return "F"`
      },
      injectedCodes: {
        python: `print(get_grade(int(input())))`
      },
      testCases: [
        { input: '95', expectedOutput: 'A', isHidden: false },
        { input: '82', expectedOutput: 'B', isHidden: false },
        { input: '73', expectedOutput: 'C', isHidden: false },
        { input: '61', expectedOutput: 'D', isHidden: true },
        { input: '55', expectedOutput: 'F', isHidden: true },
        { input: '100', expectedOutput: 'A', isHidden: true },
        { input: '0', expectedOutput: 'F', isHidden: true }
      ]
    })

    // Challenge 2: Remove Duplicates (JavaScript — jsL4)
    const challenge2 = await Challenge.create({
      lessonId: jsL4._id,
      title: 'Remove Duplicates',
      starterCodes: {
        javascript: `function removeDuplicates(arr) {
  // Return a new array with duplicates removed
}`
      },
      solutionCodes: {
        javascript: `function removeDuplicates(arr) {
  return [...new Set(arr)];
}`
      },
      injectedCodes: {
        javascript: `const input = require('fs').readFileSync('/dev/stdin', 'utf8').trim();
console.log(JSON.stringify(removeDuplicates(JSON.parse(input))));`
      },
      testCases: [
        { input: '[1,2,2,3,4,4,5]', expectedOutput: '[1,2,3,4,5]', isHidden: false },
        { input: '["a","b","a","c"]', expectedOutput: '["a","b","c"]', isHidden: false },
        { input: '[]', expectedOutput: '[]', isHidden: false },
        { input: '[1,1,1,1]', expectedOutput: '[1]', isHidden: true },
        { input: '[5]', expectedOutput: '[5]', isHidden: true }
      ]
    })

    // Challenge 3: Two Sum (Python — dsaL3)
    const challenge3 = await Challenge.create({
      lessonId: dsaL3._id,
      title: 'Two Sum',
      starterCodes: {
        python: `def two_sum(nums, target):
    # Return indices of two numbers that add up to target
    pass`
      },
      solutionCodes: {
        python: `def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i`
      },
      injectedCodes: {
        python: `import json, sys
data = sys.stdin.read().strip().split('\\n')
nums = json.loads(data[0])
target = int(data[1])
print(json.dumps(two_sum(nums, target)))`
      },
      testCases: [
        { input: '[2,7,11,15]\n9', expectedOutput: '[0, 1]', isHidden: false },
        { input: '[3,2,4]\n6', expectedOutput: '[1, 2]', isHidden: false },
        { input: '[3,3]\n6', expectedOutput: '[0, 1]', isHidden: false },
        { input: '[1,5,8,3]\n4', expectedOutput: '[0, 3]', isHidden: true },
        { input: '[-1,-2,-3,-4]\n-6', expectedOutput: '[1, 3]', isHidden: true }
      ]
    })

    // Challenge 4: Valid Parentheses (Python — dsaL5)
    const challenge4 = await Challenge.create({
      lessonId: dsaL5._id,
      title: 'Valid Parentheses',
      starterCodes: {
        python: `def is_valid(s):
    # Return True if brackets are valid, False otherwise
    pass`
      },
      solutionCodes: {
        python: `def is_valid(s):
    stack = []
    pairs = {')': '(', '}': '{', ']': '['}
    for char in s:
        if char in pairs:
            if not stack or stack[-1] != pairs[char]:
                return False
            stack.pop()
        else:
            stack.append(char)
    return len(stack) == 0`
      },
      injectedCodes: {
        python: `print(is_valid(input().strip()))`
      },
      testCases: [
        { input: '()', expectedOutput: 'True', isHidden: false },
        { input: '()[]{}', expectedOutput: 'True', isHidden: false },
        { input: '(]', expectedOutput: 'False', isHidden: false },
        { input: '([)]', expectedOutput: 'False', isHidden: true },
        { input: '{[]}', expectedOutput: 'True', isHidden: true },
        { input: ' ', expectedOutput: 'True', isHidden: true }
      ]
    })

    // Challenge 5: Palindrome Checker (TypeScript — tsL4)
    const challenge5 = await Challenge.create({
      lessonId: tsL4._id,
      title: 'Palindrome Checker',
      starterCodes: {
        typescript: `declare function require(name: string): any;

function isPalindrome(s: string): boolean {
  // Return true if s reads the same forwards and backwards
  // Ignore case and non-alphanumeric characters
  return false;
}`
      },
      solutionCodes: {
        typescript: `declare function require(name: string): any;

function isPalindrome(s: string): boolean {
  const cleaned = s.toLowerCase().replace(/[^a-z0-9]/g, '');
  return cleaned === cleaned.split('').reverse().join('');
}`
      },
      injectedCodes: {
        typescript: `const _input = require('fs').readFileSync('/dev/stdin', 'utf8').trim();
console.log(isPalindrome(_input));`
      },
      testCases: [
        { input: 'racecar', expectedOutput: 'true', isHidden: false },
        { input: 'A man a plan a canal Panama', expectedOutput: 'true', isHidden: false },
        { input: 'hello', expectedOutput: 'false', isHidden: false },
        { input: ' ', expectedOutput: 'true', isHidden: true },
        { input: 'Was it a car or a cat I saw', expectedOutput: 'true', isHidden: true }
      ]
    })

    // Challenge 6: Word Frequency (Go — goL4)
    const challenge6 = await Challenge.create({
      lessonId: goL4._id,
      title: 'Word Frequency',
      starterCodes: {
        go: `package main

import (
	"bufio"
	"fmt"
	"os"
	"strings"
)

func wordCount(text string) int {
	// Return the number of words in the text
	// Words are separated by spaces
	return 0
}`
      },
      solutionCodes: {
        go: `package main

import (
	"bufio"
	"fmt"
	"os"
	"strings"
)

func wordCount(text string) int {
	if strings.TrimSpace(text) == "" {
		return 0
	}
	return len(strings.Fields(text))
}`
      },
      injectedCodes: {
        go: `
func main() {
	scanner := bufio.NewScanner(os.Stdin)
	scanner.Scan()
	fmt.Println(wordCount(scanner.Text()))
}`
      },
      testCases: [
        { input: 'Go is awesome', expectedOutput: '3', isHidden: false },
        { input: 'hello world hello world', expectedOutput: '4', isHidden: false },
        { input: ' ', expectedOutput: '0', isHidden: true }
      ]
    })

    // Challenge 7: Rust Factorial (Rust — rustL3)
    const challenge7 = await Challenge.create({
      lessonId: rustL3._id,
      title: 'Factorial',
      starterCodes: {
        rust: `fn factorial(n: u64) -> u64 {
    // Return n! (n factorial)
    // 0! = 1, 1! = 1, 5! = 120
    todo!()
}`
      },
      solutionCodes: {
        rust: `fn factorial(n: u64) -> u64 {
    if n <= 1 { 1 } else { n * factorial(n - 1) }
}`
      },
      injectedCodes: {
        rust: `
fn main() {
    let mut input = String::new();
    std::io::stdin().read_line(&mut input).unwrap();
    let n: u64 = input.trim().parse().unwrap();
    println!("{}", factorial(n));
}`
      },
      testCases: [
        { input: '5', expectedOutput: '120', isHidden: false },
        { input: '0', expectedOutput: '1', isHidden: false },
        { input: '1', expectedOutput: '1', isHidden: false },
        { input: '10', expectedOutput: '3628800', isHidden: true },
        { input: '20', expectedOutput: '2432902008176640000', isHidden: true }
      ]
    })

    // ─── CHALLENGES FOR LESSON-TYPE LESSONS ─────────────────────────────

    // Python: pyL1 — Type Checker
    const challenge8 = await Challenge.create({
      lessonId: pyL1._id,
      title: 'Type Checker',
      starterCodes: {
        python: `def check_type(value):
    # Return the type as a string: "str", "int", "float", or "bool"
    pass`
      },
      solutionCodes: {
        python: `def check_type(value):
    if isinstance(value, bool): return "bool"
    elif isinstance(value, int): return "int"
    elif isinstance(value, float): return "float"
    elif isinstance(value, str): return "str"
    return type(value).__name__`
      },
      injectedCodes: {
        python: `import ast
raw = input().strip()
try:
    val = ast.literal_eval(raw)
except:
    val = raw
print(check_type(val))`
      },
      testCases: [
        { input: '"hello"', expectedOutput: 'str', isHidden: false },
        { input: '42', expectedOutput: 'int', isHidden: false },
        { input: '3.14', expectedOutput: 'float', isHidden: false },
        { input: 'True', expectedOutput: 'bool', isHidden: true },
        { input: '0', expectedOutput: 'int', isHidden: true }
      ]
    })

    // Python: pyL2 — Greeting Formatter
    const challenge9 = await Challenge.create({
      lessonId: pyL2._id,
      title: 'Greeting Formatter',
      starterCodes: {
        python: `def format_greeting(name, age):
    # Return: "Hello, {name}! You are {age} years old."
    pass`
      },
      solutionCodes: {
        python: `def format_greeting(name, age):
    return f"Hello, {name}! You are {age} years old."`
      },
      injectedCodes: {
        python: `name = input().strip()
age = int(input().strip())
print(format_greeting(name, age))`
      },
      testCases: [
        {
          input: 'Sara\n25',
          expectedOutput: 'Hello, Sara! You are 25 years old.',
          isHidden: false
        },
        { input: 'Ali\n18', expectedOutput: 'Hello, Ali! You are 18 years old.', isHidden: false },
        { input: 'Nour\n0', expectedOutput: 'Hello, Nour! You are 0 years old.', isHidden: true }
      ]
    })

    // Python: pyL3 — Even, Odd, or Zero
    const challenge10 = await Challenge.create({
      lessonId: pyL3._id,
      title: 'Even, Odd, or Zero',
      starterCodes: {
        python: `def classify_number(n):
    # Return "zero", "even", or "odd"
    pass`
      },
      solutionCodes: {
        python: `def classify_number(n):
    if n == 0: return "zero"
    elif n % 2 == 0: return "even"
    else: return "odd"`
      },
      injectedCodes: {
        python: `print(classify_number(int(input())))`
      },
      testCases: [
        { input: '0', expectedOutput: 'zero', isHidden: false },
        { input: '4', expectedOutput: 'even', isHidden: false },
        { input: '7', expectedOutput: 'odd', isHidden: false },
        { input: '-2', expectedOutput: 'even', isHidden: true },
        { input: '-3', expectedOutput: 'odd', isHidden: true }
      ]
    })

    // Python: pyL5 — Sum of Evens
    const challenge11 = await Challenge.create({
      lessonId: pyL5._id,
      title: 'Sum of Evens',
      starterCodes: {
        python: `def sum_evens(n):
    # Return the sum of all even numbers from 1 to n (inclusive)
    pass`
      },
      solutionCodes: {
        python: `def sum_evens(n):
    total = 0
    for i in range(2, n + 1, 2):
        total += i
    return total`
      },
      injectedCodes: {
        python: `print(sum_evens(int(input())))`
      },
      testCases: [
        { input: '10', expectedOutput: '30', isHidden: false },
        { input: '1', expectedOutput: '0', isHidden: false },
        { input: '6', expectedOutput: '12', isHidden: false },
        { input: '0', expectedOutput: '0', isHidden: true },
        { input: '100', expectedOutput: '2550', isHidden: true }
      ]
    })

    // JavaScript: jsL1 — Swap Fields
    const challenge12 = await Challenge.create({
      lessonId: jsL1._id,
      title: 'Swap Fields',
      starterCodes: {
        javascript: `function swapFields(a, b) {
  // Given two strings, return them swapped as "b a"
}`
      },
      solutionCodes: {
        javascript: `function swapFields(a, b) {
  return b + " " + a;
}`
      },
      injectedCodes: {
        javascript: `const lines = require('fs').readFileSync('/dev/stdin', 'utf8').trim().split('\\n');
console.log(swapFields(lines[0], lines[1]));`
      },
      testCases: [
        { input: 'hello\nworld', expectedOutput: 'world hello', isHidden: false },
        { input: 'A\nB', expectedOutput: 'B A', isHidden: false },
        { input: 'foo\nbar', expectedOutput: 'bar foo', isHidden: true }
      ]
    })

    // JavaScript: jsL2 — Counter Factory
    const challenge13 = await Challenge.create({
      lessonId: jsL2._id,
      title: 'Counter Factory',
      starterCodes: {
        javascript: `function createCounter(start) {
  // Return an object with increment(), decrement(), and getCount()
  // start defaults to 0
}`
      },
      solutionCodes: {
        javascript: `function createCounter(start = 0) {
  let count = start;
  return {
    increment: () => ++count,
    decrement: () => --count,
    getCount: () => count
  };
}`
      },
      injectedCodes: {
        javascript: `const lines = require('fs').readFileSync('/dev/stdin', 'utf8').trim().split('\\n');
const startVal = parseInt(lines[0]);
const ops = lines[1].split(',').map(s => s.trim());
const c = createCounter(startVal);
for (const op of ops) {
  if (op === 'inc') c.increment();
  else if (op === 'dec') c.decrement();
}
console.log(c.getCount());`
      },
      testCases: [
        { input: '0\ninc,inc', expectedOutput: '2', isHidden: false },
        { input: '10\ndec', expectedOutput: '9', isHidden: false },
        { input: '-5\ninc,inc,inc', expectedOutput: '-2', isHidden: true }
      ]
    })

    // JavaScript: jsL3 — Sum Array
    const challenge14 = await Challenge.create({
      lessonId: jsL3._id,
      title: 'Sum Array',
      starterCodes: {
        javascript: `function sumArray(arr) {
  // Return the sum of all numbers in the array
  // Use reduce or a loop
}`
      },
      solutionCodes: {
        javascript: `function sumArray(arr) {
  return arr.reduce((sum, n) => sum + n, 0);
}`
      },
      injectedCodes: {
        javascript: `const input = require('fs').readFileSync('/dev/stdin', 'utf8').trim();
console.log(sumArray(JSON.parse(input)));`
      },
      testCases: [
        { input: '[1,2,3,4,5]', expectedOutput: '15', isHidden: false },
        { input: '[]', expectedOutput: '0', isHidden: false },
        { input: '[10,-3,7]', expectedOutput: '14', isHidden: true }
      ]
    })

    // DSA: dsaL1 — Count Operations
    const challenge15 = await Challenge.create({
      lessonId: dsaL1._id,
      title: 'Count Operations',
      starterCodes: {
        python: `def count_operations(n):
    # Given a nested loop of depth 2 over range(n),
    # return how many times the inner operation executes
    pass`
      },
      solutionCodes: {
        python: `def count_operations(n):
    return n * n`
      },
      injectedCodes: {
        python: `print(count_operations(int(input())))`
      },
      testCases: [
        { input: '3', expectedOutput: '9', isHidden: false },
        { input: '1', expectedOutput: '1', isHidden: false },
        { input: '10', expectedOutput: '100', isHidden: false },
        { input: '0', expectedOutput: '0', isHidden: true },
        { input: '100', expectedOutput: '10000', isHidden: true }
      ]
    })

    // DSA: dsaL2 — Reverse a List
    const challenge16 = await Challenge.create({
      lessonId: dsaL2._id,
      title: 'Reverse a List',
      starterCodes: {
        python: `def reverse_list(arr):
    # Reverse the list in-place and return it
    # Do NOT use arr.reverse() or arr[::-1]
    pass`
      },
      solutionCodes: {
        python: `def reverse_list(arr):
    left, right = 0, len(arr) - 1
    while left < right:
        arr[left], arr[right] = arr[right], arr[left]
        left += 1
        right -= 1
    return arr`
      },
      injectedCodes: {
        python: `import json
print(json.dumps(reverse_list(json.loads(input()))))`
      },
      testCases: [
        { input: '[1,2,3,4,5]', expectedOutput: '[5, 4, 3, 2, 1]', isHidden: false },
        { input: '[1]', expectedOutput: '[1]', isHidden: false },
        { input: '[]', expectedOutput: '[]', isHidden: true },
        { input: '[10,20]', expectedOutput: '[20, 10]', isHidden: true }
      ]
    })

    // DSA: dsaL4 — Queue using Two Stacks
    const challenge17 = await Challenge.create({
      lessonId: dsaL4._id,
      title: 'Queue with Two Stacks',
      starterCodes: {
        python: `class MyQueue:
    def __init__(self):
        # Use two lists as stacks
        pass

    def enqueue(self, val):
        pass

    def dequeue(self):
        # Return the front element, or None if empty
        pass

    def peek(self):
        # Return front without removing, or None if empty
        pass`
      },
      solutionCodes: {
        python: `class MyQueue:
    def __init__(self):
        self.stack_in = []
        self.stack_out = []

    def enqueue(self, val):
        self.stack_in.append(val)

    def dequeue(self):
        if not self.stack_out:
            while self.stack_in:
                self.stack_out.append(self.stack_in.pop())
        return self.stack_out.pop() if self.stack_out else None

    def peek(self):
        if not self.stack_out:
            while self.stack_in:
                self.stack_out.append(self.stack_in.pop())
        return self.stack_out[-1] if self.stack_out else None`
      },
      injectedCodes: {
        python: `import sys
q = MyQueue()
for line in sys.stdin.read().strip().split('\\n'):
    parts = line.strip().split()
    cmd = parts[0]
    if cmd == 'enqueue':
        q.enqueue(int(parts[1]))
    elif cmd == 'dequeue':
        print(q.dequeue())
    elif cmd == 'peek':
        print(q.peek())`
      },
      testCases: [
        { input: 'enqueue 1\nenqueue 2\ndequeue', expectedOutput: '1', isHidden: false },
        { input: 'enqueue 1\nenqueue 2\npeek', expectedOutput: '1', isHidden: false },
        { input: 'dequeue', expectedOutput: 'None', isHidden: true },
        { input: 'enqueue 1\ndequeue\nenqueue 2\ndequeue', expectedOutput: '1\n2', isHidden: true }
      ]
    })

    // TypeScript: tsL1 — Filter Evens
    const challenge18 = await Challenge.create({
      lessonId: tsL1._id,
      title: 'Filter Evens',
      starterCodes: {
        typescript: `declare function require(name: string): any;

function filterEvens(arr: number[]): number[] {
  // Return only the even numbers from the array
  // Implement without using Array.filter
  return [];
}`
      },
      solutionCodes: {
        typescript: `declare function require(name: string): any;

function filterEvens(arr: number[]): number[] {
  const result: number[] = [];
  for (const n of arr) {
    if (n % 2 === 0) result.push(n);
  }
  return result;
}`
      },
      injectedCodes: {
        typescript: `const _input = require('fs').readFileSync('/dev/stdin', 'utf8').trim();
console.log(JSON.stringify(filterEvens(JSON.parse(_input))));`
      },
      testCases: [
        { input: '[1,2,3,4,5,6]', expectedOutput: '[2,4,6]', isHidden: false },
        { input: '[1,3,5]', expectedOutput: '[]', isHidden: false },
        { input: '[]', expectedOutput: '[]', isHidden: true }
      ]
    })

    // TypeScript: tsL2 — Object Keys to Uppercase
    const challenge19 = await Challenge.create({
      lessonId: tsL2._id,
      title: 'Keys to Uppercase',
      starterCodes: {
        typescript: `declare function require(name: string): any;

function keysToUpper(obj: Record<string, any>): Record<string, any> {
  // Return a new object with all keys converted to uppercase
  return {};
}`
      },
      solutionCodes: {
        typescript: `declare function require(name: string): any;

function keysToUpper(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  const keys = Object.keys(obj);
  for (let i = 0; i < keys.length; i++) {
    result[keys[i].toUpperCase()] = obj[keys[i]];
  }
  return result;
}`
      },
      injectedCodes: {
        typescript: `const _input = require('fs').readFileSync('/dev/stdin', 'utf8').trim();
console.log(JSON.stringify(keysToUpper(JSON.parse(_input))));`
      },
      testCases: [
        {
          input: '{"name":"Ali","age":25}',
          expectedOutput: '{"NAME":"Ali","AGE":25}',
          isHidden: false
        },
        { input: '{"a":1}', expectedOutput: '{"A":1}', isHidden: false },
        { input: '{}', expectedOutput: '{}', isHidden: true }
      ]
    })

    // TypeScript: tsL3 — Repeat String
    const challenge20 = await Challenge.create({
      lessonId: tsL3._id,
      title: 'Repeat String',
      starterCodes: {
        typescript: `declare function require(name: string): any;

function repeatStr(s: string, n: number): string {
  // Return s repeated n times, without using String.repeat
  return '';
}`
      },
      solutionCodes: {
        typescript: `declare function require(name: string): any;

function repeatStr(s: string, n: number): string {
  let result = '';
  for (let i = 0; i < n; i++) result += s;
  return result;
}`
      },
      injectedCodes: {
        typescript: `const _lines = require('fs').readFileSync('/dev/stdin', 'utf8').trim().split('\\n');
console.log(repeatStr(_lines[0], parseInt(_lines[1])));`
      },
      testCases: [
        { input: 'abc\n3', expectedOutput: 'abcabcabc', isHidden: false },
        { input: 'x\n5', expectedOutput: 'xxxxx', isHidden: false },
        { input: 'hi\n1', expectedOutput: 'hi', isHidden: true }
      ]
    })

    // Go: goL1 — FizzBuzz
    const challenge21 = await Challenge.create({
      lessonId: goL1._id,
      title: 'FizzBuzz',
      starterCodes: {
        go: `package main

import (
	"fmt"
	"strconv"
)

func fizzBuzz(n int) string {
	// Return "Fizz" if divisible by 3, "Buzz" by 5,
	// "FizzBuzz" by both, otherwise the number as string
	return ""
}`
      },
      solutionCodes: {
        go: `package main

import (
	"fmt"
	"strconv"
)

func fizzBuzz(n int) string {
	if n%15 == 0 { return "FizzBuzz" }
	if n%3 == 0 { return "Fizz" }
	if n%5 == 0 { return "Buzz" }
	return strconv.Itoa(n)
}`
      },
      injectedCodes: {
        go: `
func main() {
	var n int
	fmt.Scan(&n)
	fmt.Println(fizzBuzz(n))
}`
      },
      testCases: [
        { input: '3', expectedOutput: 'Fizz', isHidden: false },
        { input: '5', expectedOutput: 'Buzz', isHidden: false },
        { input: '15', expectedOutput: 'FizzBuzz', isHidden: false },
        { input: '7', expectedOutput: '7', isHidden: true },
        { input: '30', expectedOutput: 'FizzBuzz', isHidden: true }
      ]
    })

    // Go: goL2 — Max of Three
    const challenge22 = await Challenge.create({
      lessonId: goL2._id,
      title: 'Max of Three',
      starterCodes: {
        go: `package main

import "fmt"

func maxOfThree(a, b, c int) int {
	// Return the largest of three integers
	return 0
}`
      },
      solutionCodes: {
        go: `package main

import "fmt"

func maxOfThree(a, b, c int) int {
	m := a
	if b > m { m = b }
	if c > m { m = c }
	return m
}`
      },
      injectedCodes: {
        go: `
func main() {
	var a, b, c int
	fmt.Scan(&a, &b, &c)
	fmt.Println(maxOfThree(a, b, c))
}`
      },
      testCases: [
        { input: '1 2 3', expectedOutput: '3', isHidden: false },
        { input: '10 5 8', expectedOutput: '10', isHidden: false },
        { input: '-1 -2 -3', expectedOutput: '-1', isHidden: true }
      ]
    })

    // Go: goL3 — Sum of Array
    const challenge23 = await Challenge.create({
      lessonId: goL3._id,
      title: 'Sum of Array',
      starterCodes: {
        go: `package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"os"
)

func sumArray(nums []int) int {
	// Return the sum of all integers in nums
	return 0
}`
      },
      solutionCodes: {
        go: `package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"os"
)

func sumArray(nums []int) int {
	total := 0
	for _, n := range nums {
		total += n
	}
	return total
}`
      },
      injectedCodes: {
        go: `
func main() {
	scanner := bufio.NewScanner(os.Stdin)
	scanner.Scan()
	var nums []int
	json.Unmarshal([]byte(scanner.Text()), &nums)
	fmt.Println(sumArray(nums))
}`
      },
      testCases: [
        { input: '[1,2,3,4]', expectedOutput: '10', isHidden: false },
        { input: '[10]', expectedOutput: '10', isHidden: false },
        { input: '[]', expectedOutput: '0', isHidden: true }
      ]
    })

    // Rust: rustL1 — String Concatenation
    const challenge24 = await Challenge.create({
      lessonId: rustL1._id,
      title: 'String Concatenation',
      starterCodes: {
        rust: `fn concat_strings(a: &str, b: &str) -> String {
    // Concatenate a and b with a space between them
    todo!()
}`
      },
      solutionCodes: {
        rust: `fn concat_strings(a: &str, b: &str) -> String {
    format!("{} {}", a, b)
}`
      },
      injectedCodes: {
        rust: `
fn main() {
    let mut a = String::new();
    let mut b = String::new();
    std::io::stdin().read_line(&mut a).unwrap();
    std::io::stdin().read_line(&mut b).unwrap();
    println!("{}", concat_strings(a.trim(), b.trim()));
}`
      },
      testCases: [
        { input: 'hello\nworld', expectedOutput: 'hello world', isHidden: false },
        { input: 'foo\nbar', expectedOutput: 'foo bar', isHidden: false },
        { input: 'a\nb', expectedOutput: 'a b', isHidden: true }
      ]
    })

    // Rust: rustL2 — Absolute Value
    const challenge25 = await Challenge.create({
      lessonId: rustL2._id,
      title: 'Absolute Value',
      starterCodes: {
        rust: `fn absolute(n: i64) -> i64 {
    // Return the absolute value of n without using .abs()
    todo!()
}`
      },
      solutionCodes: {
        rust: `fn absolute(n: i64) -> i64 {
    if n < 0 { -n } else { n }
}`
      },
      injectedCodes: {
        rust: `
fn main() {
    let mut input = String::new();
    std::io::stdin().read_line(&mut input).unwrap();
    let n: i64 = input.trim().parse().unwrap();
    println!("{}", absolute(n));
}`
      },
      testCases: [
        { input: '-5', expectedOutput: '5', isHidden: false },
        { input: '3', expectedOutput: '3', isHidden: false },
        { input: '0', expectedOutput: '0', isHidden: true }
      ]
    })

    // C++: cppL1 — Swap Values
    const challenge26 = await Challenge.create({
      lessonId: cppL1._id,
      title: 'Swap Values',
      starterCodes: {
        cpp: `#include <iostream>
using namespace std;

void swapValues(int* a, int* b) {
    // Swap the values pointed to by a and b
}`
      },
      solutionCodes: {
        cpp: `#include <iostream>
using namespace std;

void swapValues(int* a, int* b) {
    int temp = *a;
    *a = *b;
    *b = temp;
}`
      },
      injectedCodes: {
        cpp: `
int main() {
    int a, b;
    cin >> a >> b;
    swapValues(&a, &b);
    cout << a << " " << b << endl;
    return 0;
}`
      },
      testCases: [
        { input: '5 10', expectedOutput: '10 5', isHidden: false },
        { input: '0 0', expectedOutput: '0 0', isHidden: true },
        { input: '-1 1', expectedOutput: '1 -1', isHidden: true }
      ]
    })

    // C++: cppL2 — Max of Two
    const challenge27 = await Challenge.create({
      lessonId: cppL2._id,
      title: 'Max of Two',
      starterCodes: {
        cpp: `#include <iostream>
using namespace std;

int maxOf(int a, int b) {
    // Return the larger of a and b
}`
      },
      solutionCodes: {
        cpp: `#include <iostream>
using namespace std;

int maxOf(int a, int b) {
    return (a > b) ? a : b;
}`
      },
      injectedCodes: {
        cpp: `
int main() {
    int a, b;
    cin >> a >> b;
    cout << maxOf(a, b) << endl;
    return 0;
}`
      },
      testCases: [
        { input: '3 7', expectedOutput: '7', isHidden: false },
        { input: '10 2', expectedOutput: '10', isHidden: false },
        { input: '-1 -5', expectedOutput: '-1', isHidden: true }
      ]
    })

    // Update ALL lessons with their challengeIds
    await Promise.all([
      // Original 7 (CHALLENGE-type lessons)
      Lesson.findByIdAndUpdate(pyL4._id, { challengeIds: [challenge1._id] }),
      Lesson.findByIdAndUpdate(jsL4._id, { challengeIds: [challenge2._id] }),
      Lesson.findByIdAndUpdate(dsaL3._id, { challengeIds: [challenge3._id] }),
      Lesson.findByIdAndUpdate(dsaL5._id, { challengeIds: [challenge4._id] }),
      Lesson.findByIdAndUpdate(tsL4._id, { challengeIds: [challenge5._id] }),
      Lesson.findByIdAndUpdate(goL4._id, { challengeIds: [challenge6._id] }),
      Lesson.findByIdAndUpdate(rustL3._id, { challengeIds: [challenge7._id] }),
      // New 20 (LESSON-type lessons)
      Lesson.findByIdAndUpdate(pyL1._id, { challengeIds: [challenge8._id] }),
      Lesson.findByIdAndUpdate(pyL2._id, { challengeIds: [challenge9._id] }),
      Lesson.findByIdAndUpdate(pyL3._id, { challengeIds: [challenge10._id] }),
      Lesson.findByIdAndUpdate(pyL5._id, { challengeIds: [challenge11._id] }),
      Lesson.findByIdAndUpdate(jsL1._id, { challengeIds: [challenge12._id] }),
      Lesson.findByIdAndUpdate(jsL2._id, { challengeIds: [challenge13._id] }),
      Lesson.findByIdAndUpdate(jsL3._id, { challengeIds: [challenge14._id] }),
      Lesson.findByIdAndUpdate(dsaL1._id, { challengeIds: [challenge15._id] }),
      Lesson.findByIdAndUpdate(dsaL2._id, { challengeIds: [challenge16._id] }),
      Lesson.findByIdAndUpdate(dsaL4._id, { challengeIds: [challenge17._id] }),
      Lesson.findByIdAndUpdate(tsL1._id, { challengeIds: [challenge18._id] }),
      Lesson.findByIdAndUpdate(tsL2._id, { challengeIds: [challenge19._id] }),
      Lesson.findByIdAndUpdate(tsL3._id, { challengeIds: [challenge20._id] }),
      Lesson.findByIdAndUpdate(goL1._id, { challengeIds: [challenge21._id] }),
      Lesson.findByIdAndUpdate(goL2._id, { challengeIds: [challenge22._id] }),
      Lesson.findByIdAndUpdate(goL3._id, { challengeIds: [challenge23._id] }),
      Lesson.findByIdAndUpdate(rustL1._id, { challengeIds: [challenge24._id] }),
      Lesson.findByIdAndUpdate(rustL2._id, { challengeIds: [challenge25._id] }),
      Lesson.findByIdAndUpdate(cppL1._id, { challengeIds: [challenge26._id] }),
      Lesson.findByIdAndUpdate(cppL2._id, { challengeIds: [challenge27._id] })
    ])

    console.log('Created 27 challenges (1 per lesson) and linked to lessons')

    // ─── 5. ENROLLMENTS ──────────────────────────────────────────────────

    // Students enrolled in various courses with different timestamps
    const enrollmentData = [
      // Nour (top student) — enrolled in 4 courses
      { userId: students[0]._id, courseId: pythonCourse._id },
      { userId: students[0]._id, courseId: dsaCourse._id },
      { userId: students[0]._id, courseId: jsCourse._id },
      { userId: students[0]._id, courseId: tsCourse._id },
      // Yara — 3 courses
      { userId: students[1]._id, courseId: pythonCourse._id },
      { userId: students[1]._id, courseId: jsCourse._id },
      { userId: students[1]._id, courseId: dsaCourse._id },
      // Kareem — 2 courses
      { userId: students[2]._id, courseId: pythonCourse._id },
      { userId: students[2]._id, courseId: goCourse._id },
      // Dina (most active) — 5 courses
      { userId: students[3]._id, courseId: pythonCourse._id },
      { userId: students[3]._id, courseId: jsCourse._id },
      { userId: students[3]._id, courseId: dsaCourse._id },
      { userId: students[3]._id, courseId: tsCourse._id },
      { userId: students[3]._id, courseId: goCourse._id },
      // Ali — 1 course (barely started)
      { userId: students[4]._id, courseId: pythonCourse._id },
      // Layla — 2 courses
      { userId: students[5]._id, courseId: jsCourse._id },
      { userId: students[5]._id, courseId: tsCourse._id },
      // Hassan — 1 course (barely started)
      { userId: students[6]._id, courseId: pythonCourse._id },
      // Maha — 4 courses
      { userId: students[7]._id, courseId: pythonCourse._id },
      { userId: students[7]._id, courseId: dsaCourse._id },
      { userId: students[7]._id, courseId: rustCourse._id },
      { userId: students[7]._id, courseId: goCourse._id },
      // Omar S — 1 course
      { userId: students[8]._id, courseId: pythonCourse._id },
      // Rana — 3 courses
      { userId: students[9]._id, courseId: pythonCourse._id },
      { userId: students[9]._id, courseId: jsCourse._id },
      { userId: students[9]._id, courseId: dsaCourse._id }
    ]

    await Enrollment.insertMany(enrollmentData)
    console.log(`Created ${enrollmentData.length} enrollments`)

    // ─── 6. LESSON PROGRESS ──────────────────────────────────────────────

    const progressData = [
      // Nour — completed all Python, some DSA
      { userId: students[0]._id, lessonId: pyL1._id, isCompleted: true, completedAt: daysAgo(30) },
      { userId: students[0]._id, lessonId: pyL2._id, isCompleted: true, completedAt: daysAgo(28) },
      { userId: students[0]._id, lessonId: pyL3._id, isCompleted: true, completedAt: daysAgo(25) },
      { userId: students[0]._id, lessonId: pyL4._id, isCompleted: true, completedAt: daysAgo(23) },
      { userId: students[0]._id, lessonId: pyL5._id, isCompleted: true, completedAt: daysAgo(20) },
      { userId: students[0]._id, lessonId: dsaL1._id, isCompleted: true, completedAt: daysAgo(15) },
      { userId: students[0]._id, lessonId: dsaL2._id, isCompleted: true, completedAt: daysAgo(12) },
      { userId: students[0]._id, lessonId: dsaL3._id, isCompleted: true, completedAt: daysAgo(10) },
      { userId: students[0]._id, lessonId: jsL1._id, isCompleted: true, completedAt: daysAgo(8) },
      { userId: students[0]._id, lessonId: jsL2._id, isCompleted: false },

      // Yara — completed most of Python, started JS
      { userId: students[1]._id, lessonId: pyL1._id, isCompleted: true, completedAt: daysAgo(20) },
      { userId: students[1]._id, lessonId: pyL2._id, isCompleted: true, completedAt: daysAgo(18) },
      { userId: students[1]._id, lessonId: pyL3._id, isCompleted: true, completedAt: daysAgo(15) },
      { userId: students[1]._id, lessonId: pyL4._id, isCompleted: true, completedAt: daysAgo(12) },
      { userId: students[1]._id, lessonId: pyL5._id, isCompleted: false },
      { userId: students[1]._id, lessonId: jsL1._id, isCompleted: true, completedAt: daysAgo(5) },

      // Kareem — halfway through Python
      { userId: students[2]._id, lessonId: pyL1._id, isCompleted: true, completedAt: daysAgo(14) },
      { userId: students[2]._id, lessonId: pyL2._id, isCompleted: true, completedAt: daysAgo(10) },
      { userId: students[2]._id, lessonId: pyL3._id, isCompleted: false },

      // Dina — completed Python, JS, most of DSA, started TS and Go
      { userId: students[3]._id, lessonId: pyL1._id, isCompleted: true, completedAt: daysAgo(60) },
      { userId: students[3]._id, lessonId: pyL2._id, isCompleted: true, completedAt: daysAgo(58) },
      { userId: students[3]._id, lessonId: pyL3._id, isCompleted: true, completedAt: daysAgo(55) },
      { userId: students[3]._id, lessonId: pyL4._id, isCompleted: true, completedAt: daysAgo(52) },
      { userId: students[3]._id, lessonId: pyL5._id, isCompleted: true, completedAt: daysAgo(50) },
      { userId: students[3]._id, lessonId: jsL1._id, isCompleted: true, completedAt: daysAgo(45) },
      { userId: students[3]._id, lessonId: jsL2._id, isCompleted: true, completedAt: daysAgo(42) },
      { userId: students[3]._id, lessonId: jsL3._id, isCompleted: true, completedAt: daysAgo(40) },
      { userId: students[3]._id, lessonId: jsL4._id, isCompleted: true, completedAt: daysAgo(38) },
      { userId: students[3]._id, lessonId: dsaL1._id, isCompleted: true, completedAt: daysAgo(30) },
      { userId: students[3]._id, lessonId: dsaL2._id, isCompleted: true, completedAt: daysAgo(25) },
      { userId: students[3]._id, lessonId: dsaL3._id, isCompleted: true, completedAt: daysAgo(20) },
      { userId: students[3]._id, lessonId: dsaL4._id, isCompleted: true, completedAt: daysAgo(15) },
      { userId: students[3]._id, lessonId: dsaL5._id, isCompleted: false },
      { userId: students[3]._id, lessonId: tsL1._id, isCompleted: true, completedAt: daysAgo(10) },
      { userId: students[3]._id, lessonId: goL1._id, isCompleted: true, completedAt: daysAgo(5) },

      // Ali — only read first Python lesson
      { userId: students[4]._id, lessonId: pyL1._id, isCompleted: true, completedAt: daysAgo(7) },
      { userId: students[4]._id, lessonId: pyL2._id, isCompleted: false },

      // Layla — working through JS
      { userId: students[5]._id, lessonId: jsL1._id, isCompleted: true, completedAt: daysAgo(12) },
      { userId: students[5]._id, lessonId: jsL2._id, isCompleted: true, completedAt: daysAgo(9) },
      { userId: students[5]._id, lessonId: jsL3._id, isCompleted: true, completedAt: daysAgo(5) },
      { userId: students[5]._id, lessonId: jsL4._id, isCompleted: false },

      // Hassan — barely started
      { userId: students[6]._id, lessonId: pyL1._id, isCompleted: false },

      // Maha — completed Python, DSA in progress, started Rust and Go
      { userId: students[7]._id, lessonId: pyL1._id, isCompleted: true, completedAt: daysAgo(45) },
      { userId: students[7]._id, lessonId: pyL2._id, isCompleted: true, completedAt: daysAgo(42) },
      { userId: students[7]._id, lessonId: pyL3._id, isCompleted: true, completedAt: daysAgo(40) },
      { userId: students[7]._id, lessonId: pyL4._id, isCompleted: true, completedAt: daysAgo(37) },
      { userId: students[7]._id, lessonId: pyL5._id, isCompleted: true, completedAt: daysAgo(35) },
      { userId: students[7]._id, lessonId: dsaL1._id, isCompleted: true, completedAt: daysAgo(20) },
      { userId: students[7]._id, lessonId: dsaL2._id, isCompleted: true, completedAt: daysAgo(17) },
      { userId: students[7]._id, lessonId: dsaL3._id, isCompleted: false },
      {
        userId: students[7]._id,
        lessonId: rustL1._id,
        isCompleted: true,
        completedAt: daysAgo(10)
      },
      { userId: students[7]._id, lessonId: rustL2._id, isCompleted: false },
      { userId: students[7]._id, lessonId: goL1._id, isCompleted: true, completedAt: daysAgo(8) },

      // Omar S — started Python
      { userId: students[8]._id, lessonId: pyL1._id, isCompleted: true, completedAt: daysAgo(5) },
      { userId: students[8]._id, lessonId: pyL2._id, isCompleted: true, completedAt: daysAgo(3) },
      { userId: students[8]._id, lessonId: pyL3._id, isCompleted: false },

      // Rana — Python done, JS and DSA in progress
      { userId: students[9]._id, lessonId: pyL1._id, isCompleted: true, completedAt: daysAgo(25) },
      { userId: students[9]._id, lessonId: pyL2._id, isCompleted: true, completedAt: daysAgo(22) },
      { userId: students[9]._id, lessonId: pyL3._id, isCompleted: true, completedAt: daysAgo(20) },
      { userId: students[9]._id, lessonId: pyL4._id, isCompleted: true, completedAt: daysAgo(18) },
      { userId: students[9]._id, lessonId: pyL5._id, isCompleted: true, completedAt: daysAgo(16) },
      { userId: students[9]._id, lessonId: jsL1._id, isCompleted: true, completedAt: daysAgo(10) },
      { userId: students[9]._id, lessonId: jsL2._id, isCompleted: false },
      { userId: students[9]._id, lessonId: dsaL1._id, isCompleted: true, completedAt: daysAgo(8) }
    ]

    await LessonProgress.insertMany(progressData)
    console.log(`Created ${progressData.length} lesson progress records`)

    // ─── 7. SUBMISSIONS ──────────────────────────────────────────────────

    const submissions = [
      // Nour's submissions — Grade Calculator (passed after 1 failed attempt)
      {
        userId: students[0]._id,
        challengeId: challenge1._id,
        language: SubmissionLanguage.PYTHON,
        userCode: `def get_grade(score):\n    if score >= 90:\n        return "A"\n    elif score >= 80:\n        return "B"\n    else:\n        return "C"`,
        outputLog: 'Test 1: PASS\nTest 2: PASS\nTest 3: PASS\nTest 4: FAIL (expected "D", got "C")',
        status: Status.FAILED,
        metrics: { runtime_ms: 45, memory_kb: 8200, tests_passed: 3, tests_total: 7 }
      },
      {
        userId: students[0]._id,
        challengeId: challenge1._id,
        language: SubmissionLanguage.PYTHON,
        userCode: `def get_grade(score):\n    if score >= 90:\n        return "A"\n    elif score >= 80:\n        return "B"\n    elif score >= 70:\n        return "C"\n    elif score >= 60:\n        return "D"\n    else:\n        return "F"`,
        outputLog: 'All 7 tests passed!',
        status: Status.PASSED,
        metrics: { runtime_ms: 38, memory_kb: 8100, tests_passed: 7, tests_total: 7 }
      },
      // Nour's Two Sum submission (passed)
      {
        userId: students[0]._id,
        challengeId: challenge3._id,
        language: SubmissionLanguage.PYTHON,
        userCode: `def two_sum(nums, target):\n    seen = {}\n    for i, num in enumerate(nums):\n        comp = target - num\n        if comp in seen:\n            return [seen[comp], i]\n        seen[num] = i`,
        outputLog: 'All 5 tests passed!',
        status: Status.PASSED,
        metrics: { runtime_ms: 42, memory_kb: 8400, tests_passed: 5, tests_total: 5 }
      },
      // Yara's Grade Calculator (passed first try)
      {
        userId: students[1]._id,
        challengeId: challenge1._id,
        language: SubmissionLanguage.PYTHON,
        userCode: `def get_grade(score):\n    if score >= 90: return "A"\n    if score >= 80: return "B"\n    if score >= 70: return "C"\n    if score >= 60: return "D"\n    return "F"`,
        outputLog: 'All 7 tests passed!',
        status: Status.PASSED,
        metrics: { runtime_ms: 35, memory_kb: 8000, tests_passed: 7, tests_total: 7 }
      },
      // Dina's submissions — Grade Calculator, Remove Duplicates, Two Sum, Valid Parentheses
      {
        userId: students[3]._id,
        challengeId: challenge1._id,
        language: SubmissionLanguage.PYTHON,
        userCode: `def get_grade(score):\n    grades = [(90,"A"),(80,"B"),(70,"C"),(60,"D")]\n    for threshold, grade in grades:\n        if score >= threshold:\n            return grade\n    return "F"`,
        outputLog: 'All 7 tests passed!',
        status: Status.PASSED,
        metrics: { runtime_ms: 40, memory_kb: 8300, tests_passed: 7, tests_total: 7 }
      },
      {
        userId: students[3]._id,
        challengeId: challenge2._id,
        language: SubmissionLanguage.JAVASCRIPT,
        userCode: 'function removeDuplicates(arr) {\n  return [...new Set(arr)];\n}',
        outputLog: 'All 5 tests passed!',
        status: Status.PASSED,
        metrics: { runtime_ms: 28, memory_kb: 9200, tests_passed: 5, tests_total: 5 }
      },
      {
        userId: students[3]._id,
        challengeId: challenge3._id,
        language: SubmissionLanguage.PYTHON,
        userCode: `def two_sum(nums, target):\n    lookup = {}\n    for i, n in enumerate(nums):\n        if target - n in lookup:\n            return [lookup[target - n], i]\n        lookup[n] = i`,
        outputLog: 'All 5 tests passed!',
        status: Status.PASSED,
        metrics: { runtime_ms: 39, memory_kb: 8500, tests_passed: 5, tests_total: 5 }
      },
      // Layla's Remove Duplicates (failed — incomplete)
      {
        userId: students[5]._id,
        challengeId: challenge2._id,
        language: SubmissionLanguage.JAVASCRIPT,
        userCode:
          'function removeDuplicates(arr) {\n  const result = [];\n  for (const item of arr) {\n    if (!result.includes(item)) result.push(item);\n  }\n  // forgot to return\n}',
        outputLog: 'Test 1: FAIL (expected [1,2,3,4,5], got undefined)',
        status: Status.FAILED,
        metrics: { runtime_ms: 30, memory_kb: 9100, tests_passed: 0, tests_total: 5 }
      },
      // Layla's fix (passed)
      {
        userId: students[5]._id,
        challengeId: challenge2._id,
        language: SubmissionLanguage.JAVASCRIPT,
        userCode:
          'function removeDuplicates(arr) {\n  const result = [];\n  for (const item of arr) {\n    if (!result.includes(item)) result.push(item);\n  }\n  return result;\n}',
        outputLog: 'All 5 tests passed!',
        status: Status.PASSED,
        metrics: { runtime_ms: 32, memory_kb: 9100, tests_passed: 5, tests_total: 5 }
      },
      // Maha's Rust Stack (passed)
      {
        userId: students[7]._id,
        challengeId: challenge7._id,
        language: SubmissionLanguage.RUST,
        userCode: `struct Stack<T> {\n    elements: Vec<T>,\n}\nimpl<T> Stack<T> {\n    fn new() -> Self { Stack { elements: Vec::new() } }\n    fn push(&mut self, item: T) { self.elements.push(item); }\n    fn pop(&mut self) -> Option<T> { self.elements.pop() }\n    fn peek(&self) -> Option<&T> { self.elements.last() }\n    fn is_empty(&self) -> bool { self.elements.is_empty() }\n}`,
        outputLog: 'All 3 tests passed!',
        status: Status.PASSED,
        metrics: { runtime_ms: 12, memory_kb: 4200, tests_passed: 3, tests_total: 3 }
      },
      // Rana's Grade Calculator (passed)
      {
        userId: students[9]._id,
        challengeId: challenge1._id,
        language: SubmissionLanguage.PYTHON,
        userCode: `def get_grade(score):\n    if score >= 90:\n        return "A"\n    elif score >= 80:\n        return "B"\n    elif score >= 70:\n        return "C"\n    elif score >= 60:\n        return "D"\n    else:\n        return "F"`,
        outputLog: 'All 7 tests passed!',
        status: Status.PASSED,
        metrics: { runtime_ms: 36, memory_kb: 8100, tests_passed: 7, tests_total: 7 }
      },
      // A pending submission (just submitted)
      {
        userId: students[2]._id,
        challengeId: challenge1._id,
        language: SubmissionLanguage.PYTHON,
        userCode: `def get_grade(score):\n    pass`,
        outputLog: 'Waiting for execution...',
        status: Status.PENDING,
        metrics: {}
      }
    ]

    await Submission.insertMany(submissions)
    console.log(`Created ${submissions.length} submissions`)

    // ─── 8. CHAT THREADS & MESSAGES ──────────────────────────────────────

    // Thread 1: Nour asking about Two Sum
    const thread1 = await ChatThread.create({
      userId: students[0]._id,
      title: 'Help with Two Sum problem'
    })

    await ChatMessage.insertMany([
      {
        threadId: thread1._id,
        role: SenderRole.USER,
        content:
          "I'm stuck on the Two Sum problem. I can only think of a brute force approach with two nested loops. Is there a better way?"
      },
      {
        threadId: thread1._id,
        role: SenderRole.ASSISTANT,
        content:
          "Great question! The brute force O(n²) approach works, but you can solve it in O(n) using a hash map. The idea is: as you iterate through the array, for each number, check if its complement (target - current number) already exists in the hash map. If it does, you've found your pair. If not, store the current number and its index in the map.\n\nHere's the key insight: you only need to look backwards, because if a pair exists, you'll find the first number when you reach the second one."
      },
      {
        threadId: thread1._id,
        role: SenderRole.USER,
        content:
          'Oh that makes sense! So I only need one pass through the array. Let me try implementing that.'
      },
      {
        threadId: thread1._id,
        role: SenderRole.ASSISTANT,
        content:
          "Exactly! One pass is all you need. Here's a skeleton to get you started:\n\n```python\ndef two_sum(nums, target):\n    seen = {}  # value -> index\n    for i, num in enumerate(nums):\n        complement = target - num\n        # Check if complement exists in seen\n        # If yes, return the indices\n        # If no, add current num to seen\n```\n\nTry filling in the logic!"
      }
    ])

    // Thread 2: Dina asking about closures
    const thread2 = await ChatThread.create({
      userId: students[3]._id,
      title: 'Understanding JavaScript closures'
    })

    await ChatMessage.insertMany([
      {
        threadId: thread2._id,
        role: SenderRole.USER,
        content:
          "Can you explain why closures are useful? I understand the concept but I don't see when I'd actually use them."
      },
      {
        threadId: thread2._id,
        role: SenderRole.ASSISTANT,
        content:
          "Closures are incredibly useful in practice! Here are the most common use cases:\n\n1. **Data privacy** — Create private variables that can't be accessed from outside:\n```javascript\nfunction createWallet(initial) {\n  let balance = initial; // private!\n  return {\n    deposit: (amount) => balance += amount,\n    getBalance: () => balance\n  };\n}\n```\n\n2. **Function factories** — Generate specialized functions:\n```javascript\nfunction multiply(x) {\n  return (y) => x * y;\n}\nconst double = multiply(2);\nconst triple = multiply(3);\n```\n\n3. **Event handlers & callbacks** — Capture context for later execution.\n\nYou've likely already used closures without realizing it — any callback that references variables from its outer scope is a closure!"
      }
    ])

    // Thread 3: Maha asking about Rust ownership
    const thread3 = await ChatThread.create({
      userId: students[7]._id,
      title: 'Rust ownership confusion'
    })

    await ChatMessage.insertMany([
      {
        threadId: thread3._id,
        role: SenderRole.USER,
        content:
          "Why does Rust need ownership? Can't it just use garbage collection like Java or Go?"
      },
      {
        threadId: thread3._id,
        role: SenderRole.ASSISTANT,
        content:
          'Rust *could* use garbage collection, but ownership gives you two huge advantages:\n\n1. **Zero-cost abstractions** — Memory is freed deterministically when the owner goes out of scope. No GC pauses, no runtime overhead, no "stop the world" moments. This is critical for systems programming where predictable performance matters.\n\n2. **Compile-time safety** — The borrow checker catches data races, use-after-free, and dangling pointers at compile time. In GC languages, you can still have data races and logical memory leaks.\n\nThink of it this way: GC trades compile-time complexity for runtime overhead. Rust trades runtime overhead for compile-time complexity. The compiler is strict, but once your code compiles, you have strong guarantees about memory safety.'
      },
      {
        threadId: thread3._id,
        role: SenderRole.USER,
        content:
          "That makes sense. So the compiler is basically doing the GC's job at compile time?"
      },
      {
        threadId: thread3._id,
        role: SenderRole.ASSISTANT,
        content:
          "That's a great mental model! The compiler statically determines when each piece of memory should be freed, instead of a runtime GC figuring it out dynamically. The tradeoff is that you sometimes have to restructure your code to satisfy the borrow checker — but the result is code that's both safe and fast."
      }
    ])

    // Thread 4: Ali asking a beginner question
    const thread4 = await ChatThread.create({
      userId: students[4]._id,
      title: 'What is a variable?'
    })

    await ChatMessage.insertMany([
      {
        threadId: thread4._id,
        role: SenderRole.USER,
        content:
          "I'm completely new to programming. What exactly is a variable and why do I need them?"
      },
      {
        threadId: thread4._id,
        role: SenderRole.ASSISTANT,
        content:
          'Welcome to programming! Think of a variable like a **labeled box** where you can store information.\n\nImagine you\'re organizing your desk:\n- You have a box labeled "Name" and you put a note inside that says "Ali"\n- You have another box labeled "Age" with the number 20\n\nIn Python, that looks like:\n```python\nname = "Ali"\nage = 20\n```\n\nWhy do you need them? Because programs work with data! If you\'re building a calculator, you need somewhere to store the numbers. If you\'re building a game, you need to track the score.\n\nTry it out — in the code editor, type:\n```python\nmy_name = "Ali"\nprint(f"Hello, {my_name}!")\n```'
      }
    ])

    console.log(`Created 4 chat threads with messages`)

    // ─── SUMMARY ─────────────────────────────────────────────────────────
    console.log('\n══════════════════════════════════════')
    console.log('  Database seeded successfully!')
    console.log('══════════════════════════════════════')
    console.log(`  Users:           14 (1 admin, 3 instructors, 10 students)`)
    console.log(`  Courses:         7 (6 published, 1 draft)`)
    console.log(`  Lessons:         27`)
    console.log(`  Challenges:      27 (1 per lesson)`)
    console.log(`  Enrollments:     ${enrollmentData.length}`)
    console.log(`  Lesson Progress: ${progressData.length}`)
    console.log(`  Submissions:     ${submissions.length}`)
    console.log(`  Chat Threads:    4`)
    console.log(`  Chat Messages:   12`)
    console.log('══════════════════════════════════════')
    console.log('\n  Login credentials (all users):')
    console.log('  Password: password123')
    console.log('  Admin:      admin@sigmaloop.com')
    console.log('  Instructor: sara.python@sigmaloop.com')
    console.log('  Student:    nour@student.com')
    console.log('══════════════════════════════════════\n')
  } catch (error) {
    console.error('Error seeding database:', error)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
  }
}

seedDatabase()
