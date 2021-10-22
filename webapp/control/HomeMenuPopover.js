sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/m/Popover',
  ],
  (
    // prettier 방지용 주석
    Popover
  ) => {
    'use strict';

    class HomeMenuPopover extends Popover {
      onmouseout(oEvent) {
        // 화면 밖으로 마우스 이동시 || OverflowToolbar로 마우스 이동시 || App body 영역으로 마우스 이동시
        const bMouseOut = !oEvent.toElement || oEvent.toElement.classList.contains('home-menu-toolbar') || $(oEvent.toElement).parents('.app-body').length;
        if (bMouseOut) {
          this.close();
        }
      }
    }

    return HomeMenuPopover;
  }
);
