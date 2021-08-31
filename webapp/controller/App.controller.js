sap.ui.define(
  [
    './BaseController', //
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/appUtils',
    'sap/ui/yesco/extension/moment',
    'sap/ui/yesco/extension/lodash',
  ],
  function (BaseController, JSONModel, appUtils) {
    'use strict';

    return BaseController.extend('sap.ui.yesco.controller.App', {
      onInit: function () {
        // Moment, Lodash test
        const day = moment();
        console.log(day);

        console.time('lodash');
        console.log(_.join(['1', '2', '3'], '~'));
        console.timeEnd('lodash');

        console.log(appUtils.getDevice());

        const iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();

        const oViewModel = new JSONModel({
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
        this.setModel(oViewModel, 'appView');

        const fnSetAppNotBusy = function () {
          oViewModel.setProperty('/busy', false);
          oViewModel.setProperty('/delay', iOriginalBusyDelay);
        };

        // since then() has no "reject"-path attach to the MetadataFailed-Event to disable the busy indicator in case of an error
        this.getOwnerComponent().getModel().metadataLoaded().then(fnSetAppNotBusy);
        this.getOwnerComponent().getModel().attachMetadataFailed(fnSetAppNotBusy);

        // apply content density mode to root view
        this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
      },

      onHomePress: function () {
        // var iconTabHeader = this.byId('iconTabHeader');
        // iconTabHeader.setSelectedKey('invalidKey');

        // var label = this.byId('labelId');
        // label.setText('Home Screen');
        this.getOwnerComponent().getRouter().navTo('master');
      },

      onSelectTab: function (event) {
        // var label = this.byId('labelId');
        var tab = event.getParameter('item');

        // label.setText(tab.getText());
      },

      navigateTo: function (evt) {
        // var label = this.byId('labelId');
        // this.getOwnerComponent().getRouter().navTo(label);
      },
      navigateToHome: function (evt) {
        this.getRouter().navTo('master');
      },
      navigateToCarousel: function (evt) {
        this.getRouter().navTo('carousel');
      },
      navigateToPage1: function (evt) {
        this.getRouter().navTo('page1');
      },
      navigateToPage2: function (evt) {
        this.getRouter().navTo('page2');
      },
      navigateToUserForm: function (evt) {
        this.getRouter().navTo('userform');
      },
      navigateToAppConfig: function (evt) {
        this.getRouter().navTo('appconfig');
      },
      navigateToRouting: function (evt) {
        this.getRouter().navTo('page1');
      },

      onUserNamePress: function () {},
    });
  }
);
