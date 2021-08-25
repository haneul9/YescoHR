sap.ui.define(
  [
    './BaseController', //
    'sap/ui/model/json/JSONModel',
    'ExtensionLibs/moment',
    'ExtensionLibs/lodash',
  ],
  function (BaseController, JSONModel) {
    'use strict';

    return BaseController.extend('com.yescohr.ZUI5_YescoHR.controller.App', {
      onInit: function () {
        // Moment, Lodash test
        const day = moment();
        console.log(day);

        console.time('lodash');
        console.log(_.join(['1', '2', '3'], '~'));
        console.timeEnd('lodash');

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
    });
  }
);
