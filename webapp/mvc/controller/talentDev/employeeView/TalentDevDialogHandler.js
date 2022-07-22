sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/Debuggable',
    'sap/ui/yesco/common/FileDataProvider',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
  ],
  (
    // prettier 방지용 주석
    Fragment,
    JSONModel,
    Debuggable,
    FileDataProvider,
    Client,
    ServiceNames
  ) => {
    'use strict';

    return Debuggable.extend('sap.ui.yesco.mvc.controller.talentDev.employeeView.TalentDevDialogHandler', {
      constructor: function (oController) {
        this.oController = oController;
        this.oDialog = null;
        this.oDialogModel = new JSONModel(this.getInitialData());
      },

      getInitialData() {
        return {
          busy: true,
          dialog: null,
        };
      },

      /**
       *
       * @param {string} Pernr
       * @param {string} Value01 Gjahr
       * @param {string} Value06 Mdate
       * @param {string} Value07 Zseqnr
       */
      async openDialog({ Pernr, Value01, Value06, Value07 }) {
        const oView = this.oController.getView();

        this.setBusy();

        if (!this.oDialog) {
          this.oDialog = await Fragment.load({
            id: oView.getId(),
            name: 'sap.ui.yesco.mvc.view.talentDev.employeeView.TalentDevDialog',
            controller: this,
          });

          this.oDialog //
            .setModel(this.oDialogModel)
            .bindElement('/dialog')
            .attachAfterClose(() => {
              setTimeout(() => {
                this.oDialogModel.setProperty('/dialog', null);
              });
            });

          oView.addDependent(this.oDialog);
        }

        setTimeout(async () => {
          const oModel = this.oController.getModel(ServiceNames.TALENT);
          const mFilters = { Pernr, Gjahr: Value01, Mdate: moment(Value06).hour(9).toDate(), Zseqnr: Value07 };
          const aTalentDevData = await Client.getEntitySet(oModel, 'TalentDevDetail', mFilters);
          this.oDialogModel.setProperty('/dialog', aTalentDevData[0]);
          this.setBusy(false);
        });

        this.oDialog.open();
      },

      async onPressFileDownload(oEvent) {
        const mFile = await FileDataProvider.readData(oEvent.getSource().data('appno'), 9050);
        this.oController.AttachFileAction.openFileLink(mFile.Fileuri);
      },

      onPressDialogClose() {
        this.oDialog.close();
      },

      setBusy(bBusy = true) {
        setTimeout(() => {
          this.oDialogModel.setProperty('/busy', bBusy);
        });
        return this;
      },
    });
  }
);
