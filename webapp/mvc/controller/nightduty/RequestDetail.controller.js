sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/ApprovalRequest',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/controller/nightduty/RequestDetail',
  ],
  (
    // prettier 방지용 주석
    ApprovalRequest,
    BaseController,
    RequestDetail
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.nightduty.RequestDetail', {
      oApprovalRequest: null,

      getApprovalType() {
        return 'HR05';
      },

      /**
       * Component.js에서 호출
       * @param {object} mRouteArguments
       * @returns
       */
      getCurrentLocationText(mRouteArguments) {
        const sAppno = ((mRouteArguments || {}).sAppno || '').replace(/^0$/, '');
        return sAppno ? this.getBundleText('LABEL_00100') : this.getBundleText('LABEL_00121'); // 조회 : 신청
      },

      getPreviousRouteName() {
        return 'nightduty';
      },

      getFileAttachmentBoxHandler() {
        return this.oApprovalRequest.getFileAttachmentBoxHandler();
      },

      async onObjectMatched(mRouteArguments) {
        const sAppno = ((mRouteArguments || {}).sAppno || '').replace(/^0$/, '');

        // 이전 버튼 클릭 후 다시 들어오는 경우를 위해
        this.oApprovalRequest = this.oApprovalRequest || new ApprovalRequest({ oController: this, oRequestDetail: new RequestDetail(this) });

        this.oApprovalRequest.setAppno(sAppno).showData();
      },

      /**
       * 신청내역 추가 button click event handler
       */
      onPressAddRowButton() {
        this.oApprovalRequest.getRequestDetail().openCurrentListDialog();
      },

      /**
       * 신청내역 삭제 button click event handler
       */
      onPressRemoveRowButton() {
        this.oApprovalRequest.getRequestDetail().removeToBeSchedule();
      },

      /**
       * 사원 선택 event handler
       */
      onSelectSuggestion(oEvent) {
        this.oApprovalRequest.getRequestDetail().onSelectSuggestion(oEvent);
      },

      onSubmitSuggest(oEvent) {
        this.oApprovalRequest.getRequestDetail().onSubmitSuggest(oEvent);
      },

      /**
       * 신청 button click event handler
       */
      onPressRequestApproval() {
        this.oApprovalRequest.confirmRequest();
      },
    });
  }
);
