sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/yesco/common/approvalRequest/ListController',
  ],
  (
    // prettier 방지용 주석
    Fragment,
    PCApprovalRequestListController
  ) => {
    'use strict';

    return PCApprovalRequestListController.extend('sap.ui.yesco.common.approvalRequest.mobile.ListController', {
      getOverviewBoxHandler() {
        return null;
      },

      // SegmentedButton selectionChange event handler
      onSelectionChangeSearchPeriodKey(oEvent) {
        this.oSearchBoxHandler.onSelectionChangeSearchPeriodKey(oEvent);
      },

      // DareRangeSelection change event handler
      onChangeSearchDateRange(oEvent) {
        this.oSearchBoxHandler.onChangeSearchDateRange(oEvent);
      },

      async onPressMobileApprovalRequestListDescription(oEvent) {
        // {common.approvalRequest.mobile.ListController} {onPressMobileApprovalRequestListDescription} function을 overriding 할 수 있습니다.
        this.debug(this.getBundleText('MSG_APRV002', 'common.approvalRequest.mobile.ListController', 'onPressMobileApprovalRequestListDescription'));

        if (this.oMobileApprovalRequestListDescriptionPopover && this.oMobileApprovalRequestListDescriptionPopover.isOpen()) {
          this.oMobileApprovalRequestListDescriptionPopover.close();
        } else {
          const oButton = oEvent.getSource();

          if (!this.oMobileApprovalRequestListDescriptionPopover) {
            this.oMobileApprovalRequestListDescriptionPopover = await Fragment.load({
              name: 'sap.ui.yesco.fragment.mobile.DescriptionPopover',
              controller: this,
            });
            this.oMobileApprovalRequestListDescriptionPopover.setModel(this.getViewModel()).bindElement('/search/approvalRequestListInfo');
          }

          this.oMobileApprovalRequestListDescriptionPopover.openBy(oButton);
        }
      },

      async onPressMobileApprovalRequestListStatusLegendPopover(oEvent) {
        // {common.approvalRequest.mobile.ListController} {onPressMobileApprovalRequestListStatusLegendPopover} function을 overriding 할 수 있습니다.
        this.debug(this.getBundleText('MSG_APRV002', 'common.approvalRequest.mobile.ListController', 'onPressMobileApprovalRequestListStatusLegendPopover'));

        if (this.oMobileApprovalRequestListStatusLegendPopover && this.oMobileApprovalRequestListStatusLegendPopover.isOpen()) {
          this.oMobileApprovalRequestListStatusLegendPopover.close();
        } else {
          const oButton = oEvent.getSource();

          if (!this.oMobileApprovalRequestListStatusLegendPopover) {
            const oView = this.getView();

            this.oMobileApprovalRequestListStatusLegendPopover = await Fragment.load({
              id: oView.getId(),
              name: 'sap.ui.yesco.fragment.approvalRequest.mobile.ListStatusLegendPopover',
              controller: this,
            });

            oView.addDependent(this.oMobileApprovalRequestListStatusLegendPopover);
          }

          this.oMobileApprovalRequestListStatusLegendPopover.openBy(oButton);
        }
      },

      onSelectRow(oEvent) {
        const sAppno = oEvent.getSource().getBindingContext().getProperty('Appno');

        this.getRouter().navTo(`${this.sRouteName}-detail`, { sAppno });
      },
    });
  }
);
