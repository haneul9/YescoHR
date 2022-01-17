sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/base/Object',
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/Appno',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/FileAttachmentBoxHandler',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/exceptions/UI5Error',
    'sap/ui/yesco/control/MessageBox',
  ],
  (
    // prettier 방지용 주석
    BaseObject,
    JSONModel,
    Appno,
    AppUtils,
    FileAttachmentBoxHandler,
    TableUtils,
    UI5Error,
    MessageBox
  ) => {
    'use strict';

    return BaseObject.extend('sap.ui.yesco.common.ApprovalRequest', {
      sApplyInfoId: 'applyInfo',
      sApprovalDetailsId: 'approvalDetails',

      /**
       * @override
       */
      constructor: function ({ oController, oRequestDetail }) {
        const oModel = new JSONModel({
          ZappStatAl: null,
          Appno: null,
          ApplyInfo: null,
          ApprovalDetails: null,
        });

        this.oController = oController;
        this.oApprovalRequestModel = oModel;
        this.oRequestDetail = oRequestDetail;

        oController.byId(this.sApplyInfoId).setModel(oModel);
        oController.byId(this.sApprovalDetailsId).setModel(oModel);
      },

      setAppno(sAppno) {
        this.oApprovalRequestModel.setProperty('/Appno', sAppno);
        return this;
      },

      getAppno() {
        return this.oApprovalRequestModel.getProperty('/Appno');
      },

      getRequestDetail() {
        return this.oRequestDetail;
      },

      async showData() {
        try {
          const sAppno = this.getAppno();
          const aResultsData = sAppno ? await this.oRequestDetail.readData(sAppno) : []; // 결재 상세 정보 조회 위임
          const mApprovalRequestData = (aResultsData || [])[0] || {};

          this.oApprovalRequestModel.setProperty('/ZappStatAl', mApprovalRequestData.ZappStatAl);
          this.oRequestDetail.showData(aResultsData, this.isFormEditable()); // 결재 상세 정보 조회 위임

          // 결재 공통 정보(첨부파일, 신청자, 결재선 정보) 세팅
          if (this.oRequestDetail.showFileAttachmentBox()) {
            this.setFileAttachmentBoxData();
          }
          this.setApplyInfoBoxData(mApprovalRequestData).setApprovalBoxData(mApprovalRequestData);
        } catch (oError) {
          AppUtils.debug('ApprovalRequest > showData Error', oError);

          if (oError instanceof Error) {
            oError = new UI5Error({ message: AppUtils.getBundleText('MSG_00043') }); // 잘못된 접근입니다.
          }

          AppUtils.handleError(oError, {
            onClose: () => this.oController.onNavBack(),
          });
        }

        return this;
      },

      setFileAttachmentBoxData() {
        const sAppno = this.getAppno();
        const bEditable = this.isFormEditable();
        const sType = this.oController.getApprovalType(); // 결재유형코드 반환 function을 controller에 선언할 것

        this.oFileAttachmentBoxHandler = new FileAttachmentBoxHandler(this.oController, {
          editable: bEditable,
          appno: sAppno,
          apptp: sType,
          maxFileCount: 10,
          fileTypes: 'ppt,pptx,doc,docx,xls,xlsx,jpg,jpeg,bmp,gif,png,pdf'.split(','),
        });
      },

      getFileAttachmentBoxHandler() {
        return this.oFileAttachmentBoxHandler;
      },

      setApplyInfoBoxData(mApporvalData) {
        if (_.isEmpty(mApporvalData)) {
          const mSessionData = this.oController.getSessionData();

          this.oApprovalRequestModel.setProperty('/ApplyInfo', {
            Apename: mSessionData.Ename,
            Aporgtx: `${mSessionData.Btrtx} / ${mSessionData.Orgtx}`,
            Apjikgbtl: `${mSessionData.Zzjikgbt} / ${mSessionData.Zzjikcht}`,
          });
        } else {
          this.oApprovalRequestModel.setProperty('/ApplyInfo', mApporvalData);
        }
        return this;
      },

      setApprovalBoxData(mApporvalData) {
        this.oApprovalRequestModel.setProperty('/ApprovalDetails', mApporvalData);
        return this;
      },

      getStatus() {
        return this.oApprovalRequestModel.getProperty('/ZappStatAl');
      },

      getStatusText() {
        return TableUtils.StatusTxt(this.oApprovalRequestModel.getProperty('/ZappStatAl'));
      },

      isFormEditable() {
        const sStatus = this.getStatus();
        return !sStatus || parseInt(sStatus, 10) === 10;
      },

      /**
       * 임시저장 button click event handler
       */
      confirmSave() {
        AppUtils.setAppBusy(true, this);

        const sMessage = AppUtils.getBundleText('MSG_00006', 'LABEL_00104'); // {임시저장}하시겠습니까?
        const sActionYes = AppUtils.getBundleText('LABEL_00104'); // 임시저장

        MessageBox.confirm(sMessage, {
          actions: [sActionYes, MessageBox.Action.CANCEL],
          onClose: (sAction) => {
            if (!sAction || sAction === MessageBox.Action.CANCEL) {
              AppUtils.setAppBusy(false, this);
              return;
            }

            this.requestApproval({ sPrcty: 'T' });
          },
        });
      },

      /**
       * 신청 button click event handler
       */
      confirmRequest() {
        AppUtils.setAppBusy(true, this);

        try {
          this.oRequestDetail.validateRequestData();
        } catch (oError) {
          AppUtils.handleError(oError);
          AppUtils.setAppBusy(false, this);
          return;
        }

        const sMessage = AppUtils.getBundleText('MSG_00006', 'LABEL_00121'); // {신청}하시겠습니까?
        const sActionYes = AppUtils.getBundleText('LABEL_00121'); // 신청

        MessageBox.confirm(sMessage, {
          actions: [sActionYes, MessageBox.Action.CANCEL],
          onClose: (sAction) => {
            if (!sAction || sAction === MessageBox.Action.CANCEL) {
              AppUtils.setAppBusy(false, this);
              return;
            }

            this.requestApproval({ sPrcty: 'C' });
          },
        });
      },

      async requestApproval({ sPrcty = 'T' }) {
        try {
          await this.prepareAppno(); // 결재문서번호 채번
          await this.uploadFileAttachments(); // 첨부파일 업로드
          await this.oRequestDetail.requestApproval({ sAppno: this.getAppno(), sPrcty });

          const sMessage = AppUtils.getBundleText('MSG_00007', sPrcty === 'C' ? 'LABEL_00121' : 'LABEL_00104'); // {신청 : 임시저장}되었습니다.
          MessageBox.success(sMessage, {
            onClose: () => {
              if (sPrcty === 'C') {
                // 신청 후 action
                if (typeof this.oRequestDetail.onAfterRequestApproval === 'function') {
                  this.oRequestDetail.onAfterRequestApproval();
                } else {
                  this.oController.onNavBack();
                }
              } else if (sPrcty === 'T') {
                // 임시저장 후 action
                if (typeof this.oRequestDetail.onAfterSave === 'function') {
                  this.oRequestDetail.onAfterSave();
                }
              }
            },
          });
        } catch (oError) {
          AppUtils.debug('ApprovalRequest > requestApproval Error', oError);

          AppUtils.handleError(oError);
        } finally {
          AppUtils.setAppBusy(false, this);
        }
      },

      /**
       * 결재문서번호 채번
       */
      async prepareAppno() {
        let sAppno = this.getAppno();
        if (!sAppno) {
          sAppno = await Appno.get();
        }

        this.setAppno(sAppno);
      },

      /**
       * 첨부파일 업로드
       */
      async uploadFileAttachments() {
        if (this.oRequestDetail.showFileAttachmentBox()) {
          const iFileCount = this.oFileAttachmentBoxHandler.getFileCount();
          if (iFileCount) {
            await this.oFileAttachmentBoxHandler.upload(this.getAppno());
          }
        }
      },

      setController(oController) {
        this.oController = oController;
        return this;
      },

      getController() {
        return this.oController;
      },

      setApprovalRequestModel(oApprovalRequestModel) {
        this.oApprovalRequestModel = oApprovalRequestModel;
        return this;
      },

      getApprovalRequestModel() {
        return this.oApprovalRequestModel;
      },

      setBusy(bBusy = true, sPath = '/busy') {
        setTimeout(() => {
          this.oApprovalRequestModel.setProperty(sPath, bBusy);
        });
        return this;
      },
    });
  }
);
