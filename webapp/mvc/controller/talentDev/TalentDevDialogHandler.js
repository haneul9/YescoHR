sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/Debuggable',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
  ],
  (
    // prettier 방지용 주석
    Fragment,
    JSONModel,
    AppUtils,
    Debuggable,
    Client,
    ServiceNames
  ) => {
    'use strict';

    return Debuggable.extend('sap.ui.yesco.mvc.controller.talentDev.TalentDevDialogHandler', {
      constructor: function (oController) {
        this.oController = oController;
        this.fnCallback = null;
        this.oDialog = null;
        this.oDialogModel = new JSONModel(this.getInitialData());
      },

      getInitialData() {
        return {
          busy: true,
          Detail: {},
          ZstatEntry: [],
        };
      },

      setCallback(fnCallback) {
        this.fnCallback = fnCallback;
        return this;
      },

      async openDialog({ Pernr, Gjahr, Mdate, Zseqnr, FileupChk, AuthChange }) {
        this.setBusy();

        this.oDialogModel.setProperty('/ZstatEntry', true);

        if (!this.oDialog) {
          const oView = this.oController.getView();

          const [aZstatEntry, oDialog] = await Promise.all([
            Client.getEntitySet(this.oController.getModel(ServiceNames.TALENT), 'GetZstatList'),
            Fragment.load({
              id: oView.getId(),
              name: 'sap.ui.yesco.mvc.view.talentDev.fragment.TalentDevDialog',
              controller: this,
            }),
          ]);

          this.oDialog = oDialog;
          this.oDialogModel.setProperty(
            '/ZstatEntry',
            _.map(aZstatEntry, (o) => _.chain(o).omit('__metadata').value())
          );

          this.oDialog //
            .setModel(this.oDialogModel)
            .bindElement('/')
            .attachAfterClose(() => {
              setTimeout(() => {
                this.oDialogModel.setProperty('/Detail', null);
              });
            });

          oView.addDependent(this.oDialog);
        }

        setTimeout(async () => {
          try {
            const [mPopupData] = await Client.getEntitySet(this.oController.getModel(ServiceNames.TALENT), 'TalentDevDetail', { Pernr, Gjahr, Mdate, Zseqnr });
            this.oDialogModel.setProperty('/Detail', { ..._.chain(mPopupData).omit('__metadata').value(), FileupChk, AuthChange });
            this.oDialog.open();
          } catch (oError) {
            AppUtils.debug('Controller > talentDev > retrieve Error', oError);
            AppUtils.handleError(oError);
          } finally {
            this.setBusy(false);
          }
        });
      },

      onPressEdit() {},

      onPressSave() {},

      onPressComplete() {},

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
