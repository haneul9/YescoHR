sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/controller/app/NotificationPopoverHandler',
    'sap/ui/yesco/mvc/controller/app/control/Menus',
    'sap/ui/yesco/mvc/model/type/Date', // XML expression binding용 type preloading
    'sap/ui/yesco/mvc/model/type/Time',
    'sap/ui/yesco/mvc/model/type/Pernr',
  ],
  (
    // prettier 방지용 주석
    Fragment,
    AppUtils,
    MessageBox,
    BaseController,
    NotificationPopoverHandler,
    Menus
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.app.App', {
      onInit() {
        this.debug('App.onInit');

        this.oAppMenu = new Menus(this);
        this.oNotificationPopoverHandler = new NotificationPopoverHandler(this);

        this.getOwnerComponent().setAppMenu(this.oAppMenu);
      },

      getAppMenu() {
        return this.oAppMenu;
      },

      navToHome() {
        this.oAppMenu.closeMenuLayer();

        const sCurrentMenuViewId = this.getCurrentMenuViewId();
        if (sCurrentMenuViewId === 'home') {
          return;
        }

        this.oAppMenu.moveToMenu(AppUtils.isMobile() ? 'ehrMobileHome' : 'ehrHome');
      },

      getLogoPath(sWerks = 'init') {
        this.byId('logo-image').toggleStyleClass(`logo-${sWerks}`, true);
        return `asset/image/logo-${sWerks}.png`;
      },

      navToProfile() {
        this.oAppMenu.moveToMenu('employee');
      },

      onPressNotificationPopoverToggle(oEvent) {
        oEvent.cancelBubble();

        this.oNotificationPopoverHandler.onPopoverToggle();
      },

      onPressPortletsP13nDialogOpen() {
        this.getOwnerComponent().byId('home').getController().onPressPortletsP13nDialogOpen();
      },

      onExit: function () {
        if (this._oPopover) {
          this._oPopover.destroy();
        }
      },

      handleResponsivePopoverPress: function (oEvent) {
        var oButton = oEvent.getSource();

        if (!this._oPopover) {
          Fragment.load({
            name: 'sap.ui.yesco.mvc.view.app.fragment.MenuPopover',
            controller: this,
          }).then(
            function (oPopover) {
              this._oPopover = oPopover;
              this.getView().addDependent(this._oPopover);
              this._oPopover.bindElement('/ProductCollection/0');
              this._oPopover.openBy(oButton);
            }.bind(this)
          );
        } else {
          this._oPopover.openBy(oButton);
        }
      },

      handleCloseButton: function (oEvent) {
        this._oPopover.close();
      },

      onPressLogout() {
        // 로그아웃하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_01004'), {
          actions: [MessageBox.Action.YES, MessageBox.Action.NO],
          onClose: (sAction) => {
            if (sAction === MessageBox.Action.YES) {
              location.href = '/sap/public/bc/icf/logoff';
            }
          },
        });
      },
    });
  }
);
