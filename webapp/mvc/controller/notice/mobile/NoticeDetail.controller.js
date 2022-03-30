/* eslint-disable no-useless-call */
sap.ui.define(
  [
    // prettier 방지주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/AttachFileAction',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/richtexteditor/RichTextEditor',
    'sap/ui/yesco/mvc/model/type/Date',
  ],
  (
    // prettier 방지용 주석
    AppUtils,
    AttachFileAction,
    ServiceNames,
    Client,
    BaseController,
    RTE
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.notice.mobile.NoticeDetail', {
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
        return this.getBundleText('LABEL_08001'); // 공지사항
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

          // setTimeout(() => {
          //   this.setTextEditor();
          // }, 100);

          this.settingsAttachTable();
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oDetailModel.setProperty('/busy', false);
        }
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
          // FileTypes: ['jpg', 'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'bmp', 'txt', 'png'],
        });
      },
    });
  }
);
