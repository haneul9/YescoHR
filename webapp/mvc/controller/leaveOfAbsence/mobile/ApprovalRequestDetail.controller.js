sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/mvc/controller/leaveOfAbsence/ApprovalRequestDetail.controller',
  ],
  (
    // prettier 방지용 주석
    PCApprovalRequestDetailController
  ) => {
    'use strict';

    return PCApprovalRequestDetailController.extend('sap.ui.yesco.mvc.controller.leaveOfAbsence.mobile.ApprovalRequestDetail', {
      getPreviousRouteName() {
        return 'mobile_leaveOfAbsence';
      },

      getCurrentLocationText() {
        return this.getBundleText('LABEL_50001'); // 휴복직 신청
      },

      onSelectionChangeAppty(oEvent) {
        const mItemProperty = oEvent.getParameter('changedItem').getBindingContext().getProperty();
        this.oApprovalRequestDetailDataHandler.setFieldControl(mItemProperty);
        this.getFileAttachmentBoxHandler().setDescription(mItemProperty.Zprint).setVisible(this.oApprovalRequestDetailDataHandler.showFileAttachmentBox());
      },
    });
  }
);
