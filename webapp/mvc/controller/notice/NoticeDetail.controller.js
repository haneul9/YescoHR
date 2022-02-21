/* eslint-disable no-useless-call */
sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/Appno',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/AttachFileAction',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/odata/Client',
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
    Client,
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

      initializeModel() {
        return {
          MenId: '',
          MySelf: false,
          Hass: this.isHass(),
          FormData: {},
          FieldLimit: {},
          Settings: {},
          busy: false,
        };
      },

      getCurrentLocationText(oArguments) {
        const sAction = oArguments.Sdate === 'N' ? this.getBundleText('LABEL_00167') : this.getBundleText('LABEL_00165');

        return sAction;
      },

      // override AttachFileCode
      getApprovalType() {
        return '10';
      },

      async onObjectMatched(oParameter) {
        const oDetailModel = this.getViewModel();

        oDetailModel.setData(this.initializeModel());
        oDetailModel.setProperty('/busy', true);

        try {
          const sSdate = new Date(parseInt(oParameter.Sdate)) || oParameter.Sdate;
          const sSeqnr = oParameter.Seqnr;
          const sMenid = this.getCurrentMenuId();

          oDetailModel.setProperty('/Menid', sMenid);
          oDetailModel.setProperty('/FieldLimit', _.assignIn(this.getEntityLimit(ServiceNames.COMMON, 'NoticeManage')));

          if (!sSeqnr || sSeqnr === 'N') {
            const oSessionData = this.getSessionData();

            oDetailModel.setProperty('/MySelf', true);
            oDetailModel.setProperty('/FormData', oSessionData);
            oDetailModel.setProperty('/FormData', {
              ApernTxt: `${oSessionData.Orgtx} ${oSessionData.Ename}`,
              Apern: oSessionData.Pernr,
            });
          } else {
            const sWerks = this.getSessionProperty('Werks');
            let oSendObject = {
              Prcty: '1',
              Sdate: sSdate,
              Seqnr: sSeqnr,
              Werks: sWerks,
              Notice1Nav: [],
              Notice2Nav: [],
            };

            const oModel = this.getModel(ServiceNames.COMMON);
            const oDetail = await Client.deep(oModel, 'NoticeManage', oSendObject);

            const oTargetData = oDetail.Notice1Nav.results[0];
            const oDetailData = oDetail.Notice2Nav.results;

            if (this.getSessionProperty('Pernr') === oTargetData.Apern) {
              oDetailModel.setProperty('/MySelf', true);
            }

            oTargetData.Detail = '';

            oDetailData.forEach((e) => {
              oTargetData.Detail += e.Detail;
            });

            oDetailModel.setProperty('/FormData', oTargetData);
          }

          // this.setTextEditor();
          this.settingsAttachTable();
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oDetailModel.setProperty('/busy', false);
        }
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
        if (this.checkError()) return;

        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00103'), {
          actions: [this.getBundleText('LABEL_00103'), this.getBundleText('LABEL_00118')],
          onClose: async (vPress) => {
            if (vPress && vPress === this.getBundleText('LABEL_00103')) {
              try {
                AppUtils.setAppBusy(true, this);

                const oDetailModel = this.getViewModel();
                const sAppno = oDetailModel.getProperty('/FormData/Appno');

                if (!sAppno) {
                  const vAppno = await Appno.get.call(this);

                  oDetailModel.setProperty('/FormData/Appno', vAppno);
                  oDetailModel.setProperty('/FormData/Sdate', new Date());
                }

                const aDetail = [];
                const oFormData = oDetailModel.getProperty('/FormData');
                const aList = oFormData.Detail.match(new RegExp('.{1,' + 4000 + '}', 'g'));

                aList.forEach((e) => {
                  const mDetailObj = {};

                  mDetailObj.Detail = e;
                  aDetail.push(mDetailObj);
                });

                oFormData.Detail = '';
                oFormData.Hide = 'X';

                // FileUpload
                await AttachFileAction.uploadFile.call(this, oFormData.Appno, this.getApprovalType());

                const oModel = this.getModel(ServiceNames.COMMON);
                const sWerks = this.getSessionProperty('Werks');

                await Client.deep(oModel, 'NoticeManage', {
                  Prcty: '2',
                  Werks: sWerks,
                  Notice1Nav: [oFormData],
                  Notice2Nav: aDetail,
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
        if (this.checkError()) return;

        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00106'), {
          actions: [this.getBundleText('LABEL_00106'), this.getBundleText('LABEL_00118')],
          onClose: async (vPress) => {
            if (vPress && vPress === this.getBundleText('LABEL_00106')) {
              try {
                AppUtils.setAppBusy(true, this);
                const oDetailModel = this.getViewModel();
                const sAppno = oDetailModel.getProperty('/FormData/Appno');

                if (!sAppno) {
                  const vAppno = await Appno.get.call(this);

                  oDetailModel.setProperty('/FormData/Appno', vAppno);
                  oDetailModel.setProperty('/FormData/Sdate', new Date());
                }

                const aDetail = [];
                const oFormData = oDetailModel.getProperty('/FormData');
                const aList = oFormData.Detail.match(new RegExp('.{1,' + 4000 + '}', 'g'));

                aList.forEach((e) => {
                  const mDetailObj = {};

                  mDetailObj.Detail = e;
                  aDetail.push(mDetailObj);
                });

                oFormData.Detail = '';
                oFormData.Hide = '';

                const sWerks = this.getSessionProperty('Werks');

                // FileUpload
                await AttachFileAction.uploadFile.call(this, oFormData.Appno, this.getApprovalType());

                const oModel = this.getModel(ServiceNames.COMMON);
                let oSendObject = {
                  Prcty: '2',
                  Werks: sWerks,
                  Notice1Nav: [oFormData],
                  Notice2Nav: aDetail,
                };

                await Client.deep(oModel, 'NoticeManage', oSendObject);

                MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00106'), {
                  onClose: () => {
                    this.onNavBack();
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
                      this.onNavBack();
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

        const oDetailModel = this.getViewModel();
        const bStat = !!oDetailModel.getProperty('/MySelf') && !!oDetailModel.getProperty('/Hass');

        const oRichTextEditor = new RTE('myRTE', {
          editorType: sap.ui.richtexteditor.EditorType.TinyMCE4, // 'TinyMCE4',
          layoutData: new sap.m.FlexItemData({ growFactor: 1 }),
          width: '99.8%',
          height: '500px',
          customToolbar: bStat,
          showGroupFont: bStat,
          showGroupInsert: bStat,
          showGroupTextAlign: bStat,
          showGroupStructure: bStat,
          showGroupFontStyle: bStat,
          showGroupClipboard: bStat,
          sanitizeValue: false,
          value: oDetailModel.getProperty('/FormData/Detail'),
          editable: bStat,
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
          Type: this.getApprovalType(),
          Appno: sAppno,
          Max: 10,
          FileTypes: ['jpg', 'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'bmp', 'png'],
        });
      },
    });
  }
);
