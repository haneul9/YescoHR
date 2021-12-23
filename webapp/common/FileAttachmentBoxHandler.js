sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/base/Object',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/model/json/JSONModel',
    'sap/ui/model/odata/ODataModel',
    'sap/ui/table/SelectionMode',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/ServiceManager',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/control/MessageBox',
  ],
  (
    // prettier 방지용 주석
    BaseObject,
    Filter,
    FilterOperator,
    JSONModel,
    ODataModel,
    SelectionMode,
    AppUtils,
    ServiceManager,
    ServiceNames,
    MessageBox
  ) => {
    'use strict';

    return BaseObject.extend('sap.ui.yesco.common.FileAttachmentBoxHandler', {
      oController: null,
      oFileAttachmentBox: null,
      oFileUploader: null,
      oFilesTable: null,

      /**
       * 파일첨부 panel 및 FileUploader Control의 표시여부 등을 설정
       * 문서상태 및 첨부파일 여부에 따라 Control의 표시여부를 결정한다.
       */
      constructor: async function (oController, opt) {
        const options = $.extend(
          true,
          {
            busy: true,
            boxWrapperId: '',
            appno: '',
            apptp: '',
            mode: 'S', // S: single file, M: multi file
            message: '',
            fileSelectionMode: null,
            fileTypes: [],
            gubun: false,
            visible: true,
            editable: false,
            maxFileCount: 3,
            maxFileSize: 10,
          },
          opt
        );

        options.fileSelectionMode = options.editable ? SelectionMode.MultiToggle : SelectionMode.None;
        options.fileTypes ||= ['ppt', 'pptx', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'bmp', 'gif', 'png', 'txt', 'pdf'];

        const sBoxWrapperId = options.boxWrapperId ? `${options.boxWrapperId}--` : '';
        const sBoxId = `${sBoxWrapperId}fileAttachmentBox`;

        this.oController = oController;
        this.oFileAttachmentBox = oController.byId(sBoxId);
        this.oFileUploader = oController.byId(`${sBoxWrapperId}fileUploader`);
        this.oFilesTable = oController.byId(`${sBoxWrapperId}filesTable`);

        const oBoxModel = new JSONModel({
          settings: options,
          files: null,
          deleteTargetFiles: [],
        });
        this.oFileAttachmentBox.setModel(oBoxModel);

        try {
          const aFiles = await this.readFiles();

          oBoxModel.setProperty('/files', aFiles);
          oBoxModel.setProperty('/fileCount', aFiles.length);
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          this.oFileAttachmentBox.setBusy(false);
        }
      },

      /**
       * 첨부 파일 목록 조회
       */
      readFiles() {
        return new Promise((resolve, reject) => {
          const oBoxModel = this.oFileAttachmentBox.getModel();
          const mSettings = oBoxModel.getProperty('/settings/');
          const oServiceModel = this.oController.getModel(ServiceNames.COMMON);
          const sUrl = '/FileListSet';

          this.oFileUploader.clear();
          this.oFileUploader.setValue('');

          oServiceModel.read(sUrl, {
            filters: [
              new Filter('Appno', FilterOperator.EQ, mSettings.appno), //
              new Filter('Zworktyp', FilterOperator.EQ, mSettings.apptp),
            ],
            success: (mData) => {
              const aFiles = (mData || {}).results || [];
              if (aFiles.length) {
                aFiles.forEach((file) => {
                  file.New = false;
                  file.Deleted = false;
                });
              }

              resolve(aFiles);
            },
            error: (oError) => {
              AppUtils.debug(`${sUrl} error.`, oError);

              reject({ code: 'E', message: AppUtils.getBundleText('MSG_00045') }); // 파일을 조회할 수 없습니다.
            },
          });
        });
      },

      /**
       * 첨부 파일 업로드 완료 event handler
       */
      onAttachmentUploadComplete(oEvent) {
        const sResponse = oEvent.getParameter('response');

        MessageBox.alert(sResponse);
      },

      /**
       * 첨부 파일 선택 event handler
       */
      onAttachmentChange(oEvent) {
        const oFileUploader = oEvent.getSource();
        const mSelectedFiles = oEvent.getParameter('files'); // FileList object(Array가 아님)
        const iSelectedFilesLength = mSelectedFiles.length;
        const oBoxModel = this.oFileAttachmentBox.getModel();
        const iMaxFileCount = oBoxModel.getProperty('/settings/maxFileCount');
        const aPrevFiles = oBoxModel.getProperty('/files');
        const iPrevFilesLength = aPrevFiles.length;

        oFileUploader.clear();
        oFileUploader.setValue('');

        if (iSelectedFilesLength) {
          const iTotalFilesLength = iPrevFilesLength + iSelectedFilesLength;

          if (iTotalFilesLength > iMaxFileCount) {
            MessageBox.alert(this.getBundleText('MSG_00014', iMaxFileCount));
            return;
          }

          Object.values(mSelectedFiles).forEach((file, i) => {
            file.New = true;
            file.Deleted = false;
            file.Zfilename = file.name;
            file.Type = file.type;
            file.Zbinkey = String(parseInt(Math.random() * 100000000000000));
            file.Seqnr = iPrevFilesLength + i + 1;

            aPrevFiles.push(file);
          });

          oBoxModel.setProperty('/settings/fileCount', iTotalFilesLength);
          oBoxModel.setProperty('/files', aPrevFiles);

          this.oFilesTable.clearSelection();
          this.oFilesTable.setVisibleRowCount(iTotalFilesLength);
        }
      },

      /**
       * 첨부 파일 삭제 버튼 click event handler
       */
      onAttachmentRemove() {
        this.toggleDeleted(true);
      },

      /**
       * 첨부 파일 삭제 취소 버튼 click event handler
       */
      onAttachmentRemoveCancel() {
        this.toggleDeleted(false);
      },

      toggleDeleted(bDeleted) {
        const aSelectedIndices = this.oFilesTable.getSelectedIndices();
        if (!aSelectedIndices.length) {
          MessageBox.alert(AppUtils.getBundleText('MSG_00051')); // 삭제 취소할 파일을 선택하세요.
          return;
        }

        const oBoxModel = this.oFileAttachmentBox.getModel();
        const aFiles = oBoxModel.getProperty('/files');

        aFiles
          .filter((mFile, i) => aSelectedIndices.includes(i))
          .forEach((mFile) => {
            mFile.Deleted = bDeleted;
          });

        oBoxModel.setProperty('/files', aFiles);

        this.oFilesTable.clearSelection();
      },

      openFileLink(sUrl) {
        if (_.isEmpty(sUrl)) {
          return;
        }

        window.open(sUrl, '_blank');
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
              const aFiles = (mData || {}).results || [];
              aFiles.forEach((mFile) => {
                mFile.New = false;
                mFile.Deleted = false;
              });

              resolve(aFiles);
            },
            error: (oError) => {
              AppUtils.debug(`${sUrl} error.`, oError);

              reject({ code: 'E', message: AppUtils.getBundleText('MSG_00045') }); // 파일을 조회할 수 없습니다.
            },
          });
        });
      },

      /**
       * 첨부파일 개수
       */
      getFileCount() {
        return this.oFileAttachmentBox.getModel().getProperty('/settings/fileCount');
      },

      /**
       * 첨부파일 Upload
       */
      async upload(sAppno, sType) {
        return new Promise(async (resolve, reject) => {
          const oBoxModel = this.oFileAttachmentBox.getModel();
          let aFiles = oBoxModel.getProperty('/files') || [];

          // 파일 삭제
          try {
            await Promise.all(aFiles.filter((mFile) => mFile.Deleted).map(this.deleteFile));
          } catch (oError) {
            AppUtils.debug('FileAttachmentBoxHandler > upload > deleteFile Error', oError);

            reject(oError);
          }

          // 업로드 완료된 파일만 있는 경우 업로드 동작 불필요
          aFiles = aFiles.filter((mFile) => mFile.New);

          if (!aFiles.length) {
            resolve();
          }

          const sServiceUrl = ServiceManager.getServiceUrl('ZHR_COMMON_SRV', AppUtils.getAppComponent());
          const oServiceModel = new ODataModel(sServiceUrl, { json: true, loadMetadataAsync: true, refreshAfterChange: false });
          const sUploadUrl = `${sServiceUrl}/FileUploadSet/`;

          // 파일 업로드
          try {
            while (aFiles.length) {
              await this.uploadFile({ sAppno, sType, oServiceModel, sUploadUrl, mFile: aFiles.shift() });
            }
          } catch (oError) {
            AppUtils.debug('FileAttachmentBoxHandler > upload > uploadFile Error', oError);

            reject(oError);
          }
        });
      },

      async uploadFile({ sAppno, sType, mFile, oServiceModel, sUploadUrl }) {
        return new Promise((resolve, reject) => {
          const mHeaders = {
            'x-csrf-token': this.getCsrfToken(oServiceModel),
            slug: [sAppno, sType, encodeURI(mFile.Zfilename)].join('|'),
          };

          $.ajax({
            url: sUploadUrl,
            type: 'POST',
            async: false,
            cache: false,
            processData: false,
            contentType: mFile.type,
            headers: mHeaders,
            data: mFile,
            success: (mData) => {
              AppUtils.debug(`${sUploadUrl} success.`, mData);

              resolve();
            },
            error: (oError) => {
              AppUtils.debug(`${sUploadUrl} error.`, oError);

              const sMessage1 = AppUtils.getBundleText('MSG_00041'); // 파일 업로드에 실패하였습니다.
              const sMessage2 = AppUtils.getBundleText('MSG_00052', mFile.Zfilename); // 파일명 : {0}

              reject({ code: 'E', message: `${sMessage1}\n\n${sMessage2}` });
            },
          });
        });
      },

      getCsrfToken(oServiceModel) {
        oServiceModel.refreshSecurityToken();

        return oServiceModel._createRequest().headers['x-csrf-token'];
      },

      async deleteFile({ Appno, Zworktyp, Zfileseq = '999', Zfilename }) {
        return new Promise((resolve, reject) => {
          const oServiceModel = AppUtils.getAppComponent().getModel(ServiceNames.COMMON);
          const sUrl = oServiceModel.createKey('/FileListSet', { Appno, Zworktyp, Zfileseq });

          oServiceModel.remove(sUrl, {
            success: resolve,
            error: (Error) => {
              const sMessage1 = AppUtils.getBundleText('MSG_00008', 'LABEL_00250'); // {파일삭제}중 오류가 발생하였습니다.
              const sMessage2 = AppUtils.getBundleText('MSG_00052', Zfilename); // 파일명 : {0}

              reject({ code: 'E', message: `${sMessage1}\n\n${sMessage2}`, data: { Appno, Zworktyp, Zfileseq, Zfilename, Error } });
            },
          });
        });
      },

      /**
       * 첨부 파일 목록 dialog open
       * @param {sap.ui.base.Event} oEvent
       */
      async openFileListDialog(oEvent) {
        const oContext = oEvent.getSource().getBindingContext();
        const sPath = oContext.getPath();
        const sAppno = oContext.getModel().getProperty(`${sPath}/Appno`);

        if (!this.oFileListDialog) {
          this.oFileListDialog = await Fragment.load({
            name: 'sap.ui.yesco.fragment.FileListDialog',
            controller: this,
          });

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
        this.oFileListDialog.getModel().setProperty('/apptp', this.oController.getApprovalType());
        this.oFileListDialog.open();
      },

      /**
       * 첨부 파일 목록 dialog 데이터 조회
       */
      async readDialogData() {
        const oModel = this.oFileListDialog.getModel();
        const aFiles = await this.readFileList(oModel.getProperty('/appno'), oModel.getProperty('/apptp'));

        oModel.setProperty('/files', aFiles);
        oModel.setProperty('/fileCount', aFiles.length);
        oModel.setProperty('/busy', false);
      },

      onPressFileListDialogClose() {
        this.oFileListDialog.close();
      },
    });
  }
);
