sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/base/Object',
    'sap/ui/core/Fragment',
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/FileDataProvider',
  ],
  (
    // prettier 방지용 주석
    BaseObject,
    Fragment,
    JSONModel,
    FileDataProvider
  ) => {
    'use strict';

    return BaseObject.extend('sap.ui.yesco.common.FileListDialogHandler', {
      oController: null,
      oFileListDialog: null,

      constructor: function (oController) {
        this.oController = oController;
      },

      /**
       * 첨부 파일 목록 dialog open
       * @param {sap.ui.base.Event} oEvent
       */
      async openDialog(oEvent) {
        const sAppno = oEvent.getSource().getBindingContext().getProperty('Appno');
        const sApptp = this.oController.getApprovalType();

        if (!this.oFileListDialog) {
          this.oFileListDialog = await Fragment.load({
            name: 'sap.ui.yesco.fragment.FileListDialog',
            controller: this,
          });

          this.oController.getView().addDependent(this.oFileListDialog);

          this.oFileListDialog
            .setModel(new JSONModel(this.getInitData()))
            .attachBeforeOpen(() => {
              this.readDialogData();
            })
            .attachAfterClose(() => {
              this.oFileListDialog.setContentHeight('45px').getModel().setData(this.getInitData());
            });
        }

        const oModel = this.oFileListDialog.getModel();
        oModel.setProperty('/appno', sAppno);
        oModel.setProperty('/apptp', sApptp);

        this.oFileListDialog.open();
      },

      getInitData() {
        return {
          busy: true,
          appno: null,
          apptp: null,
          files: null,
          fileCount: 1,
        };
      },

      /**
       * 첨부 파일 목록 dialog 데이터 조회
       */
      async readDialogData() {
        const oModel = this.oFileListDialog.getModel();

        const aFiles = await FileDataProvider.readListData(oModel.getProperty('/appno'), oModel.getProperty('/apptp'));
        const iFileCount = aFiles.length;

        oModel.setProperty('/files', aFiles);
        oModel.setProperty('/fileCount', iFileCount);

        this.oFileListDialog.setContentHeight(`${iFileCount * 45 + 1}px`);

        oModel.setProperty('/busy', false);
      },

      onPressFileListDialogClose() {
        this.oFileListDialog.close();
      },
    });
  }
);
