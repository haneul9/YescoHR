sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    //
    AppUtils,
    Client,
    ServiceNames,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.referenceRoom.mobile.ReferenceRoomDetail', {
      PDF_FILE_TYPE: 'INF1',

      initializeModel() {
        return {
          busy: false,
          FormData: {},
          PDFFile: {},
        };
      },

      async onObjectMatched(mRouteArguments) {
        const oViewModel = this.getViewModel();

        oViewModel.setData(this.initializeModel());

        try {
          oViewModel.setProperty('/FieldLimit', _.assignIn(this.getEntityLimit(ServiceNames.COMMON, 'HelpInfoTab2')));

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
          const [mPdfUrl] = oDetail.HelpInfo4Nav.results;

          oViewModel.setProperty('/FormData', {
            ...mDetailData,
            title: this.getTitle(mDetailData),
            ChInfo: oDetail.ChInfo,
            Fileuri: mPdfUrl ? mPdfUrl.Fileuri : '',
            HeadZcomment: sHeadComment.Zcomment,
            MidZcomment: sMidComment.Zcomment,
            BotZcomment: sBotComment.Zcomment,
          });

          this.settingsAttachTable();
        } catch (oError) {
          this.debug(oError);
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      getCurrentLocationText({ Title }) {
        return `${this.getBundleText('LABEL_29001')} > ${Title}`;
      },

      // 메뉴 경로
      getTitle(mSelectedTree) {
        let sTitle = '';

        if (mSelectedTree.L4id) {
          sTitle = mSelectedTree.L4tx;
        } else if (mSelectedTree.L3id) {
          sTitle = mSelectedTree.L3tx;
        } else if (mSelectedTree.L2id) {
          sTitle = mSelectedTree.L2tx;
        } else {
          sTitle = mSelectedTree.L1tx;
        }

        return sTitle;
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

      // override AttachFileCode
      getApprovalType() {
        return 'INF2';
      },

      /*
       * PDF 첨부파일 호출
       */
      refreshAttachFileList(Appno, Type) {
        const oModel = this.getModel(ServiceNames.COMMON);
        const mPayLoad = {
          Appno: Appno,
          Zworktyp: Type,
        };

        return Client.getEntitySet(oModel, 'FileList', mPayLoad);
      },

      // AttachFileTable Settings
      async settingsAttachTable() {
        const oViewModel = this.getViewModel();
        const sAppno = oViewModel.getProperty('/FormData/Appno') || '';

        this.AttachFileAction.setAttachFile(this, {
          Editable: false,
          RefeFilebox: true,
          Type: this.getApprovalType(),
          Appno: sAppno,
          Max: 10,
        });

        const [mPdfFile] = await this.refreshAttachFileList(sAppno, this.PDF_FILE_TYPE);

        oViewModel.setProperty('/PDFFile', mPdfFile || {});
      },
    });
  }
);
