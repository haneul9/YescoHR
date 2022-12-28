sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/approvalRequest/DetailController',
    'sap/ui/yesco/mvc/controller/leaveOfAbsence/ApprovalRequestDetailDataHandler',
  ],
  (
    // prettier 방지용 주석
    ApprovalRequestDetailController,
    ApprovalRequestDetailDataHandler
  ) => {
    'use strict';

    return ApprovalRequestDetailController.extend('sap.ui.yesco.mvc.controller.leaveOfAbsence.ApprovalRequestDetail', {
      getPreviousRouteName() {
        return 'leaveOfAbsence';
      },

      getApprovalRequestConfig() {
        return {
          approvalType: 'HR20',
          statusFieldName: 'ZappStatAl',
        };
      },

      getApprovalRequestDetailDataHandler() {
        return new ApprovalRequestDetailDataHandler(this);
      },

      getFileAttachmentBoxConfig() {
        return {
          use: true,
          maxAttachableFileCount: 2,
        };
      },

      onSelectionChangeAppty(oEvent) {
        const mItemProperty = oEvent.getParameter('selectedItem').getBindingContext().getProperty();
        this.oApprovalRequestDetailDataHandler.setFieldControl(mItemProperty);
        this.getFileAttachmentBoxHandler().setDescription(mItemProperty.Zprint).setVisible(this.oApprovalRequestDetailDataHandler.showFileAttachmentBox());
      },

      onChangeBegda(oEvent) {
        this.oApprovalRequestDetailDataHandler.calculatePeriod(oEvent, ['MSG_00064', 'LABEL_50103', 'LABEL_50104']); // {시작일}이 {종료일} 이후입니다.
      },

      onChangeEndda(oEvent) {
        this.oApprovalRequestDetailDataHandler.calculatePeriod(oEvent, ['MSG_00065', 'LABEL_50104', 'LABEL_50103']); // {종료일}이 {시작일} 이전입니다.
      },
    });
  }
);
