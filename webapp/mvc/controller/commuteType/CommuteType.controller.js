sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/AttachFileAction',
    'sap/ui/yesco/common/FragmentEvent',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/TextUtils',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/exceptions/ODataReadError',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/model/type/Date',
  ],
  (
    // prettier 방지용 주석
    MessageBox,
    AppUtils,
    AttachFileAction,
    FragmentEvent,
    TableUtils,
    TextUtils,
    ServiceNames,
    ODataReadError,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.commuteType.CommuteType', {
      AttachFileAction: AttachFileAction,
      TableUtils: TableUtils,
      TextUtils: TextUtils,
      FragmentEvent: FragmentEvent,

      initializeModel() {
        return {
          busy: false,
          Data: [],
          MyCom: {},
          SelectedRow: {},
          searchDate: {
            date: moment().hours(9).toDate(),
            secondDate: moment().subtract(1, 'month').add(1, 'day').hours(9).toDate(),
          },
          listInfo: {
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

      onObjectMatched() {
        this.onSearch();
        this.totalCount();
      },

      onClick() {
        const oViewModel = this.getViewModel();
        const mSelectRow = oViewModel.getProperty('/SelectedRow');

        if (!_.isEmpty(mSelectRow) && mSelectRow.ZappStatAl !== '60') {
          MessageBox.alert(this.getBundleText('MSG_05017'));
          return;
        } else if (!_.isEmpty(mSelectRow) && mSelectRow.ZappStatAl === '60') {
          oViewModel.setProperty('/parameter', mSelectRow);
        } else {
          oViewModel.setProperty('/parameter', '');
        }

        this.getRouter().navTo('commuteType-detail', { oDataKey: 'N' });
      },

      // override AttachFileCode
      getApprovalType() {
        return 'HR03';
      },

      formatNumber(vNum = '0') {
        return vNum;
      },

      formatPay(vPay = '0') {
        return this.TextUtils.toCurrency(vPay) || '0';
      },

      thisYear(sYear = String(moment().format('YYYY'))) {
        return this.getBundleText('MSG_03012', sYear);
      },

      // table 체크박스
      onRowSelection(oEvent) {
        const oViewModel = this.getViewModel();
        const oEventSource = oEvent.getSource();
        const iSelectedIndex = oEventSource.getSelectedIndex();

        oEventSource.setSelectedIndex(iSelectedIndex);
        oViewModel.setProperty('/SelectedRow', oViewModel.getProperty(`/CommuteList/${iSelectedIndex}`));
      },

      onSearch() {
        const oModel = this.getModel(ServiceNames.PA);
        const oListModel = this.getViewModel();
        const oTable = this.byId('commuteTable');
        const oSearchDate = oListModel.getProperty('/searchDate');
        const dDate = moment(oSearchDate.secondDate).hours(9).toDate();
        const dDate2 = moment(oSearchDate.date).hours(9).toDate();

        oListModel.setProperty('/busy', true);

        oModel.read('/FamilyInfoApplSet', {
          filters: [new sap.ui.model.Filter('Prcty', sap.ui.model.FilterOperator.EQ, 'L'), new sap.ui.model.Filter('Begda', sap.ui.model.FilterOperator.EQ, dDate), new sap.ui.model.Filter('Endda', sap.ui.model.FilterOperator.EQ, dDate2)],
          success: (oData) => {
            if (oData) {
              const oList = oData.results;

              oListModel.setProperty('/CommuteList', oList);
              oListModel.setProperty('/listInfo', TableUtils.count({ oTable, aRowData: oList }));
              oListModel.setProperty('/busy', false);
            }
          },
          error: (oError) => {
            AppUtils.handleError(new ODataReadError(oError));
            oListModel.setProperty('/busy', false);
          },
        });
      },

      totalCount() {
        const oModel = this.getModel(ServiceNames.PA);
        const oListModel = this.getViewModel();

        oModel.read('/FamInfoSummarySet', {
          filters: [],
          success: (oData) => {
            if (oData) {
              const oList = oData.results[0];

              oListModel.setProperty('/MyCom', oList);
            }
          },
          error: (oError) => {
            AppUtils.handleError(new ODataReadError(oError));
          },
        });
      },

      onSelectRow(oEvent) {
        const vPath = oEvent.getParameters().rowBindingContext.getPath();
        const oListModel = this.getViewModel();
        const oRowData = oListModel.getProperty(vPath);

        oListModel.setProperty('/parameter', oRowData);
        this.getRouter().navTo('commuteType-detail', { oDataKey: oRowData.Appno });
      },

      onPressExcelDownload() {
        const oTable = this.byId('commuteTable');
        const aTableData = this.getViewModel().getProperty('/CommuteList');
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_05001');

        TableUtils.export({ oTable, aTableData, sFileName });
      },
    });
  }
);
