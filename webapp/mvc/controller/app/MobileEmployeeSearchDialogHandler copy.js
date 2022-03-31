sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/model/Filter',
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/Debuggable',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/mvc/model/type/Date', // XML expression binding용 type preloading
    'sap/ui/yesco/mvc/model/type/Time',
  ],
  (
    // prettier 방지용 주석
    Fragment,
    Filter,
    JSONModel,
    Debuggable,
    Client,
    ServiceNames,
    MessageBox
  ) => {
    'use strict';

    return Debuggable.extend('sap.ui.yesco.mvc.controller.app.MobileEmployeeSearchDialogHandler', {
      /**
       * @override
       */
      constructor: function (oController) {
        this.oController = oController;
        this.oDialogModel = new JSONModel(this.getInitialData());
        this.oDialogModel.setSizeLimit(10000);

        this.init();
      },

      getInitialData() {
        return {
          busy: true,
          employees: null,
        };
      },

      async init() {
        const oView = this.oController.getView();

        this.oDialog = await Fragment.load({
          id: oView.getId(),
          name: 'sap.ui.yesco.mvc.view.app.fragment.MobileEmployeeSearchDialog',
          controller: this,
        });

        this.oDialog
          .attachAfterOpen(() => {
            $('#sap-ui-blocklayer-popup').toggleClass('half-dialog', true);
          })
          .attachAfterClose(() => {
            $('#sap-ui-blocklayer-popup').toggleClass('half-dialog', false);
          })
          .setModel(this.oDialogModel)
          .bindElement('/');

        oView.addDependent(this.oDialog);

        this.setBusy(false);
      },

      async showSuggestionData(sValue) {
        this.setBusy(true);
        const aEmployees = await this.readSuggestionData(sValue);

        this.oDialogModel.setProperty('/employees', aEmployees);
        this.setBusy(false);
      },

      async readSuggestionData(sValue) {
        const oModel = this.oController.getModel(ServiceNames.COMMON);
        const mFilters = {
          Ename: sValue,
          Stat2: '3',
          Accty: 'Z',
        };

        return Client.getEntitySet(oModel, 'EmpSearchResult', mFilters);
      },

      onLiveChange(oEvent) {
        if (this.liveChangeInterval) {
          clearInterval(this.liveChangeInterval);
        }

        const sValue = $.trim(oEvent.getParameter('newValue'));
        if (!sValue || sValue.length < 2) {
          this.oDialogModel.setProperty('/employees', []);
          return;
        }

        this.liveChangeInterval = setInterval(() => {
          clearInterval(this.liveChangeInterval);
          this.showSuggestionData(sValue);
        }, 500);
      },

      onDialogToggle() {
        if (this.oDialog.isOpen()) {
          this.onDialogClose();
        } else {
          this.oDialog.open();
        }
      },

      onDialogClose() {
        this.oDialog.close();
      },

      setBusy(bBusy = true) {
        setTimeout(
          () => {
            this.oDialogModel.setProperty('/busy', bBusy);
          },
          bBusy ? 0 : 500
        );
        return this;
      },
    });
  }
);
