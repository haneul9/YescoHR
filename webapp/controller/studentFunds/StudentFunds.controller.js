sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/json/JSONModel',
    '../../model/formatter',
    'sap/ui/yesco/common/EmpInfo',
    '../BaseController',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/AttachFileAction',
    'sap/ui/yesco/common/TableUtils',
  ],
  (
    // prettier 방지용 주석
    JSONModel,
    formatter,
    EmpInfo,
    BaseController,
    ServiceNames,
    AttachFileAction,
    TableUtils
  ) => {
    'use strict';

    class StudentFunds extends BaseController {
      constructor() {
        super();
        this.formatter = formatter;
        this.AttachFileAction = AttachFileAction;
        this.TableUtils = TableUtils;
        this.TYPE_CODE = 'HR02';
      }

      onBeforeShow() {
        const dDate = new Date();
        const oViewModel = new JSONModel({
          busy: false,
          Data: [],
          searchDate: {
            date: dDate,
            secondDate: new Date(dDate.getFullYear(), dDate.getMonth() - 1, dDate.getDate() + 1),
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
        });
        this.setViewModel(oViewModel);

        EmpInfo.get.call(this, true);
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
        const oListModel = this.getViewModel();
        const oSearchDate = oListModel.getProperty("/searchDate");
        const dDate = moment(oSearchDate.secondDate).hours(10).toDate();
        const dDate2 = moment(oSearchDate.date).hours(10).toDate();

        oListModel.setProperty('/busy', true);

        oModel.read('/SchExpenseApplSet', {
          filters: [
            new sap.ui.model.Filter('Prcty', sap.ui.model.FilterOperator.EQ, 'L'),
            new sap.ui.model.Filter('Actty', sap.ui.model.FilterOperator.EQ, 'E'),
            new sap.ui.model.Filter('Apbeg', sap.ui.model.FilterOperator.EQ, dDate),
            new sap.ui.model.Filter('Apend', sap.ui.model.FilterOperator.EQ, dDate2),
          ],
          success: (oData) => {
            if (oData) {
              // Common.log(oData);
              const oList = oData.results;

              TableUtils.count.call(this, oList);
              oListModel.setProperty('/StudentList', oList);
              this.byId('studentTable').setVisibleRowCount(oList.length);
              oListModel.setProperty('/busy', false);
            }
          },
          error: (oRespnse) => {
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

      onPressExcelDownload() {
        const oTable = this.byId('studentTable');
        const mTableData = this.getViewModel().getProperty('/StudentList');
        const sFileName = this.getBundleText('LABEL_00282', '학자금 신청');

        TableUtils.export({ oTable, mTableData, sFileName });
      }
    }

    return StudentFunds;
  }
);
