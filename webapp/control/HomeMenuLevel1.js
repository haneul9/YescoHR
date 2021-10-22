sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/m/Label',
    'sap/m/LabelDesign',
    'sap/m/OverflowToolbarLayoutData',
    'sap/m/OverflowToolbarPriority',
    'sap/ui/core/Fragment',
    'sap/ui/model/json/JSONModel',
  ],
  (
    // prettier 방지용 주석
    Label,
    LabelDesign,
    OverflowToolbarLayoutData,
    OverflowToolbarPriority,
    Fragment,
    JSONModel
  ) => {
    'use strict';

    class HomeMenuLevel1 extends Label {
      constructor(mMenu, oHomeMenu) {
        super({
          text: mMenu.Mname,
          tooltip: `${mMenu.Mname}(${mMenu.Mnid1}:${mMenu.Menid})`,
          design: LabelDesign.Bold,
          wrapping: true,
          layoutData: new OverflowToolbarLayoutData({
            priority: OverflowToolbarPriority.Low,
          }),
        });

        this.oHomeMenu = oHomeMenu;
        this.oMenuPopover = null;

        this.addStyleClass('home-menu-level1').addStyleClass(mMenu.StyleClasses).setModel(new JSONModel(mMenu));
      }

      /**
       * Top 메뉴 mouseover 이벤트 처리 : 메뉴 popover가 열려있지 않으면 열어줌
       */
      onmouseover() {
        if (!this.oMenuPopover) {
          Fragment.load({
            name: 'sap.ui.yesco.fragment.HomeMenuPopover',
            controller: this.oHomeMenu,
          }).then((oPopover) => {
            setTimeout(() => {
              this.$().toggleClass('home-menu-level1-hover', true).siblings().toggleClass('home-menu-level1-hover', false);
            }, 0);

            this.oMenuPopover = oPopover
              .setModel(this.getModel())
              .attachAfterClose(() => {
                setTimeout(() => {
                  this.$().toggleClass('home-menu-level1-hover', false);
                }, 0);
                this.oMenuPopover.setModel(null).destroy();
                this.oMenuPopover = null;
              })
              .openBy(this);
          });
        } else {
          setTimeout(() => {
            this.$().toggleClass('home-menu-level1-hover', true).siblings().toggleClass('home-menu-level1-hover', false);
          }, 0);

          this.oMenuPopover.openBy(this);
        }
      }

      /**
       * Top 메뉴 mouseout 이벤트 처리 : 메뉴 popover가 열려있으면 닫아줌
       */
      onmouseout(oEvent) {
        // 브라우저 밖으로 마우스 이동시
        if (!oEvent.toElement) {
          this.closeMenuPopover();
          return;
        }

        // 메뉴 Label 내부로 마우스 이동시
        if (oEvent.toElement.nodeName === 'BDI') {
          return;
        }

        // OverflowToolbar로 마우스 이동시 || Overflow 영역으로 숨겨진 메뉴 버튼에서 밖으로 이동시
        const classList = oEvent.toElement.classList;
        if (classList.contains('home-menu-toolbar') || classList.contains('sapMPopoverScroll')) {
          this.closeMenuPopover();
        }
      }

      closeMenuPopover() {
        if (this.oMenuPopover && this.oMenuPopover.isOpen()) {
          setTimeout(() => {
            this.$().toggleClass('home-menu-level1-hover', false);
          }, 0);
          this.oMenuPopover.close();
        }
      }
    }

    return HomeMenuLevel1;
  }
);
