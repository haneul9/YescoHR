/* eslint-disable no-useless-call */
sap.ui.define(
  [
    // prettier 방지주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/richtexteditor/RichTextEditor',
  ],
  (
    // prettier 방지용 주석
    AppUtils,
    ServiceNames,
    Client,
    BaseController,
    RTE
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.notice.mobile.NoticeDetail', {
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

      getCurrentLocationText() {
        return this.getBundleText('LABEL_08001'); // 공지사항
      },

      // override AttachFileCode
      getApprovalType() {
        return '10';
      },

      async onObjectMatched(oParameter) {
        const oViewModel = this.getViewModel();

        oViewModel.setData(this.initializeModel());
        oViewModel.setProperty('/busy', true);

        try {
          const sSdate = new Date(parseInt(oParameter.Sdate)) || oParameter.Sdate;
          const sSeqnr = oParameter.Seqnr;
          const sMenid = this.getCurrentMenuId();

          oViewModel.setProperty('/Menid', sMenid);
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
            oViewModel.setProperty('/MySelf', true);
          }

          oTargetData.Detail = '';

          oDetailData.forEach((e) => {
            oTargetData.Detail += e.Detail;
          });

          oViewModel.setProperty('/FormData', oTargetData);

          // setTimeout(() => {
          //   this.setTextEditor();
          // }, 100);

          this.settingsAttachTable();
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      editorReady(oEvent) {
        oEvent.getSource().addButtonGroup('styleselect').addButtonGroup('table');
      },

      setTextEditor() {
        if (!!this.byId('EditorBox').getItems()[0]) {
          this.byId('EditorBox').destroyItems();
        }

        const oViewModel = this.getViewModel();
        const bStat = !!oViewModel.getProperty('/MySelf') && !!oViewModel.getProperty('/Hass');
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
          value: oViewModel.getProperty('/FormData/Detail'),
          editable: bStat,
          ready: function () {
            this.addButtonGroup('styleselect').addButtonGroup('table');
          },
        });

        this.byId('EditorBox').addItem(oRichTextEditor);
      },

      // AttachFileTable Settings
      settingsAttachTable() {
        const oViewModel = this.getViewModel();
        const bHass = oViewModel.getProperty('/Hass');
        const bMySelf = oViewModel.getProperty('/MySelf');
        const sAppno = oViewModel.getProperty('/FormData/Appno') || '';

        this.AttachFileAction.setAttachFile(this, {
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
