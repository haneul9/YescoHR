sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/Appno',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/FileAttachmentBoxHandler',
    'sap/ui/yesco/common/exceptions/UI5Error',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    // prettier 방지용 주석
    JSONModel,
    Appno,
    AppUtils,
    FileAttachmentBoxHandler,
    UI5Error,
    MessageBox,
    BaseController
  ) => {
    'use strict';

    /**
     * class 실사용은 nightduty, leavOfAbsence 참고할 것
     */
    return BaseController.extend('sap.ui.yesco.common.approvalRequest.DetailController', {
      oApprovalRequestDetailDataHandler: null,

      /**
       * onObjectMatched의 신청 상세 버전 function
       * @param {object} mParameter
       */
      onObjectMatchedForRequestDetail({ sAppno }) {
        try {
          const { approvalType, statusFieldName } = this.getApprovalRequestConfig();

          if (!approvalType) {
            // commmon.approvalRequest.DetailController getApprovalRequestConfig function으로 제공된 object에 approvalType이 없습니다.
            throw new UI5Error({ message: this.getBundleText('MSG_APRV004') });
          }
          if (!statusFieldName) {
            // commmon.approvalRequest.DetailController getApprovalRequestConfig function으로 제공된 object에 statusFieldName이 없습니다.
            throw new UI5Error({ message: this.getBundleText('MSG_APRV005') });
          }

          this.oApprovalRequestDetailDataHandler = this.oApprovalRequestDetailDataHandler || this.getApprovalRequestDetailDataHandler();

          const mInitData = this.oApprovalRequestDetailDataHandler.getApprovalRequestModelInitDetailData();
          this.oApprovalRequestModel = new JSONModel({
            approvalRequestConfig: {
              approvalType,
              statusFieldName,
              status: null,
              editable: false,
              enabled: false,
            },
            approvalRequestDetail: {
              ...mInitData,
              Appno: sAppno === '0' ? '' : sAppno,
            },
            ApplyInfo: null,
            ApprovalDetails: null,
          });
          this.oApprovalRequestDetailDataHandler.onAfterInitModel(this.oApprovalRequestModel);
          this.setViewModel(this.oApprovalRequestModel);

          this.mFileAttachmentBoxConfig = this.getFileAttachmentBoxConfig();

          this.setFileAttachmentBoxData() // 결재 공통 정보(첨부파일 정보) 세팅
            ._showData();
        } catch (oError) {
          this.debug('commmon.approvalRequest.DetailController > onObjectMatchedForRequestDetail', oError);

          AppUtils.handleError(oError);
        }
      },

      getApprovalRequestModel() {
        return this.oApprovalRequestModel;
      },

      setConfigProperty(sPropertyName, vValue) {
        this.oApprovalRequestModel.setProperty(`/approvalRequestConfig/${sPropertyName}`, vValue);
        return this;
      },

      getConfigProperty(sPropertyName) {
        return this.oApprovalRequestModel.getProperty(`/approvalRequestConfig/${sPropertyName}`);
      },

      mergeConfigData(mData = {}) {
        const oApprovalRequestModel = this.oApprovalRequestModel;
        if (mData.approvalRequestConfig) {
          oApprovalRequestModel.setData(mData, true);
        } else {
          oApprovalRequestModel.setData({ approvalRequestConfig: mData }, true);
        }
        return this;
      },

      getConfigData() {
        return this.oApprovalRequestModel.getProperty('/approvalRequestConfig');
      },

      setDetailProperty(sPropertyName, vValue) {
        this.oApprovalRequestModel.setProperty(`/approvalRequestDetail/${sPropertyName}`, vValue);
        return this;
      },

      getDetailProperty(sPropertyName) {
        return this.oApprovalRequestModel.getProperty(`/approvalRequestDetail/${sPropertyName}`);
      },

      mergeDetailData(mData = {}) {
        const oApprovalRequestModel = this.oApprovalRequestModel;
        if (mData.approvalRequestDetail) {
          oApprovalRequestModel.setData(mData, true);
        } else {
          oApprovalRequestModel.setData({ approvalRequestDetail: mData }, true);
        }
        return this;
      },

      getDetailData() {
        return this.oApprovalRequestModel.getProperty('/approvalRequestDetail');
      },

      /**
       * Component.js에서 호출
       * @param {object} mRouteArguments
       * @returns
       */
      getCurrentLocationText({ sAppno }) {
        return sAppno === '0' ? this.getBundleText('LABEL_00121') : this.getBundleText('LABEL_00100'); // 신청 : 조회
      },

      /**
       * @abstract
       */
      getPreviousRouteName() {
        // {commmon.approvalRequest.DetailController} {getPreviousRouteName} function을 구현하세요.
        throw new UI5Error({ message: this.getBundleText('MSG_APRV001', 'commmon.approvalRequest.DetailController', 'getPreviousRouteName') });
      },

      /**
       * @abstract
       */
      getApprovalRequestConfig() {
        // {commmon.approvalRequest.DetailController} {getApprovalRequestConfig} function을 구현하세요.
        throw new UI5Error({ message: this.getBundleText('MSG_APRV001', 'commmon.approvalRequest.DetailController', 'getApprovalRequestConfig') });
      },

      /**
       * @abstract
       */
      getApprovalRequestDetailDataHandler() {
        // {commmon.approvalRequest.DetailController} {getApprovalRequestDetailDataHandler} function을 구현하세요.
        throw new UI5Error({ message: this.getBundleText('MSG_APRV001', 'commmon.approvalRequest.DetailController', 'getApprovalRequestDetailDataHandler') });
      },

      /**
       * 신청 상세 첨부 파일 설정값 반환
       */
      getFileAttachmentBoxConfig() {
        // {commmon.approvalRequest.DetailController} {getFileAttachmentBoxConfig} function을 overriding 할 수 있습니다.
        this.debug(this.getBundleText('MSG_APRV002', 'commmon.approvalRequest.DetailController', 'getFileAttachmentBoxConfig'));
        return {
          use: false, // 첨부파일 사용 여부, false인 경우 FileAttachmentBoxHandler 객체를 생성하지 않음
          maxAttachableFileCount: 10, // 첨부가능 파일 갯수
          fileTypes: 'ppt,pptx,doc,docx,xls,xlsx,jpg,jpeg,bmp,gif,png,pdf'.split(','), // 첨부가능 파일 확장자
        };
      },

      useFileAttachmentBox() {
        return this.mFileAttachmentBoxConfig.use;
      },

      setFileAttachmentBoxData() {
        const { maxAttachableFileCount, fileTypes, use } = this.mFileAttachmentBoxConfig;
        if (!use) {
          return;
        }

        const sAppno = this.getAppno();
        const sApprovalType = this.getConfigProperty('approvalType');

        this.oFileAttachmentBoxHandler = new FileAttachmentBoxHandler(this, {
          appno: sAppno,
          apptp: sApprovalType,
          maxFileCount: maxAttachableFileCount || 10,
          fileTypes: fileTypes || 'ppt,pptx,doc,docx,xls,xlsx,jpg,jpeg,bmp,gif,png,pdf'.split(','),
        });

        return this;
      },

      async _showData() {
        try {
          await this.oApprovalRequestDetailDataHandler.onBeforeReadData();

          const sAppno = this.getAppno();
          const aResultsData = sAppno ? await this.oApprovalRequestDetailDataHandler.readData(sAppno) : []; // 신청 상세 정보 조회 위임
          const [mApprovalRequestData = {}] = aResultsData;

          const sStatusFieldName = this.getConfigProperty('statusFieldName');
          const sStatus = mApprovalRequestData[sStatusFieldName] || '';
          this.setStatus(sStatus);

          const bFormEditable = this.isFormEditable(); // Status 지정 후 실행되어야 함
          this.setEditable(bFormEditable);
          this.setEnabled(true);
          if (AppUtils.isMobile()) {
            this.setConfigProperty('showFooter', this.getShowFooterStatuses().includes(sStatus));
          }

          setTimeout(() => {
            this.oApprovalRequestDetailDataHandler.showData(aResultsData, bFormEditable); // 신청 상세 정보 가공 위임
          });
          setTimeout(() => {
            if (this.useFileAttachmentBox()) {
              this.oFileAttachmentBoxHandler.setVisible(this.oApprovalRequestDetailDataHandler.showFileAttachmentBox()).setEditable(bFormEditable);
            }
          });
          setTimeout(() => {
            this.setApplyInfoBoxData(mApprovalRequestData); // 신청자 정보 세팅(결재 공통)
          });
          setTimeout(() => {
            this.setApprovalBoxData(mApprovalRequestData); // 결재내역 정보 세팅(결재 공통)
          });
        } catch (oError) {
          this.debug('commmon.approvalRequest.DetailController > _showData', oError);

          if (oError instanceof Error) {
            oError = new UI5Error({ message: this.getBundleText('MSG_00043') }); // 잘못된 접근입니다.
          }

          AppUtils.handleError(oError, {
            onClose: () => this.onNavBack(),
          });
        }

        return this;
      },

      setAppno(sAppno) {
        this.setDetailProperty('Appno', sAppno);
        return this;
      },

      getAppno() {
        return this.getDetailProperty('Appno');
      },

      isFormEditable() {
        // {commmon.approvalRequest.DetailController} {isFormEditable} function을 overriding 할 수 있습니다.
        this.debug(this.getBundleText('MSG_APRV002', 'commmon.approvalRequest.DetailController', 'isFormEditable'));
        const sStatus = this.getStatus();
        return !sStatus || sStatus === '10';
      },

      setEditable(bEditable) {
        this.setConfigProperty('editable', bEditable);
        return this;
      },

      setEnabled(bEnabled) {
        this.setConfigProperty('enabled', bEnabled);
        return this;
      },

      getShowFooterStatuses() {
        // {commmon.approvalRequest.DetailController} {getShowFooterStatuses} function을 overriding 할 수 있습니다.
        this.debug(this.getBundleText('MSG_APRV002', 'commmon.approvalRequest.DetailController', 'getShowFooterStatuses'));
        return ['', '10', '45', '65'];
      },

      setStatus(sStatus) {
        this.setConfigProperty('status', sStatus);
        return this;
      },

      getStatus() {
        return this.getConfigProperty('status');
      },

      getStatusText() {
        return TableUtils.StatusTxt(this.getStatus());
      },

      setApplyInfoBoxData(mApprovalRequestData) {
        if (_.isEmpty(mApprovalRequestData)) {
          const mSessionData = this.getAppointeeData();

          this.oApprovalRequestModel.setProperty('/ApplyInfo', {
            Apename: mSessionData.Ename,
            Aporgtx: `${mSessionData.Btrtx} / ${mSessionData.Orgtx}`,
            Apjikgbtl: `${mSessionData.Zzjikgbt} / ${mSessionData.Zzjikcht}`,
          });
        } else {
          this.oApprovalRequestModel.setProperty('/ApplyInfo', mApprovalRequestData);
        }
        return this;
      },

      setApprovalBoxData(mApprovalRequestData) {
        this.oApprovalRequestModel.setProperty('/ApprovalDetails', mApprovalRequestData);
        return this;
      },

      /**
       * 재작성 button click event handler
       */
      onPressRewrite() {
        // this.setEnabled(false); // 재작성은 버튼 비활성화 하지 않음 : 취소시 Enabled true를 주면 모든 입력 필드가 풀리기 때문
        AppUtils.setAppBusy(true);

        const sMessage = this.getBundleText('MSG_00006', 'LABEL_00120'); // {재작성}하시겠습니까?
        const sActionYes = this.getBundleText('LABEL_00120'); // 재작성
        const aActions = [sActionYes, MessageBox.Action.CANCEL];

        MessageBox.confirm(sMessage, {
          actions: AppUtils.isMobile() ? _.reverse(aActions) : aActions,
          onClose: (sAction) => {
            if (!sAction || sAction === MessageBox.Action.CANCEL) {
              AppUtils.setAppBusy(false);
              return;
            }

            this.oApprovalRequestDetailDataHandler.rewrite();
            this.oApprovalRequestDetailDataHandler.onAfterRewrite();
            AppUtils.setAppBusy(false);
          },
        });
      },

      /**
       * 임시저장 button click event handler
       */
      onPressSave() {
        this.setEnabled(false);
        AppUtils.setAppBusy(true);

        const sMessage = this.getBundleText('MSG_00006', 'LABEL_00103'); // {저장}하시겠습니까?
        const sActionYes = this.getBundleText('LABEL_00103'); // 저장
        const aActions = [sActionYes, MessageBox.Action.CANCEL];

        MessageBox.confirm(sMessage, {
          actions: AppUtils.isMobile() ? _.reverse(aActions) : aActions,
          onClose: (sAction) => {
            if (!sAction || sAction === MessageBox.Action.CANCEL) {
              this.setEnabled(true);
              AppUtils.setAppBusy(false);
              return;
            }

            this._requestApproval({ sPrcty: 'T' });
          },
        });
      },

      /**
       * 신청 button click event handler
       */
      onPressRequestApproval() {
        this.setEnabled(false);
        AppUtils.setAppBusy(true);

        try {
          this.oApprovalRequestDetailDataHandler.validateRequestData();
        } catch (oError) {
          AppUtils.handleError(oError);
          this.setEnabled(true);
          AppUtils.setAppBusy(false);
          return;
        }

        const sMessage = this.getBundleText('MSG_00006', 'LABEL_00121'); // {신청}하시겠습니까?
        const sActionYes = this.getBundleText('LABEL_00121'); // 신청
        const aActions = [sActionYes, MessageBox.Action.CANCEL];

        MessageBox.confirm(sMessage, {
          actions: AppUtils.isMobile() ? _.reverse(aActions) : aActions,
          onClose: (sAction) => {
            if (!sAction || sAction === MessageBox.Action.CANCEL) {
              this.setEnabled(true);
              AppUtils.setAppBusy(false);
              return;
            }

            this._requestApproval({ sPrcty: 'C' });
          },
        });
      },

      async _requestApproval({ sPrcty = 'T' }) {
        try {
          await this.prepareAppno(); // 결재문서번호 채번
          await this.uploadFileAttachments(); // 첨부파일 업로드
          await this.oApprovalRequestDetailDataHandler.requestApproval({ sAppno: this.getAppno(), sPrcty });

          const sMessage = this.getBundleText('MSG_00007', sPrcty === 'C' ? 'LABEL_00121' : 'LABEL_00103'); // {신청 : 저장}되었습니다.
          MessageBox.alert(sMessage, {
            onClose: () => {
              if (sPrcty === 'C') {
                // 신청 후 action
                this.oApprovalRequestDetailDataHandler.onAfterRequestApproval();
              } else if (sPrcty === 'T') {
                // 임시저장 후 action
                this.oApprovalRequestDetailDataHandler.onAfterSave();
              }
            },
          });
        } catch (oError) {
          AppUtils.debug('commmon.approvalRequest.DetailController > _requestApproval', oError);

          AppUtils.handleError(oError);
        } finally {
          this.setEnabled(true);
          AppUtils.setAppBusy(false);
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
        if (this.useFileAttachmentBox()) {
          const iFileCount = this.oFileAttachmentBoxHandler.getFileCount();
          if (iFileCount) {
            await this.oFileAttachmentBoxHandler.upload(this.getAppno());
          }
        }
      },

      /**
       * 삭제 button click event handler
       */
      onPressRemove() {
        this.setEnabled(false);
        AppUtils.setAppBusy(true);

        const sMessage = this.getBundleText('MSG_00006', 'LABEL_00110'); // {삭제}하시겠습니까?
        const sActionYes = this.getBundleText('LABEL_00110'); // 삭제
        const aActions = [sActionYes, MessageBox.Action.CANCEL];

        MessageBox.confirm(sMessage, {
          actions: AppUtils.isMobile() ? _.reverse(aActions) : aActions,
          onClose: async (sAction) => {
            if (!sAction || sAction === MessageBox.Action.CANCEL) {
              this.setEnabled(true);
              AppUtils.setAppBusy(false);
              return;
            }

            try {
              await this.oApprovalRequestDetailDataHandler.removeRequestApproval({ sAppno: this.getAppno() });

              const sMessage = this.getBundleText('MSG_00007', 'LABEL_00110'); // {삭제}되었습니다.
              MessageBox.alert(sMessage, {
                onClose: () => {
                  this.oApprovalRequestDetailDataHandler.onAfterRemove();
                },
              });
            } catch (oError) {
              this.debug('commmon.approvalRequest.DetailController > onPressRemove', oError);

              AppUtils.handleError(oError);
            } finally {
              this.setEnabled(true);
              AppUtils.setAppBusy(false);
            }
          },
        });
      },
    });
  }
);
