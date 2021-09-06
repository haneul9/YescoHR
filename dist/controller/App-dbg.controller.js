sap.ui.define(
  [
    'sap/ui/model/json/JSONModel', // prettier 방지용 주석
    'sap/ui/yesco/common/appUtils',
    'sap/ui/yesco/controller/BaseController',
    'sap/ui/yesco/extension/lodash',
    'sap/ui/yesco/extension/moment',
  ],
  (
    JSONModel, // prettier 방지용 주석
    appUtils,
    BaseController,
    lodashjs,
    momentjs
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.controller.App', {
      onInit() {
        // Moment, Lodash test
        const day = moment();
        this.debug(day); // BaseController에 선언됨

        this.debug('lodash');
        this.debug(_.join(['1', '2', '3'], '~'));
        this.debug('lodash');

        this.debug(appUtils.getDevice());

        const iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();

        const oAppViewModel = new JSONModel({
          busy: false,
          delay: 0,
          layout: 'OneColumn',
          previousLayout: '',
          actionButtonsInfo: {
            midColumn: {
              fullScreen: false,
            },
          },
        });
        this.setModel(oAppViewModel, 'appView');

        const fnSetAppNotBusy = function () {
          oAppViewModel.setProperty('/busy', false);
          oAppViewModel.setProperty('/delay', iOriginalBusyDelay);
        };

        // since then() has no "reject"-path attach to the MetadataFailed-Event to disable the busy indicator in case of an error
        this.getOwnerComponent().getModel().metadataLoaded().then(fnSetAppNotBusy);
        this.getOwnerComponent().getModel().attachMetadataFailed(fnSetAppNotBusy);

        // apply content density mode to root view
        this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
      },

      onHomePress() {
        // var iconTabHeader = this.byId('iconTabHeader');
        // iconTabHeader.setSelectedKey('invalidKey');

        // var label = this.byId('labelId');
        // label.setText('Home Screen');
        this.getRouter().navTo('appHome');

        // TODO : master 전환 후 callback 호출 필요(ex: localStorage, sessionStorage, global temporary variables/functions 등 제거 callback)
      },

      onSelectTab(event) {
        // var label = this.byId('labelId');
        const tab = event.getParameter('item');

        // label.setText(tab.getText());
      },

      navigateTo(event) {
        // var label = this.byId('labelId');
        // this.getRouter().navTo(label);
      },

      navigateToHome(event) {
        this.getRouter().navTo('appHome');
      },

      navigateToCarousel(event) {
        this.getRouter().navTo('carousel');
      },

      navigateToPage1(event) {
        this.getRouter().navTo('page1');
      },

      navigateToPage2(event) {
        this.getRouter().navTo('page2');
      },

      navigateToUserForm(event) {
        this.getRouter().navTo('userform');
      },

      navigateToAppConfig(event) {
        this.getRouter().navTo('appconfig');
      },

      navigateToRouting(event) {
        this.getRouter().navTo('page1');
      },

      onUserNamePress() {},
    });
  }
);
