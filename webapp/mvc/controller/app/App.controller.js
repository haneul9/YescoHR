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

        this.oAppMenu = new Menus(this);

        this.getOwnerComponent().setAppMenu(this.oAppMenu);
      },

      navToHome() {
        this.oAppMenu.closeMenuLayer();

        const sCurrentMenuViewId = this.getCurrentMenuViewId();
        if (sCurrentMenuViewId === 'home') {
          return;
        }

        this.oAppMenu.moveToMenu('ehrHome'); // TODO : ehrMobileHome
      },

      getLogoPath(sWerks = 'init') {
        this.byId('logoImage').toggleStyleClass(`logo-${sWerks}`, true);
        return `asset/image/logo-${sWerks}.png`;
      },

      navToProfile() {
        this.oAppMenu.moveToMenu('employee');
      },

      async onPressNotificationPopoverOpen(oEvent) {
        const oButton = oEvent.getSource();

        if (!this.oNotificationPopover) {
          this.oNotificationPopover = await Fragment.load({
            name: 'sap.ui.yesco.mvc.view.app.fragment.NotificationPopover',
            controller: this,
          });

          this.getView().addDependent(this.oNotificationPopover);
          this.oNotificationPopover.bindElement('/ProductCollection/0');
        }

        this.oNotificationPopover.openBy(oButton);
      },

      onPressNotificationPopoverClose() {
        this.oNotificationPopover.close();
      },

      onPressPortletsP13nDialogOpen() {
        this.getOwnerComponent().byId('home').getController().onPressPortletsP13nDialogOpen();
      },

      onExit() {
        if (this.oNotificationPopover) {
          this.oNotificationPopover.destroy();
        }
      },
    });
  }
);
