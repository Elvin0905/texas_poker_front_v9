# Profile Editor Modal Redesign

**Date:** 2026-05-15  
**Scope:** Redesign the ProfileEditorModal UI and interaction flow

## Overview

Redesign the profile editor modal to match the new visual style with enhanced decorative elements, improved field organization, and a streamlined verification workflow for email and phone updates.

## Visual Design

### Layout Structure
- **Panel**: Centered 650x1050px modal with decorative gold border and dark red background
- **Title**: "我的資料" with ornamental frame (black background, gold border)
- **Content Sections**: 
  - Info block (email, phone, nickname, gender)
  - Avatar selection block (20 character avatars in 4x5 grid)
  - Action buttons (Confirm Changes, Cancel)

### Color & Style
- Background: Dark red (#3a1f1a or similar)
- Border: Gold/yellow (#d4af37 or similar)
- Text: Light cream (#ecd5b5)
- Button colors: 
  - Green for verify/confirm actions
  - Blue for edit buttons
  - Red for cancel

## Interaction Flow

### Email Field
**Initial state:** Display current email or "---" + "編輯" button

**On click "編輯":**
1. Input field becomes editable
2. Show "驗證" (verify) and "確認" (confirm) buttons
3. User enters new email

**On click "驗證":**
1. Verification code input field appears below email field
2. System sends verification code to new email address
3. User enters received verification code

**On click "確認" (after verification):**
1. Email is validated and saved to server immediately
2. Field returns to display state showing new email
3. Input field becomes non-editable

---

### Phone Field
**Same flow as email:**
- Display current phone or "---" + "編輯" button
- Edit → Show verify + confirm buttons
- Verify → Code input appears
- Confirm → Phone saved immediately

---

### Nickname Field
**Initial state:** Display current nickname + "編輯" button

**On click "編輯":**
1. Input field becomes editable
2. Show only "確認" button (no verification needed)

**On click "確認":**
1. Nickname is saved to server immediately
2. Field returns to display state

---

### Gender Field
**Read-only display** — follows registration selection, no editing available

---

### Avatar Selection
**Grid of 20 avatars with current avatar highlighted (yellow border)**

**On click any avatar:**
1. Avatar is selected (update border highlight)
2. Saved to server immediately
3. No confirmation step needed

---

### Bottom Actions
- **確認修改** (Confirm Changes): Closes modal, all changes already persisted
- **取消** (Cancel): Closes modal without additional action

## State Management

### EditMode Tracking
```
_editMode = {
  email: boolean,
  phone: boolean,
  nickname: boolean
}
```

### Verification State
- `_emailVerified`: Tracks if current email input has passed verification
- `_phoneVerified`: Tracks if current phone input has passed verification

### UI State
- When field in edit mode: show input + action buttons
- When verification pending: show verification code input
- When saved: show display state with new value

## Error Handling

- **Invalid email format**: Show format hint, disable verify button
- **Invalid phone format**: Show format hint, disable verify button
- **Verification code mismatch**: Show error message, allow retry
- **Save failure**: Show error toast, keep edit mode active

## Testing Checklist

- [ ] Email edit: Input → Verify → Code entry → Confirm → Saved
- [ ] Phone edit: Input → Verify → Code entry → Confirm → Saved
- [ ] Nickname edit: Input → Confirm → Saved
- [ ] Avatar selection: Click → Saved immediately
- [ ] Multiple field edits: Edit multiple fields, confirm each independently
- [ ] Cancel button: Closes modal without saving unsaved changes
- [ ] Format validation: Invalid email/phone shows hint
- [ ] Verification resend: User can request new code
- [ ] Gender field: Verify it's read-only
- [ ] Mobile responsiveness: Check layout on various screen sizes
- [ ] Keyboard handling: Input focus and soft keyboard behavior

## Dependencies

- Existing `resolveMainAvatarFrame()` and `toServerAvatarFrame()` utilities
- Existing HTML input elements for email, phone, nickname
- Existing verification API endpoints from registration flow
- Verification code input element (reuse or create similar to registerScene)

## Notes

- Keep verification flow identical to registerScene for consistency
- Reuse existing button styling and gradients from button.js
- Each field saves independently — no multi-field confirmation batch
- Head avatars update immediately upon selection
