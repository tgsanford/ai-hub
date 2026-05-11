# AI Hub - UX/UI Review & Recommendations
**Date:** May 11, 2026  
**Reviewer:** Comprehensive Analysis  
**Goal:** Improve clarity, reduce cognitive load, enhance user flow

---

## Executive Summary

The AI Hub has a solid foundation but suffers from **information overload** and **unclear navigation hierarchy**. Users face too many choices upfront without clear guidance on what to do first. The interface needs **progressive disclosure**, **clearer CTAs**, and **better visual hierarchy**.

---

## Critical Issues (High Priority)

### 1. **Navigation Confusion: 7 Tabs Without Clear Entry Point**
**Problem:**
- 7 top-level tabs (Chat, Projects, Templates\Task, Files, Outputs, Models, Settings)
- No clear "start here" or recommended flow
- "Templates\Task" uses backslash (unclear naming)
- Users don't know: "Do I start in Chat? Templates? Projects?"

**Recommendation:**
```
SUGGESTED TAB STRUCTURE (Reduced to 5):
┌─────────────────────────────────────┐
│ Home | Projects | Library | Settings │
└─────────────────────────────────────┘

- HOME: Dashboard with quick actions, recent work, "New Project" CTA
- PROJECTS: Your active projects (replaces current Projects tab)
- LIBRARY: Templates, Files, Outputs combined (tabbed sub-navigation)
- SETTINGS: Models + Settings combined
- Remove standalone "Chat" tab (integrated into projects)
```

**Why This Works:**
- Reduces 7 choices to 4 clear sections
- "Home" provides entry point and orientation
- Projects become central (aligns with your architecture)
- Related items grouped (Files/Outputs/Templates = Library)

---

### 2. **Sidebar Conversation List: Purpose Unclear**
**Problem:**
- Sidebar shows "Conversations" but also has top tabs
- Unclear relationship between conversations and projects
- "New conversation" button (+) lacks context
- Delete button always visible (clutters interface)

**Recommendation:**
```
OPTION A: Remove Sidebar Conversations
- Move to Projects tab as sub-items
- Sidebar becomes pure navigation

OPTION B: Contextual Sidebar
- Sidebar content changes based on active tab:
  - In Projects: Show project list
  - In Library: Show templates/files
  - In Home: Show recent activity
```

**Quick Win:** At minimum, add a label: "Recent Conversations" instead of just "Conversations"

---

### 3. **Template Selection: Too Much Text, Unclear Actions**
**Problem:**
- Template cards show: label, tagline, mode, AND full output description
- Drag handle always visible (users don't need to reorder constantly)
- Category buttons lack visual grouping
- "Launch" button placement (top right) doesn't follow natural reading flow

**Recommendation:**
```
TEMPLATE CARD REDESIGN:
┌────────────────────────────┐
│ [Icon] Feature Blueprint   │ ← Larger, icon adds visual interest
│ Product planning workflow  │ ← Keep tagline only
│                            │
│ [4 steps] [Product]       │ ← Metadata badges
└────────────────────────────┘
      ↓ Click to expand

EXPANDED VIEW (Right panel):
┌──────────────────────────────────────┐
│ Feature Blueprint            [Launch]│ ← CTA top right
│ Turn ideas into plans                │
│                                      │
│ YOU'LL PROVIDE:                      │
│ • Vision (what to build)             │
│ • Users (who & why)                  │
│ • Constraints (limits)               │
│                                      │
│ YOU'LL GET:                          │
│ • Product brief                      │
│ • User stories                       │
│ • Implementation phases              │
└──────────────────────────────────────┘
```

**Visual Changes:**
- Reduce card text by 60%
- Add icons/emojis for quick scanning
- Use "You'll Provide" / "You'll Get" format (user-focused)
- Hide drag handle unless hovering
- Make category pills, not buttons

---

### 4. **Workflow Form Fields: No Guidance During Input**
**Problem:**
- Four textareas with placeholder text only
- No character counts, no examples, no inline help
- "Attach Context" section feels disconnected
- Frame/Context/Output tabs unclear purpose

**Recommendation:**
```
ENHANCED INPUT FIELDS:
┌────────────────────────────────────────────┐
│ Vision                          [?] Help   │ ← Tooltip icon
│ ┌────────────────────────────────────────┐ │
│ │ What should exist when done?           │ │
│ │                                        │ │
│ └────────────────────────────────────────┘ │
│ 💡 Example: "A mobile app that lets...   │ ← Inline example
│ 0/500 characters                          │ ← Character count
└────────────────────────────────────────────┘

TOOLTIP CONTENT:
"Be specific about outcomes. What will users be able to do?
Focus on the end state, not implementation."
```

**Why This Works:**
- Examples reduce blank-page anxiety
- Character counts set expectations
- Help icons for those who need guidance
- Doesn't clutter UI for power users

---

### 5. **Frame/Context/Output Tabs: Unclear Mental Model**
**Problem:**
- Users don't understand workflow progression
- No visual indicator of completion/progress
- Can skip steps without warning

**Recommendation:**
```
REDESIGN AS STEPPED FLOW:
┌─────────────────────────────────────────────┐
│ ① Frame → ② Context → ③ Output → [Launch] │
│  ●         ○           ○                    │
│ ACTIVE   PENDING     PENDING                │
└─────────────────────────────────────────────┘

OR USE VERTICAL ACCORDION:
▼ 1. Frame Your Work (4 fields)
  [Vision input]
  [Users input]
  ...
  
▶ 2. Add Context (optional)
▶ 3. Configure Output

[Launch Workflow] ← Bottom, always visible
```

**Benefits:**
- Clear sequence (1 → 2 → 3)
- Shows progress
- Collapsible = less overwhelming
- "Optional" labels reduce pressure

---

## Medium Priority Issues

### 6. **Projects Tab: Cards Lack Hierarchy**
**Problem:**
- All information same visual weight
- Stats icons don't add meaning (generic shapes)
- "Open Project" button redundant with clicking card

**Recommendation:**
- Make project title 2x larger
- Remove "Open Project" button (entire card is clickable)
- Add status badges (Active, Archived, Template)
- Use meaningful icons (💬 for conversations, 📄 for files, ✨ for outputs)
- Add last-modified date prominently

### 7. **Model Selector: Always Visible But Rarely Changed**
**Problem:**
- Takes prime real estate in top bar
- Most users set once and forget
- No indication of when model matters

**Recommendation:**
- Move to Settings or make a dropdown icon
- Show model only when relevant (before sending message)
- Add smart defaults per template type

### 8. **File Attachment: Hidden Until Scrolling**
**Problem:**
- File chips in composer are hard to discover
- No clear "drop zone" for uploading
- Limit of 5 visible chips arbitrary

**Recommendation:**
```
ADD VISUAL UPLOAD ZONE:
┌────────────────────────────────────────┐
│ 📎 Drag files here or click to browse │ ← Clear affordance
│    jpg, png, pdf, txt (max 25MB)      │ ← Accepted formats
└────────────────────────────────────────┘

OR: Floating action button for files
```

### 9. **Status Messages: Easy to Miss**
**Problem:**
- Status in top-right corner (peripheral vision)
- No success confirmations for actions
- Errors might be silent

**Recommendation:**
- Toast notifications (bottom-right)
- Success: Green, 3 seconds
- Errors: Red, dismissible
- Loading: Progress bar, not just text

### 10. **Empty States: Weak Call to Action**
**Problem:**
- "No projects yet" - but what should I do?
- Missing opportunities to guide users

**Recommendation:**
```
IMPROVED EMPTY STATE:
┌────────────────────────────────────────┐
│        📋                              │
│   No Projects Yet                      │
│                                        │
│   Projects keep your work organized    │
│   with conversations, files, and       │
│   outputs all in one place.            │
│                                        │
│   [Create from Template] [Start Blank]│
└────────────────────────────────────────┘
```

---

## Quick Wins (Can Implement Today)

### Visual Hierarchy
1. **Increase font sizes:**
   - Page titles: 24px → 32px
   - Card titles: 16px → 20px
   - Body text: 14px → 15px

2. **Add more whitespace:**
   - Padding in cards: 12px → 20px
   - Gap between sections: 16px → 32px

3. **Strengthen primary actions:**
   - "Launch" button: Larger, different color (accent vs. primary teal)
   - Use only ONE primary button per screen

4. **Reduce visual noise:**
   - Hide delete/edit icons until hover
   - Remove borders from inactive elements
   - Use subtle shadows instead of borders

### Copy Improvements
5. **Rename unclear labels:**
   - "Templates\Task" → "Templates"
   - "Frame/Context/Output" → "1. Define / 2. Context / 3. Options"
   - "Attach Context" → "Add Files (Optional)"
   - "Target Output" → "What You'll Get"

6. **Add helper text:**
   - Under "Projects": "Each project contains conversations, files, and outputs"
   - Under "Templates": "Pre-built workflows for common tasks"

### Interaction Improvements
7. **Better feedback:**
   - Add hover states to ALL clickable items
   - Show loading spinners during API calls
   - Disable buttons during processing (not just visual change)

8. **Keyboard shortcuts:**
   - Enter to send message (done)
   - Cmd/Ctrl + K to focus search
   - Escape to close modals

---

## Long-Term Enhancements

### Onboarding Flow
- First-time user wizard
- "Take a tour" option
- Sample project pre-loaded

### Search & Filter
- Global search across projects/templates
- Recent items quick access
- Favorites/pinning

### Responsive Design
- Mobile-friendly layout
- Collapsible sidebar
- Touch-friendly targets

### Accessibility
- ARIA labels for all interactive elements
- Keyboard navigation
- High contrast mode option

---

## Recommended Implementation Order

### Phase 1: Clarity (Week 1)
1. Rename "Templates\Task" → "Templates"
2. Add helper text to all tabs
3. Increase font sizes for titles
4. Hide delete/edit icons until hover

### Phase 2: Hierarchy (Week 2)
5. Redesign template cards (less text)
6. Add "You'll Provide" / "You'll Get" sections
7. Implement toast notifications
8. Improve empty states with clear CTAs

### Phase 3: Navigation (Week 3)
9. Consolidate tabs (7 → 4 or 5)
10. Add Home dashboard
11. Contextual sidebar content
12. Progressive disclosure in forms

### Phase 4: Polish (Week 4)
13. Add icons to templates
14. Implement inline help tooltips
15. Character counts on inputs
16. Keyboard shortcuts

---

## Metrics to Track

After implementing changes, measure:
- **Time to first action** (how long until user creates project)
- **Task completion rate** (do users finish workflows?)
- **Feature discovery** (% of users using templates vs. blank chat)
- **Error recovery** (how many dead-ends/back-button clicks?)

---

## Design Principles Going Forward

1. **Progressive Disclosure**: Show basics first, details on demand
2. **Clear Hierarchy**: One primary action per screen
3. **Contextual Help**: Guidance when needed, invisible when not
4. **Forgiving**: Easy to undo, hard to make mistakes
5. **Fast**: Immediate feedback, no mysterious waits

---

## Mockup Recommendations

I recommend creating quick Figma/wireframes for:
1. New Home dashboard layout
2. Simplified navigation structure
3. Template card redesign
4. Stepped workflow form

Would you like me to create ASCII mockups of any specific screen?
