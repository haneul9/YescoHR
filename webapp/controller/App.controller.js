sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/control/app/Menus',
    'sap/ui/yesco/controller/BaseController',
  ],
  (
    // prettier 방지용 주석
    Menus,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.controller.App', {
      onInit() {
        this.debug('App.onInit');

        // apply content density mode to root view
        this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());

        new Menus(this);
      },

      navToHome() {
        this.getRouter().navTo('ehrHome');

        // TODO : master 전환 후 callback 호출 필요(ex: localStorage, sessionStorage, global temporary variables/functions 등 제거 callback)
      },

      getLogoPath(sWerks = 'init') {
        this.byId('logoImage').toggleStyleClass(`logo-${sWerks}`, true);
        return `image/logo-${sWerks}.png`;
      },
    });
  }
);
