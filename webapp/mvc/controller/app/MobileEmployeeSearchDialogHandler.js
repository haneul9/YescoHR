sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/model/Filter',
    'sap/ui/model/json/JSONModel',
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

      async showSuggestionData(sTerm) {
        this.setBusy(true);
        const aEmployees = await this.readSuggestionData(sTerm);
        aEmployees.forEach((o) => {
          o.Pernr = o.Pernr.replace(/^0+/, '');
        });

        this.oDialogModel.setProperty('/employees', aEmployees);
        this.setBusy(false);
      },

      async readSuggestionData(sTerm) {
        const oModel = this.oController.getModel(ServiceNames.COMMON);
        const mFilters = {
          Stat2: '3',
          Accty: 'Z',
        };

        if (/[0-9]+/.test(sTerm)) {
          mFilters.Pernr = sTerm;
        } else {
          mFilters.Ename = sTerm;
        }

        return Client.getEntitySet(oModel, 'EmpSearchResult', mFilters);
      },

      onSuggest(oEvent) {
        const sTerm = oEvent.getParameter('suggestValue');
        this.showSuggestionData(sTerm);

        // const oInput = oEvent.getSource();
        // this._oOpenSearchProvider.suggest(sTerm, (sValue, aSuggestions) => {
        //   if (sValue === oInput.getValue()) {
        //     oInput.destroySuggestionItems();
        //     aSuggestions.forEach((sText) => {
        //       oInput.addSuggestionItem(new Item({ text: sText }));
        //     });
        //   }
        // });
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
