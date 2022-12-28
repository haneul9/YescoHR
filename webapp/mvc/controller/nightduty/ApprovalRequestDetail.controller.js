sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/approvalRequest/DetailController',
    'sap/ui/yesco/mvc/controller/nightduty/ApprovalRequestDetailDataHandler',
  ],
  (
    // prettier 방지용 주석
    ApprovalRequestDetailController,
    ApprovalRequestDetailDataHandler
  ) => {
    'use strict';

    return ApprovalRequestDetailController.extend('sap.ui.yesco.mvc.controller.nightduty.ApprovalRequestDetail', {
      getPreviousRouteName() {
        return 'nightduty';
      },

      getApprovalRequestConfig() {
        return {
          approvalType: 'HR05',
          statusFieldName: 'ZappStatAl',
        };
      },

      getApprovalRequestDetailDataHandler() {
        return new ApprovalRequestDetailDataHandler(this);
      },

      getFileAttachmentBoxConfig() {
        return {
          use: true,
        };
      },

      /**
       * 신청내역 추가 button click event handler
       */
      onPressAddRowButton() {
        this.oApprovalRequestDetailDataHandler.openCurrentListDialog();
      },

      /**
       * 신청내역 삭제 button click event handler
       */
      onPressRemoveRowButton() {
        this.oApprovalRequestDetailDataHandler.removeToBeSchedule();
      },

      /**
       * 사원 선택 event handler
       */
      onSelectSuggestion(oEvent) {
        this.oApprovalRequestDetailDataHandler.onSelectSuggestion(oEvent);
      },

      onSubmitSuggest(oEvent) {
        this.oApprovalRequestDetailDataHandler.onSubmitSuggest(oEvent);
      },
    });
  }
);
