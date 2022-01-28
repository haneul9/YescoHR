sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/controller/app/NotificationPopoverHandler',
    'sap/ui/yesco/mvc/controller/app/control/Menus',
  ],
  (
    // prettier 방지용 주석
    AppUtils,
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
        location.href = '/sap/public/bc/icf/logoff';
      },
    });
  }
);
