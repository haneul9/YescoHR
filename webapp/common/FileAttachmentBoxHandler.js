sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/base/Object',
    'sap/ui/core/Fragment',
    'sap/ui/model/json/JSONModel',
    'sap/ui/model/odata/ODataModel',
    'sap/ui/table/SelectionMode',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/FileDataProvider',
    'sap/ui/yesco/common/odata/ServiceManager',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/control/MessageBox',
  ],
  (
    // prettier 방지용 주석
    BaseObject,
    Fragment,
    JSONModel,
    ODataModel,
    SelectionMode,
    AppUtils,
    FileDataProvider,
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
      /**
       * @override
       * @returns {sap.ui.base.Object}
       */
      constructor: function (oController, opt) {
        const options = {
          fragmentId: '',
          title: oController.getBundleText('LABEL_00248'), // 첨부파일
          description: '',
          enableDescriptionPopover: AppUtils.isMobile(),
          appno: '',
          apptp: '',
          gubun: false,
          visible: false,
          editable: false,
          fullFiles: false,
          maxFileCount: 3,
          maxFileSize: 10,
          fileTypes: ['ppt', 'pptx', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'bmp', 'gif', 'png', 'txt', 'pdf'],
          ...opt,
        };

        const sFragmentId = options.fragmentId ? `${options.fragmentId}--` : '';
        const sBoxId = `${sFragmentId}fileAttachmentBox`;

        this.oController = oController;
        this.oFileAttachmentBox = oController.byId(sBoxId);
        this.oFileUploader = oController.byId(`${sFragmentId}fileUploader`);
        this.oFilesTable = oController.byId(`${sFragmentId}filesTable`);

        const oBoxModel = new JSONModel({
          settings: options,
          files: null,
          fileCount: 1,
          fileSelectionMode: options.editable ? SelectionMode.MultiToggle : SelectionMode.None,
          deleteTargetFiles: [],
        });
        this.oFileAttachmentBox.setModel(oBoxModel);

        this.readFileList();
      },

      setVisible(bVisible) {
        this.oFileAttachmentBox.getModel().setProperty('/settings/visible', bVisible);
        if (!bVisible) {
          this.clearFileList();
        }
        return this;
      },

      setEditable(bEditable) {
        this.oFileAttachmentBox.getModel().setProperty('/settings/editable', bEditable);
        this.oFileAttachmentBox.getModel().setProperty('/fileSelectionMode', bEditable ? SelectionMode.MultiToggle : SelectionMode.None);
        return this;
      },

      setTitle(...aArgs) {
        const sTitle = /^LABEL_/.test(aArgs[0]) ? this.oController.getBundleText(...aArgs) : aArgs[0];
        this.oFileAttachmentBox.getModel().setProperty('/settings/title', sTitle);
        return this;
      },

      setDescription(...aArgs) {
        const sDescription = /^LABEL_/.test(aArgs[0]) ? this.oController.getBundleText(...aArgs) : aArgs[0];
        this.oFileAttachmentBox.getModel().setProperty('/settings/description', sDescription);
        return this;
      },

      /**
       * 첨부 파일 목록 조회
       */
      async readFileList() {
        try {
          this.oFileAttachmentBox.setBusy(true);
          this.oFileUploader.clear();
          this.oFileUploader.setValue('');

          const oBoxModel = this.oFileAttachmentBox.getModel();
          const mSettings = oBoxModel.getProperty('/settings');

          const aFiles = await FileDataProvider.readListData(mSettings.appno, mSettings.apptp);
          const iFileCount = aFiles.length;

          oBoxModel.setProperty('/files', aFiles);
          oBoxModel.setProperty('/fileCount', iFileCount);
          oBoxModel.setProperty('/settings/fullFiles', iFileCount >= mSettings.maxFileCount);
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          this.oFileAttachmentBox.setBusy(false);
        }
      },

      /**
       * 첨부 파일 목록 비우기 : 재작성
       */
      clearFileList() {
        try {
          this.oFileAttachmentBox.setBusy(true);
          this.oFileUploader.clear();
          this.oFileUploader.setValue('');

          const oBoxModel = this.oFileAttachmentBox.getModel();
          oBoxModel.setProperty('/files', []);
          oBoxModel.setProperty('/fileCount', 0);
          oBoxModel.setProperty('/settings/fullFiles', false);

          return this;
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          this.oFileAttachmentBox.setBusy(false);
        }
      },

      async onPressAttachmentDescription(oEvent) {
        if (this.oMobileAttachmentDescriptionPopover && this.oMobileAttachmentDescriptionPopover.isOpen()) {
          this.oMobileAttachmentDescriptionPopover.close();
        } else {
          const oButton = oEvent.getSource();

          if (!this.oMobileAttachmentDescriptionPopover) {
            this.oMobileAttachmentDescriptionPopover = await Fragment.load({
              name: 'sap.ui.yesco.fragment.mobile.DescriptionPopover',
              controller: this,
            });
            this.oMobileAttachmentDescriptionPopover.setModel(this.oFileAttachmentBox.getModel()).bindElement('/settings');
          }

          this.oMobileAttachmentDescriptionPopover.openBy(oButton);
        }
      },

      /**
       * 첨부 파일 선택 event handler
       */
      onChangeAttachment(oEvent) {
        const oFileUploader = oEvent.getSource();
        const mSelectedFiles = oEvent.getParameter('files'); // FileList object(Array가 아님)
        const iSelectedFilesLength = mSelectedFiles.length;
        if (!iSelectedFilesLength) {
          return;
        }

        const oBoxModel = this.oFileAttachmentBox.getModel();
        const iMaxFileCount = oBoxModel.getProperty('/settings/maxFileCount');
        const aPrevFiles = oBoxModel.getProperty('/files');
        const iPrevFilesLength = aPrevFiles.length;
        const iNonDeletedPrevFilesLength = aPrevFiles.filter((mFile) => !mFile.Deleted).length;

        if (iNonDeletedPrevFilesLength + iSelectedFilesLength > iMaxFileCount) {
          MessageBox.alert(AppUtils.getBundleText('MSG_00014', iMaxFileCount)); // 첨부 파일은 최대 {0}개까지 등록 가능합니다.
          return;
        }

        const iMaxSeqnr = iPrevFilesLength === 0 ? 0 : iPrevFilesLength === 1 ? aPrevFiles[0].Seqnr : aPrevFiles.concat([]).sort((mFile1, mFile2) => mFile2.Seqnr - mFile1.Seqnr)[0].Seqnr;
        Object.values(mSelectedFiles).forEach((file, i) => {
          file.New = true;
          file.Deleted = false;
          file.Zfilename = file.name;
          file.Type = file.type;
          file.Zbinkey = String(parseInt(Math.random() * 100000000000000));
          file.Seqnr = iMaxSeqnr + i + 1;

          aPrevFiles.push(file);
        });

        const iTotalFilesLength = aPrevFiles.filter((mFile) => !mFile.Deleted).length;
        oBoxModel.setProperty('/files', aPrevFiles);
        oBoxModel.setProperty('/fileCount', aPrevFiles.length);
        oBoxModel.setProperty('/settings/fullFiles', iTotalFilesLength >= iMaxFileCount);

        this.oFilesTable.clearSelection();

        oFileUploader.clear();
        oFileUploader.setValue('');
      },

      /**
       * 첨부 파일 업로드 완료 event handler
       */
      onUploadCompleteAttachment(oEvent) {
        const sResponse = oEvent.getParameter('response');

        MessageBox.alert(sResponse);
      },

      onTypeMissMatchAttachment(oEvent) {
        const sFileName = oEvent.getParameter('fileName');
        const sFileType = oEvent.getParameter('fileType');

        MessageBox.alert(AppUtils.getBundleText('MSG_00012', sFileName, sFileType));
      },

      /**
       * 첨부 파일 삭제 버튼 click event handler
       */
      onPressAttachmentRemove() {
        this.toggleDeleted(true, 'MSG_00018'); // 삭제할 파일을 선택하세요.
      },

      /**
       * 첨부 파일 삭제 취소 버튼 click event handler
       */
      onPressAttachmentRemoveCancel() {
        this.toggleDeleted(false, 'MSG_00051'); // 삭제 취소할 파일을 선택하세요.
      },

      toggleDeleted(bDeleted, sMessageCode) {
        const aSelectedIndices = this.oFilesTable.getSelectedIndices();
        if (!aSelectedIndices.length) {
          MessageBox.alert(AppUtils.getBundleText(sMessageCode));
          return;
        }

        const oBoxModel = this.oFileAttachmentBox.getModel();
        const iMaxFileCount = oBoxModel.getProperty('/settings/maxFileCount');
        let aFiles = oBoxModel.getProperty('/files');

        // 신규 첨부 파일은 목록에서 즉시 삭제
        aFiles = aFiles.filter((mFile, i) => !aSelectedIndices.includes(i) || !mFile.New);

        aFiles
          .filter((mFile, i) => aSelectedIndices.includes(i))
          .forEach((mFile) => {
            mFile.Deleted = bDeleted;
          });

        const iTotalFilesLength = aFiles.filter((mFile) => !mFile.Deleted).length;
        oBoxModel.setProperty('/files', aFiles);
        oBoxModel.setProperty('/fileCount', aFiles.length); // 삭제선이 들어간 파일도 보이도록 함
        oBoxModel.setProperty('/settings/fullFiles', iTotalFilesLength >= iMaxFileCount); // 삭제선이 들어간 파일은 추가 버튼을 숨기지 않도록 함

        this.oFilesTable.clearSelection();
      },

      /**
       * 첨부파일 개수
       */
      getFileCount() {
        return this.oFileAttachmentBox.getModel().getProperty('/fileCount');
      },

      /**
       * 첨부파일 Upload
       */
      async upload(sAppno) {
        return new Promise(async (resolve, reject) => {
          const oBoxModel = this.oFileAttachmentBox.getModel();
          let aFiles = oBoxModel.getProperty('/files') || [];

          // 파일 삭제
          try {
            const oRemoveModel = AppUtils.getAppComponent().getModel(ServiceNames.COMMON);

            await Promise.all(
              aFiles
                .filter((mFile) => mFile.Deleted)
                .map((mFile) => {
                  return this.removeFile(oRemoveModel, mFile);
                })
            );
          } catch (oError) {
            AppUtils.debug('FileAttachmentBoxHandler > upload > removeFile Error', oError);

            reject(oError);
          }

          // 업로드 완료된 파일만 있는 경우 업로드 동작 불필요
          aFiles = aFiles.filter((mFile) => mFile.New);

          if (!aFiles.length) {
            oBoxModel.setProperty('/settings/appno', sAppno);
            this.readFileList();
            resolve();
          }

          const sServiceUrl = ServiceManager.getServiceUrl('ZHR_COMMON_SRV');
          const oUploadModel = new ODataModel(sServiceUrl, { json: true, loadMetadataAsync: true, refreshAfterChange: false });
          const sUploadUrl = `${sServiceUrl}/FileUploadSet/`;
          const sApptp = oBoxModel.getProperty('/settings/apptp');

          // 파일 업로드
          try {
            while (aFiles.length) {
              const oError = await this.uploadFile({ sAppno, sApptp, oUploadModel, sUploadUrl, mFile: aFiles.shift() });
              if (oError && oError.code === 'E') {
                reject(oError);
              }
            }

            // New flag 제거
            aFiles = oBoxModel.getProperty('/files');
            aFiles.forEach((mFile) => {
              if (mFile.New) {
                mFile.New = false;
                mFile.Uploaded = true;
              }
            });
            oBoxModel.setProperty('/files', aFiles);

            oBoxModel.setProperty('/settings/appno', sAppno);
            this.readFileList();

            resolve();
          } catch (oError) {
            AppUtils.debug('FileAttachmentBoxHandler > upload > uploadFile Error', oError);

            reject(oError);
          }
        });
      },

      async removeFile(oRemoveModel, { Appno, Zworktyp, Zfileseq = 999, Zfilename }) {
        return new Promise((resolve, reject) => {
          const sUrl = oRemoveModel.createKey('/FileListSet', { Appno, Zworktyp, Zfileseq });

          oRemoveModel.remove(sUrl, {
            success: resolve,
            error: (Error) => {
              const sMessage1 = AppUtils.getBundleText('MSG_00008', 'LABEL_00250'); // {파일삭제}중 오류가 발생하였습니다.
              const sMessage2 = AppUtils.getBundleText('MSG_00052', Zfilename); // 파일명 : {0}

              reject({ code: 'E', message: `${sMessage1}\n\n${sMessage2}`, data: { Appno, Zworktyp, Zfileseq, Zfilename, Error } });
            },
          });
        });
      },

      async uploadFile({ sAppno, sApptp, oUploadModel, sUploadUrl, mFile }) {
        return new Promise((resolve, reject) => {
          const mHeaders = {
            'x-csrf-token': this.getCsrfToken(oUploadModel),
            slug: [sAppno, sApptp, encodeURI(mFile.Zfilename)].join('|'),
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

              const sMessage1 = AppUtils.getBundleText('MSG_00041'); // 파일 업로드를 실패하였습니다.
              const sMessage2 = AppUtils.getBundleText('MSG_00052', mFile.Zfilename); // 파일명 : {0}

              reject({ code: 'E', message: `${sMessage1}\n\n${sMessage2}` });
            },
          });
        });
      },

      getCsrfToken(oUploadModel) {
        oUploadModel.refreshSecurityToken();

        return oUploadModel._createRequest().headers['x-csrf-token'];
      },
    });
  }
);
