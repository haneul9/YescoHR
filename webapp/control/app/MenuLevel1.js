sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/m/Label',
    'sap/m/LabelDesign',
    'sap/m/OverflowToolbarLayoutData',
    'sap/m/OverflowToolbarPriority',
    'sap/ui/model/json/JSONModel',
  ],
  (
    // prettier 방지용 주석
    Label,
    LabelDesign,
    OverflowToolbarLayoutData,
    OverflowToolbarPriority,
    JSONModel
  ) => {
    'use strict';

    class MenuLevel1 extends Label {
      constructor(mMenu, oAppMenu) {
        super({
          text: mMenu.Mname,
          tooltip: `${mMenu.Mname} (${mMenu.Mnid1}:${mMenu.Menid})`,
          design: LabelDesign.Bold,
          wrapping: true,
          layoutData: new OverflowToolbarLayoutData({
            priority: OverflowToolbarPriority.Low,
          }),
        });

        this.oAppMenu = oAppMenu;

        this.addStyleClass('app-menu-level1').addStyleClass(mMenu.StyleClasses).setModel(new JSONModel(mMenu));
      }

      /**
       * Top 메뉴 mouseover 이벤트 처리 : 메뉴 popover가 열려있지 않으면 열어줌
       */
      onmouseover(oEvent) {
        if (oEvent.target.id === oEvent.toElement.id && oEvent.toElement.tagName === 'SPAN') {
          this.oAppMenu.openMenuPopoverBy(this);
        }
      }

      /**
       * Top 메뉴 mouseout 이벤트 처리 : 메뉴 popover가 열려있으면 닫아줌
       */
      onmouseout(oEvent) {
        // 브라우저 밖으로 마우스 이동시
        if (!oEvent.toElement) {
          this.oAppMenu.closeMenuPopover();
          return;
        }

        // OverflowToolbar로 마우스 이동시 || Overflow 영역으로 숨겨진 메뉴 버튼에서 밖으로 이동시
        const classList = oEvent.toElement.classList;
        if (classList.contains('app-menu-toolbar') || classList.contains('sapMPopoverScroll')) {
          this.oAppMenu.closeMenuPopover();
        }
      }
    }

    return MenuLevel1;
  }
);
