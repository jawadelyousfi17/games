@AGENTS.md

# Development Guidelines

## READ THIS
- Use styled Shadcn componnet, lets say you want to create a button go style it in the component/ui/button.tsx then use it across the project

## Code Structure
- Break features into small, focused files — one responsibility per file
- Organize by: `components/`, `hooks/`, `lib/`, `utils/`, `types/`, `services/`
- Never put multiple unrelated things in one file

## Comments
- Add JSDoc to every exported function
- Comment the WHY, not the what — explain non-obvious decisions
- Example: `// Using ISR here because this data updates every hour, not on every request`

## Next.js Best Practices
- Use App Router by default
- Default to server components — add `"use client"` only when needed (event handlers, hooks, browser APIs)
- Always create `loading.tsx` and `error.tsx` alongside `page.tsx`
- Use `layout.tsx` for shared UI, never duplicate structure across pages

## TypeScript
- Strict mode always — no `any`
- Define shared types in `/types` folder
- Use `interface` for object shapes, `type` for unions/aliases

## Before Writing Code
1. State which files you'll create or modify
2. Explain the structure briefly
3. Then write the code