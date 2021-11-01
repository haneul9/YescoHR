sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/control/HomeMenu',
    'sap/ui/yesco/controller/BaseController',
  ],
  (
    // prettier 방지용 주석
    HomeMenu,
    BaseController
  ) => {
    'use strict';

    class App extends BaseController {
      onInit() {
        this.debug('App.onInit');

        // apply content density mode to root view
        this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());

        new HomeMenu(this, true);
      }

      navToHome() {
        this.getRouter().navTo('ehrHome');

        // TODO : master 전환 후 callback 호출 필요(ex: localStorage, sessionStorage, global temporary variables/functions 등 제거 callback)
      }
    }

    return App;
  }
);
