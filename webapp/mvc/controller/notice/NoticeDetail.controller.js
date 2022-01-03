/* eslint-disable no-useless-call */
sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/Appno',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/AttachFileAction',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/exceptions/ODataReadError',
    'sap/ui/yesco/common/exceptions/ODataCreateError',
    'sap/ui/yesco/common/exceptions/ODataDeleteError',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/richtexteditor/RichTextEditor',
  ],
  (
    // prettier 방지용 주석
    JSONModel,
    Appno,
    AppUtils,
    AttachFileAction,
    ServiceNames,
    MessageBox,
    ODataReadError,
    ODataCreateError,
    ODataDeleteError,
    BaseController,
    RTE
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.notice.NoticeDetail', {
      LIST_PAGE_ID: {
        E: 'container-ehr---notice',
        H: 'container-ehr---h_notice',
      },

      AttachFileAction: AttachFileAction,

      onBeforeShow() {
        const oViewModel = new JSONModel({
          ViewKey: '',
          MenId: '',
          MySelf: false,
          Hass: this.isHass(),
          FormData: {},
          Settings: {},
          busy: false,
        });
        this.setViewModel(oViewModel);
        // this.setTextEditor();

        this.getViewModel().setProperty('/busy', true);
      },

      getCurrentLocationText(oArguments) {
        const sAction = oArguments.oDataKey === 'N' ? this.getBundleText('LABEL_00167') : this.getBundleText('LABEL_00165');

        return sAction;
      },

      // override AttachFileCode
      getApprovalType() {
        return '10';
      },

      onObjectMatched(oParameter) {
        const sDataKey = oParameter.oDataKey;
        const oDetailModel = this.getViewModel();
        const sMenid = this.getCurrentMenuId();

        oDetailModel.setProperty('/ViewKey', sDataKey);
        oDetailModel.setProperty('/Menid', sMenid);

        this.getTargetData();
      },

      // 중요항목 & 임시저장 Check
      onSelected(oEvent) {
        const bSelected = oEvent.getSource().getSelected();
        const sPath = oEvent.getSource().getBinding('selected').getBindings()[0].getPath();

        if (bSelected) {
          this.getViewModel().setProperty(sPath, 'X');
        } else {
          this.getViewModel().setProperty(sPath, '');
        }
      },

      // 상세조회
      getTargetData() {
        const oModel = this.getModel(ServiceNames.COMMON);
        const oDetailModel = this.getViewModel();
        const sViewKey = oDetailModel.getProperty('/ViewKey');
        const oSessionData = this.getSessionData();

        if (sViewKey === 'N') {
          oDetailModel.setProperty('/MySelf', true);
          oDetailModel.setProperty('/FormData', oSessionData);
          oDetailModel.setProperty('/FormData', {
            ApernTxt: `${oSessionData.Orgtx} ${oSessionData.Ename}`,
            Apern: oSessionData.Pernr,
          });

          this.settingsAttachTable();
          oDetailModel.setProperty('/busy', false);
        } else {
          const oView = this.getView();
          const oListView = oView.getParent().getPage(this.isHass() ? this.LIST_PAGE_ID.H : this.LIST_PAGE_ID.E);
          const mListData = oListView.getModel().getProperty('/parameter');
          const sWerks = this.getSessionProperty('Werks');
          let oSendObject = {};

          oSendObject.Prcty = '1';
          oSendObject.Sdate = mListData.Sdate;
          oSendObject.Seqnr = mListData.Seqnr;
          oSendObject.Werks = sWerks;
          oSendObject.Notice1Nav = [];
          oSendObject.Notice2Nav = [];

          oModel.create('/NoticeManageSet', oSendObject, {
            success: (oData) => {
              if (oData) {
                const oTargetData = oData.Notice1Nav.results[0];
                const oDetailData = oData.Notice2Nav.results;

                if (this.getSessionProperty('Pernr') === oTargetData.Apern) {
                  oDetailModel.setProperty('/MySelf', true);
                }

                oTargetData.Detail = '';

                oDetailData.forEach((e) => {
                  oTargetData.Detail += e.Detail;
                });

                oDetailModel.setProperty('/FormData', oTargetData);

                this.settingsAttachTable();
                oDetailModel.setProperty('/busy', false);
              }
            },
            error: (oError) => {
              AppUtils.handleError(new ODataReadError(oError));
              oDetailModel.setProperty('/busy', false);
            },
          });
        }
      },

      checkError() {
        const oDetailModel = this.getViewModel();
        const oFormData = oDetailModel.getProperty('/FormData');

        // 제목
        if (!oFormData.Title) {
          MessageBox.alert(this.getBundleText('MSG_08001'));
          return true;
        }

        // 내용
        if (!oFormData.Detail) {
          MessageBox.alert(this.getBundleText('MSG_08002'));
          return true;
        }

        return false;
      },

      // 임시저장
      onSaveBtn() {
        const oModel = this.getModel(ServiceNames.COMMON);
        const oDetailModel = this.getViewModel();
        const sAppno = oDetailModel.getProperty('/FormData/Appno');
        const oFormData = oDetailModel.getProperty('/FormData');
        const sWerks = this.getSessionProperty('Werks');

        if (this.checkError()) return;

        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00103'), {
          actions: [this.getBundleText('LABEL_00103'), this.getBundleText('LABEL_00118')],
          onClose: async (vPress) => {
            if (vPress && vPress === this.getBundleText('LABEL_00103')) {
              try {
                AppUtils.setAppBusy(true, this);

                if (!sAppno) {
                  const vAppno = await Appno.get.call(this);

                  oDetailModel.setProperty('/FormData/Appno', vAppno);
                  oDetailModel.setProperty('/FormData/Sdate', new Date());
                }

                const aDetail = [];
                const aList = oFormData.Detail.match(new RegExp('.{1,' + 4000 + '}', 'g'));

                aList.forEach((e) => {
                  const mDetailObj = {};

                  mDetailObj.Detail = e;
                  aDetail.push(mDetailObj);
                });

                oFormData.Detail = '';
                oFormData.Hide = 'X';

                let oSendObject = {
                  Prcty: '2',
                  Werks: sWerks,
                  Notice1Nav: [oFormData],
                  Notice2Nav: aDetail,
                };

                // FileUpload
                await AttachFileAction.uploadFile.call(this, oFormData.Appno, this.APPTP);

                await new Promise((resolve, reject) => {
                  oModel.create('/NoticeManageSet', oSendObject, {
                    success: () => {
                      resolve();
                    },
                    error: (oError) => {
                      reject(new ODataCreateError(oError));
                    },
                  });
                });

                MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00103'));
              } catch (oError) {
                AppUtils.handleError(oError);
              } finally {
                AppUtils.setAppBusy(false, this);
              }
            }
          },
        });
      },

      // 등록
      onRegistBtn() {
        const oModel = this.getModel(ServiceNames.COMMON);
        const oDetailModel = this.getViewModel();
        const sAppno = oDetailModel.getProperty('/FormData/Appno');
        const oFormData = oDetailModel.getProperty('/FormData');
        const sWerks = this.getSessionProperty('Werks');

        if (this.checkError()) return;

        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00106'), {
          actions: [this.getBundleText('LABEL_00106'), this.getBundleText('LABEL_00118')],
          onClose: async (vPress) => {
            if (vPress && vPress === this.getBundleText('LABEL_00106')) {
              try {
                AppUtils.setAppBusy(true, this);

                if (!sAppno) {
                  const vAppno = await Appno.get.call(this);

                  oDetailModel.setProperty('/FormData/Appno', vAppno);
                  oDetailModel.setProperty('/FormData/Sdate', new Date());
                }

                const aDetail = [];
                const aList = oFormData.Detail.match(new RegExp('.{1,' + 4000 + '}', 'g'));

                aList.forEach((e) => {
                  const mDetailObj = {};

                  mDetailObj.Detail = e;
                  aDetail.push(mDetailObj);
                });

                oFormData.Detail = '';
                let oSendObject = {
                  Prcty: '2',
                  Werks: sWerks,
                  Notice1Nav: [oFormData],
                  Notice2Nav: aDetail,
                };

                // FileUpload
                await AttachFileAction.uploadFile.call(this, oFormData.Appno, this.APPTP);

                await new Promise((resolve, reject) => {
                  oModel.create('/NoticeManageSet', oSendObject, {
                    success: () => {
                      resolve();
                    },
                    error: (oError) => {
                      reject(new ODataCreateError(oError));
                    },
                  });
                });

                MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00106'), {
                  onClose: () => {
                    let sPageName = '';

                    if (this.isHass()) {
                      sPageName = 'h/notice';
                    } else {
                      sPageName = 'notice';
                    }

                    this.getRouter().navTo(sPageName);
                  },
                });
              } catch (error) {
                AppUtils.handleError(error);
              } finally {
                AppUtils.setAppBusy(false, this);
              }
            }
          },
        });
      },

      // 삭제
      onDeleteBtn() {
        const oModel = this.getModel(ServiceNames.COMMON);
        const sWerks = this.getSessionProperty('Werks');

        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00110'), {
          actions: [this.getBundleText('LABEL_00110'), this.getBundleText('LABEL_00118')],
          onClose: (vPress) => {
            if (vPress && vPress === this.getBundleText('LABEL_00110')) {
              AppUtils.setAppBusy(true, this);

              const oFormData = this.getViewModel().getProperty('/FormData');
              const aList = oFormData.Detail.match(new RegExp('.{1,' + 4000 + '}', 'g'));
              const aDetail = [];

              aList.forEach((e) => {
                const mDetailObj = {};

                mDetailObj.Detail = e;
                aDetail.push(mDetailObj);
              });

              oFormData.Detail = '';

              let oSendObject = {
                Prcty: '3',
                Werks: sWerks,
                Notice1Nav: [oFormData],
                Notice2Nav: aDetail,
              };

              oModel.create('/NoticeManageSet', oSendObject, {
                success: () => {
                  MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00110'), {
                    onClose: () => {
                      let sPageName = '';

                      if (this.isHass()) {
                        sPageName = 'h/notice';
                      } else {
                        sPageName = 'notice';
                      }

                      this.getRouter().navTo(sPageName);
                    },
                  });
                  AppUtils.setAppBusy(false, this);
                },
                error: (oError) => {
                  AppUtils.handleError(new ODataDeleteError(oError));
                  AppUtils.setAppBusy(false, this);
                },
              });
            }
          },
        });
      },

      editorReady(oEvent) {
        oEvent.getSource().addButtonGroup('styleselect').addButtonGroup('table');
      },

      setTextEditor() {
        if (!!this.byId('EditorBox').getItems()[0]) {
          this.byId('EditorBox').destroyItems();
        }

        const oRichTextEditor = new RTE('myRTE', {
          editorType: 'TinyMCE4',
          layoutData: new sap.m.FlexItemData({ growFactor: 1 }),
          width: '99.8%',
          height: '500px',
          customToolbar: true,
          showGroupFont: true,
          showGroupInsert: true,
          sanitizeValue: false,
          value: '{/FormData/Detail}',
          editable: {
            parts: [{ path: '/MySelf' }, { path: '/Hass' }],
            formatter: (v1, v2) => {
              return !!v1 && !!v2;
            },
          },
          ready: function () {
            this.addButtonGroup('styleselect').addButtonGroup('table');
          },
        });

        this.byId('EditorBox').addItem(oRichTextEditor);
      },

      // AttachFileTable Settings
      settingsAttachTable() {
        const oDetailModel = this.getViewModel();
        const bHass = oDetailModel.getProperty('/Hass');
        const bMySelf = oDetailModel.getProperty('/MySelf');
        const sAppno = oDetailModel.getProperty('/FormData/Appno') || '';

        AttachFileAction.setAttachFile(this, {
          Editable: !!bHass && !!bMySelf,
          Type: this.APPTP,
          Appno: sAppno,
          Max: 10,
          FileTypes: ['jpg', 'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'bmp', 'png'],
        });
      },
    });
  }
);
