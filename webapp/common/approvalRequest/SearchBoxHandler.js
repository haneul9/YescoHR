sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/DateUtils',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/approvalRequest/BoxHandler',
    'sap/ui/yesco/common/exceptions/UI5Error',
    'sap/ui/yesco/common/odata/Client',
  ],
  (
    // prettier 방지용 주석
    AppUtils,
    DateUtils,
    TableUtils,
    BoxHandler,
    UI5Error,
    Client
  ) => {
    'use strict';

    /**
     * class 실사용은 nightduty, leavOfAbsence 참고할 것
     */
    return BoxHandler.extend('sap.ui.yesco.common.approvalRequest.SearchBoxHandler', {
      onInit() {
        this.sApprovalRequestListTableId = this.oController.getApprovalRequestListTableId();
        this.oBoxModel.setData(
          {
            search: {
              busy: true,
              ...DateUtils.getFromToDates(this.getSearchPeriodConfig()),
              ...this.getSearchModelInitData(),
              approvalRequestList: [],
              approvalRequestListInfo: {
                title: this.getApprovalRequestListTitle(),
                infoMessage: this.getApprovalRequestListInfoMessage(),
                statusVisible: this.getApprovalRequestListStatusVisible(),
                statusText: this.getApprovalRequestListStatusText(),
                count: {
                  visibleRows: 1,
                  total: 0,
                  progress: 0,
                  request: 0,
                  approve: 0,
                  reject: 0,
                  complete: 0,
                },
              },
            },
          },
          true
        );
      },

      getSearchPeriodConfig() {
        // {common.approvalRequest.SearchBoxHandler} {getSearchPeriodConfig} function을 overriding 할 수 있습니다.
        this.debug(AppUtils.getBundleText('MSG_APRV002', 'common.approvalRequest.SearchBoxHandler', 'getSearchPeriodConfig'));
        return {
          fromDateFieldName: 'Apbeg',
          toDateFieldName: 'Apend',
          period: 1,
          periodUnit: 'month',
        };
      },

      getSearchModelInitData() {
        // {common.approvalRequest.SearchBoxHandler} {getSearchModelInitData} function을 overriding 할 수 있습니다.
        this.debug(AppUtils.getBundleText('MSG_APRV002', 'common.approvalRequest.SearchBoxHandler', 'getSearchModelInitData'));
        return {};
      },

      async onPressIcon() {
        try {
          this.setBusy();

          const aApprovalRequestListData = await this.readData();

          await this.onBeforeSetApprovalRequestListData(aApprovalRequestListData);
          this.setApprovalRequestListData(aApprovalRequestListData);
        } catch (oError) {
          this.debug('common.approvalRequest.SearchBoxHandler > onPressIcon', oError);

          AppUtils.handleError(oError);
        } finally {
          this.setBusy(false);
        }
      },

      async readData() {
        const { fromDateFieldName, toDateFieldName } = this.getSearchPeriodConfig();
        const oFromDate = this.getSearchProperty(fromDateFieldName);
        if (!oFromDate) {
          throw new UI5Error({ code: 'A', message: AppUtils.getBundleText('MSG_00066', 'LABEL_00202', 'LABEL_00266') }); // {조회조건}의 {신청일}의 시작일을 입력하세요.
        }
        const oToDate = this.getSearchProperty(toDateFieldName);
        if (!oToDate) {
          throw new UI5Error({ code: 'A', message: AppUtils.getBundleText('MSG_00067', 'LABEL_00202', 'LABEL_00266') }); // {조회조건}의 {신청일}의 종료일을 입력하세요.
        }
        const oModel = this.oController.getModel(this.getReadDataServiceName());
        const mFilters = {
          Prcty: 'L',
          Menid: this.oController.getCurrentMenuId(),
          [fromDateFieldName]: DateUtils.trimTime(oFromDate),
          [toDateFieldName]: DateUtils.trimTime(oToDate),
          ...this.getReadDataFilterMap(),
        };

        return Client.getEntitySet(oModel, this.getReadDataEntitySetName(), mFilters);
      },

      /**
       * @param {array} aApprovalRequestListData readData function에서 조회된 데이터
       */ // eslint-disable-next-line no-unused-vars
      async onBeforeSetApprovalRequestListData(aApprovalRequestListData) {
        // {common.approvalRequest.SearchBoxHandler} {onBeforeSetApprovalRequestListData} function을 overriding 할 수 있습니다.
        this.debug(AppUtils.getBundleText('MSG_APRV002', 'common.approvalRequest.SearchBoxHandler', 'onBeforeSetApprovalRequestListData'));
      },

      setApprovalRequestListData(aApprovalRequestListData) {
        const oTable = this.oController.byId(this.sApprovalRequestListTableId);

        this.setSearchProperty('approvalRequestList', aApprovalRequestListData);
        this.setSearchProperty('approvalRequestListInfo/count', TableUtils.getCount({ oTable, aRowData: aApprovalRequestListData }));
      },

      getApprovalRequestListTitle() {
        // {common.approvalRequest.SearchBoxHandler} {getApprovalRequestListTitle} function을 overriding 할 수 있습니다.
        this.debug(AppUtils.getBundleText('MSG_APRV002', 'common.approvalRequest.SearchBoxHandler', 'getApprovalRequestListTitle'));
        return this.oController.getBundleText('LABEL_00129'); // 신청내역
      },

      getApprovalRequestListInfoMessage() {
        // {common.approvalRequest.SearchBoxHandler} {getApprovalRequestListInfoMessage} function을 overriding 할 수 있습니다.
        this.debug(AppUtils.getBundleText('MSG_APRV002', 'common.approvalRequest.SearchBoxHandler', 'getApprovalRequestListInfoMessage'));
        return null;
      },

      getApprovalRequestListStatusVisible() {
        // {common.approvalRequest.SearchBoxHandler} {getApprovalRequestListStatusVisible} function을 overriding 할 수 있습니다.
        this.debug(AppUtils.getBundleText('MSG_APRV002', 'common.approvalRequest.SearchBoxHandler', 'getApprovalRequestListStatusVisible'));
        return {
          hideAll: false,
          progress: true,
          request: true,
          approve: true,
          reject: true,
          complete: true,
        };
      },

      getApprovalRequestListStatusText() {
        // {common.approvalRequest.SearchBoxHandler} {getApprovalRequestListStatusText} function을 overriding 할 수 있습니다.
        this.debug(AppUtils.getBundleText('MSG_APRV002', 'common.approvalRequest.SearchBoxHandler', 'getApprovalRequestListStatusText'));
        return {
          progress: this.oController.getBundleText('LABEL_00130'), // 작성중
          request: this.oController.getBundleText('LABEL_00121'), // 신청
          approve: this.oController.getBundleText('LABEL_00123'), // 승인
          reject: this.oController.getBundleText('LABEL_00124'), // 반려
          complete: this.oController.getBundleText('LABEL_00117'), // 완료
        };
      },

      setSearchProperty(sPropertyName, vValue) {
        this.oBoxModel.setProperty(`/search/${sPropertyName}`, vValue);
        return this;
      },

      getSearchProperty(sPropertyName) {
        return this.oBoxModel.getProperty(`/search/${sPropertyName}`);
      },

      setBusy(bBusy = true) {
        return this._setBusy(bBusy, '/search/busy');
      },
    });
  }
);
