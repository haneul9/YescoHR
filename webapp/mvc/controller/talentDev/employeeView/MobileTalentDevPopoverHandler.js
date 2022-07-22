sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/Debuggable',
    'sap/ui/yesco/common/FileDataProvider',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
  ],
  (
    // prettier 방지용 주석
    Fragment,
    JSONModel,
    AppUtils,
    Debuggable,
    FileDataProvider,
    Client,
    ServiceNames
  ) => {
    'use strict';

    return Debuggable.extend('sap.ui.yesco.mvc.controller.talentDev.employeeView.MobileTalentDevPopoverHandler', {
      constructor: function (oController) {
        this.oController = oController;
        this.oPopover = null;
        this.oPopoverModel = new JSONModel(this.getInitialData());
      },

      getInitialData() {
        return {
          busy: true,
          header: null,
          detail: null,
        };
      },

      async openDialog(mHeaderData, { Pernr, Gjahr, Mdate, Zseqnr }) {
        const oView = this.oController.getView();

        this.setBusy();

        if (!this.oPopover) {
          this.oPopover = await Fragment.load({
            id: oView.getId(),
            name: 'sap.ui.yesco.mvc.view.talentDev.employeeView.MobileTalentDevPopover',
            controller: this,
          });

          this.oPopover //
            .setModel(this.oPopoverModel)
            .attachAfterClose(() => {
              setTimeout(() => {
                this.oPopoverModel.setProperty('/header', null);
                this.oPopoverModel.setProperty('/detail', null);
              });
            });

          oView.addDependent(this.oPopover);
        }

        setTimeout(async () => {
          const oModel = this.oController.getModel(ServiceNames.TALENT);
          const mFilters = { Pernr, Gjahr, Mdate: moment(Mdate).hour(9).toDate(), Zseqnr };
          const aTalentDevData = await Client.getEntitySet(oModel, 'TalentDevDetail', mFilters);

          this.oPopoverModel.setProperty('/header', mHeaderData);
          this.oPopoverModel.setProperty('/detail', aTalentDevData[0]);

          this.setBusy(false);
        });

        this.oPopover.openBy(AppUtils.getMobileHomeButton());
      },

      async onPressFileDownload(oEvent) {
        const mFile = await FileDataProvider.readData(oEvent.getSource().data('appno'), 9050);
        this.oController.AttachFileAction.openFileLink(mFile.Fileuri);
      },

      onPressDialogClose() {
        this.oPopover.close();
      },

      setBusy(bBusy = true) {
        setTimeout(() => {
          this.oPopoverModel.setProperty('/busy', bBusy);
        });
        return this;
      },
    });
  }
);
