import { bindImageButton } from "../ui/button.js";

export class ErrorModalScene extends Phaser.Scene {
  constructor() {
    super("errorModal");
    this.unsubscribe = null;
    this.lastSeenErrorVersion = 0;
    this.currentMessage = "未知錯誤";
  }

  create() {
    this.app = window.__APP__;
    this.store = this.app?.store;

    this.blocker = this.add.rectangle(360, 720, 720, 1440, 0x000000, 0.68).setOrigin(0.5);
    this.blocker.setDepth(10000);
    this.blocker.on("pointerdown", (pointer) => {
      pointer.event?.stopPropagation?.();
    });
    this.blocker.on("pointerup", (pointer) => {
      pointer.event?.stopPropagation?.();
    });

    this.panel = this.add.image(360, 720, "error_element", "error_panel");
    this.panel.setDepth(10001);

    this.messageText = this.add
      .text(360, 710, "", {
        fontFamily: "sans-serif",
        fontSize: "30px",
        fontStyle: "bold",
        color: "#ffffff",
        align: "center",
        wordWrap: { width: 520 },
      })
      .setOrigin(0.5)
      .setDepth(10002);

    this.confirmButton = this.add.image(360, 900, "error_element", "btn_error_enter").setDepth(10002);
    bindImageButton(this, this.confirmButton, {
      onClick: () => this.confirmAndClose(),
    });

    this.hideModal();

    this.events.once("shutdown", () => {
      this.unsubscribe?.();
      this.unsubscribe = null;
    });

    this.unsubscribe = this.store?.subscribe((state) => this.handleState(state));
  }

  handleState(state) {
    const nextVersion = Number(state?.errorVersion ?? 0);
    if (nextVersion <= this.lastSeenErrorVersion) {
      return;
    }
    this.lastSeenErrorVersion = nextVersion;

    const message = state?.lastError?.message || state?.lastError?.code || "未知錯誤";
    this.showModal(message);
  }

  showModal(message) {
    this.currentMessage = String(message || "未知錯誤");
    this.messageText.setText(this.currentMessage);

    this.scene.bringToTop();
    this.blocker.setVisible(true);
    this.panel.setVisible(true);
    this.messageText.setVisible(true);
    this.confirmButton.setVisible(true);
    this.blocker.setInteractive({ useHandCursor: false });
  }

  hideModal() {
    this.blocker.setVisible(false);
    this.panel.setVisible(false);
    this.messageText.setVisible(false);
    this.confirmButton.setVisible(false);
    this.blocker.disableInteractive();
  }

  confirmAndClose() {
    this.hideModal();
    this.store?.clearLastError?.();
  }
}
