sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/Appno',
    'sap/ui/yesco/common/AttachFileAction',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceManager',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    //
    Fragment,
    MessageBox,
    Appno,
    AttachFileAction,
    ComboEntry,
    AppUtils,
    Client,
    ServiceManager,
    ServiceNames,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.referenceRoom.ReferenceRoom', {
      PDF_FILE_TYPE: 'INF1',

      AttachFileAction: AttachFileAction,
      initializeModel() {
        return {
          busy: false,
          Fixed: false,
          popover: true,
          UserFixed: false,
          Hass: this.isHass(),
          FormData: {},
          PDFFile: {},
          DeleteDatas: [],
          MenuIdList: [],
          ManagerList: [{ ManagerRowCount: 1 }],
          TreeFullList: [],
          ReferenceList: [],
          AccType: [],
        };
      },

      async onObjectMatched(mRouteArguments) {
        const oViewModel = this.getViewModel();

        oViewModel.setData(this.initializeModel());

        try {
          if (_.isEmpty(mRouteArguments)) {
            const aTree = await this.getReferenceRoom();
            const aVariat = this.oDataChangeTree(aTree.HelpInfo1Nav.results);

            oViewModel.setProperty('/FieldLimit', _.assignIn(this.getEntityLimit(ServiceNames.COMMON, 'HelpInfoTab2')));
            oViewModel.setProperty('/TreeFullList', aTree.HelpInfo1Nav.results);
            oViewModel.setProperty('/ReferenceList', aVariat);
          } else {
            const oDetail = await this.treeDetail(mRouteArguments.L1id, mRouteArguments.L2id, mRouteArguments.L3id, mRouteArguments.L4id, this.getAppointeeProperty('Werks'));
            const aFormData = oDetail.HelpInfo2Nav.results || [];

            const sHeadComment =
              _.find(aFormData, (e) => {
                return e.Infocd === '1';
              }) || '';
            const sMidComment =
              _.find(aFormData, (e) => {
                return e.Infocd === '2';
              }) || '';
            const sBotComment =
              _.find(aFormData, (e) => {
                return e.Infocd === '3';
              }) || '';
            const mDetailData = aFormData[0] || {};
            const oViewModel = this.getViewModel();

            oViewModel.setProperty('/popover', false);
            oViewModel.setProperty('/FormData', {
              ...mDetailData,
              title: '11',
              ChInfo: oDetail.ChInfo,
              HeadZcomment: sHeadComment.Zcomment,
              MidZcomment: sMidComment.Zcomment,
              BotZcomment: sBotComment.Zcomment,
            });
          }
        } catch (oError) {
          this.debug(oError);
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      // 메뉴 경로

      // tree정보 다받아옴
      async getReferenceRoom() {
        const oModel = this.getModel(ServiceNames.COMMON);
        const mAppointee = this.getAppointeeData();
        const mPayLoad = {
          Pernr: mAppointee.Pernr,
          Werks: mAppointee.Werks,
          Menid: this.getCurrentMenuId(),
          Prcty: 'T',
          HelpInfo1Nav: [],
          HelpInfo2Nav: [],
          HelpInfo3Nav: [],
          HelpInfo4Nav: [],
        };

        return await Client.deep(oModel, 'HelpInfo', mPayLoad);
      },

      // TreeSelect
      async onSelectTree(oEvent) {
        const oViewModel = this.getViewModel();
        const sPath = oEvent.getSource().getSelectedContexts()[0].getPath();
        const mSelectedTree = oViewModel.getProperty(sPath);

        if (oViewModel.getProperty('/Fixed') && oViewModel.getProperty('/UserFixed')) {
          // 현재 내용을 저장 하시겠습니까?
          MessageBox.confirm(this.getBundleText('MSG_29004'), {
            // 저장, 취소
            actions: [this.getBundleText('LABEL_00103'), this.getBundleText('LABEL_00118')],
            onClose: async (vPress) => {
              // 저장
              if (vPress === this.getBundleText('LABEL_00103')) {
                await this.saveForm();
              } else {
                const mFormData = oViewModel.getProperty('/FormData');

                await this.checkForm('N', mFormData.L1id, mFormData.L2id, mFormData.L3id, mFormData.L4id, mFormData.Werks);
              }

              this.dataSetting(mSelectedTree);
            },
          });
        } else {
          this.dataSetting(mSelectedTree);
        }
      },

      async dataSetting(mSelectedTree = {}) {
        const oViewModel = this.getViewModel();
        const oDetail = await this.treeDetail(mSelectedTree.L1id, mSelectedTree.L2id, mSelectedTree.L3id, mSelectedTree.L4id, mSelectedTree.Werks);
        const aFormData = oDetail.HelpInfo2Nav.results || [];
        const aMenuId = await this.helpMenuId(mSelectedTree.Werks);

        if (mSelectedTree.Folder === 'X') {
          oViewModel.setProperty('/FormData', {});
          oViewModel.setProperty('/Fixed', false);
          oViewModel.setProperty('/UserFixed', false);
          return;
        }

        oViewModel.setProperty('/MenuIdList', new ComboEntry({ codeKey: 'Menid', valueKey: 'Mentx', aEntries: aMenuId }));

        const sHeadComment =
          _.find(aFormData, (e) => {
            return e.Infocd === '1';
          }) || '';
        const sMidComment =
          _.find(aFormData, (e) => {
            return e.Infocd === '2';
          }) || '';
        const sBotComment =
          _.find(aFormData, (e) => {
            return e.Infocd === '3';
          }) || '';
        const mDetailData = aFormData[0] || {};

        oViewModel.setProperty('/FormData', {
          ...mSelectedTree,
          ...mDetailData,
          ChInfo: oDetail.ChInfo,
          HeadZcomment: sHeadComment.Zcomment,
          MidZcomment: sMidComment.Zcomment,
          BotZcomment: sBotComment.Zcomment,
          Menid1: mDetailData.Menid1 || 'ALL',
          Mentx1: mDetailData.Mentx1 || '',
          Menid2: mDetailData.Menid2 || 'ALL',
          Mentx2: mDetailData.Mentx2 || '',
          Menid3: mDetailData.Menid3 || 'ALL',
          Mentx3: mDetailData.Mentx3 || '',
        });

        if (!this.isHass()) {
          const [mPdfUrl] = oDetail.HelpInfo4Nav.results;

          oViewModel.setProperty('/FormData/Fileuri', mPdfUrl ? mPdfUrl.Fileuri : '');
        }

        const sRoutL2 = mSelectedTree.L2tx ? ` > ${mSelectedTree.L2tx}` : '';
        const sRoutL3 = mSelectedTree.L3tx ? ` > ${mSelectedTree.L3tx}` : '';
        const sRoutL4 = mSelectedTree.L4tx ? ` > ${mSelectedTree.L4tx}` : '';

        oViewModel.setProperty('/FormData/MenuRoute', `${mSelectedTree.L1tx}${sRoutL2}${sRoutL3}${sRoutL4}`);

        const oManagerList = await this.dialogManagerList(mSelectedTree.L1id, mSelectedTree.L2id, mSelectedTree.L3id, mSelectedTree.L4id, mSelectedTree.Werks);
        const aManager = oManagerList.HelpInfo3Nav.results;

        oViewModel.setProperty('/ManagerList', aManager);
        oViewModel.setProperty('/ManagerRowCount', _.size(aManager));
        oViewModel.setProperty('/PDFFile', {});
        oViewModel.setProperty('/DeleteDatas', []);

        let bFix = false;

        if (
          _.some(aManager, (e) => {
            return e.Pernr === this.getAppointeeProperty('Pernr');
          })
        ) {
          bFix = true;
        }

        oViewModel.setProperty('/Fixed', bFix);
        oViewModel.setProperty('/UserFixed', false);
        this.settingsAttachTable();

        let bFileBox = true;

        if (!AttachFileAction.getFileCount.call(this) && !this.isHass()) {
          bFileBox = false;
        }

        oViewModel.setProperty('/Settings/Visible', bFileBox);
      },

      // 메뉴 도움말 자료실 Combo
      async helpMenuId(sWerks = this.getAppointeeProperty('Werks')) {
        const oModel = this.getModel(ServiceNames.COMMON);

        return await Client.getEntitySet(oModel, 'HelpInfoMenid', { Werks: sWerks });
      },

      // Tree선택시 상세내용조회
      async treeDetail(sL1id = '', sL2id = '', sL3id = '', sL4id = '', sWerks = '') {
        const oModel = this.getModel(ServiceNames.COMMON);
        const mAppointee = this.getAppointeeData();
        const mPayLoad = {
          Pernr: mAppointee.Pernr,
          Werks: mAppointee.Werks,
          Menid: this.getCurrentMenuId(),
          Prcty: 'D',
          HelpInfo1Nav: [
            {
              Werks: sWerks,
              L1id: sL1id,
              L2id: sL2id,
              L3id: sL3id,
              L4id: sL4id,
            },
          ],
          HelpInfo2Nav: [],
          HelpInfo4Nav: [],
        };

        return await Client.deep(oModel, 'HelpInfo', mPayLoad);
      },

      // oData Tree Setting
      oDataChangeTree(aList = []) {
        const oTree = this.byId('ReferenceTree');
        let tree1 = [];
        let tree2 = [];
        let tree3 = [];
        let tree4 = [];

        oTree.collapseAll();
        oTree.expandToLevel(1);
        const aTree2 = _.chain(aList)
          .map((o) => _.omit(o, '__metadata'))
          .map((e) => {
            if (e.L4id) {
              return { ...e, id: e.L4id, title: e.L4tx, use: e.L4use };
            } else if (e.L3id) {
              return { ...e, id: e.L3id, title: e.L3tx, use: e.L3use };
            } else if (e.L2id) {
              return { ...e, id: e.L2id, title: e.L2tx, use: e.L2use };
            } else if (e.L1id) {
              return { ...e, id: e.L1id, title: e.L1tx, use: e.L1use };
            }
          })
          .value();
        _.forEach(aTree2, (e) => {
          if (e.L4id) {
            tree4.push(e);
          }
          if (e.L3id && !e.L4id) {
            tree3.push(e);
          }
          if (e.L2id && !e.L3id) {
            tree2.push(e);
          }
          if (e.L1id && !e.L2id) {
            tree1.push(e);
          }
        });

        _.forEach(tree1, (e) => {
          e.child = _.filter(tree2, (e1) => {
            return e.L1id === e1.L1id;
          });
        });
        _.forEach(tree2, (e) => {
          if (e.L2id) {
            e.child = _.filter(tree3, (e1) => {
              return e.L2id === e1.L2id;
            });
          }
        });
        _.forEach(tree3, (e) => {
          if (e.L3id) {
            e.child = _.filter(tree4, (e1) => {
              return e.L3id === e1.L3id;
            });
          }
        });

        return tree1;
      },

      // override AttachFileCode
      getApprovalType() {
        return 'INF2';
      },

      // 관리자조회 Dialog 닫기클릭
      onClick(oEvent) {
        oEvent.getSource().getParent().close();
      },

      // 관리자조회
      onManagerBtn() {
        const oView = this.getView();

        setTimeout(() => {
          if (!this._pManagerDialog) {
            this._pManagerDialog = Fragment.load({
              id: oView.getId(),
              name: 'sap.ui.yesco.mvc.view.referenceRoom.fragment.Manager',
              controller: this,
            }).then(function (oDialog) {
              oView.addDependent(oDialog);
              return oDialog;
            });
          }

          this._pManagerDialog.then(async function (oDialog) {
            oDialog.open();
          });
        }, 100);
      },

      // 'C' 수정, 'N' 확인(수정중 트리 나갈경우)
      async checkForm(sType = '', sL1id = '', sL2id = '', sL3id = '', sL4id = '', sWerks = '') {
        const oModel = this.getModel(ServiceNames.COMMON);
        const mAppointee = this.getAppointeeData();
        const mPayLoad = {
          Pernr: mAppointee.Pernr,
          Werks: mAppointee.Werks,
          Menid: this.getCurrentMenuId(),
          Prcty: sType,
          HelpInfo2Nav: [
            {
              Werks: sWerks,
              L1id: sL1id,
              L2id: sL2id,
              L3id: sL3id,
              L4id: sL4id,
            },
          ],
        };

        return await Client.deep(oModel, 'HelpInfo', mPayLoad);
      },

      // 관리자 조회
      async dialogManagerList(sL1id = '', sL2id = '', sL3id = '', sL4id = '', sWerks = '') {
        const oModel = this.getModel(ServiceNames.COMMON);
        const mAppointee = this.getAppointeeData();
        const mPayLoad = {
          Pernr: mAppointee.Pernr,
          Werks: mAppointee.Werks,
          Menid: this.getCurrentMenuId(),
          Prcty: 'A',
          HelpInfo2Nav: [
            {
              Werks: sWerks,
              L1id: sL1id,
              L2id: sL2id,
              L3id: sL3id,
              L4id: sL4id,
            },
          ],
          HelpInfo3Nav: [],
        };

        return await Client.deep(oModel, 'HelpInfo', mPayLoad);
      },

      checkError() {
        const oViewModel = this.getViewModel();
        const mFormData = oViewModel.getProperty('/FormData');

        // 동호회
        if (mFormData.Zclub === 'ALL' || !mFormData.Zclub) {
          MessageBox.alert(this.getBundleText('MSG_14004'));
          return true;
        }

        return false;
      },

      // 수정
      async onFixedBtn() {
        const oViewModel = this.getViewModel();

        try {
          AppUtils.setAppBusy(true, this);

          const mFormData = oViewModel.getProperty('/FormData');

          await this.checkForm('C', mFormData.L1id, mFormData.L2id, mFormData.L3id, mFormData.L4id, mFormData.Werks);

          oViewModel.setProperty('/UserFixed', true);
          this.settingsAttachTable();

          let bFileBox = true;

          if (!AttachFileAction.getFileCount.call(this) && !this.isHass()) {
            bFileBox = false;
          }

          oViewModel.setProperty('/Settings/Visible', bFileBox);
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          AppUtils.setAppBusy(false, this);
        }
      },

      // 다른Tree 선택시 확인용 저장
      async saveForm() {
        try {
          AppUtils.setAppBusy(true, this);

          const oViewModel = this.getViewModel();
          const sAppno = oViewModel.getProperty('/FormData/Appno');

          if (!sAppno || _.parseInt(sAppno) === 0) {
            const sAppno = await Appno.get.call(this);

            oViewModel.setProperty('/FormData/Appno', sAppno);
          }

          const oModel = this.getModel(ServiceNames.COMMON);
          const mAppointee = this.getAppointeeData();
          const mFormData = oViewModel.getProperty('/FormData');
          const mPdfFile = oViewModel.getProperty('/PDFFile');
          let mFileObj = {};

          if (!!mPdfFile) {
            mFileObj = {
              Zfilekey: mPdfFile.Zbinkey || mPdfFile.Zfilekey,
              Zfilename: mPdfFile.Zfilename,
              Appno: mFormData.Appno,
            };
          }

          let oSendObject = {
            Pernr: mAppointee.Pernr,
            Werks: mFormData.Werks,
            Menid: this.getCurrentMenuId(),
            Prcty: 'S',
            HelpInfo2Nav: [
              {
                ...mFormData,
                Infocd: '1',
                Zcomment: mFormData.HeadZcomment,
              },
              {
                ...mFormData,
                Infocd: '2',
                Zcomment: mFormData.MidZcomment,
              },
              {
                ...mFormData,
                Infocd: '3',
                Zcomment: mFormData.BotZcomment,
              },
            ],
            HelpInfo4Nav: [mFileObj],
          };

          // FileUpload
          await this.uploadFile(mFormData.Appno, this.PDF_FILE_TYPE);
          await AttachFileAction.uploadFile.call(this, mFormData.Appno, this.getApprovalType());
          await Client.deep(oModel, 'HelpInfo', oSendObject);

          // {저장}되었습니다.
          MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00103'));
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          AppUtils.setAppBusy(false, this);
        }
      },

      // 저장
      async onSaveBtn() {
        // {저장}하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00103'), {
          // 저장, 취소
          actions: [this.getBundleText('LABEL_00103'), this.getBundleText('LABEL_00118')],
          onClose: async (vPress) => {
            // 저장
            if (!vPress || vPress !== this.getBundleText('LABEL_00103')) {
              return;
            }

            try {
              AppUtils.setAppBusy(true, this);

              const oViewModel = this.getViewModel();
              const sAppno = oViewModel.getProperty('/FormData/Appno');

              if (!sAppno || _.parseInt(sAppno) === 0) {
                const sAppno = await Appno.get.call(this);

                oViewModel.setProperty('/FormData/Appno', sAppno);
              }

              const oModel = this.getModel(ServiceNames.COMMON);
              const mAppointee = this.getAppointeeData();
              const mFormData = oViewModel.getProperty('/FormData');
              const mPdfFile = oViewModel.getProperty('/PDFFile');
              let mFileObj = {};

              if (!!mPdfFile) {
                mFileObj = {
                  Zfilekey: mPdfFile.Zbinkey || mPdfFile.Zfilekey,
                  Zfilename: mPdfFile.Zfilename,
                  Appno: mFormData.Appno,
                  Zworktyp: this.PDF_FILE_TYPE,
                };
              }

              let oSendObject = {
                Pernr: mAppointee.Pernr,
                Werks: mFormData.Werks,
                Menid: this.getCurrentMenuId(),
                Prcty: 'S',
                HelpInfo2Nav: [
                  {
                    ...mFormData,
                    Infocd: '1',
                    Zcomment: mFormData.HeadZcomment,
                  },
                  {
                    ...mFormData,
                    Infocd: '2',
                    Zcomment: mFormData.MidZcomment,
                  },
                  {
                    ...mFormData,
                    Infocd: '3',
                    Zcomment: mFormData.BotZcomment,
                  },
                ],
                HelpInfo4Nav: [mFileObj],
              };

              // FileUpload
              await this.uploadFile(mFormData.Appno, this.PDF_FILE_TYPE);
              await AttachFileAction.uploadFile.call(this, mFormData.Appno, this.getApprovalType());
              await Client.deep(oModel, 'HelpInfo', oSendObject);

              // {저장}되었습니다.
              MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00103'), {
                onClose: () => {
                  oViewModel.setProperty('/UserFixed', false);
                },
              });
            } catch (oError) {
              AppUtils.handleError(oError);
            } finally {
              AppUtils.setAppBusy(false, this);
            }
          },
        });
      },

      // PDF출력파일 첨부
      onFileChange(oEvent) {
        const oViewModel = this.getViewModel();
        const [sFile] = oEvent.getParameter('files');
        const mPdfFile = oViewModel.getProperty('/PDFFile');

        sFile.New = true;
        sFile.Zfilename = sFile.name;
        sFile.Type = sFile.type;
        sFile.Zbinkey = String(parseInt(Math.random() * 100000000000000));
        sFile.Seqnr = 1;

        oViewModel.setProperty('/DeleteDatas', [...oViewModel.getProperty('/DeleteDatas'), mPdfFile]);
        oViewModel.setProperty('/PDFFile', sFile);
      },

      /*
       * PDF File 삭제
       */
      onDeleteAttachFile() {
        const oViewModel = this.getViewModel();
        const mFileData = oViewModel.getProperty('/PDFFile');

        if (!mFileData.Zfilename) {
          return;
        }

        oViewModel.setProperty('/DeleteDatas', [...oViewModel.getProperty('/DeleteDatas'), mFileData]);
        oViewModel.setProperty('/PDFFile', {});
      },

      /*
       * 첨부파일 삭제 oData
       */
      callDeleteFileService(Appno, Seqnr) {
        const oModel = this.getModel(ServiceNames.COMMON);
        const sPath = oModel.createKey('/FileListSet', {
          Appno: Appno,
          Zworktyp: this.PDF_FILE_TYPE,
          Zfileseq: Seqnr,
        });

        return new Promise((resolve, reject) => {
          oModel.remove(sPath, {
            success: () => {
              resolve();
            },
            error: (oError) => {
              reject(AppUtils.handleError(oError));
            },
          });
        });
      },

      /*
       *   첨부파일 Upload
       */
      uploadFile(Appno, Type) {
        const sServiceUrl = ServiceManager.getServiceUrl('ZHR_COMMON_SRV', this.getOwnerComponent());
        const oModel = new sap.ui.model.odata.ODataModel(sServiceUrl, true, undefined, undefined, undefined, undefined, undefined, false);
        const oViewModel = this.getViewModel();
        const mFile = oViewModel.getProperty('/PDFFile');
        const aDeleteFiles = oViewModel.getProperty('/DeleteDatas') || [];

        return new Promise(async (resolve, reject) => {
          // 파일 삭제
          if (!!aDeleteFiles.length) {
            try {
              Promise.all(
                _.map(aDeleteFiles, (e) => {
                  if (e.Seqnr) {
                    this.callDeleteFileService(Appno, e.Seqnr);
                  }
                })
              );
            } catch (oError) {
              reject(oError);
            }
          }

          // 신규 등록된 파일만 업로드
          if (!mFile || !mFile.New) return resolve();

          oModel.refreshSecurityToken();
          const oRequest = oModel._createRequest();
          const oHeaders = {
            'x-csrf-token': oRequest.headers['x-csrf-token'],
            slug: [Appno, Type, encodeURI(mFile.Zfilename)].join('|'),
          };

          this.AttachFileAction.FileData = mFile;

          jQuery.ajax({
            type: 'POST',
            async: false,
            url: `${sServiceUrl}/FileUploadSet/`,
            headers: oHeaders,
            cache: false,
            contentType: mFile.type,
            processData: false,
            data: mFile,
            success: (data) => {
              this.debug(`${this.getBundleText('MSG_00016')}, ${data}`);
              this.AttachFileAction.FileData.New = false;
              resolve(data);
            },
            error: (oError) => {
              this.debug(`Error: ${oError}`);

              // 파일 업로드에 실패하였습니다.
              reject({ code: 'E', message: this.getBundleText('MSG_00041') });
            },
          });
        });
      },

      /*
       * PDF 첨부파일 호출
       */
      refreshAttachFileList(Appno, Type) {
        const oModel = this.getModel(ServiceNames.COMMON);

        return new Promise((resolve, reject) => {
          oModel.read('/FileListSet', {
            filters: [
              // prettier 방지주석
              new sap.ui.model.Filter('Appno', sap.ui.model.FilterOperator.EQ, Appno),
              new sap.ui.model.Filter('Zworktyp', sap.ui.model.FilterOperator.EQ, Type),
            ],
            success: (data) => {
              const [mPdfFile] = data.results;

              this.getViewModel().setProperty('/PDFFile', mPdfFile || {});
            },
            error: (oError) => {
              AppUtils.handleError(oError);
            },
          });
        });
      },

      onPdfError(oEvent) {
        oEvent.preventDefault();
      },

      // AttachFileTable Settings
      settingsAttachTable() {
        const oViewModel = this.getViewModel();
        const bFix1 = oViewModel.getProperty('/Fixed');
        const bFix2 = oViewModel.getProperty('/UserFixed');
        const sAppno = oViewModel.getProperty('/FormData/Appno') || '';

        this.refreshAttachFileList(sAppno, this.PDF_FILE_TYPE);

        AttachFileAction.setAttachFile(this, {
          Editable: bFix1 && bFix2 && this.isHass(),
          Type: this.getApprovalType(),
          Appno: sAppno,
          Message: this.getBundleText('MSG_29003'),
          Max: 10,
          FileTypes: ['jpg', 'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'bmp', 'txt', 'png'],
        });
      },
    });
  }
);
