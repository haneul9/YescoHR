sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/base/Object',
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/Appno',
    'sap/ui/yesco/common/AttachFileAction',
    'sap/ui/yesco/common/TableUtils',
  ],
  (
    // prettier 방지용 주석
    BaseObject,
    JSONModel,
    Appno,
    AttachFileAction,
    TableUtils
  ) => {
    'use strict';

    return BaseObject.extend('sap.ui.yesco.common.ApprovalRequestHelper', {
      sApplyInfoId: 'applyInfo',
      sApprovalDetailsId: 'approvalDetails',

      /**
       * @override
       */
      constructor: function (oController) {
        const oModel = new JSONModel({
          Appno: null,
          ApplyInfo: null,
          ApprovalDetails: null,
        });

        this.oController = oController;
        this.oApprovalRequestModel = oModel;

        oController.byId(this.sApplyInfoId).setModel(oModel);
        oController.byId(this.sApprovalDetailsId).setModel(oModel);
      },

      setAppno(vAppno) {
        const sAppno = vAppno || '';
        this.oApprovalRequestModel.setProperty('/Appno', sAppno === '0' ? '' : sAppno);
        return this;
      },

      getAppno() {
        return this.oApprovalRequestModel.getProperty('/Appno');
      },

      /**
       *
       * @param {object} mApporvalData
       * @param {boolean} bAttachFiles 파일첨부처리 여부
       * @returns
       */
      setData(mApporvalData, bAttachFiles = false) {
        if (bAttachFiles) {
          this.setAttachBoxData(mApporvalData);
        }
        this.setApplyInfoBoxData(mApporvalData);
        this.setApprovalBoxData(mApporvalData);
        return this;
      },

      setAttachBoxData() {
        const sAppno = this.getAppno();
        const bEditable = this.isFormEditable();
        const sType = this.oController.getApprovalDocTypeCode(); // HR01과 같은 코드반환 function을 controller에 선언할 것

        AttachFileAction.setAttachFile(this.oController, {
          Editable: bEditable,
          Type: sType,
          Appno: sAppno,
          Max: 10,
          FileTypes: 'jpg,jpeg,pdf,doc,docx,ppt,pptx,xls,xlsx,bmp,png'.split(','),
        });
      },

      setApplyInfoBoxData(mApporvalData) {
        if (_.isEmpty(mApporvalData)) {
          const mAppointeeData = this.oController.getAppointeeData();

          this.oApprovalRequestModel.setProperty('/ApplyInfo', {
            Apename: mAppointeeData.Ename,
            Aporgtx: `${mAppointeeData.Btrtx}/${mAppointeeData.Orgtx}`,
            Apjikgbtl: `${mAppointeeData.Zzjikgbt}/${mAppointeeData.Zzjiktlt}`,
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

      confirmRequest() {
        AppUtils.setAppBusy(true, this);

        const bValid = this.oController.validateRequestData();
        if (!bValid) {
          AppUtils.setAppBusy(false, this);
          return;
        }

        const sMessage = this.oController.getBundleText('MSG_00006', 'LABEL_00121'); // {신청}하시겠습니까?
        const sActionYes = this.oController.getBundleText('LABEL_00121'); // 신청

        MessageBox.confirm(sMessage, {
          actions: [sActionYes, MessageBox.Action.CANCEL],
          onClose: (sAction) => {
            if (!sAction || sAction === MessageBox.Action.CANCEL) {
              AppUtils.setAppBusy(false, this);
              return;
            }

            this.requestApproval();
          },
        });
      },

      async requestApproval(oData) {
        try {
          await this.prepareRequest(true); // 결재문서번호 채번, 파일첨부처리

          await this.oController.requestApproval(oData);

          const sMessage = this.oController.getBundleText('MSG_00007', 'LABEL_00121'); // {신청}되었습니다.
          MessageBox.success(sMessage, {
            onClose: () => {
              this.oController.onAfterRequestApproval();
            },
          });
        } catch (oError) {
          AppUtils.debug('ApprovalRequestHelper > requestApproval Error', oError);

          AppUtils.handleError(oError);
        } finally {
          AppUtils.setAppBusy(false, this);
        }
      },

      /**
       * 결재문서번호 채번, 파일첨부처리
       * @param {boolean} bAttachFiles 파일첨부처리 여부
       */
      async prepareRequest(bAttachFiles = false) {
        let sAppno = this.getAppno();
        if (!sAppno) {
          sAppno = await Appno.get();

          this.setAppno(sAppno);
        }

        if (bAttachFiles) {
          const iAttachLength = AttachFileAction.getFileLength.call(this);
          if (iAttachLength > 0) {
            await AttachFileAction.uploadFile.call(this, sAppno, this.oController.getDocumentType());
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

      setBusy(sPath = '/busy', bBusy = true) {
        setTimeout(() => {
          this.oApprovalRequestModel.setProperty(sPath, bBusy);
        });
        return this;
      },
    });
  }
);
