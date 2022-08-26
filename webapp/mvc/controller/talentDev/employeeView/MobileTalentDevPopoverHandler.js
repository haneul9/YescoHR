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

      async openPopover(mHeaderData, { Pernr, Gjahr, Mdate, Zseqnr }) {
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
          const [mTalentDevData = {}] = await Client.getEntitySet(oModel, 'TalentDevDetail', mFilters);

          this.oPopoverModel.setProperty('/header', mHeaderData);
          this.oPopoverModel.setProperty('/detail', mTalentDevData);

          this.retrieveFileData(mTalentDevData);

          this.setBusy(false);
        });

        this.oPopover.openBy(AppUtils.getMobileHomeButton());
      },

      retrieveFileData({ Appno1, Appno2 }) {
        if (Number(Appno1) > 0) {
          setTimeout(async () => {
            const { Fileuri, Zfilename } = await FileDataProvider.readData(Appno1, 9050);
            this.oPopoverModel.setProperty('/detail/File1', Fileuri.replace(/\d+\?/, `${Zfilename}?`));
          });
        }
        if (Number(Appno2) > 0) {
          setTimeout(async () => {
            const { Fileuri, Zfilename } = await FileDataProvider.readData(Appno2, 9050);
            this.oPopoverModel.setProperty('/detail/File2', Fileuri.replace(/\d+\?/, `${Zfilename}?`));
          });
        }
      },

      onPressPopoverClose() {
        this.oPopover.close();
      },

      setBusy(bBusy = true) {
        setTimeout(() => this.oPopoverModel.setProperty('/busy', bBusy));
        return this;
      },
    });
  }
);
