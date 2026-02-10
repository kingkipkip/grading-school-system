# Contributing to Grade Management System

Thank you for your interest in contributing! 🎉

## Getting Started

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/your-username/grade-management-system.git
   cd grade-management-system
   ```
3. **Install dependencies**
   ```bash
   npm install
   ```
4. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### 1. Setup Environment

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Fill in your Supabase credentials.

### 2. Run Development Server

```bash
npm run dev
```

Open http://localhost:3000

### 3. Make Your Changes

- Follow the existing code style
- Write meaningful commit messages
- Add comments for complex logic
- Update documentation if needed

### 4. Test Your Changes

Before submitting:
- ✅ Test on desktop
- ✅ Test on mobile
- ✅ Check for console errors
- ✅ Verify accessibility
- ✅ Run build: `npm run build`

### 5. Commit Your Changes

Use conventional commit messages:

```bash
# Feature
git commit -m "feat: add student bulk delete"

# Bug fix
git commit -m "fix: correct grade calculation for special assignments"

# Documentation
git commit -m "docs: update user manual with new features"

# Performance
git commit -m "perf: optimize grading page rendering"

# Refactor
git commit -m "refactor: simplify grade calculation logic"
```

### 6. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## Code Style Guidelines

### JavaScript/JSX

- Use functional components
- Use hooks for state management
- Follow existing naming conventions
- Use meaningful variable names
- Add JSDoc comments for complex functions

```jsx
/**
 * Calculate total score for a student
 * @param {Object} student - Student data
 * @param {Array} assignments - Assignment submissions
 * @param {Array} exams - Exam scores
 * @returns {number} Total score
 */
export function calculateTotalScore(student, assignments, exams) {
  // Implementation
}
```

### CSS/Tailwind

- Use Tailwind utility classes
- Follow mobile-first approach
- Use semantic class names
- Avoid inline styles when possible

```jsx
// ✅ Good
<button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg">
  Save
</button>

// ❌ Avoid
<button style={{ padding: '8px 16px', background: 'blue' }}>
  Save
</button>
```

### File Organization

- Place components in appropriate folders
- Use descriptive file names
- Keep files focused and small
- Export from index files when appropriate

```
src/
├── components/
│   ├── pages/      # Page-level components
│   ├── layout/     # Layout components
│   └── ui/         # Reusable UI components
├── hooks/          # Custom hooks
├── utils/          # Utility functions
└── stores/         # State management
```

## What to Contribute

### 🐛 Bug Fixes
- Check existing issues first
- Provide clear reproduction steps
- Include screenshots if applicable

### ✨ New Features
- Discuss in an issue first
- Ensure it aligns with project goals
- Update documentation
- Add tests if applicable

### 📖 Documentation
- Fix typos and errors
- Improve clarity
- Add examples
- Translate to other languages

### 🎨 Design Improvements
- Follow existing design system
- Ensure accessibility
- Test on multiple devices
- Provide before/after screenshots

## Pull Request Process

1. **Update Documentation**
   - README.md if needed
   - User Manual for user-facing changes
   - Code comments for complex logic

2. **Test Thoroughly**
   - Manual testing on desktop/mobile
   - Check for console errors
   - Verify accessibility
   - Test edge cases

3. **Keep PR Focused**
   - One feature/fix per PR
   - Small, reviewable changes
   - Clear description

4. **Be Responsive**
   - Address review comments
   - Update based on feedback
   - Keep PR up to date with main branch

## Code Review Process

All PRs require review before merging:

- ✅ Code follows style guidelines
- ✅ Changes work as described
- ✅ No breaking changes (or documented)
- ✅ Documentation updated
- ✅ Accessible on mobile/desktop
- ✅ No console errors

## Questions?

- 💬 Open an issue for discussion
- 📧 Email: dev@school.com
- 📖 Check existing documentation

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for making this project better! 🙏
