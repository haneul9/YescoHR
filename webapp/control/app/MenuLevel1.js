sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/m/Label',
    'sap/m/LabelDesign',
    'sap/m/OverflowToolbarLayoutData',
    'sap/m/OverflowToolbarPriority',
  ],
  (
    // prettier 방지용 주석
    Label,
    LabelDesign,
    OverflowToolbarLayoutData,
    OverflowToolbarPriority
  ) => {
    'use strict';

    return Label.extend('sap.ui.yesco.control.app.MenuLevel1', {
      metadata: {
        properties: {
          appMenu: {
            type: 'any',
          },
        },
      },

      renderer: {},

      constructor: function (...aArgs) {
        Label.apply(this, aArgs);

        this.setDesign(LabelDesign.Bold)
          .setWrapping(true)
          .setLayoutData(new OverflowToolbarLayoutData({ priority: OverflowToolbarPriority.Low }))
          .addStyleClass('app-menu-level1');
      },

      /**
       * Top 메뉴 mouseover 이벤트 처리 : 메뉴 popover가 열려있지 않으면 열어줌
       */
      onmouseover(oEvent) {
        if (oEvent.target.id === oEvent.toElement.id && oEvent.toElement.tagName === 'SPAN') {
          this.getAppMenu().openMenuPopoverBy(this);
        }
      },

      /**
       * Top 메뉴 mouseout 이벤트 처리 : 메뉴 popover가 열려있으면 닫아줌
       */
      onmouseout(oEvent) {
        // 브라우저 밖으로 마우스 이동시
        if (!oEvent.toElement) {
          this.getAppMenu().closeMenuPopover();
          return;
        }

        // OverflowToolbar로 마우스 이동시 || Overflow 영역으로 숨겨진 메뉴 버튼에서 밖으로 이동시
        const classList = oEvent.toElement.classList;
        if (classList.contains('app-menu-toolbar') || classList.contains('sapMPopoverScroll')) {
          this.getAppMenu().closeMenuPopover();
        }
      },
    });
  }
);
