sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/base/Object',
    'sap/ui/core/Fragment',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/ServiceNames',
  ],
  (
    // prettier 방지용 주석
    BaseObject,
    Fragment,
    Filter,
    FilterOperator,
    JSONModel,
    AppUtils,
    ServiceNames
  ) => {
    'use strict';

    return BaseObject.extend('sap.ui.yesco.common.FileListDialogHandler', {
      oController: null,
      oFileListDialog: null,

      constructor: function (oController) {
        this.oController = oController;
      },

      readFileList(sAppno, sApptp) {
        return new Promise((resolve, reject) => {
          const oServiceModel = this.oController.getModel(ServiceNames.COMMON);
          const sUrl = '/FileListSet';

          oServiceModel.read(sUrl, {
            filters: [
              new Filter('Appno', FilterOperator.EQ, sAppno), // prettier 방지용 주석
              new Filter('Zworktyp', FilterOperator.EQ, sApptp),
            ],
            success: (mData) => {
              resolve((mData || {}).results || []);
            },
            error: (oError) => {
              AppUtils.debug(`${sUrl} error.`, oError);

              reject({ code: 'E', message: AppUtils.getBundleText('MSG_00045') }); // 파일을 조회할 수 없습니다.
            },
          });
        });
      },

      /**
       * 첨부 파일 목록 dialog open
       * @param {sap.ui.base.Event} oEvent
       */
      async openDialog(oEvent) {
        const oContext = oEvent.getSource().getBindingContext();
        const sPath = oContext.getPath();
        const sAppno = oContext.getModel().getProperty(`${sPath}/Appno`);
        const sApptp = this.oController.getApprovalType();

        if (!this.oFileListDialog) {
          this.oFileListDialog = await Fragment.load({
            name: 'sap.ui.yesco.fragment.FileListDialog',
            controller: this,
          });

          this.oController.getView().addDependent(this.oFileListDialog);

          this.oFileListDialog
            .addStyleClass(AppUtils.getAppComponent().getContentDensityClass())
            .setModel(
              new JSONModel({
                busy: true,
                appno: null,
                apptp: null,
                files: null,
                fileCount: 1,
              })
            )
            .attachBeforeOpen(() => {
              this.readDialogData();
            });
        }

        this.oFileListDialog.getModel().setProperty('/appno', sAppno);
        this.oFileListDialog.getModel().setProperty('/apptp', sApptp);
        this.oFileListDialog.open();
      },

      /**
       * 첨부 파일 목록 dialog 데이터 조회
       */
      async readDialogData() {
        const oModel = this.oFileListDialog.getModel();
        const aFiles = await this.readFileList(oModel.getProperty('/appno'), oModel.getProperty('/apptp'));
        const iFileCount = aFiles.length;

        oModel.setProperty('/files', aFiles);
        oModel.setProperty('/fileCount', iFileCount);
        oModel.setProperty('/busy', false);

        this.oFileListDialog.setContentHeight(`${iFileCount * 45 + 1}px`);
      },

      onPressFileListDialogClose() {
        this.oFileListDialog.close();
      },
    });
  }
);
