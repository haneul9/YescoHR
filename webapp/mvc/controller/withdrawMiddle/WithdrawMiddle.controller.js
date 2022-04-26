sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/AttachFileAction',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/TextUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/model/type/Date',
    'sap/ui/yesco/mvc/model/type/Currency',
  ],
  (
    // prettier 방지용 주석
    AppUtils,
    AttachFileAction,
    TableUtils,
    TextUtils,
    Client,
    ServiceNames,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.withdrawMiddle.WithdrawMiddle', {
      AttachFileAction: AttachFileAction,
      TableUtils: TableUtils,
      TextUtils: TextUtils,

      initializeModel() {
        return {
          busy: false,
          Data: [],
          routeName: '',
          Total: {
            Count: '',
            Pay: '',
          },
          searchDate: {
            date: new Date(),
            secondDate: new Date(1900, 0, 1),
          },
          listInfo: {
            isShowProgress: true,
            isShowApply: true,
            isShowApprove: true,
            isShowReject: true,
            isShowComplete: true,
            rowCount: 1,
            totalCount: 0,
            progressCount: 0,
            applyCount: 0,
            approveCount: 0,
            rejectCount: 0,
            completeCount: 0,
          },
        };
      },

      async onObjectMatched(oParameter, sRouteName) {
        const oListModel = this.getViewModel();
        const oModel = this.getModel(ServiceNames.PAY);

        try {
          oListModel.setProperty('/busy', true);
          oListModel.setProperty('/routeName', sRouteName);

          const mSearch = oListModel.getProperty('/searchDate');
          const mPayLoad = {
            Apbeg: moment(mSearch.secondDate).hours(9).toDate(),
            Apend: moment(mSearch.date).hours(9).toDate(),
            Menid: this.getCurrentMenuId(),
            Pernr: this.getAppointeeProperty('Pernr'),
          };
          // 중도인출 List
          const aTableList = await Client.getEntitySet(oModel, 'MidWithdraw', mPayLoad);
          const oTable = this.byId('withdrawTable');

          oListModel.setProperty('/listInfo', TableUtils.count({ oTable, aRowData: aTableList }));
          oListModel.setProperty('/listInfo/isShowProgress', false);
          oListModel.setProperty('/listInfo/isShowApply', true);
          oListModel.setProperty('/listInfo/isShowApprove', false);
          oListModel.setProperty('/listInfo/isShowReject', true);
          oListModel.setProperty('/listInfo/isShowComplete', true);
          oListModel.setProperty('/List', aTableList);

          // 나의 중도인출
          const mMyTotal = this.withDrawCalculat(aTableList);

          oListModel.setProperty('/Total', mMyTotal);
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oListModel.setProperty('/busy', false);
        }
      },

      // 대상자 정보 사원선택시 화면 Refresh
      async callbackAppointeeChange() {
        const oListModel = this.getViewModel();
        const oModel = this.getModel(ServiceNames.PAY);

        try {
          oListModel.setProperty('/busy', true);

          const mSearch = oListModel.getProperty('/searchDate');
          const mPayLoad = {
            Apbeg: moment(mSearch.secondDate).hours(9).toDate(),
            Apend: moment(mSearch.date).hours(9).toDate(),
            Menid: this.getCurrentMenuId(),
            Pernr: this.getAppointeeProperty('Pernr'),
          };
          // 중도인출 List
          const aTableList = await Client.getEntitySet(oModel, 'MidWithdraw', mPayLoad);
          const oTable = this.byId('withdrawTable');

          oListModel.setProperty('/listInfo', TableUtils.count({ oTable, aRowData: aTableList }));
          oListModel.setProperty('/listInfo/isShowProgress', false);
          oListModel.setProperty('/listInfo/isShowApply', true);
          oListModel.setProperty('/listInfo/isShowApprove', false);
          oListModel.setProperty('/listInfo/isShowReject', true);
          oListModel.setProperty('/listInfo/isShowComplete', true);
          oListModel.setProperty('/List', aTableList);

          // 나의 중도인출
          const mMyTotal = this.withDrawCalculat(aTableList);

          oListModel.setProperty('/Total', mMyTotal);
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oListModel.setProperty('/busy', false);
        }
      },

      // 나의 중도인출 계산
      withDrawCalculat(aTableList = []) {
        const iListSize = _.size(aTableList);
        let aReList = {};

        if (!iListSize) {
          aReList = {
            Pay: '0',
            Count: '0',
          };
        } else {
          _.chain(aReList)
            .set(
              'Pay',
              _.reduce(_.map(_.map(aTableList, 'Wtamt'), _.parseInt), (acc, cur) => {
                return acc + cur;
              }).toLocaleString()
            )
            .set('Count', iListSize)
            .value();
        }

        return aReList;
      },

      onClick() {
        this.getRouter().navTo(`${this.getViewModel().getProperty('/routeName')}-detail`, { oDataKey: 'N' });
      },

      formatNumber(vNum = '0') {
        return !vNum ? '0' : vNum;
      },

      formatPay(vPay = '0') {
        return vPay;
      },

      async onSearch() {
        const oListModel = this.getViewModel();
        const oModel = this.getModel(ServiceNames.PAY);

        try {
          oListModel.setProperty('/busy', true);

          const mSearch = oListModel.getProperty('/searchDate');
          const mPayLoad = {
            Apbeg: moment(mSearch.secondDate).hours(9).toDate(),
            Apend: moment(mSearch.date).hours(9).toDate(),
            Menid: this.getCurrentMenuId(),
            Pernr: this.getAppointeeProperty('Pernr'),
          };
          // 중도인출 List
          const aTableList = await Client.getEntitySet(oModel, 'MidWithdraw', mPayLoad);
          const oTable = this.byId('withdrawTable');

          oListModel.setProperty('/listInfo', TableUtils.count({ oTable, aRowData: aTableList }));
          oListModel.setProperty('/listInfo/isShowProgress', false);
          oListModel.setProperty('/listInfo/isShowApply', true);
          oListModel.setProperty('/listInfo/isShowApprove', false);
          oListModel.setProperty('/listInfo/isShowReject', true);
          oListModel.setProperty('/listInfo/isShowComplete', true);
          oListModel.setProperty('/List', aTableList);

          // 나의 중도인출
          const mMyTotal = this.withDrawCalculat(aTableList);

          oListModel.setProperty('/Total', mMyTotal);
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oListModel.setProperty('/busy', false);
        }
      },

      onSelectRow(oEvent) {
        const vPath = oEvent.getParameters().rowBindingContext.getPath();
        const oListModel = this.getViewModel();
        const oRowData = oListModel.getProperty(vPath);
        const sRouteName = oListModel.getProperty('/routeName');

        oListModel.setProperty('/parameter', oRowData);
        this.getRouter().navTo(`${sRouteName}-detail`, { oDataKey: oRowData.Appno });
      },

      onPressExcelDownload() {
        const oTable = this.byId('withdrawTable');
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_24001');

        TableUtils.export({ oTable, sFileName });
      },
    });
  }
);
