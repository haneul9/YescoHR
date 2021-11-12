sap.ui.define(
  [
    'sap/ui/model/json/JSONModel',
    '../../model/formatter',
    'sap/ui/yesco/common/EmpInfo',
    '../BaseController',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/AttachFileAction',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/extension/moment',
  ],
  (JSONModel, formatter, EmpInfo, BaseController, ServiceNames, AttachFileAction, TableUtils) => {
    'use strict';

    class StudentFunds extends BaseController {
      constructor() {
        super();
        this.formatter = formatter;
        this.AttachFileAction = AttachFileAction;
        this.TableUtils = TableUtils;
        this.TYPE_CODE = 'HR01';
      }

      onBeforeShow() {
        const oViewModel = new JSONModel({
          busy: false,
          Data: [],
          listinfo: {
            rowCount: 1,
            totalCount: 0,
            progressCount: 0,
            applyCount: 0,
            approveCount: 0,
            rejectCount: 0,
            completeCount: 0,
          },
        });
        this.setViewModel(oViewModel);

        EmpInfo.get.call(this, true);

        const oSearchDate = this.byId('SearchDate');
        const dDate = moment(new Date()).hours(10).toDate();
        const dDate2 = moment(new Date(dDate.getFullYear(), dDate.getMonth() - 1, dDate.getDate() + 1))
          .hours(10)
          .toDate();

        oSearchDate.setDateValue(dDate2);
        oSearchDate.setSecondDateValue(dDate);
      }

      onAfterShow() {
        this.onSearch();
        super.onAfterShow();
      }

      onClick() {
        this.getRouter().navTo('studentFunds-detail', { oDataKey: 'N' });
      }

      onExelDownload() {
        const oTable = this.byId('studentTable');
        const mTableData = this.getViewModel().getProperty('/StudentList');
        const sFileName = '학자금신청_목록';

        TableUtils.export({ oTable, mTableData, sFileName });
      }

      formatNumber(vNum) {
        if (!vNum || vNum === '') return '0';

        return vNum;
      }

      onSearch() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oSearchDate = this.byId('SearchDate');
        const oListModel = this.getViewModel();
        const oController = this;

        oListModel.setProperty('/busy', true);

        oModel.read('/SchExpenseApplSet', {
          filters: [
            new sap.ui.model.Filter('Prcty', sap.ui.model.FilterOperator.EQ, 'L'),
            new sap.ui.model.Filter('Actty', sap.ui.model.FilterOperator.EQ, 'E'),
            new sap.ui.model.Filter('Apbeg', sap.ui.model.FilterOperator.EQ, oSearchDate.getDateValue()),
            new sap.ui.model.Filter('Apend', sap.ui.model.FilterOperator.EQ, oSearchDate.getSecondDateValue()),
          ],
          success: function (oData) {
            if (oData) {
              // Common.log(oData);
              const oList = oData.results;

              TableUtils.count.call(oController, oList);
              oListModel.setProperty('/StudentList', oList);
              oController.byId('studentTable').setVisibleRowCount(oList.length);
              oListModel.setProperty('/busy', false);
            }
          },
          error: function (oRespnse) {
            // Common.log(oResponse);
            oListModel.setProperty('/busy', false);
          },
        });
      }

      onSelectRow(oEvent) {
        const vPath = oEvent.getParameters().rowBindingContext.getPath();
        const oRowData = this.getViewModel().getProperty(vPath);

        this.getRouter().navTo('studentFunds-detail', { oDataKey: oRowData.Appno });
      }
    }

    return StudentFunds;
  }
);
