sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/model/Filter',
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/Debuggable',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/model/type/Date', // XML expression binding용 type preloading
    'sap/ui/yesco/mvc/model/type/Time',
  ],
  (
    // prettier 방지용 주석
    Fragment,
    Filter,
    JSONModel,
    AppUtils,
    Debuggable,
    Client,
    ServiceNames
  ) => {
    'use strict';

    return Debuggable.extend('sap.ui.yesco.mvc.controller.app.MobileEmployeeSearchDialogHandler', {
      /**
       * @override
       */
      constructor: function (oController) {
        this.oController = oController;
        this.oDialogModel = new JSONModel(this.getInitialData());
        this.oDialogModel.setSizeLimit(1000);

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
          .attachBeforeOpen(() => {
            // this.onChangeSearchDialogOnlyUnread();
          })
          .setModel(this.oDialogModel)
          .bindElement('/');

        oView.addDependent(this.oDialog);

        this.prepareSuggestionData();
      },

      async prepareSuggestionData() {
        const aEmployees = await this.readSuggestionData();
        aEmployees.forEach((o) => {
          o.Pernr = o.Pernr.replace(/^0+/, '');
        });

        this.oDialogModel.setProperty('/employees', aEmployees);
        this.setBusy(false);
      },

      async readSuggestionData() {
        const oModel = this.oController.getModel(ServiceNames.COMMON);
        const mFilters = {
          Stat2: '3',
          Accty: 'Z',
        };

        return Client.getEntitySet(oModel, 'EmpSearchResult', mFilters);
      },

      onSelectSuggestion(oEvent) {
        const oInput = oEvent.getSource();
        const oSelectedSuggestionRow = oEvent.getParameter('selectedRow');
        if (oSelectedSuggestionRow) {
          const oContext = oSelectedSuggestionRow.getBindingContext();
          oInput.setValue(oContext.getProperty('Pernr'));

          const sRowPath = oInput.getParent().getBindingContext().getPath();
          this.oDialogModel.setProperty(`${sRowPath}/EnameA`, oContext.getProperty('Ename'));
          this.oDialogModel.setProperty(`${sRowPath}/OrgtxA`, oContext.getProperty('Fulln'));
          this.oDialogModel.setProperty(`${sRowPath}/ZzjikgbtA`, oContext.getProperty('Zzjikgbt'));
        }
        oInput.getBinding('suggestionRows').filter([]);
      },

      onLiveChange(oEvent) {
        const sValue = oEvent.getParameter('newValue');
        let aFilters = [];
        if (sValue) {
          aFilters = [
            new Filter(
              [
                new Filter('Ename', (sEname) => {
                  return (sEname || '').toUpperCase().indexOf(sValue.toUpperCase()) > -1;
                }),
                new Filter('Pernr', (sPernr) => {
                  return (sPernr || '').toUpperCase().indexOf(sValue.toUpperCase()) > -1;
                }),
              ],
              false
            ),
          ];
        }

        this.oController.byId('emp-search-list').getBinding('items').filter(aFilters);
      },

      async onChangeMobilePushOnOff(oEvent) {
        try {
          this.setBusy(true);

          // await this.showContentData();
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          this.setBusy(false);
        }
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

      getSearchDialogModel() {
        return this.oDialogModel;
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
