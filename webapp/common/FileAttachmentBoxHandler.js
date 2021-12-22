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

      /*
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
            mode: 'S', // S: single file, M: multi file
            fileSelectionMode: null,
            message: '',
            docType: '',
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

      /*
       * 첨부파일 리스트를 Binding한다.
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
              new Filter('Zworktyp', FilterOperator.EQ, mSettings.docType),
            ],
            success: (mData) => {
              const aFiles = (mData || {}).results || [];
              if (aFiles.length) {
                aFiles.forEach((file) => {
                  file.New = false;
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

      /*
       * 첨부파일의 Upload가 완료되었을때 처리 내역
       * refreshAttachFileList Function을 호출한다.
       */
      onAttachmentUploadComplete(oEvent) {
        const sResponse = oEvent.getParameter('response');

        MessageBox.alert(sResponse);
      },

      /*
       * Upload할 첨부파일을 선택했을 경우 처리 내역
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

      /*
       * 첨부된 파일을 삭제처리
       */
      onAttachmentRemove() {
        this.toggleDeleted(true);
      },

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
        if (_.isEmpty(sUrl)) return;
        window.open(sUrl, '_blank');
      },

      readFileList(sAppno, sWorkType) {
        return new Promise((resolve, reject) => {
          const oServiceModel = this.oController.getModel(ServiceNames.COMMON);
          const sUrl = '/FileListSet';

          oServiceModel.read(sUrl, {
            filters: [
              new Filter('Appno', FilterOperator.EQ, sAppno), // prettier 방지용 주석
              new Filter('Zworktyp', FilterOperator.EQ, sWorkType),
            ],
            success: (mData) => {
              const aFiles = (mData || {}).results || [];
              aFiles.forEach((mFile) => {
                mFile.New = false;
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

      /*
       * 조회화면 list에있는 증빙클릭시 첨부파일리스트 호출
       */
      setTableFileList(oController, oTableRowData = {}) {
        const oListFileTable = oController.byId('listFileTable');
        const oModel = oController.getModel(ServiceNames.COMMON);
        const JSonModel = oController.getViewModel();
        const Datas = { Data: [] };

        oModel.read('/FileListSet', {
          filters: [
            new Filter('Appno', FilterOperator.EQ, oTableRowData.Appno), // prettier 방지용 주석
            new Filter('Zworktyp', FilterOperator.EQ, oController.TYPE_CODE),
          ],
          success: (data) => {
            if (data && data.results.length) {
              data.results.forEach((elem) => {
                elem.New = false;
                Datas.Data.push(elem);
              });
            }

            JSonModel.setProperty('/files', Datas.Data);
            oListFileTable.setVisibleRowCount(Datas.Data.length);
          },
          error: (res) => {
            this.debug(`${sUrl} error.`, res);
          },
        });
      },

      /*
       * 첨부파일 개수
       */
      getFileLength() {
        return this.oFileAttachmentBox.getModel().getProperty('/settings/fileCount');
      },

      /*
       * 첨부파일 Upload
       */
      async upload(Appno, Type) {
        return new Promise(async (resolve, reject) => {
          const oBoxModel = this.oFileAttachmentBox.getModel();
          const aFiles = oBoxModel.getProperty('/files') || [];

          // 파일 삭제
          try {
            await Promise.all(
              aFiles
                .filter((mFile) => mFile.Deleted)
                .map((mFile) => {
                  this.deleteFile(mFile.Appno, mFile.Zworktyp, mFile.Zfileseq);
                })
            );
          } catch (oError) {
            AppUtils.debug('FileAttachmentBoxHandler > uploadFile Error', oError);

            throw oError;
          }

          // 업로드 완료된 파일만 있는 경우 업로드 동작 불필요
          aFiles = aFiles.filter((mFile) => mFile.New);

          if (!aFiles.length) {
            resolve();
            return;
          }

          const sServiceUrl = ServiceManager.getServiceUrl('ZHR_COMMON_SRV', AppUtils.getAppComponent());
          const oServiceModel = new ODataModel(sServiceUrl, { json: true, loadMetadataAsync: true, refreshAfterChange: false });

          aFiles.forEach((mFile) => {
            oServiceModel.refreshSecurityToken();

            const oRequest = oServiceModel._createRequest();
            const oHeaders = {
              'x-csrf-token': oRequest.headers['x-csrf-token'],
              slug: [Appno, Type, encodeURI(mFile.Zfilename)].join('|'),
            };

            $.ajax({
              url: `${sServiceUrl}/FileUploadSet/`,
              type: 'POST',
              async: false,
              cache: false,
              processData: false,
              contentType: mFile.type,
              headers: oHeaders,
              data: mFile,
              success: (data) => {
                AppUtils.debug(`${AppUtils.getBundleText('MSG_00016')}, ${data}`); // 업로드가 완료되었습니다.
                resolve();
              },
              error: (oError) => {
                AppUtils.debug(`Error: ${oError}`);

                reject({ code: 'E', message: AppUtils.getBundleText('MSG_00041') }); // 파일 업로드에 실패하였습니다.
              },
              complete: () => {
                this.oFilesTable.clearSelection();
              },
            });
          });
        });
      },

      uploadFile() {},

      /**
       * @param  {} Appno
       * @param  {} Type
       */
      // upload(sAppno, sType, aFiles) {
      //   const sServiceUrl = ServiceManager.getServiceUrl('ZHR_COMMON_SRV', this.getOwnerComponent());
      //   const oModel = new sap.ui.model.odata.ODataModel(sServiceUrl, true, undefined, undefined, undefined, undefined, undefined, false);

      //   return new Promise((resolve) => {
      //     for (let i = 0; i < aFiles.length; i++) {
      //       oModel.refreshSecurityToken();

      //       const oFile = aFiles[i];
      //       const oRequest = oModel._createRequest();
      //       const oHeaders = {
      //         'x-csrf-token': oRequest.headers['x-csrf-token'],
      //         slug: [sAppno, sType, encodeURI(oFile.name)].join('|'),
      //       };

      //       jQuery.ajax({
      //         type: 'POST',
      //         async: false,
      //         url: `${sServiceUrl}/FileUploadSet/`,
      //         headers: oHeaders,
      //         cache: false,
      //         contentType: oFile.type,
      //         processData: false,
      //         data: oFile,
      //         success: (data) => {
      //           this.debug(`${this.getBundleText('MSG_00016')}, ${data}`);
      //           resolve();
      //         },
      //         error: (oError) => {
      //           this.debug(`Error: ${oError}`);

      //           // 파일 업로드에 실패하였습니다.
      //           reject({ code: 'E', message: this.getBundleText('MSG_00041') });
      //         },
      //       });
      //     }
      //   });
      // },

      async deleteFile(sAppno, sZworktyp, sZfileseq = '999') {
        return new Promise((resolve, reject) => {
          const oServiceModel = AppUtils.getAppComponent().getModel(ServiceNames.COMMON);
          const sUrl = oServiceModel.createKey('/FileListSet', { sAppno, sZworktyp, sZfileseq });

          oServiceModel.remove(sUrl, {
            success: resolve,
            error: (oError) => {
              reject({ code: 'E', message: AppUtils.getBundleText('MSG_00008', 'LABEL_00250'), data: { sAppno, sZworktyp, sZfileseq, oError } }); // {파일삭제}중 오류가 발생하였습니다.
            },
          });
        });
      },
    });
  }
);
