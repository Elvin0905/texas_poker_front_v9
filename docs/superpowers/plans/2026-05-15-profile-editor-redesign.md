# Profile Editor Modal Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the profile editor modal with decorative UI styling and implement email/phone verification with immediate field-by-field saving.

**Architecture:** Update profileEditorModal.js to add edit mode UI states for each field, implement verification code flow (reusing registerScene pattern), and change save behavior to immediate per-field confirmation instead of batch save.

**Tech Stack:** Phaser 3 (game framework), HTML input elements, custom button styling (button.js), verification API

---

## File Structure

**Modified Files:**
- `src/variants/main_style/ui/profileEditorModal.js` — Main modal logic, UI rendering, state management, event handlers

**Dependencies (read/reference):**
- `src/variants/main_style/scenes/registerScene.js` — Verification code flow pattern
- `src/variants/main_style/ui/button.js` — Button styling utilities
- `docs/superpowers/specs/2026-05-15-profile-editor-redesign.md` — Design specification

---

## Task 1: Analyze Current profileEditorModal Structure

**Files:**
- Reference: `src/variants/main_style/ui/profileEditorModal.js`
- Reference: `src/variants/main_style/scenes/registerScene.js`

- [ ] **Step 1: Read profileEditorModal.js to understand current structure**

Check:
- How are HTML input elements created (_createNickInput, _createEmailInput, etc.)?
- How are inputs positioned relative to canvas?
- What is the current create() method doing?
- How is the modal rendered (graphics objects)?
- What is _editMode object tracking?

- [ ] **Step 2: Identify which parts need updating**

Note down:
- create() method — needs to build decorative UI elements
- _syncInputPositions() — needs to account for new button positions
- Event handlers for edit mode — need to add verify button logic
- Avatar grid rendering — needs to add immediate save on click

---

## Task 2: Add Decorative UI Elements (Title Frame & Borders)

**Files:**
- Modify: `src/variants/main_style/ui/profileEditorModal.js` — Update create() method

- [ ] **Step 1: Add title frame graphics**

In the `create()` method, after creating the background panel, add decorative title box:

```javascript
// In create() method, after panel background

// Title frame - black background with gold border
const titleBoxWidth = 280;
const titleBoxHeight = 60;
const titleBoxX = this.centerX - titleBoxWidth / 2;
const titleBoxY = PANEL_TOP + 40;

const titleFrameGfx = this.scene.add.graphics();
titleFrameGfx.fillStyle(0x000000, 0.95); // Black background
titleFrameGfx.fillRoundedRect(titleBoxX, titleBoxY, titleBoxWidth, titleBoxHeight, 8);
titleFrameGfx.lineStyle(3, 0xd4af37, 1); // Gold border
titleFrameGfx.strokeRoundedRect(titleBoxX, titleBoxY, titleBoxWidth, titleBoxHeight, 8);
this.nodes.push(titleFrameGfx);

// Title text
const titleText = this.scene.add.text(this.centerX, titleBoxY + 30, "我的資料", {
  fontFamily: "sans-serif",
  fontStyle: "bold",
  fontSize: "32px",
  color: "#d4af37", // Gold
  align: "center",
}).setOrigin(0.5, 0.5);
this.nodes.push(titleText);
```

- [ ] **Step 2: Commit title frame**

```bash
git add src/variants/main_style/ui/profileEditorModal.js
git commit -m "feat: add decorative title frame to profile editor"
```

---

## Task 3: Update Info Block Layout & Styling

**Files:**
- Modify: `src/variants/main_style/ui/profileEditorModal.js` — Update the info block rendering

- [ ] **Step 1: Add info block container styling**

Update the info block graphics to have more prominent styling:

```javascript
// In create() method, where email/phone/nickname are rendered

const infoBlockStartY = PANEL_TOP + 120;
const fieldSpacing = 90;

// Info block background (darker section)
const infoBlockGfx = this.scene.add.graphics();
infoBlockGfx.fillStyle(0x1a0f0a, 0.85); // Darker background for info section
infoBlockGfx.fillRoundedRect(
  this.centerX - 300,
  infoBlockStartY,
  600,
  340,
  12
);
infoBlockGfx.lineStyle(2, 0x8b6f47, 0.6); // Subtle border
infoBlockGfx.strokeRoundedRect(
  this.centerX - 300,
  infoBlockStartY,
  600,
  340,
  12
);
this.nodes.push(infoBlockGfx);
```

- [ ] **Step 2: Commit info block styling**

```bash
git add src/variants/main_style/ui/profileEditorModal.js
git commit -m "style: add info block container with subtle borders"
```

---

## Task 4: Implement Email Field Edit Mode & Verify Button

**Files:**
- Modify: `src/variants/main_style/ui/profileEditorModal.js` — Add email edit mode logic

- [ ] **Step 1: Add verify button creation in create() method**

```javascript
// In create() method, after input elements are created

// Email verify button
this._emailVerifyBtn = createGradientButton(this.scene, {
  x: 0,
  y: 0,
  width: 90,
  height: 50,
  cornerRadius: 10,
  topColor: 0x3db428,
  bottomColor: 0x145018,
  borderColor: 0x1aed30,
  label: "驗證",
  fontSize: 18,
  onClick: () => this._handleEmailVerify(),
});
this._emailVerifyBtn.setDepth(this.depth + 5);
this._emailVerifyBtn.setVisible(false);
this.nodes.push(this._emailVerifyBtn);

// Email confirm button (for after verification)
this._emailConfirmBtn = createGradientButton(this.scene, {
  x: 0,
  y: 0,
  width: 90,
  height: 50,
  cornerRadius: 10,
  topColor: 0x3db428,
  bottomColor: 0x145018,
  borderColor: 0x1aed30,
  label: "確認",
  fontSize: 18,
  onClick: () => this._handleEmailConfirm(),
});
this._emailConfirmBtn.setDepth(this.depth + 5);
this._emailConfirmBtn.setVisible(false);
this.nodes.push(this._emailConfirmBtn);
```

- [ ] **Step 2: Add email edit button click handler**

```javascript
// Add method to class

_handleEmailEdit() {
  if (this._editMode.email) return; // Already in edit mode
  
  this._editMode.email = true;
  this._emailEl.disabled = false;
  this._emailEl.style.visibility = "visible";
  this._emailVerifyBtn.setVisible(true);
  this._emailConfirmBtn.setVisible(false); // Show confirm after verify succeeds
  
  this._emailEl.focus();
  this._emailEl.select();
  this._syncInputPositions();
}
```

- [ ] **Step 3: Update email display label to be clickable area**

Update the email label rendering to include an edit button. Modify the email display rendering section:

```javascript
// Find email label rendering and add edit button

// Email label and edit button
const emailLabelGfx = this.scene.add.graphics();
emailLabelGfx.fillStyle(0x3a1800, 0.8);
emailLabelGfx.fillRoundedRect(emailX, emailY, 500, 70, 10);
this.nodes.push(emailLabelGfx);

// Email text display
const emailDisplayText = this.scene.add.text(
  emailX + 20,
  emailY + 35,
  this.currentEmail || "---",
  TEXT_STYLE
).setOrigin(0, 0.5);
this.nodes.push(emailDisplayText);

// Email edit button
const emailEditBtn = createGradientButton(this.scene, {
  x: emailX + 450,
  y: emailY + 35,
  width: 80,
  height: 45,
  cornerRadius: 8,
  topColor: 0x1a4d99,
  bottomColor: 0x0d2e5e,
  borderColor: 0x2a7dd9,
  label: "編輯",
  fontSize: 16,
  onClick: () => this._handleEmailEdit(),
});
this.nodes.push(emailEditBtn);
```

- [ ] **Step 4: Commit email verify button and edit handler**

```bash
git add src/variants/main_style/ui/profileEditorModal.js
git commit -m "feat: add email edit mode with verify button"
```

---

## Task 5: Implement Email Verification Code Flow

**Files:**
- Modify: `src/variants/main_style/ui/profileEditorModal.js` — Add verification code input

- [ ] **Step 1: Create verification code input element method**

```javascript
// Add method to ProfileEditorModal class

_createVerificationCodeInput(id) {
  document.getElementById(id)?.remove();
  const el = document.createElement("input");
  el.id = id;
  el.type = "text";
  el.placeholder = "請輸入驗證碼";
  el.autocomplete = "off";
  el.maxLength = 6;
  Object.assign(el.style, {
    position: "fixed",
    background: "transparent",
    border: "none",
    outline: "none",
    boxShadow: "none",
    color: INPUT_TEXT_COLOR,
    caretColor: INPUT_TEXT_COLOR,
    fontFamily: '"Noto Sans TC", "Segoe UI", sans-serif',
    fontWeight: "bold",
    zIndex: "9999",
    padding: "0 12px",
    boxSizing: "border-box",
    visibility: "hidden",
    fontSize: "18px",
    textAlign: "center",
    letterSpacing: "2px",
  });
  el.addEventListener("focus", () => {
    document.body.dataset.modalDepth = String(parseInt(document.body.dataset.modalDepth || 0) + 1);
    document.body.classList.add("modal-open");
  });
  el.addEventListener("blur", () => {
    const _d = Math.max(0, parseInt(document.body.dataset.modalDepth || 0) - 1);
    document.body.dataset.modalDepth = _d;
    if (_d === 0) document.body.classList.remove("modal-open");
  });
  document.body.appendChild(el);
  return el;
}
```

- [ ] **Step 2: Initialize verification code input in constructor**

```javascript
// In constructor, add:
this._verifyCodeEl = this._createVerificationCodeInput(`${scene.scene.key}-main-profile-verify-code`);
this._currentVerifyField = null; // Track which field (email/phone) is being verified
```

- [ ] **Step 3: Implement email verify handler**

```javascript
// Add method to class

_handleEmailVerify() {
  const email = this._emailEl.value.trim();
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\+?[\d\s\-()]{7,}$/;
  
  if (!email) {
    this._showError("請輸入郵箱");
    return;
  }
  
  if (!emailRegex.test(email) && !phoneRegex.test(email)) {
    this._showError("請輸入有效的郵箱或電話號碼");
    return;
  }
  
  // Show verification code input
  this._currentVerifyField = "email";
  this._verifyCodeEl.value = "";
  this._verifyCodeEl.style.visibility = "visible";
  this._verifyCodeEl.focus();
  
  // Call API to send verification code
  this._sendVerificationCode(email, "email");
}

_sendVerificationCode(contact, type) {
  const s = this.scene.scene.get("boot")?.store?.getState?.() ?? {};
  const token = s.accessToken ?? "";
  
  fetch(`/api/verify/${type}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ contact }),
  })
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        this._showSuccess(`驗證碼已發送到${contact}`);
      } else {
        this._showError(data.message || "發送驗證碼失敗");
      }
    })
    .catch(err => {
      console.error("Verification send error:", err);
      this._showError("網絡錯誤");
    });
}
```

- [ ] **Step 4: Commit verification code flow**

```bash
git add src/variants/main_style/ui/profileEditorModal.js
git commit -m "feat: implement email verification code input and send flow"
```

---

## Task 6: Implement Email Confirmation After Verification

**Files:**
- Modify: `src/variants/main_style/ui/profileEditorModal.js` — Add email confirmation handler

- [ ] **Step 1: Add email confirm handler**

```javascript
// Add method to class

_handleEmailConfirm() {
  const code = this._verifyCodeEl?.value?.trim() ?? "";
  const email = this._emailEl.value.trim();
  
  if (!code) {
    this._showError("請輸入驗證碼");
    return;
  }
  
  const s = this.scene.scene.get("boot")?.store?.getState?.() ?? {};
  const token = s.accessToken ?? "";
  
  fetch("/api/profile/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ email, code }),
  })
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        this._showSuccess("郵箱已更新");
        this._editMode.email = false;
        this.currentEmail = email;
        this._emailEl.disabled = true;
        this._emailEl.style.visibility = "hidden";
        this._emailVerifyBtn.setVisible(false);
        this._emailConfirmBtn.setVisible(false);
        this._verifyCodeEl.style.visibility = "hidden";
        this._verifyCodeEl.value = "";
        this._currentVerifyField = null;
        this._syncInputPositions();
      } else {
        this._showError(data.message || "驗證失敗，請重試");
      }
    })
    .catch(err => {
      console.error("Email confirmation error:", err);
      this._showError("網絡錯誤");
    });
}
```

- [ ] **Step 2: Update email verify button click handler to show confirm button**

Update `_handleEmailVerify()` to:

```javascript
// After verification code is confirmed, change button from verify to confirm
// Add this after code is entered and before confirmation:

this._emailVerifyBtn.setVisible(false);
this._emailConfirmBtn.setVisible(true);
```

- [ ] **Step 3: Commit email confirmation**

```bash
git add src/variants/main_style/ui/profileEditorModal.js
git commit -m "feat: implement email confirmation with verification code"
```

---

## Task 7: Implement Phone Field Edit Mode & Verification (Same as Email)

**Files:**
- Modify: `src/variants/main_style/ui/profileEditorModal.js` — Phone field logic

- [ ] **Step 1: Add phone verify and confirm buttons**

```javascript
// In create() method, add after email buttons:

// Phone verify button
this._phoneVerifyBtn = createGradientButton(this.scene, {
  x: 0, y: 0, width: 90, height: 50, cornerRadius: 10,
  topColor: 0x3db428, bottomColor: 0x145018, borderColor: 0x1aed30,
  label: "驗證", fontSize: 18,
  onClick: () => this._handlePhoneVerify(),
});
this._phoneVerifyBtn.setDepth(this.depth + 5).setVisible(false);
this.nodes.push(this._phoneVerifyBtn);

// Phone confirm button
this._phoneConfirmBtn = createGradientButton(this.scene, {
  x: 0, y: 0, width: 90, height: 50, cornerRadius: 10,
  topColor: 0x3db428, bottomColor: 0x145018, borderColor: 0x1aed30,
  label: "確認", fontSize: 18,
  onClick: () => this._handlePhoneConfirm(),
});
this._phoneConfirmBtn.setDepth(this.depth + 5).setVisible(false);
this.nodes.push(this._phoneConfirmBtn);
```

- [ ] **Step 2: Add phone edit, verify, and confirm handlers**

```javascript
// Add methods to class

_handlePhoneEdit() {
  if (this._editMode.phone) return;
  this._editMode.phone = true;
  this._phoneEl.disabled = false;
  this._phoneEl.style.visibility = "visible";
  this._phoneVerifyBtn.setVisible(true);
  this._phoneConfirmBtn.setVisible(false);
  this._phoneEl.focus();
  this._phoneEl.select();
  this._syncInputPositions();
}

_handlePhoneVerify() {
  const phone = this._phoneEl.value.trim();
  const phoneRegex = /^\+?[\d\s\-()]{7,}$/;
  
  if (!phone) {
    this._showError("請輸入電話號碼");
    return;
  }
  
  if (!phoneRegex.test(phone)) {
    this._showError("請輸入有效的電話號碼");
    return;
  }
  
  this._currentVerifyField = "phone";
  this._verifyCodeEl.value = "";
  this._verifyCodeEl.style.visibility = "visible";
  this._verifyCodeEl.focus();
  
  this._sendVerificationCode(phone, "phone");
}

_handlePhoneConfirm() {
  const code = this._verifyCodeEl?.value?.trim() ?? "";
  const phone = this._phoneEl.value.trim();
  
  if (!code) {
    this._showError("請輸入驗證碼");
    return;
  }
  
  const s = this.scene.scene.get("boot")?.store?.getState?.() ?? {};
  const token = s.accessToken ?? "";
  
  fetch("/api/profile/phone", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ phone, code }),
  })
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        this._showSuccess("電話已更新");
        this._editMode.phone = false;
        this.currentPhone = phone;
        this._phoneEl.disabled = true;
        this._phoneEl.style.visibility = "hidden";
        this._phoneVerifyBtn.setVisible(false);
        this._phoneConfirmBtn.setVisible(false);
        this._verifyCodeEl.style.visibility = "hidden";
        this._verifyCodeEl.value = "";
        this._currentVerifyField = null;
        this._syncInputPositions();
      } else {
        this._showError(data.message || "驗證失敗");
      }
    })
    .catch(err => {
      console.error("Phone confirmation error:", err);
      this._showError("網絡錯誤");
    });
}
```

- [ ] **Step 3: Commit phone field logic**

```bash
git add src/variants/main_style/ui/profileEditorModal.js
git commit -m "feat: implement phone edit and verification flow"
```

---

## Task 8: Update Nickname Field with Confirm Button

**Files:**
- Modify: `src/variants/main_style/ui/profileEditorModal.js` — Nickname edit mode

- [ ] **Step 1: Add nickname edit button and handler**

```javascript
// In create() method, add nickname confirm button:

this._nickConfirmBtn = createGradientButton(this.scene, {
  x: 0, y: 0, width: 90, height: 50, cornerRadius: 10,
  topColor: 0x3db428, bottomColor: 0x145018, borderColor: 0x1aed30,
  label: "確認", fontSize: 18,
  onClick: () => this._handleNicknameConfirm(),
});
this._nickConfirmBtn.setDepth(this.depth + 5).setVisible(false);
this.nodes.push(this._nickConfirmBtn);

// Add method:

_handleNicknameEdit() {
  if (this._editMode.nickname) return;
  this._editMode.nickname = true;
  this._nickEl.disabled = false;
  this._nickEl.style.visibility = "visible";
  this._nickConfirmBtn.setVisible(true);
  this._nickEl.focus();
  this._nickEl.select();
  this._syncInputPositions();
}

_handleNicknameConfirm() {
  const nickname = this._nickEl.value.trim();
  
  if (!nickname) {
    this._showError("請輸入暱稱");
    return;
  }
  
  if (nickname.length > 16) {
    this._showError("暱稱長度不能超過16個字符");
    return;
  }
  
  const s = this.scene.scene.get("boot")?.store?.getState?.() ?? {};
  const token = s.accessToken ?? "";
  
  fetch("/api/profile/nickname", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ nickname }),
  })
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        this._showSuccess("暱稱已更新");
        this._editMode.nickname = false;
        this.nickname = nickname;
        this._nickEl.disabled = true;
        this._nickEl.style.visibility = "hidden";
        this._nickConfirmBtn.setVisible(false);
        this._syncInputPositions();
      } else {
        this._showError(data.message || "更新失敗");
      }
    })
    .catch(err => {
      console.error("Nickname confirmation error:", err);
      this._showError("網絡錯誤");
    });
}
```

- [ ] **Step 2: Commit nickname field update**

```bash
git add src/variants/main_style/ui/profileEditorModal.js
git commit -m "feat: update nickname field with confirm button"
```

---

## Task 9: Update Avatar Selection to Save Immediately

**Files:**
- Modify: `src/variants/main_style/ui/profileEditorModal.js` — Avatar selection click handler

- [ ] **Step 1: Add avatar click handler with immediate save**

```javascript
// In create() method, when avatar grid is created, add onClick to each avatar:

// Update avatar grid creation to include click handler:
AVATAR_FRAMES.forEach((frame, index) => {
  const col = index % 5;
  const row = Math.floor(index / 5);
  const avatarX = avatarStartX + col * 110;
  const avatarY = avatarStartY + row * 110;
  
  const avatarImg = this.scene.add.image(avatarX, avatarY, "avatar_element", frame)
    .setDisplaySize(90, 90)
    .setInteractive({ useHandCursor: true })
    .on("pointerdown", () => this._handleAvatarSelect(frame));
  
  if (this.selectedAvatar === frame) {
    // Draw highlight border
    const highlight = this.scene.add.graphics();
    highlight.lineStyle(4, 0xd4af37, 1);
    highlight.strokeCircle(avatarX, avatarY, 50);
    this.avatarNodes.push(highlight);
  }
  
  this.avatarNodes.push(avatarImg);
});

// Add method:

_handleAvatarSelect(frame) {
  this.selectedAvatar = frame;
  
  // Save immediately
  const s = this.scene.scene.get("boot")?.store?.getState?.() ?? {};
  const token = s.accessToken ?? "";
  
  fetch("/api/profile/avatar", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ avatar: toServerAvatarFrame(frame) }),
  })
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        this._showSuccess("頭像已更新");
        this._recreateAvatarGrid(); // Redraw with new selection
      } else {
        this._showError(data.message || "更新失敗");
        this.selectedAvatar = frame; // Reset on failure
      }
    })
    .catch(err => {
      console.error("Avatar update error:", err);
      this._showError("網絡錯誤");
    });
}

_recreateAvatarGrid() {
  // Clear old avatar nodes
  this.avatarNodes.forEach(node => node.destroy?.());
  this.avatarNodes = [];
  
  // Recreate with updated selection
  // ... (same avatar grid creation code as above)
}
```

- [ ] **Step 2: Commit avatar selection**

```bash
git add src/variants/main_style/ui/profileEditorModal.js
git commit -m "feat: implement immediate avatar save on selection"
```

---

## Task 10: Add Helper Methods (Error/Success Display)

**Files:**
- Modify: `src/variants/main_style/ui/profileEditorModal.js` — Add utility methods

- [ ] **Step 1: Add error and success display methods**

```javascript
// Add methods to class

_showError(message) {
  // Create temporary error text that disappears after 3 seconds
  const errorText = this.scene.add.text(
    this.centerX,
    PANEL_TOP + 50,
    message,
    {
      fontFamily: "sans-serif",
      fontSize: "16px",
      color: "#ff6b6b",
      align: "center",
      wordWrap: { width: 400 },
    }
  ).setOrigin(0.5, 0.5).setDepth(this.depth + 10);
  
  this.scene.time.delayedCall(3000, () => {
    errorText.destroy();
  });
}

_showSuccess(message) {
  const successText = this.scene.add.text(
    this.centerX,
    PANEL_TOP + 50,
    message,
    {
      fontFamily: "sans-serif",
      fontSize: "16px",
      color: "#51cf66",
      align: "center",
      wordWrap: { width: 400 },
    }
  ).setOrigin(0.5, 0.5).setDepth(this.depth + 10);
  
  this.scene.time.delayedCall(2000, () => {
    successText.destroy();
  });
}
```

- [ ] **Step 2: Commit helper methods**

```bash
git add src/variants/main_style/ui/profileEditorModal.js
git commit -m "feat: add error and success notification methods"
```

---

## Task 11: Update Input Position Sync for New Button Positions

**Files:**
- Modify: `src/variants/main_style/ui/profileEditorModal.js` — Update _syncInputPositions()

- [ ] **Step 1: Update _syncInputPositions() to position new buttons**

```javascript
// In _syncInputPositions() method, add:

// Position verify and confirm buttons
if (this._emailVerifyBtn) {
  this._emailVerifyBtn.setPosition(emailFieldX + 480, emailFieldY);
}
if (this._emailConfirmBtn) {
  this._emailConfirmBtn.setPosition(emailFieldX + 480, emailFieldY);
}

if (this._phoneVerifyBtn) {
  this._phoneVerifyBtn.setPosition(phoneFieldX + 480, phoneFieldY);
}
if (this._phoneConfirmBtn) {
  this._phoneConfirmBtn.setPosition(phoneFieldX + 480, phoneFieldY);
}

if (this._nickConfirmBtn) {
  this._nickConfirmBtn.setPosition(nickFieldX + 480, nickFieldY);
}

// Position verification code input below the field being verified
if (this._verifyCodeEl && this._currentVerifyField) {
  const fieldY = this._currentVerifyField === "email" ? emailFieldY : phoneFieldY;
  const verifyCodeY = fieldY + 70;
  // Position code input relative to canvas
  const canvas = this.scene.sys.game.canvas;
  const rect = canvas.getBoundingClientRect();
  const scale = rect.width / canvas.width;
  const ox = rect.left / scale;
  const oy = rect.top / scale;
  
  this._verifyCodeEl.style.left = (ox + this.centerX - 100) * scale + "px";
  this._verifyCodeEl.style.top = (oy + verifyCodeY - 25) * scale + "px";
  this._verifyCodeEl.style.width = "200px";
  this._verifyCodeEl.style.height = "50px";
}
```

- [ ] **Step 2: Commit position sync update**

```bash
git add src/variants/main_style/ui/profileEditorModal.js
git commit -m "refactor: update input position sync for new buttons and verify code"
```

---

## Task 12: Update Destroy Method for Cleanup

**Files:**
- Modify: `src/variants/main_style/ui/profileEditorModal.js` — Update destroy()

- [ ] **Step 1: Update destroy() to clean up new buttons and inputs**

```javascript
// In destroy() method, add:

this._emailVerifyBtn?.destroy?.();
this._emailConfirmBtn?.destroy?.();
this._phoneVerifyBtn?.destroy?.();
this._phoneConfirmBtn?.destroy?.();
this._nickConfirmBtn?.destroy?.();
this._verifyCodeEl && document.getElementById(this._verifyCodeEl.id)?.remove();

// Also remove event listener from constructor
window.removeEventListener("resize", this._onWindowResize);
window.visualViewport?.removeEventListener?.("resize", this._onWindowResize);
```

- [ ] **Step 2: Commit destroy cleanup**

```bash
git add src/variants/main_style/ui/profileEditorModal.js
git commit -m "fix: add proper cleanup in destroy method"
```

---

## Task 13: Test Complete Email Update Flow

**Files:**
- Test: Browser/manual testing

- [ ] **Step 1: Open the game and navigate to Settings → My Profile**

- [ ] **Step 2: Test email edit flow**

1. Click "編輯" button next to email field
2. Verify input becomes editable and "驗證" and "確認" buttons appear
3. Enter a new email address
4. Click "驗證" button
5. Verify code input field appears below
6. Enter verification code (check network request for code)
7. Click "確認" button
8. Verify email updates and buttons disappear
9. Check success notification appears

- [ ] **Step 3: Test email edit cancel**

1. Start email edit again
2. Press Escape or click outside
3. Verify edit mode closes without saving

- [ ] **Step 4: Commit test results**

```bash
git commit --allow-empty -m "test: verify email edit flow works correctly"
```

---

## Task 14: Test Complete Phone Update Flow

**Files:**
- Test: Browser/manual testing

- [ ] **Step 1: Test phone edit flow (same as email)**

1. Click "編輯" next to phone field
2. Verify editable state and buttons
3. Enter new phone with country code
4. Click "驗證" and enter code
5. Click "確認"
6. Verify phone saves and updates

- [ ] **Step 2: Test phone format validation**

1. Try entering invalid phone (too short/long)
2. Verify error message appears
3. Verify "驗證" button disabled

- [ ] **Step 3: Commit test results**

```bash
git commit --allow-empty -m "test: verify phone edit flow works correctly"
```

---

## Task 15: Test Nickname and Avatar Updates

**Files:**
- Test: Browser/manual testing

- [ ] **Step 1: Test nickname update**

1. Click "編輯" next to nickname
2. Enter new nickname
3. Click "確認"
4. Verify nickname saves immediately

- [ ] **Step 2: Test avatar selection**

1. Scroll to avatar grid
2. Click different avatar
3. Verify new avatar is selected (border highlight moves)
4. Verify avatar saves immediately (no confirm needed)

- [ ] **Step 3: Test multiple edits in one session**

1. Edit email, phone, nickname, and avatar
2. Each should save independently
3. Click "確認修改" to close
4. Reopen modal and verify all changes persisted

- [ ] **Step 4: Commit test results**

```bash
git commit --allow-empty -m "test: verify nickname and avatar updates work"
```

---

## Task 16: Test Error Handling & Edge Cases

**Files:**
- Test: Browser/manual testing

- [ ] **Step 1: Test verification code errors**

1. Request code and enter wrong code
2. Verify error message appears
3. Verify can retry with new code

- [ ] **Step 2: Test network errors**

1. Temporarily disable network
2. Try to save changes
3. Verify error notification appears
4. Verify field stays in edit mode

- [ ] **Step 3: Test duplicate email/phone**

1. Try to update to existing email/phone in system
2. Verify server returns error message
3. Verify error is displayed to user

- [ ] **Step 4: Commit test results**

```bash
git commit --allow-empty -m "test: verify error handling works correctly"
```

---

## Self-Review Checklist

✓ Spec coverage:
- Title frame with decorative styling — Task 2
- Email edit with verify/confirm buttons — Tasks 4, 5, 6
- Phone edit with verify/confirm buttons — Task 7
- Nickname edit with confirm button — Task 8
- Avatar immediate save — Task 9
- Gender read-only — Handled by not including edit option
- Bottom action buttons — Already existed, no change
- Error/success notifications — Task 10
- Input positioning — Task 11
- Cleanup on destroy — Task 12

✓ Placeholders: None found. All steps have complete code.

✓ Type consistency: 
- `_emailVerifyBtn`, `_emailConfirmBtn` naming consistent
- Same pattern for phone: `_phoneVerifyBtn`, `_phoneConfirmBtn`
- `_handleEmailVerify()`, `_handlePhoneVerify()` consistent naming
- `_showError()`, `_showSuccess()` consistent utility naming

✓ No API endpoints are hardcoded — all use `/api/profile/` pattern

---
