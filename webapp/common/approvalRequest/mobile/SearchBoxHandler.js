sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/DateUtils',
    'sap/ui/yesco/common/approvalRequest/SearchBoxHandler',
  ],
  (
    // prettier 방지용 주석
    AppUtils,
    DateUtils,
    PCSearchBoxHandler
  ) => {
    'use strict';

    /**
     * class 실사용은 nightduty, leavOfAbsence 참고할 것
     */
    return PCSearchBoxHandler.extend('sap.ui.yesco.common.approvalRequest.mobile.SearchBoxHandler', {
      onInit() {
        const { periodKey, use1wButton, ...mSearchPeriodConfig } = this.getSearchPeriodConfig();
        this.oBoxModel.setData({
          search: {
            busy: true,
            use1wButton,
            periodKey,
            showDateRangeSelection: false,
            showFooter: true,
            ...DateUtils.getFromToDates(mSearchPeriodConfig),
            ...this.getSearchModelInitData(),
            approvalRequestList: [],
            approvalRequestListInfo: {
              title: this.getApprovalRequestListTitle(), // 목록 제목, default : 신청내역
              infoMessage: this.getApprovalRequestListInfoMessage(), // total count 우측에 보여질 안내 메세지
              statusVisible: this.getApprovalRequestListStatusVisible(), // 상태 텍스트 표시 여부
              statusText: this.getApprovalRequestListStatusText(), // 상태 텍스트
              count: {
                total: 0,
                progress: 0,
                request: 0,
                approve: 0,
                reject: 0,
                complete: 0,
              },
            },
          },
        });
        this.oController.getView().setModel(this.oBoxModel);
      },

      getSearchPeriodConfig() {
        // {common.approvalRequest.mobile.SearchBoxHandler} {getSearchPeriodConfig} function을 overriding 할 수 있습니다.
        this.debug(AppUtils.getBundleText('MSG_APRV002', 'common.approvalRequest.mobile.SearchBoxHandler', 'getSearchPeriodConfig'));
        return {
          fromDateFieldName: 'Apbeg',
          toDateFieldName: 'Apend',
          use1wButton: true,
          periodKey: '12m',
        };
      },

      getApprovalRequestListStatusVisible() {
        // {common.approvalRequest.mobile.SearchBoxHandler} {getApprovalRequestListStatusVisible} function을 overriding 할 수 있습니다.
        this.debug(AppUtils.getBundleText('MSG_APRV002', 'common.approvalRequest.mobile.SearchBoxHandler', 'getApprovalRequestListStatusVisible'));
        return {
          legendPopover: true,
          progress: true,
          request: true,
          approve: true,
          reject: true,
          complete: true,
        };
      },

      // SegmentedButton selectionChange event handler
      async onSelectionChangeSearchPeriodKey(oEvent) {
        this.setBusy();

        try {
          const oEventSource = oEvent.getSource();
          const sKey = oEventSource.getSelectedKey();
          const bShowDateRangeSelection = sKey === '0';

          setTimeout(() => {
            const oMobileSearchBox = oEventSource.getParent();
            if (oMobileSearchBox && oMobileSearchBox.hasStyleClass('search-box')) {
              oMobileSearchBox.toggleStyleClass('search-box-expanded', bShowDateRangeSelection);
            }
            this.setSearchProperty('showDateRangeSelection', bShowDateRangeSelection);
          });

          const oPastMoment = DateUtils.getMoment(); // time trimmed moment
          const oToday = oPastMoment.toDate();

          switch (sKey) {
            case '1w':
              oPastMoment.subtract(7, 'days');
              break;
            case '1m':
              oPastMoment.subtract(1, 'months').add(1, 'days');
              break;
            case '3m':
              oPastMoment.subtract(3, 'months').add(1, 'days');
              break;
            case '6m':
              oPastMoment.subtract(6, 'months').add(1, 'days');
              break;
            case '12m':
              oPastMoment.subtract(1, 'years').add(1, 'days');
              break;
            default:
          }

          if (!bShowDateRangeSelection) {
            const { fromDateFieldName, toDateFieldName } = this.getSearchPeriodConfig();
            this.setSearchProperty(fromDateFieldName, oPastMoment.toDate()); // 과거 일자
            this.setSearchProperty(toDateFieldName, oToday); // 오늘

            this.onPressIcon();
          }
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          this.setBusy(false);
        }
      },

      // DareRangeSelection change event handler
      onChangeSearchDateRange(oEvent) {
        this.onPressIcon(oEvent);
      },

      setApprovalRequestListData(aApprovalRequestListData) {
        this.setSearchProperty('approvalRequestList', aApprovalRequestListData);
        this.setSearchProperty('approvalRequestListInfo/count', {
          total: aApprovalRequestListData.length,
          progress: 0,
          request: 0,
          approve: 0,
          reject: 0,
          complete: 0,
        });
      },
    });
  }
);
