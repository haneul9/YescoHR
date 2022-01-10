sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/controller/app/control/Menus',
  ],
  (
    // prettier 방지용 주석
    Fragment,
    BaseController,
    Menus
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.app.App', {
      onInit() {
        this.debug('App.onInit');

        // apply content density mode to root view
        this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());

        this.oAppMenu = new Menus(this);

        this.getOwnerComponent().setAppMenu(this.oAppMenu);
      },

      navToHome() {
        this.oAppMenu.closeMenuLayer();

        const sCurrentMenuViewId = this.getCurrentMenuViewId();
        if (sCurrentMenuViewId === 'home') {
          return;
        }

        const oUIComponent = this.getOwnerComponent();
        oUIComponent.reduceViewResource(); // 메뉴 이동 전 View hidden 처리로 불필요한 DOM 정보를 제거
        oUIComponent.getRouter().navTo('ehrHome'); // TODO : ehrMobileHome
      },

      getLogoPath(sWerks = 'init') {
        this.byId('logoImage').toggleStyleClass(`logo-${sWerks}`, true);
        return `asset/image/logo-${sWerks}.png`;
      },

      navToProfile() {
        this.getRouter().navTo('employee');
      },

      notifyOpenPopover(oEvent) {
        var oButton = oEvent.getSource();

        // create popover
        if (!this._oPopover) {
          Fragment.load({
            name: 'sap.ui.yesco.mvc.view.app.fragment.NotifyPopover',
            controller: this,
          }).then(
            function (pPopover) {
              this._oPopover = pPopover;
              this.getView().addDependent(this._oPopover);
              this._oPopover.bindElement('/ProductCollection/0');
              this._oPopover.openBy(oButton);
            }.bind(this)
          );
        } else {
          this._oPopover.openBy(oButton);
        }
      },

      notifyClosePopover() {
        this._oPopover.close();
      },

      onPressPortletsP13nDialogOpen() {
        this.getOwnerComponent().byId('home').getController().onPressPortletsP13nDialogOpen();
      },

      onExit() {
        if (this._oPopover) {
          this._oPopover.destroy();
        }
      },
    });
  }
);
