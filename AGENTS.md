# Evol Order Dashboard Agent Guidelines

## Development Commands

- Start dev server: `pnpm dev` (runs on port 4000)
- Build for production: `pnpm build`
- Start production server: `pnpm start` (runs on port 4000)

## Technology Stack

- Framework: Next.js 16.1.6
- Language: TypeScript
- Styling: Tailwind CSS 4
- UI Components: Shadcn UI via `shadcn` CLI
- Linting/Formatting: Biome
- Package Manager: pnpm

## Development Principles

- Build production-ready code that is simple, readable, type-safe, follows best practices, and is maintainable with proper structure and organization
- Use frontend design skill and UI/UX skill when doing design-related tasks
- Keep code structure organized, modular, and readable
- Avoid over-engineering functions; don't repeat code unnecessarily, but don't over-complicate things or add excessive lines of code
- Keep files focused and tight; avoid large files with all logic in one place, while maintaining smart code organization
- Use Shadcn components wherever possible; avoid writing excessive CSS, ask user for component search and choice if building major components from scratch
- Don't write too many comments or unnecessary headings/copy content unless asked
- Keep theme in mind while making design changes; don't mess with global theme, focus on making items clean, aligned, and well-spaced throughout
- Don't mess with types; avoid using `any`, avoid complicated types - there's always a simple and better solution; search and find for the simplest

## Notes

- The dev server runs on port 4000 (as specified in scripts)
  - Don't run `pnpm lint`
- When adding new UI components, consider using the `shadcn` CLI (if installed) or copying from the existing patterns in `components/`.
