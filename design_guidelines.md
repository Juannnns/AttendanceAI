# Design Guidelines: Attendance Control Platform with Facial Recognition

## Design Approach: Material Design System

**Justification**: This is a data-intensive HR productivity tool requiring clarity, efficiency, and professional presentation. Material Design provides excellent patterns for dashboards, data tables, and form-heavy interfaces while maintaining visual consistency across complex enterprise applications.

**Key Principles**:
- Information clarity over decoration
- Predictable, efficient interactions
- Clear visual hierarchy for data scanning
- Professional, trustworthy appearance

---

## Typography System

**Font Family**: Roboto (via Google Fonts CDN)
- Primary: Roboto Regular (400) for body text and data
- Emphasis: Roboto Medium (500) for labels and secondary headings
- Headings: Roboto Bold (700) for page titles and card headers

**Hierarchy**:
- Page Titles: text-3xl font-bold (Dashboard, Employee Management)
- Section Headers: text-xl font-bold (Today's Summary, Recent Activity)
- Card Titles: text-lg font-medium
- Metric Labels: text-sm font-medium uppercase tracking-wide
- Body/Data: text-base
- Secondary Info: text-sm
- Captions/Timestamps: text-xs

---

## Layout System

**Spacing Primitives**: Use Tailwind units of **2, 4, 6, 8, 12, 16** for consistent rhythm
- Component padding: p-4, p-6
- Section spacing: space-y-6, space-y-8
- Card gaps: gap-4, gap-6
- Tight spacing: space-y-2 (form fields)
- Generous spacing: space-y-12 (between major sections)

**Grid Structure**:
- Main container: max-w-7xl mx-auto px-4
- Dashboard metrics: grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6
- Employee cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
- Forms: max-w-2xl (centered, readable width)

**Page Structure**:
```
[Sidebar Navigation - w-64 fixed left] | [Main Content - ml-64 with p-8]
```

---

## Component Library

### Navigation
- **Fixed Sidebar**: Logo at top, navigation items with icons (Heroicons), active state with subtle visual indicator, user profile at bottom
- **Top Bar**: Page title on left, action buttons (+ Add Employee) on right, breadcrumbs for nested views

### Dashboard Components
- **Metric Cards**: Elevated card with large number (text-4xl font-bold), label below, small trend indicator (↑ ↓), icon in top-right corner
- **Stats Grid**: 4-column on desktop (Present Today, Late Arrivals, Absences, On Time %)
- **Attendance Table**: Striped rows, sortable headers, status badges (Present/Late/Absent), timestamp column, employee photo thumbnail
- **Charts**: Use Recharts library with simple bar/line charts for weekly trends

### Employee Management
- **Employee List**: Table view with photo, name, department, position, actions column
- **Add/Edit Form**: Two-column layout on desktop, stacked on mobile, webcam integration section for facial capture with preview
- **Photo Capture**: Live camera feed with capture button, preview of captured image, retake option

### Forms & Inputs
- **Text Inputs**: border with focus ring, labels above inputs (text-sm font-medium mb-2)
- **Select Dropdowns**: Consistent with text inputs, chevron icon
- **Buttons**: Primary (solid), Secondary (outlined), Destructive (for delete actions)
- **File Upload**: Dashed border drag-drop zone OR camera capture button

### Data Display
- **Tables**: Header row with font-medium, alternating row backgrounds, hover state on rows, right-aligned numeric columns
- **Status Badges**: Rounded-full px-3 py-1 text-sm with semantic indicators (present, late, absent)
- **Empty States**: Centered icon + message + action button when no data exists

### Overlays
- **Modal Dialogs**: Centered with backdrop blur, max-w-2xl, header with close button, footer with action buttons
- **Toasts/Alerts**: Fixed top-right position, auto-dismiss, icon + message + close button

---

## Page-Specific Layouts

### Login Page
- Centered card (max-w-md) on neutral background
- Logo at top, form fields below, login button full-width
- "Forgot password?" link below button

### Dashboard
- 4-column metrics row at top
- Two-column layout below: Weekly chart (left 2/3) + Quick actions card (right 1/3)
- Full-width recent attendance table at bottom

### Employee Management
- Search bar + filter dropdowns + "Add Employee" button in top toolbar
- Grid of employee cards OR table view toggle
- Each card: photo, name, department, quick actions (edit/delete icons)

### Attendance Records
- Date range picker + employee filter at top
- Full-width sortable table with pagination
- Export button in top-right

### Reports & Analytics
- Tab navigation for different report types
- Chart + data table combination
- Filter sidebar on left (date range, department, employee)

---

## Icons
**Library**: Heroicons (via CDN) for UI consistency
- Navigation: HomeIcon, UserGroupIcon, ClipboardDocumentListIcon, ChartBarIcon
- Actions: PlusIcon, PencilIcon, TrashIcon, ArrowDownTrayIcon (export)
- Status: CheckCircleIcon, ExclamationCircleIcon, ClockIcon
- Camera: CameraIcon for photo capture

---

## Images
**Facial Recognition Capture**: Placeholder camera icon or live video feed preview (not actual images to generate)
**Employee Photos**: Circular avatars (w-10 h-10 rounded-full in tables, w-24 h-24 in employee cards)
**Empty States**: Simple icon illustrations for "no employees yet" or "no attendance records"

No hero image needed - this is a functional dashboard application, not a marketing site.