sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/controller/app/NotificationPopoverHandler',
    'sap/ui/yesco/mvc/controller/app/control/Menus',
    'sap/ui/yesco/mvc/model/type/Date', // XML expression binding용 type preloading
    'sap/ui/yesco/mvc/model/type/Time',
  ],
  (
    // prettier 방지용 주석
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

      onPressNotificationPopoverOpen(oEvent) {
        this.oNotificationPopoverHandler.onPressNotificationOpenBy(oEvent.getSource());
      },

      onPressPortletsP13nDialogOpen() {
        this.getOwnerComponent().byId('home').getController().onPressPortletsP13nDialogOpen();
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
